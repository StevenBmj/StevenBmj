import { useMemo, useState } from 'react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export default function CountryPhoneField({ value, onChange, language, id, required = true }: { value: string; onChange: (phone: string) => void; language: 'FR' | 'EN'; id: string; required?: boolean }) {
  const initial = parsePhoneNumberFromString(value || '');
  const [country, setCountry] = useState<CountryCode>(initial?.country || 'BJ');
  const [number, setNumber] = useState(initial?.nationalNumber || '');
  const countries = useMemo(() => {
    const names = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([language === 'FR' ? 'fr' : 'en'], { type: 'region' }) : null;
    return getCountries().map(code => ({ code, name: names?.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name));
  }, [language]);
  const field = 'min-h-11 w-full min-w-0 rounded border border-white/20 bg-neutral-950 px-3 py-2 text-base text-white focus:border-amber-400 focus:outline-none';
  return <div className="space-y-3 text-sm"><label className="block" htmlFor={`${id}-country`}>{language === 'FR' ? 'Pays' : 'Country'}<select id={`${id}-country`} autoComplete="country" value={country} onChange={event => { setCountry(event.target.value as CountryCode); setNumber(''); onChange(''); }} className={`mt-2 ${field}`}>
    {countries.map(item => <option value={item.code} key={item.code}>{item.name} (+{getCountryCallingCode(item.code)})</option>)}
  </select></label><label className="block" htmlFor={id}>{language === 'FR' ? 'Numéro WhatsApp' : 'WhatsApp number'}{required ? ' *' : ''}<div className="mt-2 flex min-w-0 items-stretch"><span className="flex shrink-0 items-center rounded-l border border-r-0 border-white/20 bg-white/5 px-3 text-neutral-300">+{getCountryCallingCode(country)}</span><input id={id} type="tel" inputMode="numeric" autoComplete="tel-national" required={required} maxLength={15} pattern="[0-9]+" value={number} onChange={event => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 15); setNumber(digits);
    const parsed = parsePhoneNumberFromString(digits, country);
    onChange(digits ? parsed?.isPossible() ? parsed.number : `+${getCountryCallingCode(country)}${digits}` : '');
  }} className={`${field} !rounded-l-none`} /></div></label></div>;
}
