/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ShieldCheck, Truck, Check, HelpCircle, Phone, FileText, ArrowRight } from 'lucide-react';

interface CheckoutModalProps {
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
}

export default function CheckoutModal({ onClose, onOrderSuccess }: CheckoutModalProps) {
  const { language, cart, formatPrice, clearCart, currency, appliedPromo, setAppliedPromo } = useApp();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  
  // States of order process
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

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
    if (!customerName || !whatsapp || !email || !address || !city) return;

    setIsSubmitting(true);

    const orderPayload = {
      customerName,
      whatsapp,
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
        setCompletedOrder(data.order);
        clearCart();
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

  // Automated WhatsApp Message Trigger
  const handleWhatsAppRedirect = () => {
    if (!completedOrder) return;

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
    const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;
    
    // Redirect now
    window.open(waUrl, '_blank');
  };

  const handleDownloadInvoiceAndWhatsApp = () => {
    if (!completedOrder) return;
    const rows = completedOrder.items.map((item: any) => {
      const size = item.selectedSize ? ` - Taille: ${item.selectedSize}` : '';
      return `<tr><td>${item.quantity}x ${item.productName}${size}</td><td style="text-align:right">${formatPrice(item.price * item.quantity)}</td></tr>`;
    }).join('');
    const html = `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Facture StevenBmj ${completedOrder.id}</title></head>
<body style="font-family:Arial,sans-serif;background:#050505;color:#fff;padding:32px">
  <main style="max-width:760px;margin:auto;border:2px solid #d97706;padding:28px">
    <h1 style="color:#fbbf24;letter-spacing:.18em">STEVENBMJ</h1>
    <h2>Facture ${completedOrder.id}</h2>
    <p>Date: ${new Date(completedOrder.date).toLocaleString('fr-FR')}</p>
    <p>Client: ${completedOrder.customerName}</p>
    <p>Email: ${completedOrder.email || email}</p>
    <p>WhatsApp: ${completedOrder.whatsapp}</p>
    <p>Livraison: ${completedOrder.address}, ${completedOrder.city}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:24px">${rows}</table>
    <h2 style="text-align:right;color:#fbbf24">Total: ${formatPrice(completedOrder.totalPrice)}</h2>
  </main>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facture-stevenbmj-${completedOrder.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    window.setTimeout(handleWhatsAppRedirect, 900);
  };

  const handlePrintInvoice = () => {
    if (!completedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres contextuelles (popups) pour imprimer la facture.");
      return;
    }
    
    const invoiceHtml = `
      <html>
        <head>
          <title>Facture StevenBmj - Reference: ${completedOrder.id}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body {
                background-color: #000000 !important;
                color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-container {
                background-color: #050505 !important;
                border-color: #fbbf24 !important;
              }
              .text-gold {
                color: #fbbf24 !important;
              }
            }
            body { background-color: #000000; color: #ffffff; font-family: sans-serif; padding: 40px; }
            .print-container { max-width: 800px; margin: 0 auto; border: 4px double rgba(251, 191, 36, 0.4); padding: 35px; border-radius: 8px; background-color: #050505; }
            .font-mono { font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="flex justify-between items-center border-b border-yellow-500/30 pb-6 mb-6">
              <div class="flex items-center space-x-3">
                <img src="/logo.png" alt="StevenBmj" width="60" height="60" style="width:60px;height:60px;border-radius:9999px;object-fit:cover;" />
                <div style="text-align: left; margin-left: 10px;">
                  <div style="font-size: 24px; color: #fbbf24; font-weight: 300; letter-spacing: 0.25em; font-family: sans-serif; text-transform: uppercase; line-height: 1;">StevenBmj</div>
                  <div style="font-size: 7px; color: #a3a3a3; font-weight: 600; letter-spacing: 0.35em; font-family: monospace; text-transform: uppercase; margin-top: 3px;">HAUTE COUTURE & JOAILLERIE</div>
                </div>
              </div>
              <div class="text-right text-xs font-mono">
                <p class="font-bold text-yellow-400 text-sm tracking-widest">REÇU DE FACTURATION ACQUITTÉ</p>
                <p class="text-neutral-400">RÉF: ${completedOrder.id}</p>
                <p class="text-neutral-400">DATE: ${new Date(completedOrder.date).toLocaleDateString('fr-FR')} ${new Date(completedOrder.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-white/5">
              <div>
                <h3 class="text-yellow-500 font-bold uppercase mb-2 font-mono tracking-widest">Destinataire VIP</h3>
                <p class="font-bold uppercase text-sm text-white">${completedOrder.customerName}</p>
                <p class="text-gray-400">WhatsApp: ${completedOrder.whatsapp}</p>
                <p class="text-gray-400">Adresse: ${completedOrder.address}, ${completedOrder.city}</p>
                ${completedOrder.notes ? `<p class="italic text-gray-500 mt-2 font-sans">Notes d'atelier: ${completedOrder.notes}</p>` : ''}
              </div>
              <div class="text-right">
                <h3 class="text-yellow-500 font-bold uppercase mb-2 font-mono tracking-widest">Maison de Ventes</h3>
                <p class="font-bold text-white">StevenBmj East Africa SARL</p>
                <p class="text-gray-400">Siège Cotonou, Bénin</p>
                <p class="text-gray-400">Avenue du Prestige, Akpakpa</p>
                <p class="font-mono text-neutral-300">Concierge: +22955468138</p>
              </div>
            </div>

            <table class="w-full text-left text-xs mb-6 border-collapse">
              <thead>
                <tr class="border-b border-yellow-500/30 font-mono text-gray-400 uppercase tracking-widest text-[9px]">
                  <th class="pb-3 text-left">SÉLECTION / CRÉATION</th>
                  <th class="pb-3 text-center">QUANTITÉ</th>
                  <th class="pb-3 text-right">PRIX UNITAIRE</th>
                  <th class="pb-3 text-right">MONTANT TOTAL</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 font-mono text-xs text-neutral-300">
                ${completedOrder.items.map((item: any) => `
                  <tr>
                    <td class="py-4">
                      <p class="font-sans font-bold text-sm text-white">${item.productName}</p>
                      ${item.selectedSize ? `<p class="text-[10px] text-yellow-500">Taille: ${item.selectedSize}</p>` : ''}
                    </td>
                    <td class="py-4 text-center text-white">${item.quantity}</td>
                    <td class="py-4 text-right">${item.price.toLocaleString('fr-FR')} €</td>
                    <td class="py-4 text-right font-bold text-white">${(item.price * item.quantity).toLocaleString('fr-FR')} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="flex justify-between items-center border-t border-yellow-500/30 pt-6">
              <div class="flex items-center space-x-4">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=d97706&bgcolor=050505&data=${encodeURIComponent(
                    `REÇU SOUVERAIN N° ${completedOrder.id}\nCLIENT: ${completedOrder.customerName}\nTOTAL: ${completedOrder.totalPrice.toLocaleString('fr-FR')} EUR\nSTEVENBMJ AUTHENTICITY GUARANTEED`
                  )}"
                  class="w-16 h-16 object-contain border border-yellow-500/20 p-1 bg-black"
                />
                <div class="text-left font-mono">
                  <p class="text-[9px] text-yellow-500 font-bold tracking-wider">CERTIFICAT SBMJ</p>
                  <p class="text-[8px] text-gray-500 leading-tight">Cet achat est scellé sous le label de prestige StevenBmj.</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <p class="text-xs text-neutral-400 font-bold">LIVRAISON PRIVÉE SBMJ : <span class="text-emerald-400 font-bold font-sans">INCLUSE</span></p>
                <p class="text-xs text-neutral-300 mt-1">MONTANT PAYÉ APPRÉCIÉ :</p>
                <p class="text-xl font-bold text-yellow-500">${completedOrder.totalPrice.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 md:p-8 flex justify-center items-start">
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
                    {language === 'FR' ? 'Numéro WhatsApp (Complet) *' : 'WhatsApp Number (With Country Code) *'}
                  </label>
                  <input
                    id="checkout-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+229 55 46 81 38"
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white focus:outline-none focus:border-amber-400 rounded focus:ring-1 focus:ring-amber-500/10"
                  />
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
                <div className="grid grid-cols-2 gap-4">
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
          <div id="print-area" className="p-6 md:p-12 space-y-8 bg-black text-white selection:bg-amber-500/20">
            
            {/* The Luxury Double Border Invoice Card */}
            <div className="border-4 border-double border-amber-500/30 p-8 rounded bg-neutral-950 tracking-wide relative">
              
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
              <div className="border-t border-amber-500/20 pt-6 flex flex-col md:flex-row md:justify-between gap-8 items-center">
                
                {/* Simulated luxury certificate signature stamp */}
                <div className="flex items-center space-x-4 bg-neutral-900/60 p-4 border border-white/5 rounded">
                  <div className="w-16 h-16 bg-white p-1 rounded inline-block shrink-0 flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=121212&bgcolor=ffffff&data=${encodeURIComponent(
                        `MAISON STEVENBMJ\nFacture de prestige: ${completedOrder.id}\nClient: ${completedOrder.customerName}\nTotal paye: ${completedOrder.totalPrice} EUR\nDate d'emission: ${new Date(completedOrder.date).toLocaleDateString('fr-FR')}\nAchats: ${completedOrder.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}\nMerci de votre haute confiance.`
                      )}`}
                      alt="QR Code Facture Souveraine"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
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

                <div className="text-right text-sm space-y-1.5 min-w-[15rem] font-mono">
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

            {/* Quick action buttons row: print, WhatsApp direct dispatch */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center mt-6">
              
              <button
                id="btn-print-invoice-complete"
                onClick={handleDownloadInvoiceAndWhatsApp}
                className="px-6 h-12 border border-white/20 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded text-xs font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                <FileText className="w-4 h-4" />
                <span>{language === 'FR' ? 'Telecharger facture puis WhatsApp' : 'Download invoice then WhatsApp'}</span>
              </button>

              <button
                id="btn-redirect-whatsapp-order"
                onClick={handleWhatsAppRedirect}
                className="px-8 h-12 bg-amber-400 text-black hover:bg-amber-300 rounded text-xs font-black font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center animate-pulse"
              >
                <Phone className="w-4 h-4" />
                <span>{language === 'FR' ? 'Envoyer ma commande sur WhatsApp' : 'Send My Order on WhatsApp'}</span>
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
