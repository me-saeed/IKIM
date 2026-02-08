# IKIM Voice

Demo full-stack **clinical dictation** app: record or upload audio → transcription (Whisper), summary, sentiment, and translation (GPT). Built as a prototype aligned with IKIM’s dictation and AI-in-medicine stack.

## Features

- **Home** – Start recording (mic) or upload an audio file
- **Recording** – Live recording, timer, stop → send to API
- **Results** – Transcription plus Summary, Sentiment, and Translation (stored in DB; GPT only when missing)
- **Sidebar** – Chat list, switch chats (data from DB), delete

## Run locally

**Frontend (Next.js):**
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

**Backend (Express API):**
```bash
cd server
npm install
npm start
```
API at [http://localhost:4000](http://localhost:4000). Health: `GET /api/health`. Copy `server/.env.example` to `server/.env` and set `OPENAI_API_KEY`, `DATABASE_URL`, `DIRECT_URL`.

## Build

```bash
npm run build
npm start
```

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express, Prisma
- **Database:** PostgreSQL (Supabase)
- **AI:** OpenAI Whisper (transcription), GPT (summary, sentiment, translation)

API reference: `server/docs/api.md`
