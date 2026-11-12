# OpenRouter And Release Readiness

## Server Configuration

Use `.env.local` locally and the environment variables of **stevenbmj** on Vercel.
Never configure private keys with a `VITE_` prefix or paste them into a chat.

`AI_ENCRYPTION_KEY` must be 32 cryptographically random bytes encoded as base64.
Generate it in a private local terminal:

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64'))"
```

Keep the same encryption key across deployments and keep a restricted backup.
Losing/changing it makes the existing encrypted provider records unreadable.
Rotation requires decrypting/re-encrypting records with both old and new keys in
a controlled server-side maintenance operation, not changing the variable alone.

`AI_DAILY_REQUEST_LIMIT` defaults to 500, maximum 1000. The persistent shared
ceiling includes text and provider speech requests. Also set spending limits in
OpenRouter. Multiple keys distribute requests; they do not combine quota into
unlimited capacity, increase model intelligence or broadcast every question.

## Administrator Setup

Open administration > Assistants & API. Client and administrator keys are separate.
Add a name, OpenRouter key and an existing chat model identifier. The saved key
cannot be displayed or exported; only its final four characters are listed.
Add multiple keys, test credentials, enable/disable or delete them independently.
To replace a key or model, add the new record, test it, then disable the old record.

Speech is optional. Select a compatible MP3 speech model and its documented voice.
The provider documentation currently includes, for example,
`openai/gpt-4o-mini-tts-2025-12-15`. Model availability, credits and language/voice
support must be checked on the provider account. Text and speech models differ.
If provider speech is unavailable, the browser uses a device voice when supported.
The visitor must enable voice; no microphone is requested or recorded.

The model can recommend catalogue items and prepare a contact draft. Adding to
the cart and opening the prefilled contact form require explicit clicks. The
model never submits a contact message, payment or campaign by itself.

## Coordinated Release

- Confirm origin is `StevenBmj/StevenBmj`, Vercel project is `stevenbmj` and
  Supabase reference is `elpfuvzfyogogavbmahq` (project `Bmj`).
- Rotate previously disclosed credentials with their providers. Removing the
  tracked JSON snapshot does not remove secrets from Git history.
- Run lint, unit tests, production build, browser tests, audit and secret checks.
- `npx tsx scripts/security-migration.ts --check` validates all five migrations
  in one transaction and rolls back. It verifies the target identity, data counts
  and private grants. This does not apply persistent changes.
- For an authorized coordinated deployment, `--apply` requires a fresh encrypted
  business-data backup with restoration checks, takes restricted metadata and applies
  the release transaction. Do not apply the settings
  purge while an old production frontend still relies on the legacy settings.
- The release registry rejects modified already-applied migrations and permits
  retries without reapplying completed files. Do not run the old seed/schema
  script afterwards: it can recreate obsolete public policies.
- Publish a preview, perform real email/Google/OpenRouter checks using authorized
  test identities, then release the matched code/schema version and smoke-test.

## Verified Locally, Not A Security Guarantee

Tests cover session boundaries, private configuration, code replay, ownership,
encrypted credentials, scoped prompts, signed speech, PDF geometry and exact
preview/download byte equality. Five Supabase migrations have now been applied.
The owner confirmed reception of two real messaging checks. These checks do not
imply that every external provider or real-device workflow has passed acceptance.
No independent penetration test or claim of invulnerability is made.

Delivery/signature workflows, private notifications, push/PWA, payment/cost ledgers,
FR/EN interface and SEO updates, and administrator MFA are implemented. Consult
[the release evidence](2026-11-12-release-progress.md) for current verification,
publication, credential retirement and remaining external acceptance. Do not use
this setup guide as evidence of a completed production release.
