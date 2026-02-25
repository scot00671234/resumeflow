# Production deployment checklist

## Environment variables (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/resume`) |
| `JWT_SECRET` | Secret for access tokens (min 32 characters) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (min 32 characters) |

## Environment variables (recommended for production)

| Variable | Description |
|----------|-------------|
| `APP_URL` | Public URL of the app (e.g. `https://yourapp.com`) — used for verification links and redirects |
| `WEB_ORIGIN` | Allowed CORS origin; usually same as `APP_URL` when frontend is served from API |
| `NODE_ENV` | Set to `production` (Nixpacks sets this automatically) |

## Email verification (optional)

**Recommended: Resend** — 3,000 emails/month free. No SMTP setup.

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (e.g. `re_...`) |
| `RESEND_FROM` | From address (default: `ResumeFlow <onboarding@resend.dev>`; use your verified domain later) |

**Alternative: SMTP**

| Variable | Description |
|----------|-------------|
| `SMTP_URL` | SMTP connection URL (e.g. `smtps://user:pass@smtp.example.com:465`) |
| `EMAIL_FROM` | From address for verification emails |

If neither `RESEND_API_KEY` nor `SMTP_URL` is set, signup still works but no verification email is sent.

## After first deploy

1. **Migrations** run automatically on every deploy (before the API starts). If you need to run them once manually: `DATABASE_URL="your-production-url" npm run db:migrate --workspace=apps/api`.

2. **Check health** — open `https://yourapp.com/health`. You should see `{ "ok": true, "db": "connected" }`. If you see `"db": "disconnected"` or 503, fix `DATABASE_URL` and ensure the database is reachable from the server.

3. **Test signup** — create an account. If you see "Request failed" or 502, check server logs; usually the cause is missing or wrong `DATABASE_URL` or migrations not run.
