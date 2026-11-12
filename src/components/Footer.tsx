/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { ArrowRight, Check, Facebook, Instagram, LoaderCircle, Mail, Phone } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import FooterPolicyDialog from './FooterPolicyDialog';
import { footerPolicies, policyOrder, type PolicyId } from './footerPolicies';

const linkClass = 'inline-flex min-h-11 items-center text-left text-sm leading-6 text-neutral-300 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400 rounded transition-colors';
const headingClass = 'mb-4 text-sm font-semibold text-white';

function safeSocialUrl(value: string | undefined, fallback: string) {
  try {
    const url = new URL(value || fallback);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : fallback;
  } catch { return fallback; }
}

export default function Footer({ setView }: { setView: (view: string) => void }) {
  const { language, settings, user, authLoading, openAuth, setCartOpen } = useApp();
  const fr = language === 'FR';
  const policies = footerPolicies[language];
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const sending = useRef(false);
  const [activePolicy, setActivePolicy] = useState<PolicyId | null>(null);

  const socials = [
    { name: 'Instagram', icon: Instagram, href: safeSocialUrl(settings?.instagramUrl, 'https://instagram.com') },
    { name: 'Facebook', icon: Facebook, href: safeSocialUrl(settings?.facebookUrl, 'https://www.facebook.com/share/1F3vVmSiGw/') },
    { name: 'WhatsApp', icon: Phone, href: safeSocialUrl(settings?.whatsappUrl, `https://wa.me/${String(settings?.whatsappContact || '2290155468138').replace(/\D/g, '')}`) },
  ];

  const go = (event: MouseEvent<HTMLAnchorElement>, view: string) => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setView(view);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || !email.trim()) return;
    sending.current = true;
    setSubscribeLoading(true);
    setSubscribeError('');
    try {
      const response = await apiFetch('/api/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success !== true) throw new Error('subscription-failed');
      setSubscribed(true);
      setEmail('');
    } catch {
      setSubscribeError(fr ? "Votre demande n'a pas pu être envoyée. Réessayez ou contactez-nous." : 'Your request could not be sent. Please retry or contact us.');
    } finally {
      sending.current = false;
      setSubscribeLoading(false);
    }
  };

  const description = (fr ? settings?.footerText : settings?.footerTextEn)?.trim()
    || (fr ? 'Vêtements, chaussures, montres et accessoires pour hommes, femmes et enfants. Découvrez la sélection StevenBmj, depuis Cotonou.'
      : 'Clothing, footwear, watches and accessories for men, women and children. Discover the StevenBmj selection, from Cotonou.');
  const copyright = (fr ? settings?.footerCredits : settings?.footerCreditsEn)?.trim()
    || `© ${new Date().getFullYear()} StevenBmj. ${fr ? 'Tous droits réservés.' : 'All rights reserved.'}`;

  return <footer lang={language.toLowerCase()} className="mt-20 border-t border-white/10 bg-neutral-950 px-5 pb-7 pt-12 text-neutral-300 sm:px-8 lg:pt-16">
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-10 sm:gap-x-10 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <a href="/" onClick={event => go(event, 'home')} aria-label={fr ? 'StevenBmj, accueil' : 'StevenBmj, home'}
          className="inline-flex min-h-12 items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-amber-400">
          <Logo size={48} className="shrink-0" />
          <span className="text-xl font-medium text-white">StevenBmj</span>
        </a>
        <p className="mt-4 max-w-sm break-words text-sm leading-6 text-neutral-400">{description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {socials.map(({ name, icon: Icon, href }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer"
            aria-label={`${name} StevenBmj`} title={`${name} StevenBmj`}
            className="flex size-11 items-center justify-center rounded border border-white/15 text-neutral-300 hover:border-amber-400 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">
            <Icon size={18} aria-hidden="true" />
          </a>)}
        </div>
        <h2 className="mb-0 mt-6 text-sm font-semibold text-white">Contact</h2>
        <a href="/contact" onClick={event => go(event, 'contact')} className={linkClass}>
          {fr ? 'Formulaire de contact' : 'Contact form'}
        </a>

        <section aria-labelledby="footer-newsletter-title" className="mt-5">
          <h2 id="footer-newsletter-title" className="flex items-center gap-2 text-sm font-semibold text-white"><Mail size={16} className="text-amber-400" aria-hidden="true" />Newsletter</h2>
          <p className="mb-4 mt-2 text-sm leading-6 text-neutral-400">{fr ? 'Les nouveautés et offres de StevenBmj, par e-mail.' : 'StevenBmj news and offers, by email.'}</p>
          {subscribed ? <p role="status" className="flex items-start gap-2 text-sm leading-6 text-emerald-400">
            <Check size={18} className="mt-1 shrink-0" aria-hidden="true" />
            {fr ? "Votre demande d'inscription a été transmise à StevenBmj." : 'Your subscription request has been sent to StevenBmj.'}
          </p> : <form onSubmit={handleSubscribe} aria-busy={subscribeLoading} className="space-y-3">
            <label htmlFor="footer-newsletter-email" className="sr-only">{fr ? 'Votre adresse e-mail' : 'Your email address'}</label>
            <input id="footer-newsletter-email" name="email" type="email" autoComplete="email" required maxLength={254}
              value={email} onChange={event => setEmail(event.target.value)} disabled={subscribeLoading}
              placeholder={fr ? 'Votre adresse e-mail' : 'Your email address'}
              aria-invalid={!!subscribeError} aria-describedby={subscribeError ? 'footer-newsletter-error footer-newsletter-notice' : 'footer-newsletter-notice'}
              className="h-12 w-full rounded border border-white/20 bg-black px-3 text-base text-white placeholder:text-neutral-500 focus:border-amber-400 focus:outline-none disabled:opacity-60" />
            <button id="btn-footer-subscribe" type="submit" disabled={subscribeLoading}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-amber-400 px-4 py-3 text-sm font-semibold text-black hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-wait disabled:opacity-60">
              {subscribeLoading ? <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight size={16} aria-hidden="true" />}
              {subscribeLoading ? (fr ? 'Envoi…' : 'Sending…') : (fr ? "S'abonner" : 'Subscribe')}
            </button>
          </form>}
          {subscribeError && <p role="alert" id="footer-newsletter-error" className="mt-3 text-sm leading-6 text-red-400">{subscribeError}</p>}
          <p id="footer-newsletter-notice" className="mt-3 text-xs leading-5 text-neutral-400">
            {fr ? 'En vous inscrivant, vous demandez à recevoir nos actualités. Désinscription sur demande par e-mail. ' : 'By subscribing, you request shop updates. You can request removal by email. '}
            <button type="button" onClick={() => setActivePolicy('privacy')} className="underline decoration-neutral-600 underline-offset-4 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">
              {fr ? 'Confidentialité' : 'Privacy'}
            </button>
          </p>
        </section>
      </div>

      <nav aria-label="Navigation" className="min-w-0">
        <h2 className={headingClass}>Navigation</h2>
        <ul>
          {[{ view: 'home', href: '/', label: fr ? 'Accueil' : 'Home' },
            { view: 'boutique', href: '/boutique', label: fr ? 'Boutique' : 'Shop' },
            { view: 'aide', href: '/aide', label: 'Services' },
            { view: 'about', href: '/about', label: fr ? 'À propos de StevenBmj' : 'About StevenBmj' },
          ].map(item => <li key={item.view}><a href={item.href} onClick={event => go(event, item.view)} className={linkClass}>{item.label}</a></li>)}
          <li><a href="/aide#faq" className={linkClass}>FAQ</a></li>
        </ul>
      </nav>

      <nav aria-label={fr ? 'Compte' : 'Account'} className="min-w-0">
        <h2 className={headingClass}>{fr ? 'Compte' : 'Account'}</h2>
        <ul>
          {user ? <>
            <li><a href="/compte" onClick={event => go(event, 'account')} className={linkClass}>{fr ? 'Mes commandes' : 'My orders'}</a></li>
            <li><button type="button" onClick={() => setCartOpen(true)} className={linkClass}>{fr ? 'Mon panier' : 'My cart'}</button></li>
            {user.isAdmin && <li><a href="/god" onClick={event => go(event, 'god')} className={linkClass}>Administration</a></li>}
          </> : <>
            <li><button type="button" disabled={authLoading} onClick={() => openAuth('login')} className={`${linkClass} disabled:opacity-50`}>{fr ? 'Connexion' : 'Sign in'}</button></li>
            <li><button type="button" disabled={authLoading} onClick={() => openAuth('register')} className={`${linkClass} disabled:opacity-50`}>{fr ? 'Inscription' : 'Register'}</button></li>
          </>}
          <li><a href="/aide" onClick={event => go(event, 'aide')} className={linkClass}>Support</a></li>
          <li><a href="/livraisons" onClick={event => go(event, 'driver')} className={linkClass}>{fr ? 'Espace livreur' : 'Driver workspace'}</a></li>
        </ul>
      </nav>

      <nav aria-label={fr ? 'Informations légales' : 'Legal Information'} className="col-span-2 min-w-0 sm:col-span-1">
        <h2 className={headingClass}>{fr ? 'Informations légales' : 'Legal Information'}</h2>
        <ul>{policyOrder.map(id => <li key={id}><button type="button" onClick={() => setActivePolicy(id)} className={linkClass}>{policies[id].label}</button></li>)}</ul>
      </nav>
    </div>

    <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <p onDoubleClick={() => setView('god')} className="break-words text-xs leading-6 text-neutral-400">{copyright}</p>
        <nav aria-label={fr ? 'Raccourcis légaux' : 'Legal shortcuts'} className="flex flex-wrap gap-x-5 gap-y-1">
          {policyOrder.map(id => <button key={id} type="button" onClick={() => setActivePolicy(id)}
            className="min-h-11 text-left text-xs leading-5 text-neutral-400 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">{policies[id].label}</button>)}
        </nav>
      </div>
      <p className="mt-5 text-center text-xs leading-6 text-neutral-400">{fr ? 'Réalisé par StevenBmj' : 'Built by StevenBmj'}</p>
    </div>
    {activePolicy && <FooterPolicyDialog policy={activePolicy} language={language} onDismiss={() => setActivePolicy(null)} />}
  </footer>;
}
