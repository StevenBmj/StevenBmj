import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { footerPolicies, type PolicyId } from './footerPolicies';
import { useHistoryOverlay } from '../hooks/useHistoryOverlay';

export default function FooterPolicyDialog({ policy, language, onDismiss }: {
  policy: PolicyId; language: 'FR' | 'EN'; onDismiss: () => void;
}) {
  useHistoryOverlay(true, onDismiss);
  const ref = useRef<HTMLDialogElement>(null);
  const document = footerPolicies[language][policy];

  useEffect(() => {
    const dialog = ref.current!;
    const opener = window.document.activeElement as HTMLElement | null;
    const previousOverflow = window.document.body.style.overflow;
    dialog.showModal();
    window.document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      window.document.body.style.overflow = previousOverflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={ref} aria-labelledby="footer-policy-title" lang={language.toLowerCase()}
    onCancel={event => { event.preventDefault(); onDismiss(); }}
    onClick={event => {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) onDismiss();
    }}
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl max-h-[85dvh] overflow-hidden rounded-lg border border-white/15 bg-neutral-950 p-0 text-neutral-300 shadow-2xl backdrop:bg-black/85 backdrop:backdrop-blur-sm">
    <div className="flex max-h-[85dvh] flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
        <div className="min-w-0">
          <p className="mb-2 text-xs text-amber-400">StevenBmj</p>
          <h2 id="footer-policy-title" className="text-xl font-medium text-white break-words">{document.title}</h2>
        </div>
        <button type="button" onClick={onDismiss} aria-label={language === 'FR' ? 'Fermer' : 'Close'} title={language === 'FR' ? 'Fermer' : 'Close'}
          className="flex size-11 shrink-0 items-center justify-center rounded border border-white/15 text-neutral-300 hover:border-amber-400 hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div tabIndex={0} className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 text-sm leading-7 focus-visible:outline-2 focus-visible:outline-amber-400">
        {document.sections.map(section => <section key={section.title} className="mb-6 last:mb-0">
          <h3 className="mb-2 font-semibold text-white">{section.title}</h3>
          <p className="break-words">{section.text}</p>
        </section>)}
      </div>
    </div>
  </dialog>;
}
