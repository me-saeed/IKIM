import type { Chat } from "@/types/chat";

const DEFAULT_API_BASE = "http://localhost:4000";

function getBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!env) return DEFAULT_API_BASE;
  if (env.startsWith("http://") || env.startsWith("https://")) return env.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const bodyMsg = (data as { error?: string })?.error;
    const msg =
      bodyMsg ||
      (res.status === 404
        ? "Chat not found or backend unavailable. Make sure the API server is running at " + getBase()
        : res.statusText || "Request failed");
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

function chatFromApi(c: {
  id: string;
  preview: string;
  transcription: string;
  createdAt: string;
  summary?: string | null;
  sentiment?: string | null;
}): Chat {
  return {
    id: c.id,
    preview: c.preview,
    transcription: c.transcription,
    createdAt: new Date(c.createdAt).getTime(),
    summary: c.summary ?? undefined,
    sentiment: c.sentiment ?? undefined,
  };
}

export async function getChats(limit = 50): Promise<Chat[]> {
  const res = await fetch(`${getBase()}/api/chats?limit=${limit}`);
  const list = await handleRes<Array<{ id: string; preview: string; transcription: string; createdAt: string }>>(res);
  return list.map(chatFromApi);
}

export async function getChat(id: string): Promise<Chat> {
  const res = await fetch(`${getBase()}/api/chats/${id}`);
  const c = await handleRes<{
    id: string;
    preview: string;
    transcription: string;
    createdAt: string;
    summary?: string | null;
    sentiment?: string | null;
  }>(res);
  return chatFromApi(c);
}

export async function createChat(transcription: string): Promise<Chat> {
  const res = await fetch(`${getBase()}/api/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcription }),
  });
  const c = await handleRes<{ id: string; preview: string; transcription: string; createdAt: string }>(res);
  return chatFromApi(c);
}

export async function deleteChat(id: string): Promise<void> {
  const res = await fetch(`${getBase()}/api/chats/${id}`, { method: "DELETE" });
  if (res.status === 204) return;
  await handleRes<{ error?: string }>(res);
}

export async function transcribe(file: File | Blob, filename = "audio.webm"): Promise<string> {
  const form = new FormData();
  form.append("audio", file instanceof File ? file : new File([file], filename, { type: file.type || "audio/webm" }));
  const res = await fetch(`${getBase()}/api/transcribe`, { method: "POST", body: form });
  const data = await handleRes<{ transcription: string }>(res);
  return data.transcription ?? "";
}

export async function getSummary(chatId: string): Promise<string> {
  const res = await fetch(`${getBase()}/api/chats/${chatId}/summary`, { method: "POST" });
  const data = await handleRes<{ summary: string }>(res);
  return data.summary ?? "";
}

export async function getSentiment(chatId: string): Promise<string> {
  const res = await fetch(`${getBase()}/api/chats/${chatId}/sentiment`, { method: "POST" });
  const data = await handleRes<{ sentiment: string }>(res);
  return data.sentiment ?? "";
}

export async function getTranslation(chatId: string, fromLang: string, toLang: string): Promise<string> {
  const res = await fetch(`${getBase()}/api/chats/${chatId}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromLang, toLang }),
  });
  const data = await handleRes<{ translatedText: string }>(res);
  return data.translatedText ?? "";
}
