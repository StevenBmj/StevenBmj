# Login, Startup And Administrator Agent Follow-up

Target: `StevenBmj/StevenBmj`, Vercel project `stevenbmj`. No customer, password or provider-key changes are part of this follow-up.

## Administrator Login

The real Supabase Auth client replaces its request authorization after password login or session refresh. Reusing that instance for privileged profile/session queries therefore made valid credentials fail against correctly protected tables.

Commit `c5e1d33b34ed402127b0c9fea7ced5206f4d7c03` separates public-key user authentication from the service-role database client, without weakening permissions. Strict HTTP-level regression fixtures reject private table queries made with a user bearer. The owner confirmed successful production administrator login using their own new password. No password was requested or changed by the agent.

## Startup

- The introductory component existed but was not rendered. A stable, skippable, one-second animation now runs independently of catalogue/settings requests, with a shorter reduced-motion duration. Internal navigation does not replay it.
- Initial HTML contains a branded fallback before JavaScript runs.
- Header/footer/intro logos use a 45,682-byte WebP instead of the original 1,559,695-byte PNG. Original artwork remains available for existing document/social uses. `scripts/optimize-brand-assets.mjs` reproduces the resized assets.
- PWA installation no longer preloads the oversized original. Versioned caches remove obsolete public caches, without intercepting private APIs or documents.
- External fonts load as a non-render-blocking enhancement; a browser test holds their response indefinitely while verifying that the application becomes usable.
- Public indexing configuration has a short, deduplicated cache and bounded lookup. Private/preview HTML does not wait for this database query. Settings saves invalidate the local cache; other warm instances expire within 30 seconds.
- The Vercel entry loads internal API handlers only for API requests.

These changes reduce startup work. They do not guarantee identical response times across devices, networks or cold server instances.

## Visible Management Agent

The management conversation was previously below the API-key form, visible only after choosing the administration scope. It now has its own `Agent IA` sidebar entry and dashboard shortcut.

`/god?section=advisor` opens the conversation. Its configuration button opens `/god?section=assistants&scope=admin`. Both routes survive reload. The management workspace scrolls into view on narrow screens. Existing client and administration keys remain independent, encrypted and server-only; no key was copied between pools.

Browser responses for conversation tests are isolated fixtures, not evidence of a live paid model response. Real text/voice acceptance requires an enabled OpenRouter key and compatible model in the corresponding administration scope. No automatic campaign or purchase is triggered by exposing this panel.

## Verification

- Full unit suite: 92 passed, including strict login/refresh authorization, scoped assistant permissions, invoice bounds, delivery workflows and metadata-cache invalidation.
- TypeScript and production build passed.
- Startup and native navigation: all 20 desktop/mobile scenarios passed, including deliberately delayed catalogue/fonts, no-JavaScript branding, cart/invoice retention and verified sessions.
- Assistants, administration and account dialogs: the final focused run passed all 10 desktop/mobile scenarios. The mobile language check uses the actual mobile menu rather than the hidden desktop control.
- Desktop/mobile agent screenshots were visually inspected; the panel remains within the viewport and provides the separate management conversation.

Publication and live probe results are recorded separately by the release smoke script. No independent penetration test or live provider latency guarantee is implied.
