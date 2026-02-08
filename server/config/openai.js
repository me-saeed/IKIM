const OpenAI = require("openai").default;
const config = require("./env");

let client = null;

function getOpenAI() {
  if (!config.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  if (!client) {
    client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return client;
}

module.exports = { getOpenAI };
