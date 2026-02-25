# Phase 1 — Verification Checklist

Use this to confirm **backend and frontend are running** and **all Phase 1 functions work 100%**.

---

## Prerequisites

1. **Docker Desktop** running (for PostgreSQL).
2. In project root:
   - `.env` exists (copy from `.env.example` if needed; set `JWT_SECRET` and `JWT_REFRESH_SECRET` to 32+ chars).
   - `npm install` done.
   - `npm run build -w packages/shared` done.
   - `docker compose up -d` then `npm run db:migrate --workspace=apps/api`.

---

## Start both servers

From project root:

```bash
npm run dev
```

- **Backend:** http://localhost:4000  
- **Frontend:** http://localhost:5173  

Keep this terminal open. You should see both "API listening on http://localhost:4000" and Vite dev server for the web app.

---

## Backend (API) — all must pass

| # | Check | How to verify |
|---|--------|----------------|
| 1 | Health | Open http://localhost:4000/health → JSON `{"ok":true}` |
| 2 | Register | `POST /auth/register` with `{ "email": "test@example.com", "password": "password123", "name": "Test" }` → 201 + user + Set-Cookie |
| 3 | Login | `POST /auth/login` with same email/password → 200 + user + Set-Cookie |
| 4 | Me | `GET /auth/me` with cookie (or Authorization: Bearer &lt;accessToken&gt;) → 200 + user |
| 5 | Refresh | `POST /auth/refresh` with refresh cookie → 200 + user + new Set-Cookie |
| 6 | Logout | `POST /auth/logout` with cookies → 200 + cookies cleared |
| 7 | List resumes | `GET /resumes` with auth cookie → 200 + `{ resumes: [] }` or list |
| 8 | Create resume | `POST /resumes` with `{ "title": "My Resume" }` (and auth) → 201 + resume |
| 9 | Get resume | `GET /resumes/:id` with auth → 200 + resume (id, title, content, etc.) |
| 10 | Update resume | `PATCH /resumes/:id` with `{ "title": "Updated" }` or `{ "content": {...} }` → 200 + resume |
| 11 | Delete resume | `DELETE /resumes/:id` with auth → 204 No Content |

---

## Frontend (Web) — all must pass

| # | Check | How to verify |
|---|--------|----------------|
| 1 | Landing | Open http://localhost:5173 → redirect to /login if not logged in, or / if logged in |
| 2 | Register | Register with email + password (8+ chars) → redirect to dashboard, see email in header |
| 3 | Session | Refresh page → still logged in (cookie persisted) |
| 4 | Logout | Click Log out → redirect to /login, cookie cleared |
| 5 | Login | Log in with same user → dashboard again |
| 6 | List resumes | Dashboard shows "My resumes" and list (or "No resumes yet") |
| 7 | Create resume | Enter title (or leave blank), click "Create resume" → redirect to editor for new resume |
| 8 | View resume | Editor shows title, template, summary; "Back to dashboard" works |
| 9 | Edit & save | Change title or summary, click "Save" → "Saved" appears; refresh page → changes persisted |
| 10 | Delete resume | From dashboard, click "Delete" on a resume → it disappears from list |
| 11 | 401 + refresh | (Optional) After access token expires, next API call should auto-refresh via /auth/refresh and succeed |

---

## Success criteria (Phase 1)

- [x] User can **register**, **log in**, and use the app with **session persisted (cookies)**.
- [x] User can **create**, **edit**, and **delete** multiple resumes; data stored in **PostgreSQL**.
- [ ] At least 2 templates; PDF and DOCX export (Phase 2).
- [ ] AI features (Phase 3).
- [x] Landing page in place; auth and app with CORS/cookies (Vite proxy to API).
- [ ] Deployed on VPS with Nixpacks (when ready).
- [x] No API keys in frontend; auth via backend cookies.

When all Phase 1 rows above pass, **Phase 1 is 100% complete**. Then proceed to Phase 2 (editor UI, export) and Phase 3 (AI).
