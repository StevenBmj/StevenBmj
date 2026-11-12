import { localizedText } from '../lib/uiText';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { apiFetch as fetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { HelpCircle, ChevronRight, ChevronDown, Mail, Phone, Clock, FileText, Send } from 'lucide-react';

export default function CustomerCare() {
  const { language, settings } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [careTopic, setCareTopic] = useState('Mesure');
  const [careMessage, setCareMessage] = useState('');
  const [careEmail, setCareEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#faq') document.getElementById('faq')?.scrollIntoView();
  }, []);

  const faqs = (() => {
    if (settings && settings.faqsJson) {
      try {
        const parsed = JSON.parse(settings.faqsJson);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            qFr: item.q || item.qFr || '',
            qEn: item.qEn || '',
            aFr: item.a || item.aFr || '',
            aEn: item.aEn || ''
          })).filter((item: any) => language === 'FR' ? item.qFr && item.aFr : item.qEn && item.aEn);
        }
      } catch (e) {
        console.error("Error parsing settings.faqsJson", e);
      }
    }
    // Default faqs
    return [
      {
        qFr: "Comment se déroulent la livraison et l'expédition VIP ?",
        qEn: "How does the VIP shipping and delivery operate?",
        aFr: 'Les modalités, les frais et le délai sont à confirmer avec StevenBmj selon votre adresse. Après validation du paiement et affectation, les étapes de livraison sont consultables dans votre compte.',
        aEn: 'Delivery options, charges and timing must be confirmed with StevenBmj for your address. Once payment is verified and a driver is assigned, delivery stages are available in your account.'
      },
      {
        qFr: "Quelles sont les garanties d'authenticité et de noblesse des matières ?",
        qEn: "What are the authenticity and gold material guarantees?",
        aFr: 'Les matières, les caractéristiques et les garanties dépendent de chaque article. Consultez sa fiche et contactez la boutique pour obtenir les justificatifs disponibles avant de commander.',
        aEn: 'Materials, specifications and warranties depend on each item. Check its product page and contact the shop for available supporting documents before ordering.'
      },
      {
        qFr: "Est-il possible d'ajuster une veste ou une manche à mes mesures ?",
        qEn: "Can I adjust a tailored suits jacket or sleeve to my exact size?",
        aFr: 'Indiquez votre taille et vos besoins dans les notes de commande, puis faites confirmer la faisabilité et le tarif d’un ajustement par la boutique. Aucune retouche gratuite n’est présumée.',
        aEn: 'Include your size and requirements in the order notes, then ask the shop to confirm whether an alteration is available and its price. Free alterations are not assumed.'
      },
      {
        qFr: "Quels sont les délais d'attribution des pièces d'exception ?",
        qEn: "What are the delivery lead times for highly limited pieces?",
        aFr: 'La disponibilité et le délai doivent être confirmés pour l’article choisi. Le conseiller peut vous orienter vers un article en stock lorsque votre premier choix n’est pas disponible.',
        aEn: 'Availability and lead time must be confirmed for your selected item. The advisor can suggest an in-stock alternative when your first choice is unavailable.'
      }
    ];
  })();

  const handleSubmitCare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (careEmail && careMessage) {
      setLoading(true);
      try {
        const res = await fetch('/api/care', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: careEmail,
            topic: careTopic,
            message: careMessage
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erreur d'envoi.");
        setSubmitted(true);
        setCareEmail('');
        setCareMessage('');
      } catch (err: any) {
        setError(err.message || (language === 'FR' ? "Impossible d'envoyer le message." : 'Unable to send message.'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-left">
      
      {/* Introduction banner */}
      <div className="border-b border-white/5 pb-8 mb-12">
        <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">
          {language === 'FR' ? 'DESK DE SOUVERAINETÉ CLIENT' : 'CLIENT SOVEREIGNTY DESK'}
        </span>
        <h1 className="text-3xl md:text-5xl font-light text-white tracking-widest uppercase mt-2 font-sans">
          {settings?.careTitle ? (
            language === 'FR' ? settings.careTitle : settings.careTitleEn
          ) : (
            language === 'FR' ? 'Service client StevenBmj' : 'StevenBmj customer care'
          )}
        </h1>
        <p className="text-xs text-neutral-500 max-w-2xl mt-1 leading-relaxed">
          {settings?.careContent ? (
            language === 'FR' ? settings.careContent : settings.careContentEn
          ) : (
            language === 'FR'
              ? "Un conseiller d'artisanat à votre écoute pour orchestrer vos désirs horlogers, de broderie d'art et d'expédition diplomatique."
              : "A private craft adviser is here to coordinate watchmaking requests, couture details, and secure delivery matters."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Hand: Collapsible luxury FAQs */}
        <div id="faq" className="space-y-6 scroll-mt-36">
          <h3 className="text-lg font-light tracking-[0.25em] text-white uppercase flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500 stroke-1" />
            <span>{language === 'FR' ? 'Questions Fréquentes' : 'Frequently Asked Questions'}</span>
          </h3>

          <div className="space-y-3.5">
            {faqs.map((faq, i) => {
              const isOpen = activeFaq === i;
              return (
                <div 
                  key={i} 
                  className="bg-neutral-950/80 border border-white/5 rounded-lg overflow-hidden transition-all duration-300"
                >
                  <button
                    id={`btn-faq-title-${i}`}
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full p-4.5 flex justify-between items-center text-left text-xs font-semibold text-white tracking-wide uppercase font-sans hover:text-amber-400 cursor-pointer"
                  >
                    <span>{language === 'FR' ? faq.qFr : faq.qEn}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="p-4.5 border-t border-white/5 text-xs text-neutral-400 font-light leading-relaxed bg-black/40 text-left animate-fade-in">
                      {language === 'FR' ? faq.aFr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick contact channels cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="bg-neutral-950 p-5 rounded border border-white/5 text-left">
              <Phone className="w-4.5 h-4.5 text-amber-500 mb-2 stroke-1" />
              <p className="text-[10px] font-mono text-neutral-500 uppercase">{localizedText("WhatsApp Direct Concierge", language)}</p>
              <a 
                href={`https://wa.me/${(settings?.whatsappContact || '+2290155468138').replace(/\D/g, '')}`}
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-white hover:text-amber-400 duration-300 font-bold tracking-wider mt-1 block"
              >
                {settings?.whatsappContact || '+229 01 55 46 81 38'}
              </a>
            </div>

            <div className="bg-neutral-950 p-5 rounded border border-white/5 text-left">
              <Clock className="w-4.5 h-4.5 text-amber-500 mb-2 stroke-1" />
              <p className="text-[10px] font-mono text-neutral-500 uppercase">{language === 'FR' ? 'Temps de Réponse' : 'Response Time'}</p>
              <p className="text-xs text-white mt-1 font-bold">{language === 'FR' ? 'Selon la disponibilité de l’équipe' : 'Subject to team availability'}</p>
            </div>
          </div>

        </div>

        {/* Right Hand: Submittable Care forms */}
        <div className="bg-neutral-950/25 border border-white/5 rounded-lg p-6 md:p-8 space-y-6">
          <div className="text-left border-b border-white/5 pb-4">
            <h3 className="text-lg font-light tracking-[0.2em] text-white uppercase">
              {language === 'FR' ? "Rédiger un Ordre d'Information Privé" : 'Write a Private Information Order'}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              {language === 'FR'
                ? "Consignez vos questions d'atelier ou de mensurations spécifiques ci-dessous. Un compagnon tailleur traitera votre pli avec discrétion."
                : 'Share atelier questions or specific measurement requests below. A private tailor adviser will handle your note discreetly.'}
            </p>
          </div>

          {submitted ? (
            <div className="p-8 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-center rounded space-y-3 font-mono text-xs uppercase">
              <p className="text-base font-bold text-white">{language === 'FR' ? '✓ Vœu Transmis avec Succès' : '✓ Request Sent Successfully'}</p>
              <p>{language === 'FR' ? 'Votre demande a été transmise à StevenBmj. La réponse sera adressée à l’e-mail indiqué.' : 'Your request has been sent to StevenBmj. The response will be addressed to the email you provided.'}</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-amber-500 underline text-[10px] tracking-widest block mx-auto pt-4 font-bold cursor-pointer"
              >
                {language === 'FR' ? "Générer un nouvel ordre d'écriture" : 'Create a new request'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitCare} className="space-y-4">
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? "Thématique d'Atelier *" : 'Atelier Topic *'}</label>
                <select
                  id="care-topic-select"
                  value={careTopic}
                  onChange={(e) => setCareTopic(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 text-xs px-3 h-11 text-neutral-300 select-all cursor-pointer"
                >
                  <option value="Mesure">{language === 'FR' ? 'Ajustements Mensurations / Haute Robe / Costumes' : 'Measurements / Couture / Suits'}</option>
                  <option value="Joaillerie">{language === 'FR' ? "Matrice d'Orfèvrerie Or 18K & Chaînes serties" : '18K Jewelry / Fine Chains'}</option>
                  <option value="Garantie">{language === 'FR' ? 'Garantie Mouvement Horlogerie Calibres' : 'Watch Calibre Warranty'}</option>
                  <option value="Livraison">{language === 'FR' ? 'Porteur Privé Diplomatique' : 'Private Secure Courier'}</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? 'Votre Adresse Email Privée *' : 'Your Private Email *'}</label>
                <input
                  id="care-email-input"
                  type="email"
                  required
                  value={careEmail}
                  onChange={(e) => setCareEmail(e.target.value)}
                  placeholder={language === 'FR' ? 'Votre adresse e-mail' : 'Your email address'}
                  className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? 'Libellé du Message *' : 'Message Details *'}</label>
                <textarea
                  id="care-msg-textarea"
                  required
                  rows={4}
                  value={careMessage}
                  onChange={(e) => setCareMessage(e.target.value)}
                  placeholder={language === 'FR' ? "Indiquez ici vos précisions d'ajustements..." : 'Share your tailoring, jewelry, delivery, or warranty details...'}
                  className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3.5 text-white focus:outline-none focus:border-amber-400 rounded"
                />
              </div>

              {error && (
                <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
                  {error}
                </p>
              )}

              <button
                id="btn-submit-care"
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-amber-400 text-black font-mono font-bold tracking-widest text-xs uppercase rounded duration-300 cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? (language === 'FR' ? 'Transmission...' : 'Sending...') : (language === 'FR' ? 'Expédier mon Pli Concierge' : 'Send Concierge Request')}</span>
              </button>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
