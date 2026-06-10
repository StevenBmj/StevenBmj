/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, ShoppingBag, X, Tag, ShieldCheck, CreditCard } from 'lucide-react';

interface CartDrawerProps {
  onCheckout: () => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { 
    language, 
    cart, 
    cartOpen, 
    setCartOpen, 
    updateCartQuantity, 
    removeFromCart, 
    formatPrice,
    appliedPromo,
    setAppliedPromo
  } = useApp();

  const [coupon, setCoupon] = useState('');
  const [promoError, setPromoError] = useState('');

  const discountPercent = appliedPromo?.discountPercent || 0;
  const appliedCode = appliedPromo?.code || '';

  // Preset promo codes logic
  const validCoupons: Record<string, number> = {
    'STEVENBMJ10': 10,
    'PRESTIGE20': 20,
    'WELCOMEVIP': 15
  };

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = coupon.trim().toUpperCase();
    if (!code) return;

    try {
      const res = await fetch('/api/promos');
      if (res.ok) {
        const promos = await res.json();
        const matching = promos.find((p: any) => p.code.toUpperCase() === code && p.active);
        
        if (matching) {
          setAppliedPromo({
            code: matching.code,
            discountPercent: matching.discountPercentage
          });
          setCoupon('');
        } else {
          // Fallback to local codes
          if (validCoupons[code] !== undefined) {
            setAppliedPromo({
              code: code,
              discountPercent: validCoupons[code]
            });
            setCoupon('');
          } else {
            setPromoError(language === 'FR' ? 'Code promo invalide ou expiré.' : 'Invalid or expired promo code.');
          }
        }
      } else {
        // Fallback to local codes
        if (validCoupons[code] !== undefined) {
          setAppliedPromo({
            code: code,
            discountPercent: validCoupons[code]
          });
          setCoupon('');
        } else {
          setPromoError(language === 'FR' ? 'Code promo invalide.' : 'Invalid promotional code.');
        }
      }
    } catch (err) {
      // Fallback to local codes
      if (validCoupons[code] !== undefined) {
        setAppliedPromo({
          code: code,
          discountPercent: validCoupons[code]
        });
        setCoupon('');
      } else {
        setPromoError(language === 'FR' ? 'Erreur de connexion.' : 'Connection error.');
      }
    }
  };

  const subTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.promoPrice || item.product.price;
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (subTotal * discountPercent) / 100;
  }, [subTotal, discountPercent]);

  const shippingCost = useMemo(() => {
    if (subTotal === 0) return 0;
    // Free above 3000 EUR
    return subTotal >= 3000 ? 0 : 150;
  }, [subTotal]);

  const finalTotal = useMemo(() => {
    return subTotal - discountAmount + shippingCost;
  }, [subTotal, discountAmount, shippingCost]);

  if (!cartOpen) return null;

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          
          <div className="pointer-events-auto w-screen max-w-md border-l border-white/5 bg-neutral-950 text-white">
            <div className="flex h-full flex-col justify-between overflow-y-auto p-6 text-left">
              
              {/* Header section */}
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-5">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white">
                      {language === 'FR' ? 'VOTRE COFFRET' : 'YOUR SELECTION'}
                    </h2>
                  </div>
                  <button
                    id="btn-close-cart"
                    onClick={() => setCartOpen(false)}
                    className="p-1.5 hover:text-amber-400 text-neutral-400 hover:bg-white/5 rounded duration-300 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* List items block */}
                <div className="flow-root mt-6">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 text-neutral-500 space-y-4">
                      <ShoppingBag className="w-8 h-8 stroke-1 animate-pulse" />
                      <p className="text-xs uppercase tracking-widest font-mono">
                        {language === 'FR' ? 'Votre coffret est vide' : 'Your chest is empty'}
                      </p>
                      <button
                        onClick={() => setCartOpen(false)}
                        className="text-amber-400 underline text-xs font-mono cursor-pointer"
                      >
                        {language === 'FR' ? 'Continuer mes repérages' : 'Continue exhibition sessions'}
                      </button>
                    </div>
                  ) : (
                    <ul className="-my-6 divide-y divide-white/5">
                      {cart.map((item, idx) => {
                        const actualPrice = item.product.promoPrice || item.product.price;
                        return (
                          <li key={`${item.product.id}-${item.selectedSize}`} className="flex py-6">
                            
                            {/* Product thumbnail visualization */}
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-white/5 bg-neutral-950">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover object-center filter brightness-95"
                              />
                            </div>

                            {/* Informative description texts & adjusts */}
                            <div className="ml-4 flex flex-1 flex-col justify-between">
                              <div>
                                <div className="flex justify-between text-xs font-medium text-white">
                                  <h3 className="hover:text-amber-400 duration-300">
                                    {language === 'FR' ? item.product.name : item.product.nameEn}
                                  </h3>
                                  <span className="ml-4 font-mono">{formatPrice(actualPrice * item.quantity)}</span>
                                </div>
                                {item.selectedSize && (
                                  <p className="mt-1 text-[10px] font-mono text-amber-500/80 uppercase">
                                    {language === 'FR' ? `Taille : ${item.selectedSize}` : `Size : ${item.selectedSize}`}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-xs mt-2">
                                {/* Qty adjustments */}
                                <div className="flex items-center border border-white/5 rounded overflow-hidden h-8 bg-neutral-900/60">
                                  <button
                                    id={`btn-cart-minus-${idx}`}
                                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedSize)}
                                    className="px-2 text-neutral-400 hover:text-white"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 font-mono text-xs font-medium text-white">{item.quantity}</span>
                                  <button
                                    id={`btn-cart-plus-${idx}`}
                                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedSize)}
                                    className="px-2 text-neutral-400 hover:text-white"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Trash button */}
                                <button
                                  id={`btn-cart-remove-${idx}`}
                                  onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                                  className="text-neutral-500 hover:text-red-400 duration-300 cursor-pointer"
                                  title="Supprimer la sélection"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Lower Summarized calculations checkouts */}
              {cart.length > 0 && (
                <div className="border-t border-white/5 pt-6 mt-8 space-y-4">
                  
                  {/* Coupon Form */}
                  <form onSubmit={handleApplyPromo} className="flex space-x-2 relative items-center">
                    <input
                      id="cart-promo-code"
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder={language === 'FR' ? 'CODE PROMO (Ex: STEVENBMJ10)' : 'PROMO CODE'}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white placeholder-neutral-600 rounded select-all focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/10"
                    />
                    <button
                      id="btn-apply-promo"
                      type="submit"
                      className="px-4 py-2 bg-neutral-800 border border-white/10 text-xs hover:border-amber-400 font-mono text-amber-500 hover:bg-neutral-900 duration-300 cursor-pointer rounded"
                    >
                      OK
                    </button>
                  </form>
                  {promoError && <p className="text-[10px] text-red-400 font-mono mt-1 text-left">{promoError}</p>}
                  {appliedCode && (
                    <div className="flex justify-between items-center text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded text-left font-mono uppercase">
                      <span>✓ PROMO APPLIQUÉE: {appliedCode} (-{discountPercent}%)</span>
                      <button 
                        onClick={() => {
                          setAppliedPromo(null);
                        }}
                        className="text-red-400 font-bold ml-2 hover:underline cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Pricing Breakdown detailed */}
                  <div className="space-y-2 text-xs border-t border-white/5 pt-4">
                    <div className="flex justify-between text-neutral-400">
                      <span>Sous-total / Subtotal</span>
                      <span className="font-mono text-white">{formatPrice(subTotal)}</span>
                    </div>

                    {discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Réduction / Discount</span>
                        <span className="font-mono">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-neutral-400">
                      <span>Porteur Privé / Courier delivery</span>
                      <span className="font-mono text-white">
                        {shippingCost === 0 
                          ? language === 'FR' ? 'OFFERT' : 'FREE' 
                          : formatPrice(shippingCost)}
                      </span>
                    </div>
                    
                    {shippingCost > 0 && (
                      <p className="text-[9px] text-neutral-500 italic">
                        {language === 'FR' 
                          ? `* Livraison gratuite d'exception à partir de ${formatPrice(3000)} d'achat.`
                          : `* Exquisite delivery is free of charge above ${formatPrice(3000)} purchase total.`}
                      </p>
                    )}

                    <div className="flex justify-between border-t border-white/5 pt-3 text-sm font-semibold text-white">
                      <span>Total</span>
                      <span className="font-mono text-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.15)]">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Guaranteed Checkout button triggers */}
                  <div className="space-y-3 pt-2">
                    <button
                      id="btn-checkout-trigger"
                      onClick={() => {
                        setCartOpen(false);
                        onCheckout();
                      }}
                      className="w-full bg-amber-400 text-black py-3.5 rounded text-xs select-none font-black font-mono tracking-widest uppercase hover:bg-amber-300 transition-colors cursor-pointer text-center flex items-center justify-center gap-2 shadow-xl"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{language === 'FR' ? 'Passer un ordre de paiement' : 'Book a signature checkout'}</span>
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[9px] text-neutral-500 uppercase tracking-widest text-center mt-2 font-mono">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-500/80" />
                      <span>FACTURATION SÉCURISÉE • RÈGLEMENT WHATSAPP</span>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
