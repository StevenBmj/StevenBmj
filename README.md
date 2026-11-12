# StevenBmj

React/Vite boutique with a shared TypeScript API for local Express and Vercel,
Supabase authentication/data, server-priced orders and matching PDF invoices.

## Development

1. Use Node.js 24 and run `npm ci`.
2. Configure `.env.local` from `.env.example`. Private secrets stay server-side.
3. Run `npm run dev` and open `http://localhost:3000`.

The OpenRouter advisor is configured in administration > Assistants & API.
The previous Gemini integration is no longer used. See
[server setup and release checks](docs/operations/openrouter-and-release.md).

## Verification

```powershell
npm test
npm run lint
npm run build
$env:PW_CHANNEL='chrome'
$env:PW_PRODUCTION='1'
npm run test:browser
npm audit
```

Browser tests use isolated API fixtures and never create real clients or send
commercial messages. Migrations must be reviewed against the linked project;
do not run legacy seed scripts on an existing production database.

Requirements and progress: [evolution record](docs/requirements/2026-11-11-stevenbmj-evolution.md)
and [implementation plan](docs/superpowers/plans/2026-11-12-invoices-and-assistants.md).
