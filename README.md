# Vitan Task Backend

Express API with modular architecture (Service Container + Module Loader). Deployed to Railway using `backend/Dockerfile.railway` and `backend/railway.json`.

## Apply RBAC Migration (Postgres)

The RBAC schema (users, permissions, role_permissions, etc.) is defined in:
- `database/migrations/001_create_dynamic_roles.sql`

If logs show errors like `relation "users" does not exist`, it means migrations haven’t been applied yet.

Options to apply:

- Quick one‑time apply (psql):
  1) Ensure `DATABASE_URL` is available for your Railway Postgres instance.
  2) Run:
     ```bash
     psql "$DATABASE_URL" -f database/migrations/001_create_dynamic_roles.sql
     ```

- Using a SQL client: Open the file and run it against the Railway database.

After applying, restart the backend service. The Google OAuth flow will be able to persist users and roles, and any future endpoints relying on these tables will work.

## Environment
- `PORT` — defaults to `3000` locally; Railway sets `PORT` dynamically.
- `DATABASE_URL` — Postgres connection string.
- `AUTH_JWT_SECRET` or `JWT_SECRET` — JWT signing.
- `GOOGLE_CLIENT_ID` — Google OAuth audience verification.
- Optional SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

## Health & Modules
- Healthcheck: `GET /health`
- Modules list: `GET /api/modules`
- Module health: `GET /api/modules/:moduleName/health`
