import { adminText } from './adminText';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import { useNotifications } from '../context/NotificationsContext';
import type { AdminSection } from '../lib/navigation';
import { apiFetch as fetch } from '../lib/api';
import { Product, Order, PromoCode, AppSettings } from '../types';
import Logo from './Logo';
import InvoicePreview from './InvoicePreview';
import AssistantSettings from './AssistantSettings';
import AssistantPanel from './AssistantPanel';
import SalesReports from './SalesReports';
import OrderWorkspace from './OrderWorkspace';
import DriverManagement from './DriverManagement';
import LedgerReports from './LedgerReports';
import SecurityConsole from './SecurityConsole';
import AdminMfa from './AdminMfa';
import CustomerManagement from './CustomerManagement';
import type { InvoiceFile } from '../lib/invoicePdf';
import { 
  BarChart, Bot, Sparkles, Plus, Edit2, Trash2, Tag, Percent,
  Settings, Search, RefreshCw, Layers, ShieldAlert, Users, 
  HelpCircle, CheckCircle, Clock, Ban, Check, AlertOctagon, CheckSquare,
  Megaphone, Send, Mail, MessageSquare, PhoneCall, Star, LogOut, Eye, EyeOff
} from 'lucide-react';

export default function GodDashboard() {
  const { language, formatPrice, user, setUser, logout, authLoading, setAuthModalOpen, fetchProducts, fetchSettings } = useApp();
  
  // Tabs of "God" dashboard
  const { route, navigate } = useNavigation();
  const { sections: sectionNotifications, markSectionRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<AdminSection>(route.adminSection || (route.orderId ? 'orders' : 'analytics'));
  useEffect(() => { setActiveTab(route.adminSection || (route.orderId ? 'orders' : 'analytics')); }, [route.adminSection, route.orderId]);
  
  // Security authentications
  const isAuthorized = user?.isAdmin === true && user?.mfaRequired !== true;
  const workspace = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isAuthorized && activeTab === 'advisor') {
      workspace.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      workspace.current?.focus({ preventScroll: true });
    }
  }, [activeTab, isAuthorized]);
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [adminUsername, setAdminUsername] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [showAdminLoginPassword, setShowAdminLoginPassword] = useState(false);
  const [showAdminRecoverPassword, setShowAdminRecoverPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Data State synced from server API
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  // Announcements Form & Loading
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [newAnn, setNewAnn] = useState({ text: '', textEn: '', durationMinutes: 1440 });

  // Form states for Product management
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Form states for Promos
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<PromoCode>>({ code: '', discountPercentage: 10, active: true });
  const [promoDurationHours, setPromoDurationHours] = useState('24');

  // Invoice / Order Search State
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);
  const [adminInvoiceFile, setAdminInvoiceFile] = useState<InvoiceFile | null>(null);

  // Security LOG Search States
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSearchDate, setLogSearchDate] = useState('');

  // Password recovery state for admin login screen
  const [isAdminRecoverMode, setIsAdminRecoverMode] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverNewPassword, setRecoverNewPassword] = useState('');
  const [recoverSuccessMsg, setRecoverSuccessMsg] = useState('');
  const [adminSecurityCode, setAdminSecurityCode] = useState('');
  const [adminCodeSentFeedback, setAdminCodeSentFeedback] = useState('');

  // Loading triggers
  const fetchAllGodData = async () => {
    try {
      // Products
      const resP = await fetch('/api/products');
      if (resP.ok) {
        const prodData = await resP.json();
        setProducts(prodData);
        if (fetchProducts) fetchProducts();
      }

      // Orders
      const resO = await fetch('/api/orders');
      if (resO.ok) setOrders(await resO.json());

      // Promos
      const resC = await fetch('/api/promos');
      if (resC.ok) setPromos(await resC.json());

      // Settings
      const resS = await fetch('/api/settings');
      if (resS.ok) {
        const settData = await resS.json();
        
        // Merge with defaults if fields are empty
        const defaultValues = {
          "homepageHeroTitle": "StevenBmj",
          "homepageHeroTitleEn": "StevenBmj",
          "homepageHeroSubtitle": "Mode et accessoires pour hommes, femmes et enfants.",
          "homepageHeroSubtitleEn": "Fashion and accessories for men, women and children.",
          "whatsappContact": "+2290155468138",
          "taxRate": 0,
          "aboutTitle": "À propos de StevenBmj",
          "aboutTitleEn": "About StevenBmj",
          "aboutContent": "Découvrez le catalogue StevenBmj et contactez notre équipe pour préparer votre commande.",
          "aboutContentEn": "Explore the StevenBmj catalogue and contact our team to prepare your order.",
          "contactTitle": "Contacter StevenBmj",
          "contactTitleEn": "Contact StevenBmj",
          "contactAddress": "Cotonou, Bénin",
          "contactAddressEn": "Cotonou, Benin",
          "careTitle": "Service client",
          "careTitleEn": "Customer care",
          "careContent": "Contactez notre équipe pour toute question sur un article ou une commande.",
          "careContentEn": "Contact our team with any questions about an item or order.",
          "footerText": "Mode et accessoires pour hommes, femmes et enfants.",
          "footerTextEn": "Fashion and accessories for men, women and children.",
          "facebookUrl": "https://www.facebook.com/share/1F3vVmSiGw/",
          "whatsappUrl": "https://wa.me/2290155468138"
        };

        const merged = { ...settData };
        for (const key in defaultValues) {
          const k = key as keyof typeof defaultValues;
          if (merged[k] === undefined || merged[k] === null || String(merged[k]).trim() === '') {
            (merged as any)[k] = defaultValues[k];
          }
        }

        setSettings(merged);
        if (fetchSettings) fetchSettings();
      }

      // Logs
      const resL = await fetch('/api/security-logs');
      if (resL.ok) setLogs(await resL.json());

      // Announcements
      const resA = await fetch('/api/announcements');
      if (resA.ok) setAnnouncements(await resA.json());

      // Reviews
      const resR = await fetch('/api/reviews/admin');
      if (resR.ok) setReviewsList(await resR.json());
    } catch (err) {
      console.error("Error loaded admin dashboard data", err);
    }
  };

  useEffect(() => {
    if (isAuthorized) void fetchAllGodData();
  }, [isAuthorized]);


  // Handle order status updates
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintInvoice = (_order: any) => {
    if (!adminInvoiceFile || adminInvoiceFile.orderId !== selectedOrderForInvoice?.id || adminInvoiceFile.language !== language) return;
    const link = document.createElement('a');
    link.href = adminInvoiceFile.url;
    link.download = adminInvoiceFile.filename;
    link.click();
  };

  // Create Product Submit handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (productSaving || imageUploading || !editingProduct?.name || !editingProduct?.price) return;
    
    const payload = {
      ...editingProduct,
      specs: editingProduct.specs || [],
      images: editingProduct.images || [],
    };

    setProductSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        fetchAllGodData();
        fetchProducts();
      } else {
        alert(data.error || data.message || "Impossible d'enregistrer le produit.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Impossible d'enregistrer le produit.");
    } finally { setProductSaving(false); }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Voulez-vous supprimer ce produit d'exception ?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchAllGodData();
        fetchProducts();
      } else {
        alert(data.error || data.message || "Impossible de supprimer le produit.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Impossible de supprimer le produit.");
    }
  };

  // Promo Code Submit
  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code || !newPromo.discountPercentage) return;
    try {
      let expiresAt: string | undefined = undefined;
      if (promoDurationHours !== 'eternal') {
        const ms = Number(promoDurationHours) * 60 * 60 * 1000;
        expiresAt = new Date(Date.now() + ms).toISOString();
      }
      const finalPromo = {
        ...newPromo,
        expiresAt
      };
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPromo)
      });
      if (res.ok) {
        setNewPromo({ code: '', discountPercentage: 10, active: true });
        setPromoDurationHours('24');
        setShowPromoForm(false);
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePromo = async (code: string) => {
    try {
      const res = await fetch(`/api/promos/${code}/toggle`, { method: 'POST' });
      if (res.ok) {
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePromo = async (code: string) => {
    try {
      const res = await fetch(`/api/promos/${code}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete a specific registered customer account
  // Announcements forms actions
  const handleAnnounceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.text) return;
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn)
      });
      if (res.ok) {
        setNewAnn({ text: '', textEn: '', durationMinutes: 1440 });
        setShowAnnForm(false);
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for converting file inputs to Base64 in settings State
  const handleFileUploadHelper = (file: File, key: string) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (settings) {
            setSettings({
              ...settings,
              [key]: reader.result
            });
          }
          resolve();
        } else {
          reject(new Error("Format de fichier non lisible"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Settings save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert("Parametres mis a jour avec succes.");
        fetchAllGodData();
        fetchSettings();
      } else {
        alert(data.error || data.message || "Impossible de sauvegarder la configuration.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Impossible de sauvegarder la configuration.");
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Voulez-vous purifier et vider intégralement l'historique des logs cyber-securité ?")) return;
    try {
      const res = await fetch('/api/security-logs', { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchAllGodData();
      } else {
        alert(data.error || data.message || "Impossible de vider les logs.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Impossible de vider les logs.");
    }
  };


  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminUsername.trim().toLowerCase(), password: adminLoginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Connexion refusee.');
      setUser(data.user);
      setAdminLoginPassword('');
      if (!data.user?.isAdmin) throw new Error(language === 'FR' ? 'Ce compte ne dispose pas des droits administrateur.' : 'This account is not an administrator.');
    } catch (error: any) { setLoginError(error.message || 'Connexion impossible.'); }
    finally { setLoginLoading(false); }
  };

  const sendAdminSecurityCode = async () => {
    setLoginError('');
    setAdminCodeSentFeedback('');
    const targetEmail = recoverEmail.trim().toLowerCase();
    if (!targetEmail) {
      setLoginError(language === 'FR' ? "Veuillez d'abord saisir l'adresse e-mail." : "Please input email first.");
      return;
    }
    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminCodeSentFeedback(language === 'FR' ? "✓ Code sécurité envoyé !" : "✓ Safety code sent!");
      } else {
        setLoginError(data.error || 'Erreur lors de l\'envois');
      }
    } catch {
      setLoginError('Erreur de communication');
    }
  };

  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRecoverSuccessMsg('');

    const targetEmail = recoverEmail.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: adminSecurityCode, newPassword: recoverNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setRecoverSuccessMsg(language === 'FR' ? "Le nouveau mot de passe a été programmé avec succès !" : "New secret passcode was successfully overwrote!");
        setUser(null);
        setRecoverNewPassword('');
        setAdminSecurityCode('');
        setAdminCodeSentFeedback('');
        setTimeout(() => {
          setIsAdminRecoverMode(false);
          setRecoverSuccessMsg('');
        }, 2200);
      } else {
        setLoginError(data.error || "Erreur lors de la mise à jour.");
      }
    } catch (err) {
      setLoginError("Erreur d'accès réseau.");
    }
  };

  if (user?.isAdmin && user.mfaRequired) return <AdminMfa challenge />;
  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-left" id="admin-login-screen">
        <div className="bg-neutral-950 border border-white/10 rounded-lg p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600" />
          
          <div className="flex flex-col items-center space-y-2 text-center">
            <Logo size={60} />
            <span className="text-xs font-mono tracking-[0.3em] text-red-500 uppercase font-bold">{adminText("PORTAIL PRIVÉ SECURISE", language)}</span>
            <h2 className="text-xl font-light text-white uppercase tracking-widest font-sans">{adminText("STEVENBMJ ADMIN (GOD)", language)}</h2>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 font-mono uppercase tracking-wider text-center">
              ⚠ {loginError}
            </div>
          )}

          {isAdminRecoverMode ? (
            <form onSubmit={handleAdminChangePassword} className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-wider">
                  {language === 'FR' ? "MODIFIER LE CODE D'ACCÈS ADMIN" : "OVERWRITE ADMINISTRATIVE PASS"}
                </span>
              </div>

              {recoverSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-400 font-mono uppercase tracking-wider text-center">
                  ✓ {recoverSuccessMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("E-Mail d'Administration *", language)}</label>
                <input
                  type="email"
                  required
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white rounded focus:border-red-500 focus:outline-none placeholder-neutral-700 font-mono"
                  placeholder="stevenamorin202@gmail.com"
                />
              </div>

              <div className="bg-neutral-900/60 p-3 rounded border border-white/5 space-y-2">
                <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">
                  {language === 'FR' ? "Un code secret doit être envoyé à l'adresse ci-dessus :" : "A secure code must be sent to the email address above:"}
                </p>
                <button
                  type="button"
                  onClick={sendAdminSecurityCode}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-red-500/30 text-red-400 hover:text-red-300 font-mono text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  {language === 'FR' ? "RÉCLAMER LE CODE DE SÉCURITÉ" : "REQUEST SECURITY CODE"}
                </button>
                {adminCodeSentFeedback && (
                  <p className="text-[9px] text-emerald-400 font-mono text-center">{adminCodeSentFeedback}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? "Code de Sécurité Reçu *" : "Received Security Code *"}</label>
                <input
                  type="text"
                  required
                  value={adminSecurityCode}
                  onChange={(e) => setAdminSecurityCode(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white rounded focus:border-red-500 focus:outline-none font-mono"
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{language === 'FR' ? "Nouveau Mot de Passe *" : "New Secret Passcode *"}</label>
                <div className="relative">
                  <input
                    type={showAdminRecoverPassword ? 'text' : 'password'}
                    required
                    value={recoverNewPassword}
                    onChange={(e) => setRecoverNewPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 pr-11 py-3 text-white rounded focus:border-red-500 focus:outline-none font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminRecoverPassword(!showAdminRecoverPassword)}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    aria-label={showAdminRecoverPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showAdminRecoverPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-655 bg-red-800 hover:bg-red-700 text-white font-mono text-[10.5px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 transition-all active:scale-[0.98] text-center"
              >
                {language === 'FR' ? "ÉTABLIR LE NOUVEAU MOT DE PASSE" : "OVERWRITE ACCESS CODE"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdminRecoverMode(false);
                  setLoginError('');
                }}
                className="w-full py-2 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white rounded font-mono text-[10px] uppercase cursor-pointer"
              >
                {language === 'FR' ? "Retourner à l'authentification" : "Return to Credentials"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Identifiant / E-Mail *", language)}</label>
                <input
                  id="admin-login-username"
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white rounded focus:border-red-500 focus:outline-none placeholder-neutral-700 font-mono"
                  placeholder="stevenamorin202@gmail.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Code Secret d'Accès *", language)}</label>
                <div className="relative">
                  <input
                    id="admin-login-password"
                    type={showAdminLoginPassword ? 'text' : 'password'}
                    required
                    value={adminLoginPassword}
                    onChange={(e) => setAdminLoginPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 pr-11 py-3 text-white rounded focus:border-red-500 focus:outline-none font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminLoginPassword(!showAdminLoginPassword)}
                    className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                    aria-label={showAdminLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showAdminLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-admin-login-submit"
                disabled={loginLoading || authLoading}
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-[10.5px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 transition-all active:scale-[0.98] text-center"
              >{adminText("ÉTABLIR LA CONNEXION DIRECTE", language)}</button>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-neutral-600 text-[9px] font-mono">{adminText("OU", language)}</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                id="btn-admin-google-auth-trigger"
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-900/60 border border-white/10 text-white font-mono text-[10.5px] uppercase tracking-widest rounded cursor-pointer duration-300 transition-all flex items-center justify-center gap-2 h-11"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.14 3.1-.14 4.58l3.12 2.42c1.83-1.68 3.15-4.17 3.15-8.83z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.12-2.42c-.9.6-2.05.98-4.81.98-3.73 0-6.88-2.51-8.01-5.89l-3.23 2.5C2.86 20.3 7.02 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.99 13.76c-.28-.84-.44-1.74-.44-2.67s.16-1.83.44-2.67l-3.23-2.5C.28 7.6 0 9.77 0 12s.28 4.4 1 6.09l3.23-2.5c.01-.27-.24-.52-.24-.83z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.41-3.41C17.94 1.19 15.23 0 12 0 7.02 0 2.86 3.7 1 7.91l3.23 2.5c1.13-3.37 4.28-5.89 8.01-5.89z"
                  />
                </svg>
                <span>{language === 'FR' ? "Se connecter avec Google" : "Login with Google"}</span>
              </button>

              <div className="pt-2 text-center border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminRecoverMode(true);
                    setRecoverEmail('stevenamorin202@gmail.com');
                    setLoginError('');
                  }}
                  className="text-[10px] text-red-500 hover:text-red-400 font-mono uppercase tracking-wider underline cursor-pointer"
                >
                  {language === 'FR' ? "Mot de passe oublié ?" : "Forgot password?"}
                </button>
              </div>
            </form>
          )}

          <p className="text-[10px] text-center text-neutral-500 font-mono leading-relaxed uppercase">
            {language === 'FR' ? 'Accès réservé aux administrateurs autorisés.' : 'Access restricted to authorized administrators.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-left">
      
      {/* Admin Title Identity header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-8 border-b border-white/5 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-500 mb-1">
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold">STEVENBMJ</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase font-sans">
            {language === 'FR' ? 'Administration' : 'Administration'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {language === 'FR' ? 'Boutique, commandes et activité.' : 'Store, orders and activity.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button id="btn-admin-advisor-shortcut" type="button" onClick={() => navigate({ view: 'god', panel: null, adminSection: 'advisor' })}
            className="min-h-11 inline-flex items-center justify-center gap-2 rounded border border-amber-300/40 bg-amber-300/10 px-4 text-sm font-medium text-amber-200">
            <Bot className="h-5 w-5 shrink-0" />{language === 'FR' ? 'Agent IA' : 'AI agent'}
          </button>
        {/* Admin profile logo */}
        <div className="flex min-w-0 items-center space-x-3 bg-neutral-900/60 p-4 border border-white/5 rounded-lg">
          <Logo size={40} className="stroke-red-500" />
          <div className="text-left font-mono">
            <p className="text-xs text-white font-bold uppercase">{language === 'FR' ? 'Administrateur' : 'Administrator'}</p>
            <p className="text-[9px] text-neutral-500 break-all">{user.email}</p>
          </div>
        </div>
        </div>
      </div>

      {/* Main grids of administration dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-8">
        
        {/* Navigation Admin Controls Menus sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'analytics', label: language === 'FR' ? 'RAPPORTS DE VENTES' : 'SALES REPORTS', icon: <BarChart className="w-4 h-4" /> },
            { id: 'advisor', label: language === 'FR' ? 'AGENT IA' : 'AI AGENT', icon: <Bot className="w-4 h-4" /> },
            { id: 'products', label: language === 'FR' ? 'GESTION PRODUITS' : 'PRODUCTS', icon: <Layers className="w-4 h-4" /> },
            { id: 'orders', label: language === 'FR' ? 'COMMANDES ET LIVRAISONS' : 'ORDERS AND DELIVERIES', icon: <CheckSquare className="w-4 h-4" /> },
            { id: 'drivers', label: language === 'FR' ? 'LIVREURS' : 'DRIVERS', icon: <Users className="w-4 h-4" /> },
            { id: 'ledger', label: language === 'FR' ? 'COMPTABILITÉ' : 'ACCOUNTING', icon: <BarChart className="w-4 h-4" /> },
            { id: 'promos', label: language === 'FR' ? 'CODES PROMOTIONS' : 'PROMOTIONS', icon: <Percent className="w-4 h-4" /> },
            { id: 'announcements', label: language === 'FR' ? 'ANNONCES GÉNÉRALES' : 'ANNOUNCEMENTS', icon: <Megaphone className="w-4 h-4 text-red-400" /> },
            { id: 'users', label: language === 'FR' ? 'CLIENTÈLE VIP' : 'VIP CUSTOMERS', icon: <Users className="w-4 h-4 text-amber-400" /> },
            { id: 'reviews', label: language === 'FR' ? 'AVIS CLIENTÈLE' : 'CUSTOMER REVIEWS', icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> },
            { id: 'settings', label: language === 'FR' ? 'CONFIGURATION SITE' : 'SITE SETTINGS', icon: <Settings className="w-4 h-4" /> },
            { id: 'assistants', label: language === 'FR' ? 'ASSISTANTS & API' : 'ASSISTANTS & API', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'security', label: language === 'FR' ? 'SÉCURITÉ' : 'SECURITY', icon: <ShieldAlert className="w-4 h-4" /> },
          ].map((item) => (
            <button
              id={`btn-admin-tab-${item.id}`}
              key={item.id}
              onClick={() => {
                navigate({ view: 'god', panel: null, adminSection: item.id as AdminSection });
                if (sectionNotifications[item.id]) void markSectionRead(item.id).catch(() => alert(language === 'FR' ? 'Lecture des notifications non enregistrée.' : 'Notifications could not be marked as read.'));
              }}
              className={`w-full py-3 px-4 rounded text-xs text-left uppercase tracking-wider duration-350 cursor-pointer flex items-center ${
                activeTab === item.id 
                  ? 'bg-red-500/10 border border-red-500/30 text-red-00' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900/40 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {sectionNotifications[item.id] > 0 && (
                <span className="bg-red-600 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  {sectionNotifications[item.id]}
                </span>
              )}
            </button>
          ))}

          <button
            id="btn-admin-explicit-logout"
            onClick={() => {
              void logout().catch(error => alert(error.message));
            }}
            className="w-full mt-6 py-3 px-4 rounded text-xs text-left uppercase tracking-wider duration-350 cursor-pointer flex items-center text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-dashed border-red-500/20"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-4 h-4" />
              <span className="font-bold">{language === 'FR' ? "SE DÉCONNECTER DU CORE" : "LOG OUT CORE"}</span>
            </div>
          </button>
        </div>

        {/* Main tabs workspaces */}
        <div ref={workspace} tabIndex={-1} className={`lg:col-span-4 min-w-0 scroll-mt-28 outline-none ${activeTab === 'advisor' ? '' : 'bg-neutral-950/40 border border-white/5 rounded-lg p-6 backdrop-blur-md'}`}>
          
          {/* TAB 1: ANALYTICS PREMIUM */}
          {activeTab === 'assistants' && <AssistantSettings />}
          {activeTab === 'advisor' && <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-medium text-white">{language === 'FR' ? 'Agent IA' : 'AI agent'}</h2>
              <button type="button" onClick={() => navigate({ view: 'god', panel: null, adminSection: 'assistants', assistantScope: 'admin' })}
                className="min-h-11 inline-flex items-center gap-2 rounded border border-white/15 px-3 py-2 text-sm text-neutral-300 hover:text-white">
                <Settings className="h-4 w-4 shrink-0" />{language === 'FR' ? 'Configurer les clés de cet agent' : 'Configure this agent’s keys'}
              </button>
            </div>
            <AssistantPanel scope="admin" />
          </div>}
          {activeTab === 'analytics' && <SalesReports />}
          {activeTab === 'drivers' && <DriverManagement />}
          {activeTab === 'ledger' && <LedgerReports />}

          {/* TAB 2: PRODUCTS MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{adminText("CATALOGUE DE PIÈCES HAUT DE GAMME (", language)}{products.length})
                </h3>
                <button
                  id="btn-admin-add-product-trigger"
                  onClick={() => {
                    setEditingProduct({
                      id: `prod-${Date.now()}`,
                      name: '',
                      nameEn: '',
                      category: 'watches',
                      price: 1500,
                      stock: 5,
                      rating: 0,
                      description: '',
                      descriptionEn: '',
                      images: []
                    });
                    setShowProductForm(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded text-xs uppercase font-mono tracking-widest hover:bg-red-500 duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{adminText("AJOUTER UNE CRÉATION", language)}</span>
                </button>
              </div>

              {/* Product insert/edit drawer modal overlay on sheet */}
              {showProductForm && editingProduct && (
                <form onSubmit={handleProductSubmit} className="bg-neutral-900 border border-white/10 p-6 rounded-lg space-y-4 text-left">
                  <h4 className="text-xs font-mono tracking-widest text-red-400 uppercase font-bold border-b border-white/5 pb-2">
                    {language === 'FR' ? (editingProduct.name ? 'Modifier le produit' : 'Ajouter un produit') : (editingProduct.name ? 'Edit product' : 'Add product')}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Nom Français *", language)}</label>
                      <input
                        id="form-p-name-fr"
                        type="text"
                        required
                        value={editingProduct.name || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700"
                        placeholder="La Royale Chronographe Or"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Nom Anglais *", language)}</label>
                      <input
                        id="form-p-name-en"
                        type="text"
                        required
                        value={editingProduct.nameEn || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700"
                        placeholder="The Royale Chronograph Gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Catégorie *", language)}</label>
                      <select
                        id="form-p-category"
                        value={editingProduct.category || 'watches'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-2 py-2 text-neutral-400 font-mono"
                      >
                        <option value="watches">{adminText("watches (Montres de prestige)", language)}</option>
                        <option value="chains">{adminText("chains (Maillons cubains / Orfèvrerie)", language)}</option>
                        <option value="suits">{adminText("suits (Costumes de créateurs)", language)}</option>
                        <option value="women">{adminText("women (Maison Femme Act I)", language)}</option>
                        <option value="perfumes">{adminText("perfumes (Parfums d'élites)", language)}</option>
                        <option value="shoes">{adminText("shoes (Souliers & Mocassins crêpe)", language)}</option>
                        <option value="accessories">{adminText("accessories (Bagues / Accessoires élégants)", language)}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Tarif de base (€) *", language)}</label>
                      <input
                        id="form-p-price"
                        type="number"
                        required
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Stock Garanti *", language)}</label>
                      <input
                        id="form-p-stock"
                        type="number"
                        required
                        value={editingProduct.stock === undefined ? 5 : editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Tarif Promo (€) (Optionnel)", language)}</label>
                      <input
                        id="form-p-promoprice"
                        type="number"
                        value={editingProduct.promoPrice || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, promoPrice: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Badge d'Édition (Ex: Édition Limitée)", language)}</label>
                      <input
                        id="form-p-badge"
                        type="text"
                        value={editingProduct.badge || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-750"
                        placeholder={adminText("Chef d'Œuvre", language)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Images du Produit (Liens URL séparés par des virgules) *", language)}</label>
                    <textarea
                      id="form-p-images"
                      required
                      rows={2}
                      value={editingProduct.images?.join(', ') || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700 font-mono text-[11px]"
                      placeholder="https://images.unsplash.com/photo-1..., https://images.unsplash.com/photo-2..."
                    />
                    
                    {/* Native File Upload Option */}
                    <div className="mt-2.5">
                      <label className="cursor-pointer border border-dashed border-white/20 hover:border-amber-500/30 bg-black/50 hover:bg-black/90 px-4 py-3 rounded text-center block transition-all duration-300">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          className="hidden"
                          disabled={imageUploading || productSaving}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (!files.length || imageUploading) return;
                            if (files.length + (editingProduct.images?.length || 0) > 8 || files.some(file => file.size > 3_000_000 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
                              alert(language === 'FR' ? 'Maximum : 8 images PNG, JPEG ou WebP, de 3 Mo chacune.' : 'Maximum: 8 PNG, JPEG or WebP images, 3 MB each.'); return;
                            }
                            setImageUploading(true);
                            try {
                              for (const file of files) {
                                const image = await new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error()); reader.readAsDataURL(file);
                                });
                                const response = await fetch('/api/product-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
                                const data = await response.json();
                                if (!response.ok || typeof data.url !== 'string') throw new Error();
                                setEditingProduct(previous => previous ? { ...previous, images: [...(previous.images || []), data.url] } : previous);
                              }
                            } catch { alert(language === 'FR' ? 'Une image n’a pas été transférée. Réessayez avant d’enregistrer le produit.' : 'An image could not be uploaded. Retry before saving the product.'); }
                            finally { setImageUploading(false); }
                          }}
                        />
                        <span className="text-[10px] font-mono text-amber-500 uppercase font-bold">{imageUploading ? (language === 'FR' ? 'Transfert en cours…' : 'Uploading…') : (language === 'FR' ? 'Importer des images' : 'Upload images')}</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description textuelle Française *", language)}</label>
                    <textarea
                      id="form-p-desc-fr"
                      required
                      rows={2}
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description textuelle Anglaise *", language)}</label>
                    <textarea
                      id="form-p-desc-en"
                      required
                      rows={2}
                      value={editingProduct.descriptionEn || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, descriptionEn: e.target.value })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700"
                    />
                  </div>

                  <div className="flex h-12 justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductForm(false);
                        setEditingProduct(null);
                      }}
                      className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-neutral-400 font-mono text-xs rounded"
                    >{adminText("ANNULER", language)}</button>
                    <button
                      type="submit"
                      disabled={productSaving || imageUploading}
                      className="px-6 py-2 bg-red-600 text-white font-mono text-xs font-bold rounded"
                    >{adminText("SANS FAUTE ET ENREGISTRER", language)}</button>
                  </div>
                </form>
              )}

              {/* Product lists table */}
              <div className="overflow-x-auto border border-white/5 rounded-lg bg-neutral-950 flex flex-col">
                <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-neutral-900/40 text-neutral-400 uppercase font-mono text-[9px]">
                      <th className="p-4">{adminText("IMAGINATION", language)}</th>
                      <th className="p-4">{adminText("PIÈCE DESIGNATION", language)}</th>
                      <th className="p-4">{adminText("CATÉGORIE", language)}</th>
                      <th className="p-4">{adminText("TARIF NET", language)}</th>
                      <th className="p-4 text-center">{adminText("STOCK", language)}</th>
                      <th className="p-4 text-center">{adminText("CONTROLES", language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <img 
                            src={p.images[0]} 
                            alt={p.name} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded" 
                          />
                        </td>
                        <td className="p-4 text-white">
                          <p className="font-semibold text-xs">{p.name}</p>
                          <p className="text-[8px] text-neutral-500">SEO ID: {p.id}</p>
                        </td>
                        <td className="p-4 text-neutral-300">{p.category}</td>
                        <td className="p-4 font-semibold text-amber-500">
                          {p.promoPrice ? (
                            <>
                              <span className="line-through text-neutral-600 text-[10px] block font-light">{formatPrice(p.price)}</span>
                              <span>{formatPrice(p.promoPrice)}</span>
                            </>
                          ) : (
                            formatPrice(p.price)
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.stock === 0 ? 'bg-red-500/10 text-red-400' : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            {p.stock}{adminText("Units", language)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex h-8 justify-center items-center space-x-2">
                            <button
                              id={`btn-admin-edit-${p.id}`}
                              onClick={() => {
                                setEditingProduct(p);
                                setShowProductForm(true);
                              }}
                              className="p-1.5 hover:text-amber-400 hover:bg-white/5 rounded cursor-pointer duration-300"
                              title={adminText("Modifier", language)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-admin-del-${p.id}`}
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 hover:text-red-400 hover:bg-white/5 rounded cursor-pointer duration-300"
                              title={adminText("Supprimer", language)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {activeTab === 'orders' && <OrderWorkspace role="admin" />}

          {/* TAB 4: PROMOTIONS */}
          {activeTab === 'promos' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{adminText("GÉNÉRATEUR DE RÉDUCTIONS ET SOUVERAINTÉ TARIFS (", language)}{promos.length})
                </h3>
                <button
                  id="btn-admin-add-promo"
                  onClick={() => setShowPromoForm(!showPromoForm)}
                  className="px-4 py-2 bg-neutral-900 border border-white/10 hover:border-amber-400 text-amber-400 rounded text-xs uppercase font-mono tracking-widest hover:bg-neutral-950 duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{adminText("CRÉER UN COUPON", language)}</span>
                </button>
              </div>

              {/* Promo input form */}
              {showPromoForm && (
                <form onSubmit={handlePromoSubmit} className="bg-neutral-900 p-5 rounded-lg border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-end text-left">
                  <div className="space-y-1 w-full max-w-[12rem]">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Code Unique *", language)}</label>
                    <input
                      id="form-promo-code"
                      type="text"
                      required
                      value={newPromo.code || ''}
                      onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-700"
                      placeholder="E.g. VIPCOUTURE"
                    />
                  </div>

                  <div className="space-y-1 w-full max-w-[8rem]">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Réduction (%) *", language)}</label>
                    <input
                      id="form-promo-percent"
                      type="number"
                      required
                      min="5"
                      max="90"
                      value={newPromo.discountPercentage || 10}
                      onChange={(e) => setNewPromo({ ...newPromo, discountPercentage: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white"
                    />
                  </div>

                  <div className="space-y-1 w-full max-w-[14rem]">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Durée de Validité *", language)}</label>
                    <select
                      value={promoDurationHours}
                      onChange={(e) => setPromoDurationHours(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-neutral-400 font-mono focus:outline-none"
                    >
                      <option value="0.083">{adminText("5 Minutes (Alerte test rapide)", language)}</option>
                      <option value="1">{adminText("1 Heure (Flash Exceptionnel)", language)}</option>
                      <option value="6">{adminText("6 Heures", language)}</option>
                      <option value="24">{adminText("24 Heures (1 Jour officiel)", language)}</option>
                      <option value="72">{adminText("3 Jours (Week-End)", language)}</option>
                      <option value="168">{adminText("7 Jours (Exceptionnel)", language)}</option>
                      <option value="720">{adminText("30 Jours (1 Mois)", language)}</option>
                      <option value="eternal">{adminText("Pas de limite (Éternel)", language)}</option>
                    </select>
                  </div>

                  <button
                    id="btn-submit-promo"
                    type="submit"
                    className="px-5 py-2 bg-amber-400 text-black font-mono font-bold text-xs content-center cursor-pointer h-9 rounded"
                  >{adminText("AJOUTER CODE", language)}</button>
                </form>
              )}

              {/* Promo list table */}
              <div className="overflow-x-auto border border-white/5 rounded-lg bg-neutral-950 flex flex-col">
                <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-neutral-900/40 text-neutral-400 uppercase font-mono text-[9px]">
                      <th className="p-4">{adminText("CODE PROMO", language)}</th>
                      <th className="p-4">{adminText("VALEUR DE COUPURE", language)}</th>
                      <th className="p-4">{adminText("ECHEANCE / DELAI", language)}</th>
                      <th className="p-4 text-center">{adminText("STATUT & ACTION INTERACTION", language)}</th>
                      <th className="p-4 text-center">{adminText("RETRANCHEMENTS", language)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {promos.map((pr) => {
                      const isExpired = pr.expiresAt ? (new Date(pr.expiresAt).getTime() < Date.now()) : false;
                      const activeAndNotExpired = pr.active && !isExpired;

                      return (
                        <tr key={pr.code} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-bold">{pr.code}</td>
                          <td className="p-4 font-semibold text-amber-500">-{pr.discountPercentage}{adminText("% de réduction directe", language)}</td>
                          <td className="p-4 text-[10px] text-neutral-500">
                            {pr.expiresAt ? (
                              isExpired ? (
                                <span className="text-red-400">{adminText("EXPIRÉ LE", language)}{new Date(pr.expiresAt).toLocaleString('fr-FR')}</span>
                              ) : (
                                <span className="text-cyan-400 font-bold">{adminText("EXPIRE LE", language)}{new Date(pr.expiresAt).toLocaleString('fr-FR')}</span>
                              )
                            ) : (
                              <span className="text-neutral-500 italic">{adminText("ÉTERNEL", language)}</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {activeAndNotExpired ? (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded font-bold uppercase">{adminText("ACTIF", language)}</span>
                              ) : (
                                <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded font-bold uppercase">
                                  {isExpired ? adminText("DESACTIVÉ (EXPIRÉ)", language) : adminText("INACTIF", language)}
                                </span>
                              )}
                              <button
                                onClick={() => handleTogglePromo(pr.code)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/55 rounded text-[10px] text-amber-400 duration-200 cursor-pointer uppercase"
                              >
                                {activeAndNotExpired ? adminText("Désactiver", language) : adminText("Réactiver", language)}
                              </button>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              id={`btn-admin-del-promo-${pr.code}`}
                              onClick={() => handleDeletePromo(pr.code)}
                              className="p-1.5 hover:text-red-400 hover:bg-white/5 rounded cursor-pointer duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {activeTab === 'users' && <CustomerManagement />}

          {/* TAB 8: ANNONCES GESTION */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in text-left font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{adminText("GESTION DES ANNONCES CYBER BOUTIQUE", language)}</h3>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase">{adminText("Faites des alertes flashs qui disparaissent après le délai de votre choix", language)}</p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAnnForm(!showAnnForm)}
                  className="px-4 py-2 bg-red-650 font-bold hover:bg-neutral-800 border border-white/10 text-white rounded text-xs uppercase duration-250 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAnnForm ? adminText("Fermer l'Atelier", language) : adminText("RÉACTIVER UNE NOUVELLE ANNONCE", language)}</span>
                </button>
              </div>

              {showAnnForm && (
                <form onSubmit={handleAnnounceSubmit} className="bg-neutral-900 border border-white/10 p-5 rounded-lg space-y-4">
                  <h4 className="text-xs tracking-widest text-red-00 font-bold uppercase border-b border-white/5 pb-2">{adminText("LANCER UN BULLETIN SOUVERAIN (DÉLAI LIMITE EXPRÈS)", language)}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-500 uppercase block">{adminText("Message (Français) *", language)}</label>
                      <input
                        type="text"
                        required
                        value={newAnn.text}
                        onChange={(e) => setNewAnn({ ...newAnn, text: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white font-sans"
                        placeholder="Ex: ✨ LIVRAISON PRESTIGE OFFERTE CE WEEK-END !"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-500 uppercase block">{adminText("Message (Anglais) *", language)}</label>
                      <input
                        type="text"
                        required
                        value={newAnn.textEn}
                        onChange={(e) => setNewAnn({ ...newAnn, textEn: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white font-sans"
                        placeholder="Ex: ✨ COMPLIMENTARY ROYAL SHIPPING THIS WEEKEND !"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 uppercase block">{adminText("Délai avant Disparition automatique *", language)}</label>
                    <select
                      value={newAnn.durationMinutes}
                      onChange={(e) => setNewAnn({ ...newAnn, durationMinutes: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-neutral-400 font-mono"
                    >
                      <option value="5">{adminText("5 Minutes (Alerte test ultra-rapide)", language)}</option>
                      <option value="10">{adminText("10 Minutes", language)}</option>
                      <option value="30">{adminText("30 Minutes", language)}</option>
                      <option value="60">{adminText("1 Heure (Flash Sale Express)", language)}</option>
                      <option value="360">{adminText("6 Heures", language)}</option>
                      <option value="720">{adminText("12 Heures", language)}</option>
                      <option value="1440">{adminText("24 Heures (1 Jour officiel)", language)}</option>
                      <option value="4320">{adminText("3 Jours (Idéal Week-End)", language)}</option>
                      <option value="10080">{adminText("7 Jours (Exceptionnel)", language)}</option>
                      <option value="52560000">{adminText("Éternel (Ne disparaît jamais)", language)}</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded cursor-pointer duration-300 font-mono"
                    >{adminText("🚀 DIFFUSER IMMÉDIATEMENT SUR LA BOUTIQUE", language)}</button>
                  </div>
                </form>
              )}

              {/* LIST OF ACTIVE ANNOUNCEMENTS */}
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">{adminText("BULLETINS EN COURS DE DIFFUSION", language)}</h4>
                </div>

                {announcements.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 text-neutral-600 text-xs uppercase">{adminText("Aucune alerte temporaire n'est diffusée sur le site actuellement.", language)}</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {announcements.map((ann, idx) => {
                      const createdAt = new Date(ann.createdAt);
                      const expiresAt = new Date(ann.expiresAt);
                      const isExpired = expiresAt.getTime() < Date.now();
                      const timeLeftStr = isExpired 
                        ? 'EXPIRED / RETRACTÉE' 
                        : (expiresAt.getTime() > Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) 
                          ? 'SANS DISPARITION (ÉTERNEL)' 
                          : `Expire le : ${expiresAt.toLocaleString('fr-FR')}`;

                      return (
                        <div key={ann.id || idx} className="bg-neutral-950 p-4 rounded-lg border border-white/5 flex items-center justify-between text-xs hover:border-white/15 transition-colors gap-4">
                          <div className="space-y-1 flex-1 text-left">
                            <p className="text-white font-bold font-sans text-xs">FR : {ann.text}</p>
                            <p className="text-neutral-400 font-sans italic text-[11px]">EN : {ann.textEn}</p>
                            
                            <div className="flex items-center space-x-2 pt-2 text-[10px]">
                              <span className={`h-1.5 w-1.5 rounded-full ${isExpired ? 'bg-neutral-600' : 'bg-red-500 animate-ping'}`} />
                              <span className="text-neutral-550 uppercase">{adminText("Lancée le:", language)}{createdAt.toLocaleString('fr-FR')}</span>
                              <span className="text-neutral-500">•</span>
                              <span className={isExpired ? "text-neutral-600 uppercase font-bold" : "text-amber-500 uppercase font-bold"}>
                                {timeLeftStr}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-2 bg-neutral-900 border border-white/10 text-red-00 hover:bg-neutral-800 rounded cursor-pointer duration-200 shrink-0"
                            title={adminText("Retirer Bulletin", language)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: GLOBAL SETTINGS */}
          {activeTab === 'settings' && settings && (
            <form onSubmit={handleSaveSettings} className="space-y-6 text-left">
              
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">{adminText("GESTION DE CONTENU HOMEPAGE & BOUTIQUE", language)}</h3>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">{adminText("Écrits, bannière défilante, contact d'ateliers", language)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Annonce Défilante (Français) *", language)}</label>
                  <input
                    id="sett-ann-fr"
                    type="text"
                    required
                    value={settings.announcementText}
                    onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Annonce Défilante (Anglais) *", language)}</label>
                  <input
                    id="sett-ann-en"
                    type="text"
                    required
                    value={settings.announcementTextEn}
                    onChange={(e) => setSettings({ ...settings, announcementTextEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Héro Landing Page (Français) *", language)}</label>
                  <input
                    id="sett-hero-fr"
                    type="text"
                    required
                    value={settings.homepageHeroTitle}
                    onChange={(e) => setSettings({ ...settings, homepageHeroTitle: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Héro Landing Page (Anglais) *", language)}</label>
                  <input
                    id="sett-hero-en"
                    type="text"
                    required
                    value={settings.homepageHeroTitleEn}
                    onChange={(e) => setSettings({ ...settings, homepageHeroTitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description Héro Landing (Français) *", language)}</label>
                  <textarea
                    id="sett-desc-fr"
                    required
                    rows={2}
                    value={settings.homepageHeroSubtitle}
                    onChange={(e) => setSettings({ ...settings, homepageHeroSubtitle: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description Héro Landing (Anglais) *", language)}</label>
                  <textarea
                    id="sett-desc-en"
                    required
                    rows={2}
                    value={settings.homepageHeroSubtitleEn || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroSubtitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Contact WhatsApp Direct Concierge *", language)}</label>
                  <input
                    id="sett-wa-phone"
                    type="text"
                    required
                    value={settings.whatsappContact}
                    onChange={(e) => setSettings({ ...settings, whatsappContact: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Indexation robots.txt / sitemap.xml SEO *", language)}</label>
                  <select
                    id="sett-seo-indexable"
                    value={settings.seoIndexable === false ? 'false' : 'true'}
                    onChange={event => setSettings({ ...settings, seoIndexable: event.target.value === 'true' })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 h-11 text-emerald-400 select-none cursor-pointer"
                  >
                    <option value="true">{adminText("INDEXATION FORCEE (SEO HIGH AGGRESSIVE)", language)}</option>
                    <option value="false">{adminText("DEVELOPMENT STAGE - NOINDEX", language)}</option>
                  </select>
                </div>
              </div>

              {/* SECTION: IMAGES DU CARROUSEL HERO */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">{adminText("IMAGES DE DIAPORAMA DE LA BAVOLETTE HERO DE LA PAGE ACCUEIL", language)}</h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">{adminText("Personnalisez souverainement les images coulissantes de l'accueil de luxe (par URL ou par Upload).", language)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">{adminText("Image de Fond 1 *", language)}</label>
                  <input
                    id="sett-hero-img-1"
                    type="text"
                    required
                    value={settings.homepageHeroImage1 || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroImage1: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("URL ou code Base64 de l'image de fond...", language)}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-hero-1"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await handleFileUploadHelper(file, 'homepageHeroImage1');
                          } catch (err: any) {
                            alert(err.message || "Erreur de chargement");
                          }
                        }
                      }}
                    />
                    <label htmlFor="upload-hero-1" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">{adminText("⬆ Charger Fichier 1", language)}</label>
                    {settings.homepageHeroImage1 && <span className="text-[9px] text-emerald-400 font-mono">{adminText("✓ Chargé", language)}</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">{adminText("Image de Fond 2 *", language)}</label>
                  <input
                    id="sett-hero-img-2"
                    type="text"
                    required
                    value={settings.homepageHeroImage2 || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroImage2: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("URL ou code Base64 de l'image de fond 2...", language)}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-hero-2"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await handleFileUploadHelper(file, 'homepageHeroImage2');
                          } catch (err: any) {
                            alert(err.message || "Erreur de chargement");
                          }
                        }
                      }}
                    />
                    <label htmlFor="upload-hero-2" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">{adminText("⬆ Charger Fichier 2", language)}</label>
                    {settings.homepageHeroImage2 && <span className="text-[9px] text-emerald-400 font-mono">{adminText("✓ Chargé", language)}</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">{adminText("Image de Fond 3 *", language)}</label>
                  <input
                    id="sett-hero-img-3"
                    type="text"
                    required
                    value={settings.homepageHeroImage3 || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroImage3: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("URL ou code Base64 de l'image de fond 3...", language)}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-hero-3"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await handleFileUploadHelper(file, 'homepageHeroImage3');
                          } catch (err: any) {
                            alert(err.message || "Erreur de chargement");
                          }
                        }
                      }}
                    />
                    <label htmlFor="upload-hero-3" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">{adminText("⬆ Charger Fichier 3", language)}</label>
                    {settings.homepageHeroImage3 && <span className="text-[9px] text-emerald-400 font-mono">{adminText("✓ Chargé", language)}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: HOMEPAGE SECTION 2 (PHILOSOPHIE / STORY) */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">{adminText("SECTION 2 DE L'ACCUEIL : PHILOSOPHIE & HISTOIRE DU SAVOIR-FAIRE", language)}</h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">{adminText("Éditez les textes et l'image d'illustration de la philosophie de création.", language)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Philosophie (FR) *", language)}</label>
                  <input
                    type="text"
                    required
                    value={settings.storyTitleFr || ''}
                    onChange={(e) => setSettings({ ...settings, storyTitleFr: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("Titre en Français...", language)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Philosophie (EN) *", language)}</label>
                  <input
                    type="text"
                    required
                    value={settings.storyTitleEn || ''}
                    onChange={(e) => setSettings({ ...settings, storyTitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("Titre en Anglais...", language)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description (FR) *", language)}</label>
                  <textarea
                    required
                    rows={3}
                    value={settings.storyDescFr || ''}
                    onChange={(e) => setSettings({ ...settings, storyDescFr: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("Description en Français...", language)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description (EN) *", language)}</label>
                  <textarea
                    required
                    rows={3}
                    value={settings.storyDescEn || ''}
                    onChange={(e) => setSettings({ ...settings, storyDescEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("Description en Anglais...", language)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold font-mono">{adminText("Image de la Philosophie *", language)}</label>
                  <input
                    type="text"
                    required
                    value={settings.storyImage || ''}
                    onChange={(e) => setSettings({ ...settings, storyImage: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder={adminText("URL ou base64 de l'image de la philosophie...", language)}
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-philosophy-img"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await handleFileUploadHelper(file, 'storyImage');
                          } catch (err: any) {
                            alert(err.message || "Erreur de chargement");
                          }
                        }
                      }}
                    />
                    <label htmlFor="upload-philosophy-img" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">{adminText("⬆ Charger Fichier Image Philosophie", language)}</label>
                    {settings.storyImage && <span className="text-[9px] text-emerald-400 font-mono">{adminText("✓ Image chargée", language)}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: HOMEPAGE SECTION 3 (PRESTIGE FABRICS) */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">{adminText("SECTION 3 : ÉTOFFES NOBLES ET TISSUS D'EXCEPTION", language)}</h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">{adminText("Éditez les 3 cartes de présentation de tissus (titres, descriptions et images).", language)}</p>
              </div>
              <div className="space-y-6">
                {/* Fabric 1 */}
                <div className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                  <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">{adminText("Étoffe n°1 (\"Good Luck\")", language)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={adminText("Titre FR", language)}
                      value={settings.fabric1TitleFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1TitleFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder={adminText("Titre EN", language)}
                      value={settings.fabric1TitleEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1TitleEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <textarea
                      placeholder={adminText("Description FR", language)}
                      rows={2}
                      value={settings.fabric1DescFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1DescFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <textarea
                      placeholder={adminText("Description EN", language)}
                      rows={2}
                      value={settings.fabric1DescEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1DescEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <input
                        type="text"
                        placeholder={adminText("URL de l'image de l'étoffe 1", language)}
                        value={settings.fabric1Image || ''}
                        onChange={(e) => setSettings({ ...settings, fabric1Image: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-fabric-1"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleFileUploadHelper(file, 'fabric1Image');
                        }}
                      />
                      <label htmlFor="upload-fabric-1" className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">{adminText("⬆ Charger Image Étoffe 1", language)}</label>
                    </div>
                  </div>
                </div>

                {/* Fabric 2 */}
                <div className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                  <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">{adminText("Étoffe n°2 (\"Super Wax\")", language)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={adminText("Titre FR", language)}
                      value={settings.fabric2TitleFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2TitleFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder={adminText("Titre EN", language)}
                      value={settings.fabric2TitleEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2TitleEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <textarea
                      placeholder={adminText("Description FR", language)}
                      rows={2}
                      value={settings.fabric2DescFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2DescFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <textarea
                      placeholder={adminText("Description EN", language)}
                      rows={2}
                      value={settings.fabric2DescEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2DescEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <input
                        type="text"
                        placeholder={adminText("URL de l'image de l'étoffe 2", language)}
                        value={settings.fabric2Image || ''}
                        onChange={(e) => setSettings({ ...settings, fabric2Image: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-fabric-2"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleFileUploadHelper(file, 'fabric2Image');
                        }}
                      />
                      <label htmlFor="upload-fabric-2" className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">{adminText("⬆ Charger Image Étoffe 2", language)}</label>
                    </div>
                  </div>
                </div>

                {/* Fabric 3 */}
                <div className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                  <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">{adminText("Étoffe n°3 (\"Brocart Royal\")", language)}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={adminText("Titre FR", language)}
                      value={settings.fabric3TitleFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3TitleFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder={adminText("Titre EN", language)}
                      value={settings.fabric3TitleEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3TitleEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <textarea
                      placeholder={adminText("Description FR", language)}
                      rows={2}
                      value={settings.fabric3DescFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3DescFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <textarea
                      placeholder={adminText("Description EN", language)}
                      rows={2}
                      value={settings.fabric3DescEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3DescEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <input
                        type="text"
                        placeholder={adminText("URL de l'image de l'étoffe 3", language)}
                        value={settings.fabric3Image || ''}
                        onChange={(e) => setSettings({ ...settings, fabric3Image: e.target.value })}
                        className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-fabric-3"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) await handleFileUploadHelper(file, 'fabric3Image');
                        }}
                      />
                      <label htmlFor="upload-fabric-3" className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">{adminText("⬆ Charger Image Étoffe 3", language)}</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: HOMEPAGE SECTION 4 (BENTO SALONS DE PRESTIGE) */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">{adminText("SECTION 4 : LES 4 SALONS DE PRESTIGE (GRILLE BENTO)", language)}</h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">{adminText("Éditez les 4 zones interactives de la grille Bento (Horlogerie, Maillons d'Or, Mocassins, Costumes).", language)}</p>
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((num) => {
                  const titleFrKey = `bento${num}TitleFr` as keyof AppSettings;
                  const titleEnKey = `bento${num}TitleEn` as keyof AppSettings;
                  const descFrKey = `bento${num}DescFr` as keyof AppSettings;
                  const descEnKey = `bento${num}DescEn` as keyof AppSettings;
                  const imgKey = `bento${num}Image` as keyof AppSettings;

                  return (
                    <div key={num} className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                      <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">{adminText("Salon Bento n°", language)}{num}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder={adminText("Titre FR", language)}
                          value={(settings[titleFrKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [titleFrKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder={adminText("Titre EN", language)}
                          value={(settings[titleEnKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [titleEnKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                        />
                        <textarea
                          placeholder={adminText("Description FR", language)}
                          rows={2}
                          value={(settings[descFrKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [descFrKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                        />
                        <textarea
                          placeholder={adminText("Description EN", language)}
                          rows={2}
                          value={(settings[descEnKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [descEnKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                        />
                        <div className="md:col-span-2 space-y-2">
                          <input
                            type="text"
                            placeholder={`URL de l'image Bento ${num}`}
                            value={(settings[imgKey] as string) || ''}
                            onChange={(e) => setSettings({ ...settings, [imgKey]: e.target.value })}
                            className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            id={`upload-bento-${num}`}
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) await handleFileUploadHelper(file, imgKey);
                            }}
                          />
                          <label htmlFor={`upload-bento-${num}`} className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">{adminText("⬆ Charger Image Bento", language)}{num}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION: PAGE À PROPOS */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest">{adminText("CONTENU DE LA PAGE À PROPOS", language)}</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre À Propos (Français) *", language)}</label>
                  <input
                    id="sett-about-title-fr"
                    type="text"
                    required
                    value={settings.aboutTitle || ''}
                    onChange={(e) => setSettings({ ...settings, aboutTitle: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre À Propos (Anglais) *", language)}</label>
                  <input
                    id="sett-about-title-en"
                    type="text"
                    required
                    value={settings.aboutTitleEn || ''}
                    onChange={(e) => setSettings({ ...settings, aboutTitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Texte Manifeste À Propos (Français) *", language)}</label>
                  <textarea
                    id="sett-about-content-fr"
                    required
                    rows={4}
                    value={settings.aboutContent || ''}
                    onChange={(e) => setSettings({ ...settings, aboutContent: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Texte Manifeste À Propos (Anglais) *", language)}</label>
                  <textarea
                    id="sett-about-content-en"
                    required
                    rows={4}
                    value={settings.aboutContentEn || ''}
                    onChange={(e) => setSettings({ ...settings, aboutContentEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>

              {/* SECTION: PAGE CONTACT */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest">{adminText("CONTENU DE LA PAGE CONTACT", language)}</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Contact (Français) *", language)}</label>
                  <input
                    id="sett-contact-title-fr"
                    type="text"
                    required
                    value={settings.contactTitle || ''}
                    onChange={(e) => setSettings({ ...settings, contactTitle: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Contact (Anglais) *", language)}</label>
                  <input
                    id="sett-contact-title-en"
                    type="text"
                    required
                    value={settings.contactTitleEn || ''}
                    onChange={(e) => setSettings({ ...settings, contactTitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Adresse Physique (Français) *", language)}</label>
                  <input
                    id="sett-contact-addr-fr"
                    type="text"
                    required
                    value={settings.contactAddress || ''}
                    onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Adresse Physique (Anglais) *", language)}</label>
                  <input
                    id="sett-contact-addr-en"
                    type="text"
                    required
                    value={settings.contactAddressEn || ''}
                    onChange={(e) => setSettings({ ...settings, contactAddressEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Lien URL d'Intégration Google Map (Iframe Src) *", language)}</label>
                <input
                  id="sett-map-url"
                  type="text"
                  required
                  value={settings.googleMapEmbedUrl || ''}
                  onChange={(e) => setSettings({ ...settings, googleMapEmbedUrl: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-mono"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
              </div>

              {/* SECTION: PAGE ATELIER CARE */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest text-amber-500">{adminText("CONTENU DE LA PAGE ATELIER CARE (SOUVERAINETÉ CLIENT)", language)}</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Atelier Care (Français)", language)}</label>
                  <input
                    id="sett-care-title-fr"
                    type="text"
                    value={settings.careTitle || ''}
                    onChange={(e) => setSettings({ ...settings, careTitle: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Titre Atelier Care (Anglais)", language)}</label>
                  <input
                    id="sett-care-title-en"
                    type="text"
                    value={settings.careTitleEn || ''}
                    onChange={(e) => setSettings({ ...settings, careTitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Contenu / Description Care (Français)", language)}</label>
                  <textarea
                    id="sett-care-content-fr"
                    rows={3}
                    value={settings.careContent || ''}
                    onChange={(e) => setSettings({ ...settings, careContent: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Contenu / Description Care (Anglais)", language)}</label>
                  <textarea
                    id="sett-care-content-en"
                    rows={3}
                    value={settings.careContentEn || ''}
                    onChange={(e) => setSettings({ ...settings, careContentEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>

              {/* INTERACTIVE FAQ EDITOR SECTION */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest text-amber-500 flex justify-between items-center bg-amber-500/10 p-3 rounded">
                  <span>{adminText("FAQ - QUESTIONS FREQUENTES D'ATELIER CARE", language)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = (() => {
                        try { return settings.faqsJson ? JSON.parse(settings.faqsJson) : []; } catch { return []; }
                      })();
                      const updated = [...current, { 
                        q: "Nouvelle Question ?", 
                        qEn: "New Question ?", 
                        a: "Réponse sur-mesure de la Maison.", 
                        aEn: "Bespoke answer from the Maison." 
                      }];
                      setSettings({ ...settings, faqsJson: JSON.stringify(updated) });
                    }}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-mono text-[9px] font-bold rounded cursor-pointer duration-200 uppercase tracking-widest"
                  >{adminText("+ Ajouter une FAQ", language)}</button>
                </h3>
              </div>

              <div className="space-y-4">
                {(() => {
                  let fList: any[] = [];
                  try {
                    fList = settings.faqsJson ? JSON.parse(settings.faqsJson) : [];
                  } catch {}
                  
                  if (!Array.isArray(fList) || fList.length === 0) {
                    return (
                      <div className="py-4 text-center border border-dashed border-white/10 text-xs text-neutral-500 uppercase font-mono tracking-wider">{adminText("Aucune Question Fréquente définie.", language)}</div>
                    );
                  }

                  return fList.map((faq: any, fIdx: number) => (
                    <div key={fIdx} className="p-4 bg-neutral-950 rounded border border-white/5 space-y-3 relative group">
                      <div className="absolute top-2 right-2 opacity-60 group-hover:opacity-100 duration-200">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = fList.filter((_, i) => i !== fIdx);
                            setSettings({ ...settings, faqsJson: JSON.stringify(updated) });
                          }}
                          className="p-1.5 px-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[9px] font-mono uppercase tracking-widest duration-300 cursor-pointer"
                        >{adminText("Supprimer", language)}</button>
                      </div>
                      <span className="text-[9px] font-mono text-amber-400 uppercase">SBMJ FAQ #{fIdx + 1}</span>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">{adminText("Question (Français)", language)}</label>
                          <input
                            type="text"
                            value={faq.q || faq.qFr || ''}
                            onChange={(e) => {
                              const updated = [...fList];
                              updated[fIdx] = { ...updated[fIdx], q: e.target.value, qFr: e.target.value };
                              setSettings({ ...settings, faqsJson: JSON.stringify(updated) });
                            }}
                            className="w-full bg-neutral-900 border border-white/5 text-xs px-2.5 py-1.5 text-white font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">{adminText("Question (Anglais)", language)}</label>
                          <input
                            type="text"
                            value={faq.qEn || ''}
                            onChange={(e) => {
                              const updated = [...fList];
                              updated[fIdx] = { ...updated[fIdx], qEn: e.target.value };
                              setSettings({ ...settings, faqsJson: JSON.stringify(updated) });
                            }}
                            className="w-full bg-neutral-900 border border-white/5 text-xs px-2.5 py-1.5 text-white font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">{adminText("Réponse (Français)", language)}</label>
                          <textarea
                            rows={2}
                            value={faq.a || faq.aFr || ''}
                            onChange={(e) => {
                              const updated = [...fList];
                              updated[fIdx] = { ...updated[fIdx], a: e.target.value, aFr: e.target.value };
                              setSettings({ ...settings, faqsJson: JSON.stringify(updated) });
                            }}
                            className="w-full bg-neutral-900 border border-white/5 text-xs px-2.5 py-1.5 text-white font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">{adminText("Réponse (Anglais)", language)}</label>
                          <textarea
                            rows={2}
                            value={faq.aEn || ''}
                            onChange={(e) => {
                              const updated = [...fList];
                              updated[fIdx] = { ...updated[fIdx], aEn: e.target.value };
                              setSettings({ ...settings, faqsJson: JSON.stringify(updated) });
                            }}
                            className="w-full bg-neutral-900 border border-white/5 text-xs px-2.5 py-1.5 text-white font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* SECTION: FOOTER DE LA MAISON */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest text-amber-500">{adminText("CONTENU DU FOOTER DE LA MAISON", language)}</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description Footer (Français)", language)}</label>
                  <textarea
                    id="sett-footer-text-fr"
                    rows={2}
                    value={settings.footerText || ''}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Description Footer (Anglais)", language)}</label>
                  <textarea
                    id="sett-footer-text-en"
                    rows={2}
                    value={settings.footerTextEn || ''}
                    onChange={(e) => setSettings({ ...settings, footerTextEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Crédits Footer (Français)", language)}</label>
                  <input
                    id="sett-footer-credits-fr"
                    type="text"
                    value={settings.footerCredits || ''}
                    onChange={(e) => setSettings({ ...settings, footerCredits: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Crédits Footer (Anglais)", language)}</label>
                  <input
                    id="sett-footer-credits-en"
                    type="text"
                    value={settings.footerCreditsEn || ''}
                    onChange={(e) => setSettings({ ...settings, footerCreditsEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Lien Instagram Footer", language)}</label>
                  <input
                    id="sett-instagram-url"
                    type="url"
                    value={settings.instagramUrl || ''}
                    onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-mono"
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Lien Facebook Footer", language)}</label>
                  <input
                    id="sett-facebook-url"
                    type="url"
                    value={settings.facebookUrl || ''}
                    onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-mono"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">{adminText("Lien WhatsApp Footer", language)}</label>
                  <input
                    id="sett-whatsapp-url"
                    type="url"
                    value={settings.whatsappUrl || ''}
                    onChange={(e) => setSettings({ ...settings, whatsappUrl: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-mono"
                    placeholder="https://wa.me/229..."
                  />
                </div>
              </div>

              {/* SECTION: SECURITE SOUVERAINETÉ */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest text-red-500">{adminText("SÉCURITÉ ET ACCÈS SOUVERAIN (ADMIN)", language)}</h3>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-red-400 uppercase block">{adminText("Nouveau Mot de Passe d'Accès Administratif *", language)}</label>
                <button type="button" onClick={async () => {
                  try { await logout(); setIsAdminRecoverMode(true); }
                  catch (error: any) { alert(error.message); }
                }} className="px-4 py-3 border border-red-500/30 text-red-400 rounded text-xs">
                  {language === 'FR' ? 'Modifier le mot de passe' : 'Change password'}
                </button>
              </div>

              <button
                id="btn-save-settings"
                type="submit"
                className="px-6 h-11 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded cursor-pointer duration-300"
              >{adminText("METTRE À JOUR LA CONFIRMATION", language)}</button>

            </form>
          )}

          {activeTab === 'security' && <SecurityConsole />}

          {/* TAB 8: CUSTOMER REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <MessageSquare className="w-5 h-5 animate-pulse" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#10b981]">{adminText("MODÉRATION DES AVIS CLIENTÈLE", language)}</h3>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">{adminText("Examinez, approuvez ou rejetez les témoignages soumis par vos clients d'exception.", language)}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-emerald-400 font-mono text-xs">
                  {reviewsList.filter(r => r.status === 'pending').length}{adminText("EN ATTENTE", language)}</div>
              </div>

              {reviewsList.length === 0 ? (
                <div className="py-12 border border-dashed border-white/10 rounded-lg text-center text-neutral-500 text-xs uppercase font-mono tracking-widest">{adminText("Aucun avis n'est actuellement enregistré dans la base de données.", language)}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {reviewsList.map((rev) => (
                    <div 
                      key={rev.id} 
                      className={`p-6 rounded-lg border bg-black/40 flex flex-col justify-between space-y-4 duration-300 relative ${
                        rev.status === 'pending' 
                          ? 'border-amber-500/30 shadow-[0_4px_20px_rgba(217,119,6,0.05)]' 
                          : 'border-white/5'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-mono font-medium text-white uppercase tracking-wider">{rev.customerName}</p>
                            <span className="text-[9px] font-mono text-neutral-500">
                              {new Date(rev.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded font-mono text-[9px] uppercase tracking-widest font-bold ${
                            rev.status === 'approved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            {rev.status === 'approved' ? 'APPRÉCIÉ / REÇU' : 'EN EXAMEN'}
                          </span>
                        </div>

                        {/* Stars Review Rating Display */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`} 
                            />
                          ))}
                        </div>

                        {/* Commentary Text */}
                        <p className="text-xs font-light text-neutral-300 leading-relaxed italic border-l border-white/10 pl-3">
                          "{rev.text}"
                        </p>
                      </div>

                      {/* Controls approving / rejecting and deleting */}
                      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                        {rev.status === 'pending' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/reviews/${rev.id}/approve`, { method: 'PUT' });
                                if (res.ok) {
                                  alert("L'avis clientèle a été approuvé avec succès et s'affichera immédiatement sur la page d'accueil !");
                                  fetchAllGodData();
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded cursor-pointer duration-300 text-center"
                          >{adminText("Approuver & Publier ⚜_", language)}</button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("Voulez-vous rejeter et supprimer définitivement cet avis clientèle ?")) return;
                            try {
                              const res = await fetch(`/api/reviews/${rev.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                fetchAllGodData();
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`py-2 px-4 rounded font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer duration-300 ${
                            rev.status === 'pending'
                              ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20'
                              : 'w-full bg-neutral-900 hover:bg-red-600/20 text-neutral-400 hover:text-red-400 border border-white/5 hover:border-red-500/20'
                          }`}
                        >
                          {rev.status === 'pending' ? 'Rejeter ✕' : 'Supprimer de la page d\'accueil'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* SBMJ SECURE INVOICE DIALOG OVERLAY VIEW */}
          {selectedOrderForInvoice && (
            <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 backdrop-blur-md p-4 md:p-8 flex justify-center items-start">
              <div className="relative w-full max-w-4xl bg-neutral-950 border border-white/10 rounded-lg shadow-2xl overflow-hidden my-4 md:my-8 p-6 md:p-12 space-y-8 text-white selection:bg-amber-500/20">
                
                {/* Close Overlay btn */}
                <button
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="absolute top-4 right-4 z-10 p-2 px-3 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded font-mono font-bold text-[10px] uppercase cursor-pointer"
                >{adminText("✕ Fermer la facture", language)}</button>

                <InvoicePreview order={selectedOrderForInvoice} language={language} onReady={setAdminInvoiceFile} />

                {/* Print button row */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                  <button
                    onClick={() => handlePrintInvoice(selectedOrderForInvoice)}
                    disabled={adminInvoiceFile?.orderId !== selectedOrderForInvoice.id || adminInvoiceFile?.language !== language}
                    className="px-6 h-12 border border-white/20 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded text-xs font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <span>{language === 'FR' ? 'Telecharger la facture PDF' : 'Download PDF invoice'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = `Bonjour, voici le reçu de facturation pour votre commande en cours chez StevenBmj sous la référence : ${selectedOrderForInvoice.id}`;
                      window.open(`https://wa.me/${selectedOrderForInvoice.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-6 h-12 bg-amber-400 text-black hover:bg-amber-300 rounded text-xs font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <span>{adminText("💬 RELANCER LE CLIENT SUR WHATSAPP", language)}</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
