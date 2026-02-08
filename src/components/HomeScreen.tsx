"use client";

import { Mic, Upload, FileText, Smile, Languages } from "lucide-react";

interface HomeScreenProps {
  onStartRecording: () => void;
  onUploadRecording: (file: File) => void;
  onInvalidFile?: (message: string) => void;
}

export default function HomeScreen({
  onStartRecording,
  onUploadRecording,
  onInvalidFile,
}: HomeScreenProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("audio/")) {
      onUploadRecording(file);
    } else {
      onInvalidFile?.("Please choose an audio file (e.g. MP3, WAV, WebM).");
    }
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-2xl space-y-12 px-4 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          IKIM <span className="text-accent-teal">Voice</span>
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          Record or upload dictation. Get transcription, summary, sentiment & translation.
        </p>
      </div>

      {/* Main actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onStartRecording}
          className="btn-primary group"
        >
          <Mic className="h-6 w-6 transition-transform group-hover:scale-110" />
          Start Recording
        </button>
        <label className="btn-secondary cursor-pointer">
          <Upload className="h-6 w-6" />
          Upload Recording
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Feature icons */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <FileText className="h-7 w-7 text-accent-teal" />
          </div>
          <span className="text-sm font-medium">Summary</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Smile className="h-7 w-7 text-accent-gold" />
          </div>
          <span className="text-sm font-medium">Sentiment</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Languages className="h-7 w-7 text-brand-400" />
          </div>
          <span className="text-sm font-medium">Translation</span>
        </div>
      </div>
    </div>
  );
}
