import { XMLParser, XMLValidator } from 'fast-xml-parser';

const SOURCE = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
let inFlight: Promise<any> | null = null;
let nextRetry = 0;

export async function exchangeRates(client: any) {
  const result = await client.from('exchange_rates').select('*').eq('id', 'EUR').maybeSingle();
  let row = result.error ? null : result.data;
  const fresh = row && Date.now() - Date.parse(row.fetched_at) < 6 * 3600000;
  let stale = !fresh;
  if (!fresh && Date.now() >= nextRetry) {
    if (!inFlight) inFlight = (async () => {
      const response = await fetch(SOURCE, { signal: AbortSignal.timeout(4000), redirect: 'error' });
      if (!response.ok) throw new Error('Rate source unavailable');
      const xml = await response.text();
      if (xml.length > 64000 || XMLValidator.validate(xml) !== true) throw new Error('Invalid rate document');
      const document = new XMLParser({ ignoreAttributes: false, processEntities: false }).parse(xml);
      const cube = document?.['gesmes:Envelope']?.Cube?.Cube;
      const quotes = Array.isArray(cube?.Cube) ? cube.Cube : [cube?.Cube];
      const usd = Number(quotes.find((quote: any) => quote?.['@_currency'] === 'USD')?.['@_rate']);
      const asOf = cube?.['@_time'];
      if (!Number.isFinite(usd) || usd <= 0 || usd >= 1000 || !/^\d{4}-\d{2}-\d{2}$/.test(asOf || '')) throw new Error('Invalid rate quote');
      const next = { id: 'EUR', usd, as_of: asOf, source: SOURCE, fetched_at: new Date().toISOString() };
      const saved = await client.from('exchange_rates').upsert(next, { onConflict: 'id' });
      if (saved.error) throw new Error('Rate cache unavailable');
      return next;
    })().finally(() => { inFlight = null; });
    try { row = await inFlight; stale = false; }
    catch { nextRetry = Date.now() + 60000; }
  }
  return { base: 'EUR', rates: { EUR: 1, XOF: 655.957, USD: row && Number.isFinite(Number(row.usd)) ? Number(row.usd) : null },
    asOf: row?.as_of || null, fetchedAt: row?.fetched_at || null, source: row?.source || SOURCE,
    stale: stale || !row || Date.now() - Date.parse(`${row.as_of}T00:00:00Z`) > 7 * 86400000, indicative: true };
}
