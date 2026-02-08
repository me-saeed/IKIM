# Database schema (Prisma + Supabase Postgres)

The server uses **Prisma ORM**. The schema is defined in `../prisma/schema.prisma`. Apply it with:

```bash
npx prisma generate
npx prisma db push
```

The SQL in `../supabase/schema.sql` is for reference or if you create tables manually in the Supabase SQL Editor.

## Tables

### `chats`

| Column          | Type      | Description                          |
|-----------------|-----------|--------------------------------------|
| `id`            | uuid      | Primary key, default `gen_random_uuid()` |
| `user_id`       | uuid      | Nullable; for future auth            |
| `preview`       | text      | Short preview for sidebar (e.g. first 60 chars) |
| `transcription` | text      | Full transcription                   |
| `created_at`    | timestamptz | Default `now()`                    |

### `chat_summaries` (optional cache)

| Column       | Type      | Description        |
|--------------|-----------|--------------------|
| `id`         | uuid      | Primary key        |
| `chat_id`    | uuid      | FK → `chats.id`    |
| `summary`    | text      | AI-generated summary |
| `created_at` | timestamptz | Default `now()`  |

One row per chat (`unique(chat_id)`).

### `chat_sentiments` (optional cache)

| Column       | Type      | Description        |
|--------------|-----------|--------------------|
| `id`         | uuid      | Primary key        |
| `chat_id`    | uuid      | FK → `chats.id`    |
| `sentiment`  | text      | AI sentiment result (or JSON) |
| `created_at` | timestamptz | Default `now()`  |

One row per chat (`unique(chat_id)`).

### `chat_translations` (optional cache)

| Column          | Type      | Description        |
|-----------------|-----------|--------------------|
| `id`            | uuid      | Primary key        |
| `chat_id`       | uuid      | FK → `chats.id`    |
| `target_lang`   | text      | e.g. `es`, `fr`    |
| `translated_text` | text    | Translated content |
| `created_at`    | timestamptz | Default `now()`  |

One row per chat per target language (`unique(chat_id, target_lang)`).

## RLS

Row Level Security is enabled with permissive policies so the backend (anon or service role key) can read/write. Tighten policies when you add auth (e.g. filter by `user_id`).
