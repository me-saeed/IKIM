const PREVIEW_MAX_LENGTH = 60;

function makePreview(transcription) {
  if (typeof transcription !== "string") return "";
  const trimmed = transcription.trim();
  if (!trimmed) return "Empty recording";
  return trimmed.length <= PREVIEW_MAX_LENGTH
    ? trimmed
    : trimmed.slice(0, PREVIEW_MAX_LENGTH).trim() + "…";
}

module.exports = { makePreview };
