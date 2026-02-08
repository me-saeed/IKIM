const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { randomBytes } = require("crypto");
const { strictLimiter } = require("../middleware/rateLimiter");
const { getOpenAI } = require("../config/openai");

const router = express.Router();

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (Whisper limit)
const ALLOWED_MIMES = ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/webm", "audio/wav", "audio/x-wav", "audio/ogg"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("audio/") || ALLOWED_MIMES.includes(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Invalid file type. Use an audio file (e.g. mp3, wav, webm, m4a)."));
  },
});

router.post(
  "/",
  strictLimiter,
  (req, res, next) => {
    upload.single("audio")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File too large. Max 25 MB." });
        }
        return res.status(400).json({ error: err.message || "Upload failed" });
      }
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "Missing audio file. Send as multipart field 'audio'." });
      }
      next();
    });
  },
  async (req, res) => {
    let tmpPath = null;
    try {
      const openai = getOpenAI();
      const ext = (path.extname(req.file.originalname) || ".webm").toLowerCase();
      const safeExt = [".mp3", ".mp4", ".m4a", ".webm", ".wav", ".ogg"].includes(ext) ? ext : ".webm";
      tmpPath = path.join(os.tmpdir(), `whisper-${Date.now()}-${randomBytes(4).toString("hex")}${safeExt}`);
      fs.writeFileSync(tmpPath, req.file.buffer);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: "whisper-1",
      });

      const text = transcription?.text ?? "";
      res.json({ transcription: text });
    } catch (err) {
      if (err.message && err.message.includes("Missing OPENAI")) {
        return res.status(503).json({ error: "Transcription service not configured" });
      }
      if (err.status === 429) {
        return res.status(429).json({ error: "OpenAI rate limit. Try again later." });
      }
      res.status(502).json({ error: err.message || "Transcription failed" });
    } finally {
      if (tmpPath && fs.existsSync(tmpPath)) {
        try {
          fs.unlinkSync(tmpPath);
        } catch (_) {}
      }
    }
  }
);

module.exports = router;
