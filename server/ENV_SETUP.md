# Server .env setup (Prisma + Supabase Postgres)

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `server/.env` and set:

   - **OPENAI_API_KEY** – Your OpenAI API key (from https://platform.openai.com/api-keys).
   - **DATABASE_URL** – Replace `[YOUR-PASSWORD]` with your Supabase database password.
   - **DIRECT_URL** – Same password in the second URL.

   If your password contains special characters (e.g. `$`, `#`, `/`), keep them as-is inside the URL; if the shell misbehaves, wrap the whole value in single quotes in the file.

3. Generate Prisma client and sync schema (first time or after schema changes):
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma db push
   ```
   `db push` applies the Prisma schema to your database (creates tables if they don’t exist). If you already ran the SQL in `supabase/schema.sql`, the tables exist and `db push` will align the schema.

4. Start the server:
   ```bash
   npm start
   ```
