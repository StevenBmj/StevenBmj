/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

interface IntroScreenProps {
  onComplete: () => void;
  language: 'FR' | 'EN';
}

export default function IntroScreen({ onComplete, language }: IntroScreenProps) {
  const [startTransition, setStartTransition] = useState(false);
  const [subTextIndex, setSubTextIndex] = useState(0);

  const subTexts = language === 'FR' 
    ? ["L'EXCELLENCE", "L'ÉLÉGANCE PUR HOMME", "MOUVEMENT ET HORLOGERIE DU CYBERESPACE", "LE FUTUR DU LUXE"]
    : ["PURE EXCELLENCE", "MEN'S SUPREME REFINEMENT", "CYBERSPACE PRECISION HOROLOGY", "THE FUTURE OF LUXE"];

  useEffect(() => {
    // Staggered text change
    const interval = setInterval(() => {
      setSubTextIndex(prev => (prev + 1) % subTexts.length);
    }, 1200);

    // End introduction after 4.8 seconds
    const timer = setTimeout(() => {
      setStartTransition(true);
      setTimeout(() => {
        onComplete();
      }, 800);
    }, 4500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete, subTexts.length]);

  return (
    <div id="intro-screen" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* Cinematic Golden Light Rays Behind Logo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(142,109,30,0.18),transparent_55%)] animate-pulse" />
      
      {/* Digital Grid Accent (Futuristic) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.1)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

      <AnimatePresence>
        {!startTransition && (
          <motion.div 
            className="relative flex flex-col items-center justify-center text-center z-10 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            {/* Animated Gold Watermark Halo */}
            <motion.div
              className="absolute -inset-10 rounded-full border border-yellow-600/10 pointer-events-none"
              animate={{ rotate: 360, scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            />

            {/* The Monogram */}
            <Logo size={200} animated={true} className="mb-8" />

            {/* Brand Title with Sparkles */}
            <motion.h1 
              className="text-4xl md:text-6xl font-light tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-400 to-yellow-600 font-sans uppercase filter drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] mb-4"
              initial={{ letterSpacing: "0.1em", opacity: 0 }}
              animate={{ letterSpacing: "0.25em", opacity: 1 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              StevenBmj
            </motion.h1>

            {/* Cinematic subtitle cycling with fade */}
            <div className="h-6 overflow-hidden mt-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={subTextIndex}
                  className="text-xs md:text-sm tracking-[0.4em] text-amber-500/80 font-mono uppercase"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {subTexts[subTextIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Ambient Loading Bar */}
            <div className="w-48 h-[1px] bg-neutral-900 overflow-hidden relative mt-12 rounded-full">
              <motion.div 
                className="absolute inset-y-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent w-2/3"
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
            </div>
            
            <p className="text-[9px] font-mono tracking-widest text-neutral-600 uppercase mt-4">
              {language === 'FR' ? 'Entrée dans les Salons Privés...' : 'Entering Private Salons...'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skipping Control Button */}
      <motion.button
        id="btn-skip-intro"
        onClick={onComplete}
        className="absolute bottom-8 right-8 px-4 py-1.5 border border-white/15 bg-black/60 hover:bg-white hover:text-black hover:border-white text-[10px] uppercase tracking-[0.2em] rounded-full text-white duration-500 z-20 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
      >
        {language === 'FR' ? 'Passer l\'intro ✕' : 'Skip Intro ✕'}
      </motion.button>
    </div>
  );
}
