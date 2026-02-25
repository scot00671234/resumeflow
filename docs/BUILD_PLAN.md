# Build Plan: Full-Stack AI Resume Builder

**Goal:** Ship a production-ready, Rezi-inspired AI resume platform with TypeScript, PostgreSQL, Nixpacks, and VPS deployment — including auth, AI integration, and full feature parity where applicable.

**Stack:** TypeScript (frontend + backend), PostgreSQL, Nixpacks → Docker → VPS.

---

## 1. Rezi.ai Functionality (Research Summary)

### 1.1 Core product flow
- **Inputs:** Start from scratch, upload PDF/doc, or import from LinkedIn.
- **Steps:** Contact → Summary → Experience → Education → Skills → optional sections (certifications, projects, etc.).
- **Outputs:** ATS-friendly resume (multiple templates), PDF/DOCX export, shareable link.

### 1.2 Feature list to replicate

| Feature | Description | Priority |
|--------|-------------|----------|
| **Resume builder (editor)** | Rich editor: sections, bullets, templates, fonts, colors, spacing, A4/Letter. | P0 |
| **Resume storage & folders** | Multiple resumes per user, folders, list/dashboard. | P0 |
| **AI bullet/section writer** | Generate or improve bullets and summary from role/context. | P0 |
| **AI keyword targeting** | Paste job description → extract keywords → suggest where to add them. | P0 |
| **Rezi Score / ATS checker** | Score 1–100 on ~23 ATS/content criteria, with fixes. | P0 |
| **Real-time content analysis** | Inline hints: missing metrics, buzzwords, weak verbs, punctuation. | P1 |
| **Cover letter generator** | Company + role + resume → AI cover letter. | P0 |
| **Resume summary writer** | Role-focused professional summary. | P1 |
| **Resignation letter generator** | Tone options, one-click letter. | P2 |
| **AI resume agent (chat)** | Chat: “improve my summary”, “tailor to this job”, etc. | P1 |
| **Job search & tracking** | Search jobs, save posts, track applications, link to resumes. | P1 |
| **AI interview practice** | Role + resume → AI asks interview questions. | P2 |
| **Templates** | Multiple ATS-friendly templates (Modern, Standard, Compact, etc.). | P0 |
| **Export** | PDF, DOCX; optional custom/shared URL. | P0 |
| **Resume examples library** | Browse samples by job title (reference content only). | P2 |

### 1.3 Data model reference
- Rezi (and others) use **[rezi-io/resume-standard](https://github.com/rezi-io/resume-standard)** (MIT): structured resume schema (Contact, Summary, Experience, Education, Skills, etc.) and parser. We can align our DB schema and API with this for compatibility and future XMP/PDF metadata.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  VPS (e.g. Dokku / Docker Compose / single node)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Frontend    │  │  Backend     │  │  PostgreSQL           │   │
│  │  (TS/React   │  │  (TS/Node    │  │  (persistent volume)  │   │
│  │   or similar)│◄─┤  Express/   │◄─┤                       │   │
│  │  Nixpacks    │  │  Fastify)    │  └──────────────────────┘   │
│  └──────┬───────┘  └──────┬───────┘                              │
│         │                 │                                       │
│         │                 │  AI provider (OpenAI / Anthropic)     │
│         │                 └──────────────────────► external API  │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend:** SPA (React + TypeScript or Next.js). Served as static build or via same origin.
- **Backend:** REST (or tRPC) API, TypeScript, Node. Handles auth, resume CRUD, AI proxy, export.
- **DB:** PostgreSQL. Migrations (e.g. node-pg-migrate, Drizzle, Prisma).
- **Build/deploy:** Nixpacks for both frontend and backend (or one monorepo with two Nixpacks targets). Output = Docker image(s) run on VPS.

---

## 3. Tech Stack (Detailed)

| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | React + TypeScript + Vite | Or Next.js if you want SSR/API routes. |
| **State / API client** | TanStack Query + fetch or axios | Typed API, cache, auth headers. |
| **Backend** | Node + Express (or Fastify) + TypeScript | Simple, well-documented, Nixpacks-friendly. |
| **DB** | PostgreSQL | Host on same VPS or managed. |
| **ORM / migrations** | Drizzle or Prisma | Type-safe schema, migrations, good TS support. |
| **Auth** | JWT (access + refresh), HTTP-only cookies | Optional: magic link or OAuth later. |
| **AI** | OpenAI and/or Anthropic API | Resume/cover letter: GPT-4 or Claude. |
| **PDF export** | Puppeteer or @react-pdf/renderer or server-side HTML→PDF | Depends on template complexity. |
| **DOCX export** | docx lib (e.g. docx npm) | Build DOCX from structured resume. |
| **Deploy** | Nixpacks → Docker → VPS | Dokku, Docker Compose, or plain Docker. |

---

## 4. User Auth (Backend + Frontend)

### 4.1 Flow
- **Register:** Email + password → hash (bcrypt) → create user → issue tokens.
- **Login:** Email + password → verify → issue access (short-lived) + refresh (long-lived) JWT.
- **Tokens:** Access in memory or short-lived cookie; refresh in HTTP-only, Secure, SameSite cookie (or both in HTTP-only). No tokens in localStorage for XSS safety.
- **Refresh:** POST /auth/refresh with refresh cookie → new access (and optionally rotate refresh).
- **Logout:** Clear cookies + optional refresh token revocation in DB.

### 4.2 Backend
- Tables: `users` (id, email, password_hash, created_at, etc.), `refresh_tokens` (id, user_id, token_hash, expires_at).
- Routes: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Middleware: verify JWT on protected routes; attach `req.user` (id, email).
- Passwords: bcrypt, salt rounds ≥ 10.

### 4.3 Frontend
- Login/register forms → call auth API → on success, store nothing in localStorage; rely on cookies.
- Axios/fetch: `credentials: 'include'` for all API requests.
- Auth context: user state from “me” endpoint (e.g. GET /auth/me) using cookie; redirect to login when 401.

### 4.4 Optional later
- Email verification, password reset, magic link, or “Login with Google/GitHub”.

---

## 5. AI API Integration

### 5.1 Provider choice
- **OpenAI (GPT-4):** Good for bullet rewriting, summaries, ATS-style suggestions.
- **Anthropic (Claude):** Strong for nuanced writing and longer context (e.g. full resume + job description).
- **Recommendation:** Start with one (e.g. OpenAI); add second provider behind an abstraction so we can switch or A/B test.

### 5.2 Backend proxy (required)
- Do **not** call AI from the browser with API keys. Backend endpoints that:
  - Accept typed payloads (resume snippet, job description, action type).
  - Call OpenAI/Anthropic with system + user prompts.
  - Enforce rate limits and optional “credits” per user/plan.
  - Return plain text or structured JSON (e.g. new bullets, keywords list).

### 5.3 Feature → API mapping
- **Bullet/section writer:** POST /ai/write-bullets (role, context, current text) → generated bullets.
- **Keyword targeting:** POST /ai/keywords (job description, resume text) → list of keywords + where to add.
- **Resume score / ATS check:** POST /ai/score (full resume JSON or text) → score + list of issues/fixes.
- **Cover letter:** POST /ai/cover-letter (company, role, resume summary/experience) → draft letter.
- **Summary writer:** POST /ai/summary (resume, target role) → professional summary.
- **Resume agent (chat):** POST /ai/chat (conversation history + resume context) → streaming or single reply.

Use structured prompts and few-shot examples for consistency; keep prompts in code or DB for easy tuning.

---

## 6. Database Schema (High Level)

- **users** — id, email, password_hash, name, created_at, updated_at.
- **refresh_tokens** — id, user_id, token_hash, expires_at, created_at.
- **resumes** — id, user_id, title, slug, template_id, content (JSONB aligned to resume-standard sections), created_at, updated_at.
- **resume_folders** (optional) — id, user_id, name, created_at.
- **resume_folder_items** — folder_id, resume_id.
- **jobs** (for job tracking) — id, user_id, title, company, url, status, resume_id (optional), created_at.
- **ai_usage** (optional) — user_id, date, feature, tokens_or_credits — for limits and analytics.
- **plans / subscriptions** (optional for later) — user_id, plan (free/pro/lifetime), limits.

Resume `content` JSONB: mirror rezi-io/resume-standard (contact, summary, experience[], education[], skills[], etc.) so we can reuse parsers and export logic.

---

## 7. Core Backend API (Summary)

- **Auth:** POST /auth/register, /auth/login, /auth/refresh, /auth/logout; GET /auth/me.
- **Resumes:** CRUD /resumes (list, create, get, update, delete); optional /resumes/:id/duplicate.
- **AI:** POST /ai/write-bullets, /ai/keywords, /ai/score, /ai/cover-letter, /ai/summary, /ai/chat (and optionally /ai/resignation-letter).
- **Export:** GET or POST /resumes/:id/export?format=pdf|docx (or POST with options).
- **Templates:** GET /templates (list); template_id stored on resume.
- **Job tracking (P1):** CRUD /jobs.
- **User:** GET /user/profile, PATCH /user/profile.

---

## 8. Frontend Structure (Summary)

- **Public:** Landing (existing), pricing, login, register.
- **App (after login):** Dashboard (resume list/folders), editor (single resume), AI tools (keyword scanner, cover letter, chat agent), job tracker, settings.
- **Editor:** Section-based form or WYSIWYG-like blocks; template selector; live preview; “Improve with AI” per section/bullet; Rezi Score panel; export buttons.

---

## 9. Nixpacks + VPS Deployment

### 9.1 Nixpacks
- **Backend:** Root or `backend/` with package.json, tsconfig, build script (tsc or ts-node). Nixpacks detects Node; add `nixpacks.toml` if needed (e.g. node version, build/start commands).
- **Frontend:** `frontend/` or root with Vite build; output `dist/`. Either serve from backend (Express static) or separate Nixpacks build that produces static assets.
- **Monorepo option:** One repo with `apps/web` and `apps/api`; Nixpacks build each; or single app that builds frontend and runs Node.

### 9.2 VPS
- **Options:** Dokku (Nixpacks supported), Docker Compose (build with Nixpacks then docker run), or CI that runs `nixpacks build` and pushes image to registry then VPS pulls and runs.
- **PostgreSQL:** Same server (Docker container or host install) or managed (e.g. Neon, Supabase). Connection string via env.
- **Env on VPS:** NODE_ENV, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, OPENAI_API_KEY (or ANTHROPIC_API_KEY), frontend URL for CORS.

### 9.3 One-command deploy
- Script or CI job: build frontend → build backend (or single image) → run DB migrations → start container(s). Document in README.

---

## 10. Phased Implementation Plan

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Repo structure: monorepo or separate frontend/backend; TypeScript everywhere.
- [ ] PostgreSQL schema (users, refresh_tokens, resumes); migrations.
- [ ] Auth: register, login, refresh, logout, /auth/me; HTTP-only cookies; middleware.
- [ ] Frontend: login/register pages, auth context, protected layout, dashboard shell.
- [ ] Resume CRUD API and minimal “resume list” + “create resume” UI.

### Phase 2 — Resume Editor & Export (Weeks 2–3)
- [ ] Resume editor UI: sections (contact, summary, experience, education, skills) with JSONB sync.
- [ ] Template selector and at least 2 ATS-friendly templates (e.g. Modern, Standard).
- [ ] PDF export (Puppeteer or react-pdf) and DOCX export.
- [ ] Optional: shareable link (public read-only page with slug).

### Phase 3 — AI Features (Weeks 3–5)
- [ ] AI proxy layer: env-based provider (OpenAI/Anthropic), rate limit or credits.
- [ ] Write bullets + summary (prompts + endpoints).
- [ ] Keyword targeting: job description + resume → keywords + suggestions.
- [ ] ATS/Resume score: 20–23 checkpoints, score 1–100, list of fixes.
- [ ] Cover letter generator; optional resignation letter.
- [ ] Wire all into editor (buttons, modals, sidebar).

### Phase 4 — Polish & Extra Features (Weeks 5–6)
- [ ] Real-time content analysis (inline hints) using AI or rules.
- [ ] AI resume agent (chat) with resume context.
- [ ] Job search & tracking (CRUD, optional integration with job board API).
- [ ] Resume folders; dashboard improvements.
- [ ] Resume examples page (static or CMS).

### Phase 5 — Deploy & Launch (Week 6–7)
- [ ] Nixpacks config for API (and frontend if separate).
- [ ] Docker Compose or Dokku: app + PostgreSQL; env and secrets.
- [ ] Migrations on deploy; health check endpoint.
- [ ] Domain, TLS (e.g. Let’s Encrypt), CORS and cookie settings for production URL.
- [ ] Basic monitoring (e.g. logs, uptime); optional error tracking (e.g. Sentry).

---

## 11. File Structure (Suggested)

```
resume/
├── apps/
│   ├── api/                 # Backend
│   │   ├── src/
│   │   │   ├── routes/       # auth, resumes, ai, export
│   │   │   ├── middleware/  # auth, validate
│   │   │   ├── services/    # ai, pdf, docx
│   │   │   ├── db/          # schema, migrations, queries
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── nixpacks.toml
│   └── web/                 # Frontend
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── api/         # client
│       │   └── ...
│       ├── package.json
│       └── nixpacks.toml
├── packages/
│   └── shared/              # shared types, resume schema
│       └── src/
├── docs/
│   └── BUILD_PLAN.md        # this file
├── docker-compose.yml       # local + optional VPS
├── .env.example
└── README.md
```

(If you prefer a single app, collapse to `backend/` and `frontend/` at root with one Nixpacks build that runs the server and serves static.)

---

## 12. Success Criteria (Done = Ready to Launch)

- [ ] User can register, log in, and use the app with session persisted (cookies).
- [ ] User can create, edit, and delete multiple resumes; data stored in PostgreSQL.
- [ ] At least 2 templates; PDF and DOCX export work.
- [ ] AI: bullet/summary writing, keyword targeting, resume score, cover letter — all via backend.
- [ ] Landing page and pricing in place; auth and app behind same domain or configured CORS/cookies.
- [ ] Deployed on VPS with Nixpacks; DB migrations run; env and secrets configured.
- [ ] No API keys in frontend; auth and AI usage constrained and logged (optional credits).

---

## 13. References

- [Rezi.ai](https://www.rezi.ai) — product reference.
- [rezi-io/resume-standard](https://github.com/rezi-io/resume-standard) — resume schema and parser (MIT).
- Nixpacks: [docs](https://nixpacks.com/docs), [Railway](https://docs.railway.com/builds/nixpacks), [Dokku](https://dokku.com/docs/deployment/builders/nixpacks/).
- Auth: JWT + HTTP-only cookies, bcrypt, refresh rotation (see “JWT session auth TypeScript PostgreSQL” best practices).
- AI: OpenAI API, Anthropic API; use backend proxy and structured prompts for resume/cover letter tasks.

---

*Next step:* Start with Phase 1 — scaffold `apps/api` and `apps/web`, DB schema, and auth endpoints + frontend login so the rest can build on a solid base.
