"use client";

import { useState, useEffect } from "react";
import { FileText, Smile, Languages, ArrowLeft, ArrowRightLeft, Loader2, ChevronRight } from "lucide-react";
import ResultModal from "./ResultModal";
import { getChat, getSummary, getSentiment, getTranslation } from "@/lib/api";

interface ResultsScreenProps {
  chatId: string;
  transcription: string;
  onBack: () => void;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "hi", name: "Hindi" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
] as const;

function getToneFromSentiment(text: string): { label: string; color: string; bg: string } {
  const lower = text.toLowerCase();
  if (lower.includes("positive")) return { label: "Positive", color: "text-emerald-400", bg: "bg-emerald-500/20" };
  if (lower.includes("negative")) return { label: "Negative", color: "text-rose-400", bg: "bg-rose-500/20" };
  return { label: "Neutral", color: "text-amber-400", bg: "bg-amber-500/20" };
}

export default function ResultsScreen({
  chatId,
  transcription,
  onBack,
}: ResultsScreenProps) {
  const [modal, setModal] = useState<"summary" | "sentiment" | "translate" | null>(null);
  const [fromLang, setFromLang] = useState("en");
  const [toLang, setToLang] = useState("es");
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [sentimentText, setSentimentText] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const clearError = () => setApiError(null);
  const tone = sentimentText ? getToneFromSentiment(sentimentText) : null;

  useEffect(() => {
    if (!chatId) return;
    let cancelled = false;
    // Reset so we don't show previous chat's summary/sentiment; show loading until we have data
    setSummaryText(null);
    setSentimentText(null);
    setApiError(null);
    setLoadingSummary(true);
    setLoadingSentiment(true);
    getChat(chatId)
      .then((chat) => {
        if (cancelled) return;
        const hasSummary = chat.summary != null && chat.summary !== "";
        const hasSentiment = chat.sentiment != null && chat.sentiment !== "";
        if (hasSummary) {
          setSummaryText(chat.summary ?? null);
          setLoadingSummary(false);
        }
        if (hasSentiment) {
          setSentimentText(chat.sentiment ?? null);
          setLoadingSentiment(false);
        }
        if (hasSummary && hasSentiment) return;
        if (!hasSummary) {
          getSummary(chatId)
            .then((s) => { if (!cancelled) setSummaryText(s); })
            .finally(() => { if (!cancelled) setLoadingSummary(false); });
        }
        if (!hasSentiment) {
          getSentiment(chatId)
            .then((s) => { if (!cancelled) setSentimentText(s); })
            .finally(() => { if (!cancelled) setLoadingSentiment(false); });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSummaryText(null);
          setSentimentText(null);
          setLoadingSummary(false);
          setLoadingSentiment(false);
          setApiError(err instanceof Error ? err.message : "Failed to load chat.");
        }
      });
    return () => { cancelled = true; };
  }, [chatId]);

  const fetchSummaryAndOpen = async () => {
    setModal("summary");
    setApiError(null);
    setLoadingSummary(true);
    try {
      const text = await getSummary(chatId);
      setSummaryText(text);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchSentimentAndOpen = async () => {
    setModal("sentiment");
    setApiError(null);
    setLoadingSentiment(true);
    try {
      const text = await getSentiment(chatId);
      setSentimentText(text);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to analyze sentiment.");
    } finally {
      setLoadingSentiment(false);
    }
  };

  const openTranslateModal = () => {
    setModal("translate");
    setTranslatedText(null);
    setApiError(null);
  };

  const handleTranslate = async () => {
    if (fromLang === toLang) {
      setTranslatedText("Source and target language are the same. Please choose a different target language.");
      return;
    }
    setApiError(null);
    setLoading(true);
    try {
      const text = await getTranslation(chatId, fromLang, toLang);
      setTranslatedText(text);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="h-5 w-5" />
        New recording
      </button>

      {apiError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {apiError}
          <button type="button" onClick={clearError} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold text-white">Transcription</h2>
        <p className="mt-3 whitespace-pre-wrap text-gray-300 leading-relaxed">
          {transcription}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={fetchSummaryAndOpen}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-accent-teal/10 to-transparent p-5 text-left transition hover:border-accent-teal/30 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-accent-teal/20 p-2">
                <FileText className="h-5 w-5 text-accent-teal" />
              </div>
              <span className="font-semibold text-white">Summary</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 transition group-hover:text-accent-teal" />
          </div>
          <div className="mt-3 min-h-[3rem]">
            {loadingSummary ? (
              <p className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </p>
            ) : summaryText ? (
              <p className="line-clamp-3 text-sm text-gray-300 leading-relaxed">{summaryText}</p>
            ) : (
              <p className="text-sm text-gray-500">Tap to generate summary</p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={fetchSentimentAndOpen}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-accent-gold/10 to-transparent p-5 text-left transition hover:border-accent-gold/30 focus:outline-none focus:ring-2 focus:ring-accent-gold/40"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-accent-gold/20 p-2">
                <Smile className="h-5 w-5 text-accent-gold" />
              </div>
              <span className="font-semibold text-white">Tone & sentiment</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500 transition group-hover:text-accent-gold" />
          </div>
          <div className="mt-3 min-h-[3rem]">
            {loadingSentiment ? (
              <p className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </p>
            ) : tone ? (
              <div className="space-y-1">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone.bg} ${tone.color}`}>
                  {tone.label}
                </span>
                <p className="line-clamp-2 text-sm text-gray-300 leading-relaxed">{sentimentText}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tap to analyze sentiment</p>
            )}
          </div>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openTranslateModal}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-white transition hover:border-brand-400/50 hover:bg-white/10"
        >
          <Languages className="h-5 w-5 text-brand-400" />
          Translate
        </button>
      </div>

      {modal === "summary" && (
        <ResultModal title="Summary" onClose={() => { setModal(null); clearError(); }}>
          {apiError && <p className="text-rose-400">{apiError}</p>}
          {loadingSummary && <p className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
          {summaryText !== null && !loadingSummary && <p className="whitespace-pre-wrap leading-relaxed">{summaryText}</p>}
        </ResultModal>
      )}
      {modal === "sentiment" && (
        <ResultModal title="Sentiment analysis" onClose={() => { setModal(null); clearError(); }}>
          {apiError && <p className="text-rose-400">{apiError}</p>}
          {loadingSentiment && <p className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
          {sentimentText !== null && !loadingSentiment && (
            <div className="space-y-3">
              {tone && (
                <p className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${tone.bg} ${tone.color}`}>
                  {tone.label}
                </p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{sentimentText}</p>
            </div>
          )}
        </ResultModal>
      )}
      {modal === "translate" && (
        <ResultModal title="Translation" onClose={() => { setModal(null); clearError(); }}>
          <div className="space-y-4">
            {apiError && <p className="text-rose-400">{apiError}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Translate from</label>
                <select
                  value={fromLang}
                  onChange={(e) => setFromLang(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-surface-elevated text-gray-900">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-400">Translate to</label>
                <select
                  value={toLang}
                  onChange={(e) => setToLang(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-surface-elevated text-gray-900">
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTranslate}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-medium text-white transition hover:bg-brand-600 disabled:opacity-50 sm:w-auto sm:px-6"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRightLeft className="h-5 w-5" />}
              Translate
            </button>
            {translatedText !== null && !loading && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-gray-400">
                  {LANGUAGES.find((l) => l.code === toLang)?.name} translation
                </p>
                <p className="mt-2 whitespace-pre-wrap text-gray-100 leading-relaxed">{translatedText}</p>
              </div>
            )}
          </div>
        </ResultModal>
      )}
    </div>
  );
}
