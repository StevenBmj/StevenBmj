/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldCheck, Award, Heart, Shield } from 'lucide-react';

export default function AboutUs() {
  const { language, settings } = useApp();

  const titleFr = settings?.aboutTitle || "MAISON STEVENBMJ — L'OR ET LA COMPLICATION";
  const titleEn = settings?.aboutTitleEn || "MAISON STEVENBMJ — RAW PRECIOUS MASS & COMPLICATIONS";
  const contentFr = settings?.aboutContent || "Fondée sur le principe de la souveraineté esthétique absolue, la Maison StevenBmj fusionne l'artisanat milanais avec l'ingénierie horlogère suisse de pointe. Chaque pièce de notre catalogue est sculptée dans des matières nobles : or pur 24K, diamants rutilants de pureté VVS1, et cuirs au tannage minéral d'exception.";
  const contentEn = settings?.aboutContentEn || "Founded on the principle of absolute aesthetic sovereignty, Maison StevenBmj fuses Milanese sartorial mastery with top-tier Swiss watchmaking. Every single piece in our vault is meticulously carved out of pristine elements: raw 24K gold, blazing VVS1 diamonds, and hand-tanned grade-A full grain leathers.";

  const activeTitle = language === 'FR' ? titleFr : titleEn;
  const activeContent = language === 'FR' ? contentFr : contentEn;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-left" id="about-us-view">
      
      {/* Visual Header Grid banner with premium badge */}
      <div className="border-b border-white/5 pb-8 mb-16">
        <div className="flex items-center space-x-2 text-amber-500 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500 stroke-1" />
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase block">
            {language === 'FR' ? "L'HERITAGE DE PRESTIGE" : "LEGACY OF EXCELLENCE"}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-light text-white tracking-widest uppercase mt-2 font-sans md:leading-tight">
          {activeTitle}
        </h1>
        <p className="text-xs text-neutral-500 max-w-2xl mt-3 leading-relaxed">
          {language === 'FR'
            ? "Découvrez l’univers intemporel d’un couturier et orfèvre d’exception. Une fusion éternelle de technique brute et d’élégance souveraine."
            : "Explore the timeless universe of a bespoke tailor and master goldsmith. A sovereign fusion of technology, rare matter, and elegance."}
        </p>
      </div>

      {/* Main Story Narrative and Visual Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Hand: High prestige story text box */}
        <div className="lg:col-span-7 space-y-8 bg-neutral-950/40 p-8 rounded-lg border border-white/5 backdrop-blur-sm">
          <div className="space-y-4">
            <h2 className="text-lg font-light tracking-widest uppercase text-white font-sans">
              {language === 'FR' ? "NOTRE MANIFESTE" : "OUR MANIFESTO"}
            </h2>
            <div className="w-12 h-[1px] bg-amber-500" />
          </div>
          <p className="text-sm font-light leading-relaxed text-neutral-300 font-sans whitespace-pre-wrap">
            {activeContent}
          </p>
          <p className="text-xs font-mono text-neutral-500 leading-relaxed uppercase">
            {language === 'FR'
              ? "* Chaque modèle est numéroté, estampillé du poinçon de la Maison StevenBmj et accompagné de son certificat d'authenticité numérique sécurisé."
              : "* Every model is individually numbered, hand-punched with the StevenBmj seal, and issued a secure digital authentication record."}
          </p>
        </div>

        {/* Right Hand: Bento stats boxes */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <div className="bg-neutral-950 p-6 rounded-lg border border-white/5 space-y-2">
            <ShieldCheck className="w-6 h-6 text-amber-500 stroke-1" />
            <p className="text-2xl font-light font-sans text-white">100%</p>
            <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
              {language === 'FR' ? "Matières Nobles Certifiées" : "Certified Pure Materials"}
            </p>
          </div>

          <div className="bg-neutral-950 p-6 rounded-lg border border-white/5 space-y-2">
            <Award className="w-6 h-6 text-amber-500 stroke-1" />
            <p className="text-2xl font-light font-sans text-white">24 Mois</p>
            <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
              {language === 'FR' ? "Garantie de Manufacture Suisse" : "Swiss Manufacture Warranty"}
            </p>
          </div>

          <div className="bg-neutral-950 p-6 rounded-lg border border-white/5 space-y-2">
            <Heart className="w-6 h-6 text-amber-500 stroke-1" />
            <p className="text-2xl font-light font-sans text-white">12,500+</p>
            <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
              {language === 'FR' ? "Membres Élite VIP Actifs" : "Elite VIP Members Satisfied"}
            </p>
          </div>

          <div className="bg-neutral-950 p-6 rounded-lg border border-white/5 space-y-2">
            <Shield className="w-6 h-6 text-amber-500 stroke-1" />
            <p className="text-2xl font-light font-sans text-white">3 Ateliers</p>
            <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
              Paris • Cotonou • Genève
            </p>
          </div>

        </div>

      </div>

      {/* Core Values banner block */}
      <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/20 p-8 rounded-lg mt-16 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <p className="text-xs font-mono text-amber-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            {language === 'FR' ? "L'OR, LA MATIÈRE SOUVERAINE" : "GOLD, THE SOVEREIGN MATTER"}
          </p>
          <p className="text-sm font-light text-neutral-300 max-w-4xl leading-relaxed">
            {language === 'FR'
              ? "StevenBmj ne conçoit pas seulement des vêtements et garde-temps. Nous sculptons votre souveraineté esthétique. Chaque maillon de nos chaînes 24k et chaque composant de nos tourbillons mécaniques portent la signature d'une ingénierie d'élites, alliant l'arrogance de l'or pur à la rigueur de l'orfèvrerie éternelle."
              : "StevenBmj does not merely curate apparel and watches. We sculpt your aesthetic sovereignty. Every single link in our 24k chains and each gear in our mechanical tourbillons holds the signature of elite engineering, fusing raw gold boldness with Swiss precision."}
          </p>
        </div>
      </div>

    </div>
  );
}
