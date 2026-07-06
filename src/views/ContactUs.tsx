/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

export default function ContactUs() {
  const { language, settings } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const titleFr = settings?.contactTitle || "SALON PRIVÉ & SERVICES CONCIERGERIE";
  const titleEn = settings?.contactTitleEn || "PRIVATE VAULT & CONCIERGE SERVICES";
  const addressFr = settings?.contactAddress || "Avenue du Prestige, Quartier Akpakpa, Cotonou, Bénin. (En face de la Zone Résidentielle)";
  const addressEn = settings?.contactAddressEn || "Prestige Avenue, Akpakpa District, Cotonou, Benin. (Opposite the Residential Enclave)";
  const mapUrl = settings?.googleMapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.482701053427!2d2.463388!3d6.360155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x102355db7cb9b51%3A0xbc78051743e47fdc!2sAkpakpa%2C%20Cotonou!5e0!3m2!1sfr!2sbj!4v1700000000000";

  const activeTitle = language === 'FR' ? titleFr : titleEn;
  const activeAddress = language === 'FR' ? addressFr : addressEn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (/\d/.test(name)) {
      setError(language === 'FR' ? 'Le nom ne doit pas contenir de chiffres.' : 'The name cannot contain numbers.');
      return;
    }
    if (name && email && message) {
      setLoading(true);
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Erreur d'envoi.");
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
      } catch (err: any) {
        setError(err.message || (language === 'FR' ? "Impossible d'envoyer le message." : 'Unable to send message.'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-left" id="contact-us-view">
      
      {/* Visual Header Grid banner with premium badge */}
      <div className="border-b border-white/5 pb-8 mb-16">
        <div className="flex items-center space-x-2 text-amber-500 mb-2">
          <MapPin className="w-4 h-4 text-amber-500 stroke-1" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase block">
            {language === 'FR' ? "LIVRAISON & ATELIER" : "VAULTS & CONCIERGERIE"}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-light text-white tracking-widest uppercase mt-2 font-sans md:leading-tight">
          {activeTitle}
        </h1>
        <p className="text-xs text-neutral-500 max-w-2xl mt-3 leading-relaxed">
          {language === 'FR'
            ? "Pour toute commande sur-mesure d'un costume, demande de complication horlogère, ou programmation de visite privée de nos salons."
            : "For bespoke couture requests, watch complications consulting, or organizing private appointments in our local galleries."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Hand: Contact Coordinates details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-neutral-950/60 border border-white/5 rounded-lg p-6 space-y-6">
            <h3 className="text-xs font-mono tracking-widest text-amber-500 uppercase font-bold border-b border-white/5 pb-2">
              {language === 'FR' ? "COORDONNÉES" : "REACH US"}
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3.5">
                <MapPin className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 stroke-1" />
                <div className="space-y-1">
                  <p className="text-white font-medium">{language === 'FR' ? "NOTRE ATELIER COTONOU" : "COTONOU SHOWROOM"}</p>
                  <p className="text-neutral-400 font-sans leading-relaxed">{activeAddress}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Phone className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 stroke-1" />
                <div className="space-y-1">
                  <p className="text-white font-medium">{language === 'FR' ? "Téléphone & WhatsApp Conciergerie" : "Concierge Phone & WhatsApp"}</p>
                  <div className="flex flex-col space-y-1">
                    <a href="tel:+2290155468138" className="text-neutral-400 hover:text-amber-400 font-mono transition-all block">
                      +229 01 55 46 8138
                    </a>
                    <a href="tel:0144158044" className="text-neutral-400 hover:text-amber-400 font-mono transition-all block">
                      01 44 15 80 44
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Mail className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 stroke-1" />
                <div className="space-y-1">
                  <p className="text-white font-medium">{language === 'FR' ? 'Secrétariat Général / Email' : 'General Secretariat / Email'}</p>
                  <p className="text-neutral-400 font-mono">stevenbmj202@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <Clock className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 stroke-1" />
                <div className="space-y-1">
                  <p className="text-white font-medium">{language === 'FR' ? "Horaires d'Ouverture" : "Salon Hours"}</p>
                  <p className="text-neutral-400 font-sans">{language === 'FR' ? "Lundi - Samedi : 09h - 20h" : "Monday - Saturday: 09AM - 08PM"}</p>
                  <p className="text-neutral-500 font-sans">{language === 'FR' ? "Uniquement sur rendez-vous privé" : "Strictly private appointments only"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Secure client contact messaging box */}
        <div className="lg:col-span-8 bg-neutral-950/40 p-8 rounded-lg border border-white/5 backdrop-blur-sm space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-light tracking-widest uppercase text-white font-sans">
              {language === 'FR' ? "LIVRER UN DOSSIER DE PRESTIGE" : "CONSIGN SECURE RECORD"}
            </h2>
            <div className="w-12 h-[1px] bg-amber-500" />
          </div>

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded text-left space-y-2">
              <p className="text-sm font-semibold text-emerald-400 uppercase font-mono tracking-wider">
                {language === 'FR' ? '✓ TRANSMISSION EFFECTUÉE AVEC NOTIFICATION CONCIERGE' : '✓ TRANSMISSION SENT TO THE CONCIERGE DESK'}
              </p>
              <p className="text-xs text-neutral-400">
                {language === 'FR'
                  ? "Votre message d'exception a été sécurisé et transmis à notre secrétariat. Nous vous répondrons dans l'heure."
                  : "Your executive query has been logged securely and forwarded to the General Consul. Expect feedback within 1 hour."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? "Votre Nom *" : "Your Name *"}</label>
                  <input
                    id="contact-form-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/\d/g, ''))}
                    pattern="[^0-9]{2,}"
                    title={language === 'FR' ? 'Le nom ne doit pas contenir de chiffres.' : 'The name cannot contain numbers.'}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white rounded focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500/10 placeholder-neutral-700"
                    placeholder="M. Alexander"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? "Adresse E-Mail *" : "Your Email *"}</label>
                  <input
                    id="contact-form-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white rounded focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500/10 placeholder-neutral-700"
                    placeholder="alex@prestige.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? "Message d'élégance *" : 'Prestige Message *'}</label>
                <textarea
                  id="contact-form-msg"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white rounded focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500/10 placeholder-neutral-700"
                  placeholder={language === 'FR' ? "Décrivez-nous vos envies de couture d'exception..." : "Describe your bespoke tailoring or high jewelry details..."}
                />
              </div>

              {error && (
                <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest">
                  {error}
                </p>
              )}

              <button
                id="btn-submit-contact"
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-mono text-[10.5px] font-black uppercase tracking-widest rounded cursor-pointer duration-300 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? (language === 'FR' ? "Transmission..." : "Sending...") : (language === 'FR' ? "Envoyer le Message d'Exception" : "Transmit Secure Inquiry")}</span>
              </button>
            </form>
          )}

          {/* Map pin view centered in Akpakpa Cotonou */}
          <div className="space-y-3 pt-4">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
              {language === 'FR' ? "NOTRE LOCALISATION EXCLUSIVE — AKPAKPA, COTONOU" : "EXCLUSIVE SECURE LOCATION — AKPAKPA DISTRICT"}
            </span>
            <div className="w-full h-80 rounded overflow-hidden border border-white/10 relative">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="StevenBmj Akpakpa Showroom Location Map"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
