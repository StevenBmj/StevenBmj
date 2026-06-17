import type { Order, Product, PromoCode } from '../types';

export function productToRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    name_en: product.nameEn,
    description: product.description,
    description_en: product.descriptionEn,
    category: product.category,
    images: product.images || [],
    price: product.price || 0,
    promo_price: product.promoPrice ?? null,
    stock: product.stock || 0,
    rating: product.rating || 0,
    specs: product.specs || [],
    is_exclu: Boolean(product.isExclu),
    is_new: Boolean(product.isNew),
    badge: product.badge ?? null,
    badge_en: product.badgeEn ?? null,
    seo_title: product.seoTitle ?? null,
    seo_description: product.seoDescription ?? null,
  };
}

export function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en || '',
    description: row.description || '',
    descriptionEn: row.description_en || '',
    category: row.category,
    images: row.images || [],
    price: Number(row.price || 0),
    promoPrice: row.promo_price === null || row.promo_price === undefined ? undefined : Number(row.promo_price),
    stock: Number(row.stock || 0),
    rating: Number(row.rating || 0),
    specs: row.specs || [],
    isExclu: Boolean(row.is_exclu),
    isNew: Boolean(row.is_new),
    badge: row.badge || undefined,
    badgeEn: row.badge_en || undefined,
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
  };
}

export function orderToRow(order: Order) {
  return {
    id: order.id,
    customer_name: order.customerName,
    whatsapp: order.whatsapp,
    email: order.email ?? null,
    address: order.address,
    city: order.city,
    notes: order.notes ?? null,
    items: order.items || [],
    total_price: order.totalPrice || 0,
    currency: order.currency || 'EUR',
    status: order.status || 'pending',
    date: order.date,
    pdf_invoice_url: order.pdfInvoiceUrl ?? null,
  };
}

export function rowToOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    email: row.email || undefined,
    address: row.address,
    city: row.city,
    notes: row.notes || undefined,
    items: row.items || [],
    totalPrice: Number(row.total_price || 0),
    currency: row.currency || 'EUR',
    status: row.status || 'pending',
    date: row.date,
    pdfInvoiceUrl: row.pdf_invoice_url || undefined,
  };
}

export function promoToRow(promo: PromoCode) {
  return {
    code: promo.code.toUpperCase(),
    discount_percentage: promo.discountPercentage || 0,
    min_amount: promo.minAmount ?? null,
    active: Boolean(promo.active),
    expires_at: promo.expiresAt ?? null,
  };
}

export function rowToPromo(row: any): PromoCode {
  return {
    code: row.code,
    discountPercentage: Number(row.discount_percentage || 0),
    minAmount: row.min_amount === null || row.min_amount === undefined ? undefined : Number(row.min_amount),
    active: Boolean(row.active),
    expiresAt: row.expires_at || undefined,
  };
}

export function announcementToRow(announcement: any) {
  return {
    id: announcement.id,
    text: announcement.text,
    text_en: announcement.textEn || announcement.text,
    expires_at: announcement.expiresAt || null,
    active: announcement.active !== false,
  };
}

export function rowToAnnouncement(row: any) {
  return {
    id: row.id,
    text: row.text,
    textEn: row.text_en || row.text,
    expiresAt: row.expires_at,
    active: Boolean(row.active),
  };
}

export function reviewToRow(review: any) {
  return {
    id: review.id,
    customer_name: review.customerName,
    rating: Number(review.rating || 5),
    text: review.text,
    status: review.status || 'pending',
    date: review.date,
  };
}

export function rowToReview(row: any) {
  return {
    id: row.id,
    customerName: row.customer_name,
    rating: Number(row.rating || 5),
    text: row.text,
    status: row.status || 'pending',
    date: row.date,
  };
}

export function logToRow(log: any) {
  return {
    id: log.id || `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: log.timestamp,
    ip: log.ip || '127.0.0.1',
    event: log.event,
    status: log.status,
  };
}

export function rowToLog(row: any) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    ip: row.ip,
    event: row.event,
    status: row.status,
  };
}

export function profileToUser(profile: any) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: '',
    googleLinked: Boolean(profile.google_linked),
    vipPoints: Number(profile.vip_points || 0),
    isAdmin: Boolean(profile.is_admin),
    isConfirmed: Boolean(profile.is_confirmed),
    activationCode: profile.activation_code || '',
    activationExpiresAt: profile.activation_expires_at || '',
    resetCode: profile.reset_code || '',
    resetExpiresAt: profile.reset_expires_at || '',
    dateJoined: profile.date_joined,
  };
}
