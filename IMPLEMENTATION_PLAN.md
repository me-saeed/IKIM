# IKIM Voice – Backend Implementation Plan

This document splits the backend into **parts** so you can implement step by step. Stack: **Node.js + Express**, **OpenAI API** (GPT + Whisper), **Supabase (SQL)**, **rate limiting**. All secrets go in `.env`.

---

## Overview

| Item | Choice |
|------|--------|
| Server | Express.js (in `server/` folder) |
| Database | Supabase (PostgreSQL) |
| AI / Transcription | OpenAI API (Whisper for audio → text, GPT for summary/sentiment/translation) |
| Security | Rate limiter (e.g. `express-rate-limit`) |
| Secrets | `.env` (never commit; add `.env` to `.gitignore`) |

---

## Environment Variables (`.env`)

Create a `.env` file in the **project root** (or in `server/` if you run the server from there). Add to `.gitignore` if not already.

```env
# Server
PORT=4000
NODE_ENV=development

# OpenAI (GPT + Whisper)
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
# Optional, for admin/server-side writes:
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

You will put your real keys in `.env`; the plan only references these names.

---

## Part 1: Project structure and Express server

**Goal:** Have a running Express app under `server/` with health check and env loading.

1. Create folder structure:
   ```
   server/
   ├── package.json
   ├── .env.example
   ├── index.js          (or app.js – entry point)
   ├── config/
   │   └── env.js        (load and validate env vars)
   ├── middleware/
   │   └── rateLimiter.js
   ├── routes/
   │   └── index.js      (mount routes, e.g. /api/health)
   └── services/        (optional, for now empty or placeholder)
   ```

2. In `server/`:
   - `npm init -y`
   - Install: `express`, `dotenv`, `cors`, `express-rate-limit`
   - Entry point: load `dotenv`, create Express app, use `cors`, mount routes, listen on `process.env.PORT`.

3. Add a **health route** (e.g. `GET /api/health`) that returns `{ ok: true }` so you can confirm the server runs.

4. Document in the MD or README how to run the server (e.g. `node server/index.js` or `npm run server` from root).

**Deliverable:** `GET http://localhost:4000/api/health` returns 200 and `{ ok: true }`.

---

## Part 2: Rate limiter

**Goal:** Protect all API routes with a rate limiter.

1. In `server/middleware/rateLimiter.js`:
   - Use `express-rate-limit` (e.g. 100 requests per 15 minutes per IP, or stricter for expensive routes).
   - Export a middleware function and optionally a **stricter** limiter for heavy endpoints (e.g. `/api/transcribe`, `/api/chats/:id/summary`).

2. In your Express app:
   - Apply the **general** rate limiter to all `/api/*` routes (or globally).
   - Later, when you add transcription and GPT routes, apply the **stricter** limiter to those specific routes.

3. Optionally: add a simple **error handler** that returns 429 with a clear message when limit is exceeded.

**Deliverable:** After exceeding the limit, API returns 429 with a clear body/message.

---

## Part 3: Supabase setup and schema

**Goal:** Database and tables for “chats” and optional cached results.

1. Create a Supabase project and get:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (and optionally `SUPABASE_SERVICE_ROLE_KEY` for server-only writes).

2. Design **SQL schema** (run in Supabase SQL Editor). Suggested tables:

   **`chats`**
   - `id` – UUID, primary key, default `gen_random_uuid()`
   - `user_id` – nullable UUID (for future auth)
   - `preview` – text (short preview for sidebar)
   - `transcription` – text (full transcription)
   - `created_at` – timestamptz, default `now()`

   **Optional (for caching AI results):**
   - `chat_summaries` – `chat_id` (FK), `summary` text, `created_at`
   - `chat_sentiments` – `chat_id` (FK), `sentiment` text (or JSON), `created_at`
   - `chat_translations` – `chat_id` (FK), `target_lang` code, `translated_text` text, `created_at`

3. Enable Row Level Security (RLS) if you use Supabase from the client later; for server-only access you can use the service role key and bypass RLS from the backend.

4. Document the schema in this MD or a separate `server/docs/schema.md` (table names, columns, purpose).

**Deliverable:** Tables created in Supabase; env vars set; schema documented.

---

## Part 4: Supabase client in the server

**Goal:** Server can read/write Supabase from Node.

1. In `server/`:
   - Install `@supabase/supabase-js`.
   - In `server/config/` or `server/services/`, create a Supabase client using `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or service role key for server-only writes). Use a single module that reads from env and exports the client.

2. Add a simple **test route** (e.g. `GET /api/chats` that returns `[]` or the first 10 rows from `chats`). This verifies DB connection without changing the frontend yet.

**Deliverable:** Server starts without errors; test route returns data from `chats` (or empty array).

---

## Part 5: Chat CRUD APIs

**Goal:** Create and list chats in the DB; frontend can later call these instead of keeping chats only in memory.

1. **POST /api/chats**
   - Body: `{ transcription: string }` (or include `preview` or compute preview on server).
   - Generate `preview` from `transcription` (e.g. first 60 chars).
   - Insert into `chats` (id from DB or UUID), return `{ id, preview, transcription, created_at }`.

2. **GET /api/chats**
   - Query `chats` ordered by `created_at DESC`, limit (e.g. 50).
   - Return array of `{ id, preview, transcription, created_at }` (or minimal fields for list view).

3. **GET /api/chats/:id**
   - Return one chat by id or 404.

4. Use the Supabase client from Part 4; keep env-based config in one place.

**Deliverable:** Postman or curl can create a chat and list chats; GET by id works.

---

## Part 6: OpenAI client and transcription (Whisper)

**Goal:** Transcribe audio to text using OpenAI Whisper.

1. In `server/`:
   - Install `openai` (official SDK).
   - In `server/config/` or `server/services/`, create an OpenAI client from `OPENAI_API_KEY` (env).

2. **POST /api/transcribe**
   - Accept **multipart/form-data** with an `audio` file (or `file`).
   - Validate: file present, type audio/* (or allow only specific formats Whisper supports).
   - Call OpenAI Whisper API (e.g. `openai.audio.transcriptions.create({ file, model: 'whisper-1' })`).
   - Return `{ transcription: string }`.
   - Apply the **stricter** rate limiter to this route.
   - Optional: max file size limit (e.g. 25 MB for Whisper).

3. Document request/response format (and possible error codes) in this MD or in `server/docs/api.md`.

**Deliverable:** Sending an audio file to `POST /api/transcribe` returns the transcribed text.

---

## Part 7: Summary API (GPT)

**Goal:** Generate a summary for a chat’s transcription using GPT.

1. **POST /api/chats/:id/summary**
   - Load chat by `id` from Supabase (or return 404).
   - Optional: check `chat_summaries` for existing summary and return it (cache).
   - Build a short GPT prompt: “Summarize the following text in a few sentences: …” with the chat’s `transcription`.
   - Call OpenAI Chat Completions (e.g. `gpt-4o-mini` or `gpt-4o`); get one message content as summary.
   - Optional: store in `chat_summaries` and return.
   - Return `{ summary: string }`.
   - Apply stricter rate limiter.

**Deliverable:** Given a chat id, the endpoint returns a generated summary.

---

## Part 8: Sentiment analysis API (GPT)

**Goal:** Analyze sentiment of a chat’s transcription using GPT.

1. **POST /api/chats/:id/sentiment**
   - Load chat by `id` (404 if missing).
   - Optional: check `chat_sentiments` for cached result.
   - Prompt GPT to analyze sentiment (e.g. “Analyze the sentiment of this text. Return a short analysis: overall sentiment (positive/neutral/negative), tone, and 2–3 tags.”). Ask for structured or plain text.
   - Call Chat Completions; parse or return raw text.
   - Optional: store in `chat_sentiments` and return.
   - Return e.g. `{ sentiment: string }` or `{ sentiment, tone, tags }`.
   - Apply stricter rate limiter.

**Deliverable:** Given a chat id, the endpoint returns sentiment analysis.

---

## Part 9: Translation API (GPT)

**Goal:** Translate a chat’s transcription to a target language using GPT.

1. **POST /api/chats/:id/translate**
   - Body: `{ fromLang?: string, toLang: string }` (e.g. ISO codes: `en`, `es`). `fromLang` optional (can be inferred or default to `en`).
   - Load chat by `id` (404 if missing).
   - Optional: check `chat_translations` for same `toLang` and return cached.
   - Prompt GPT: “Translate the following text from [fromLang] to [toLang]. Return only the translated text.” Use the chat’s `transcription`.
   - Call Chat Completions; return translated text.
   - Optional: store in `chat_translations` (with `target_lang`) and return.
   - Return `{ translatedText: string, fromLang, toLang }`.
   - Apply stricter rate limiter.

**Deliverable:** Given a chat id and `toLang`, the endpoint returns translated text.

---

## Part 10: Wire frontend to backend

**Goal:** Next.js app uses real APIs instead of mocks.

1. **Base URL:** Use env in Next.js (e.g. `NEXT_PUBLIC_API_URL=http://localhost:4000`) so the frontend calls your Express server.

2. **Transcription:**
   - On “Stop recording”: send recorded audio blob to `POST /api/transcribe`, get `transcription`.
   - On “Upload recording”: send file to `POST /api/transcribe`, get `transcription`. Then create chat (see below).

3. **Chats:**
   - After getting transcription (record or upload), call `POST /api/chats` with `{ transcription }`, get `{ id, preview, transcription, created_at }`. Use this as the new chat and show results.
   - On app load (or when opening sidebar), call `GET /api/chats` and set chat list state.
   - When user selects a chat from sidebar, call `GET /api/chats/:id` if needed and show that chat’s transcription and actions.

4. **Summary:** When user clicks “Generate Summary”, call `POST /api/chats/:id/summary`, show result in modal/section.

5. **Sentiment:** When user clicks “Analyze Sentiment”, call `POST /api/chats/:id/sentiment`, show result.

6. **Translation:** When user picks “Translate from” / “Translate to” and clicks Translate, call `POST /api/chats/:id/translate` with `{ toLang, fromLang }`, show result.

7. **Errors:** Handle 429 (rate limit), 4xx/5xx, and show a simple message or toast in the UI.

**Deliverable:** Full flow works with real backend: record/upload → transcribe → create chat → list chats → summary, sentiment, translate.

---

## Part 11: Optional improvements

- **Auth:** Add simple auth (e.g. Supabase Auth or JWT); store `user_id` in `chats` and filter `GET /api/chats` by user.
- **Persistence of AI results:** Always cache summary/sentiment/translation in DB and return cached when available.
- **File size and validation:** Enforce max size and file type for upload/transcribe.
- **API docs:** Keep a short `server/docs/api.md` with routes, request/response shapes, and env vars.

---

## Summary checklist

| Part | Description |
|------|-------------|
| 1 | Express server + folder structure + health route |
| 2 | Rate limiter (general + strict for heavy routes) |
| 3 | Supabase project + SQL schema (chats, optional cache tables) |
| 4 | Supabase client in server + test route |
| 5 | Chat CRUD: POST/GET /api/chats, GET /api/chats/:id |
| 6 | OpenAI client + POST /api/transcribe (Whisper) |
| 7 | POST /api/chats/:id/summary (GPT) |
| 8 | POST /api/chats/:id/sentiment (GPT) |
| 9 | POST /api/chats/:id/translate (GPT) |
| 10 | Frontend wired to all APIs |
| 11 | Optional: auth, caching, validation, docs |

---

## Where to put keys

- **All secrets** (OpenAI, Supabase, etc.) go in a **`.env`** file.
- **Do not** commit `.env`; ensure `.env` is in `.gitignore`.
- Use a **`.env.example`** (no real values) so others know which variables are required.

You can implement in the order above and test each part before moving to the next.
