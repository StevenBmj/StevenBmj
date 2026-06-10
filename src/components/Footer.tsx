/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { Mail, ArrowRight, Instagram, Phone, Globe, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  setView: (view: string) => void;
}

export default function Footer({ setView }: FooterProps) {
  const { language, formatPrice, settings } = useApp();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'cgv' | 'privacy' | 'legal' | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-black text-neutral-400 border-t border-white/5 py-16 px-4 md:px-8 mt-24">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand identity area */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <Logo size={50} />
            <div className="flex flex-col text-left">
              <span className="text-xl font-light tracking-[0.25em] text-white uppercase font-sans">StevenBmj</span>
              <span className="text-[7px] font-mono tracking-[0.4em] text-amber-500 -mt-0.5 uppercase">Haute Joaillerie & Couture</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-neutral-500">
            {settings?.footerText ? (
              language === 'FR' ? settings.footerText : settings.footerTextEn
            ) : (
              language === 'FR' 
                ? "Inspiré par le futurisme spatial et la perfection artisanale suisse. StevenBmj redéfinit la silhouette masculine contemporaine à travers des matériaux d'une pureté absolue."
                : "Inspired by deep-space exploration and Swiss horological precision. StevenBmj rebuilds contemporary menswear silhouettes with materials of ultimate pureness."
            )}
          </p>
          <div className="flex space-x-4 pt-2">
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 border border-white/10 hover:border-amber-400 text-neutral-400 hover:text-amber-400 rounded-full transition-all duration-300"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a 
              href="https://wa.me/2290155468138" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 border border-white/10 hover:border-amber-400 text-neutral-400 hover:text-amber-400 rounded-full transition-all duration-300"
              title="WhatsApp Concierge"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Collections links */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
            {language === 'FR' ? 'Collections' : 'Collections'}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button 
                onClick={() => setView('boutique')} 
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                {language === 'FR' ? 'Horlogerie de Prestige' : 'Prestige Horology'}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('boutique')} 
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                {language === 'FR' ? 'Orfèvrerie & Chaînes 18K' : 'Fine Chains & Jewelry'}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('boutique')} 
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                {language === 'FR' ? 'Costumes Croisés' : 'Tailored Suits'}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('boutique')} 
                className="hover:text-amber-400 transition-colors cursor-pointer"
              >
                {language === 'FR' ? 'Souliers & Mocassins Crêpe' : 'Crepe Loafers & Shoes'}
              </button>
            </li>
          </ul>
        </div>

        {/* Brand policies */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
            {language === 'FR' ? 'Maison' : 'Maison'}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button 
                onClick={() => setView('about')} 
                className="hover:text-amber-400 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer text-left"
              >
                {language === 'FR' ? 'À Propos de la Maison' : 'About Maison StevenBmj'}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setView('contact')} 
                className="hover:text-amber-400 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer text-left"
              >
                {language === 'FR' ? 'Salon Privé & Contact' : 'Private Salon & Contact'}
              </button>
            </li>
            <li>
              <span className="text-neutral-500 block">
                {language === 'FR' ? 'Service Conciergerie 24/7' : 'Concierge Desk 24/7'}
              </span>
            </li>
            <li>
              <span className="text-amber-500/80 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {language === 'FR' ? 'Authenticité Garantie' : 'Guaranteed Authentic'}
              </span>
            </li>
          </ul>
        </div>

        {/* Private newsletters */}
        <div className="flex flex-col space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">
            {language === 'FR' ? 'Salons Privés' : 'Private Access'}
          </h4>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {language === 'FR' 
              ? 'Inscrivez-vous pour obtenir les invitations privilégiées de précommande et les événements confidentiels de la maison.'
              : 'Sign up for privileged pre-order invitations and confidential brand releases.'}
          </p>
          
          {subscribed ? (
            <div className="text-xs text-amber-400 py-2 font-mono uppercase tracking-widest border border-amber-500/20 bg-amber-500/5 px-3 rounded">
              ✓ {language === 'FR' ? 'Inscrit avec succès' : 'Successfully subscribed'}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex relative items-center">
              <input 
                id="footer-newsletter-email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'FR' ? 'Votre adresse email' : 'Your email address'} 
                className="w-full bg-neutral-900 border border-neutral-800 text-xs px-4 py-3 text-white placeholder-neutral-600 rounded focus:outline-none focus:border-amber-400 duration-300"
              />
              <button 
                id="btn-footer-subscribe"
                type="submit" 
                className="absolute right-2 px-2.5 py-1 text-neutral-400 hover:text-amber-400 duration-300 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>

      <div className="mx-auto max-w-7xl border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <p 
          className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase text-center md:text-left cursor-pointer"
          onDoubleClick={() => setView('god')}
          title="StevenBmj Authenticity"
        >
          {settings?.footerCredits ? (
            language === 'FR' ? settings.footerCredits : settings.footerCreditsEn
          ) : (
            `© ${new Date().getFullYear()} STEVENBMJ HAUTE COUTURE. ${language === 'FR' ? 'TOUS DROITS RÉSERVÉS' : 'ALL RIGHTS RESERVED'}.`
          )}
        </p>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-6 text-[10px] font-mono text-neutral-600 tracking-wider">
          <button 
            onClick={() => setActivePolicy('privacy')}
            className="hover:text-amber-400 duration-300 cursor-pointer uppercase"
          >
            {language === 'FR' ? 'Politique de confidentialité' : 'Privacy Policy'}
          </button>
          <button 
            onClick={() => setActivePolicy('cgv')}
            className="hover:text-amber-400 duration-300 cursor-pointer uppercase"
          >
            {language === 'FR' ? 'CGV' : 'Terms of Sale (CGV)'}
          </button>
          <button 
            onClick={() => setActivePolicy('legal')}
            className="hover:text-amber-400 duration-300 cursor-pointer uppercase"
          >
            {language === 'FR' ? 'Mentions légales' : 'Legal Notice'}
          </button>
          <a 
            href="mailto:Stevenamorin202@gmail.com"
            className="hover:text-amber-400 text-neutral-600 duration-300 decoration-none uppercase border-l border-white/10 pl-4"
            title="Prestataire de Discussion Privée"
          >
            Réalisé par SHADOW007
          </a>
        </div>
      </div>

      {/* RENDER DYNAMIC POLICY MODAL FOR COUTURE COMPLIANCE */}
      {activePolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all duration-300">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase">MAISON STEVENBMJ • DOCUMENT OFFICIEL</span>
              <button 
                onClick={() => setActivePolicy(null)}
                className="text-neutral-400 hover:text-white font-mono text-xs cursor-pointer border border-white/10 px-2.5 py-1 rounded bg-neutral-900 duration-300 hover:border-amber-400"
              >
                [ FERMER / CLOSE ]
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-neutral-300 leading-relaxed font-light scrollbar-thin scrollbar-thumb-neutral-800">
              
              {activePolicy === 'privacy' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-light text-white tracking-widest uppercase font-sans border-b border-white/5 pb-2">
                    {language === 'FR' ? "POLITIQUE DE CONFIDENTIALITÉ" : "PRIVACY POLICY"}
                  </h2>
                  <p className="font-mono text-amber-500 text-[10px] uppercase tracking-wider">Mise à jour : Mai 2026 • Cotonou, République du Bénin</p>
                  
                  <div className="space-y-3">
                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">1. Protection Souveraine des Données</h3>
                    <p>
                      {language === 'FR' 
                        ? "La Maison StevenBmj s'engage à garantir le plus haut niveau de secret professionnel pour l'élite de ses VIP. Toutes vos données d'atelier (mensurations, carnets de commandes de prestige, adresses) sont chiffrées de bout en bout et conservées au sein de serveurs hautement sécurisés protégés par notre Cyber Pare-Feu."
                        : "Maison StevenBmj is bound to preserve the absolute secret regarding our elite VIP clients' data. All tailoring notes (measurements, prestige order books, addresses) are encrypted end-to-end and stored in bulletproof servers secured by our sovereign hardware firewall."}
                    </p>

                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">2. Collecte & Utilisation Légitime</h3>
                    <p>
                      {language === 'FR'
                        ? "Nous collectons uniquement les informations nécessaires au façonnage de vos silhouettes sur-mesure (Mocassins à semelles crêpe, costumes croisés, diamants et horlogerie royale) et aux communications confidentielles de notre secrétariat. Vos données ne sont jamais partagées, vendues ou cédées à des tiers."
                        : "We solely collect executive information critical to designing and delivering custom wear (Crepe loafers, double-breasted suits, fine custom jewelry and watches) and maintaining direct, quiet communication with our concierge desk. Your archives will never be sold or made accessible to third parties."}
                    </p>

                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">3. Sécurisation & Contrôle Logiciel</h3>
                    <p>
                      {language === 'FR'
                        ? "Toute transaction financière ou modification de profil requiert une authentification forte par courriel. Notre système logiciel s'appuie sur le respect d'une hygiène informatique stricte interdisant les injections ou le tracking publicitaire."
                        : "Profile modifications and premium collections requests require strict authentication codes dispatched to your registered email to enforce secure digital handshakes and mitigate unauthorized access."}
                    </p>
                  </div>
                </div>
              )}

              {activePolicy === 'cgv' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-light text-white tracking-widest uppercase font-sans border-b border-white/5 pb-2">
                    {language === 'FR' ? "CONDITIONS GÉNÉRALES DE VENTE (CGV)" : "TERMS OF SALE & COUTURE CONDITIONS"}
                  </h2>
                  <p className="font-mono text-amber-500 text-[10px] uppercase tracking-wider">Mise à jour : Mai 2026 • Salons Cotonou</p>
                  
                  <div className="space-y-3">
                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">1. Portée des Créations & Sur-Mesure</h3>
                    <p>
                      {language === 'FR'
                        ? "Les souliers de caractère en semelle gomme crêpe naturelle d'Italie et les costumes en laine extra-fine mérinos sont taillés spécifiquement selon les mesures indiquées par l'acheteur. En raison du caractère hautement personnalisé de nos pièces de couture, aucun retour ou annulation ne peut être accepté après la découpe des étoffes en atelier."
                        : "The character loafers in natural crepe rubber and merino suits are cut exclusively for the customer's personal silhouette. Due to the bespoke parameters of custom items, no return or refund is permitted once fabric cutting begins."}
                    </p>

                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">2. Expédition & Logistique Diplomatique</h3>
                    <p>
                      {language === 'FR'
                        ? "StevenBmj expédie ses coffrets de prestige depuis son atelier de Cotonou, Bénin vers le monde entier par transporteur blindé sécurisé (DHL Express / FedEx Priority). Les droits de douane et taxes d'importation restent à la charge du client d'élite."
                        : "All prestige orders are dispatched from our Akpakpa Salon in Cotonou, Benin, to international capitals using high-security diplomatic shipping partners. Customs duties remain the sole responsibility of the buyer."}
                    </p>

                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">3. Attribution des Pièces Horlogères</h3>
                    <p>
                      {language === 'FR'
                        ? "L'achat d'un chronographe d'exception royale ou d'une pièce d'orfèvrerie fine en or 18k est réservé aux membres dont l'identité numérique est préalablement vérifiée et validée par e-mail professionnel."
                        : "Royale chronographs and 18k jewelry are strictly limited. Orders are processed only after professional email verification to counter fraud and guarantee authenticity."}
                    </p>
                  </div>
                </div>
              )}

              {activePolicy === 'legal' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-light text-white tracking-widest uppercase font-sans border-b border-white/5 pb-2">
                    {language === 'FR' ? "MENTIONS LÉGALES" : "LEGAL NOTICE"}
                  </h2>
                  <p className="font-mono text-amber-500 text-[10px] uppercase tracking-wider">Maison StevenBmj</p>
                  
                  <div className="space-y-3">
                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">Éditeur du Site & Propriété</h3>
                    <p>
                      {language === 'FR'
                        ? "La marque et le service en ligne 'StevenBmj' sont édités par l'Atelier de Couture et Orfèvrerie de Prestige StevenBmj."
                        : "The 'StevenBmj' trademark and luxury boutique are edited and managed by the Atelier de Couture et Orfèvrerie de Prestige StevenBmj."}
                    </p>
                    <p>
                      <strong>{language === 'FR' ? "Siège social :" : "Physical Showroom:"}</strong> Avenue du Prestige, Quartier Akpakpa, Cotonou, République du Bénin.<br />
                      <strong>{language === 'FR' ? "Directeur de la Publication :" : "Director of Publication:"}</strong> Steven Amorin.<br />
                      <strong>Contacts :</strong> +229 01 55 46 8138 / 01 44 15 80 44<br />
                      <strong>Email :</strong> <span className="text-amber-400 font-mono">stevenbmj202@gmail.com</span>
                    </p>

                    <h3 className="font-mono text-[10px] text-white uppercase tracking-widest">Hébergement Cyber-Sécurisé</h3>
                    <p>
                      {language === 'FR'
                        ? "Hébergé sur les infrastructures isolées Cloud Run en Europe avec pare-feu Cyber-Espace et filtrage proactif d'injections."
                        : "Hosted on isolated high-speed Cloud servers with real-time firewalls and threat logs verification."}
                    </p>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-white/5 bg-neutral-900/60 text-center text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              MAISON STEVENBMJ • EXCELLENCE SANS COMPROMIS
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
