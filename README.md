# Resume Builder

Full-stack AI resume builder (Rezi-inspired): TypeScript, PostgreSQL, React, JWT auth. Landing page at project root; app in `apps/web`, API in `apps/api`.

## Structure

- **`/`** — Static landing (index.html, styles.css) — point “Create free resume” to `http://localhost:5173` or your app URL.
- **`apps/api`** — Express + TypeScript backend: auth (register/login/refresh), resume CRUD, Drizzle + PostgreSQL.
- **`apps/web`** — React + Vite + TypeScript: login, register, dashboard, resume list, editor (title/template/summary edit + save).
- **`packages/shared`** — Shared types (resume content, user).
- **`docs/BUILD_PLAN.md`** — Full build plan and phases.
- **`docs/PHASE1_CHECKLIST.md`** — Verification checklist so all Phase 1 functions work 100%.

## Quick start

### 1. Install and DB

```bash
npm install
docker compose up -d
cp .env.example .env
# Edit .env: set JWT_SECRET and JWT_REFRESH_SECRET (min 32 chars each)
cd apps/api && npm run db:migrate && cd ../..
```

### 2. Run API and Web

```bash
npm run dev
```

- API: http://localhost:4000  
- Web: http://localhost:5173 (proxies /auth, /resumes to API)

### 3. Try it

- Open http://localhost:5173 → Register → Create a resume → Edit title/summary and Save → Delete from dashboard.
- **Verify everything:** see `docs/PHASE1_CHECKLIST.md` (backend + frontend checks).

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Run API + web in parallel |
| `npm run dev:api` | Run API only (port 4000) |
| `npm run dev:web` | Run web only (port 5173) |
| `npm run build` | Build all workspaces |
| `npm run db:migrate` | Run DB migration (from repo root: `npm run db:migrate --workspace=apps/api`) |

From `apps/api`: `db:generate`, `db:push`, `db:studio` (Drizzle).

## Env

See `.env.example`. Required for API: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`. Optional: `WEB_ORIGIN` (default `http://localhost:5173`).

## Deploy (Nixpacks + VPS)

- Root `nixpacks.toml` builds API + web and runs `npm run start` (API serves the web app in production).
- **Production checklist:** Set `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars). Set `APP_URL` and `WEB_ORIGIN` to your public app URL (e.g. `https://yourapp.com`). Run migrations once: `npm run db:setup` or `npm run db:migrate` with `DATABASE_URL` set.
- **Health check:** `GET /health` returns `{ ok, db }`; if DB is down it returns 503 so you can debug connectivity.
- **Email verification (optional):** Set `SMTP_URL` and `EMAIL_FROM` to send verification emails on signup. Users get a link to verify; without SMTP, signup still works and no email is sent.

See `docs/BUILD_PLAN.md` for full deployment and Phase 2+ (editor, AI, export).
