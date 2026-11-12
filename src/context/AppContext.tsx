/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch as fetch } from '../lib/api';
import { useNavigation } from './NavigationContext';
import { Product, OrderItem, Category, AppSettings } from '../types';

interface AppContextType {
  language: 'FR' | 'EN';
  setLanguage: (lang: 'FR' | 'EN') => void;
  currency: 'EUR' | 'CFA' | 'USD';
  setCurrency: (curr: 'EUR' | 'CFA' | 'USD') => void;
  cart: OrderItem[];
  addToCart: (product: Product, quantity?: number, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
  replaceCart: (items: OrderItem[]) => void;
  preparedContact: { name: string; email: string; message: string } | null;
  setPreparedContact: (draft: { name: string; email: string; message: string } | null) => void;
  wishlist: string[]; // array of product ids
  toggleWishlist: (productId: string) => void;
  history: string[]; // visited product ids
  addVisited: (productId: string) => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  vipPoints: number;
  addVipPoints: (pts: number) => void;
  formatPrice: (priceInEur: number) => string;
  exchangeInfo: { asOf: string | null; stale: boolean; usd: number | null };
  hasIntroPlayed: boolean;
  setHasIntroPlayed: (played: boolean) => void;
  products: Product[];
  productsLoading: boolean;
  setProducts: (prods: Product[]) => void;
  fetchProducts: () => void;
  settings: AppSettings | null;
  setSettings: (sett: AppSettings) => void;
  fetchSettings: () => void;
  appliedPromo: any | null;
  setAppliedPromo: (p: any | null) => void;
  lastInvoice: any | null;
  setLastInvoice: (order: any | null) => void;
  user: any | null;
  setUser: (u: any | null) => void;
  logout: () => Promise<void>;
  authLoading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authEntry: { mode: 'login' | 'register' } | null;
  openAuth: (mode: 'login' | 'register') => void;
  triggerAuthRequired: (callbackOnSuccess: () => void) => void;
  executeAuthCallback: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { route, openPanel, closePanel } = useNavigation();
  const [language, setLanguageState] = useState<'FR' | 'EN'>('FR');
  const [currency, setCurrencyState] = useState<'EUR' | 'CFA' | 'USD'>('EUR');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const cartOpen = route.panel === 'panier';
  const [chatOpen, setChatOpen] = useState(false);
  const [vipPoints, setVipPoints] = useState(0);
  const [hasIntroPlayed, setHasIntroPlayed] = useState(() => sessionStorage.getItem('sbmj_intro_played') === 'true');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [lastInvoice, setLastInvoiceState] = useState<any | null>(null);
  const [user, setUserState] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [preparedContact, setPreparedContact] = useState<AppContextType['preparedContact']>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState<AppContextType['authEntry']>(null);
  const openAuth = (mode: 'login' | 'register') => {
    setAuthEntry({ mode });
    setAuthModalOpen(true);
  };
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  // Rates relative to EUR
  const [exchangeInfo, setExchangeInfo] = useState<AppContextType['exchangeInfo']>({ asOf: null, stale: true, usd: null });
  const rates = { EUR: 1, CFA: 655.957, USD: exchangeInfo.usd };

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch('/api/shop?resource=rates', { signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        if (!controller.signal.aborted && data?.base === 'EUR' && typeof data.rates?.USD === 'number' && data.rates.USD > 0)
          setExchangeInfo({ asOf: data.asOf, stale: data.stale === true, usd: data.rates.USD });
      } catch { /* Keep the last verified quote; do not invent a USD conversion. */ }
    };
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 600000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, []);

  // Synchronize localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('sbmj_lang');
    if (savedLang === 'FR' || savedLang === 'EN') setLanguageState(savedLang);

    const savedCurr = localStorage.getItem('sbmj_curr');
    if (savedCurr === 'EUR' || savedCurr === 'CFA' || savedCurr === 'USD') setCurrencyState(savedCurr);

    const savedCart = localStorage.getItem('sbmj_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }

    localStorage.removeItem('sbmj_cart_open');

    const savedPromo = localStorage.getItem('sbmj_applied_promo');
    if (savedPromo) {
      try {
        setAppliedPromo(JSON.parse(savedPromo));
      } catch (e) {
        console.error("Failed to load promo", e);
      }
    }

    const savedWishlist = localStorage.getItem('sbmj_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
    }

    const savedHistory = localStorage.getItem('sbmj_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    const savedVip = localStorage.getItem('sbmj_vip');
    if (savedVip) setVipPoints(Number(savedVip));

    localStorage.removeItem('sbmj_user');
    sessionStorage.removeItem('sbmj_admin_auth');
    let mounted = true;
    const expired = () => { setUserState(null); setLastInvoiceState(null); };
    window.addEventListener('sbmj:session-expired', expired);
    const restoreSession = async () => {
      try {
        let response = await fetch('/api/auth/session');
        if (response.status === 401) response = await fetch('/api/auth/session', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }),
        });
        if (mounted && response.ok) setUser((await response.json()).user);
      } catch { /* An offline browser must not invent an authenticated identity. */ }
      finally { if (mounted) setAuthLoading(false); }
    };
    void restoreSession();

    fetchProducts();
    fetchSettings();
    return () => { mounted = false; window.removeEventListener('sbmj:session-expired', expired); };
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products from server API", err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettingsState(data);
      }
    } catch (err) {
      console.error("Error fetching settings from server API", err);
    }
  };

  const setSettings = (sett: AppSettings) => {
    setSettingsState(sett);
  };

  const setLanguage = (lang: 'FR' | 'EN') => {
    setLanguageState(lang);
    localStorage.setItem('sbmj_lang', lang);
  };

  const setCurrency = (curr: 'EUR' | 'CFA' | 'USD') => {
    setCurrencyState(curr);
    localStorage.setItem('sbmj_curr', curr);
  };

  const saveCart = (newCart: OrderItem[]) => {
    setCart(newCart);
    localStorage.setItem('sbmj_cart', JSON.stringify(newCart));
  };

  const persistCartOpen = (open: boolean) => {
    if (open) openPanel('panier');
    else if (route.panel === 'panier') closePanel();
  };

  const persistAppliedPromo = (promo: any | null) => {
    setAppliedPromo(promo);
    if (promo) {
      localStorage.setItem('sbmj_applied_promo', JSON.stringify(promo));
    } else {
      localStorage.removeItem('sbmj_applied_promo');
    }
  };

  const setLastInvoice = (order: any | null) => {
    setLastInvoiceState(order);
    if (order) {
      localStorage.setItem('sbmj_last_invoice', JSON.stringify(order));
    } else {
      localStorage.removeItem('sbmj_last_invoice');
    }
  };

  const addToCart = (product: Product, quantity: number = 1, size?: string) => {
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.selectedSize === size
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      saveCart(updated);
    } else {
      saveCart([...cart, { product, quantity, selectedSize: size }]);
    }
    // Give user VIP points on active browsing/cart adding
    addVipPoints(10);
  };

  const removeFromCart = (productId: string, size?: string) => {
    const updated = cart.filter(
      item => !(item.product.id === productId && item.selectedSize === size)
    );
    saveCart(updated);
  };

  const updateCartQuantity = (productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    const updated = cart.map(item => {
      if (item.product.id === productId && item.selectedSize === size) {
        return { ...item, quantity };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const toggleWishlist = (productId: string) => {
    let updated: string[];
    if (wishlist.includes(productId)) {
      updated = wishlist.filter(id => id !== productId);
    } else {
      updated = [...wishlist, productId];
      addVipPoints(15); // reward for wishlist
    }
    setWishlist(updated);
    localStorage.setItem('sbmj_wishlist', JSON.stringify(updated));
  };

  const addVisited = (productId: string) => {
    if (history.includes(productId)) {
      // Move to top
      const filtered = history.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('sbmj_history', JSON.stringify(updated));
    } else {
      const updated = [productId, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem('sbmj_history', JSON.stringify(updated));
    }
  };

  const addVipPoints = (pts: number) => {
    setVipPoints(prev => {
      const next = prev + pts;
      localStorage.setItem('sbmj_vip', next.toString());
      return next;
    });
  };

  const formatPrice = (priceInEur: number) => {
    if (currency === 'USD' && !rates.USD) return new Intl.NumberFormat(language === 'FR' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(priceInEur);
    const converted = priceInEur * rates[currency];
    if (currency === 'EUR') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(converted);
    }
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(converted);
    }
    // CFA Franc
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(converted).replace('XOF', 'FCFA');
  };

  const handleSetIntroPlayed = (played: boolean) => {
    setHasIntroPlayed(played);
    sessionStorage.setItem('sbmj_intro_played', String(played));
  };

  const setUser = (u: any | null) => {
    setUserState(u);
    setLastInvoiceState(null);
    if (u) {
      // Restore private browser data only after the server has verified its owner.
      try {
        const invoice = JSON.parse(localStorage.getItem('sbmj_last_invoice') || 'null');
        if (invoice?.email?.toLowerCase() === u.email?.toLowerCase()) setLastInvoiceState(invoice);
        else localStorage.removeItem('sbmj_last_invoice');
        const draft = JSON.parse(localStorage.getItem('sbmj_checkout_draft') || 'null');
        if (draft && draft.userId !== u.id) localStorage.removeItem('sbmj_checkout_draft');
      } catch {
        localStorage.removeItem('sbmj_last_invoice');
        localStorage.removeItem('sbmj_checkout_draft');
      }
      if (u.vipPoints !== undefined) {
        setVipPoints(u.vipPoints);
        localStorage.setItem('sbmj_vip', u.vipPoints.toString());
      }
    } else {
      localStorage.removeItem('sbmj_user');
    }
  };

  const logout = async () => {
    const response = await fetch('/api/auth/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }),
    });
    if (!response.ok) throw new Error(language === 'FR' ? 'Deconnexion impossible. Reessayez.' : 'Unable to sign out. Please retry.');
    setUserState(null);
    setLastInvoice(null);
    localStorage.removeItem('sbmj_checkout_draft');
    setAuthCallback(null);
    setPreparedContact(null);
    localStorage.removeItem('sbmj_user');
    sessionStorage.removeItem('sbmj_admin_auth');
  };

  const triggerAuthRequired = (callbackOnSuccess: () => void) => {
    if (user) {
      callbackOnSuccess();
    } else {
      setAuthCallback(() => callbackOnSuccess);
      setAuthModalOpen(true);
    }
  };

  const executeAuthCallback = () => {
    if (authCallback) {
      authCallback();
      setAuthCallback(null);
    }
    setAuthModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        replaceCart: saveCart,
        preparedContact,
        setPreparedContact,
        wishlist,
        toggleWishlist,
        history,
        addVisited,
        cartOpen,
        setCartOpen: persistCartOpen,
        chatOpen,
        setChatOpen,
        vipPoints,
        addVipPoints,
        formatPrice,
        exchangeInfo,
        hasIntroPlayed,
        setHasIntroPlayed: handleSetIntroPlayed,
        products,
        productsLoading,
        setProducts,
        fetchProducts,
        settings,
        setSettings,
        fetchSettings,
        appliedPromo,
        setAppliedPromo: persistAppliedPromo,
        lastInvoice,
        setLastInvoice,
        user,
        authLoading,
        setUser,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authEntry,
        openAuth,
        triggerAuthRequired,
        executeAuthCallback
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
