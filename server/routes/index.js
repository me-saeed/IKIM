const express = require("express");
const router = express.Router();
const { getPrisma } = require("../config/prisma");
const { getOpenAI } = require("../config/openai");
const { makePreview } = require("../utils/preview");
const { strictLimiter } = require("../middleware/rateLimiter");
const transcribeRouter = require("./transcribe");

const dbError = (err) => err.message && (err.message.includes("Missing DATABASE") || err.message.includes("DIRECT_URL"));

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.get("/chats", async (req, res) => {
  try {
    const prisma = getPrisma();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const data = await prisma.chat.findMany({
      select: { id: true, preview: true, transcription: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json(data);
  } catch (err) {
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured", chats: [] });
    }
    res.status(500).json({ error: err.message || "Failed to fetch chats" });
  }
});

router.get("/chats/:id", async (req, res) => {
  try {
    const prisma = getPrisma();
    const data = await prisma.chat.findUnique({
      where: { id: req.params.id },
      include: {
        summaries: { take: 1 },
        sentiments: { take: 1 },
      },
    });
    if (!data) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const { summaries, sentiments, ...chat } = data;
    res.json({
      ...chat,
      summary: summaries[0]?.summary ?? null,
      sentiment: sentiments[0]?.sentiment ?? null,
    });
  } catch (err) {
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured" });
    }
    res.status(500).json({ error: err.message || "Failed to fetch chat" });
  }
});

router.post("/chats", async (req, res) => {
  try {
    const { transcription } = req.body || {};
    if (typeof transcription !== "string") {
      return res.status(400).json({ error: "Body must include transcription (string)" });
    }
    const preview = makePreview(transcription);
    const prisma = getPrisma();
    const data = await prisma.chat.create({
      data: { preview, transcription: transcription.trim() },
      select: { id: true, preview: true, transcription: true, createdAt: true },
    });
    res.status(201).json(data);
  } catch (err) {
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured" });
    }
    res.status(500).json({ error: err.message || "Failed to create chat" });
  }
});

router.delete("/chats/:id", async (req, res) => {
  try {
    const prisma = getPrisma();
    await prisma.chat.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Chat not found" });
    }
    res.status(500).json({ error: err.message || "Failed to delete chat" });
  }
});

router.post("/chats/:id/summary", strictLimiter, async (req, res) => {
  const chatId = req.params.id;
  try {
    const prisma = getPrisma();
    const cached = await prisma.chatSummary.findUnique({
      where: { chatId },
      select: { summary: true },
    });
    if (cached) {
      return res.json({ summary: cached.summary });
    }
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, transcription: true },
    });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Summarize the following text in a few sentences:\n\n${chat.transcription || ""}`,
        },
      ],
      max_tokens: 500,
    });
    const summary = completion?.choices?.[0]?.message?.content?.trim() ?? "";
    await prisma.chatSummary.upsert({
      where: { chatId },
      create: { chatId, summary },
      update: { summary },
    });
    res.json({ summary });
  } catch (err) {
    if (err.message && err.message.includes("Missing OPENAI")) {
      return res.status(503).json({ error: "Summary service not configured" });
    }
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
    }
    res.status(502).json({ error: err.message || "Summary failed" });
  }
});

router.post("/chats/:id/sentiment", strictLimiter, async (req, res) => {
  const chatId = req.params.id;
  try {
    const prisma = getPrisma();
    const cached = await prisma.chatSentiment.findUnique({
      where: { chatId },
      select: { sentiment: true },
    });
    if (cached) {
      return res.json({ sentiment: cached.sentiment });
    }
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, transcription: true },
    });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Analyze the sentiment of this text. Return a short analysis: overall sentiment (positive/neutral/negative), tone, and 2-3 tags. Plain text only.\n\n${chat.transcription || ""}`,
        },
      ],
      max_tokens: 400,
    });
    const sentiment = completion?.choices?.[0]?.message?.content?.trim() ?? "";
    await prisma.chatSentiment.upsert({
      where: { chatId },
      create: { chatId, sentiment },
      update: { sentiment },
    });
    res.json({ sentiment });
  } catch (err) {
    if (err.message && err.message.includes("Missing OPENAI")) {
      return res.status(503).json({ error: "Sentiment service not configured" });
    }
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
    }
    res.status(502).json({ error: err.message || "Sentiment analysis failed" });
  }
});

router.post("/chats/:id/translate", strictLimiter, async (req, res) => {
  const chatId = req.params.id;
  const { fromLang = "en", toLang } = req.body || {};
  if (typeof toLang !== "string" || !toLang.trim()) {
    return res.status(400).json({ error: "Body must include toLang (string), e.g. 'es', 'fr'" });
  }
  const from = String(fromLang).trim().toLowerCase();
  const to = String(toLang).trim().toLowerCase();
  if (from === to) {
    return res.status(400).json({ error: "fromLang and toLang must be different" });
  }
  try {
    const prisma = getPrisma();
    const cached = await prisma.chatTranslation.findUnique({
      where: { chatId_targetLang: { chatId, targetLang: to } },
      select: { translatedText: true },
    });
    if (cached) {
      return res.json({ translatedText: cached.translatedText, fromLang: from, toLang: to });
    }
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, transcription: true },
    });
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Translate the following text from ${from} to ${to}. Return only the translated text, no explanation.\n\n${chat.transcription || ""}`,
        },
      ],
      max_tokens: 2000,
    });
    const translatedText = completion?.choices?.[0]?.message?.content?.trim() ?? "";
    await prisma.chatTranslation.upsert({
      where: { chatId_targetLang: { chatId, targetLang: to } },
      create: { chatId, targetLang: to, translatedText },
      update: { translatedText },
    });
    res.json({ translatedText, fromLang: from, toLang: to });
  } catch (err) {
    if (err.message && err.message.includes("Missing OPENAI")) {
      return res.status(503).json({ error: "Translation service not configured" });
    }
    if (dbError(err)) {
      return res.status(503).json({ error: "Database not configured" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
    }
    res.status(502).json({ error: err.message || "Translation failed" });
  }
});

router.use("/transcribe", transcribeRouter);

module.exports = router;
