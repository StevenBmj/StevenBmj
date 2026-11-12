/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeHero from './components/HomeHero';
import Boutique from './components/Boutique';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import CustomerCare from './views/CustomerCare';
import AboutUs from './views/AboutUs';
import ContactUs from './views/ContactUs';
import InvoiceVerification from './views/InvoiceVerification';
import LuxuryChatbot from './components/LuxuryChatbot';
import AuthModal from './components/AuthModal';
import SeoMetadata from './components/SeoMetadata';
import { Product } from './types';

const CheckoutModal = lazy(() => import('./components/CheckoutModal'));
const GodDashboard = lazy(() => import('./components/GodDashboard'));
const OrderWorkspace = lazy(() => import('./components/OrderWorkspace'));
const DriverWorkspace = lazy(() => import('./views/DriverWorkspace'));

function AppInner() {
  const { language, triggerAuthRequired, products, productsLoading, user, authLoading } = useApp();
  const { route, navigate, setView, back, canGoBack, openPanel, closePanel } = useNavigation();
  const currentView = route.view;
  const activeProduct = products.find(product => product.id === route.productId);
  const showCheckout = route.panel === 'commande';

  useEffect(() => {
    localStorage.removeItem('sbmj_current_view');
    localStorage.removeItem('sbmj_checkout_open');
  }, []);

  // Quick select product from Boutique catalog listing
  const handleSelectProduct = (product: Product) => {
    navigate({ view: 'produit', productId: product.id, panel: null });
  };

  const handleOrderSubmitted = (order: any) => {
    // Loyalty, orders logs or analytics are pushed on server side
    // The order is already persisted by the checkout API.
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between selection:bg-amber-400 selection:text-black overflow-x-hidden w-full">
      <SeoMetadata />
      
      {/* 2. Global Navbar Header */}
      <Header currentView={currentView} setView={setView} onOpenWishlist={() => setView('boutique')} />

      {/* 3. Sliding Shopping Bag Cart Drawer overlay */}
      <CartDrawer onCheckout={() => triggerAuthRequired(() => openPanel('commande'))} />
 
      {/* 4. Active Main Views router with high-prestige cinematic motion transitions */}
      <main className="flex-1 overflow-x-hidden w-full pt-[116px] md:pt-[112px]">
        {currentView !== 'produit' && (currentView !== 'home' || canGoBack) && (
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
            <button type="button" id="btn-navigation-back" onClick={back}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-neutral-300 hover:text-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 rounded">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {language === 'FR' ? 'Retour' : 'Back'}
            </button>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {currentView === 'home' && (
              <HomeHero setView={setView} />
            )}
 
            {currentView === 'boutique' && (
              <Boutique onSelectProduct={handleSelectProduct} />
            )}
 
            {currentView === 'produit' && activeProduct && (
              <ProductDetail 
                product={activeProduct} 
                onClose={back}
                onSelectProduct={handleSelectProduct}
                onOpenCheckout={() => triggerAuthRequired(() => openPanel('commande'))}
              />
            )}

            {currentView === 'produit' && !activeProduct && (
              <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <button type="button" id="btn-back-to-boutique" onClick={back}
                  className="inline-flex min-h-11 items-center gap-2 text-sm text-neutral-300 hover:text-amber-400">
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {language === 'FR' ? 'Retour' : 'Back'}
                </button>
                <p role="status" className="mt-6 text-neutral-400">
                  {productsLoading ? (language === 'FR' ? 'Chargement...' : 'Loading...')
                    : (language === 'FR' ? 'Cet article est indisponible.' : 'This item is unavailable.')}
                </p>
              </div>
            )}

            {currentView === 'about' && (
              <AboutUs />
            )}

            {currentView === 'contact' && (
              <ContactUs />
            )}
            {currentView === 'verification' && route.verificationToken && <InvoiceVerification token={route.verificationToken} />}

            {currentView === 'aide' && (
              <CustomerCare />
            )}

            {currentView === 'account' && <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><Suspense fallback={<p role="status">{language === 'FR' ? 'Chargement…' : 'Loading…'}</p>}><OrderWorkspace key={user?.id || 'guest'} role="client" /></Suspense></div>}
            {currentView === 'driver' && <Suspense fallback={<p role="status">{language === 'FR' ? 'Chargement…' : 'Loading…'}</p>}><DriverWorkspace key={user?.id || 'guest'} /></Suspense>}

            {currentView === 'god' && (
              <Suspense fallback={<p role="status" className="p-6">{language === 'FR' ? 'Chargement...' : 'Loading...'}</p>}><GodDashboard /></Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. Luxury Footer Block */}
      <Footer setView={setView} />

      {/* 6. Floating AI Customer Concierge Support Chatbot */}
      <LuxuryChatbot />

      {/* 6.5. User Account Authentication Dialog Overlay */}
      <AuthModal />

      {/* 7. Signature billing and checkout dialog overlay */}
      {showCheckout && !authLoading && user && (
        <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">{language === 'FR' ? 'Chargement...' : 'Loading...'}</div>}><CheckoutModal
          onClose={closePanel}
          onOrderSuccess={handleOrderSubmitted}
        /></Suspense>
      )}
      {showCheckout && (authLoading || !user) && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-5 text-center">
            <p role="status">{authLoading ? (language === 'FR' ? 'Vérification de votre session...' : 'Checking your session...')
              : (language === 'FR' ? 'Connectez-vous pour retrouver votre commande.' : 'Sign in to access your order.')}</p>
            {!authLoading && <button type="button" onClick={() => triggerAuthRequired(() => {})}
              className="min-h-11 px-5 rounded bg-amber-400 text-black">{language === 'FR' ? 'Se connecter' : 'Sign in'}</button>}
            <button type="button" onClick={closePanel} className="block mx-auto min-h-11 text-neutral-300">{language === 'FR' ? 'Retour' : 'Back'}</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <NavigationProvider>
      <AppProvider>
        <NotificationsProvider><AppInner /></NotificationsProvider>
      </AppProvider>
    </NavigationProvider>
  );
}
