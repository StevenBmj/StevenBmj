# Secure Sessions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Track the RED/GREEN results below.

**Goal:** Close anonymous administrative access and restore real client/admin sessions without deleting existing accounts.

**Architecture:** Keep React/Vite, Supabase Auth and Vercel. Use verified Supabase sessions in HttpOnly cookies, with server-side session revocation and database-backed rate limits. Express dispatches the same API handlers as production; it no longer synchronizes a mutable JSON database.

**Tech Stack:** TypeScript, React, Express, Supabase, node:test through tsx.

**Spec:** `docs/requirements/2026-11-11-stevenbmj-evolution.md`, phase 1 approved by the user.

## Global Constraints

- Work only in the existing project folder and StevenBmj/StevenBmj repository.
- Preserve all existing accounts, orders and products; no bulk deletion.
- No secret or session token in public JSON, frontend storage or tracked database snapshots.
- Browser roles are not authorization; check the verified user and profile for every private request.
- Existing email verification codes remain valid for five minutes; newly issued codes are cryptographically random and stored as hashes.
- Finish this foundation before storing AI keys; later feature phases remain outstanding.

## Review Focus

- A valid client session must never authorize admin actions or another client's records.
- Missing/malformed/expired cookies and revoked sessions must fail closed, including refresh/logout.
- Public settings must omit private fields, including unknown newly introduced secret fields.
- Cross-origin writes, repeated verification attempts and concurrent code redemption must be refused.
- Local routes and direct production handlers must enforce the same rules.

## Task 1: Reproduce the vulnerabilities

Files: `tests/security.test.ts`, `tests/helpers/api.ts`, `package.json`.

- [x] Add real-handler tests with a simulated external Supabase HTTP boundary.
- [x] Demonstrate anonymous settings/product/user mutations failing expected 401 assertions.
- [x] Demonstrate private settings leaking before the fix.
- [x] Run `npm test`: expect failed authorization assertions, not network errors.

## Task 2: Shared security and session boundary

Files: `src/server/security.ts`, `api/auth/session.ts`, `tests/security.test.ts`.

Interfaces: `requireUser(req,res,adminOnly?)`, `setSession(req,res,session)`,
`clearSession(res)`, `assertSameOrigin(req,res)`, `authRateLimit(req,res,scope,limit,windowSeconds)`,
`publicSettings(data)`, `hashCode(email,purpose,code)`, `issueVerifiedSession(req,res,email,id)`.

- [x] Tests first: legitimate session, client/admin split, revoked session, foreign Origin, secure cookies.
- [x] Implement HttpOnly/SameSite cookies, verified provider identity, active DB session and confirmed profile checks.
- [x] Implement session refresh, revocation and safe public session JSON.
- [x] Add a public settings allowlist and hashed code helpers.
- [x] Run targeted tests through tsx/node:test; expect PASS.

## Task 3: Protect API capabilities and authentication

Files: `api/settings.ts`, `api/products.ts`, `api/shop.ts`, `api/auth/*.ts`, `api/auth/users/[id].ts`, `api/auth/admin/change-password.ts`.

- [x] Tests first: account ownership, private list guards, registration never grants admin, code replay and no raw reset tokens.
- [x] Gate settings/products/promos/announcements/logs/analytics/VIP administration.
- [x] Require a confirmed session for order creation and private reads; enforce ownership.
- [x] Reject bulk account deletion; allow own-account deletion only and never delete an admin through this route.
- [x] Authenticate login, Google and activation into real sessions; validate refresh through the session registry.
- [x] Reset passwords using a profile-bound, expiring, single-use hashed email code, not public settings.
- [x] Recompute order prices/promotions from current product records on the server.
- [x] Run the entire security suite and TypeScript check.

## Task 4: Database safeguards

Files: generated `supabase/migrations/*_secure_sessions.sql`, migration utility if needed.

- [x] Generate a migration using the available CLI, after checking its help/version.
- [x] Add service-only `web_sessions`, `security_rate_limits` and a rate-limit RPC; enable RLS and revoke public access.
- [ ] Remove public direct access to settings/promo inventories and purge legacy private settings keys without touching business data.
- [ ] Save a restricted local backup of affected metadata before any remote migration.
- [ ] Apply only after verifying the linked project; run non-destructive policy/session checks.

## Task 5: Integrate the browser and local server

Files: `src/lib/api.ts`, `src/context/AppContext.tsx`, `src/components/AuthModal.tsx`, `src/components/GodDashboard.tsx`, `src/components/Header.tsx`, `src/components/CheckoutModal.tsx`, `src/server/apiRouter.ts`, `server.ts`, `vercel.json`, `.gitignore`, `.vercelignore`.

- [x] Tests first for refresh/retry, route dispatch, public settings and session restore.
- [x] Restore identity from the server, remove trusted localStorage/sessionStorage roles and fake Google admin login.
- [x] Use a same-origin fetch helper with one deduplicated refresh and one retry.
- [x] Gate admin data requests until the server confirms an admin session; show authentication failures.
- [x] Remove admin password values from site configuration; use the email recovery flow.
- [x] Route local requests to the production handlers; remove legacy JSON writes and demo account creation.
- [x] Stop tracking the local database snapshot without deleting the local file.
- [x] Run `npm test`, `npm run lint`, `npm run build`, and `git diff --check`.
- [x] Start a local server; verify public browsing and denied anonymous admin requests over HTTP.
- [ ] Review the whole diff separately, record limits, and commit the isolated phase.

## Execution Record

- Follow-up 2026-11-12: local implementation verified with 44 unit/handler tests,
  26 browser scenarios, TypeScript/build and dependency audit. Combined security,
  invoice and key-vault migrations validated against Bmj and rolled back. The
  unchecked remote/backup/apply items remain pending a coordinated release.

- Baseline: TypeScript check passed during audit; no automated suite existed.
- Workspace ruling: use a feature branch in the existing directory, honoring the user's explicit folder requirement; no worktree elsewhere.
- Execution: native, no subagent tools available; final review will be self-review, not an independent audit.
- Publication ruling: this is phase 1; do not present the remaining AI/delivery/PWA/accounting overhaul as completed or publish an incomplete full redesign.
