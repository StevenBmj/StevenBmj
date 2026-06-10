/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';
import { Award, Star, ShieldCheck, Mail, Send, Award as Crown, Heart, Sparkles } from 'lucide-react';

export default function VipClub() {
  const { language, vipPoints, addVipPoints } = useApp();
  
  // Ambassador application states
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [instagram, setInstagram] = useState('');
  const [applied, setApplied] = useState(false);

  // Private VIP exclusive catalog preorders mock
  const privateCollections = [
    {
      id: "pre-1",
      name: "Chronographe Tourbillon SBMJ-VIII (Précommande)",
      price: "185 000 €",
      deposit: "18 500 €",
      availability: "Automne 2026 (7 exemplaires mondiaux)",
      image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop"
    },
    {
      id: "pre-2",
      name: "Parure Royale Diamants Noir & Or 24K",
      price: "42 000 €",
      deposit: "4 200 €",
      availability: "Ajustée Place Vendôme (Unique)",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop"
    }
  ];

  const handleApplyAmbassador = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName && city && instagram) {
      setApplied(true);
      addVipPoints(500); // Massive loyalty reward points for enrolling!
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-left">
      
      {/* Title identity block */}
      <div className="border-b border-white/5 pb-8 mb-12">
        <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">SALONS PRIVÉS CONFIDENTIELS</span>
        <h1 className="text-3xl md:text-5xl font-light text-white tracking-widest uppercase mt-2 font-sans">
          StevenBmj VIP Suite
        </h1>
        <p className="text-xs text-neutral-500 max-w-2xl mt-1 leading-relaxed">
          Le cercle très privé des collectionneurs de prestige. Profitez du système d'accumulation de vos points SBMJ, de défilés et de pièces d'attribution souveraine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Hand Column: VIP Point Engine Tracker */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Card status tracking points */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-6 rounded-lg border border-amber-500/30 text-left relative overflow-hidden shadow-2xl">
            
            {/* Elegant luxury visual badge in corner */}
            <div className="absolute -right-6 -bottom-6 opacity-5 rotate-12">
              <Logo size={150} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono bg-amber-400 text-black px-2.5 py-1.5 rounded uppercase font-bold tracking-widest">
                CARTE ELITE PRESTIGE
              </span>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>

            <div className="py-8 space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">SOLDE DE POINTS SBMJ :</span>
              <p className="text-4xl font-black font-mono text-white tracking-tight">{vipPoints} PTS</p>
              <p className="text-[10px] text-amber-500/80 uppercase font-mono tracking-wider pt-2">
                ✓ STATUT ÉMETTEUR DOUBLE-NŒUD ACCRÉDITÉ
              </p>
            </div>

            {/* Loyalty levels tiers list table */}
            <div className="border-t border-white/5 pt-4 space-y-3 font-mono text-[10px] text-neutral-400">
              <p className="text-white font-semibold">VOS PRIVILÈGES SÉLECTIONNÉS :</p>
              <div className="flex justify-between">
                <span>• Concierge dédié par canal direct</span>
                <span className="text-emerald-400 font-bold uppercase">Actif</span>
              </div>
              <div className="flex justify-between">
                <span>• Essayages ateliers prioritaires</span>
                <span className="text-emerald-400 font-bold uppercase">Actif</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>• Accès Vernissages Paris (10k pts requis)</span>
                <span>{vipPoints >= 10000 ? 'Debloqué' : 'Verrouillé'}</span>
              </div>
            </div>

          </div>

          {/* Quick interactive Points accumulation game */}
          <div className="bg-neutral-950 p-6 rounded-lg border border-white/5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">ATTRIBUTION IMMÉDIATE DE POINTS</h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Notre protocole certifie votre intégrité. Cliquez ci-dessous pour signer notre registre de fidélité et recevoir immédiatement <span className="text-amber-500">100 points de bienvenue additionnels</span> !
            </p>
            <button
              id="btn-vip-add-pts"
              onClick={() => addVipPoints(100)}
              className="w-full h-11 bg-neutral-900 border border-amber-500/25 text-amber-500 hover:bg-amber-400 hover:text-black font-mono font-bold text-xs uppercase rounded duration-300 cursor-pointer"
            >
              Signer le Protocole (+100 PTS)
            </button>
          </div>

        </div>

        {/* Right Hand Column: Private pre-orders / Ambassadorship program */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Section 1: Pre-Orders allocation space */}
          <div className="space-y-6">
            <h3 className="text-lg font-light tracking-[0.25em] text-white uppercase flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500 stroke-1" />
              <span>Attributions Confidentielles</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {privateCollections.map((pc) => (
                <div key={pc.id} className="bg-neutral-950 rounded-lg p-5 border border-white/5 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="aspect-video bg-neutral-900 rounded overflow-hidden">
                    <img
                      src={pc.image}
                      alt={pc.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover filter brightness-[0.6] hover:brightness-[0.9] transition-transform duration-500 hover:scale-102"
                    />
                  </div>
                  
                  <div className="space-y-1.5 text-left">
                    <h4 className="text-sm font-semibold text-white uppercase tracking-wider">{pc.name}</h4>
                    <p className="text-[10px] text-neutral-500 font-mono">DÉPÔT DE PRÉ-FABRICATION requis : <span className="text-amber-500 font-bold">{pc.deposit}</span></p>
                    <p className="text-[10px] text-neutral-500 font-mono">EN INVENTAIRE GLOBAL : {pc.price}</p>
                    <p className="text-[9px] bg-red-950/40 border border-red-500/20 text-red-400 p-1 rounded inline-block uppercase font-mono">{pc.availability}</p>
                  </div>

                  <a
                    href="https://wa.me/22955468138?text=Je%20souhaite%20precommander%20une%20piece%20exceptionnelle%20SBMJ"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-center py-2.5 bg-amber-400 text-black hover:bg-amber-300 uppercase font-mono font-bold tracking-widest text-[10px] rounded transition-transform duration-300 shadow"
                  >
                    Consigner par Concierge WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Ambassadorship sign up */}
          <div className="bg-neutral-950/20 border border-white/5 rounded-lg p-6 md:p-8 space-y-6">
            
            <div className="text-left">
              <h3 className="text-lg font-light tracking-[0.2em] text-white uppercase">
                Devenir Ambassadeur de la Maison
              </h3>
              <p className="text-xs text-neutral-505 leading-relaxed font-light mt-1 text-neutral-500">
                Représentez l’élégance StevenBmj mondialement. Partagez l'artisanat d'Afrique de l'Ouest et d'Europe haut de gamme à votre audience.
              </p>
            </div>

            {!applied ? (
              <form onSubmit={handleApplyAmbassador} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Nom d'influence *</label>
                  <input
                    id="ambassador-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Steven Bmj"
                    className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Ville Résidence *</label>
                  <input
                    id="ambassador-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cotonou / Paris"
                    className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Compte Instagram *</label>
                  <input
                    id="ambassador-instagram"
                    type="text"
                    required
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@stevenbmj"
                    className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                  />
                </div>

                <button
                  id="btn-apply-ambassador"
                  type="submit"
                  className="sm:col-span-3 w-full h-11 bg-amber-400 text-black hover:bg-amber-300 font-mono font-bold tracking-widest text-xs uppercase rounded duration-300 cursor-pointer text-center flex items-center justify-center gap-2 mt-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Soumettre ma Candidature de Prestige</span>
                </button>
              </form>
            ) : (
              // On Enroll successfully: render the Magnificent Customized Ambassador ID Prestige Card immediately!
              <div className="border border-double border-amber-500/20 p-6 rounded bg-neutral-950 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 animate-fade-in text-left">
                <div className="flex h-16 w-16 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-full items-center justify-center shadow-lg text-black font-semibold mx-auto sm:mx-0 font-mono text-lg shrink-0">
                  SBMJ
                </div>
                
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-yellow-400 font-bold uppercase tracking-widest font-mono text-xs flex items-center gap-1.5 justify-center sm:justify-start">
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    AMBASSADEUR PRESTIGE AGRÉÉ
                  </p>
                  <p className="text-sm font-light text-white uppercase">{fullName}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">INDEX ID: AMB-{Date.now().toString().slice(-6)} • {city}</p>
                  <p className="text-[10px] text-neutral-500 font-mono">INSTA CODE: {instagram}</p>
                  <span className="text-[9px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider inline-block mt-2">
                    ✓ CARTE ATTRIBUÉE – +500 PTS CRÉDITÉS
                  </span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
