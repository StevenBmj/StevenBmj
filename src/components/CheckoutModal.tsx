/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import InvoicePreview from './InvoicePreview';
import { invoiceWhatsApp } from '../lib/invoice';
import type { InvoiceFile } from '../lib/invoicePdf';
import { apiFetch as fetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ShieldCheck, Truck, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

interface CheckoutModalProps {
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}


export default function CheckoutModal({ onClose, onOrderSuccess }: CheckoutModalProps) {
  const { language, cart, products, replaceCart, formatPrice, clearCart, appliedPromo, setAppliedPromo, lastInvoice, setLastInvoice, user } = useApp();
  const [invoiceFile, setInvoiceFile] = useState<InvoiceFile | null>(null);
  const [draft] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sbmj_checkout_draft') || 'null');
      return saved?.userId === user.id ? saved : null;
    } catch { return null; }
  });
  const [requestId] = useState<string>(() => /^[0-9a-f-]{36}$/i.test(draft?.requestId || '') ? draft.requestId : crypto.randomUUID());
  const [editingOrderId, setEditingOrderId] = useState<string | null>(draft?.editingOrderId || null);
  const [submitError, setSubmitError] = useState('');

  // Form states
  const [customerName, setCustomerName] = useState(draft?.customerName || user.name || '');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(getCountries().includes(draft?.phoneCountry) ? draft.phoneCountry : 'BJ');
  const [localPhone, setLocalPhone] = useState(String(draft?.localPhone || '').replace(/\D/g, ''));
  const [email, setEmail] = useState(user.email || '');
  const [address, setAddress] = useState(draft?.address || '');
  const [city, setCity] = useState(draft?.city || '');
  const [notes, setNotes] = useState(draft?.notes || '');
  
  // States of order process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderState, setCompletedOrderState] = useState<any | null>(() => !draft?.editingOrderId && lastInvoice
    && (cart.length === 0 || lastInvoice.id === draft?.invoiceId || lastInvoice.id === `SBMJ-${requestId}`) ? lastInvoice : null);
  const [actionLoading, setActionLoading] = useState(false);
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
    if (completedOrder) return;
    localStorage.setItem('sbmj_checkout_draft', JSON.stringify({
      userId: user.id, requestId, editingOrderId,
      customerName,
      phoneCountry,
      localPhone,
      email,
      address,
      city,
      notes,
    }));
  }, [address, city, completedOrder, customerName, email, localPhone, notes, phoneCountry, requestId, editingOrderId, user.id]);


  const subTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.promoPrice || item.product.price;
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round(subTotal * activeDiscount) / 100;
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
      const res = await fetch('/api/promos?code=' + encodeURIComponent(promoCodeInput.trim().toUpperCase()));
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
    setSubmitError('');

      const orderPayload = {
      requestId,
      promoCode: appliedPromo?.code || undefined,
      customerName,
      whatsapp: fullWhatsapp,
      email,
      address,
      city,
      notes,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.promoPrice || item.product.price,
        selectedSize: item.selectedSize
      })),
      totalPrice: finalTotal,
      currency: 'EUR'
    };

    try {
      const res = await fetch(editingOrderId ? `/api/orders/${encodeURIComponent(editingOrderId)}` : '/api/orders', {
        method: editingOrderId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const data = await res.json();
        updateCompletedOrder(data.order);
        setEditingOrderId(null);
        localStorage.setItem('sbmj_checkout_draft', JSON.stringify({ userId: user.id, requestId, invoiceId: data.order.id }));
        if (onOrderSuccess) {
          onOrderSuccess(data.order);
        }
      } else {
        setSubmitError(language === 'FR' ? 'La commande n’a pas été enregistrée. Vérifiez le panier et réessayez ; votre facture précédente est conservée.'
          : 'The order was not saved. Check your cart and retry; your previous invoice is preserved.');
      }
    } catch {
      setSubmitError(language === 'FR' ? 'Connexion interrompue. Réessayez sans fermer cette page.' : 'Connection interrupted. Retry without closing this page.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildWhatsAppUrl = () => completedOrder ? invoiceWhatsApp(completedOrder, language) : '';

  const handleReturnToEdit = async () => {
    if (!completedOrder) return;
    const order = completedOrder;
    if (order.status !== 'pending' || order.paymentStatus !== 'pending') {
      setSubmitError(language === 'FR' ? 'Cette commande ne peut plus être modifiée. Contactez la boutique.' : 'This order can no longer be edited. Please contact the store.');
      return;
    }
    const items = order.items.map((item: any) => ({ product: products.find(product => product.id === item.productId), quantity: item.quantity, selectedSize: item.selectedSize }));
    if (items.some((item: any) => !item.product)) {
      setSubmitError(language === 'FR' ? 'Un article est indisponible. Votre facture est conservée ; contactez la boutique.' : 'An item is unavailable. Your invoice is preserved; please contact the store.');
      return;
    }
    replaceCart(items);
    setCustomerName(order.customerName || '');
    setEmail(order.email || email || '');
    setAddress(order.address || '');
    setCity(order.city || '');
    setNotes(order.notes || '');
    const phone = parsePhoneNumberFromString(order.whatsapp || '');
    if (phone?.country) {
      setPhoneCountry(phone.country);
      setLocalPhone(phone.nationalNumber);
    }
    setSubmitError('');
    setEditingOrderId(order.id);
    setCompletedOrderState(null);
    const promo = order.pricingSnapshot;
    setPromoCodeInput(promo?.promoCode || '');
    setActiveDiscount(promo?.discountPercent || 0);
    setAppliedPromo(promo?.promoCode ? { code: promo.promoCode, discountPercent: promo.discountPercent } : null);
  };

  const handleDownloadInvoiceAndWhatsApp = async () => {
    if (!completedOrder || !invoiceFile || invoiceFile.orderId !== completedOrder.id || invoiceFile.language !== language || actionLoading) return;
    setActionLoading(true);
    try {
      const link = document.createElement('a');
      link.href = invoiceFile.url;
      link.download = invoiceFile.filename;
      link.click();
      const waUrl = buildWhatsAppUrl();
      clearCart();
      setAppliedPromo(null);
      localStorage.removeItem('sbmj_checkout_draft');
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert(language === 'FR' ? 'Le telechargement a echoue. Reessayez.' : 'Download failed. Please retry.');
    } finally { setActionLoading(false); }
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
                    pattern="[^0-9]{2,}"
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
                className="w-full min-h-12 py-3 px-3 bg-amber-400 text-black rounded text-xs tracking-widest font-mono uppercase font-black hover:bg-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-2 mt-4"
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
              {submitError && <p role="alert" className="text-sm text-red-300">{submitError}</p>}
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
                  <span>{language === 'FR' ? 'Sous-total' : 'Subtotal'}</span>
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
            
            <InvoicePreview order={completedOrder} language={language} onReady={setInvoiceFile} />
            {submitError && <p role="alert" className="text-sm text-red-300 text-center">{submitError}</p>}

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
                disabled={actionLoading || !invoiceFile}
                className="px-4 sm:px-8 min-h-12 py-3 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-60 rounded text-xs font-black font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full max-w-xl justify-center shadow-[0_12px_30px_rgba(217,119,6,0.18)]"
              >
                {!invoiceFile ? (
                  <span>{language === 'FR' ? 'Préparation de la facture...' : 'Preparing invoice...'}</span>
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
