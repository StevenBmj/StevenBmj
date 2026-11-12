export const BUSINESS_TIME_ZONE = 'Africa/Porto-Novo';
const DAY = 86400000;
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const day = (value: Date) => dayFormatter.format(value);
const shift = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function periodRange(query: Record<string, unknown>, now = new Date()) {
  const today = day(now);
  let from: string; let to = today;
  if (query.from !== undefined || query.to !== undefined) {
    if (!validDate(query.from) || !validDate(query.to)) throw new Error('Invalid date range');
    from = query.from; to = query.to;
  } else if (query.filter === 'day') from = today;
  else if (query.filter === 'month') from = `${today.slice(0, 7)}-01`;
  else if (query.filter === 'year') from = `${today.slice(0, 4)}-01-01`;
  else {
    const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
    from = shift(today, -((weekday + 6) % 7));
  }
  const days = (Date.parse(to) - Date.parse(from)) / DAY + 1;
  if (days < 1 || days > 3660) throw new Error('Invalid date range');
  const previousTo = query.compareTo ?? shift(from, -1);
  const previousFrom = query.compareFrom ?? shift(String(previousTo), -(days - 1));
  if (!validDate(previousFrom) || !validDate(previousTo) || previousFrom > previousTo
    || (Date.parse(previousTo) - Date.parse(previousFrom)) / DAY > 3660) throw new Error('Invalid comparison range');
  return { from, to, previousFrom, previousTo };
}

export type SalesPeriod = ReturnType<typeof periodRange>;
type Totals = { currency: string; orders: number; cancelled: number; orderedCents: number;
  paidCents: number; pendingCents: number; refundedCents: number; unknownCents: number };

export function salesReport(rows: any[], period: SalesPeriod, truncated = false) {
  function aggregate(from: string, to: string) {
    const totals = new Map<string, Totals>();
    const customers = new Map<string, { customerName: string; email: string; currency: string; orders: number; paidCents: number }>();
    const products = new Map<string, { id: string; name: string; currency: string; quantity: number; amountCents: number }>();
    const daily = new Map<string, { date: string; currency: string; orders: number; paidCents: number }>();
    let count = 0;
    for (const row of rows) {
      const instant = new Date(row.date);
      if (!Number.isFinite(instant.getTime())) continue;
      const date = day(instant);
      if (date < from || date > to) continue;
      const currency = ['EUR', 'USD', 'CFA', 'XOF'].includes(row.currency) ? (row.currency === 'CFA' ? 'XOF' : row.currency) : 'UNKNOWN';
      const cents = Math.round(Number(row.total_price) * 100);
      if (!Number.isSafeInteger(cents) || cents < 0) continue;
      count++;
      const total = totals.get(currency) || { currency, orders: 0, cancelled: 0, orderedCents: 0, paidCents: 0, pendingCents: 0, refundedCents: 0, unknownCents: 0 };
      total.orders++;
      if (row.status === 'cancelled') total.cancelled++;
      else total.orderedCents += cents;
      if (row.payment_status === 'paid') total.paidCents += cents;
      else if (row.payment_status === 'refunded') total.refundedCents += cents;
      else if (row.status !== 'cancelled') {
        if (row.payment_status === 'pending') total.pendingCents += cents;
        else total.unknownCents += cents;
      }
      totals.set(currency, total);
      const dailyKey = `${date}:${currency}`;
      const bucket = daily.get(dailyKey) || { date, currency, orders: 0, paidCents: 0 };
      bucket.orders++; if (row.payment_status === 'paid') bucket.paidCents += cents;
      daily.set(dailyKey, bucket);
      if (row.payment_status !== 'paid' || row.status === 'cancelled') continue;
      if (row.email) {
        const email = String(row.email).toLowerCase();
        const key = `${currency}:${email}`;
        const customer = customers.get(key) || { customerName: String(row.customer_name || ''), email, currency, orders: 0, paidCents: 0 };
        customer.orders++; customer.paidCents += cents; customers.set(key, customer);
      }
      for (const item of Array.isArray(row.items) ? row.items : []) {
        const quantity = Number(item.quantity); const amountCents = Math.round(Number(item.price) * 100) * quantity;
        if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(amountCents) || amountCents < 0) continue;
        const key = `${currency}:${item.productId}`;
        const product = products.get(key) || { id: String(item.productId || ''), name: String(item.productName || ''), currency, quantity: 0, amountCents: 0 };
        product.quantity += quantity; product.amountCents += amountCents; products.set(key, product);
      }
    }
    if (!totals.size) totals.set('EUR', { currency: 'EUR', orders: 0, cancelled: 0, orderedCents: 0, paidCents: 0, pendingCents: 0, refundedCents: 0, unknownCents: 0 });
    return { from, to, orders: count, totals: [...totals.values()], daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
      topCustomers: [...customers.values()].sort((a, b) => a.currency.localeCompare(b.currency) || b.paidCents - a.paidCents).slice(0, 30),
      topProducts: [...products.values()].sort((a, b) => a.currency.localeCompare(b.currency) || b.quantity - a.quantity).slice(0, 30) };
  }
  return { timeZone: BUSINESS_TIME_ZONE, truncated, current: aggregate(period.from, period.to), previous: aggregate(period.previousFrom, period.previousTo),
    accountingBasis: 'order-date-and-recorded-payment-status', profitAvailable: false, trafficAvailable: false };
}

export async function readReportOrders(client: any, period: SalesPeriod) {
  const from = [period.from, period.previousFrom].sort()[0];
  const to = [period.to, period.previousTo].sort().at(-1)!;
  const rows: any[] = [];
  let truncated = false;
  for (let offset = 0; offset < 20000; offset += 1000) {
    const result = await client.from('orders').select('id,date,status,total_price,payment_status,currency,customer_name,email,whatsapp,items')
      .gte('date', `${from}T00:00:00+01:00`).lt('date', `${shift(to, 1)}T00:00:00+01:00`).order('date').order('id').range(offset, offset + 999);
    if (result.error) throw new Error('Order reports unavailable');
    rows.push(...(result.data || []));
    if ((result.data || []).length < 1000) break;
    if (offset === 19000) truncated = true;
  }
  return { rows, truncated };
}
