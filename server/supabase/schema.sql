-- IKIM Voice – Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- Chats: one row per recording/session (transcription + preview for sidebar)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  preview text not null default '',
  transcription text not null default '',
  created_at timestamptz not null default now()
);

-- Optional: cache AI-generated summary per chat
create table if not exists public.chat_summaries (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now(),
  unique(chat_id)
);

-- Optional: cache sentiment analysis per chat
create table if not exists public.chat_sentiments (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sentiment text not null,
  created_at timestamptz not null default now(),
  unique(chat_id)
);

-- Optional: cache translations per chat and target language
create table if not exists public.chat_translations (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  target_lang text not null,
  translated_text text not null,
  created_at timestamptz not null default now(),
  unique(chat_id, target_lang)
);

-- Indexes for common queries
create index if not exists idx_chats_created_at on public.chats(created_at desc);
create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_chat_summaries_chat_id on public.chat_summaries(chat_id);
create index if not exists idx_chat_sentiments_chat_id on public.chat_sentiments(chat_id);
create index if not exists idx_chat_translations_chat_id on public.chat_translations(chat_id);

-- RLS: enable but allow all for now (server uses service role or anon key).
-- Restrict by user_id later when you add auth.
alter table public.chats enable row level security;
alter table public.chat_summaries enable row level security;
alter table public.chat_sentiments enable row level security;
alter table public.chat_translations enable row level security;

create policy "Allow all for chats" on public.chats for all using (true) with check (true);
create policy "Allow all for chat_summaries" on public.chat_summaries for all using (true) with check (true);
create policy "Allow all for chat_sentiments" on public.chat_sentiments for all using (true) with check (true);
create policy "Allow all for chat_translations" on public.chat_translations for all using (true) with check (true);
