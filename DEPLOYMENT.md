# Deploying IKIM Voice (Netlify + Render)

Netlify **does not run long-running servers** (like your Express app). So:

- **Frontend (Next.js)** → **Netlify**
- **Backend (Express)** → **Render** (free tier, runs Node 24/7)

After both are deployed, set the frontend env var `NEXT_PUBLIC_API_URL` to your Render API URL.

---

## 1. Backend on Render

### 1.1 Prepare the repo

- Backend lives in the **`server/`** folder. Render can start from repo root and use `server` as the root for the service, or you use a **monorepo** setup.
- Ensure `server/package.json` has a **start** script (e.g. `"start": "node index.js"`). You already have it.

### 1.2 Create a Web Service on Render

1. Go to [render.com](https://render.com) and sign in (GitHub is fine).
2. **New** → **Web Service**.
3. **Connect** your GitHub/GitLab and select the **IKIM** repo.
4. Configure:
   - **Name:** `ikim-voice-api` (or any name).
   - **Region:** Choose one (e.g. Frankfurt if you want EU).
   - **Root Directory:** `server`  
     (so Render runs `npm install` and `npm start` inside `server/`).
   - **Runtime:** Node.
   - **Build Command:** `npm install && npx prisma generate`  
     (or just `npm install` if postinstall already runs `prisma generate`).
   - **Start Command:** `npm start` or `node index.js`.
5. **Environment variables** (in Render dashboard):
   - `NODE_ENV` = `production`
   - `PORT` = `4000` (Render sets `PORT` automatically; your app should use `process.env.PORT`).
   - `OPENAI_API_KEY` = your OpenAI key.
   - `DATABASE_URL` = your Supabase **connection string (pooler)** (e.g. `postgresql://...@...pooler.supabase.com:6543/...?pgbouncer=true`).
   - `DIRECT_URL` = your Supabase direct URL (for migrations; e.g. pooler session port `5432` or direct DB URL).

### 1.3 Use Render’s PORT

Your server uses `config.PORT`. In `server/config/env.js` (or wherever `PORT` is read), ensure it uses `process.env.PORT` so Render can inject its port (e.g. `PORT=10000`). If you already have `PORT` in `.env`, Render will override it with their assigned port.

### 1.4 Deploy

- Click **Create Web Service**. Render will build and deploy.
- After deploy, the API URL will be like:  
  `https://ikim-voice-api.onrender.com`  
  (or whatever name you chose). Test:  
  `https://<your-service>.onrender.com/api/health`  
  should return `{"ok":true}`.

### 1.5 (Optional) CORS

Your Express app uses `cors()` with no origin (allows any). For production you can restrict:

```javascript
app.use(cors({ origin: ["https://your-app.netlify.app", "http://localhost:3000"] }));
```

---

## 2. Frontend on Netlify

### 2.1 Connect the repo

1. Go to [netlify.com](https://netlify.com) and sign in.
2. **Add new site** → **Import an existing project**.
3. Connect GitHub/GitLab and select the **IKIM** repo (the **root** of the repo, not `server`).

### 2.2 Build settings (Netlify detects Next.js)

- **Branch to deploy:** `main` (or your default).
- **Base directory:** leave empty (root).
- **Build command:** `npm run build`
- **Publish directory:** leave as Netlify’s default for Next.js (e.g. `.next` or the value Netlify sets; do **not** use `out` unless you switch to static export).
- **Node version (optional):** In Netlify UI → **Site settings** → **Environment** → **Environment variables**, add:
  - `NODE_VERSION` = `18` (or `20`)  
  Or set it in `netlify.toml` (see below).

### 2.3 Environment variables (Netlify)

In **Site settings** → **Environment variables** → **Add variable**:

- **Key:** `NEXT_PUBLIC_API_URL`
- **Value:** `https://ikim-voice-api.onrender.com`  
  (your Render Web Service URL, **no** trailing slash).

Save. Redeploy so the build sees this variable.

### 2.4 Optional: `netlify.toml` in repo root

You can commit a config file so build is reproducible:

```toml
[build]
  command = "npm run build"
[build.environment]
  NODE_VERSION = "18"
```

For Next.js 14, Netlify often uses an internal publish path; if the default works in the UI, you can leave `publish` out. If Netlify shows a “publish directory” hint for Next.js, Do not set publish; Netlify uses the correct output for Next.js.

### 2.5 Deploy

- Push to your connected branch or trigger **Deploy site** in Netlify. The site will be at `https://<random>.netlify.app` or your custom domain.

### 2.6 Check that the frontend talks to the API

- Open the deployed site, start or upload a recording. If the UI loads but “Processing…” or transcription fails, open DevTools → Network and check requests to `NEXT_PUBLIC_API_URL`. Confirm the API URL in Netlify env vars and that the Render service is running.

---

## 3. Summary

| What        | Where   | URL / Env |
|------------|---------|-----------|
| Next.js FE | Netlify | `https://<your-site>.netlify.app` |
| Express BE | Render  | `https://<your-service>.onrender.com` |
| FE env    | Netlify | `NEXT_PUBLIC_API_URL` = Render URL |
| BE env    | Render  | `PORT`, `OPENAI_API_KEY`, `DATABASE_URL`, `DIRECT_URL` |

---

## 4. Render free tier notes

- The free **Web Service** **spins down after ~15 minutes** of no traffic. The first request after that can take 30–60 seconds (cold start). For a demo this is usually acceptable.
- To avoid long cold starts, use a **paid plan** or a **cron job** (e.g. UptimeRobot) that hits `/api/health` every 10 minutes.

---

## 5. If you prefer Railway instead of Render

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select repo.
2. Add a **Service**, set **Root Directory** to `server`.
3. Set env vars: `OPENAI_API_KEY`, `DATABASE_URL`, `DIRECT_URL`. Railway sets `PORT` automatically.
4. Deploy; use the generated URL (e.g. `https://ikim-voice-api.up.railway.app`) as `NEXT_PUBLIC_API_URL` in Netlify.

Same idea: **FE on Netlify, BE on a host that runs Node.**
