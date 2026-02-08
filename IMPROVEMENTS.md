# Possible Improvements

Quick reference for what could be improved in the demo (prioritized, not all required).

---

## High impact / quick wins

| Area | What | Why |
|------|------|-----|
| **Upload** | Show message when user selects a non-audio file | Right now nothing happens; user gets no feedback. |
| **Results** | Show error when loading chat fails (e.g. network) | Empty summary/sentiment cards with no explanation. |
| **README** | Link to `server/docs/api.md` | Shows you document APIs. |

---

## Code quality & job alignment

| Area | What | Why |
|------|------|-----|
| **Tests** | 1–2 tests (e.g. `GET /api/health`, or one API route) | Job asks for "well-tested" code. |
| **Backend** | Upgrade Multer to 2.x | 1.x has known vulnerabilities (see npm warning). |
| **UI** | Optional: add one shadcn/ui component | Job prefers shadcn/ui + Tailwind. |

---

## UX & accessibility

| Area | What | Why |
|------|------|-----|
| **Modal** | Close on Escape, trap focus when open | Better keyboard and a11y. |
| **Recording** | Clear message when mic is denied (e.g. suggest upload) | Already have error state; copy can be more helpful. |
| **File input** | `accept="audio/mpeg,audio/mp4,audio/webm,audio/wav,audio/ogg"` | Some systems filter better than `audio/*`. |

---

## Later / scale

| Area | What | Why |
|------|------|-----|
| **Env** | Validate required env on server startup | Fail fast with a clear message. |
| **Logging** | Structured logs (e.g. request id, errors) | Easier debugging in production. |
| **Frontend** | Error boundary around main content | One place to catch render errors. |

---

*Demo is already strong: full stack, dictation, DB-backed summary/sentiment, clear structure. These are incremental improvements.*
