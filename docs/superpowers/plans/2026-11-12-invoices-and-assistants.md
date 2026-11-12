# Invoice And Assistant Implementation Plan

> Execute natively with superpowers:executing-plans. Preserve the existing worktree.

**Goal:** Finish the secure foundation, make invoice preview and download identical,
then introduce isolated OpenRouter assistants and encrypted administrator key settings.

**Architecture:** Keep React, Supabase Auth, Vercel and the shared API dispatcher.
Use one generated PDF byte buffer for both the PDF.js preview and download, with
jsPDF-AutoTable pagination. Freeze order pricing/seller metadata on the server.
Keep all AI credentials in a separate service-only encrypted table, not app_settings.

**Spec:** docs/requirements/2026-11-11-stevenbmj-evolution.md.

## Constraints And Review Focus

- Work only in StevenBmj/StevenBmj, never another Vercel or Supabase project.
- Preserve all 13 existing profiles and 6 orders observed on 2026-11-12.
- No account deletions or commercial messages during tests; fixtures stay isolated.
- Authorization and single-use reset protections must stay green.
- Long names, notes and multi-page item lists must wrap, never truncate or overflow.
- Currency/language changes must not change stored invoice amounts or seller details.
- An invoice does not imply a confirmed payment or physical-product authenticity.
- Public QR verification must expose no recipient details; random tokens only.
- Never return provider keys, decrypted ciphertext or upstream error details.
- No automatic campaign/payment/contact submission by an AI model.

## Tasks

1. Security readiness: complete remaining session edge cases, bounded SMTP,
   shared browser session refresh, isolate private local data and update vulnerable
   dependencies without forced major upgrades. Tests before behavior changes.
2. Invoice snapshots: additive pricing/seller/verification columns, canonical
   server totals, read-only token verification, owner-only order retrieval. Cover
   expiry, tampered totals, metadata and privacy in real-handler tests.
3. Shared PDF: typed invoice model, jsPDF/AutoTable renderer, embedded Unicode font,
   local logo and QR, repeated headers and totals. PDF.js renders those exact bytes;
   the single download/WhatsApp button saves them without reconstructing anything.
4. Browser acceptance: mobile/desktop, long text, multiple pages, price/currency
   stability, download text/content and exact preview/download buffer equality.
5. OpenRouter: encrypted per-scope key vault and masked CRUD, key testing, bounded
   provider calls and rotation, catalogue-grounded conversation, output-only speech,
   admin assistant and confirmation-only actions. No old Gemini fallback.
6. Continue the remaining delivery/notifications/accounting/design/SEO plans;
   do not mark those complete on the strength of invoice or chat tests.

## Progress

- [x] Local session/security fixes and dependency audit; production rollout pending.
- [x] Canonical invoice snapshots and private verification in code/migrations.
- [x] Shared PDF renderer and preview.
- [x] PDF/browser regression tests and visual checks.
- [x] Encrypted OpenRouter configuration and assistants, verified with provider fixtures.
- [ ] Remote readiness, reviewed migration, correct-repository publication checks.
- [ ] Live OpenRouter chat/speech, SMTP and Google acceptance after coordinated setup.
- [ ] Drivers, signed delivery and private notification/PWA workflow.
- [ ] Full accounting/payment/cost ledgers, remaining design/FR-EN/SEO and MFA work.

## Execution Evidence, 2026-11-12

- 44/44 unit and real-handler tests pass. External Supabase/provider HTTP is
  replaced by isolated fixtures; no live client accounts or messages are created.
- 26/26 production-build Chrome browser scenarios pass on desktop and mobile.
  Responsive checks include 320, 360, 375, 390, 412, 430, 768, 820, 1024 and 1280px.
- PDF text extraction checks all 30 test articles, full notes and Unicode names;
  geometry stays inside page borders. SHA-256 confirms the preview/download are
  the exact same bytes. Canvas pixel checks confirm actual text and gold content.
- RED/GREEN regressions: cross-account invoice/draft restore, destructive invoice
  editing, desktop navigation overflowing at 768px, mismatched item/totals, and
  a client deleting a paid-but-pending order.
- OpenRouter tests cover AES-GCM scope/id binding and corruption, privileged CRUD,
  prompt isolation, bounded history, nonexistent products, rate limits, signed
  speech, private admin audio and at most two provider attempts per request.
- Fixed a test-fixture clock race: tokens are stable through a test run instead
  of changing when a request crosses a wall-clock second.
- Removed the old Gemini runtime, dependency and local variables. Generated the
  local encryption master key without displaying it; it remains ignored by Git.
- Replaced demonstration analytics with real order-period reports and CSV export.
  Unknown payments, costs, profit and visitor conversion are not fabricated.
- Initial application chunk reduced from approximately 336KB to 188KB (uncompressed)
  by loading administration/checkout/PDF modules on demand; this is a bundle-size
  observation, not a claim of measured end-user load-time improvement.
- `npm run lint`, `npm run build`, normal `git diff --check` and `npm audit` pass;
  audit reports zero known vulnerabilities. Lazy PDF bundle size warnings remain.
- Secret-pattern/source check and checks against the actual private environment
  values found no matches in the built client bundle. Git history is NOT cleaned;
  credentials previously disclosed still need provider-side rotation.
- Combined migration check verifies project Bmj/elpfuvzfyogogavbmahq, private
  grants and unchanged profile/order counts, then ROLLS BACK. No persistent remote
  migration, Git push or Vercel deployment has been performed.
- Correct Git remote verified. Current GitHub CLI identity has pull=true/push=false;
  Vercel identity lookup failed and reported logged out. A secure re-login was
  requested; no new tokens should be pasted into this conversation.
- Local preview http://localhost:3002. HTTP smoke: homepage/products/settings 200,
  private fields absent from settings, session/users/orders/AI-keys anonymous 401.
  Authenticated local workflows require the coordinated schema rollout.
- Final review: self-review (no subagent tool), not an independent penetration test.
  Fixed both review findings with observed failing tests followed by green suite.

## Remaining Release Risks

- Provider/model credits and voice compatibility remain unverified with real keys.
- The security migration must ship with the matching API/frontend, not on its own.
- Payment events, inventory reservation and delivery proofs need transactional
  workflows; this phase does not claim atomic stock reservation or certified books.
- Legacy admin order deletion and log purging require an archival/audit-retention
  policy in the next business workflow phase; do not infer tamper-proof accounting.
- No remote secret rotation, independent pentest, real-device push or second-engine
  browser acceptance has yet been completed.

## Rulings

- User asked to continue all corrections without more repeated approval prompts.
  Execute the previously approved modular approach and maintain this ledger.
- Do not apply the legacy-settings purge while the old production frontend still
  depends on it. Prepare and test migrations, then coordinate the release.
- External credentials and platform permissions may still prevent live provider,
  WhatsApp Business, push or deployment checks; never simulate successful delivery.
