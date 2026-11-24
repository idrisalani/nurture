# NurtureNet

Nigeria-first, multilingual (English, Hausa, Yoruba, Igbo, Pidgin) parental control and digital safety app.

| Folder | What it is |
|---|---|
| `backend/` | Node/Express API (Postgres, Redis, JWT). Tests: `cd backend && npm test` |
| `database/` | SQL migrations (`migrations/`), dev seed. `backend/scripts/migrate.js` applies them |
| `apps/parent/` | Parent app (Expo / React Native, TypeScript) |
| `apps/child/` | Child Android app: policy engine + native enforcer (Kotlin Expo module) |
| `docs/` | User's Guide, Business Plan, Deployment Guide, Pitch Deck, Financial Plan, Glossary, Postman collection |
| `render.yaml` | Render Blueprint: API, Postgres, Redis |

## Deploy (Render)
1. Push to `main`. In Render choose New > Blueprint and select this repo (or let your assistant create it).
2. Render creates `nurturenet-api`, `nurturenet-db`, `nurturenet-redis`. JWT secrets are generated. Migrations run on every start.
3. Add the optional secrets in the API service's Environment tab when you have them:
   `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `FLUTTERWAVE_SECRET_KEY`, `TERMII_API_KEY` (SMS and OTP),
   `ANTHROPIC_API_KEY` (AI alerts), `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` (push). Without them those features are off; the API still runs.
4. Check `https://<your-service>.onrender.com/health`.
5. Point the apps at it: build both with `EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com/api/v1`.

Free plans sleep after 15 minutes without traffic (first request takes about 30 s) and the free database expires after 30 days. Use paid plans for a pilot. The child app's SOS and rule sync should not depend on a sleeping server.

If you put nginx in front of the API instead of Render, set `underscores_in_headers on;` or the child phone's `device_id` / `child_id` headers are dropped.

## Local
```
# needs local Postgres 14+ and Redis; set DATABASE_URL and REDIS_URL in .env
cd backend && cp ../.env.example .env && npm ci && npm run migrate && npm run dev
```
See `apps/parent/README.md` and `apps/child/README.md` for the apps.
