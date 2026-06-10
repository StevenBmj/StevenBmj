/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  hasIntroPlayed: boolean;
  setHasIntroPlayed: (played: boolean) => void;
  products: Product[];
  setProducts: (prods: Product[]) => void;
  fetchProducts: () => void;
  settings: AppSettings | null;
  setSettings: (sett: AppSettings) => void;
  fetchSettings: () => void;
  appliedPromo: any | null;
  setAppliedPromo: (p: any | null) => void;
  user: any | null;
  setUser: (u: any | null) => void;
  logout: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  triggerAuthRequired: (callbackOnSuccess: () => void) => void;
  executeAuthCallback: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'FR' | 'EN'>('FR');
  const [currency, setCurrencyState] = useState<'EUR' | 'CFA' | 'USD'>('EUR');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [vipPoints, setVipPoints] = useState(0);
  const [hasIntroPlayed, setHasIntroPlayed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [user, setUserState] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  // Rates relative to EUR
  const rates = {
    EUR: 1,
    CFA: 655.957,
    USD: 1.09,
  };

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

    const savedUser = localStorage.getItem('sbmj_user');
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to load user session", e);
      }
    }

    fetchProducts();
    fetchSettings();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products from server API", err);
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
  };

  const setUser = (u: any | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem('sbmj_user', JSON.stringify(u));
      if (u.vipPoints !== undefined) {
        setVipPoints(u.vipPoints);
        localStorage.setItem('sbmj_vip', u.vipPoints.toString());
      }
    } else {
      localStorage.removeItem('sbmj_user');
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('sbmj_user');
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
        wishlist,
        toggleWishlist,
        history,
        addVisited,
        cartOpen,
        setCartOpen,
        chatOpen,
        setChatOpen,
        vipPoints,
        addVipPoints,
        formatPrice,
        hasIntroPlayed,
        setHasIntroPlayed: handleSetIntroPlayed,
        products,
        setProducts,
        fetchProducts,
        settings,
        setSettings,
        fetchSettings,
        appliedPromo,
        setAppliedPromo,
        user,
        setUser,
        logout,
        authModalOpen,
        setAuthModalOpen,
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
