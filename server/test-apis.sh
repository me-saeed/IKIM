#!/usr/bin/env bash
# Test all IKIM backend APIs with curl. Start the server first: cd server && npm start
set -e
BASE="http://localhost:4000/api"

echo "=== 1. GET /api/health ==="
curl -s -w "\nHTTP %{http_code}\n" "$BASE/health"
echo ""

echo "=== 2. GET /api/chats (list) ==="
curl -s -w "\nHTTP %{http_code}\n" "$BASE/chats"
echo ""

echo "=== 3. POST /api/chats (create) ==="
CREATE=$(curl -s -X POST "$BASE/chats" -H "Content-Type: application/json" -d '{"transcription":"This is a test recording for API checks. We will use it for summary, sentiment and translation."}')
echo "$CREATE"
CHAT_ID=$(echo "$CREATE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$CHAT_ID" ]; then
  echo "Could not parse chat id. Install jq and use: CHAT_ID=$(echo "$CREATE" | jq -r .id)"
  echo "Skipping tests that need CHAT_ID. Set it manually and run the remaining curls."
else
  echo "Created chat id: $CHAT_ID"
  echo ""

  echo "=== 4. GET /api/chats/:id ==="
  curl -s -w "\nHTTP %{http_code}\n" "$BASE/chats/$CHAT_ID"
  echo ""

  echo "=== 5. POST /api/chats/:id/summary ==="
  curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/chats/$CHAT_ID/summary"
  echo ""

  echo "=== 6. POST /api/chats/:id/sentiment ==="
  curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/chats/$CHAT_ID/sentiment"
  echo ""

  echo "=== 7. POST /api/chats/:id/translate ==="
  curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/chats/$CHAT_ID/translate" -H "Content-Type: application/json" -d '{"toLang":"es"}'
  echo ""
fi

echo "=== 8. POST /api/transcribe (needs audio file) ==="
if [ -f "sample.webm" ] || [ -f "sample.mp3" ]; then
  AUDIO=$(ls sample.webm sample.mp3 2>/dev/null | head -1)
  curl -s -w "\nHTTP %{http_code}\n" -X POST "$BASE/transcribe" -F "audio=@$AUDIO"
else
  echo "No sample.webm or sample.mp3 in server/. Skip: curl -X POST $BASE/transcribe -F \"audio=@yourfile.webm\""
fi
echo ""
echo "Done."
