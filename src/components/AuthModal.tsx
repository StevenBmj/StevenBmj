import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Mail, Lock, User, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export default function AuthModal() {
  const { 
    language, 
    authModalOpen, 
    setAuthModalOpen, 
    setUser, 
    executeAuthCallback,
    addVipPoints
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'activate'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [activationEmail, setActivationEmail] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleSim, setShowGoogleSim] = useState(false);

  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [newGoogleName, setNewGoogleName] = useState('');
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [isAddingGoogle, setIsAddingGoogle] = useState(false);
  const [googleAddError, setGoogleAddError] = useState('');

  if (!authModalOpen) return null;

  const addNewGoogleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleAddError('');
    if (!newGoogleName || !newGoogleEmail) {
      setGoogleAddError(language === 'FR' ? "Tous les champs sont requis." : "All fields are required.");
      return;
    }
    if (/\d/.test(newGoogleName)) {
      setGoogleAddError(language === 'FR' ? "Le nom ne doit pas contenir de chiffres." : "The name cannot contain numbers.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newGoogleEmail.trim().toLowerCase())) {
      setGoogleAddError(language === 'FR' ? "Format d'adresse e-mail invalide." : "Invalid email format.");
      return;
    }
    const initials = newGoogleName.trim().substring(0, 2).toUpperCase();
    const newAcc = {
      name: newGoogleName.trim(),
      email: newGoogleEmail.trim().toLowerCase(),
      avatar: initials || "G"
    };

    setGoogleAccounts([...googleAccounts, newAcc]);
    setNewGoogleName('');
    setNewGoogleEmail('');
    setIsAddingGoogle(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'activate') {
        const res = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: activationEmail || email, code: activationCode })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erreur d\'activation');
        }
        setUser(data.user);
        addVipPoints(100);
        executeAuthCallback();
        return;
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password } 
        : { name: fullName, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "UNCONFIRMED_ACCOUNT") {
          setActivationEmail(data.email || email);
          setMode('activate');
          setError(language === 'FR' 
            ? "Votre compte d'exception est en attente d'activation. Veuillez entrer le code d'activation reçu par e-mail." 
            : "Your account is pending activation. Please enter the verification code sent to your email."
          );
          return;
        }
        throw new Error(data.error || 'Une erreur est survenue');
      }

      if (data.requiresActivation) {
        setActivationEmail(data.email);
        setMode('activate');
        setError('');
        return;
      }

      // Add points on account registration
      if (mode === 'register') {
        addVipPoints(100);
      } else {
        addVipPoints(10);
      }

      setUser(data.user);
      executeAuthCallback();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur d'identification Google");
      }
      setUser(data.user);
      addVipPoints(100);
      executeAuthCallback();
      setShowGoogleSim(false);
      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startGoogleSignIn = () => {
    setError('');
    if (!googleClientId) {
      setError(language === 'FR'
        ? "Google réel n'est pas encore configuré. Ajoutez VITE_GOOGLE_CLIENT_ID et GOOGLE_CLIENT_ID dans Vercel pour proposer les comptes Google de l'appareil."
        : "Real Google Sign-In is not configured yet. Add VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID in Vercel to show the device Google accounts."
      );
      return;
    }

    const openPrompt = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          if (response?.credential) handleGoogleCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google?.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          setError(language === 'FR'
            ? "Google n'a pas pu afficher le sélecteur de comptes. Vérifiez que les popups/cookies Google sont autorisés."
            : "Google could not show the account picker. Check that Google popups/cookies are allowed."
          );
        }
      });
    };

    if (window.google?.accounts?.id) {
      openPrompt();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', openPrompt, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = openPrompt;
    script.onerror = () => setError(language === 'FR'
      ? "Impossible de charger Google Auth. Vérifiez la connexion réseau."
      : "Unable to load Google Auth. Please check the network connection."
    );
    document.head.appendChild(script);
  };

  const handleGoogleSelect = async (_account?: any) => {
    setError(language === 'FR'
      ? "Les comptes Google fictifs ont été supprimés. Utilisez le bouton Google réel."
      : "Fake Google accounts have been removed. Use real Google Sign-In."
    );
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Dynamic Background Glass blur & overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setAuthModalOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
      />

      {/* Main Luxury Auth Dialog Box */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-neutral-950/95 border border-white/10 w-full max-w-md rounded-lg p-6 md:p-8 overflow-hidden shadow-2xl z-[10001]"
      >
        {/* Top Gold strip design */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700" />

        {/* Close Button */}
        <button 
          id="btn-close-auth-modal"
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-4 top-4 text-neutral-550 hover:text-white p-1 rounded-full hover:bg-white/5 duration-200 cursor-pointer text-neutral-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Greeting Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Logo size={55} />
          <span className="text-[9px] font-mono tracking-[0.3em] text-amber-500 uppercase mt-2.5 font-bold mb-1">
            {language === 'FR' ? "AUTHENTIFICATION DIRECTE SBMJ" : "SBMJ ACCESS SECURED"}
          </span>
          <h3 className="text-xl font-light text-white uppercase tracking-widest font-sans">
            {mode === 'login' 
              ? (language === 'FR' ? "Maison StevenBmj" : "Maison StevenBmj")
              : (language === 'FR' ? "Créer un Compte" : "Join the House")}
          </h3>
          <p className="text-[10px] text-neutral-550 max-w-xs mt-1 leading-relaxed text-neutral-500">
            {mode === 'login'
              ? (language === 'FR' ? "Connectez-vous pour finaliser votre commande d'exception ou signer un avis souverain." : "Log in to finalize your prestigious carriage or deposit an outstanding review.")
              : (language === 'FR' ? "Rejoignez le salon de prestige pour accumuler vos points et commander sur-mesure." : "Enter our elite circle to claim immediate VIP member points and access custom measurements.")}
          </p>
        </div>

        {/* Display Error validation boxes */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-3 bg-red-950/50 border border-red-500/20 text-red-400 rounded flex items-start gap-2 text-[11px] font-mono uppercase tracking-wide"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Authentication Account Selection mockup overlay */}
        <AnimatePresence mode="wait">
          {showGoogleSim ? (
            <motion.div 
              key="google-sim-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                {/* Simulated Google Logo Icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.465 2.016 15.635 1 12.24 1s-9 4.03-9 9 4.03 9 9 9c4.707 0 7.827-3.305 7.827-7.96 0-.53-.06-1.14-.175-1.655H12.24z"
                  />
                </svg>
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  {language === 'FR' ? "Sélectionnez votre compte Google" : "Sign in with Google"}
                </span>
              </div>

              <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                {googleAccounts.map((gAcc) => (
                  <button 
                    id={`btn-google-acc-${gAcc.email}`}
                    key={gAcc.email}
                    onClick={() => handleGoogleSelect(gAcc)}
                    className="w-full p-3 bg-neutral-900/80 border border-white/5 hover:border-amber-500/30 rounded flex items-center gap-3 hover:bg-neutral-900 duration-200 cursor-pointer text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-800 text-amber-500 font-bold border border-white/10 flex items-center justify-center text-xs font-mono shrink-0">
                      {gAcc.avatar}
                    </div>
                    <div className="truncate">
                      <p className="text-xs text-white font-semibold truncate leading-none">{gAcc.name}</p>
                      <span className="text-[10px] text-neutral-500 font-mono truncate">{gAcc.email}</span>
                    </div>
                  </button>
                ))}
              </div>

              {isAddingGoogle ? (
                <div className="p-3 bg-neutral-900 border border-white/5 rounded space-y-2.5 text-left">
                  <h4 className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest leading-none mb-1">{language === 'FR' ? "AJOUTER UN AUTRE COMPTE GOOGLE" : "ADD ANOTHER GOOGLE ACCOUNT"}</h4>
                  
                  {googleAddError && (
                    <p className="text-[9px] text-red-400 font-mono">{googleAddError}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={language === 'FR' ? "Nom Complet" : "Full Name"}
                      value={newGoogleName}
                      onChange={(e) => setNewGoogleName(e.target.value)}
                      className="bg-neutral-950 border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-500/55 w-full"
                    />
                    <input
                      type="text"
                      placeholder="E-mail"
                      value={newGoogleEmail}
                      onChange={(e) => setNewGoogleEmail(e.target.value)}
                      className="bg-neutral-950 border border-white/10 rounded px-2.5 py-1.5 text-[10px] text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-amber-500/55 w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingGoogle(false)}
                      className="flex-1 py-1.5 bg-neutral-950 text-neutral-400 hover:text-white rounded border border-white/10 font-mono text-[9px] uppercase cursor-pointer"
                    >
                      {language === 'FR' ? "Annuler" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => addNewGoogleAccount(e as any)}
                      className="flex-1 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-mono text-[9px] font-bold uppercase rounded cursor-pointer"
                    >
                      {language === 'FR' ? "Confirmer" : "Confirm"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingGoogle(true)}
                  className="w-full py-2.5 border border-dashed border-white/10 hover:border-amber-500 hover:text-amber-400 text-[9px] font-mono uppercase text-amber-500 font-bold rounded cursor-pointer duration-300"
                >
                  + {language === 'FR' ? "AJOUTER UN AUTRE COMPTE" : "ADD ANOTHER ACCOUNT"}
                </button>
              )}

              <button 
                id="btn-cancel-google"
                onClick={() => setShowGoogleSim(false)}
                className="w-full py-2 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white rounded font-mono text-[10px] uppercase cursor-pointer duration-300"
              >
                {language === 'FR' ? "Retour au formulaire classique" : "Return to credentials"}
              </button>
            </motion.div>
          ) : (
            <motion.form 
              key="manual-credentials-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleManualSubmit} 
              className="space-y-4"
            >
              
              {mode === 'activate' ? (
                <div className="space-y-5 py-2">
                  <div className="p-3.5 bg-neutral-900 border border-amber-500/20 rounded text-center">
                    <p className="text-[11px] font-mono text-amber-500 uppercase tracking-widest leading-relaxed whitespace-pre-line">
                      {language === 'FR' 
                        ? `Un code est envoye a votre adresse mail :\n${activationEmail || email}` 
                        : `A code has been sent to your email address:\n${activationEmail || email}`}
                    </p>
                  </div>

                  <div className="space-y-1 block text-left">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {language === 'FR' ? "CODE DE CONFIRMATION INDISPENSABLE *" : "PRESTIGE CONFIRMATION CODE *"}
                    </label>
                    <input
                      id="activation-input-code"
                      type="text"
                      required
                      maxLength={6}
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="A7B9K2"
                      className="w-full bg-neutral-900 border border-amber-500/30 text-center tracking-[0.4em] font-bold text-lg py-3.5 text-white rounded focus:border-amber-400 focus:outline-none placeholder-neutral-700 font-mono"
                    />
                  </div>

                  <button
                    id="btn-activation-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50 font-mono text-[10.5px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 text-center flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{language === 'FR' ? "CERTIFIER MON ADHÉSION ET SE CONNECTER" : "VALIDATE SECURITY PASS & CONNECT"}</span>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError('');
                      }}
                      className="text-neutral-500 hover:text-white font-mono text-[9px] uppercase tracking-wider underline cursor-pointer"
                    >
                      ← {language === 'FR' ? "Retour à la création de compte" : "Return to credentials"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Form Input fields */}
                  {mode === 'register' && (
                    <div className="space-y-1 text-left animate-fade-in">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                        {language === 'FR' ? "Nom & Prénom d'Exception *" : "Your Absolute Full Name *"}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-600" />
                        <input
                          id="auth-input-fullname"
                          type="text"
                          required
                          pattern="[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}"
                          title={language === 'FR' ? "Le nom et le prenom ne doivent pas contenir de chiffres." : "The first and last name cannot contain numbers."}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value.replace(/\d/g, ''))}
                          placeholder="Steven Amorin"
                          className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-3.5 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none placeholder-neutral-700"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 text-left animate-fade-in">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {language === 'FR' ? "Adresse E-Mail Privée *" : "Private E-Mail Address *"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-600" />
                      <input
                        id="auth-input-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vip@stevenbmj.com"
                        className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-3.5 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none placeholder-neutral-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left animate-fade-in">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {mode === 'login'
                        ? (language === 'FR' ? "Mot de passe *" : "Password *")
                        : (language === 'FR' ? "Creer votre mot de passe *" : "Create your password *")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-600" />
                      <input
                        id="auth-input-password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-3.5 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none font-mono placeholder-neutral-700"
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <button
                    id="btn-auth-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50 font-mono text-[10.5px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 transition-all text-center flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>{mode === 'login' 
                          ? (language === 'FR' ? "ÉTABLIR LA CONNEXION DIRECTE" : "CONNECT IN MY PORTAL")
                          : (language === 'FR' ? "BAPTISER MON COMPTE ELITE" : "REGISTER VIP IDENTITY")}</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-3 text-neutral-600 text-[9px] font-mono uppercase tracking-widest">OU</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {/* Secure Google Login Trigger Button */}
                  <button
                    id="btn-trigger-google-auth"
                    type="button"
                    onClick={startGoogleSignIn}
                    className="w-full py-3 bg-neutral-900/40 hover:bg-neutral-900 border border-white/10 hover:border-white/20 text-white font-mono text-[10.5px] uppercase tracking-widest rounded cursor-pointer duration-300 transition-all flex items-center justify-center gap-2.5 h-11"
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
                    <span>{language === 'FR' ? "Continuer avec Google" : "Continue with Google"}</span>
                  </button>

                  {/* Toggle Access mode link */}
                  <div className="pt-4 text-center">
                    <button
                      id="btn-toggle-auth-mode"
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="text-amber-500 hover:text-amber-400 font-mono text-[10px] uppercase tracking-wider underline cursor-pointer"
                    >
                      {mode === 'login'
                        ? (language === 'FR' ? "Vous n'avez pas de compte ? Signez-ici" : "New collectionneur? Forge an identity here")
                        : (language === 'FR' ? "Déjà membre de l'élite ? Connectez-vous" : "Already accredited? Establish session")}
                    </button>
                  </div>
                </>
              )}

            </motion.form>
          )}
        </AnimatePresence>

        {/* Security watermark lines */}
        <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-[8px] font-mono text-neutral-600 leading-none">
          <span>✓ SECURED TRANSACTION SSL</span>
          <span>SBMJ COGNITIVE PORTAL</span>
        </div>

      </motion.div>
    </div>
  );
}
