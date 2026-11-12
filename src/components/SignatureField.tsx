import { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';
import { RotateCcw } from 'lucide-react';
import type { ReceiptSignature } from '../lib/delivery';

export default function SignatureField({ value, onChange, language }: {
  value: ReceiptSignature | null; onChange?: (value: ReceiptSignature | null) => void; language: 'FR' | 'EN';
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePad | null>(null);
  const current = useRef(value);
  const update = useRef(onChange);
  current.current = value;
  update.current = onChange;

  useEffect(() => {
    const element = canvas.current!;
    const instance = new SignaturePad(element, { penColor: '#111111', backgroundColor: '#ffffff' });
    pad.current = instance;
    const draw = () => {
      const box = element.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      element.width = Math.round(box.width * ratio);
      element.height = Math.round(box.height * ratio);
      element.getContext('2d')?.scale(ratio, ratio);
      instance.clear();
      if (current.current) instance.fromData(current.current.strokes.map(stroke => ({
        penColor: '#111111', dotSize: 0, minWidth: 0.5, maxWidth: 2.5, velocityFilterWeight: 0.7, compositeOperation: 'source-over' as const,
        points: stroke.points.map((point, index) => ({ x: point.x * box.width, y: point.y * box.height, time: index * 16, pressure: 0.5 })),
      })));
    };
    const end = () => {
      const box = element.getBoundingClientRect();
      const signature = { strokes: instance.toData().map(stroke => ({ points: stroke.points.map(point => ({ x: Math.max(0, Math.min(1, point.x / box.width)), y: Math.max(0, Math.min(1, point.y / box.height)) })) })) };
      current.current = signature;
      update.current?.(signature);
    };
    instance.addEventListener('endStroke', end);
    if (!update.current) instance.off();
    const resize = new ResizeObserver(draw);
    resize.observe(element);
    draw();
    return () => { resize.disconnect(); instance.off(); instance.removeEventListener('endStroke', end); pad.current = null; };
  }, []);

  return <div className="space-y-2">
    <canvas ref={canvas} role="img" aria-label={language === 'FR' ? 'Signature du destinataire' : 'Recipient signature'}
      className={`h-44 w-full rounded border border-neutral-300 bg-white ${onChange ? 'touch-none' : 'pointer-events-none'}`} />
    {onChange && <button type="button" onClick={() => { pad.current?.clear(); current.current = null; onChange(null); }}
      className="inline-flex min-h-11 items-center gap-2 rounded text-sm text-neutral-300 hover:text-white">
      <RotateCcw size={16} aria-hidden="true" />{language === 'FR' ? 'Effacer la signature' : 'Clear signature'}
    </button>}
  </div>;
}
