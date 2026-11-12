import { periodRange, BUSINESS_TIME_ZONE, type SalesPeriod } from './reports.js';

export function cashReport(payments: any[], expenses: any[], period: SalesPeriod, truncated = false) {
  const sum = (a: number, b: number) => {
    const result = a + b;
    if (!Number.isSafeInteger(result)) throw new Error('Cash report amount overflow');
    return result;
  };
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
  const aggregate = (from: string, to: string) => {
    const totals = new Map<string, { currency: string; receiptsMinor: number; refundsMinor: number; expensesMinor: number; netCashMinor: number }>();
    const bucket = (currency: string) => {
      if (!['EUR', 'USD', 'XOF'].includes(currency)) return null;
      if (!totals.has(currency)) totals.set(currency, { currency, receiptsMinor: 0, refundsMinor: 0, expensesMinor: 0, netCashMinor: 0 });
      return totals.get(currency)!;
    };
    for (const payment of payments) {
      const instant = new Date(payment.created_at);
      if (!Number.isFinite(instant.getTime())) continue;
      const date = day.format(instant);
      if (date < from || date > to) continue;
      const amount = Number(payment.amount_minor);
      if (!Number.isSafeInteger(amount) || amount <= 0) continue;
      const total = bucket(payment.currency);
      if (!total) continue;
      if (payment.kind === 'payment') total.receiptsMinor = sum(total.receiptsMinor, amount);
      else if (payment.kind === 'refund') total.refundsMinor = sum(total.refundsMinor, amount);
    }
    for (const expense of expenses) {
      if (expense.incurred_on < from || expense.incurred_on > to) continue;
      const amount = Number(expense.amount_minor);
      if (!Number.isSafeInteger(amount) || amount <= 0) continue;
      const total = bucket(expense.currency);
      if (total) total.expensesMinor = sum(total.expensesMinor, amount);
    }
    for (const total of totals.values()) total.netCashMinor = sum(sum(total.receiptsMinor, -total.refundsMinor), -total.expensesMinor);
    if (!totals.size) bucket('EUR');
    return { from, to, totals: [...totals.values()].sort((a, b) => a.currency.localeCompare(b.currency)) };
  };
  return { current: aggregate(period.from, period.to), previous: aggregate(period.previousFrom, period.previousTo), timeZone: BUSINESS_TIME_ZONE,
    truncated, profitAvailable: false, basis: 'recorded-payments-refunds-and-expenses' };
}

export async function readCashReport(client: any, query: Record<string, unknown>) {
  const period = periodRange(query);
  const from = [period.from, period.previousFrom].sort()[0];
  const to = [period.to, period.previousTo].sort().at(-1)!;
  let truncated = false;
  async function read(table: string, column: string, start: string, end: string) {
    const rows: any[] = [];
    for (let offset = 0; offset < 20000; offset += 500) {
      const result = await client.from(table).select('*').gte(column, start).lte(column, end)
        .order(column, { ascending: false }).order('id').range(offset, offset + 499);
      if (result.error) throw result.error;
      rows.push(...(result.data || []));
      if (!result.data || result.data.length < 500) return rows;
    }
    truncated = true;
    return rows;
  }
  const payments = await read('payment_events', 'created_at', `${from}T00:00:00+01:00`, `${to}T23:59:59.999+01:00`);
  const expenses = await read('business_expenses', 'incurred_on', from, to);
  return { payments, expenses, report: cashReport(payments, expenses, period, truncated) };
}
