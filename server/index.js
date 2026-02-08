require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { generalLimiter } = require("./middleware/rateLimiter");
const routes = require("./routes");

const config = require("./config/env");
const app = express();

// When behind a reverse proxy (nginx, Caddy, etc.), trust X-Forwarded-For so rate limiting uses real client IP
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.use("/api", generalLimiter, routes);

app.use((err, req, res, next) => {
  if (err.status === 429) {
    return res.status(429).json(
      err.message && typeof err.message === "object" ? err.message : { error: "Too many requests." }
    );
  }
  next(err);
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
