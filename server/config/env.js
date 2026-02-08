require("dotenv").config();

function loadEnv() {
  return {
    PORT: Number(process.env.PORT) || 4000,
    NODE_ENV: process.env.NODE_ENV || "development",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    DATABASE_URL: process.env.DATABASE_URL || "",
    DIRECT_URL: process.env.DIRECT_URL || "",
  };
}

module.exports = loadEnv();
