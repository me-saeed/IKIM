export interface Chat {
  id: string;
  preview: string;
  transcription: string;
  createdAt: number;
  summary?: string | null;
  sentiment?: string | null;
}

export function makePreview(transcription: string, maxLength = 60): string {
  const trimmed = transcription.trim();
  if (!trimmed) return "Empty recording";
  return trimmed.length <= maxLength
    ? trimmed
    : trimmed.slice(0, maxLength).trim() + "…";
}
