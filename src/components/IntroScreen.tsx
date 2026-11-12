import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Logo from './Logo';

export default function IntroScreen({ onComplete, language }: { onComplete: () => void; language: 'FR' | 'EN' }) {
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const completed = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    callback.current();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fade = window.setTimeout(() => setLeaving(true), reduced ? 100 : 800);
    const done = window.setTimeout(finish, reduced ? 200 : 1000);
    window.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('keydown', finish, { once: true });
    return () => {
      window.clearTimeout(fade); window.clearTimeout(done);
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
    };
  }, [finish]);

  return <div id="intro-screen" className={`brand-boot pointer-events-none ${leaving ? 'brand-boot--leaving' : ''}`} aria-label="StevenBmj">
    <Logo size={160} animated />
    <span className="brand-boot__name">StevenBmj</span>
    <span className="brand-boot__subtitle">{language === 'FR' ? 'Mode et accessoires' : 'Fashion and accessories'}</span>
    <button type="button" id="btn-skip-intro" onClick={finish} aria-label={language === 'FR' ? "Passer l'animation" : 'Skip animation'}
      title={language === 'FR' ? "Passer l'animation" : 'Skip animation'}
      className="pointer-events-auto absolute bottom-6 right-6 flex size-11 items-center justify-center rounded border border-white/20 text-neutral-300 hover:text-white">
      <X size={18} aria-hidden="true" />
    </button>
  </div>;
}
