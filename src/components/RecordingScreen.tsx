"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Square } from "lucide-react";

interface RecordingScreenProps {
  onStop: (audioBlob: Blob) => void;
}

export default function RecordingScreen({ onStop }: RecordingScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState<"requesting" | "recording" | "error">("requesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    chunksRef.current = [];
    setStatus("requesting");
    setErrorMessage(null);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.start(500);
        setStatus("recording");
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err?.message || "Microphone access denied.");
        }
      });

    return () => {
      cancelled = true;
      mediaRecorderRef.current?.state === "recording" && mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const handleStop = useCallback(() => {
    const mr = mediaRecorderRef.current;
    const stream = streamRef.current;
    if (mr?.state === "recording") {
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        stream?.getTracks().forEach((t) => t.stop());
        onStop(blob);
      };
      mr.stop();
    } else if (status === "error") {
      onStop(new Blob()); // no blob; caller can handle
    }
  }, [onStop, status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (status === "error") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="card border-rose-500/30 bg-rose-500/10">
          <p className="text-rose-300">{errorMessage}</p>
          <p className="mt-2 text-sm text-gray-400">Allow microphone access and try again, or upload an audio file from the home screen.</p>
        </div>
        <button
          type="button"
          onClick={() => onStop(new Blob())}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-gray-300 hover:bg-white/10"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent-coral/20 px-4 py-2 text-accent-coral animate-pulse-soft">
          <span className="h-2 w-2 rounded-full bg-accent-coral" />
          Recording in Progress
        </div>
        <p className="text-3xl font-semibold text-white tabular-nums">
          {formatTime(seconds)}
        </p>
        {status === "requesting" && (
          <p className="mt-2 text-sm text-gray-400">Requesting microphone…</p>
        )}
      </div>

      <div className="card min-h-[120px]">
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
          Live recording
        </p>
        <p className="mt-3 text-gray-400">
          Stop recording to transcribe and save. Transcription is done when you stop.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleStop}
          disabled={status !== "recording"}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent-coral px-8 py-4 font-semibold text-white shadow-glow-red transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          <Square className="h-5 w-5 fill-current" />
          Stop Recording
        </button>
      </div>
    </div>
  );
}
