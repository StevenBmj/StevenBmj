/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import IntroScreen from './components/IntroScreen';
import HomeHero from './components/HomeHero';
import Boutique from './components/Boutique';
import ProductDetail from './components/ProductDetail';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import GodDashboard from './components/GodDashboard';
import CustomerCare from './views/CustomerCare';
import AboutUs from './views/AboutUs';
import ContactUs from './views/ContactUs';
import LuxuryChatbot from './components/LuxuryChatbot';
import AuthModal from './components/AuthModal';
import { Product } from './types';

function AppInner() {
  const { language, hasIntroPlayed, setHasIntroPlayed, triggerAuthRequired } = useApp();
  
  // Custom router state: 'home' | 'boutique' | 'aide' | 'god' | 'produit'
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Monitor url matching '/god' for professional and confidential routing
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/god' || path.endsWith('/god') || hash === '#/god' || hash === '#god') {
        setCurrentView('god');
      }
    };
    
    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, []);

  // Quick select product from Boutique catalog listing
  const handleSelectProduct = (product: Product) => {
    setActiveProduct(product);
    setCurrentView('produit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSubmitted = (order: any) => {
    // Loyalty, orders logs or analytics are pushed on server side
    console.log("Order logged successfully inside server", order);
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col justify-between selection:bg-amber-400 selection:text-black overflow-x-hidden w-full">
      
      {/* 1. Cinematic Entry Intro Screen if unplayed yet */}
      {!hasIntroPlayed && (
        <IntroScreen 
          language={language} 
          onComplete={() => setHasIntroPlayed(true)} 
        />
      )}

      {/* 2. Global Navbar Header */}
      <Header currentView={currentView} setView={setCurrentView} onOpenWishlist={() => setCurrentView('boutique')} />

      {/* 3. Sliding Shopping Bag Cart Drawer overlay */}
      <CartDrawer onCheckout={() => triggerAuthRequired(() => setShowCheckout(true))} />
 
      {/* 4. Active Main Views router with high-prestige cinematic motion transitions */}
      <main className="flex-1 overflow-x-hidden w-full pt-[116px] md:pt-[112px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {currentView === 'home' && (
              <HomeHero setView={setCurrentView} />
            )}
 
            {currentView === 'boutique' && (
              <Boutique onSelectProduct={handleSelectProduct} />
            )}
 
            {currentView === 'produit' && activeProduct && (
              <ProductDetail 
                product={activeProduct} 
                onClose={() => setCurrentView('boutique')} 
                onSelectProduct={handleSelectProduct}
                onOpenCheckout={() => triggerAuthRequired(() => setShowCheckout(true))}
              />
            )}

            {currentView === 'about' && (
              <AboutUs />
            )}

            {currentView === 'contact' && (
              <ContactUs />
            )}

            {currentView === 'aide' && (
              <CustomerCare />
            )}

            {currentView === 'god' && (
              <GodDashboard />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 5. Luxury Footer Block */}
      <Footer setView={setCurrentView} />

      {/* 6. Floating AI Customer Concierge Support Chatbot */}
      <LuxuryChatbot />

      {/* 6.5. User Account Authentication Dialog Overlay */}
      <AuthModal />

      {/* 7. Signature billing and checkout dialog overlay */}
      {showCheckout && (
        <CheckoutModal 
          onClose={() => setShowCheckout(false)} 
          onOrderSuccess={handleOrderSubmitted}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
