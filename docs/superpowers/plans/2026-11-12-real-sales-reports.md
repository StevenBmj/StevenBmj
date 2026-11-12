# Real Sales Reports

Continue the approved evolution inline. Remove demonstration analytics before
exposing administration summaries to the AI. Keep invoices, accounts and stock.

1. Add pure, tested date-range/report helpers: business timezone, inclusive dates,
   current/prior period, integer minor units and separate currency totals.
2. Read only authorized orders, with bounded pagination and an explicit truncation
   indicator. Distinguish paid, pending, unknown, refunded and cancelled orders.
3. Replace hardcoded dashboard numbers/charts with real period comparisons, top
   products/customers, date filters and CSV export. No invented profit or traffic.
4. Use aggregate report data, not secrets or whole private records, for admin AI.
5. Run unit/handler/browser checks and update the main ledger. This is a sales
   reporting foundation, not an official tax balance sheet or a cash-flow ledger.

- [x] Tests reproduce demonstration figures.
- [x] Real server reports and authorization.
- [x] Admin report UI, comparisons and export.
- [x] Browser and unit verification.

Evidence: three unit/handler tests and two Chrome browser cases (desktop/mobile)
pass. The broader suite is 44 unit/handler and 26 browser cases. Reports separate
currencies, use Africa/Porto-Novo dates, permit explicit comparison periods and
export both periods. No fake traffic, margin, revenue growth or profit remains in
the analytics endpoint/dashboard. This is not a full bookkeeping/payment ledger.

Ruling: Missing cost, payment-date and fiscal data must remain explicitly unknown;
do not infer profit, actual cash-flow dates or visitor conversion from orders.
