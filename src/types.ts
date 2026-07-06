/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'watches' | 'chains' | 'suits' | 'shoes' | 'accessories' | 'women' | 'perfumes';

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: Category;
  images: string[];
  price: number; // base in EUR
  promoPrice?: number; // promo base in EUR
  stock: number;
  rating: number;
  specs: ProductSpec[];
  isExclu?: boolean;
  isNew?: boolean;
  badge?: string;
  badgeEn?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  commentEn: string;
  date: string;
  verified: boolean;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface Order {
  id: string;
  customerName: string;
  whatsapp: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    selectedSize?: string;
  }[];
  totalPrice: number;
  currency: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  pdfInvoiceUrl?: string;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  minAmount?: number;
  active: boolean;
  expiresAt?: string;
}

export interface AppSettings {
  homepageHeroTitle: string;
  homepageHeroTitleEn: string;
  homepageHeroSubtitle: string;
  homepageHeroSubtitleEn: string;
  homepageHeroImage1?: string;
  homepageHeroImage2?: string;
  homepageHeroImage3?: string;
  
  // Custom Homepage Section 2 (Philosophie / Story)
  storyTitleFr?: string;
  storyTitleEn?: string;
  storyDescFr?: string;
  storyDescEn?: string;
  storyImage?: string;

  // Custom Homepage Fabrics (Section 3)
  fabric1TitleFr?: string;
  fabric1TitleEn?: string;
  fabric1DescFr?: string;
  fabric1DescEn?: string;
  fabric1Image?: string;

  fabric2TitleFr?: string;
  fabric2TitleEn?: string;
  fabric2DescFr?: string;
  fabric2DescEn?: string;
  fabric2Image?: string;

  fabric3TitleFr?: string;
  fabric3TitleEn?: string;
  fabric3DescFr?: string;
  fabric3DescEn?: string;
  fabric3Image?: string;

  // Custom Homepage Salons (Section 4 Bento)
  bento1TitleFr?: string;
  bento1TitleEn?: string;
  bento1DescFr?: string;
  bento1DescEn?: string;
  bento1Image?: string;

  bento2TitleFr?: string;
  bento2TitleEn?: string;
  bento2DescFr?: string;
  bento2DescEn?: string;
  bento2Image?: string;

  bento3TitleFr?: string;
  bento3TitleEn?: string;
  bento3DescFr?: string;
  bento3DescEn?: string;
  bento3Image?: string;

  bento4TitleFr?: string;
  bento4TitleEn?: string;
  bento4DescFr?: string;
  bento4DescEn?: string;
  bento4Image?: string;

  announcementText: string;
  announcementTextEn: string;
  whatsappContact: string; // "+22955468138"
  taxRate: number; // 0 for local simple, e.g. 18% or included
  aboutTitle?: string;
  aboutTitleEn?: string;
  aboutContent?: string;
  aboutContentEn?: string;
  contactTitle?: string;
  contactTitleEn?: string;
  contactAddress?: string;
  contactAddressEn?: string;
  googleMapEmbedUrl?: string;
  adminPassword?: string;
  careTitle?: string;
  careTitleEn?: string;
  careContent?: string;
  careContentEn?: string;
  footerText?: string;
  footerTextEn?: string;
  footerCredits?: string;
  footerCreditsEn?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  whatsappUrl?: string;
  faqsJson?: string;
  adminResetCode?: string;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}
