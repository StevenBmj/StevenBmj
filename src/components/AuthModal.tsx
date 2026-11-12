import { localizedText } from '../lib/uiText';
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { apiFetch as fetch } from '../lib/api';
import { useApp } from '../context/AppContext';
import { X, Mail, Lock, User, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import AccountDialog from './AccountDialog';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
  }
}

const ACTIVATION_WINDOW_SECONDS = 5 * 60;
const CountryPhoneField = lazy(() => import('./CountryPhoneField'));

export default function AuthModal() {
  const { 
    language, 
    authModalOpen, 
    authEntry,
    setAuthModalOpen, 
    setUser, 
    executeAuthCallback,
    addVipPoints
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'activate' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [activationEmail, setActivationEmail] = useState('');
  const [activationDeadline, setActivationDeadline] = useState<number | null>(null);
  const [activationRemaining, setActivationRemaining] = useState(ACTIVATION_WINDOW_SECONDS);
  const [resendFeedback, setResendFeedback] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [googleButtonReady, setGoogleButtonReady] = useState(false);
  useEffect(() => {
    if (!authEntry) return;
    setMode(authEntry.mode);
    setError('');
    setPassword('');
    setShowPassword(false);  }, [authEntry]);

  const startActivationTimer = (remaining: unknown) => {
    const seconds = typeof remaining === 'number' && Number.isFinite(remaining) ? Math.max(0, Math.min(ACTIVATION_WINDOW_SECONDS, remaining)) : 0;
    const deadline = Date.now() + seconds * 1000;
    setActivationDeadline(deadline);
    setActivationRemaining(seconds);
  };

  const formatActivationTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
    const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
  };

  useEffect(() => {
    if (!authModalOpen || mode !== 'activate' || !activationDeadline) return;
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((activationDeadline - Date.now()) / 1000));
      setActivationRemaining(remaining);
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [authModalOpen, activationDeadline, mode]);

  useEffect(() => {
    if (!authModalOpen || (mode !== 'login' && mode !== 'register')) return;
    if (!googleClientId || !googleButtonRef.current) return;

    let cancelled = false;
    setGoogleButtonReady(false);

    const renderOfficialButton = () => {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          if (response?.credential) handleGoogleCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: mode === 'login' ? 'signin_with' : 'signup_with',
        logo_alignment: 'left',
        width: Math.min(360, Math.max(260, googleButtonRef.current.clientWidth || 320)),
      });
      setGoogleButtonReady(true);
    };

    if (window.google?.accounts?.id) {
      renderOfficialButton();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', renderOfficialButton, { once: true });
      return () => {
        cancelled = true;
        existing.removeEventListener('load', renderOfficialButton);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderOfficialButton;
    script.onerror = () => {
      if (!cancelled) {
        setError(language === 'FR'
          ? "Impossible de charger Google Auth. Verifiez la connexion reseau."
          : "Unable to load Google Auth. Please check the network connection."
        );
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.onload = null;
      script.onerror = null;
    };
  }, [authModalOpen, googleClientId, language, mode]);

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
        setActivationDeadline(null);
        setActivationRemaining(ACTIVATION_WINDOW_SECONDS);
        setActivationCode('');
        setUser(data.user);
        addVipPoints(100);
        executeAuthCallback();
        return;
      }

      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' 
        ? { email, password } 
        : { name: fullName, email, password, whatsapp };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === "UNCONFIRMED_ACCOUNT") {
          setActivationEmail(data.email || email);
          setActivationCode('');
          setResendFeedback('');
          startActivationTimer(data.expiresInSeconds);
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
        setActivationCode('');
        setResendFeedback('');
        startActivationTimer(data.expiresInSeconds);
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
      executeAuthCallback();      setAuthModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetCode = async () => {
    setError('');
    setResetSuccess('');
    if (!email.trim()) {
      setError(language === 'FR' ? "Saisissez votre adresse e-mail avant de demander le code." : "Enter your email before requesting the code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi du code.");
      setResetEmailSent(true);
      setResetSuccess(language === 'FR' ? "Un code de reinitialisation est envoye a votre adresse mail." : "A reset code has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendActivationCode = async () => {
    const targetEmail = (activationEmail || email).trim().toLowerCase();
    setError('');
    setResendFeedback('');
    if (!targetEmail) {
      setError(language === 'FR' ? "Adresse e-mail manquante pour renvoyer le code." : "Missing email address for the new code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, resend: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi du code.");
      setActivationCode('');
      setActivationEmail(data.email || targetEmail);
      startActivationTimer(data.expiresInSeconds);
      setResendFeedback(data.message || (language === 'FR' ? "Un nouveau code est envoye a votre adresse mail." : "A new code has been sent to your email."));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: resetCode.trim(),
          newPassword: password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de reinitialisation.');
      setResetSuccess(language === 'FR' ? "Mot de passe modifie. Vous pouvez vous connecter." : "Password updated. You can sign in.");
      setResetCode('');
      setPassword('');
      setResetEmailSent(false);
      setTimeout(() => {
        setMode('login');
        setResetSuccess('');
      }, 1800);
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
        ? "Google reel n'est pas encore configure. Ajoutez VITE_GOOGLE_CLIENT_ID et GOOGLE_CLIENT_ID dans Vercel pour proposer les comptes Google de l'appareil."
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
            ? "Si le selecteur ne s'ouvre pas, cliquez sur le bouton officiel Google affiche au-dessus."
            : "If the picker does not open, use the official Google button shown above."
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
      ? "Impossible de charger Google Auth. Verifiez la connexion reseau."
      : "Unable to load Google Auth. Please check the network connection."
    );
    document.head.appendChild(script);
  };

  if (!authModalOpen) return null;

  return (
    <AccountDialog label={language === 'FR' ? 'Accès au compte StevenBmj' : 'StevenBmj account access'} close={() => setAuthModalOpen(false)}>
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
          type="button"
          aria-label={language === 'FR' ? 'Fermer le formulaire' : 'Close account form'}
          title={language === 'FR' ? 'Fermer' : 'Close'}
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded text-neutral-400 hover:bg-white/5 hover:text-white"
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
            {mode === 'recover'
              ? (language === 'FR' ? "Mot de passe oublie" : "Forgot Password")
              : mode === 'login'
                ? (language === 'FR' ? "Maison StevenBmj" : "Maison StevenBmj")
                : (language === 'FR' ? "Créer un Compte" : "Join the House")}
          </h3>
          <p className="text-[10px] text-neutral-550 max-w-xs mt-1 leading-relaxed text-neutral-500">
            {mode === 'recover'
              ? (language === 'FR' ? "Recevez un code par e-mail pour creer un nouveau mot de passe." : "Receive an email code to create a new password.")
              : mode === 'login'
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

        <AnimatePresence mode="wait">
            <motion.form 
              key="manual-credentials-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={mode === 'recover' ? handlePasswordRecovery : handleManualSubmit} 
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
                    <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                      <span className={activationRemaining > 0 ? 'text-neutral-400' : 'text-red-400'}>
                        {activationRemaining > 0
                          ? `${language === 'FR' ? 'Temps restant' : 'Time left'} ${formatActivationTime(activationRemaining)}`
                          : (language === 'FR' ? 'Code expire' : 'Code expired')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between rounded border border-white/10 bg-black/30 p-3">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                      {language === 'FR'
                        ? "Pas de mail ? Verifiez les spams ou demandez un nouveau code."
                        : "No email? Check spam or request a new code."}
                    </p>
                    <button
                      type="button"
                      onClick={resendActivationCode}
                      disabled={loading}
                      className="shrink-0 px-3 py-2 border border-amber-500/30 text-amber-400 hover:text-black hover:bg-amber-400 disabled:opacity-50 font-mono text-[9px] uppercase tracking-widest rounded cursor-pointer duration-300"
                    >
                      {language === 'FR' ? 'Renvoyer le code' : 'Resend code'}
                    </button>
                  </div>

                  {resendFeedback && (
                    <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest text-center">
                      {resendFeedback}
                    </p>
                  )}

                  <div className="space-y-1 block text-left">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {language === 'FR' ? "CODE DE CONFIRMATION INDISPENSABLE *" : "PRESTIGE CONFIRMATION CODE *"}
                    </label>
                    <input
                      id="activation-input-code"
                      type="text"
                      required
                      maxLength={8}
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
              ) : mode === 'recover' ? (
                <>
                  {resetSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded text-[11px] font-mono uppercase tracking-wide text-center">
                      {resetSuccess}
                    </div>
                  )}

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {language === 'FR' ? "Adresse e-mail du compte *" : "Account email address *"}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-600" />
                      <input
                        id="auth-recover-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="vip@stevenbmj.com"
                        className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-3.5 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none placeholder-neutral-700 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={sendPasswordResetCode}
                    disabled={loading}
                    className="w-full py-2.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 font-mono text-[10px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300"
                  >
                    {language === 'FR' ? "Envoyer le code par mail" : "Send code by email"}
                  </button>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {language === 'FR' ? "Code recu par e-mail *" : "Email code *"}
                    </label>
                    <input
                      id="auth-recover-code"
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.trim())}
                      placeholder="123456"
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none placeholder-neutral-700 font-mono"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                      {language === 'FR' ? "Nouveau mot de passe *" : "New password *"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-600" />
                      <input
                        id="auth-recover-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-11 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none font-mono placeholder-neutral-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetEmailSent}
                    className="w-full py-3 bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-50 font-mono text-[10.5px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 flex items-center justify-center"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (language === 'FR' ? "Modifier mon mot de passe" : "Update my password")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setResetSuccess('');
                    }}
                    className="w-full py-2 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white rounded font-mono text-[10px] uppercase cursor-pointer"
                  >
                    {language === 'FR' ? "Retour a la connexion" : "Return to login"}
                  </button>
                </>
              ) : (
                <>
                  {/* Form Input fields */}
                  {mode === 'register' && (
                    <div className="space-y-1 text-left animate-fade-in">
                      <label className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">
                        {language === 'FR' ? 'Nom et prénom *' : 'Full name *'}
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-600" />
                        <input
                          id="auth-input-fullname"
                          type="text"
                          required
                          pattern="[^0-9]{2,}"
                          title={language === 'FR' ? "Le nom et le prenom ne doivent pas contenir de chiffres." : "The first and last name cannot contain numbers."}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value.normalize('NFC').replace(/[^\p{L}' -]/gu, ''))}
                          placeholder={language === 'FR' ? 'Votre nom complet' : 'Your full name'}
                          className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-3.5 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none placeholder-neutral-700"
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'register' && <Suspense fallback={<p role="status">{language === 'FR' ? 'Chargement des pays…' : 'Loading countries…'}</p>}><CountryPhoneField id="auth-input-whatsapp" language={language} value={whatsapp} onChange={setWhatsapp} /></Suspense>}

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
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-neutral-900 border border-white/10 text-xs pl-10 pr-11 py-3.5 text-white rounded focus:border-amber-400 focus:outline-none font-mono placeholder-neutral-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
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
                    <span className="flex-shrink mx-3 text-neutral-600 text-[9px] font-mono uppercase tracking-widest">{localizedText("OU", language)}</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {googleClientId && (
                    <div className="w-full flex justify-center">
                      <div
                        id="google-official-signin"
                        ref={googleButtonRef}
                        className="min-h-11 w-full flex justify-center overflow-hidden"
                      />
                    </div>
                  )}

                  {(!googleClientId || !googleButtonReady) && (
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
                  )}

                  {googleClientId && googleButtonReady && (
                    <button
                      id="btn-trigger-google-auth"
                      type="button"
                      onClick={startGoogleSignIn}
                      className="w-full text-neutral-500 hover:text-amber-400 font-mono text-[9px] uppercase tracking-widest underline cursor-pointer"
                    >
                      {language === 'FR' ? "Le selecteur ne s'ouvre pas ? Reessayer" : "Picker did not open? Try again"}
                    </button>
                  )}

                  {/* Toggle Access mode link */}
                  <div className="pt-4 text-center">
                    {mode === 'login' && (
                      <button
                        id="btn-forgot-client-password"
                        type="button"
                        onClick={() => {
                          setMode('recover');
                          setError('');
                          setResetSuccess('');
                        }}
                        className="block mx-auto mb-3 text-neutral-400 hover:text-amber-400 font-mono text-[10px] uppercase tracking-wider underline cursor-pointer"
                      >
                        {language === 'FR' ? "Mot de passe oublie ?" : "Forgot password?"}
                      </button>
                    )}
                    <button
                      id="btn-toggle-auth-mode"
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="text-amber-500 hover:text-amber-400 font-mono text-[10px] uppercase tracking-wider underline cursor-pointer"
                    >
                      {mode === 'login'
                        ? (language === 'FR' ? 'Créer un compte' : 'Create an account')
                        : (language === 'FR' ? 'Se connecter' : 'Sign in')}
                    </button>
                  </div>
                </>
              )}

            </motion.form>
        </AnimatePresence>

        {/* Security watermark lines */}
        <div className="mt-6 border-t border-white/5 pt-4 flex items-center justify-between text-[8px] font-mono text-neutral-600 leading-none">
          <span>{localizedText("✓ SECURED TRANSACTION SSL", language)}</span>
          <span>{localizedText("SBMJ COGNITIVE PORTAL", language)}</span>
        </div>

      </motion.div>
    </AccountDialog>
  );
}
