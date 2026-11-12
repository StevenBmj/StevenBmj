import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useHistoryOverlay } from '../hooks/useHistoryOverlay';

export default function AccountDialog({ label, close, children }: { label: string; close: () => void; children: ReactNode }) {
  useHistoryOverlay(true, close);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; opener?.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={dialog} aria-label={label} onCancel={event => { event.preventDefault(); close(); }}
    onClick={event => { if (event.target !== event.currentTarget) return; const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-lg border-0 bg-neutral-950 p-0 text-white backdrop:bg-black/85">{children}</dialog>, document.body);
}
