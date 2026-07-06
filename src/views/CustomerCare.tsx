/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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

  const faqs = (() => {
    if (settings && settings.faqsJson) {
      try {
        const parsed = JSON.parse(settings.faqsJson);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            qFr: item.q || item.qFr || '',
            qEn: item.qEn || item.qEn || item.q || '',
            aFr: item.a || item.aFr || '',
            aEn: item.aEn || item.aEn || item.a || ''
          }));
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
        aFr: "Nos créations sont emballées dans un coffret de cèdre naturel scellé à la cire dorée de la Maison. Les commandes de grande valeur sont expédiées par porteur privé de sécurité de bout en bout en Afrique de l'Ouest, Europe, Asie et Amérique.",
        aEn: "Our creations are enveloped in natural cedar wood boxes hand-sealed with the House's golden wax. High value collections are carried by signature secure couriers across West Africa, Europe and the Americas."
      },
      {
        qFr: "Quelles sont les garanties d'authenticité et de noblesse des matières ?",
        qEn: "What are the authenticity and gold material guarantees?",
        aFr: "Chaque bijou StevenBmj est poinçonné 'Or 18k' ou 'Platine 950' selon l'alliage de prestige choisi. Nos diamants disposent d'un certificat individuel de pureté VVS1 de l'institut de gemmologie. Nos calibres horlogers bénéficient d'une garantie internationale globale de 24 mois.",
        aEn: "Every StevenBmj piece is hallmarked '18k Gold' or 'Platinum 950' depending on the alloy selected. Our diamonds are accompanied by authenticated VVS1 purity records from Swiss gemologists, while calibres carry international 24-month warranties."
      },
      {
        qFr: "Est-il possible d'ajuster une veste ou une manche à mes mesures ?",
        qEn: "Can I adjust a tailored suits jacket or sleeve to my exact size?",
        aFr: "Absolument. Lors de la commande, indiquez vos mensurations dans l'espace 'Notes d'Atelier'. Notre maître tailleur procède gracieusement aux retouches de cintrage et d'ourlet dans nos salons de Cotonou ou Paris avant l'expédition.",
        aEn: "Absolutely. When placing your order, specify your exact dimensions in the 'Atelier Notes' field. Our master tailors perform adjustments free of charge at our Cotonou or Paris salons prior to packaging."
      },
      {
        qFr: "Quels sont les délais d'attribution des pièces d'exception ?",
        qEn: "What are the delivery lead times for highly limited pieces?",
        aFr: "Pour les pièces signalées 'Édition de Prestige' ou sous commande, la fabrication requiert généralement 7 à 14 jours de façonnage minutieux au chalumeau d'artisanat d'art, suivis d'une expédition par coursier express immédiate.",
        aEn: "For items labeled 'Prestige Edition' or custom orders, creation takes between 7 and 14 days of meticulous sculpting, followed by immediate express dispatch."
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
        <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">DESK DE SOUVERAINETÉ CLIENT</span>
        <h1 className="text-3xl md:text-5xl font-light text-white tracking-widest uppercase mt-2 font-sans">
          {settings?.careTitle ? (
            language === 'FR' ? settings.careTitle : settings.careTitleEn
          ) : (
            "StevenBmj Concierge Desk"
          )}
        </h1>
        <p className="text-xs text-neutral-500 max-w-2xl mt-1 leading-relaxed">
          {settings?.careContent ? (
            language === 'FR' ? settings.careContent : settings.careContentEn
          ) : (
            language === 'FR'
              ? "Un conseiller d'artisanat à votre écoute pour orchestrer vos désirs horlogers, de broderie d'art et d'expédition diplomatique."
              : "Un conseiller d'artisanat à votre écoute pour orchestrer vos désirs horlogers, de broderie d'art et d'expédition diplomatique."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Hand: Collapsible luxury FAQs */}
        <div className="space-y-6">
          <h3 className="text-lg font-light tracking-[0.25em] text-white uppercase flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500 stroke-1" />
            <span>Questions Fréquentes</span>
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
              <p className="text-[10px] font-mono text-neutral-500 uppercase">WhatsApp Direct Concierge</p>
              <a 
                href="https://wa.me/22955468138" 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-white hover:text-amber-400 duration-300 font-bold tracking-wider mt-1 block"
              >
                +229 55 46 81 38 (24/7)
              </a>
            </div>

            <div className="bg-neutral-950 p-5 rounded border border-white/5 text-left">
              <Clock className="w-4.5 h-4.5 text-amber-500 mb-2 stroke-1" />
              <p className="text-[10px] font-mono text-neutral-500 uppercase">Temps de Réponse</p>
              <p className="text-xs text-white mt-1 font-bold">Moins de 15 minutes</p>
            </div>
          </div>

        </div>

        {/* Right Hand: Submittable Care forms */}
        <div className="bg-neutral-950/25 border border-white/5 rounded-lg p-6 md:p-8 space-y-6">
          <div className="text-left border-b border-white/5 pb-4">
            <h3 className="text-lg font-light tracking-[0.2em] text-white uppercase">
              Rédiger un Ordre d'Information Privé
            </h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Consignez vos questions d'atelier ou de mensurations spécifiques ci-dessous. Un compagnon tailleur traitera votre pli avec discrétion.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-center rounded space-y-3 font-mono text-xs uppercase">
              <p className="text-base font-bold text-white">✓ Vœu Transmis avec Succès</p>
              <p>Votre ordonnance a été consignée sous clé. Nous vous répondrons sous 15 minutes par mail de prestige.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-amber-500 underline text-[10px] tracking-widest block mx-auto pt-4 font-bold cursor-pointer"
              >
                Générer un nouvel ordre d'écriture
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitCare} className="space-y-4">
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">Thématique d'Atelier *</label>
                <select
                  id="care-topic-select"
                  value={careTopic}
                  onChange={(e) => setCareTopic(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 text-xs px-3 h-11 text-neutral-300 select-all cursor-pointer"
                >
                  <option value="Mesure">Ajustements Mensurations / Haute Robe / Costumes</option>
                  <option value="Joaillerie">Matrice d'Orfèvrerie Or 18K & Chaînes serties</option>
                  <option value="Garantie">Garantie Mouvement Horlogerie Calibres</option>
                  <option value="Livraison">Porteur Privé Diplomatique</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">Votre Adresse Email Privée *</label>
                <input
                  id="care-email-input"
                  type="email"
                  required
                  value={careEmail}
                  onChange={(e) => setCareEmail(e.target.value)}
                  placeholder="Steven@ambassadeur.org"
                  className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">Libellé du Message *</label>
                <textarea
                  id="care-msg-textarea"
                  required
                  rows={4}
                  value={careMessage}
                  onChange={(e) => setCareMessage(e.target.value)}
                  placeholder="Indiquez ici vos précisions d'ajustements..."
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
                <span>{loading ? 'Transmission...' : 'Expédier mon Pli Concierge'}</span>
              </button>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
