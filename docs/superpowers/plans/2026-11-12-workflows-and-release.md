# Remaining Workflows And Release

**Goal:** Continue the approved modular evolution without losing business data or deploying an incomplete schema/code combination.
**Spec:** `docs/requirements/2026-11-11-stevenbmj-evolution.md`; latest owner requests exclude Blog and Formations.
**Execution:** Native, in the existing workspace/branch. Keep the unrelated `.kilo/` directory untouched. No repeated design approval is required: the owner has asked to finish the approved programme.

## Work Packages
- [ ] Delivery and payments: approved driver applications, availability, admin payment verification, transactional stock allocation and assignment, driver acceptance/pickup/delivery, immutable signed receipt, customer confirmation/dispute and private event history.
- [ ] Notifications/PWA: actual per-user unread counts, session-bound push subscriptions, opt-in permissions, safe public-only service worker caches, real delivery events and retryable push dispatch.
- [ ] Management: payment/refund and cost records, deterministic cash-flow reporting, real VIP ranking and honest email/WhatsApp delivery status, protected searchable security archive.
- [ ] Storefront: verified cached exchange rates, current SEO metadata/sitemap, complete FR/EN and responsive review, existing product/settings/review/contact acceptance tests.
- [ ] Release: reconcile incoming owner changes, complete secret/dependency checks, additive migrations with rollback/backup validation, correct GitHub repository and Vercel preview, authorised live acceptance and publication.

## Transaction And Privacy Rules
- Only verified server sessions determine identity. Applying to drive never grants approval or admin access.
- A driver sees only assigned orders; the customer sees only their orders. Notifications never cross accounts.
- SQL functions are service-role-only, SECURITY INVOKER, with fixed search_path and explicit actor checks. Order/driver/product locks and expected versions protect concurrent state changes.
- A manual payment confirmation is an administrator attestation with amount/currency/reference, not an invented payment-provider callback. No fake profits, costs or delivery guarantees.
- A signature records acknowledgement on the driver's device, not independent proof of identity or automatic satisfaction. Allow damaged-goods remarks and later customer dispute.
- Keep signed receipts/events immutable; archive instead of deleting business history. Never put signatures or private responses in a shared browser cache.
- Push and WhatsApp delivery must report actual provider results. Missing platform credentials or permissions remain explicit setup dependencies, not simulated success.
- Do not send test campaigns, create fake Gmail addresses, delete customers, force-push, or overwrite the incoming owner commit.

## Verification
Write failing handler/transaction tests first. Cover role/ownership, malformed payloads, unapproved drivers, illegal transitions, duplicate/replayed requests, stock conflicts and signed receipt immutability. Run the project test command, TypeScript, production build and focused/full browser workflows. Test migrations in a rolled-back transaction before applying a coordinated release. Record commands/results and external dependencies below as work progresses.

## Progress

- [x] Implemented delivery/payment/stock/signature ownership and replay guards; SQL transaction tests passed and additive workflow migration applied without deleting business records.
- [x] Added actual private inbox/section counts, session-bound push subscriptions and public-only PWA caches. Real device acceptance and off-site retry scheduling remain separate open items.
- [x] Added cash journal pagination, expense comparisons, paid-purchase VIP ranking, searchable security archives and server-side email/manual WhatsApp outreach.
- [x] Owner confirmed receiving both authorized email checks, including the real outreach-handler test. No fictitious mailbox or campaign was used.
- [x] Merged the incoming owner changes; verified encrypted public-table restoration and applied the five release migrations. Catalogue media reference changed only after original-byte verification.
- [x] Reproduced direct-entry native back leaving the app; implemented finite predecessor history and history-aware transient windows. Full desktop/mobile browser suite passed all 54 tests, including PDF equality, account retention and footer navigation.
- [x] Completed full browser/PDF tests, protected-preview probes, correct-repository push and automatic production publication. Repeated all 23 production probes after retiring the exposed legacy Supabase keys and replacing the database password.
- [x] Added the FAQ fragment/native-back regression and retired both unsafe legacy maintenance commands. Final checks passed: 86 unit tests and 32 focused navigation/footer tests, in addition to the earlier full 54-test browser run.

See `docs/operations/2026-11-12-release-progress.md` for actual evidence and remaining external setup. The unchecked work-package items above intentionally remain open until their acceptance/release requirements are satisfied.
