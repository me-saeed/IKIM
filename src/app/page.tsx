"use client";

import { useState, useCallback, useEffect } from "react";
import HomeScreen from "@/components/HomeScreen";
import RecordingScreen from "@/components/RecordingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ChatSidebar from "@/components/ChatSidebar";
import type { Chat } from "@/types/chat";
import { getChats, createChat, transcribe, deleteChat } from "@/lib/api";

type View = "home" | "recording" | "results";

export default function Page() {
  const [view, setView] = useState<View>("home");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentChat = currentChatId ? chats.find((c) => c.id === currentChatId) : null;
  const transcription = currentChat?.transcription ?? "";

  useEffect(() => {
    setLoadingChats(true);
    getChats()
      .then(setChats)
      .catch(() => setChats([]))
      .finally(() => setLoadingChats(false));
  }, []);

  const handleStartRecording = () => {
    setError(null);
    setView("recording");
  };

  const processTranscription = useCallback(async (text: string) => {
    setError(null);
    setLoading(true);
    try {
      const newChat = await createChat(text);
      setChats((prev) => [...prev, newChat]);
      setCurrentChatId(newChat.id);
      setView("results");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save chat.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUploadRecording = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        const text = await transcribe(file, file.name);
        await processTranscription(text || "(No speech detected)");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transcription failed.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [processTranscription]
  );

  const handleStopRecording = useCallback(
    async (blob: Blob) => {
      if (blob.size === 0) {
        setView("home");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const text = await transcribe(blob);
        await processTranscription(text || "(No speech detected)");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Transcription failed.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [processTranscription]
  );

  const handleBack = () => {
    setView("home");
    setCurrentChatId(null);
    setError(null);
  };

  const handleNewChat = () => {
    setView("home");
    setCurrentChatId(null);
    setError(null);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setView("results");
    setError(null);
  };

  const handleDeleteChat = useCallback(async (chatId: string) => {
    setError(null);
    setDeletingChatId(chatId);
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setView("home");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete chat.");
    } finally {
      setDeletingChatId(null);
    }
  }, [currentChatId]);

  return (
    <div className="flex min-h-screen">
      <ChatSidebar
        chats={chats}
        loadingChats={loadingChats}
        deletingChatId={deletingChatId}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />
      <main className="min-h-screen flex-1 pt-12 lg:pt-0">
        {error && (
          <div className="mx-4 mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
            {error.includes("429") && " Wait a moment and try again."}
          </div>
        )}
        {loading && (
          <div className="mx-4 mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
            Processing…
          </div>
        )}
        {view === "home" && (
          <HomeScreen
            onStartRecording={handleStartRecording}
            onUploadRecording={handleUploadRecording}
            onInvalidFile={(msg) => setError(msg)}
          />
        )}
        {view === "recording" && (
          <RecordingScreen onStop={handleStopRecording} />
        )}
        {view === "results" && currentChatId && (
          <ResultsScreen
            chatId={currentChatId}
            transcription={transcription}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  );
}
