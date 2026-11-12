import type { Order } from '../types.js';

export interface PricingSnapshot {
  version: 1;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  discountPercent: number;
  promoCode: string;
  shippingCents: number;
  totalCents: number;
  seller: { name: string; address: string; phone: string; email: string };
}

export function invoiceModel(order: Order) {
  const subtotal = order.items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const total = Math.round(Number(order.totalPrice) * 100);
  const pricing: PricingSnapshot = order.pricingSnapshot || {
    version: 1, currency: order.currency || 'EUR', subtotalCents: subtotal,
    discountCents: Math.max(0, subtotal - total), discountPercent: 0, promoCode: '',
    shippingCents: Math.max(0, total - subtotal), totalCents: total,
    seller: { name: 'StevenBmj', address: 'Cotonou, Benin', phone: '+22955468138', email: 'stevenbmj202@gmail.com' },
  };
  if (![pricing.subtotalCents, pricing.discountCents, pricing.shippingCents, pricing.totalCents].every(n => Number.isSafeInteger(n) && n >= 0)
    || pricing.version !== 1 || pricing.subtotalCents !== subtotal || pricing.discountCents > subtotal
    || order.items.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0)
    || pricing.totalCents !== total || pricing.subtotalCents - pricing.discountCents + pricing.shippingCents !== total) {
    throw new Error('Invoice totals are inconsistent');
  }
  const format = (cents: number, language: 'FR' | 'EN') => new Intl.NumberFormat(language === 'FR' ? 'fr-FR' : 'en-US', {
    style: 'currency', currency: pricing.currency === 'CFA' ? 'XOF' : pricing.currency,
  }).format(cents / 100);
  return { order, pricing, format };
}

export function invoiceWhatsApp(order: Order, language: 'FR' | 'EN') {
  const model = invoiceModel(order);
  const fr = language === 'FR';
  const lines = [
    'STEVENBMJ', `${fr ? 'Commande' : 'Order'}: ${order.id}`,
    `${fr ? 'Client' : 'Customer'}: ${order.customerName}`, `WhatsApp: ${order.whatsapp}`, `Email: ${order.email || ''}`,
    `${fr ? 'Adresse' : 'Address'}: ${order.address}, ${order.city}`,
    ...order.items.map(item => `${item.quantity} x ${item.productName}${item.selectedSize ? ` (${item.selectedSize})` : ''}: ${model.format(Math.round(item.price * 100) * item.quantity, language)}`),
    `${fr ? 'Sous-total' : 'Subtotal'}: ${model.format(model.pricing.subtotalCents, language)}`,
    `${fr ? 'Reduction' : 'Discount'}: ${model.format(model.pricing.discountCents, language)}${model.pricing.promoCode ? ` (${model.pricing.promoCode})` : ''}`,
    `${fr ? 'Livraison' : 'Shipping'}: ${model.format(model.pricing.shippingCents, language)}`,
    `Total: ${model.format(model.pricing.totalCents, language)}`,
    `${fr ? 'Notes' : 'Notes'}: ${order.notes || '-'}`,
  ];
  return `https://wa.me/${model.pricing.seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
}
