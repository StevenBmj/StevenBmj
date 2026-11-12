# StevenBmj Release Evidence

Date: 2026-11-12, Europe/Paris. This file records verified progress, not an assertion that every requested capability has passed live acceptance.

## Targets And Preservation

- Workspace: `C:\Users\HP\Downloads\stevenbmj (2)`.
- GitHub: `StevenBmj/StevenBmj`; Vercel: `stevenbmj`, project `prj_38yP9DMon1MsVA5y1QZpFkfVLFX1`.
- Supabase: `elpfuvzfyogogavbmahq`, `Bmj`. The owner confirmed that this database serves StevenBmj only.
- The incoming owner commit was merged and retained. The unrelated `.kilo/` directory is untouched.
- Existing 13 profiles, 6 orders and 21 products were preserved. No customer accounts were deleted.

## Database And Media

Five additive migrations were applied through `scripts/security-migration.ts --apply` after a rolled-back rehearsal and an encrypted public-table backup with local restoration/checksum verification.

The changes cover private sessions/settings, invoice snapshots, encrypted assistant credentials, delivery/payment/notification/expense records and advisor hardening. Existing orders retain their historical status without invented payments or stock reservations. The release registry prevents accidental reapplication.

The backup exercise restores public-table data and exports security/schema metadata. It is not a complete Supabase Auth, Storage, role or disaster-recovery rehearsal. Keep the encryption key and encrypted snapshots privately backed up.

One inline catalogue photo was moved to the public `stevenbmj-catalogue` media bucket. The original bytes were checked by SHA-256 before replacing the database reference, with a parameterized compare-and-swap update. Catalogue data decreased from 2,926,416 to 28,891 bytes. Original image contents remain in the encrypted pre-change snapshot. Anonymous users receive public product photos, not permission to upload them; imports require a verified administrator and raster format/size validation.

The security advisor now reports only the disabled compromised-password protection option. Supabase's built-in option requires an eligible plan; no paid upgrade has been authorized. This warning is not marked resolved.

## Messaging

- Activation and recovery retain one-use, hashed, five-minute codes, real remaining time and resend limits.
- The owner confirmed primary-inbox reception of the initial messaging check.
- The real internal outreach-handler/SMTP test was accepted and the owner also confirmed receiving `Un message de StevenBmj`.
- This second test exercised the actual outbound handler and storage, not interactive administrator password login. It did not create an account, purchase or WhatsApp message.
- Email is sent by the server after recipient/consent/send confirmation. Duplicate request identifiers cannot resend or substitute a different message.
- WhatsApp opens a prefilled message for manual sending. Automatic WhatsApp delivery is not implemented without a Business Platform account, permissions and approved templates.

## Navigation And Documents

The native-history change seeds finite in-site predecessor entries for direct product/account/checkout entry and preserves them on reload. Android browser back gestures and buttons use that history; transient authentication, password, policy and notification windows have history-aware dismissal. Session identity continues to come from HttpOnly cookies and server verification.

The root-page guard is finite: this must not trap a visitor in an endless history loop. Operating-system Home, task closing and an intentional final departure cannot be blocked by a website. Real Android device acceptance remains distinct from simulated mobile browser history tests.

Invoices use one canonical PDF buffer for both canvas preview and download, including logo, QR, text and pagination. The logo is rendered at appropriate print resolution and PNG compression is bounded to reduce preparation work. Exact-byte equality, text retention, pixel checks and page bounds remain regression assertions.

## Assistants And Reports

Client and administrator OpenRouter pools are separate and encrypted. No provider secret is returned to the client. The client advisor uses real catalogue/public content, explicit cart/contact confirmation and optional output-only voice. Multiple keys distribute concurrent requests; they do not merge provider quotas or require broadcasting every question.

Management advice uses a chosen reporting period and recorded payment/refund/expense summaries. Generated customer messages remain drafts until the administrator selects a real recipient and confirms consent and sending. No model can execute purchases, payments, campaigns or arbitrary code.

Cash and sales reports separate currencies and payment evidence. Cash reads are paginated, integer overflow is refused, comparisons and CSV/PDF exports are available, and VIP ranking uses paid purchases. These are management reports, not certified tax accounts or a balance sheet assembled without opening balances and cost data.

No real OpenRouter provider key has been supplied for end-to-end text/voice acceptance. Add keys in administration rather than in chat. Google account selection remains the official Google flow; the site cannot silently enumerate accounts on a device.

## Verification And Publication Status

- Latest completed full unit run, including the final invoice optimization, FAQ-history regression and retired-seed guard: 85 passed.
- TypeScript and production builds passed; production dependency audit reported zero known vulnerabilities.
- Full desktop/mobile browser verification passed: 54 tests, including exact PDF equality, native history, account retention, narrow navigation, legal documents and driver/customer receipt workflows. Metadata outage handling, oversized registration-dialog scrolling, invoice image preparation and FAQ anchor preservation were corrected after reproducing their failures.
- The latest protected preview passed all 23 public/private routing and deployment probes. The final FAQ anchor change is included in the local build being tested before publication.
- Preview routing was corrected to process the home page before static-file resolution. Explicit Node ESM imports fixed the preview API startup error.
- Modern Supabase keys, the stable vault key, independent code secret, Google client IDs and push keys were synchronized only to `stevenbmj` production/preview environments.
- Final production publication, legacy API/signing-key retirement, database-password replacement and post-release probes must be recorded below after they actually succeed. These are not implied by a successful preview build.
- The old plaintext seed command is disabled rather than allowed to restore shared passwords or overwrite a protected live database. A regression test verifies that it exits without changing data. A scan of staged files and public build assets found none of the nine actual private environment values checked.

## Owner Actions And External Acceptance

Configure and test real OpenRouter chat/voice models and spending limits. Enable administrator TOTP using an authenticator and keep its backup; loss of that factor requires owner-controlled Supabase Auth recovery. Test Google on the production origin and push permissions/installation on real devices. Rotate/revoke the old GitHub, Vercel and Supabase management tokens from the provider accounts without pasting new ones into chat.

An initial administrator password was present in the retired seed script and therefore may remain in Git history. The owner explicitly chose to change their own password. No administrator password change or account deletion was performed by this release. Change that password promptly using the verified recovery flow; removing it from current source is not revocation.

Device push depends on browser support, permission, network and a valid active session. Current persistent retries are resumed by dispatching workflows and active inbox polling; no continuous off-site retry scheduler has been claimed. No independent penetration test, guaranteed delivery/latency, legal certification or invulnerability is asserted.
