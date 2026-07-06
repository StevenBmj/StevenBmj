/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ShieldCheck, Award, Gem, Check, Star, MessageSquare, Pen } from 'lucide-react';

interface HomeHeroProps {
  setView: (view: string) => void;
}

// 1. TypewriterTitle component reflecting User's core request
function TypewriterTitle() {
  const fullText = "StevenBmj";
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!isDeleting && index < fullText.length) {
      // Type next character
      timer = setTimeout(() => {
        setDisplayText(prev => prev + fullText.charAt(index));
        setIndex(index + 1);
      }, 200); // Elegant deliberate speed
    } else if (isDeleting && index > 0) {
      // Delete last character
      timer = setTimeout(() => {
        setDisplayText(prev => prev.slice(0, -1));
        setIndex(index - 1);
      }, 120); // Steady erasure
    } else if (index === fullText.length && !isDeleting) {
      // Completed writing: Hold for 5 seconds as requested by user
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 5000);
    } else if (index === 0 && isDeleting) {
      // Completed deleting: Hold 1 second and retype
      timer = setTimeout(() => {
        setIsDeleting(false);
      }, 1000);
    }

    return () => clearTimeout(timer);
  }, [index, isDeleting]);

  return (
    <span className="relative text-amber-100 tracking-[0.18em]">
      {displayText}
      <span className="inline-block w-[3px] h-[0.8em] bg-amber-400 ml-1 animate-pulse" />
    </span>
  );
}

function HeroBackground() {
  const { settings } = useApp();
  const defaultImages = [
    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1600&auto=format&fit=crop"
  ];

  const src1 = settings?.homepageHeroImage1 || defaultImages[0];
  const src2 = settings?.homepageHeroImage2 || defaultImages[1];
  const src3 = settings?.homepageHeroImage3 || defaultImages[2];

  const images = [
    {
      src: src1,
      animate: { scale: [1, 1.08, 1], x: [0, 10, 0] },
      transition: { duration: 10, ease: "easeInOut" }
    },
    {
      src: src2,
      animate: { scale: [1.06, 1, 1.06], x: [0, -20, 0] },
      transition: { duration: 10, ease: "easeInOut" }
    },
    {
      src: src3,
      animate: { scale: [1.1, 1.02, 1.1], y: [0, -15, 0] },
      transition: { duration: 10, ease: "easeInOut" }
    },
    {
      src: defaultImages[3],
      animate: { scale: [1, 1.1, 1], y: [0, 20, 0] },
      transition: { duration: 10, ease: "easeInOut" }
    },
    {
      src: defaultImages[4],
      animate: { scale: [1.08, 1, 1.08], rotate: [0, 0.5, 0] },
      transition: { duration: 10, ease: "easeInOut" }
    }
  ];

  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 10000); // Transitions exactly every 10 seconds
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent z-10" />
      {images.map((img, index) => {
        if (index !== currentIdx) return null;
        return (
          <motion.img
            key={index}
            src={img.src}
            alt="StevenBmj Majestic Background"
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.35]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, ...img.animate }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease: "easeInOut" },
              scale: { duration: img.transition.duration, repeat: Infinity, ease: img.transition.ease },
              x: { duration: img.transition.duration, repeat: Infinity, ease: img.transition.ease },
              y: { duration: img.transition.duration, repeat: Infinity, ease: img.transition.ease },
              rotate: { duration: img.transition.duration, repeat: Infinity, ease: img.transition.ease }
            }}
          />
        );
      })}
    </div>
  );
}

export default function HomeHero({ setView }: HomeHeroProps) {
  const { language, settings } = useApp();

  return (
    <div className="space-y-32 bg-black pb-24 overflow-hidden">
      
      {/* 1. Cinematic Hero Section with Ken Burns zoom animation */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden bg-black py-20">
        <HeroBackground />

        {/* Floating cinematic text inside Hero with stagged fade animation */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center space-y-7 sm:space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center space-x-2.5 bg-neutral-900/80 border border-amber-500/20 px-5 py-2.5 rounded-full backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.12em] sm:tracking-[0.25em] text-amber-300 font-bold">
              {settings?.homepageHeroTitle ? (
                language === 'FR' ? settings.homepageHeroTitle : settings.homepageHeroTitleEn
              ) : (
                language === 'FR' ? "ATELIER HAUTE HORLOGERIE & COUTURE" : "PRESTIGE HOROLOGY & COUTURE"
              )}
            </span>
          </motion.div>

          {/* Typewriter Title area */}
          <h1 className="text-4xl min-[360px]:text-5xl sm:text-7xl md:text-8xl font-sans font-extralight uppercase leading-none min-h-[1.2em] break-words">
            <TypewriterTitle />
          </h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.2 }}
            className="text-[11px] sm:text-sm font-light text-neutral-400 max-w-2xl mx-auto leading-relaxed uppercase tracking-[0.1em] sm:tracking-[0.2em]"
          >
            {settings?.homepageHeroSubtitle ? (
              language === 'FR' ? settings.homepageHeroSubtitle : settings.homepageHeroSubtitleEn
            ) : (
              language === 'FR' 
                ? "L'alliance absolue du perfectionnisme horloger suisse, de la joaillerie or 18k et du tailoring contemporain pour l'homme d'influence."
                : "The absolute synergy of Swiss horological precision, 18-karat jewelry orfevrerie, and contemporary master tailoring."
            )}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
          >
            <button
              id="hero-btn-shop"
              onClick={() => setView('boutique')}
              className="w-full sm:w-auto px-6 sm:px-12 h-14 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black font-mono tracking-widest uppercase duration-300 rounded flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_25px_rgba(217,119,6,0.3)] transition-transform hover:-translate-y-0.5"
            >
              <span>{language === 'FR' ? "Explorer les Salons" : "Explore Exhibition halls"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-btn-about"
              onClick={() => setView('about')}
              className="w-full sm:w-auto px-6 sm:px-12 h-14 border border-white/10 bg-neutral-900/60 text-neutral-300 hover:text-white hover:border-amber-400 rounded text-xs font-mono uppercase tracking-widest duration-300 cursor-pointer transition-transform hover:-translate-y-0.5"
            >
              {language === 'FR' ? "L'Histoire de la Maison" : "Our Heritage Story"}
            </button>
          </motion.div>
        </div>

        {/* Scroll down indicator line */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 z-10 opacity-70">
          <span className="text-[8px] font-mono tracking-[0.3em] uppercase text-neutral-400">SCROLL DE PRESTIGE</span>
          <div className="h-12 w-[1.5px] bg-gradient-to-b from-amber-400 to-transparent animate-pulse" />
        </div>
      </section>

      {/* 2. Interactive Scroll-Triggered Brand Story / Manifest Heritage */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Animated Image Slide-In */}
          <motion.div 
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-square max-w-lg mx-auto bg-neutral-900 rounded-lg overflow-hidden border border-white/5 shadow-2xl"
          >
            <img
              src={settings?.storyImage || "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=600&auto=format&fit=crop"}
              alt="Tailoring Creation SBMJ"
              className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-neutral-950/20" />
            <div className="absolute bottom-6 left-6 right-6 border border-amber-500/25 bg-black/90 p-5 rounded backdrop-blur-md">
              <p className="font-mono text-[9px] text-amber-400 uppercase tracking-widest leading-none">Le Savoir-Faire Souverain</p>
              <p className="text-xs text-neutral-300 mt-2 italic">"Chaque couture subit 37 points de contrôle minutieux avant d'atteindre votre vestiaire respectif."</p>
            </div>
          </motion.div>

          {/* Animated Text Block Rise-up */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="space-y-8 text-left"
          >
            <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block">NOTRE PHILOSOPHIE</span>
            <h2 className="text-3xl sm:text-4xl font-extralight text-white uppercase tracking-wider leading-snug">
              {language === 'FR' 
                ? (settings?.storyTitleFr || "L'Art de Vivre sans Compromis sur le Raffinement") 
                : (settings?.storyTitleEn || "The Craft of Absolute and Timeless Masculine Silhouette")}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-light">
              {language === 'FR'
                ? (settings?.storyDescFr || "Fondée sur l'excellence horlogère des plus hauts calibres, la Maison StevenBmj imagine un vestiaire d'exception où s'unissent des lignes géométriques avant-gardistes et une orfèvrerie étincelante. Nos diamants sont sertis main et nos mocassins crêpes taillés dans les plus hauts grades de suède d'Italie.")
                : (settings?.storyDescEn || "Formed upon the highest peaks of horological art, the Maison StevenBmj crafts an elite gentlemen vestiary merging sharp architectural lines with glittering hand-paved 18k diamonds and authentic Italian crepe loafers.")}
            </p>

            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5 font-mono">
              <div className="space-y-1">
                <span className="text-sm font-bold text-white block">GENÈVE & PARIS</span>
                <span className="text-[10px] text-neutral-500 uppercase">CALIBRES ET TAILORING</span>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-bold text-white block">COTONOU ELITE</span>
                <span className="text-[10px] text-neutral-500 uppercase">ORFEVRERIE EXCLUSIVE</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. NEW SECTION: ENRICHED PRESTIGE FABRICS PORTFOLIO ("Good Luck", "Vlisco") */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-3"
        >
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block">
            {language === 'FR' ? "TISSUS ET TEXTILES D'EXCEPTION" : "EXQUISITE TEXTILES & FABRICS"}
          </span>
          <h2 className="text-3xl font-light text-white uppercase tracking-wider">
            {language === 'FR' ? "Étoffes Impériales & Tissus Nobles" : "Imperial Materials & Noble Fabrics"}
          </h2>
          <p className="text-xs text-neutral-500 max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
            {language === 'FR' 
              ? "StevenBmj sélectionne les créations textiles légendaires pour façonner vos plus belles parures d'apparat. Accédez à notre sélection d'étoffes royaux."
              : "StevenBmj hand-selects legendary world textiles to shape your luxury custom dress. Access our masterworks collection."}
          </p>
        </motion.div>

        {/* Horizontal scroll/slide layout for fabrics with luxury hover cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Fabric 1: Good Luck */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="group relative h-[420px] rounded-lg overflow-hidden border border-white/5 bg-neutral-950 flex flex-col justify-between p-6 cursor-pointer"
            onClick={() => setView('boutique')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={settings?.fabric1Image || "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop"} 
                alt="Tissu de Prestige Good Luck" 
                className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 duration-700 transition-transform" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-amber-400/90 text-[8px] font-mono uppercase font-bold text-black px-2.5 py-1 rounded">
                {language === 'FR' ? "LÉGENDE VIP" : "VIP LEGEND"}
              </span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>

            <div className="relative z-10 text-left space-y-2">
              <h3 className="text-lg font-light text-white uppercase tracking-wider font-sans group-hover:text-amber-400 duration-300">
                {language === 'FR' ? (settings?.fabric1TitleFr || "Tissu de Prestige \"Good Luck\"") : (settings?.fabric1TitleEn || "Prestige Fabric \"Good Luck\"")}
              </h3>
              <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                {language === 'FR' ? (settings?.fabric1DescFr || "Tissage jacquard de soie d'une brillance spectaculaire aux arabesques dorées, plébiscitée par l'élite et apportant bénédiction et fortune aux chefs d'influence.") : (settings?.fabric1DescEn || "Spectacular silk jacquard weave with golden arabesques, favored by elite circles, believed to summon luxury and fortune.")}
              </p>
              <div className="flex items-center gap-1 text-[9px] font-mono text-amber-500 uppercase tracking-widest pt-2">
                <span>{language === 'FR' ? "DÉCOUVRIR LE CATALOGUE DE TISSUS" : "EXPLORE CUSTOM FABRICS"}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 duration-300" />
              </div>
            </div>
          </motion.div>

          {/* Fabric 2: Vlisco Super Wax */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group relative h-[420px] rounded-lg overflow-hidden border border-white/5 bg-neutral-950 flex flex-col justify-between p-6 cursor-pointer"
            onClick={() => setView('boutique')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={settings?.fabric2Image || "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop"} 
                alt="Waxes Vlisco Authentique" 
                className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 duration-700 transition-transform" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-amber-400/90 text-[8px] font-mono uppercase font-bold text-black px-2.5 py-1 rounded">
                {language === 'FR' ? "WAX SOUVERAIN" : "SOVEREIGN WAX"}
              </span>
              <Gem className="w-4 h-4 text-amber-400" />
            </div>

            <div className="relative z-10 text-left space-y-2">
              <h3 className="text-lg font-light text-white uppercase tracking-wider font-sans group-hover:text-amber-400 duration-300">
                {language === 'FR' ? (settings?.fabric2TitleFr || "Super-Wax Vlisco Hollandais") : (settings?.fabric2TitleEn || "Authentic Vlisco Dutch Super-Wax")}
              </h3>
              <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                {language === 'FR' ? (settings?.fabric2DescFr || "L'authentique pièce de coton dense double face à base de cire naturelle. Couleurs inaltérables et tracés millimétriques d'une pureté de design extraordinaire.") : (settings?.fabric2DescEn || "The original high-density double-sided cotton wax premium block. Natural waxes and precision designs.")}
              </p>
              <div className="flex items-center gap-1 text-[9px] font-mono text-amber-500 uppercase tracking-widest pt-2">
                <span>{language === 'FR' ? "CONSULTER LES ENCHÈRES" : "CONSULT PRIVATE AUCTIONS"}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 duration-300" />
              </div>
            </div>
          </motion.div>

          {/* Fabric 3: Brocart Royal */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="group relative h-[420px] rounded-lg overflow-hidden border border-white/5 bg-neutral-950 flex flex-col justify-between p-6 cursor-pointer"
            onClick={() => setView('boutique')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={settings?.fabric3Image || "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=600&auto=format&fit=crop"} 
                alt="Brocart de Soie Suisse" 
                className="w-full h-full object-cover filter brightness-[0.55] group-hover:scale-105 duration-700 transition-transform" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-amber-400/90 text-[8px] font-mono uppercase font-bold text-black px-2.5 py-1 rounded">
                {language === 'FR' ? "SOIE SUISSE" : "SWISS SILK"}
              </span>
              <ShieldCheck className="w-4 h-4 text-amber-400" />
            </div>

            <div className="relative z-10 text-left space-y-2">
              <h3 className="text-lg font-light text-white uppercase tracking-wider font-sans group-hover:text-amber-400 duration-350">
                {language === 'FR' ? (settings?.fabric3TitleFr || "Brocart de Soie de Saint-Gall") : (settings?.fabric3TitleEn || "Swiss St. Gallen Silk Brocade")}
              </h3>
              <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                {language === 'FR' ? (settings?.fabric3DescFr || "Importé du canton historique textile en Suisse. Un satin broché rigide sculpté en reliefs d'or pour dessiner les plus prestigieux apparats souverains de la haute noblesse.") : (settings?.fabric3DescEn || "Imported from the historical Swiss textile capital. Stiff satin broché carved with gold relief.")}
              </p>
              <div className="flex items-center gap-1 text-[9px] font-mono text-amber-500 uppercase tracking-widest pt-2">
                <span>{language === 'FR' ? "COMMANDER AU METRAGE" : "ORDER CUSTOM LENGTH"}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 duration-300" />
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 4. Luxury Bento Grid Collections Layout (with beautiful scroll trigged motion) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block">
            {language === 'FR' ? "LES SALONS DE PRESTIGE" : "SALONS OF PRESTIGE"}
          </span>
          <h2 className="text-3xl font-light text-white uppercase tracking-wider mt-2">
            {language === 'FR' ? "Explorez les Halles de Création" : "Explore our Creator Halls"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Horology Large box with shift visual anims */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            onClick={() => setView('boutique')} 
            className="group relative md:col-span-2 h-96 overflow-hidden rounded-lg border border-white/5 bg-neutral-950 cursor-pointer shadow-xl"
          >
            <img
              src={settings?.bento1Image || "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop"}
              alt="Swiss Prestige Calibres"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103 filter contrast-[1.05] brightness-75 group-hover:brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 text-left">
              <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">
                {language === 'FR' ? "MÉCANIQUE EXTRÊME" : "COMPLEX HOROLOGY"}
              </span>
              <h3 className="text-xl font-light text-white uppercase tracking-wide mt-1 group-hover:text-amber-400 duration-300">
                {language === 'FR' ? (settings?.bento1TitleFr || "Horlogerie Royale de Prestige") : (settings?.bento1TitleEn || "Royal Horology of Prestige")}
              </h3>
              <p className="text-[11px] text-neutral-400 max-w-md font-light leading-relaxed mt-1">
                {language === 'FR' ? (settings?.bento1DescFr || "Chronographes automatiques d'influence à remontage automatique, verre saphir inrayable et boîtiers lunettes cannelées.") : (settings?.bento1DescEn || "Self-winding automatic influence chronographs, scratch-resistant sapphire crystal and fluted bezels.")}
              </p>
            </div>
          </motion.div>

          {/* Card 2: Luxury Chains */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1 }}
            onClick={() => setView('boutique')} 
            className="group relative h-96 overflow-hidden rounded-lg border border-white/5 bg-neutral-950 cursor-pointer shadow-xl"
          >
            <img
              src={settings?.bento2Image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop"}
              alt="Chains and Jewelry"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103 filter contrast-[1.05] brightness-75 group-hover:brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 text-left">
              <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">
                {language === 'FR' ? "ORFÈVRERIE FINE" : "PRECIOUS ORFEVRERIE"}
              </span>
              <h3 className="text-xl font-light text-white uppercase tracking-wide mt-1 group-hover:text-amber-400 duration-300">
                {language === 'FR' ? (settings?.bento2TitleFr || "Maillons & Or 18k") : (settings?.bento2TitleEn || "Chains & 18k Gold")}
              </h3>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed mt-1">
                {language === 'FR' ? (settings?.bento2DescFr || "Chaînes de cou iconiques, bagues biseautées et bracelets massifs en or pur.") : (settings?.bento2DescEn || "Iconic neck chains, heavy bevelled rings and massive pure gold bracelets.")}
              </p>
            </div>
          </motion.div>

          {/* Card 3: Shoes Crepe Loafers */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
            onClick={() => setView('boutique')} 
            className="group relative h-96 overflow-hidden rounded-lg border border-white/5 bg-neutral-950 cursor-pointer shadow-xl"
          >
            <img
              src={settings?.bento3Image || "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop"}
              alt="Crepe shoe models"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103 filter contrast-[1.05] brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 text-left">
              <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">
                {language === 'FR' ? "SOULIERS DE CARACTÈRE" : "DISTINGUISHED FOOTWEAR"}
              </span>
              <h3 className="text-xl font-light text-white uppercase tracking-wide mt-1 group-hover:text-amber-400 duration-300">
                {language === 'FR' ? (settings?.bento3TitleFr || "Crepe Loafers & Silouhettes") : (settings?.bento3TitleEn || "Crepe Loafers & Silhouettes")}
              </h3>
              <p className="text-[11px] text-neutral-400 font-light leading-relaxed mt-1">
                {language === 'FR' ? (settings?.bento3DescFr || "Mocassins luxurieux à semelle gomme crêpe naturelle, alliance ultime du confort et de l'élégance.") : (settings?.bento3DescEn || "Luxurious loafers featuring natural crepe rubber soles, the ultimate alliance of comfort and sharp elegance.")}
              </p>
            </div>
          </motion.div>

          {/* Card 4: Suits */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3 }}
            onClick={() => setView('boutique')} 
            className="group relative md:col-span-2 h-96 overflow-hidden rounded-lg border border-white/5 bg-neutral-950 cursor-pointer shadow-xl"
          >
            <img
              src={settings?.bento4Image || "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop"}
              alt="Elite Suits Tailoring"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-103 filter contrast-[1.05] brightness-75 group-hover:brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 text-left">
              <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">
                {language === 'FR' ? "ATELIER HAUTE COUTURE" : "COUTURE CRAFTSMANSHIP"}
              </span>
              <h3 className="text-xl font-light text-white uppercase tracking-wide mt-1 group-hover:text-amber-400 duration-300">
                {language === 'FR' ? (settings?.bento4TitleFr || "Tailoring & Costumes sur Mesure") : (settings?.bento4TitleEn || "Tailoring & Bespoke Suits")}
              </h3>
              <p className="text-[11px] text-neutral-400 max-w-md font-light leading-relaxed mt-1">
                {language === 'FR' ? (settings?.bento4DescFr || "Laine extra-fine mérinos, cachemire doublé et vestes structurées croisées aux boutons ciselés d'or.") : (settings?.bento4DescEn || "Extra-fine merino wool, full cashmere double lining, and double-breasted jackets.")}
              </p>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Customer Reviews Section (Rotates 2-by-2 every 5 seconds, custom moderated list, plus rating submission popup) */}
      <ReviewsCarousel />

    </div>
  );
}

// Subcomponent: ReviewsCarousel loop
import { useMemo } from 'react';

function ReviewsCarousel() {
  const { language, user, triggerAuthRequired } = useApp();
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApprovedReviews = async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Error loading approved reviews", e);
    }
  };

  useEffect(() => {
    fetchApprovedReviews();
  }, []);

  useEffect(() => {
    if (user && !formName) {
      setFormName(user.name);
    }
  }, [user]);

  // Interval to transition 2-by-2 every 5 seconds
  useEffect(() => {
    if (reviews.length <= 2) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 2;
        return next >= reviews.length ? 0 : next;
      });
    }, 5000); // 5 seconds interval
    return () => clearInterval(interval);
  }, [reviews.length]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) {
      setErrorMsg(language === 'FR' ? "Veuillez remplir tous les champs obligatoires." : "Please fill out all required fields.");
      return;
    }
    if (/\d/.test(formName)) {
      setErrorMsg(language === 'FR' ? "Le nom ne doit pas contenir de chiffres." : "The name cannot contain numbers.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formName,
          rating: formRating,
          text: formText
        })
      });
      if (res.ok) {
        setSuccessMsg(language === 'FR' 
          ? "✨ Votre avis a été soumis avec succès et transmis à l'administration de la Maison pour modération." 
          : "✨ Your review was submitted successfully and sent to high management for moderation.");
        setFormName("");
        setFormText("");
        setFormRating(5);
        setTimeout(() => {
          setShowSubmitModal(false);
          setSuccessMsg("");
        }, 4000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Submission failed.");
      }
    } catch (err) {
      setErrorMsg(language === 'FR' ? "Erreur lors de l'envoi de l'avis." : "Error submitting review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe slice of 2 items starting from activeIndex
  const visibleReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    if (reviews.length === 1) return [reviews[0]];
    if (reviews.length === 2) return [reviews[0], reviews[1]];
    
    const r1 = reviews[activeIndex];
    const r2Index = (activeIndex + 1) % reviews.length;
    const r2 = reviews[r2Index];
    return [r1, r2];
  }, [reviews, activeIndex]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 border-t border-white/5 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-neutral-950/20 p-8 rounded-lg border border-white/5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block">
            {language === 'FR' ? "AVIS DE L'ÉLITE" : "ELITE REVIEWS"}
          </span>
          <h2 className="text-3xl font-light text-white uppercase tracking-wider mt-2">
            {language === 'FR' ? "Témoignages & Avis Clientèle" : "Testimonials & Guestbook"}
          </h2>
          <p className="text-xs text-neutral-500 max-w-xl mt-2">
            {language === 'FR' 
              ? "Chaque témoignage reflète la satisfaction souveraine de nos membres VIP."
              : "Every single testimonial reflects the absolute satisfaction of our VIP members."}
          </p>
        </div>
        <button
          id="btn-trigger-review-modal"
          onClick={() => triggerAuthRequired(() => setShowSubmitModal(true))}
          className="px-6 py-3 border border-amber-500/30 hover:border-amber-400 bg-neutral-900/50 hover:bg-amber-300 hover:text-black hover:border-amber-400 text-amber-400 text-xs font-mono uppercase tracking-wider rounded duration-300 flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Pen className="w-3.5 h-3.5" />
          {language === 'FR' ? "Déposer un avis d'exception" : "Write a luxury testimonial"}
        </button>
      </div>

      {/* Rotating testimonies container (2 by 2) */}
      {reviews.length === 0 ? (
        <div className="py-12 border border-white/5 rounded-lg text-center text-neutral-500 text-xs uppercase font-mono tracking-widest">
          {language === 'FR' ? "Aucun avis publié pour le moment." : "No published reviews yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative min-h-[160px]">
          <AnimatePresence mode="popLayout">
            {visibleReviews.map((rev: any, index: number) => {
              if (!rev) return null;
              return (
                <motion.div
                  key={rev.id || index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="bg-neutral-950 p-8 rounded-lg border border-white/5 text-left flex flex-col justify-between space-y-4 hover:border-amber-500/20 duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.01] blur-3xl pointer-events-none" />
                  <div className="space-y-3">
                    {/* Rating Stars */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`} 
                        />
                      ))}
                    </div>
                    {/* Testimonial Commentary */}
                    <p className="text-sm font-light text-neutral-300 leading-relaxed italic">
                      "{rev.text}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-mono font-medium text-white uppercase tracking-wider">{rev.customerName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-600">
                      {new Date(rev.date).toLocaleDateString(language === 'FR' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Submit Testimonial Modal Dialog popup */}
      {showSubmitModal && (
        <div id="submit-review-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-white/10 rounded-lg p-8 shadow-2xl text-left space-y-6">
            <button
              id="btn-close-review-modal"
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 border border-white/5 p-2 rounded-full cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase block">
                {language === 'FR' ? "SOUMETTRE VOS IMPRESSIONS" : "SUBMIT YOUR IMPRESSIONS"}
              </span>
              <h3 className="text-xl font-light text-white uppercase tracking-wider mt-1">
                {language === 'FR' ? "Déposer un avis d'exception" : "Write an exclusive review"}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {language === 'FR' 
                  ? "Votre avis sera transmis à nos orfèvres pour approbation avant parution officielle sur le site de la Maison." 
                  : "Your review will be sent to our master curators for approval before publishing."}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  {language === 'FR' ? "IDENTITÉ POUR PARUTION" : "NAME FOR PUBLISHING"}
                </label>
                <input
                  id="form-review-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value.replace(/\d/g, ''))}
                  pattern="[^0-9]{2,}"
                  title={language === 'FR' ? 'Le nom ne doit pas contenir de chiffres.' : 'The name cannot contain numbers.'}
                  placeholder="Ex: Jean-Louis O."
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-4 py-3 rounded text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              {/* Stars evaluation widget */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase block">
                  {language === 'FR' ? "NOTE PRIVILÈGE" : "PRIVILEGE RATING"}
                </label>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const stars = i + 1;
                    return (
                      <button
                        id={`btn-form-rate-${stars}`}
                        key={i}
                        type="button"
                        onClick={() => setFormRating(stars)}
                        className="text-amber-400 focus:outline-none cursor-pointer transform hover:scale-125 duration-100"
                      >
                        <Star className={`w-6 h-6 ${stars <= formRating ? 'fill-amber-400 opacity-90' : 'text-neutral-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review text comment field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  {language === 'FR' ? "VOS COMMENTAIRES" : "YOUR REMARKS"}
                </label>
                <textarea
                  id="form-review-text"
                  required
                  rows={4}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder={language === 'FR'
                    ? "Exprimez votre avis sur l'élégance, le service conciergerie et la qualité souveraine de notre Maison..."
                    : "Express your view on elegance, the private concierge and supreme quality of our House..."}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-4 py-3 rounded text-white focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              {/* Alerts info response */}
              {errorMsg && <p className="text-xs text-red-500 font-mono italic">{errorMsg}</p>}
              {successMsg && <p className="text-xs text-emerald-400 font-mono italic whitespace-normal leading-relaxed">{successMsg}</p>}

              <button
                id="btn-submit-review-form"
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black py-3.5 rounded text-xs select-none uppercase tracking-widest font-mono font-bold transition-all duration-300 cursor-pointer shadow-md"
              >
                {isSubmitting 
                  ? (language === 'FR' ? "TRANSMISSION PRIVÉE EN COURS..." : "PRIVATE OUTFLOW TRANSMISSION IN PROGRESS...") 
                  : (language === 'FR' ? "TRANSMETTRE CONFIDENTIELLEMENT ⚜_" : "TRANSMIT CONFIDENTIALLY ⚜_")}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
