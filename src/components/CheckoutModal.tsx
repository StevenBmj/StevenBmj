/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ShieldCheck, Truck, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

interface CheckoutModalProps {
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`Unable to load image: ${src}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function CheckoutModal({ onClose, onOrderSuccess }: CheckoutModalProps) {
  const { language, cart, formatPrice, clearCart, currency, appliedPromo, setAppliedPromo, lastInvoice, setLastInvoice, user } = useApp();
  const invoiceCardRef = useRef<HTMLDivElement | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('BJ');
  const [localPhone, setLocalPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  
  // States of order process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderState, setCompletedOrderState] = useState<any | null>(() => lastInvoice || null);
  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceQrDataUrl, setInvoiceQrDataUrl] = useState('');
  const completedOrder = completedOrderState;

  const countryOptions = useMemo(() => {
    const displayNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
      ? new Intl.DisplayNames([language === 'FR' ? 'fr' : 'en'], { type: 'region' })
      : null;
    return getCountries()
      .map((country) => ({
        country,
        name: displayNames?.of(country) || country,
        code: getCountryCallingCode(country),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [language]);

  const fullWhatsapp = useMemo(() => {
    const digits = localPhone.replace(/\D/g, '');
    return digits ? `+${getCountryCallingCode(phoneCountry)}${digits}` : '';
  }, [localPhone, phoneCountry]);

  const updateCompletedOrder = (order: any | null) => {
    setCompletedOrderState(order);
    setLastInvoice(order);
  };

  // States for discount coupon validation - prefilled from global appliedPromo!
  const [promoCodeInput, setPromoCodeInput] = useState(appliedPromo?.code || '');
  const [activeDiscount, setActiveDiscount] = useState<number>(appliedPromo?.discountPercent || 0); // discount percentage
  const [promoMessage, setPromoMessage] = useState<{ text: string; error: boolean } | null>(() => {
    if (appliedPromo) {
      return {
        text: language === 'FR' 
          ? `Code promotionnel ${appliedPromo.code} déjà actif (-${appliedPromo.discountPercent}%).`
          : `Promo code ${appliedPromo.code} already active (-${appliedPromo.discountPercent}%).`,
        error: false
      };
    }
    return null;
  });

  useEffect(() => {
    if (lastInvoice && !completedOrderState) {
      setCompletedOrderState(lastInvoice);
    }
  }, [lastInvoice, completedOrderState]);

  useEffect(() => {
    const savedDraft = localStorage.getItem('sbmj_checkout_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setCustomerName(draft.customerName || '');
        setPhoneCountry(draft.phoneCountry || 'BJ');
        setLocalPhone(String(draft.localPhone || '').replace(/\D/g, ''));
        setEmail(draft.email || '');
        setAddress(draft.address || '');
        setCity(draft.city || '');
        setNotes(draft.notes || '');
      } catch (error) {
        console.error('Failed to restore checkout draft', error);
      }
    } else if (user) {
      setCustomerName((prev) => prev || user.name || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (completedOrder) return;
    localStorage.setItem('sbmj_checkout_draft', JSON.stringify({
      customerName,
      phoneCountry,
      localPhone,
      email,
      address,
      city,
      notes,
    }));
  }, [address, city, completedOrder, customerName, email, localPhone, notes, phoneCountry]);

  useEffect(() => {
    if (!completedOrder) {
      setInvoiceQrDataUrl('');
      return;
    }

    let cancelled = false;
    const qrPayload = [
      'MAISON STEVENBMJ',
      `Facture de prestige: ${completedOrder.id}`,
      `Client: ${completedOrder.customerName}`,
      `Total paye: ${completedOrder.totalPrice} ${completedOrder.currency || currency}`,
      `Date emission: ${new Date(completedOrder.date).toLocaleDateString('fr-FR')}`,
      `Achats: ${completedOrder.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}`,
      'Authenticite StevenBmj garantie.',
    ].join('\n');

    import('qrcode')
      .then((QRCode) => QRCode.toDataURL(qrPayload, {
        width: 240,
        margin: 1,
        color: { dark: '#121212', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }))
      .then((dataUrl) => {
        if (!cancelled) setInvoiceQrDataUrl(dataUrl);
      })
      .catch((error) => {
        console.error('Unable to generate invoice QR code', error);
        if (!cancelled) setInvoiceQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [completedOrder, currency]);

  const subTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.promoPrice || item.product.price;
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subTotal * activeDiscount) / 100);
  }, [subTotal, activeDiscount]);

  const shippingCost = useMemo(() => {
    const totalAfterDiscount = subTotal - discountAmount;
    return totalAfterDiscount >= 3000 ? 0 : 150;
  }, [subTotal, discountAmount]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subTotal - discountAmount + shippingCost);
  }, [subTotal, discountAmount, shippingCost]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput) return;
    try {
      const res = await fetch('/api/promos');
      if (res.ok) {
        const promos = await res.json();
        const code = promoCodeInput.trim().toUpperCase();
        const matching = promos.find((p: any) => p.code.toUpperCase() === code && p.active);
        
        if (matching) {
          if (matching.minAmount && subTotal < matching.minAmount) {
            setPromoMessage({ 
              text: language === 'FR' 
                ? `Montant minimum requis: ${formatPrice(matching.minAmount)} (panier actuel: ${formatPrice(subTotal)})`
                : `Minimum order amount required: ${formatPrice(matching.minAmount)} (current: ${formatPrice(subTotal)})`, 
              error: true 
            });
            setActiveDiscount(0);
            setAppliedPromo(null);
          } else {
            setActiveDiscount(matching.discountPercentage);
            setAppliedPromo({
              code: code,
              discountPercent: matching.discountPercentage
            });
            setPromoMessage({ 
              text: language === 'FR'
                ? `Code promotionnel validé! Réduction de ${matching.discountPercentage}% appliquée.`
                : `Promo code successfully applied! ${matching.discountPercentage}% discount offset.`, 
              error: false 
            });
          }
        } else {
          setPromoMessage({ 
            text: language === 'FR' ? 'Code promotionnel invalide ou expiré.' : 'Invalid or expired promotional code.', 
            error: true 
          });
          setActiveDiscount(0);
          setAppliedPromo(null);
        }
      }
    } catch (err) {
      console.error(err);
      setPromoMessage({ 
        text: language === 'FR' ? 'Erreur de connexion au serveur.' : 'Failed to query promo code server.', 
        error: true 
      });
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || /\d/.test(customerName) || !fullWhatsapp || !email || !address || !city) return;

    setIsSubmitting(true);

      const orderPayload = {
      customerName,
      whatsapp: fullWhatsapp,
      email,
      address,
      city,
      notes: notes + (promoCodeInput && activeDiscount > 0 ? ` (Code Promo: ${promoCodeInput.toUpperCase()} -${activeDiscount}%)` : ''),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.promoPrice || item.product.price,
        selectedSize: item.selectedSize
      })),
      totalPrice: finalTotal,
      currency: currency
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const data = await res.json();
        updateCompletedOrder(data.order);
        if (onOrderSuccess) {
          onOrderSuccess(data.order);
        }
      }
    } catch (err) {
      console.error("Order submit failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildWhatsAppUrl = () => {
    if (!completedOrder) return '';

    const waNumber = "22955468138";
    
    const itemsText = completedOrder.items.map((item: any) => {
      const sizeLine = item.selectedSize ? ` (Taille: ${item.selectedSize})` : '';
      return `- ${item.quantity}x ${item.productName}${sizeLine} / ${formatPrice(item.price * item.quantity)}`;
    }).join('\n');

    const message = `🌟 *ORDRE DE COMMANDE - M. ${completedOrder.customerName.toUpperCase()}* 🌟
----------------------------------
*Référence Unique :* ${completedOrder.id}
*Date :* ${new Date(completedOrder.date).toLocaleString('fr-FR')}

👤 *INFORMATIONS CLIENT :*
• *Nom complet :* ${completedOrder.customerName}
• *Numéro WhatsApp :* ${completedOrder.whatsapp}
• *Lieu de livraison :* ${completedOrder.address}
• *Ville :* ${completedOrder.city}
• *Notes de livraison :* ${completedOrder.notes || 'Aucune'}

📦 *SÉLECTION D'EXCEPTION :*
${itemsText}

💳 *RÈGLEMENT DE PRESTIGE :*
• *Total Final :* ${formatPrice(completedOrder.totalPrice)}

----------------------------------
✨ _Ordre enregistré auprès du système de conciergerie StevenBmj d'Afrique de l'Ouest et Internationale. Merci pour votre haute confiance._ ✨`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${waNumber}?text=${encodedMessage}`;
  };

  // Automated WhatsApp Message Trigger
  const handleWhatsAppRedirect = () => {
    const waUrl = buildWhatsAppUrl();
    if (waUrl) window.open(waUrl, '_blank');
  };

  const handleReturnToEdit = async () => {
    if (!completedOrder) return;
    const order = completedOrder;
    setCustomerName(order.customerName || '');
    setEmail(order.email || email || '');
    setAddress(order.address || '');
    setCity(order.city || '');
    setNotes(order.notes || '');
    const digits = String(order.whatsapp || '').replace(/\D/g, '');
    const matchedCountry = countryOptions.find((option) => digits.startsWith(option.code));
    if (matchedCountry) {
      setPhoneCountry(matchedCountry.country);
      setLocalPhone(digits.slice(matchedCountry.code.length));
    }
    updateCompletedOrder(null);
    try {
      await fetch(`/api/orders/${encodeURIComponent(order.id)}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Unable to delete draft order before editing', error);
    }
  };

  const handleDownloadInvoiceAndWhatsApp = async () => {
    if (!completedOrder) return;
    if (!invoiceQrDataUrl) {
      alert(language === 'FR' ? 'Le QR code de la facture est en preparation. Reessayez dans un instant.' : 'The invoice QR code is still being prepared. Try again in a moment.');
      return;
    }
    const whatsappWindow = window.open('about:blank', '_blank');
    setActionLoading(true);
    try {
      const [{ jsPDF }, logoDataUrl] = await Promise.all([
        import('jspdf'),
        imageToDataUrl('/logo.png'),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 44;
      const gold: [number, number, number] = [245, 158, 11];
      const dark: [number, number, number] = [5, 5, 5];
      const panel: [number, number, number] = [18, 18, 18];
      const muted: [number, number, number] = [155, 155, 155];
      const white: [number, number, number] = [255, 255, 255];
      const subtotal = completedOrder.items.reduce((sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);

      const setText = (rgb: [number, number, number], size: number, style: 'normal' | 'bold' = 'normal') => {
        pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
        pdf.setFont('helvetica', style);
        pdf.setFontSize(size);
      };

      const drawFrame = () => {
        pdf.setFillColor(dark[0], dark[1], dark[2]);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');
        pdf.setDrawColor(gold[0], gold[1], gold[2]);
        pdf.setLineWidth(1);
        pdf.rect(margin - 8, margin - 8, pageWidth - (margin - 8) * 2, pageHeight - (margin - 8) * 2);
        pdf.setDrawColor(90, 61, 16);
        pdf.rect(margin - 2, margin - 2, pageWidth - (margin - 2) * 2, pageHeight - (margin - 2) * 2);
      };

      const addWrapped = (text: string, x: number, y: number, width: number, lineHeight = 13) => {
        const lines = pdf.splitTextToSize(String(text || ''), width);
        pdf.text(lines, x, y);
        return y + lines.length * lineHeight;
      };

      const ensureSpace = (y: number, needed = 90) => {
        if (y + needed <= pageHeight - margin) return y;
        pdf.addPage();
        drawFrame();
        return margin + 18;
      };

      drawFrame();
      pdf.addImage(logoDataUrl, 'PNG', margin, margin, 54, 54);
      setText(white, 22);
      pdf.text('STEVENBMJ', margin + 68, margin + 28);
      setText(gold, 7, 'bold');
      pdf.text('HAUTE COUTURE ET JOAILLERIE', margin + 70, margin + 43);
      setText(gold, 12, 'bold');
      pdf.text('FACTURE DE PRESTIGE', pageWidth - margin, margin + 18, { align: 'right' });
      setText(muted, 8);
      pdf.text(`REF: ${completedOrder.id}`, pageWidth - margin, margin + 34, { align: 'right' });
      pdf.text(new Date(completedOrder.date).toLocaleString('fr-FR'), pageWidth - margin, margin + 48, { align: 'right' });
      pdf.setDrawColor(90, 61, 16);
      pdf.line(margin, margin + 78, pageWidth - margin, margin + 78);

      let y = margin + 112;
      const columnWidth = (pageWidth - margin * 2 - 22) / 2;
      pdf.setFillColor(panel[0], panel[1], panel[2]);
      pdf.roundedRect(margin, y - 18, columnWidth, 102, 4, 4, 'F');
      pdf.roundedRect(margin + columnWidth + 22, y - 18, columnWidth, 102, 4, 4, 'F');

      setText(gold, 8, 'bold');
      pdf.text('DESTINATAIRE VIP', margin + 14, y);
      setText(white, 11, 'bold');
      pdf.text(String(completedOrder.customerName || '').toUpperCase(), margin + 14, y + 20);
      setText(muted, 8);
      pdf.text(`WhatsApp: ${completedOrder.whatsapp}`, margin + 14, y + 37);
      if (completedOrder.email) pdf.text(`Email: ${completedOrder.email}`, margin + 14, y + 52);
      addWrapped(`${completedOrder.address}, ${completedOrder.city}`, margin + 14, y + 68, columnWidth - 28, 11);

      setText(gold, 8, 'bold');
      pdf.text('MAISON DE VENTES', margin + columnWidth + 36, y);
      setText(white, 10, 'bold');
      pdf.text('StevenBmj West Africa SARL', margin + columnWidth + 36, y + 20);
      setText(muted, 8);
      pdf.text('Siege Cotonou, Benin', margin + columnWidth + 36, y + 37);
      pdf.text('Contact Concierge: +22955468138', margin + columnWidth + 36, y + 52);
      pdf.text('Email: stevenbmj202@gmail.com', margin + columnWidth + 36, y + 67);

      y += 128;
      setText(gold, 8, 'bold');
      pdf.text('CREATION / SELECTION', margin, y);
      pdf.text('QTE', pageWidth - margin - 170, y, { align: 'center' });
      pdf.text('PRIX', pageWidth - margin - 82, y, { align: 'right' });
      pdf.text('MONTANT', pageWidth - margin, y, { align: 'right' });
      pdf.setDrawColor(90, 61, 16);
      pdf.line(margin, y + 9, pageWidth - margin, y + 9);
      y += 28;

      completedOrder.items.forEach((item: any) => {
        y = ensureSpace(y, 58);
        const amount = Number(item.price || 0) * Number(item.quantity || 1);
        setText(white, 10, 'bold');
        const nameLines = pdf.splitTextToSize(String(item.productName || 'Creation StevenBmj'), pageWidth - margin * 2 - 210);
        pdf.text(nameLines, margin, y);
        let rowBottom = y + nameLines.length * 12;
        if (item.selectedSize) {
          setText(gold, 7, 'bold');
          pdf.text(`TAILLE: ${item.selectedSize}`, margin, rowBottom + 7);
          rowBottom += 12;
        }
        setText(white, 9);
        pdf.text(String(item.quantity || 1), pageWidth - margin - 170, y, { align: 'center' });
        pdf.text(formatPrice(Number(item.price || 0)), pageWidth - margin - 82, y, { align: 'right' });
        pdf.text(formatPrice(amount), pageWidth - margin, y, { align: 'right' });
        pdf.setDrawColor(42, 42, 42);
        pdf.line(margin, rowBottom + 9, pageWidth - margin, rowBottom + 9);
        y = rowBottom + 28;
      });

      if (completedOrder.notes) {
        y = ensureSpace(y, 58);
        setText(gold, 8, 'bold');
        pdf.text("NOTES D'ATELIER", margin, y);
        setText(muted, 8);
        y = addWrapped(completedOrder.notes, margin, y + 16, pageWidth - margin * 2, 12) + 12;
      }

      y = ensureSpace(y, 172);
      pdf.setDrawColor(90, 61, 16);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 28;
      pdf.addImage(invoiceQrDataUrl, 'PNG', margin, y, 72, 72);
      setText(gold, 8, 'bold');
      pdf.text("CERTIFICAT D'AUTHENTICITE", margin + 88, y + 18);
      setText(muted, 7);
      addWrapped("Cette facture reprend les informations visibles sur le site et certifie l'ordre de commande StevenBmj.", margin + 88, y + 34, 210, 10);

      const totalsX = pageWidth - margin;
      setText(muted, 8);
      pdf.text('Sous-total', totalsX - 130, y + 4);
      pdf.text(formatPrice(subtotal), totalsX, y + 4, { align: 'right' });
      pdf.text('Livraison privee', totalsX - 130, y + 22);
      setText([52, 211, 153], 8, 'bold');
      pdf.text('Offerte', totalsX, y + 22, { align: 'right' });
      setText(white, 9, 'bold');
      pdf.text('TOTAL PAYE', totalsX - 130, y + 48);
      setText(gold, 17, 'bold');
      pdf.text(formatPrice(completedOrder.totalPrice), totalsX, y + 50, { align: 'right' });
      setText(muted, 6);
      pdf.text('Maison StevenBmj - Cotonou, Benin - Facture generee automatiquement apres validation client.', pageWidth / 2, pageHeight - 24, { align: 'center' });

      pdf.save(`facture-stevenbmj-${completedOrder.id}.pdf`);
      clearCart();
      setAppliedPromo(null);
      localStorage.removeItem('sbmj_checkout_draft');
      const waUrl = buildWhatsAppUrl();
      if (whatsappWindow && waUrl) {
        whatsappWindow.location.href = waUrl;
      } else if (waUrl) {
        window.location.href = waUrl;
      }
    } catch (error) {
      whatsappWindow?.close();
      console.error('PDF generation failed', error);
      alert(language === 'FR'
        ? "Impossible de generer le PDF automatiquement. Verifiez que les images sont chargees puis reessayez."
        : "Unable to generate the PDF automatically. Check that images are loaded and try again."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-8 flex justify-center items-start">
      <div className="relative w-full max-w-4xl bg-neutral-950 border border-white/10 rounded-lg shadow-2xl overflow-hidden text-left my-4 md:my-8">
        
        {/* Close Button unless checked out */}
        {!completedOrder && (
          <button
            id="btn-close-checkout"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* State 1: Active Checkout input form screen */}
        {!completedOrder ? (
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-white/5">
            
            {/* Form Column */}
            <form onSubmit={handleCheckoutSubmit} className="p-6 md:p-8 md:col-span-3 space-y-6">
              <div>
                <h2 className="text-xl font-light text-white uppercase tracking-wide">
                  {language === 'FR' ? 'Consigner l\'Ordre de Livraison' : 'Consign Delivery Order'}
                </h2>
                <p className="text-xs text-neutral-500 tracking-wider mt-1">
                  {language === 'FR' 
                    ? "Veuillez remplir vos coordonnées pour générer votre facture de luxe et finaliser."
                    : "Fill in your details to compile your high-end invoice and book courier paths."}
                </p>
              </div>

              <div className="space-y-4">
                
                {/* Full name input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                    {language === 'FR' ? 'Nom Complet *' : 'Full Name *'}
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value.replace(/\d/g, ''))}
                    pattern="[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}"
                    title={language === 'FR' ? 'Le nom ne doit pas contenir de chiffres.' : 'The name cannot contain numbers.'}
                    placeholder="M. Steven Bio"
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded focus:ring-1 focus:ring-amber-500/10"
                  />
                </div>

                {/* WhatsApp Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                    {language === 'FR' ? 'Pays et Numéro WhatsApp *' : 'Country and WhatsApp Number *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr] gap-2">
                    <select
                      id="checkout-phone-country"
                      value={phoneCountry}
                      onChange={(e) => {
                        setPhoneCountry(e.target.value as CountryCode);
                        setLocalPhone('');
                      }}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                    >
                      {countryOptions.map((option) => (
                        <option key={option.country} value={option.country}>
                          {option.name} (+{option.code})
                        </option>
                      ))}
                    </select>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 bg-neutral-950 border border-r-0 border-white/10 rounded-l text-[11px] font-mono text-amber-400">
                        +{getCountryCallingCode(phoneCountry)}
                      </span>
                      <input
                        id="checkout-whatsapp"
                        type="tel"
                        inputMode="numeric"
                        required
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, '').slice(0, 18))}
                        placeholder="55468138"
                        className="min-w-0 w-full bg-neutral-900 border border-white/10 text-xs px-3 py-3 text-white focus:outline-none focus:border-amber-400 rounded-r focus:ring-1 focus:ring-amber-500/10"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                    {language === 'FR' ? 'Adresse Email Privée *' : 'Private Email Address *'}
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="steven@ambassadeur.org"
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded focus:ring-1 focus:ring-amber-500/10"
                  />
                </div>

                {/* City & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                      {language === 'FR' ? 'Ville / District *' : 'City / State *'}
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Cotonou"
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                      {language === 'FR' ? 'Adresse / Quartier *' : 'Address / District *'}
                    </label>
                    <input
                      id="checkout-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Haie Vive, Villa 12"
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                    />
                  </div>
                </div>

                {/* Order special instructions */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                    {language === 'FR' ? 'Notes de Commande / Taille spécifique' : 'Order Notes / Dedicated Size'}
                  </label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === 'FR' ? "E.g. Ajustement des manches costume slim, ou heure préférentielle..." : "E.g. Jacket sleeves length adjustment, preferred slot..."}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded"
                  />
                </div>

              </div>

              {/* Submit trigger */}
              <button
                id="btn-submit-order-form"
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full h-12 bg-amber-400 text-black rounded text-xs tracking-widest font-mono uppercase font-black hover:bg-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <span>{language === 'FR' ? "GÉNÉRATION FACTURE DE LUXE..." : "GENERATING PRESTIGE INVOICE..."}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{language === 'FR' ? "VALIDER MON ORDRE ET CRÉER MA FACTURE" : "CONFIRM MY ORDER AND VIEW INVOICE"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Selection Curation Summary column */}
            <div className="p-6 md:p-8 md:col-span-2 bg-neutral-900/10 space-y-6">
              <h3 className="text-xs uppercase tracking-[0.2em] text-white font-bold pb-2 border-b border-white/5">
                {language === 'FR' ? "VOTRE PANIER PREMIUM" : "YOUR PREMIUM CART"}
              </h3>

              <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                {cart.map((item, id) => (
                  <div key={id} className="flex py-3 justify-between text-xs">
                    <div>
                      <span className="text-white block font-medium">
                        {language === 'FR' ? item.product.name : item.product.nameEn}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {language === 'FR' ? 'Qté' : 'Qty'}: {item.quantity} {item.selectedSize ? `| ${language === 'FR' ? 'Taille' : 'Size'}: ${item.selectedSize}` : ''}
                      </span>
                    </div>
                    <span className="font-mono text-amber-500">
                      {formatPrice((item.product.promoPrice || item.product.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo code entry box */}
              <div className="pt-4 border-t border-white/5 space-y-2 text-xs">
                <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase block font-bold">
                  {language === 'FR' ? 'Code de Réduction Royal' : 'Royal Promo Code'}
                </span>
                <div className="flex gap-2">
                  <input
                    id="checkout-promo-input"
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder={language === 'FR' ? "E.g. STEVENBMJ10" : "E.g. PRESTIGE20"}
                    className="flex-1 bg-neutral-900 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700 rounded focus:outline-none focus:border-amber-450 uppercase font-mono"
                  />
                  <button
                    id="btn-apply-promo"
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-amber-450 text-black hover:bg-amber-400 font-mono text-[10px] font-black uppercase tracking-wider rounded cursor-pointer"
                  >
                    {language === 'FR' ? 'Appliquer' : 'Apply'}
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-[10px] uppercase font-mono tracking-wider ${promoMessage.error ? 'text-red-400' : 'text-emerald-400'}`}>
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Total display */}
              <div className="space-y-2 text-xs pt-4 border-t border-white/5">
                <div className="flex justify-between text-neutral-500">
                  <span>Sous-total / Subtotal</span>
                  <span className="font-mono text-neutral-300">{formatPrice(subTotal)}</span>
                </div>
                {activeDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-mono">
                    <span>{language === 'FR' ? `Réduction (-${activeDiscount}%)` : `Discount (-${activeDiscount}%)`}</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500 font-mono">
                  <span>{language === 'FR' ? 'Porteur Privé' : 'Private Courier'}</span>
                  <span className="text-emerald-400">{shippingCost === 0 ? (language === 'FR' ? 'OFFERT / GRATUIT' : 'COMPLIMENTARY') : formatPrice(shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-3 text-sm font-bold text-white uppercase tracking-wider">
                  <span>{language === 'FR' ? 'TOTAL ESTIMÉ' : 'ESTIMATED TOTAL'}</span>
                  <span className="font-mono text-yellow-400 font-bold text-base filter drop-shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Secure Trust logo badges */}
              <div className="border border-white/5 rounded-lg p-4 bg-neutral-950/50 space-y-2 text-neutral-500 text-[10px] leading-relaxed">
                <p className="flex items-center gap-1.5 text-white font-semibold">
                  <Truck className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'FR' ? 'TRANSPORTEUR VIP MAISON' : 'MAISON VIP COURIER'}</span>
                </p>
                <p>
                  {language === 'FR' 
                    ? "Vos objets de valeur sont enveloppés sous écrin noir scellé par cire dorée de prestige." 
                    : "Your exception items are wrapped under black case sealed with hot prestige wax."}
                </p>
              </div>
            </div>

          </div>
        ) : (
          // State 2: Order Complete, showing the Gorgeous Black and Gold Luxury Invoice!
          <div id="print-area" className="p-4 sm:p-6 md:p-12 space-y-8 bg-black text-white selection:bg-amber-500/20">
            
            {/* The Luxury Double Border Invoice Card */}
            <div
              id="invoice-card"
              ref={invoiceCardRef}
              className="border-4 border-double border-amber-500/30 p-4 sm:p-6 md:p-8 rounded bg-neutral-950 tracking-wide relative"
            >
              
              {/* Gold watermark design element in background */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                <Logo size={400} />
              </div>

              {/* Top Row Invoice Branding header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-amber-500/20 pb-6 gap-6">
                <div className="flex items-center space-x-3 text-left">
                  <Logo size={60} />
                  <div>
                    <span className="text-2xl font-light tracking-[0.25em] text-white uppercase font-sans">StevenBmj</span>
                    <span className="text-[8px] font-mono tracking-[0.4em] text-amber-500 block uppercase">
                      {language === 'FR' ? 'HAUTE COUTURE ET JOAILLERIE' : 'HAUTE COUTURE AND FINE JEWELRY'}
                    </span>
                  </div>
                </div>

                <div className="text-left md:text-right font-mono text-[10px] text-neutral-400 space-y-1">
                  <p className="text-yellow-400 font-semibold tracking-wider uppercase text-xs">
                    {language === 'FR' ? 'FACTURE DE PRESTIGE' : 'PRESTIGE INVOICE'}
                  </p>
                  <p>{language === 'FR' ? 'FACTURE ID' : 'INVOICE ID'}: {completedOrder.id}</p>
                  <p>{language === 'FR' ? "DATE D'ÉMISSION" : "DATE OF ISSUE"}: {new Date(completedOrder.date).toLocaleDateString(language === 'FR' ? 'fr-FR' : 'en-US')}</p>
                  <p>{language === 'FR' ? 'ATELIER' : 'ATELIER'}: Paris / Bénin / Genève</p>
                </div>
              </div>

              {/* Buyer / Seller Details column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 text-xs border-b border-white/5">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block mb-1">
                    {language === 'FR' ? 'DESTINATAIRE VIP' : 'VIP RECIPIENT'}
                  </span>
                  <p className="font-semibold text-white uppercase text-sm">{completedOrder.customerName}</p>
                  <p className="text-neutral-400 font-mono">WhatsApp: {completedOrder.whatsapp}</p>
                  <p className="text-neutral-450">{completedOrder.address}, {completedOrder.city}</p>
                  {completedOrder.notes && (
                    <p className="text-[10px] text-neutral-500 italic mt-2">
                      {language === 'FR' ? "Notes d'Atelier" : "Atelier Notes"}: {completedOrder.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-1 md:text-right text-left">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-1">
                    {language === 'FR' ? 'MAISON DE VENTES' : 'RETAIL HOUSE'}
                  </span>
                  <p className="font-semibold text-white">StevenBmj West Africa SARL</p>
                  <p className="text-neutral-400">{language === 'FR' ? 'Siège Cotonou, Bénin' : 'HQ Cotonou, Benin'}</p>
                  <p className="text-neutral-400">{language === 'FR' ? 'Contact Concierge' : 'Concierge Desk'}: +22955468138</p>
                  <p className="text-neutral-500">Email: stevenbmj202@gmail.com</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-6 overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                  <thead>
                    <tr className="border-b border-amber-500/20 text-white uppercase tracking-wider text-[10px] font-mono">
                      <th className="py-3 pr-4">{language === 'FR' ? 'CRÉATION / SÉLECTION' : 'CREATION / SELECTION'}</th>
                      <th className="py-3 px-4 text-center">{language === 'FR' ? 'QUANTITÉ' : 'QUANTITY'}</th>
                      <th className="py-3 px-4 text-right">{language === 'FR' ? 'PRIX UNITAIRE' : 'UNIT PRICE'}</th>
                      <th className="py-3 pl-4 text-right">{language === 'FR' ? 'MONTANT NET' : 'NET AMOUNT'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {completedOrder.items.map((item: any, id: number) => (
                      <tr key={id} className="hover:bg-white/5 duration-300">
                        <td className="py-4 pr-4 font-sans text-white">
                          <span className="font-medium text-xs block">{item.productName}</span>
                          {item.selectedSize && (
                            <span className="text-[9px] font-mono text-amber-500/80 uppercase">
                              {language === 'FR' ? 'Taille sélectionnée' : 'Selected size'}: {item.selectedSize}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-neutral-300">{item.quantity}</td>
                        <td className="py-4 px-4 text-right text-neutral-300">{formatPrice(item.price)}</td>
                        <td className="py-4 pl-4 text-right text-white font-semibold">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculations and Visual Signature QR Code bottom */}
              <div className="border-t border-amber-500/20 pt-6 flex flex-col md:flex-row md:justify-between gap-6 md:gap-8 items-stretch md:items-center">
                
                {/* Simulated luxury certificate signature stamp */}
                <div className="flex items-center space-x-4 bg-neutral-900/60 p-4 border border-white/5 rounded">
                  <div className="w-16 h-16 bg-white p-1 rounded inline-block shrink-0 flex items-center justify-center">
                    {invoiceQrDataUrl ? (
                      <img
                        src={invoiceQrDataUrl}
                        alt="QR Code Facture Souveraine"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-neutral-700 font-mono text-center">QR</span>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                      {language === 'FR' ? "CERTIFICAT D'AUTHENTICITÉ" : "CERTIFICATE OF AUTHENTICITY"}
                    </p>
                    <p className="text-[9px] text-neutral-500 leading-snug">
                      {language === 'FR' 
                        ? "Scanner ce timbre pour vérifier les garanties de propriété et l'originalité de l'objet."
                        : "Scan this stamp to verify physical property guarantees and digital authenticity."}
                    </p>
                  </div>
                </div>

                <div className="text-right text-sm space-y-1.5 w-full md:min-w-[15rem] font-mono">
                  <div className="flex justify-between text-neutral-500">
                    <span>{language === 'FR' ? 'Expédition de valeur :' : 'Valued shipping :'}</span>
                    <span className="text-white">{language === 'FR' ? 'Gratuit' : 'Complimentary'}</span>
                  </div>
                  <div className="flex justify-between text-yellow-500 text-lg font-bold border-t border-white/5 pt-2">
                    <span>{language === 'FR' ? 'TOTAL FACTURÉ :' : 'TOTAL INVOICED :'}</span>
                    <span>{formatPrice(completedOrder.totalPrice)}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Action row: edit or finalize with one combined PDF + WhatsApp action */}
            <div className="flex flex-col items-center justify-center gap-4 text-center mt-6">
              <button
                type="button"
                onClick={handleReturnToEdit}
                className="px-4 h-10 border border-white/10 bg-neutral-950 text-neutral-400 hover:text-white hover:border-white/25 rounded text-[10px] font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'FR' ? 'Retour modifier les informations' : 'Back to edit details'}</span>
              </button>

              <button
                id="btn-print-invoice-complete"
                onClick={handleDownloadInvoiceAndWhatsApp}
                disabled={actionLoading || !invoiceQrDataUrl}
                className="px-6 sm:px-8 h-12 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-60 rounded text-xs font-black font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full max-w-xl justify-center shadow-[0_12px_30px_rgba(217,119,6,0.18)]"
              >
                {!invoiceQrDataUrl ? (
                  <span>{language === 'FR' ? 'Préparation du QR...' : 'Preparing QR...'}</span>
                ) : actionLoading ? (
                  <span>{language === 'FR' ? 'Préparation du PDF...' : 'Preparing PDF...'}</span>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>{language === 'FR' ? 'Télécharger la facture et envoyer via WhatsApp' : 'Download invoice and send via WhatsApp'}</span>
                  </>
                )}
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

            <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center mt-4">
              {language === 'FR' 
                ? "* Une fois sur WhatsApp, cliquez simplement sur \"envoyer\" pour transmettre votre sélection dorée directement à notre concierge."
                : "* Once on WhatsApp, simply click \"send\" to transmit your gold selection directly to our concierge."}
            </p>

          </div>
        )}

      </div>
    </div>
  );
}
