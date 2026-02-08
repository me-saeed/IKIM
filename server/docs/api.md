# API reference

Base URL: `http://localhost:4000/api` (or your server URL).

---

## Health

### GET /api/health

No body.

**Response:** `200`  
```json
{ "ok": true }
```

---

## Chats

### GET /api/chats

List chats, newest first.

**Query:**  
- `limit` (optional) – number, default 50, max 100.

**Response:** `200`  
```json
[
  {
    "id": "uuid",
    "preview": "First 60 chars of transcription...",
    "transcription": "Full text.",
    "created_at": "2025-02-08T12:00:00.000Z"
  }
]
```

**Errors:**  
- `502` – Supabase error (body has `error`).  
- `503` – Database not configured (`SUPABASE_URL` / key missing).

---

### GET /api/chats/:id

Get one chat by id.

**Response:** `200` – same shape as one element in the list above.

**Errors:**  
- `404` – Chat not found.  
- `502` / `503` – as above.

---

### POST /api/chats

Create a chat (e.g. after transcription).

**Body (JSON):**  
```json
{ "transcription": "Full transcription text." }
```

**Response:** `201`  
```json
{
  "id": "uuid",
  "preview": "First 60 chars...",
  "transcription": "Full text.",
  "created_at": "2025-02-08T12:00:00.000Z"
}
```

**Errors:**  
- `400` – Missing or invalid `transcription` (must be a string).  
- `502` / `503` – as above.

---

### DELETE /api/chats/:id

Delete a chat and its cached summary, sentiment, and translations (cascade).

**Response:** `204` No Content on success.

**Errors:**  
- `404` – Chat not found.  
- `502` / `503` – Database error.

---

### POST /api/chats/:id/summary

Generate (or return cached) summary for a chat’s transcription using GPT.

**Rate limit:** Stricter (e.g. 20 per 15 min per IP).

**Response:** `200`  
```json
{ "summary": "A few sentences summarizing the transcription." }
```

- If a summary already exists in `chat_summaries` for this chat, it is returned without calling GPT.
- Otherwise GPT is called, the result is stored in `chat_summaries`, and returned.

**Errors:**  
- `404` – Chat not found.  
- `429` – Rate limit exceeded.  
- `502` – OpenAI error.  
- `503` – Database or OpenAI not configured.

---

### POST /api/chats/:id/sentiment

Analyze sentiment of a chat’s transcription using GPT (or return cached).

**Rate limit:** Stricter (e.g. 20 per 15 min per IP).

**Response:** `200`  
```json
{ "sentiment": "Overall sentiment: positive. Tone: professional. Tags: informative, clear, confident." }
```

- If a result exists in `chat_sentiments` for this chat, it is returned without calling GPT.
- Otherwise GPT is called with a prompt for overall sentiment (positive/neutral/negative), tone, and 2–3 tags; result is stored and returned.

**Errors:**  
- `404` – Chat not found.  
- `429` – Rate limit exceeded.  
- `502` – OpenAI error.  
- `503` – Database or OpenAI not configured.

---

### POST /api/chats/:id/translate

Translate a chat’s transcription to a target language using GPT (or return cached).

**Rate limit:** Stricter (e.g. 20 per 15 min per IP).

**Body (JSON):**  
```json
{ "fromLang": "en", "toLang": "es" }
```
- `toLang` (required) – ISO language code, e.g. `es`, `fr`, `de`.
- `fromLang` (optional) – default `en`.

**Response:** `200`  
```json
{
  "translatedText": "Translated content...",
  "fromLang": "en",
  "toLang": "es"
}
```

- If a translation for this chat and `toLang` exists in `chat_translations`, it is returned without calling GPT.
- Otherwise GPT is called, result is stored in `chat_translations`, and returned.

**Errors:**  
- `400` – Missing `toLang` or `fromLang` equals `toLang`.  
- `404` – Chat not found.  
- `429` – Rate limit exceeded.  
- `502` – OpenAI error.  
- `503` – Database or OpenAI not configured.

---

## Transcription (Whisper)

### POST /api/transcribe

Transcribe an audio file using OpenAI Whisper.

**Request:**  
- **Content-Type:** `multipart/form-data`.  
- **Field name:** `audio` (one file).  
- **Formats:** e.g. mp3, mp4, m4a, webm, wav, ogg (see allowed `audio/*` types).

**Limits:**  
- Max file size: **25 MB**.  
- Rate limit: stricter (e.g. 20 requests per 15 minutes per IP).

**Response:** `200`  
```json
{ "transcription": "Transcribed text from the audio." }
```

**Errors:**  
- `400` – No file, wrong field name, invalid type, or file too large.  
- `429` – Rate limit exceeded or OpenAI rate limit.  
- `502` – OpenAI/Whisper error.  
- `503` – `OPENAI_API_KEY` not set.

**Example (curl):**  
```bash
curl -X POST http://localhost:4000/api/transcribe \
  -F "audio=@recording.webm"
```
