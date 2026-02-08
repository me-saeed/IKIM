const rateLimit = require("express-rate-limit");

/** General API: 100 requests per 15 minutes per IP */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Stricter for heavy routes (transcribe, GPT): 60 per 15 min per IP – summary + sentiment auto-load per chat uses 2, so ~30 chats or mixed use */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: "Rate limit exceeded for this action. Try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  strictLimiter,
};
