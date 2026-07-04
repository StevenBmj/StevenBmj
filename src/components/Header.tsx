/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import { ShoppingBag, Heart, ShieldAlert, Languages, Coins, Menu, X, Landmark, User, LogOut, Key, Trash2 } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  onOpenWishlist: () => void;
}

export default function Header({ currentView, setView, onOpenWishlist }: HeaderProps) {
  const { 
    language, 
    setLanguage, 
    currency, 
    setCurrency, 
    cart, 
    setCartOpen, 
    wishlist,
    vipPoints,
    user,
    logout,
    setAuthModalOpen
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<any | null>(null);

  // Client change password states
  const [isClientChangePasswordOpen, setIsClientChangePasswordOpen] = useState(false);
  const [clientSecurityCode, setClientSecurityCode] = useState('');
  const [clientNewPassword, setClientNewPassword] = useState('');
  const [clientPasswordError, setClientPasswordError] = useState('');
  const [clientPasswordSuccess, setClientPasswordSuccess] = useState('');
  const [clientPasswordLoading, setClientPasswordLoading] = useState(false);
  const [clientCodeSentFeedback, setClientCodeSentFeedback] = useState('');

  // Client account deletion states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const confirmClientDeleteAccount = async () => {
    if (!user) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/client/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        setIsDeleteConfirmOpen(false);
        logout();
        setView('home');
      } else {
        setDeleteError(data.error || "Une erreur est survenue lors de la suppression de votre compte.");
      }
    } catch {
      setDeleteError("Erreur réseau de communication.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const sendClientSecurityCode = async () => {
    if (!user) return;
    setClientPasswordError('');
    setClientCodeSentFeedback('');
    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (res.ok) {
        setClientCodeSentFeedback(language === 'FR' ? "✓ Code sécurité transmis par mail !" : "✓ Safety code sent!");
      } else {
        setClientPasswordError(data.error || 'Erreur d\'envoi du code');
      }
    } catch {
      setClientPasswordError('Erreur de communication');
    }
  };

  const handleClientChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientPasswordError('');
    setClientPasswordSuccess('');
    setClientPasswordLoading(true);

    if (!user) return;

    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          code: clientSecurityCode,
          newPassword: clientNewPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setClientPasswordSuccess(language === 'FR' ? "Votre mot de passe a été mis à jour avec succès !" : "Your password was updated successfully!");
        setClientSecurityCode('');
        setClientNewPassword('');
        setClientCodeSentFeedback('');
        setTimeout(() => {
          setIsClientChangePasswordOpen(false);
          setClientPasswordSuccess('');
        }, 2200);
      } else {
        setClientPasswordError(data.error || (language === 'FR' ? "Une erreur est survenue." : "An error occurred."));
      }
    } catch (err) {
      setClientPasswordError(language === 'FR' ? "Erreur réseau." : "Network error.");
    } finally {
      setClientPasswordLoading(false);
    }
  };

  // Poll active announcements gracefully
  useEffect(() => {
    const fetchActiveAnn = async () => {
      try {
        const res = await fetch('/api/announcements');
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            setActiveAnnouncement(list[0]);
          } else {
            setActiveAnnouncement(null);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchActiveAnn();
    const interval = setInterval(fetchActiveAnn, 15000);
    return () => clearInterval(interval);
  }, []);

  // Calculate items in cart
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const toggleLanguage = () => {
    setLanguage(language === 'FR' ? 'EN' : 'FR');
  };

  const cycleCurrency = () => {
    const sequence: ('EUR' | 'CFA' | 'USD')[] = ['EUR', 'CFA', 'USD'];
    const idx = sequence.indexOf(currency);
    setCurrency(sequence[(idx + 1) % sequence.length]);
  };

  const navLinks = [
    { id: 'home', labelFr: 'Accueil', labelEn: 'Home' },
    { id: 'boutique', labelFr: 'Catalogue', labelEn: 'Catalogue' },
    { id: 'about', labelFr: 'À Propos', labelEn: 'About' },
    { id: 'contact', labelFr: 'Contact', labelEn: 'Contact' },
    { id: 'aide', labelFr: 'Atelier Care', labelEn: 'Client Care' },
  ];

  return (
    <header className="fixed top-0 left-0 z-40 w-full border-b border-white/5 bg-black/70 backdrop-blur-xl">
      {/* Top Banner Advertisement */}
      <div className="w-full bg-gradient-to-r from-amber-700/30 via-amber-500/30 to-amber-700/30 text-[9px] md:text-[10px] py-1.5 px-4 font-mono tracking-[0.2em] text-center text-amber-200 uppercase overflow-hidden border-b border-amber-500/10">
        <div className="animate-marquee inline-block whitespace-nowrap">
          {activeAnnouncement ? (
            language === 'FR' ? activeAnnouncement.text : activeAnnouncement.textEn
          ) : (
            language === 'FR' 
              ? "✨ LIVRAISON PRIVÉE SÉCURISÉE AVEC SUIVI WHATSAPP OFFERTE — ÉLÉGANCE ET FUTUR DE L'HOMME PREMIUM ✨" 
              : "✨ SECURED PRIVATE COURIER DELIVERY WITH WHATSAPP UPDATES — ELÉGANCE & THE FUTURE OF MENSWEAR ✨"
          )}
        </div>
      </div>

      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Links: Navigation (Hidden on mobile) */}
        <nav className="hidden md:flex items-center space-x-3 lg:space-x-6">
          {navLinks.map((link) => (
            <button
              id={`nav-link-${link.id}`}
              key={link.id}
              onClick={() => setView(link.id)}
              className={`text-[10px] lg:text-xs uppercase tracking-[0.15em] lg:tracking-[0.25em] font-light duration-500 hover:text-amber-400 cursor-pointer relative py-2 ${
                currentView === link.id 
                  ? 'text-amber-400 font-medium' 
                  : link.id === 'god' 
                    ? 'text-red-400 font-semibold' 
                    : 'text-neutral-300'
              }`}
            >
              {language === 'FR' ? link.labelFr : link.labelEn}
              {currentView === link.id && (
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              )}
            </button>
          ))}
          {/* VIP badge indicator - Hidden for clean minimalist aesthetic */}
        </nav>

        {/* Center: Brand Majestic Logo Identity */}
        <div 
          className="flex items-center justify-center space-x-3 cursor-pointer select-none" 
          onClick={() => setView('home')}
          title="StevenBmj Maison"
        >
          <Logo size={42} className="shrink-0" id="header-brand-logo" />
          <div className="flex flex-col text-left">
            <span className="text-xl font-light tracking-[0.25em] text-white uppercase font-sans">StevenBmj</span>
            <span className="text-[7px] font-mono tracking-[0.4em] text-amber-500 -mt-1 uppercase">Haute Joaillerie</span>
          </div>
        </div>

        {/* Right Corner: Quick Controls (Language, Currency, Shopping Bag, Wishlist) */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Currency cycle button (Desktop only, now inside mobile menu for mobile compatibility) */}
          <button
            id="btn-currency"
            onClick={cycleCurrency}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1 text-neutral-400 hover:text-white hover:border-white border border-neutral-800 bg-neutral-900/40 rounded text-[10px] font-mono uppercase tracking-widest duration-500 cursor-pointer"
            title="Devise"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500/85" />
            <span>{currency}</span>
          </button>

          {/* Language selector (Desktop only) */}
          <button
            id="btn-lang"
            onClick={toggleLanguage}
            className="hidden md:flex items-center space-x-1 px-2.5 py-1 text-neutral-400 hover:text-white hover:border-white border border-neutral-800 bg-neutral-900/40 rounded text-[10px] font-mono uppercase tracking-widest duration-500 cursor-pointer"
            title="Langue"
          >
            <Languages className="w-3.5 h-3.5 text-amber-500/85" />
            <span>{language}</span>
          </button>

          {/* User profile section (Desktop only) */}
          <div className="hidden md:block">
            {user ? (
              <div className="relative group">
                <button
                  id="btn-header-profile"
                  className="flex items-center space-x-1 px-2.5 py-1 text-amber-505 hover:text-amber-400 border border-amber-500/20 bg-amber-500/5 rounded text-[10px] font-mono uppercase tracking-widest duration-300 cursor-pointer text-amber-500 font-bold"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{user.isAdmin ? (language === 'FR' ? "ADMIN" : "ADMIN") : user.name}</span>
                </button>
                
                {/* Dropdown menu overlay */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-950 border border-white/10 rounded-lg p-3.5 shadow-2xl invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 text-left">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                    {language === 'FR' ? "IDENTITÉ CONNECTÉE" : "CONNECTED MEMBERSHIP"}
                  </p>
                  <p className="text-xs text-white font-semibold mt-1 truncate">{user.name}</p>
                  <p className="text-[9px] text-neutral-500 truncate font-mono">{user.email}</p>
                  
                  {user.isAdmin && (
                    <button
                      id="btn-nav-god-dashboard"
                      onClick={() => setView('god')}
                      className="w-full text-left py-2 font-mono text-[9px] text-red-400 hover:text-red-300 uppercase tracking-widest border-t border-white/5 mt-2.5 cursor-pointer block"
                    >
                      {language === 'FR' ? "🚀 ACCÉDER AU CORE ADMIN" : "🚀 ACCESS CORE ADMIN"}
                    </button>
                  )}

                  {!user.isAdmin && (
                    <>
                      <button
                        id="btn-client-change-pass"
                        onClick={() => {
                          setIsClientChangePasswordOpen(true);
                          setClientPasswordError('');
                          setClientPasswordSuccess('');
                        }}
                        className="w-full text-left py-2 flex items-center gap-1.5 font-mono text-[9px] text-amber-500 hover:text-amber-400 uppercase tracking-widest border-t border-white/5 mt-2.5 cursor-pointer font-bold"
                      >
                        <Key className="w-3 h-3" />
                        <span>{language === 'FR' ? "MODIFIER MOT DE PASSE" : "CHANGE PASSWORD"}</span>
                      </button>
                      <button
                        id="btn-client-delete-account"
                        onClick={() => {
                          setIsDeleteConfirmOpen(true);
                          setDeleteError('');
                        }}
                        className="w-full text-left py-2 flex items-center gap-1.5 font-mono text-[9px] text-red-500 hover:text-red-400 uppercase tracking-widest border-t border-white/5 mt-1 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                        <span>{language === 'FR' ? "SUPPRIMER LE COMPTE" : "DELETE ACCOUNT"}</span>
                      </button>
                    </>
                  )}

                  <button
                    id="btn-nav-logout"
                    onClick={() => {
                      const wasAdmin = user?.isAdmin;
                      logout();
                      if (wasAdmin) {
                        setView('god');
                      } else {
                        setView('home');
                      }
                    }}
                    className="w-full text-left py-2 flex items-center gap-1.5 font-mono text-[9px] text-neutral-400 hover:text-red-400 uppercase tracking-widest border-t border-white/5 mt-2.5 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{language === 'FR' ? "SE DÉCONNECTER" : "LOG OUT"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-trigger-auth"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1 border border-neutral-800 bg-neutral-900/40 rounded text-[10px] font-mono uppercase tracking-widest duration-500 cursor-pointer text-neutral-400 hover:text-white"
              >
                <User className="w-3.5 h-3.5" />
                <span>{language === 'FR' ? "CONNEXION" : "ACCESS VIP"}</span>
              </button>
            )}
          </div>

          {/* Wishlist triggers */}
          <button
            id="btn-wishlist"
            onClick={onOpenWishlist}
            className="relative p-2 text-neutral-300 hover:text-red-400 duration-300 cursor-pointer"
            title="Liste d'envies"
          >
            <Heart className="w-4.5 h-4.5" />
            {wishlist.length > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white font-mono antialiased animate-bounce">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag trigger */}
          <button
            id="btn-cart"
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-neutral-300 hover:text-amber-400 duration-300 cursor-pointer"
            title="Panier"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            {totalCartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-mono leading-none font-bold text-black border border-black">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-300 hover:text-white md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-black/95 px-5 py-6 space-y-5 text-left divide-y divide-white/5 max-h-[calc(100vh-110px)] overflow-y-auto">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setView(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`py-3 text-sm text-left uppercase tracking-[0.2em] font-light cursor-pointer ${
                  currentView === link.id ? 'text-amber-400 font-semibold' : 'text-neutral-300'
                }`}
              >
                {language === 'FR' ? link.labelFr : link.labelEn}
              </button>
            ))}
          </div>

          {/* Mobile User Profiles & Quick Selectors */}
          <div className="pt-5 space-y-4">
            {/* User State */}
            {user ? (
              <div className="space-y-3">
                <div className="bg-neutral-900/60 p-3 rounded border border-white/5">
                  <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
                    {language === 'FR' ? "VIP CONNECTÉ" : "VIP CONNECTED"}
                  </p>
                  <p className="text-sm text-amber-400 font-semibold truncate mt-0.5">{user.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {user.isAdmin ? "PRÉROGATIVE ADMIN SUPRÊME" : (language === 'FR' ? "MEMBRE EXCLUSIF VALIDE" : "VALIDATED EXCLUSIVE MEMBER")}
                  </p>
                </div>
                
                <div className="flex flex-col space-y-2">
                  {user.isAdmin && (
                    <button
                      onClick={() => {
                        setView('god');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left py-2.5 px-3 bg-red-950/20 border border-red-500/20 rounded font-mono text-[10px] text-red-400 hover:text-red-300 uppercase tracking-widest cursor-pointer"
                    >
                      {language === 'FR' ? "🚀 ACCÉDER AU CORE ADMIN" : "🚀 ACCESS CORE ADMIN"}
                    </button>
                  )}
                  
                  {!user.isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsClientChangePasswordOpen(true);
                        }}
                        className="w-full text-left py-2.5 px-3 bg-neutral-900 border border-white/10 rounded font-mono text-[10px] text-amber-400 hover:text-amber-300 uppercase tracking-widest cursor-pointer"
                      >
                        {language === 'FR' ? "🔑 MODIFIER MON MOT DE PASSE" : "🔑 CHANGE MY PASSWORD"}
                      </button>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsDeleteConfirmOpen(true);
                          setDeleteError('');
                        }}
                        className="w-full text-left py-2.5 px-3 bg-neutral-900 border border-red-500/20 rounded font-mono text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest cursor-pointer font-bold animate-pulse"
                      >
                        {language === 'FR' ? "🗑️ SUPPRIMER MON COMPTE" : "🗑️ DELETE MY ACCOUNT"}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      const wasAdmin = user?.isAdmin;
                      logout();
                      setMobileMenuOpen(false);
                      if (wasAdmin) {
                        setView('god');
                      } else {
                        setView('home');
                      }
                    }}
                    className="w-full text-left py-2.5 px-3 bg-neutral-900/50 border border-white/5 rounded font-mono text-[10px] text-neutral-400 hover:text-red-400 uppercase tracking-widest cursor-pointer"
                  >
                    {language === 'FR' ? "❌ SE DÉCONNECTER" : "❌ LOG OUT"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="w-full py-3 bg-amber-400 text-black text-center font-mono text-xs font-bold uppercase tracking-widest rounded cursor-pointer duration-300"
              >
                🔐 {language === 'FR' ? "CONNEXION ESPACE VIP" : "SIGN IN ESPACE VIP"}
              </button>
            )}

            {/* Language & Currency controls on mobile */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={cycleCurrency}
                className="flex items-center justify-center space-x-2 p-2.5 w-full bg-neutral-900 border border-white/10 rounded cursor-pointer duration-300 text-neutral-300 text-xs font-mono"
              >
                <Coins className="w-4 h-4 text-amber-500" />
                <span>DEVISE: <strong className="text-white font-bold">{currency}</strong></span>
              </button>

              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center space-x-2 p-2.5 w-full bg-neutral-900 border border-white/10 rounded cursor-pointer duration-300 text-neutral-300 text-xs font-mono"
              >
                <Languages className="w-4 h-4 text-amber-500" />
                <span>LANGUE: <strong className="text-white font-bold">{language}</strong></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Change Password Modal */}
      {isClientChangePasswordOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsClientChangePasswordOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
          />
          <div className="relative bg-neutral-950 border border-white/10 w-full max-w-sm rounded-lg p-6 shadow-2xl z-[111] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />
            
            <button 
              onClick={() => setIsClientChangePasswordOpen(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white p-1 rounded-full hover:bg-white/5 duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-5">
              <span className="text-[8px] font-mono tracking-[0.3em] text-amber-500 uppercase font-bold block mb-1">PRIVILEGE SBMJ SECURITY</span>
              <h3 className="text-base font-light text-white uppercase tracking-widest">{language === 'FR' ? "Nouveau Mot de Passe" : "Update Password"}</h3>
            </div>

            {clientPasswordError && (
              <div className="mb-4 p-2.5 bg-red-950/50 border border-red-500/20 text-red-400 rounded text-[10px] font-mono uppercase tracking-wide text-center">
                {clientPasswordError}
              </div>
            )}

            {clientPasswordSuccess && (
              <div className="mb-4 p-2.5 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-mono uppercase tracking-wide text-center">
                ✓ {clientPasswordSuccess}
              </div>
            )}

            <form onSubmit={handleClientChangePassword} className="space-y-4">
              <div className="space-y-1 bg-neutral-900/60 p-2.5 rounded border border-white/5">
                <p className="text-[10px] text-neutral-400 font-mono leading-relaxed mb-1.5">
                  {language === 'FR' ? "Vous devez d'abord recevoir un code d'activation de changement par e-mail :" : "You must request a secure update code first:"}
                </p>
                <button
                  type="button"
                  onClick={sendClientSecurityCode}
                  className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-500 hover:text-amber-400 font-mono text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer h-8"
                >
                  {language === 'FR' ? "ENVOYER LE CODE PAR EMAIL" : "SEND CODE VIA EMAIL"}
                </button>
                {clientCodeSentFeedback && (
                  <p className="text-[9px] text-emerald-400 font-mono text-center mt-1.5">{clientCodeSentFeedback}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">{language === 'FR' ? "Code de Sécurité Reçu *" : "Received Security Code *"}</label>
                <input
                  type="text"
                  required
                  value={clientSecurityCode}
                  onChange={(e) => setClientSecurityCode(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3 py-2.5 text-white rounded font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">{language === 'FR' ? "Nouveau Mot de Passe *" : "New Password *"}</label>
                <input
                  type="password"
                  required
                  value={clientNewPassword}
                  onChange={(e) => setClientNewPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 text-xs px-3 py-2.5 text-white rounded font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={clientPasswordLoading}
                className="w-full py-2.5 h-10 bg-amber-400 hover:bg-amber-300 text-black font-mono text-[10px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 flex items-center justify-center font-semibold"
              >
                {clientPasswordLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  language === 'FR' ? "METTRE À JOUR LE PROTOCOLE" : "UPDATE PASSWORD"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="relative bg-neutral-950 border border-red-500/20 w-full max-w-sm rounded-lg p-6 shadow-2xl overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600" />
            
            <button 
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute right-4 top-4 text-neutral-500 hover:text-white p-1 rounded-full hover:bg-white/5 duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5 mt-1">
              <span className="text-[8px] font-mono tracking-[0.3em] text-red-505 text-red-500 uppercase font-bold block mb-1">DANGER ZONE / PRIVATION PRIVILÈGES</span>
              <h3 className="text-sm font-light text-white uppercase tracking-widest">{language === 'FR' ? "SUPPRIMER LE COMPTE" : "DELETE ACCOUNT"}</h3>
              <p className="text-[10px] text-neutral-400 font-mono mt-3 leading-relaxed">
                {language === 'FR' 
                  ? "Êtes-vous absolument sûr de vouloir supprimer définitivement votre espace membre Maison StevenBmj ? Cette opération est irréversible et détruira vos points de fidélité d'exception." 
                  : "Are you absolutely sure you want to permanently delete your Maison StevenBmj membership? This operation is irreversible and will destroy your loyalty points."}
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[9px] font-mono uppercase tracking-wide text-center">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-900 text-white font-mono text-[10px] uppercase tracking-wider rounded border border-white/10 cursor-pointer transition-all"
              >
                {language === 'FR' ? "ANNULER" : "CANCEL"}
              </button>
              <button
                type="button"
                onClick={confirmClientDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center justify-center font-semibold"
              >
                {deleteLoading ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  language === 'FR' ? "CONFIRMER STRIC" : "CONFIRM"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
