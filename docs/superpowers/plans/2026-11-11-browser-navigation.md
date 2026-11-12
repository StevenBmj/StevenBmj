# Browser Navigation Correction

## Scope

Fix the reported inability to go back step by step. Keep the current React app,
catalogue, cart and ongoing server-session work. Do not publish unrelated pending
features or change live accounts. User explicitly requested the correction.

## Cause And Approach

App.tsx changes a local view variable without adding browser history entries.
Its popstate handler only recognizes the admin page. Product identity exists only
in memory, so reload loses it. A saved invoice also reopens checkout on every mount.

Use the standard History API with an allowlisted URL-to-view mapping and a shared
navigation context, not a new framework. Keep AppProvider mounted on page changes;
session cookies and private authorization remain independent of navigation.
Represent cart and checkout as URL panels. Direct-entry back buttons have an
internal fallback, never an unconditional jump to an external referrer.

## Checklist

- [x] Investigate App, header, product, cart and checkout navigation.
- [x] Reproduce the incorrect URL/history behavior in a real browser.
- [x] Add shared URL navigation and connect all page changes and shopping panels.
- [x] Add a visible accessible back action without duplicating product's existing one.
- [x] Verify Back/Forward/reload, retained client identity and saved cart on desktop/mobile.
- [x] Run the entire unit suite, TypeScript, production build and diff checks.
- [x] Record limits and provide the local preview URL.

## Verification And Limits

- RED: clicking Catalogue left the URL at `/` instead of `/boutique`.
- Browser regression: intro could reappear behind the restored cart; now limited
  to the home page and remembered per tab. Tests no longer race its skip button.
- GREEN: 26 node tests and 12 Chrome browser scenarios passed (desktop + mobile).
- Browser fixtures replace API responses only; no accounts, emails or orders
  were created in Supabase. These are navigation/session-continuity tests,
  not a live sign-in or external security audit.
- TypeScript, production build and `git diff --check` passed. The existing large
  PDF bundle warning remains. Installing the test runner reported 11 dependency
  vulnerabilities; dependency remediation remains part of the security work.
- Screenshots checked on desktop and mobile: return action and menu are visible.
- Preview: http://localhost:3000. No Git push or Vercel publication in this task.
- Previous server-session migration and the broader AI/delivery/accounting work
  are not declared complete by this navigation correction.
- Review performed locally; no independent reviewer tool available.

## References

Follow-up 2026-11-12: the blocking intro was removed, the tablet/landscape menu
breakpoint corrected, and all 26 current browser scenarios pass. Dependency audit
now reports zero known vulnerabilities. Current preview: http://localhost:3002.

- https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API
- https://playwright.dev/docs/test-webserver
