/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Target, Map, Users, Store } from 'lucide-react';

export default function AboutUs() {
  const { language } = useApp();

  const fr = language === 'FR';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-left" id="about-us-view">
      <div className="border-b border-white/5 pb-8 mb-14">
        <div className="flex items-center space-x-2 text-amber-500 mb-2">
          <Sparkles className="w-4 h-4 stroke-1" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase">
            {fr ? "IDENTITÉ & VISION" : "IDENTITY & VISION"}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-light text-white tracking-widest uppercase mt-2 md:leading-tight">
          {fr ? "STEVENBMJ — STYLE MASCULIN PREMIUM" : "STEVENBMJ — PREMIUM MEN'S STYLE"}
        </h1>
        <p className="text-sm text-neutral-400 max-w-3xl mt-4 leading-relaxed">
          {fr
            ? "StevenBmj est une marque béninoise dédiée à l'univers du style masculin. Notre sélection réunit mode, montres, chaussures et accessoires avec une même exigence : proposer une expérience cohérente, élégante et accessible."
            : "StevenBmj is a Beninese brand dedicated to men's style. Our selection brings together fashion, watches, footwear and accessories with one ambition: a coherent, elegant and accessible customer experience."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
        <div className="bg-neutral-950/50 border border-white/5 rounded-lg p-8 space-y-5">
          <Target className="w-6 h-6 text-amber-500 stroke-1" />
          <h2 className="text-lg font-light tracking-widest uppercase text-white">
            {fr ? "NOTRE POSITIONNEMENT" : "OUR POSITIONING"}
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {fr
              ? "Nous construisons StevenBmj comme une marque de style masculin premium : une sélection de pièces et d'accessoires pensée pour permettre au client de composer une allure complète, du détail à la tenue."
              : "We are building StevenBmj as a premium men's style brand: a curated selection of fashion and accessories designed to help customers build a complete look, from detail to outfit."}
          </p>
        </div>

        <div className="bg-neutral-950/50 border border-white/5 rounded-lg p-8 space-y-5">
          <Map className="w-6 h-6 text-amber-500 stroke-1" />
          <h2 className="text-lg font-light tracking-widest uppercase text-white">
            {fr ? "NOTRE AMBITION" : "OUR AMBITION"}
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {fr
              ? "Structurer la marque au Bénin, renforcer ses opérations, son expérience client et son identité, puis préparer une expansion disciplinée vers d'autres villes et marchés d'Afrique de l'Ouest."
              : "Strengthen the brand in Benin, standardize operations and customer experience, then prepare disciplined expansion into other cities and West African markets."}
          </p>
        </div>
      </div>

      <div className="border border-amber-500/20 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 rounded-lg p-8 mb-14">
        <div className="flex items-center gap-3 mb-5">
          <Store className="w-5 h-5 text-amber-500 stroke-1" />
          <h2 className="text-lg font-light tracking-widest uppercase text-white">
            {fr ? "DÉVELOPPEMENT & PARTENARIATS" : "EXPANSION & PARTNERSHIPS"}
          </h2>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed max-w-4xl">
          {fr
            ? "StevenBmj est actuellement en phase de structuration et d'étude de son futur modèle d'expansion. Nous échangeons avec des professionnels du retail, des partenaires et des réseaux expérimentés afin de standardiser l'approvisionnement, le merchandising, le digital, la gestion du stock et l'expérience de marque avant toute réplication du concept."
            : "StevenBmj is currently structuring and studying its future expansion model. We are engaging with retail professionals, partners and experienced networks to standardize sourcing, merchandising, digital operations, inventory management and brand experience before replicating the concept."}
        </p>
        <p className="text-xs text-amber-400 mt-5 font-mono uppercase tracking-widest">
          {fr ? "BÉNIN → AFRIQUE DE L'OUEST" : "BENIN → WEST AFRICA"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Sparkles className="w-5 h-5 text-amber-500 stroke-1" />,
            titleFr: "ÉLÉGANCE",
            titleEn: "ELEGANCE",
            bodyFr: "Une identité visuelle forte et une sélection cohérente.",
            bodyEn: "A strong visual identity and a coherent selection."
          },
          {
            icon: <Users className="w-5 h-5 text-amber-500 stroke-1" />,
            titleFr: "SERVICE",
            titleEn: "SERVICE",
            bodyFr: "Une relation client directe, attentive et durable.",
            bodyEn: "A direct, attentive and lasting customer relationship."
          },
          {
            icon: <Store className="w-5 h-5 text-amber-500 stroke-1" />,
            titleFr: "STRUCTURATION",
            titleEn: "STRUCTURE",
            bodyFr: "Des processus simples, mesurables et reproductibles avant l'expansion.",
            bodyEn: "Simple, measurable and repeatable processes before expansion."
          }
        ].map((item) => (
          <div key={item.titleFr} className="bg-neutral-950 p-6 rounded-lg border border-white/5 space-y-3">
            {item.icon}
            <h3 className="text-sm text-white font-mono uppercase tracking-widest">
              {fr ? item.titleFr : item.titleEn}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {fr ? item.bodyFr : item.bodyEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
