/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Order, PromoCode, AppSettings } from '../types';
import Logo from './Logo';
import { 
  BarChart, Sparkles, Plus, Edit2, Trash2, Tag, Percent, 
  Settings, Search, RefreshCw, Layers, ShieldAlert, Users, 
  HelpCircle, CheckCircle, Clock, Ban, Check, AlertOctagon, CheckSquare,
  Megaphone, Send, Mail, MessageSquare, PhoneCall, Star, LogOut, Eye, EyeOff
} from 'lucide-react';

export default function GodDashboard() {
  const { language, formatPrice, user, setUser, fetchProducts, fetchSettings } = useApp();
  
  // Tabs of "God" dashboard
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'promos' | 'users' | 'settings' | 'security' | 'announcements' | 'reviews'>('analytics');
  
  // Security authentications
  const [isAuthorized, setIsAuthorized] = useState(() => {
    const isSessionAuth = sessionStorage.getItem('sbmj_admin_auth') === 'true';
    return isSessionAuth;
  });
  
  const [adminUsername, setAdminUsername] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [showAdminLoginPassword, setShowAdminLoginPassword] = useState(false);
  const [showAdminRecoverPassword, setShowAdminRecoverPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showGoogleSim, setShowGoogleSim] = useState(false);

  // Sync authorization with global user state
  useEffect(() => {
    if (user && user.isAdmin) {
      setIsAuthorized(true);
      sessionStorage.setItem('sbmj_admin_auth', 'true');
    } else {
      setIsAuthorized(false);
      sessionStorage.removeItem('sbmj_admin_auth');
    }
  }, [user]);

  // Notifications system per administrative section
  const [sectionNotifications, setSectionNotifications] = useState<{ [key: string]: number }>({
    analytics: 3,
    products: 1,
    orders: 2,
    promos: 0,
    users: 4,
    settings: 0,
    security: 5,
    announcements: 1,
    reviews: 0,
  });

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

  // VIP Clientèle Search & Editing Form
  const [vipSearchQuery, setVipSearchQuery] = useState('');
  const [editingVip, setEditingVip] = useState<{ id?: string; customerName: string; whatsapp: string; email: string; orderCount?: number } | null>(null);
  const [showVipForm, setShowVipForm] = useState(false);
  const [manualVips, setManualVips] = useState<{ id: string; customerName: string; whatsapp: string; email: string; orderCount: number }[]>(() => {
    const saved = localStorage.getItem('sbmj_manual_vips');
    return saved ? JSON.parse(saved) : [];
  });

  // Dual messaging states from StevenBmj
  const [selectedVipForMsg, setSelectedVipForMsg] = useState<any | null>(null);
  const [vipMsgBody, setVipMsgBody] = useState('');
  const [vipMsgSuccess, setVipMsgSuccess] = useState(false);

  // Analytics filter state
  const [analyticsFilter, setAnalyticsFilter] = useState<'week' | 'month' | 'year'>('week');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Form states for Product management
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);

  // Form states for Promos
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [newPromo, setNewPromo] = useState<Partial<PromoCode>>({ code: '', discountPercentage: 10, active: true });
  const [promoDurationHours, setPromoDurationHours] = useState('24');

  // Invoice / Order Search State
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);

  // Security LOG Search States
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logSearchDate, setLogSearchDate] = useState('');

  // Real Registered Client Accounts from server database
  const [backendUsers, setBackendUsers] = useState<any[]>([]);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '' });
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');

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
          announcementText: "✨ EXPÉDITION PRIVÉE OFFERTE DANS TOUT LE GOLFE DE GUINÉE & À L'INTERNATIONAL SUR TOUTES NOS COLLECTIONS D'EXCEPTION ✨",
          announcementTextEn: "✨ FREE PRIVATE COURIER DELIVERY IN WEST AFRICA & WORLDWIDE ACROSS ALL EXQUISITE COLLECTIONS ✨",
          homepageHeroTitle: "L'ÉLÉGANCE À L'ÉTAT BRUT",
          homepageHeroTitleEn: "RAW AND PURE ELEGANCE",
          homepageHeroSubtitle: "Découvrez notre collection exclusive de montres de prestige, costumes de créateurs et joallerie de haute facture pour l'homme d'action moderne.",
          homepageHeroSubtitleEn: "Explore our exclusive collection of prestige watches, bespoke tailoring, and majestic fine jewelry curated for the modern master of action.",
          homepageHeroImage1: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600&auto=format&fit=crop",
          homepageHeroImage2: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1600&auto=format&fit=crop",
          homepageHeroImage3: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1600&auto=format&fit=crop",
          whatsappContact: "+22955468138",
          taxRate: 0,
          aboutTitle: "MAISON STEVENBMJ — L'OR ET LA COMPLICATION",
          aboutTitleEn: "MAISON STEVENBMJ — RAW PRECIOUS MASS & COMPLICATIONS",
          aboutContent: "Fondée sur le principe de la souveraineté esthétique absolue, la Maison StevenBmj fusionne l'artisanat milanais avec l'ingénierie horlogère suisse de pointe. Chaque pièce de notre catalogue est sculptée dans des matières nobles : or pur 24K, diamants rutilants de pureté VVS1, et cuirs au tannage minéral d'exception.",
          aboutContentEn: "Founded on the principle of absolute aesthetic sovereignty, Maison StevenBmj fuses Milanese sartorial mastery with top-tier Swiss watchmaking. Every single piece in our vault is meticulously carved out of pristine elements: raw 24K gold, blazing VVS1 diamonds, and hand-tanned grade-A full grain leathers.",
          contactTitle: "SALON PRIVÉ & SERVICES CONCIERGERIE",
          contactTitleEn: "PRIVATE VAULT & CONCIERGE SERVICES",
          contactAddress: "Avenue du Prestige, Quartier Akpakpa, Cotonou, Bénin. (En face de la Zone Résidentielle)",
          contactAddressEn: "Prestige Avenue, Akpakpa District, Cotonou, Benin. (Opposite the Residential Enclave)",
          googleMapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.482701053427!2d2.463388!3d6.360155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x102355db7cb9b51%3A0xbc78051743e47fdc!2sAkpakpa%2C%20Cotonou!5e0!3m2!1sfr!2sbj!4v1700000000000",
          adminPassword: "stevenbmj123",
          careTitle: "ATELIER CARE & SOUVERAINETÉ",
          careTitleEn: "ATELIER SOUVERAIN CARE",
          careContent: "Une question sur une taille, un ajustement sur-mesure ou une commande haute couture ? Notre service de conciergerie privée vous répond sous 15 minutes, 24/7.",
          careContentEn: "Any height adjustment or custom sewing request? Our private elite concierge will reply within 15 minutes, 24/7.",
          footerText: "StevenBmj est une marque déposée de la Maison de Haute Couture Souveraine. L'élégance n'est pas une attitude, c'est une complication.",
          footerTextEn: "StevenBmj is a registered trademark of the Sovereign Haute Couture House. Elegance is not an attitude, it is a complication.",
          footerCredits: "© 2026 StevenBmj. Conçu pour l'élite mondiale.",
          footerCreditsEn: "© 2026 StevenBmj. Curated for the global elite.",
          storyTitleFr: "L'Art de Vivre sans Compromis sur le Raffinement",
          storyTitleEn: "The Craft of Absolute and Timeless Masculine Silhouette",
          storyDescFr: "Fondée sur l'excellence horlogère des plus hauts calibres, la Maison StevenBmj imagine un vestiaire d'exception où s'unissent des lignes géométriques avant-gardistes et une orfèvrerie étincelante. Nos diamants sont sertis main et nos mocassins crêpes taillés dans les plus hauts grades de suède d'Italie.",
          storyDescEn: "Formed upon the highest peaks of horological art, the Maison StevenBmj crafts an elite gentlemen vestiary merging sharp architectural lines with glittering hand-paved 18k diamonds and authentic Italian crepe loafers.",
          storyImage: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=600&auto=format&fit=crop",
          fabric1TitleFr: "Tissu de Prestige \"Good Luck\"",
          fabric1TitleEn: "Prestige Fabric \"Good Luck\"",
          fabric1DescFr: "Tissage jacquard de soie d'une brillance spectaculaire aux arabesques dorées, plébiscitée par l'élite et apportant bénédiction et fortune aux chefs d'influence.",
          fabric1DescEn: "Spectacular silk jacquard weave with golden arabesques, favored by elite circles, believed to summon luxury and fortune.",
          fabric1Image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop",
          fabric2TitleFr: "Super-Wax Vlisco Hollandais",
          fabric2TitleEn: "Authentic Vlisco Dutch Super-Wax",
          fabric2DescFr: "L'authentique pièce de coton dense double face à base de cire naturelle. Couleurs inaltérables et tracés millimétriques d'une pureté de design extraordinaire.",
          fabric2DescEn: "The original high-density double-sided cotton wax premium block. Natural waxes and precision designs.",
          fabric2Image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop",
          fabric3TitleFr: "Brocart de Soie de Saint-Gall",
          fabric3TitleEn: "Swiss St. Gallen Silk Brocade",
          fabric3DescFr: "Importé du canton historique textile en Suisse. Un satin broché rigide sculpté en reliefs d'or pour dessiner les plus prestigieux apparats souverains de la haute noblesse.",
          fabric3DescEn: "Imported from the historical Swiss textile capital. Stiff satin broché carved with gold relief.",
          fabric3Image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=600&auto=format&fit=crop",
          bento1TitleFr: "Horlogerie Royale de Prestige",
          bento1TitleEn: "Royal Horology of Prestige",
          bento1DescFr: "Chronographes automatiques d'influence à remontage automatique, verre saphir inrayable et boîtiers lunettes cannelées.",
          bento1DescEn: "Self-winding automatic influence chronographs, scratch-resistant sapphire crystal and fluted bezels.",
          bento1Image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
          bento2TitleFr: "Maillons & Or 18k",
          bento2TitleEn: "Chains & 18k Gold",
          bento2DescFr: "Chaînes de cou iconiques, bagues biseautées et bracelets massifs en or pur.",
          bento2DescEn: "Iconic neck chains, heavy bevelled rings and massive pure gold bracelets.",
          bento2Image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop",
          bento3TitleFr: "Crepe Loafers & Silouhettes",
          bento3TitleEn: "Crepe Loafers & Silhouettes",
          bento3DescFr: "Mocassins luxurieux à semelle gomme crêpe naturelle, alliance ultime du confort et de l'élégance.",
          bento3DescEn: "Luxurious loafers featuring natural crepe rubber soles, the ultimate alliance of comfort and sharp elegance.",
          bento3Image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop",
          bento4TitleFr: "Tailoring & Costumes sur Mesure",
          bento4TitleEn: "Tailoring & Bespoke Suits",
          bento4DescFr: "Laine extra-fine mérinos, cachemire doublé et vestes structurées croisées aux boutons ciselés d'or.",
          bento4DescEn: "Extra-fine merino wool, full cashmere double lining, and double-breasted jackets.",
          bento4Image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=1600&auto=format&fit=crop"
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

      // Client Accounts from Database
      const resU = await fetch('/api/auth/users');
      if (resU.ok) setBackendUsers(await resU.json());
    } catch (err) {
      console.error("Error loaded admin dashboard data", err);
    }
  };

  useEffect(() => {
    const pendingCount = reviewsList.filter(r => r.status === 'pending').length;
    setSectionNotifications(prev => ({
      ...prev,
      reviews: pendingCount
    }));
  }, [reviewsList]);

  useEffect(() => {
    fetchAllGodData();
  }, []);

  // Hydrate Analytics charts
  useEffect(() => {
    const fetchAnalytics = async () => {
      setAnalyticsLoading(true);
      try {
        const res = await fetch(`/api/analytics?filter=${analyticsFilter}`);
        if (res.ok) {
          setAnalyticsData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [analyticsFilter]);

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

  const handlePrintInvoice = (order: any) => {
    if (!order) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres contextuelles (popups) pour imprimer la facture.");
      return;
    }
    
    const invoiceHtml = `
      <html>
        <head>
          <title>Facture StevenBmj - Reference: ${order.id}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { background-color: #ffffff; color: #121212; font-family: sans-serif; padding: 40px; }
            .print-container { max-width: 800px; margin: 0 auto; border: 4px double #d97706; padding: 30px; border-radius: 8px; }
            .font-mono { font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="flex justify-between items-center border-b border-yellow-600 pb-6 mb-6">
              <div class="flex items-center space-x-3" style="display: flex; align-items: center;">
                <img src="/logo.png" alt="StevenBmj" width="60" height="60" style="width:60px;height:60px;border-radius:9999px;object-fit:cover;" />
                <div style="text-align: left; margin-left: 10px;">
                  <div style="font-size: 24px; color: #b45309; font-weight: 300; letter-spacing: 0.25em; font-family: sans-serif; text-transform: uppercase; line-height: 1;">StevenBmj</div>
                  <div style="font-size: 7px; color: #4b5563; font-weight: 600; letter-spacing: 0.35em; font-family: monospace; text-transform: uppercase; margin-top: 3px;">HAUTE COUTURE & JOAILLERIE</div>
                </div>
              </div>
              <div class="text-right text-xs font-mono">
                <p class="font-bold text-red-600 text-sm">REÇU DE FACTURATION ACQUITTÉ</p>
                <p>RÉF: ${order.id}</p>
                <p>DATE: ${new Date(order.date).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-6 text-xs mb-6 pb-6 border-b border-gray-200">
              <div>
                <h3 class="text-[#d97706] font-bold uppercase mb-2 font-mono">Destinataire VIP</h3>
                <p class="font-bold uppercase text-sm">${order.customerName}</p>
                <p>WhatsApp: ${order.whatsapp}</p>
                <p>Adresse: ${order.address}, ${order.city}</p>
                ${order.notes ? `<p class="italic text-gray-500 mt-2">Notes d'atelier: ${order.notes}</p>` : ''}
              </div>
              <div class="text-right">
                <h3 class="text-gray-500 font-bold uppercase mb-2 font-mono">Maison E-Commerce</h3>
                <p class="font-bold">StevenBmj East Africa SARL</p>
                <p>Siège Cotonou, Bénin</p>
                <p>Avenue du Prestige, Akpakpa</p>
                <p class="font-mono">Concierge: +22955468138</p>
              </div>
            </div>

            <table class="w-full text-left text-xs mb-6 border-collapse">
              <thead>
                <tr class="border-b border-yellow-600 font-mono text-gray-700">
                  <th class="pb-3 text-left">SÉLECTION / CRÉATION</th>
                  <th class="pb-3 text-center">QUANTITÉ</th>
                  <th class="pb-3 text-right">PRIX UNITAIRE</th>
                  <th class="pb-3 text-right">MONTANT TOTAL</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 font-mono text-xs">
                ${order.items.map((item: any) => `
                  <tr>
                    <td class="py-4">
                      <p class="font-sans font-bold text-sm">${item.productName}</p>
                      ${item.selectedSize ? `<p class="text-[10px] text-yellow-700">Taille: ${item.selectedSize}</p>` : ''}
                    </td>
                    <td class="py-4 text-center">${item.quantity}</td>
                    <td class="py-4 text-right">${item.price.toLocaleString('fr-FR')} €</td>
                    <td class="py-4 text-right font-bold">${(item.price * item.quantity).toLocaleString('fr-FR')} €</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="flex justify-between items-center border-t border-yellow-600 pt-6">
              <div class="flex items-center space-x-4">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=121212&bgcolor=ffffff&data=${encodeURIComponent(
                    `REÇU SOUVERAIN N° ${order.id}\nCLIENT: ${order.customerName}\nTOTAL: ${order.totalPrice.toLocaleString('fr-FR')} EUR\nSTEVENBMJ AUTHENTICITY GUARANTEED`
                  )}"
                  class="w-16 h-16 object-contain"
                />
                <div class="text-left font-mono">
                  <p class="text-[9px] text-[#d97706] font-bold">CERTIFICAT SBMJ</p>
                  <p class="text-[8px] text-gray-500 leading-tight">Cet achat est scellé sous le label de prestige StevenBmj.</p>
                </div>
              </div>
              <div class="text-right font-mono">
                <p class="text-xs text-gray-500 font-bold">LIVRAISON PRIVÉE SBMJ : <span class="text-green-600 font-bold">INCLUSE</span></p>
                <p class="text-sm mt-1">MONTANT PAYÉ APPRÉCIÉ :</p>
                <p class="text-xl font-bold text-yellow-600">${order.totalPrice.toLocaleString('fr-FR')} €</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  // Create Product Submit handler
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price) return;
    
    // Auto populate defaults
    const payload = {
      ...editingProduct,
      specs: editingProduct.specs || [
        { key: "Origine / Origin", value: "Atelier Paris" },
        { key: "Garantie", value: "Certifiée Authentique (2 Ans)" }
      ],
      images: editingProduct.images && editingProduct.images.length > 0
        ? editingProduct.images
        : ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop"]
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Voulez-vous supprimer ce produit d'exception ?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
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
  const handleDeleteBackendUser = async (userId: string) => {
    if (!confirm(language === 'FR' ? "Êtes-vous sûr de vouloir supprimer définitivement ce compte client ?" : "Are you sure you want to permanently delete this customer account?")) return;
    try {
      const res = await fetch(`/api/auth/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setBackendUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Erreur de suppression / Deletion error");
      }
    } catch (err) {
      console.error("Error deleting user account", err);
    }
  };

  // Wipe all registered customer accounts
  const handleWipeAllBackendUsers = async () => {
    if (!confirm(language === 'FR' ? "ATTENTION : Êtes-vous certain de vouloir EFFACER TOUS les comptes clients ? Cette action est irréversible." : "WARNING: Are you absolutely sure you want to WIPE ALL customer accounts? This action is irreversible.")) return;
    try {
      const res = await fetch('/api/auth/users', { method: 'DELETE' });
      if (res.ok) {
        setBackendUsers([]);
        alert(language === 'FR' ? "Tous les comptes clients ont été effacés avec succès." : "All customer accounts have been wiped successfully.");
      } else {
        alert("Erreur / Error");
      }
    } catch (err) {
      console.error("Error wiping all client accounts", err);
    }
  };

  // Create/register a new customer account
  const handleCreateBackendUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserSuccess('');

    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      setCreateUserError(language === 'FR' ? "Veuillez remplir tous les champs obligatoires." : "Please fill in all required fields.");
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      const data = await res.json();
      if (res.ok) {
        setCreateUserSuccess(language === 'FR' ? "Compte client créé avec succès !" : "Customer account created successfully!");
        setNewUserData({ name: '', email: '', password: '' });
        setShowCreateUserForm(false);
        // Reload users
        const resU = await fetch('/api/auth/users');
        if (resU.ok) setBackendUsers(await resU.json());
      } else {
        setCreateUserError(data.error || "Erreur lors de la création.");
      }
    } catch (err) {
      setCreateUserError(language === 'FR' ? "Erreur de connexion intermittente." : "Intermittent connection error.");
    }
  };

  // manual VIP actions
  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVip?.customerName || !editingVip?.whatsapp) return;
    
    if (editingVip.id) {
      // update
      setManualVips(prev => {
        const next = prev.map(v => v.id === editingVip.id ? { ...v, ...editingVip } as any : v);
        localStorage.setItem('sbmj_manual_vips', JSON.stringify(next));
        return next;
      });
    } else {
      // create
      const newV = {
        id: `vip-${Date.now()}`,
        customerName: editingVip.customerName,
        whatsapp: editingVip.whatsapp,
        email: editingVip.email || `${editingVip.customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        orderCount: editingVip.orderCount || 0
      };
      setManualVips(prev => {
        const next = [...prev, newV];
        localStorage.setItem('sbmj_manual_vips', JSON.stringify(next));
        return next;
      });
    }
    
    setEditingVip(null);
    setShowVipForm(false);
  };

  const handleDeleteVip = (id: string) => {
    if (!window.confirm("Voulez-vous révoquer les accès privilégiés de ce client VIP ?")) return;
    setManualVips(prev => {
      const next = prev.filter(v => v.id !== id);
      localStorage.setItem('sbmj_manual_vips', JSON.stringify(next));
      return next;
    });
  };

  // handle dual channel instant simulation
  const handleSendDualVipMessage = (vip: any) => {
    if (!vipMsgBody.trim()) return;
    setSelectedVipForMsg(vip);
    setVipMsgSuccess(true);
    // Auto clear simulation banner after delay
    setTimeout(() => {
      setVipMsgSuccess(false);
      setVipMsgBody('');
      setSelectedVipForMsg(null);
    }, 6000);
  };

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
      if (res.ok) {
        alert("Paramètres mis à jour avec succès dans db_store.json");
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Voulez-vous purifier et vider intégralement l'historique des logs cyber-securité ?")) return;
    try {
      const res = await fetch('/api/security-logs', { method: 'DELETE' });
      if (res.ok) {
        fetchAllGodData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // SVG Chart Render Helper: Graphique 1: Évolution financière (Ventes, Bénéfices, Revenus, Pertes)
  const drawFinancialChartSvg = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return null;
    
    const svgWidth = 600;
    const svgHeight = 220;
    const padding = 40;
    const graphWidth = svgWidth - padding * 2;
    const graphHeight = svgHeight - padding * 2;

    const maxVal = Math.max(...analyticsData.map(d => Math.max(d.ventes, d.revenus, d.benefices)), 1000) * 1.1;

    const pointsVentes = analyticsData.map((d, i) => {
      const x = padding + (i / (analyticsData.length - 1)) * graphWidth;
      const y = svgHeight - padding - (d.ventes / maxVal) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    const pointsBenefices = analyticsData.map((d, i) => {
      const x = padding + (i / (analyticsData.length - 1)) * graphWidth;
      const y = svgHeight - padding - (d.benefices / maxVal) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
        {/* Grids background */}
        <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
            <line 
              key={idx} 
              x1={padding} 
              y1={padding + ratio * graphHeight} 
              x2={svgWidth - padding} 
              y2={padding + ratio * graphHeight} 
            />
          ))}
        </g>

        {/* Financial Lines */}
        {/* Ventes line: Golden */}
        <polyline
          fill="none"
          stroke="#D97706"
          strokeWidth="3.5"
          points={pointsVentes}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Benefices: Green emerald */}
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          points={pointsBenefices}
          strokeDasharray="4 2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points pins glowing */}
        {analyticsData.map((d, i) => {
          const x = padding + (i / (analyticsData.length - 1)) * graphWidth;
          const y = svgHeight - padding - (d.ventes / maxVal) * graphHeight;
          return (
            <g key={i} className="group cursor-help">
              <circle cx={x} cy={y} r="5" fill="#D97706" />
              <circle cx={x} cy={y} r="10" fill="#D97706" opacity="0.15" />
              <title>{`${d.name}: Ventes ${formatPrice(d.ventes)} / Bénéfice ${formatPrice(d.benefices)}`}</title>
            </g>
          );
        })}

        {/* Axes labels */}
        <text x={padding} y={svgHeight - 15} fill="#666" fontSize="9" fontFamily="monospace">DEB</text>
        <text x={svgWidth - padding} y={svgHeight - 15} fill="#666" fontSize="9" fontFamily="monospace" textAnchor="end">FIN</text>
        <text x={padding - 5} y={padding + 5} fill="#666" fontSize="9" fontFamily="monospace" textAnchor="end">{formatPrice(maxVal)}</text>
      </svg>
    );
  }, [analyticsData, analyticsFilter]);

  // SVG Chart Render Helper: Graphique 2: Visiteurs, Clics, Conversions
  const drawTrafficChartSvg = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return null;
    
    const svgWidth = 600;
    const svgHeight = 220;
    const padding = 40;
    const graphWidth = svgWidth - padding * 2;
    const graphHeight = svgHeight - padding * 2;

    const maxVal = Math.max(...analyticsData.map(d => Math.max(d.visiteurs, d.clics)), 100) * 1.1;

    const pointsVisiteurs = analyticsData.map((d, i) => {
      const x = padding + (i / (analyticsData.length - 1)) * graphWidth;
      const y = svgHeight - padding - (d.visiteurs / maxVal) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    const pointsClics = analyticsData.map((d, i) => {
      const x = padding + (i / (analyticsData.length - 1)) * graphWidth;
      const y = svgHeight - padding - (d.clics / maxVal) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
        {/* Grids */}
        <g stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
            <line 
              key={idx} 
              x1={padding} 
              y1={padding + ratio * graphHeight} 
              x2={svgWidth - padding} 
              y2={padding + ratio * graphHeight} 
            />
          ))}
        </g>

        {/* Traffic Line: Space Cyber Purple/White */}
        <polyline
          fill="none"
          stroke="#6366F1"
          strokeWidth="3.5"
          points={pointsVisiteurs}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2"
          points={pointsClics}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points pins */}
        {analyticsData.map((d, i) => {
          const x = padding + (i / (analyticsData.length - 1)) * graphWidth;
          const y = svgHeight - padding - (d.visiteurs / maxVal) * graphHeight;
          return (
            <g key={i} className="group cursor-help">
              <circle cx={x} cy={y} r="5" fill="#6366F1" />
              <title>{`${d.name}: ${d.visiteurs} Visiteurs / Conversion ${d.conversion}%`}</title>
            </g>
          );
        })}

        {/* Labels */}
        <text x={padding} y={svgHeight - 15} fill="#666" fontSize="9" fontFamily="monospace">DEB</text>
        <text x={svgWidth - padding} y={svgHeight - 15} fill="#666" fontSize="9" fontFamily="monospace" textAnchor="end">FIN</text>
        <text x={padding - 5} y={padding + 5} fill="#666" fontSize="9" fontFamily="monospace" textAnchor="end">{maxVal.toFixed(0)}</text>
      </svg>
    );
  }, [analyticsData, analyticsFilter]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = settings?.adminPassword || "stevenbmj123";
    const userEmail = adminUsername.trim().toLowerCase();
    
    if (userEmail === 'stevenamorin202@gmail.com' && adminLoginPassword === correctPassword) {
      sessionStorage.setItem('sbmj_admin_auth', 'true');
      setIsAuthorized(true);
      setLoginError('');
      setUser({
        id: 'admin',
        name: "StevenBmj Admin",
        email: "stevenamorin202@gmail.com",
        isAdmin: true,
        vipPoints: 99999
      });
    } else {
      setLoginError(language === 'FR' ? "Identifiants administratifs incorrects. (Seul 'stevenamorin202@gmail.com' est autorisé)" : "Incorrect administrative credentials. (Only 'stevenamorin202@gmail.com' is accredited)");
    }
  };

  const handleAdminGoogleLogin = (emailStr: string) => {
    if (emailStr.trim().toLowerCase() === 'stevenamorin202@gmail.com') {
      sessionStorage.setItem('sbmj_admin_auth', 'true');
      setIsAuthorized(true);
      setLoginError('');
      setUser({
        id: 'admin',
        name: "StevenBmj Admin",
        email: "stevenamorin202@gmail.com",
        isAdmin: true,
        vipPoints: 99999
      });
      setShowGoogleSim(false);
    } else {
      setLoginError(language === 'FR' ? "Ce compte Google n'a pas les droits d'administration." : "This Google account lacks admin accreditation.");
    }
  };

  const sendAdminSecurityCode = async () => {
    setLoginError('');
    setAdminCodeSentFeedback('');
    const targetEmail = recoverEmail.trim().toLowerCase();
    if (!targetEmail) {
      setLoginError(language === 'FR' ? "Veuillez d'abord saisir l'adresse e-mail." : "Please input email first.");
      return;
    }
    if (targetEmail !== 'stevenamorin202@gmail.com') {
      setLoginError(language === 'FR' ? "Identifiant interdit." : "Disallowed email identity.");
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
    if (targetEmail !== 'stevenamorin202@gmail.com') {
      setLoginError(language === 'FR' ? "Droit de modification refusé. Seul 'stevenamorin202@gmail.com' peut modifier le mot de passe." : "Override denied. Only 'stevenamorin202@gmail.com' can modify the administrative password.");
      return;
    }

    try {
      const res = await fetch('/api/auth/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: adminSecurityCode, newPassword: recoverNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setRecoverSuccessMsg(language === 'FR' ? "Le nouveau mot de passe a été programmé avec succès !" : "New secret passcode was successfully overwrote!");
        if (settings) {
          setSettings({ ...settings, adminPassword: recoverNewPassword });
        }
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

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-left" id="admin-login-screen">
        <div className="bg-neutral-950 border border-white/10 rounded-lg p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-red-600" />
          
          <div className="flex flex-col items-center space-y-2 text-center">
            <Logo size={60} />
            <span className="text-xs font-mono tracking-[0.3em] text-red-500 uppercase font-bold">PORTAIL PRIVÉ SECURISE</span>
            <h2 className="text-xl font-light text-white uppercase tracking-widest font-sans">STEVENBMJ ADMIN (GOD)</h2>
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
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">E-Mail d'Administration *</label>
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
          ) : showGoogleSim ? (
            <div className="space-y-4 py-4 animate-fade-in">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  {language === 'FR' ? "Comptes Google Détectés" : "Detected Google Accounts"}
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  id="btn-admin-google-select-real"
                  onClick={() => handleAdminGoogleLogin('stevenamorin202@gmail.com')}
                  className="w-full p-3 bg-neutral-900 border border-white/10 hover:border-red-500/50 rounded flex items-center gap-3 text-left hover:bg-neutral-900/60 duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-red-950/20 border border-red-500/30 text-red-500 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                    SA
                  </div>
                  <div>
                    <h4 className="text-xs text-white font-semibold leading-none">Steven Amorin</h4>
                    <span className="text-[10px] text-neutral-500 font-mono">stevenamorin202@gmail.com</span>
                  </div>
                </button>

                <button
                  id="btn-admin-google-select-wrong"
                  onClick={() => handleAdminGoogleLogin('wrong@example.com')}
                  className="w-full p-3 bg-neutral-900 border border-white/10 hover:border-red-500/50 rounded flex items-center gap-3 text-left hover:bg-neutral-900/60 duration-200 cursor-pointer opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 text-neutral-400 font-mono flex items-center justify-center text-xs shrink-0">
                    UK
                  </div>
                  <div>
                    <h4 className="text-xs text-white font-semibold leading-none">Unknown Intruder</h4>
                    <span className="text-[10px] text-neutral-500 font-mono">unknown@example.com</span>
                  </div>
                </button>
              </div>

              <button
                id="btn-admin-cancel-google"
                onClick={() => setShowGoogleSim(false)}
                className="w-full py-2 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white rounded font-mono text-[10px] uppercase cursor-pointer"
              >
                {language === 'FR' ? "Retour au formulaire classique" : "Return to credentials"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">Identifiant / E-Mail *</label>
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
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">Code Secret d'Accès *</label>
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
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono text-[10.5px] font-bold uppercase tracking-widest rounded cursor-pointer duration-300 transition-all active:scale-[0.98] text-center"
              >
                ÉTABLIR LA CONNEXION DIRECTE
              </button>

              <div className="relative flex py-1.5 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-neutral-600 text-[9px] font-mono">OU</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <button
                id="btn-admin-google-auth-trigger"
                type="button"
                onClick={() => {
                  setAdminUsername('stevenamorin202@gmail.com');
                  setShowGoogleSim(true);
                }}
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
            * Connexion chiffrée de niveau militaire. Toute tentative d'intrusion sera consignée dans le journal de pare-feu.
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
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-bold">STEVENBMJ COGNITIVE CORE SECURED</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-widest uppercase font-sans">
            God Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Régie souveraine, pare-feu logicie-cyber, base de données isolée et monitoring d'activité d'exception.
          </p>
        </div>

        {/* Admin profile logo */}
        <div className="flex items-center space-x-3 bg-neutral-900/60 p-4 border border-white/5 rounded-lg shrink-0">
          <Logo size={40} className="stroke-red-500" />
          <div className="text-left font-mono">
            <p className="text-xs text-white font-bold tracking-widest uppercase">ROLE_GOD_SYSTEM</p>
            <p className="text-[9px] text-neutral-500">ROOT@STEVENBMJ.SECURE</p>
          </div>
        </div>
      </div>

      {/* Main grids of administration dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-8">
        
        {/* Navigation Admin Controls Menus sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'analytics', label: 'ANALYTICS PRESTIGE', icon: <BarChart className="w-4 h-4" /> },
            { id: 'products', label: 'GESTION PRODUITS', icon: <Layers className="w-4 h-4" /> },
            { id: 'orders', label: 'GESTION COMMANDES', icon: <CheckSquare className="w-4 h-4" /> },
            { id: 'promos', label: 'CODES PROMOTIONS', icon: <Percent className="w-4 h-4" /> },
            { id: 'announcements', label: 'ANNONCES GENERALES', icon: <Megaphone className="w-4 h-4 text-red-400" /> },
            { id: 'users', label: 'CLIENTÈLE VIP', icon: <Users className="w-4 h-4 text-amber-400" /> },
            { id: 'reviews', label: 'AVIS CLIENTÈLE', icon: <MessageSquare className="w-4 h-4 text-emerald-400" /> },
            { id: 'settings', label: 'CONFIGURATION SITE', icon: <Settings className="w-4 h-4" /> },
            { id: 'security', label: 'CYBER PARE-FEU', icon: <ShieldAlert className="w-4 h-4" /> },
          ].map((item) => (
            <button
              id={`btn-admin-tab-${item.id}`}
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSectionNotifications(prev => ({
                  ...prev,
                  [item.id]: 0
                }));
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
              setUser(null);
              sessionStorage.removeItem('sbmj_admin_auth');
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
        <div className="lg:col-span-4 bg-neutral-950/40 border border-white/5 rounded-lg p-6 backdrop-blur-md">
          
          {/* TAB 1: ANALYTICS PREMIUM */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              
              {/* Analytics headers buttons */}
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                  INDICATEURS FINANCIERS ET VISITES
                </h3>
                <div className="flex border border-white/5 rounded overflow-hidden bg-neutral-900 h-9 shrink-0">
                  {['week', 'month', 'year'].map((filter) => (
                    <button
                      id={`btn-analytics-filter-${filter}`}
                      key={filter}
                      onClick={() => setAnalyticsFilter(filter as any)}
                      className={`text-[9px] font-mono uppercase px-3 cursor-pointer ${
                        analyticsFilter === filter ? 'bg-amber-400 text-black font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {filter === 'week' ? 'Semaine' : filter === 'month' ? 'Mois' : 'Année'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Analytics Stat boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-neutral-950 p-5 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">REVENUS TOTALS CONTABILISÉS</span>
                  <p className="text-2xl font-black font-mono text-amber-500">{formatPrice(1287650)}</p>
                  <p className="text-[9px] text-emerald-400 font-mono">⚡ +12% vs période précédente</p>
                </div>
                <div className="bg-neutral-950 p-5 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">BÉNÉFICES NETS ESTIMÉS</span>
                  <p className="text-2xl font-black font-mono text-emerald-400">{formatPrice(543800)}</p>
                  <p className="text-[9px] text-neutral-500">Marge moyenne : 42.2% de prestige</p>
                </div>
                <div className="bg-neutral-950 p-5 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">TAUZE MOYEN DE CONVERSION</span>
                  <p className="text-2xl font-black font-mono text-white">4.85 %</p>
                  <p className="text-[9px] text-amber-500 font-mono">🌟 Standard luxe surperformé</p>
                </div>
              </div>

              {/* Graphical grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* Graphique 1 card */}
                <div className="bg-neutral-950 rounded-lg p-5 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-semibold">GRAPHIQUE 1 : ÉVOLUTION COMMERCIALE</span>
                    <div className="flex gap-2">
                      <span className="flex items-center text-[9px] text-amber-500 font-mono">● VENTES</span>
                      <span className="flex items-center text-[9px] text-emerald-400 font-mono">○ BÉNÉFICES</span>
                    </div>
                  </div>
                  <div className="h-44 flex items-center justify-center relative">
                    {analyticsLoading ? <span className="text-xs text-neutral-500 animate-pulse">Compiling matrix...</span> : drawFinancialChartSvg}
                  </div>
                </div>

                {/* Graphique 2 card */}
                <div className="bg-neutral-950 rounded-lg p-5 border border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white font-semibold">GRAPHIQUE 2 : FLUX TRAFIC & INTENTIONS</span>
                    <div className="flex gap-2">
                      <span className="flex items-center text-[9px] text-indigo-400 font-mono">● VISITES</span>
                      <span className="flex items-center text-[9px] text-sky-400 font-mono">○ CLICS</span>
                    </div>
                  </div>
                  <div className="h-44 flex items-center justify-center relative">
                    {analyticsLoading ? <span className="text-xs text-neutral-500 animate-pulse">Compiling streams...</span> : drawTrafficChartSvg}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                  CATALOGUE DE PIÈCES HAUT DE GAMME ({products.length})
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
                      rating: 4.8,
                      description: '',
                      descriptionEn: '',
                      images: []
                    });
                    setShowProductForm(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded text-xs uppercase font-mono tracking-widest hover:bg-red-500 duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>AJOUTER UNE CRÉATION</span>
                </button>
              </div>

              {/* Product insert/edit drawer modal overlay on sheet */}
              {showProductForm && editingProduct && (
                <form onSubmit={handleProductSubmit} className="bg-neutral-900 border border-white/10 p-6 rounded-lg space-y-4 text-left">
                  <h4 className="text-xs font-mono tracking-widest text-red-400 uppercase font-bold border-b border-white/5 pb-2">
                    {editingProduct.name ? "MODIFICATION DE CRÉATION DE PRESTIGE" : "CONSIGNATION D'UNE CRÉATION LUXE"}
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Nom Français *</label>
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
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Nom Anglais *</label>
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

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Catégorie *</label>
                      <select
                        id="form-p-category"
                        value={editingProduct.category || 'watches'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-2 py-2 text-neutral-400 font-mono"
                      >
                        <option value="watches">watches (Montres de prestige)</option>
                        <option value="chains">chains (Maillons cubains / Orfèvrerie)</option>
                        <option value="suits">suits (Costumes de créateurs)</option>
                        <option value="women">women (Maison Femme Act I)</option>
                        <option value="perfumes">perfumes (Parfums d'élites)</option>
                        <option value="shoes">shoes (Souliers & Mocassins crêpe)</option>
                        <option value="accessories">accessories (Bagues / Accessoires élégants)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Tarif de base (€) *</label>
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
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Stock Garanti *</label>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Tarif Promo (€) (Optionnel)</label>
                      <input
                        id="form-p-promoprice"
                        type="number"
                        value={editingProduct.promoPrice || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, promoPrice: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-neutral-500 uppercase block">Badge d'Édition (Ex: Édition Limitée)</label>
                      <input
                        id="form-p-badge"
                        type="text"
                        value={editingProduct.badge || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-white placeholder-neutral-750"
                        placeholder="Chef d'Œuvre"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">Images du Produit (Liens URL séparés par des virgules) *</label>
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
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;
                            
                            const promises = Array.from(files).map((file: any) => {
                              return new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  resolve(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              });
                            });
                            
                            Promise.all(promises).then(base64Images => {
                              const existingImages = editingProduct.images || [];
                              setEditingProduct({
                                ...editingProduct,
                                images: [...existingImages, ...base64Images]
                              });
                              alert(`${base64Images.length} image(s) chargée(s) avec succès !`);
                            });
                          }}
                        />
                        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
                          📂 + IMPORTER UNE COMPOSITION DEPUIS MON APPAREIL
                        </span>
                        <p className="text-[9px] text-neutral-500 uppercase mt-1 font-sans">
                          Formats JPEG, PNG supportés. Conversion instantanée hégémonique.
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description textuelle Française *</label>
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
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description textuelle Anglaise *</label>
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
                    >
                      ANNULER
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-red-600 text-white font-mono text-xs font-bold rounded"
                    >
                      SANS FAUTE ET ENREGISTRER
                    </button>
                  </div>
                </form>
              )}

              {/* Product lists table */}
              <div className="overflow-x-auto border border-white/5 rounded-lg bg-neutral-950 flex flex-col">
                <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-neutral-900/40 text-neutral-400 uppercase font-mono text-[9px]">
                      <th className="p-4">IMAGINATION</th>
                      <th className="p-4">PIÈCE DESIGNATION</th>
                      <th className="p-4">CATÉGORIE</th>
                      <th className="p-4">TARIF NET</th>
                      <th className="p-4 text-center">STOCK</th>
                      <th className="p-4 text-center">CONTROLES</th>
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
                            {p.stock} Units
                          </span>
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
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-admin-del-${p.id}`}
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 hover:text-red-400 hover:bg-white/5 rounded cursor-pointer duration-300"
                              title="Supprimer"
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

          {/* TAB 3: ORDERS SECURE MONITOR */}
          {activeTab === 'orders' && (() => {
            const filteredOrders = orders.filter(ord => {
              const q = invoiceSearchQuery.toLowerCase().trim();
              if (!q) return true;
              return ord.id.toLowerCase().includes(q) || ord.customerName.toLowerCase().includes(q);
            });

            return (
              <div className="space-y-6 animate-fade-in">
                
                <div className="border-b border-white/5 pb-4">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                    JOURNAL DE COMMANDES ET DE FACTURATIONS ({filteredOrders.length} / {orders.length})
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                    Isolé sécurisé aux serveurs de production
                  </p>
                </div>

                {/* Filtre de recherche de factures */}
                <div className="bg-neutral-950 p-4 border border-white/10 rounded flex items-center space-x-3">
                  <span className="text-amber-500 font-mono text-xs">🔍 SCAN/RECHERCHE:</span>
                  <input
                    id="invoice-admin-search-input"
                    type="text"
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                    placeholder="Saisissez un nom de client ou un numéro de facture (ID) pour filtrer..."
                    className="w-full bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 placeholder-neutral-750 font-mono"
                  />
                  {invoiceSearchQuery && (
                    <button
                      onClick={() => setInvoiceSearchQuery('')}
                      className="text-neutral-550 hover:text-white font-mono text-xs uppercase cursor-pointer"
                    >
                      [Effacer]
                    </button>
                  )}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-20 text-neutral-600 font-mono text-xs uppercase border border-dashed border-white/5">
                    Aucune facture ne correspond aux critères de recherche.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((ord) => (
                      <div key={ord.id} className="bg-neutral-950 p-5 rounded-lg border border-white/5 space-y-4 font-mono text-left">
                        
                        {/* Order top line status */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-3">
                          <div className="space-y-0.5">
                            <p className="text-white font-bold uppercase">RÉFÉRENCE COMMANDE : {ord.id}</p>
                            <p className="text-neutral-500 text-[10px]">Date : {new Date(ord.date).toLocaleString('fr-FR')}</p>
                          </div>
                          
                          {/* Status controllers selection options */}
                          <div className="flex items-center space-x-3">
                            <span className="text-[9px] text-neutral-500 uppercase">STATUT :</span>
                            <select
                              id={`status-selector-${ord.id}`}
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className={`text-[10px] font-bold px-2 py-1 bg-black rounded border cursor-pointer select-none ${
                                ord.status === 'delivered' ? 'text-emerald-400 border-emerald-500/20' :
                                ord.status === 'shipped' ? 'text-sky-400 border-sky-500/20' :
                                ord.status === 'cancelled' ? 'text-red-400 border-red-500/20' :
                                'text-amber-400 border-amber-500/20'
                              }`}
                            >
                              <option value="pending">En attente (Pending)</option>
                              <option value="shipped">Expédiée (Shipped)</option>
                              <option value="delivered">Livrée (Delivered)</option>
                              <option value="cancelled">Annulée (Cancelled)</option>
                            </select>
                          </div>
                        </div>

                        {/* Client Delivery details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-400 border-y border-white/5 py-3">
                          <div>
                            <p className="text-neutral-500 text-[9px] tracking-widest uppercase">COORDONNÉES CLIENT</p>
                            <p className="text-white font-bold">{ord.customerName}</p>
                            <p>WhatsApp: {ord.whatsapp}</p>
                            <p>Lieu: {ord.address}, {ord.city}</p>
                          </div>

                          <div>
                            <p className="text-neutral-500 text-[9px] tracking-widest uppercase">SÉLECTION D'EXCEPTION</p>
                            {ord.items.map((it, idx) => (
                              <p key={idx} className="text-white text-[11px] leading-relaxed">
                                - {it.quantity}x {it.productName} {it.selectedSize ? `(TSize: ${it.selectedSize})` : ''} ({formatPrice(it.price)})
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Bottom values calculate */}
                        <div className="flex justify-between items-center pt-1 text-xs">
                          <span className="text-neutral-500">VALEUR COMMANDE :</span>
                          <span className="text-yellow-400 font-bold text-base filter drop-shadow-[0_0_8px_rgba(250,204,21,0.15)]">
                            {formatPrice(ord.totalPrice)}
                          </span>
                        </div>

                        {/* Action de Facturation */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-white/5 gap-3">
                          <span className="text-[10px] text-neutral-500 uppercase font-mono">Imprimerie & Audits :</span>
                          <button
                            onClick={() => setSelectedOrderForInvoice(ord)}
                            className="px-4 py-2 bg-neutral-900 border border-amber-500/20 text-amber-500 hover:text-black hover:bg-amber-500 rounded text-[10px] font-bold uppercase tracking-wider duration-300 font-mono cursor-pointer flex items-center space-x-1"
                          >
                            <span>📋 IMPRIMER / CHARGER LE REÇU DE FACTURATION</span>
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB 4: PROMOTIONS */}
          {activeTab === 'promos' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                  GÉNÉRATEUR DE RÉDUCTIONS ET SOUVERAINTÉ TARIFS ({promos.length})
                </h3>
                <button
                  id="btn-admin-add-promo"
                  onClick={() => setShowPromoForm(!showPromoForm)}
                  className="px-4 py-2 bg-neutral-900 border border-white/10 hover:border-amber-400 text-amber-400 rounded text-xs uppercase font-mono tracking-widest hover:bg-neutral-950 duration-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>CRÉER UN COUPON</span>
                </button>
              </div>

              {/* Promo input form */}
              {showPromoForm && (
                <form onSubmit={handlePromoSubmit} className="bg-neutral-900 p-5 rounded-lg border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-end text-left">
                  <div className="space-y-1 w-full max-w-[12rem]">
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">Code Unique *</label>
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
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">Réduction (%) *</label>
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
                    <label className="text-[10px] font-mono text-neutral-500 uppercase block">Durée de Validité *</label>
                    <select
                      value={promoDurationHours}
                      onChange={(e) => setPromoDurationHours(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-neutral-400 font-mono focus:outline-none"
                    >
                      <option value="0.083">5 Minutes (Alerte test rapide)</option>
                      <option value="1">1 Heure (Flash Exceptionnel)</option>
                      <option value="6">6 Heures</option>
                      <option value="24">24 Heures (1 Jour officiel)</option>
                      <option value="72">3 Jours (Week-End)</option>
                      <option value="168">7 Jours (Exceptionnel)</option>
                      <option value="720">30 Jours (1 Mois)</option>
                      <option value="eternal">Pas de limite (Éternel)</option>
                    </select>
                  </div>

                  <button
                    id="btn-submit-promo"
                    type="submit"
                    className="px-5 py-2 bg-amber-400 text-black font-mono font-bold text-xs content-center cursor-pointer h-9 rounded"
                  >
                    AJOUTER CODE
                  </button>
                </form>
              )}

              {/* Promo list table */}
              <div className="overflow-x-auto border border-white/5 rounded-lg bg-neutral-950 flex flex-col">
                <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-neutral-900/40 text-neutral-400 uppercase font-mono text-[9px]">
                      <th className="p-4">CODE PROMO</th>
                      <th className="p-4">VALEUR DE COUPURE</th>
                      <th className="p-4">ECHEANCE / DELAI</th>
                      <th className="p-4 text-center">STATUT & ACTION INTERACTION</th>
                      <th className="p-4 text-center">RETRANCHEMENTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {promos.map((pr) => {
                      const isExpired = pr.expiresAt ? (new Date(pr.expiresAt).getTime() < Date.now()) : false;
                      const activeAndNotExpired = pr.active && !isExpired;

                      return (
                        <tr key={pr.code} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-bold">{pr.code}</td>
                          <td className="p-4 font-semibold text-amber-500">-{pr.discountPercentage}% de réduction directe</td>
                          <td className="p-4 text-[10px] text-neutral-500">
                            {pr.expiresAt ? (
                              isExpired ? (
                                <span className="text-red-400">EXPIRÉ LE {new Date(pr.expiresAt).toLocaleString('fr-FR')}</span>
                              ) : (
                                <span className="text-cyan-400 font-bold">EXPIRE LE {new Date(pr.expiresAt).toLocaleString('fr-FR')}</span>
                              )
                            ) : (
                              <span className="text-neutral-500 italic">ÉTERNEL</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {activeAndNotExpired ? (
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded font-bold uppercase">
                                  ACTIF
                                </span>
                              ) : (
                                <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded font-bold uppercase">
                                  {isExpired ? 'DESACTIVÉ (EXPIRÉ)' : 'INACTIF'}
                                </span>
                              )}
                              <button
                                onClick={() => handleTogglePromo(pr.code)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/55 rounded text-[10px] text-amber-400 duration-200 cursor-pointer uppercase"
                              >
                                {activeAndNotExpired ? 'Désactiver' : 'Réactiver'}
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

          {/* TAB 5: CLIENTÈLE VIP */}
          {activeTab === 'users' && (() => {
            // Aggregate VIPs from actual orders
            const orderVipsMap = new Map<string, { customerName: string; email: string; whatsapp: string; orderCount: number; spend: number }>();
            orders.forEach(o => {
              const whatsappKey = (o.whatsapp || '').trim().replace(/\s+/g, '').toLowerCase();
              if (!whatsappKey) return;
              const existing = orderVipsMap.get(whatsappKey);
              if (existing) {
                existing.orderCount += 1;
                existing.spend += o.totalPrice || 0;
              } else {
                orderVipsMap.set(whatsappKey, {
                  customerName: o.customerName || 'Client d\'exception',
                  email: o.email || '',
                  whatsapp: o.whatsapp || '',
                  orderCount: 1,
                  spend: o.totalPrice || 0
                });
              }
            });

            const aggregatedVipsList = Array.from(orderVipsMap.values());

            // Merge with manual VIPs
            const combinedVips = [...aggregatedVipsList];
            manualVips.forEach(mv => {
              const mvKey = mv.whatsapp.trim().replace(/\s+/g, '').toLowerCase();
              const foundIdx = combinedVips.findIndex(cv => cv.whatsapp.trim().replace(/\s+/g, '').toLowerCase() === mvKey);
              if (foundIdx !== -1) {
                // merge / sum counts
                combinedVips[foundIdx].orderCount += mv.orderCount || 0;
              } else {
                combinedVips.push({
                  customerName: mv.customerName,
                  email: mv.email,
                  whatsapp: mv.whatsapp,
                  orderCount: mv.orderCount || 0,
                  spend: (mv.orderCount || 0) * 850 // estimate value
                });
              }
            });

            // Filter by search query
            const filteredVips = combinedVips.filter(v => {
              const q = vipSearchQuery.toLowerCase().trim();
              if (!q) return true;
              return v.customerName.toLowerCase().includes(q) || 
                     v.email.toLowerCase().includes(q) || 
                     v.whatsapp.includes(q);
            });

            return (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-4 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                      RÉGISTRY CONCIERGERIE VIP STEVENBMJ
                    </h3>
                    <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                      {filteredVips.length} Clients identifiés d'Excellence & de fidélité
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setEditingVip({ customerName: '', whatsapp: '', email: '', orderCount: 0 });
                      setShowVipForm(true);
                    }}
                    className="px-4 py-2 bg-amber-400 text-black text-xs font-mono font-bold uppercase hover:bg-amber-300 rounded cursor-pointer duration-250 flex items-center space-x-2 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ENREGISTRER UN CLIENT PRIVILÉGIÉ</span>
                  </button>
                </div>

                {/* VIP SEARCH BAR */}
                <div className="bg-neutral-950 p-3 border border-white/5 rounded-lg flex items-center space-x-3">
                  <Search className="w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    value={vipSearchQuery}
                    onChange={(e) => setVipSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom d'hôte, de client, WhatsApp, ou email..."
                    className="w-full bg-transparent border-none text-xs text-white focus:outline-none placeholder-neutral-705 font-mono"
                  />
                  {vipSearchQuery && (
                    <button
                      onClick={() => setVipSearchQuery('')}
                      className="text-neutral-500 hover:text-white font-mono text-[10px] uppercase cursor-pointer"
                    >
                      [RESTAURER]
                    </button>
                  )}
                </div>

                {/* VIP CRUD FORM DRAWER */}
                {showVipForm && editingVip && (
                  <form onSubmit={handleVipSubmit} className="bg-neutral-900 border border-white/10 p-5 rounded-lg space-y-4">
                    <h4 className="text-xs font-mono tracking-widest text-amber-400 font-bold uppercase border-b border-white/5 pb-2">
                      {editingVip.id ? "MODIFIER LE PROFIL DE LUGRE COUTURIER" : "AFFILIER NOUVEAU MEMBRE VIP"}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase block">Nom Complet *</label>
                        <input
                          type="text"
                          required
                          value={editingVip.customerName}
                          onChange={(e) => setEditingVip({ ...editingVip, customerName: e.target.value })}
                          className="w-full bg-neutral-950 border border-white/5 text-xs px-3 py-2 text-white"
                          placeholder="Ex: Richard Mille"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase block">WhatsApp Direct *</label>
                        <input
                          type="text"
                          required
                          value={editingVip.whatsapp}
                          onChange={(e) => setEditingVip({ ...editingVip, whatsapp: e.target.value })}
                          className="w-full bg-neutral-950 border border-white/5 text-xs px-3 py-2 text-white"
                          placeholder="Ex: +33612345678"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase block">Email Personnel</label>
                        <input
                          type="email"
                          value={editingVip.email}
                          onChange={(e) => setEditingVip({ ...editingVip, email: e.target.value })}
                          className="w-full bg-neutral-950 border border-white/5 text-xs px-3 py-2 text-white"
                          placeholder="Ex: richard@mille.com"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVip(null);
                          setShowVipForm(false);
                        }}
                        className="px-4 py-2 bg-neutral-800 text-neutral-400 text-[10px] font-mono uppercase rounded hover:bg-neutral-700 cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-400 text-black text-[10px] font-mono font-bold uppercase rounded hover:bg-amber-300 cursor-pointer animate-pulse"
                      >
                        Enregistrer Profil VIP
                      </button>
                    </div>
                  </form>
                )}

                {/* DUAL SIMULTANEOUS MESSAGING MODAL / PANEL */}
                {selectedVipForMsg && (
                  <div className="bg-neutral-900 border border-slate-700/50 p-6 rounded-xl space-y-6 animate-fade-in relative overflow-hidden">
                    {/* Glowing corner indicators */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent blur-xl" />
                    
                    <div className="flex justify-between items-start border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          CONCIERGERIE STEVENBMJ - DOUBLE DIFFUSION SIMULTANÉE
                        </span>
                        <h4 className="text-sm font-semibold text-white uppercase mt-1">
                          Rédaction de message d'exception pour : {selectedVipForMsg.customerName}
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedVipForMsg(null)}
                        className="text-neutral-500 hover:text-white font-mono text-xs cursor-pointer uppercase"
                      >
                        [Fermer l'Atelier]
                      </button>
                    </div>

                    {vipMsgSuccess ? (
                      <div className="p-6 bg-emerald-950/40 border border-emerald-500/20 rounded text-center space-y-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                        <h5 className="text-emerald-400 font-bold font-mono text-xs uppercase">CRÉATION SIGNÉE & DISPATCHÉE AVEC SUCCÈS !</h5>
                        <p className="text-[10px] text-neutral-400 max-w-md mx-auto uppercase leading-relaxed font-mono">
                          Les algorithmes de la plateforme ont orchestré la double transmission chiffrée.
                        </p>
                        
                        {/* Two visual tubes/pipes representing dispatch */}
                        <div className="grid grid-cols-2 gap-4 pt-3 font-mono">
                          <div className="bg-neutral-950 p-3 rounded border border-sky-500/20 text-left">
                            <p className="text-sky-400 font-bold text-[9px] uppercase flex items-center space-x-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse mr-1" />
                              WhatsApp Pipeline
                            </p>
                            <p className="text-[8px] text-neutral-500 mt-1">STATUT: DELIVERED TO {selectedVipForMsg.whatsapp}</p>
                            <p className="text-[9px] text-neutral-300 italic mt-2 line-clamp-2">
                              "Cher(e) *{selectedVipForMsg.customerName}*, {vipMsgBody}..."
                            </p>
                          </div>
                          
                          <div className="bg-neutral-950 p-3 rounded border border-indigo-500/20 text-left">
                            <p className="text-indigo-400 font-bold text-[9px] uppercase flex items-center space-x-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse mr-1" />
                              Haute Couture E-Mail
                            </p>
                            <p className="text-[8px] text-neutral-500 mt-1">STATUT: SENT BY StevenBmj TO {selectedVipForMsg.email || 'concierge@vip.fr'}</p>
                            <p className="text-[9px] text-neutral-300 italic mt-2 line-clamp-2">
                              "✨ STEVENBMJ HAUTE COUTURE ✨ Cher/Chère {selectedVipForMsg.customerName}..."
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-neutral-500 uppercase block">Mon Message (Le contenu de base qui sera mis en forme) *</label>
                          <textarea
                            required
                            rows={3}
                            value={vipMsgBody}
                            onChange={(e) => setVipMsgBody(e.target.value)}
                            placeholder="Saisissez votre note d'élégance ou votre invitation privée..."
                            className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2.5 text-white focus:border-amber-450 focus:outline-none"
                          />
                        </div>

                        {/* Dual template side-by-side previews */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* WhatsApp Template Form */}
                          <div className="p-4 bg-lime-950/20 border border-lime-500/20 rounded-lg text-xs space-y-2">
                            <div className="flex justify-between items-center text-[9px] text-lime-400 font-bold font-mono">
                              <span>⚜️ FORMULAIRE WHATSAPP (CONFIÉ À STEVENBMJ)</span>
                              <MessageSquare className="w-3.5 h-3.5" />
                            </div>
                            <div className="bg-neutral-950 p-3 rounded border border-white/5 font-mono text-[10px] text-neutral-305 leading-relaxed text-left whitespace-pre-line">
                              {`*STEVENBMJ* ⚜️
━━━━━━━━━━━━━━━
Cher(e) *${selectedVipForMsg.customerName}*,

${vipMsgBody || "[Votre message de prestige s'écrira ici en direct]"}

⚜️ _StevenBmj - L'émotion de l'Or_`}
                            </div>
                          </div>

                          {/* Email Template Form */}
                          <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-xs space-y-2">
                            <div className="flex justify-between items-center text-[9px] text-indigo-400 font-bold font-mono">
                              <span>✉️ FORMULAIRE LUXURY MAIL (STEVENBMJ SOUVERAIN)</span>
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                            <div className="bg-neutral-950 p-3 rounded border border-white/5 font-sans text-[10px] text-neutral-305 leading-relaxed text-left whitespace-pre-line">
                              {`✨ STEVENBMJ HAUTE COUTURE ✨
--------------------------------------------------
Cher/Chère ${selectedVipForMsg.customerName},

${vipMsgBody || "[Votre message de prestige s'écrira ici en direct]"}

Nous restons à votre entière disposition dans nos ateliers.
L'élégance n'est pas une attitude, c'est une complication.

Bien cordialement,
StevenBmj - Conciergerie Royale`}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => handleSendDualVipMessage(selectedVipForMsg)}
                            disabled={!vipMsgBody.trim()}
                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-lg hover:brightness-110 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed duration-300 flex items-center space-x-2"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>LANCER LA DOUBLE TRANSMISSION SÉCURISÉE</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* VIP LIST IN STUNNING CARDS AND DYNAMIC COLOURS */}
                {filteredVips.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/5 text-neutral-500 font-mono text-xs uppercase rounded-lg">
                    Aucun hôte de marque ne correspond à votre recherche.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredVips.map((vip, i) => {
                      // Compute dynamic high-end badges and colors based on validated order count/frequency
                      let badgeName = "VIP Hôte";
                      let badgeClasses = "bg-neutral-800 text-neutral-300 border border-neutral-700";
                      let avatarGlowClass = "border-neutral-500 shadow-[0_0_8px_rgba(115,115,115,0.2)]";

                      if (vip.orderCount >= 5) {
                        badgeName = "SBMJ Ambassadeur Absolu";
                        badgeClasses = "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold animate-pulse";
                        avatarGlowClass = "border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]";
                      } else if (vip.orderCount >= 3) {
                        badgeName = "VIP Orfèvre Prestige";
                        badgeClasses = "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold";
                        avatarGlowClass = "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.30)]";
                      } else if (vip.orderCount >= 2) {
                        badgeName = "VIP Acheteur Loyal";
                        badgeClasses = "bg-sky-500/10 text-sky-400 border border-sky-500/30";
                        avatarGlowClass = "border-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.25)]";
                      }

                      return (
                        <div key={i} className="bg-neutral-950 p-5 rounded-lg border border-white/5 space-y-4 hover:border-white/10 transition-colors flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                {/* Elegant monogram avatar with dynamic border color based on badge frequency */}
                                <div className={`w-9 h-9 rounded-full border bg-neutral-900 flex items-center justify-center font-serif text-sm font-bold text-white uppercase ${avatarGlowClass}`}>
                                  {vip.customerName.charAt(0)}
                                </div>
                                <div className="text-left">
                                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{vip.customerName}</h4>
                                  <span className={`inline-block text-[9px] uppercase px-2 py-0.5 mt-1 rounded font-mono ${badgeClasses}`}>
                                    {badgeName}
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-mono text-neutral-500 text-right uppercase">
                                Validations : <strong className="text-white text-xs">{vip.orderCount}</strong>
                              </span>
                            </div>

                            {/* Info Lines */}
                            <div className="space-y-1 text-[11px] font-mono text-neutral-400 border-t border-white/5 pt-3 text-left">
                              <p className="flex justify-between">
                                <span className="text-neutral-500">WHATSAPP:</span>
                                <span className="text-neutral-200">{vip.whatsapp || "Non renseigné"}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-neutral-500">E-MAIL PRIVÉ:</span>
                                <span className="text-neutral-300 text-[10px]">{vip.email || "Non communiqué"}</span>
                              </p>
                              <p className="flex justify-between font-bold border-t border-white/5 pt-1 mt-1 text-[12px]">
                                <span className="text-amber-500 uppercase text-[9px]">CA JOAILLERIE (ESTIMÉ) :</span>
                                <span className="text-yellow-400">{formatPrice(vip.spend || vip.orderCount * 850)}</span>
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[10px] font-mono gap-2">
                            <div className="flex space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVip({ ...vip });
                                  setShowVipForm(true);
                                }}
                                className="px-2.5 py-1.5 bg-neutral-900 border border-white/5 hover:border-amber-500/35 hover:text-amber-400 rounded text-neutral-400 transition-colors"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVip(vip.customerName)}
                                className="px-2.5 py-1.5 bg-neutral-900 border border-white/5 hover:bg-red-500/10 hover:text-red-400 rounded text-neutral-400 transition-colors"
                              >
                                Supprimer
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVipForMsg(vip);
                                setVipMsgSuccess(false);
                                setVipMsgBody('');
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold uppercase cursor-pointer flex items-center space-x-1 duration-250 shrink-0"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>MESSAGERIE DUAL</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* REGISTERED CUSTOMER ACCOUNTS (DATABASE) SECTION */}
                <div className="border-t border-white/10 pt-8 mt-10">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-white/5 pb-4 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white uppercase tracking-widest text-amber-500">
                        COMPTES CLIENTS ENREGISTRÉS DIRECTEMENT (BASE DE DONNÉES)
                      </h3>
                      <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                        {backendUsers.length} comptes authentifiés en base – Possibilité d'inscription souveraine
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowCreateUserForm(!showCreateUserForm);
                          setCreateUserError('');
                          setCreateUserSuccess('');
                        }}
                        className="px-4 py-2 border border-amber-500/20 hover:border-amber-400 bg-amber-500/5 text-amber-400 text-[10px] font-mono font-bold uppercase rounded cursor-pointer duration-250 flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>CRÉER UN COMPTE CLIENT</span>
                      </button>

                      <button
                        onClick={handleWipeAllBackendUsers}
                        className="px-4 py-2 border border-red-500/40 hover:bg-red-500/10 text-red-500 text-[10px] font-mono uppercase rounded cursor-pointer duration-250 font-bold"
                      >
                        TOUT EFFACER
                      </button>
                    </div>
                  </div>

                  {/* CREATE USER FORM */}
                  {showCreateUserForm && (
                    <form onSubmit={handleCreateBackendUser} className="bg-neutral-900 border border-white/10 p-5 rounded-lg space-y-4 my-6">
                      <h4 className="text-xs font-mono tracking-widest text-amber-500 font-bold uppercase border-b border-white/5 pb-2">
                        CRÉER SOUVERAINEMENT UN NOUVEAU COMPTE CLIENT
                      </h4>

                      {createUserError && (
                        <div className="p-2.5 bg-red-950/50 border border-red-500/20 text-red-400 rounded text-xs font-mono uppercase">
                          {createUserError}
                        </div>
                      )}

                      {createUserSuccess && (
                        <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 rounded text-xs font-mono uppercase">
                          {createUserSuccess}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-neutral-500 uppercase block">Nom & Prénom *</label>
                          <input
                            type="text"
                            required
                            value={newUserData.name}
                            onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/5 text-xs px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                            placeholder="Ex: Alexandre de Beauharnais"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-neutral-500 uppercase block">Adresse E-Mail *</label>
                          <input
                            type="email"
                            required
                            value={newUserData.email}
                            onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/5 text-xs px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                            placeholder="Ex: alexandre@luxury.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-neutral-500 uppercase block">Mot de passe de départ *</label>
                          <input
                            type="password"
                            required
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            className="w-full bg-neutral-950 border border-white/5 text-xs px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateUserForm(false)}
                          className="px-4 py-2 bg-neutral-800 text-neutral-400 text-[10px] font-mono uppercase rounded hover:bg-neutral-700 cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-400 text-black text-[10px] font-mono font-bold uppercase rounded hover:bg-amber-300 cursor-pointer"
                        >
                          CRÉER LE COMPTE
                        </button>
                      </div>
                    </form>
                  )}

                  {backendUsers.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 text-xs font-mono uppercase tracking-widest bg-neutral-950/50 border border-white/5 rounded-lg mt-4">
                      Aucun compte enregistré en base de données.
                    </div>
                  ) : (
                    <div className="bg-neutral-950 border border-white/5 rounded-lg overflow-hidden mt-4">
                      <table className="w-full text-left border-collapse font-mono text-[11px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-neutral-900 text-neutral-400">
                            <th className="p-3 uppercase tracking-wider">Compte Client</th>
                            <th className="p-3 uppercase tracking-wider">E-Mail</th>
                            <th className="p-3 uppercase tracking-wider">Fidélité (VIP)</th>
                            <th className="p-3 uppercase tracking-wider">Date d'adhésion</th>
                            <th className="p-3 uppercase tracking-wider">Contact WhatsApp</th>
                            <th className="p-3 uppercase tracking-wider text-right">Actions / Contact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {backendUsers.map((bu, idx) => {
                            // Automatically scan previous orders or VIP listings under this email to find their WhatsApp number info
                            const matchedOrder = orders.find(o => o.email?.trim().toLowerCase() === bu.email.trim().toLowerCase());
                            const matchedVip = combinedVips.find(v => v.email?.trim().toLowerCase() === bu.email.trim().toLowerCase());
                            const detectedWhatsApp = (matchedOrder?.whatsapp || matchedVip?.whatsapp || '').trim();

                            const handleContactWhatsApp = () => {
                              let num = detectedWhatsApp;
                              if (!num) {
                                num = window.prompt(
                                  language === 'FR'
                                    ? `Aucun numéro de téléphone enregistré pour ${bu.name}.\nSaisissez le numéro WhatsApp de contact (ex: +22955468138) :`
                                    : `No telephone number on file for ${bu.name}.\nEnter WhatsApp contact number (ex: +22955468138):`,
                                  bu.whatsapp || ''
                                ) || '';
                              }
                              if (num.trim()) {
                                const cleanNum = num.trim().replace(/\s+/g, '').replace(/^\+/, '');
                                const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(
                                  language === 'FR'
                                    ? `Bonjour ${bu.name}, nous vous contactons depuis le service conciergerie de la Maison StevenBmj.`
                                    : `Hello ${bu.name}, we are contacting you from the elite concierge services of Maison StevenBmj.`
                                )}`;
                                window.open(url, '_blank');
                              }
                            };

                            const emailSubject = encodeURIComponent(
                              language === 'FR' 
                                ? "Maison StevenBmj — Votre Salon Privé d'Exception" 
                                : "Maison StevenBmj — Your High Fashion Private Vault"
                            );
                            const emailBody = encodeURIComponent(
                              language === 'FR'
                                ? `Cher(e) ${bu.name},\n\nNous espérons que vous vous portez à merveille. C'est un réel privilège de vous compter parmi les invités d'elite de notre Maison.\n\nCordialement,\nService Conciergerie Royale StevenBmj`
                                : `Dear ${bu.name},\n\nWe hope this email finds you in exceptional standing. It is an absolute privilege to count you among our illustrious house members.\n\nWarm regards,\nStevenBmj Royal Concierge Services`
                            );
                            const emailMailto = `mailto:${bu.email}?subject=${emailSubject}&body=${emailBody}`;

                            return (
                              <tr key={bu.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-3 font-semibold text-white uppercase">{bu.name}</td>
                                <td className="p-3 text-neutral-350">{bu.email}</td>
                                <td className="p-3 text-amber-500 font-bold">{bu.vipPoints} pts</td>
                                <td className="p-3 text-neutral-450">{bu.dateJoined ? new Date(bu.dateJoined).toLocaleDateString() : 'N/A'}</td>
                                <td className="p-3">
                                  {detectedWhatsApp ? (
                                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse transition-all"></span>
                                      {detectedWhatsApp}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-600 italic">Non renseigné / No phone</span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    <a
                                      href={emailMailto}
                                      title={language === 'FR' ? "Contacter par E-mail" : "Contact via E-mail"}
                                      className="px-2.5 h-8 bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:border-amber-400/50 hover:bg-neutral-800 rounded transition-all duration-150 inline-flex items-center gap-1.5 text-[9px] uppercase font-bold"
                                    >
                                      <Mail className="w-3.5 h-3.5 text-amber-500" />
                                      <span>MAIL</span>
                                    </a>

                                    <button
                                      onClick={handleContactWhatsApp}
                                      title={language === 'FR' ? "Contacter par WhatsApp" : "Contact via WhatsApp"}
                                      className="px-2.5 h-8 bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white hover:border-emerald-400/50 hover:bg-neutral-800 rounded cursor-pointer transition-all duration-150 inline-flex items-center gap-1.5 text-[9px] uppercase font-bold"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>WHATSAPP</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteBackendUser(bu.id)}
                                      className="px-2 h-8 bg-red-950/40 border border-red-500/25 text-red-400 hover:text-white hover:bg-red-600 hover:border-red-600 rounded text-[9px] cursor-pointer transition-all duration-150 font-bold uppercase"
                                      title={language === 'FR' ? "Révoquer le compte d'exception" : "Revoke account privileges"}
                                    >
                                      SUPPRIMER
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 8: ANNONCES GESTION */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in text-left font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                    GESTION DES ANNONCES CYBER BOUTIQUE
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase">
                    Faites des alertes flashs qui disparaissent après le délai de votre choix
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowAnnForm(!showAnnForm)}
                  className="px-4 py-2 bg-red-650 font-bold hover:bg-neutral-800 border border-white/10 text-white rounded text-xs uppercase duration-250 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAnnForm ? "Fermer l'Atelier" : "RÉACTIVER UNE NOUVELLE ANNONCE"}</span>
                </button>
              </div>

              {showAnnForm && (
                <form onSubmit={handleAnnounceSubmit} className="bg-neutral-900 border border-white/10 p-5 rounded-lg space-y-4">
                  <h4 className="text-xs tracking-widest text-red-00 font-bold uppercase border-b border-white/5 pb-2">
                    LANCER UN BULLETIN SOUVERAIN (DÉLAI LIMITE EXPRÈS)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-500 uppercase block">Message (Français) *</label>
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
                      <label className="text-[10px] text-neutral-500 uppercase block">Message (Anglais) *</label>
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
                    <label className="text-[10px] text-neutral-500 uppercase block">Délai avant Disparition automatique *</label>
                    <select
                      value={newAnn.durationMinutes}
                      onChange={(e) => setNewAnn({ ...newAnn, durationMinutes: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2 text-neutral-400 font-mono"
                    >
                      <option value="5">5 Minutes (Alerte test ultra-rapide)</option>
                      <option value="10">10 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Heure (Flash Sale Express)</option>
                      <option value="360">6 Heures</option>
                      <option value="720">12 Heures</option>
                      <option value="1440">24 Heures (1 Jour officiel)</option>
                      <option value="4320">3 Jours (Idéal Week-End)</option>
                      <option value="10080">7 Jours (Exceptionnel)</option>
                      <option value="52560000">Éternel (Ne disparaît jamais)</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase rounded cursor-pointer duration-300 font-mono"
                    >
                      🚀 DIFFUSER IMMÉDIATEMENT SUR LA BOUTIQUE
                    </button>
                  </div>
                </form>
              )}

              {/* LIST OF ACTIVE ANNOUNCEMENTS */}
              <div className="space-y-4">
                <div className="border-b border-white/5 pb-2">
                  <h4 className="text-[11px] text-neutral-400 uppercase tracking-widest">BULLETINS EN COURS DE DIFFUSION</h4>
                </div>

                {announcements.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 text-neutral-600 text-xs uppercase">
                    Aucune alerte temporaire n'est diffusée sur le site actuellement.
                  </div>
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
                              <span className="text-neutral-550 uppercase">Lancée le: {createdAt.toLocaleString('fr-FR')}</span>
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
                            title="Retirer Bulletin"
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
                <h3 className="text-sm font-semibold text-white uppercase tracking-widest">
                  GESTION DE CONTENU HOMEPAGE & BOUTIQUE
                </h3>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                  Écrits, bannière défilante, contact d'ateliers
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Annonce Défilante (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Annonce Défilante (Anglais) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Héro Landing Page (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Héro Landing Page (Anglais) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description Héro Landing (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description Héro Landing (Anglais) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Contact WhatsApp Direct Concierge *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Indexation robots.txt / sitemap.xml SEO *</label>
                  <select
                    id="sett-seo-indexable"
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 h-11 text-emerald-400 select-none cursor-pointer"
                  >
                    <option value="true">INDEXATION FORCEE (SEO HIGH AGGRESSIVE)</option>
                    <option value="false">DEVELOPMENT STAGE - NOINDEX</option>
                  </select>
                </div>
              </div>

              {/* SECTION: IMAGES DU CARROUSEL HERO */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                  IMAGES DE DIAPORAMA DE LA BAVOLETTE HERO DE LA PAGE ACCUEIL
                </h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">
                  Personnalisez souverainement les images coulissantes de l'accueil de luxe (par URL ou par Upload).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">Image de Fond 1 *</label>
                  <input
                    id="sett-hero-img-1"
                    type="text"
                    required
                    value={settings.homepageHeroImage1 || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroImage1: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="URL ou code Base64 de l'image de fond..."
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
                    <label htmlFor="upload-hero-1" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">
                      ⬆ Charger Fichier 1
                    </label>
                    {settings.homepageHeroImage1 && <span className="text-[9px] text-emerald-400 font-mono">✓ Chargé</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">Image de Fond 2 *</label>
                  <input
                    id="sett-hero-img-2"
                    type="text"
                    required
                    value={settings.homepageHeroImage2 || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroImage2: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="URL ou code Base64 de l'image de fond 2..."
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
                    <label htmlFor="upload-hero-2" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">
                      ⬆ Charger Fichier 2
                    </label>
                    {settings.homepageHeroImage2 && <span className="text-[9px] text-emerald-400 font-mono">✓ Chargé</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold">Image de Fond 3 *</label>
                  <input
                    id="sett-hero-img-3"
                    type="text"
                    required
                    value={settings.homepageHeroImage3 || ''}
                    onChange={(e) => setSettings({ ...settings, homepageHeroImage3: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="URL ou code Base64 de l'image de fond 3..."
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
                    <label htmlFor="upload-hero-3" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">
                      ⬆ Charger Fichier 3
                    </label>
                    {settings.homepageHeroImage3 && <span className="text-[9px] text-emerald-400 font-mono">✓ Chargé</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: HOMEPAGE SECTION 2 (PHILOSOPHIE / STORY) */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                  SECTION 2 DE L'ACCUEIL : PHILOSOPHIE & HISTOIRE DU SAVOIR-FAIRE
                </h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">
                  Éditez les textes et l'image d'illustration de la philosophie de création.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Philosophie (FR) *</label>
                  <input
                    type="text"
                    required
                    value={settings.storyTitleFr || ''}
                    onChange={(e) => setSettings({ ...settings, storyTitleFr: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="Titre en Français..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Philosophie (EN) *</label>
                  <input
                    type="text"
                    required
                    value={settings.storyTitleEn || ''}
                    onChange={(e) => setSettings({ ...settings, storyTitleEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="Titre en Anglais..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description (FR) *</label>
                  <textarea
                    required
                    rows={3}
                    value={settings.storyDescFr || ''}
                    onChange={(e) => setSettings({ ...settings, storyDescFr: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="Description en Français..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description (EN) *</label>
                  <textarea
                    required
                    rows={3}
                    value={settings.storyDescEn || ''}
                    onChange={(e) => setSettings({ ...settings, storyDescEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="Description en Anglais..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block font-bold font-mono">Image de la Philosophie *</label>
                  <input
                    type="text"
                    required
                    value={settings.storyImage || ''}
                    onChange={(e) => setSettings({ ...settings, storyImage: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white"
                    placeholder="URL ou base64 de l'image de la philosophie..."
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
                    <label htmlFor="upload-philosophy-img" className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded border border-white/5 inline-block">
                      ⬆ Charger Fichier Image Philosophie
                    </label>
                    {settings.storyImage && <span className="text-[9px] text-emerald-400 font-mono">✓ Image chargée</span>}
                  </div>
                </div>
              </div>

              {/* SECTION: HOMEPAGE SECTION 3 (PRESTIGE FABRICS) */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                  SECTION 3 : ÉTOFFES NOBLES ET TISSUS D'EXCEPTION
                </h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">
                  Éditez les 3 cartes de présentation de tissus (titres, descriptions et images).
                </p>
              </div>
              <div className="space-y-6">
                {/* Fabric 1 */}
                <div className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                  <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">Étoffe n°1 ("Good Luck")</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Titre FR"
                      value={settings.fabric1TitleFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1TitleFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Titre EN"
                      value={settings.fabric1TitleEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1TitleEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <textarea
                      placeholder="Description FR"
                      rows={2}
                      value={settings.fabric1DescFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1DescFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <textarea
                      placeholder="Description EN"
                      rows={2}
                      value={settings.fabric1DescEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric1DescEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <input
                        type="text"
                        placeholder="URL de l'image de l'étoffe 1"
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
                      <label htmlFor="upload-fabric-1" className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">
                        ⬆ Charger Image Étoffe 1
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fabric 2 */}
                <div className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                  <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">Étoffe n°2 ("Super Wax")</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Titre FR"
                      value={settings.fabric2TitleFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2TitleFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Titre EN"
                      value={settings.fabric2TitleEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2TitleEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <textarea
                      placeholder="Description FR"
                      rows={2}
                      value={settings.fabric2DescFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2DescFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <textarea
                      placeholder="Description EN"
                      rows={2}
                      value={settings.fabric2DescEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric2DescEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <input
                        type="text"
                        placeholder="URL de l'image de l'étoffe 2"
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
                      <label htmlFor="upload-fabric-2" className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">
                        ⬆ Charger Image Étoffe 2
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fabric 3 */}
                <div className="p-4 bg-neutral-950/60 rounded border border-white/5 space-y-4">
                  <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">Étoffe n°3 ("Brocart Royal")</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Titre FR"
                      value={settings.fabric3TitleFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3TitleFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Titre EN"
                      value={settings.fabric3TitleEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3TitleEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                    />
                    <textarea
                      placeholder="Description FR"
                      rows={2}
                      value={settings.fabric3DescFr || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3DescFr: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <textarea
                      placeholder="Description EN"
                      rows={2}
                      value={settings.fabric3DescEn || ''}
                      onChange={(e) => setSettings({ ...settings, fabric3DescEn: e.target.value })}
                      className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                    />
                    <div className="md:col-span-2 space-y-2">
                      <input
                        type="text"
                        placeholder="URL de l'image de l'étoffe 3"
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
                      <label htmlFor="upload-fabric-3" className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">
                        ⬆ Charger Image Étoffe 3
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: HOMEPAGE SECTION 4 (BENTO SALONS DE PRESTIGE) */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-widest">
                  SECTION 4 : LES 4 SALONS DE PRESTIGE (GRILLE BENTO)
                </h3>
                <p className="text-[9px] text-neutral-500 uppercase mt-0.5 font-mono">
                  Éditez les 4 zones interactives de la grille Bento (Horlogerie, Maillons d'Or, Mocassins, Costumes).
                </p>
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
                      <h4 className="text-[11px] font-mono text-white tracking-widest uppercase">Salon Bento n°{num}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Titre FR"
                          value={(settings[titleFrKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [titleFrKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Titre EN"
                          value={(settings[titleEnKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [titleEnKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white"
                        />
                        <textarea
                          placeholder="Description FR"
                          rows={2}
                          value={(settings[descFrKey] as string) || ''}
                          onChange={(e) => setSettings({ ...settings, [descFrKey]: e.target.value })}
                          className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-2 text-white md:col-span-2"
                        />
                        <textarea
                          placeholder="Description EN"
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
                          <label htmlFor={`upload-bento-${num}`} className="cursor-pointer px-3 py-1 bg-neutral-800 text-amber-500 text-[9px] font-mono uppercase rounded border border-white/5 inline-block">
                            ⬆ Charger Image Bento {num}
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION: PAGE À PROPOS */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
                  CONTENU DE LA PAGE À PROPOS
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre À Propos (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre À Propos (Anglais) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Texte Manifeste À Propos (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Texte Manifeste À Propos (Anglais) *</label>
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
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest">
                  CONTENU DE LA PAGE CONTACT
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Contact (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Contact (Anglais) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Adresse Physique (Français) *</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Adresse Physique (Anglais) *</label>
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
                <label className="text-[10px] font-mono text-neutral-500 uppercase block">Lien URL d'Intégration Google Map (Iframe Src) *</label>
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
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest text-amber-500">
                  CONTENU DE LA PAGE ATELIER CARE (SOUVERAINETÉ CLIENT)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Atelier Care (Français)</label>
                  <input
                    id="sett-care-title-fr"
                    type="text"
                    value={settings.careTitle || ''}
                    onChange={(e) => setSettings({ ...settings, careTitle: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Titre Atelier Care (Anglais)</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Contenu / Description Care (Français)</label>
                  <textarea
                    id="sett-care-content-fr"
                    rows={3}
                    value={settings.careContent || ''}
                    onChange={(e) => setSettings({ ...settings, careContent: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Contenu / Description Care (Anglais)</label>
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
                  <span>FAQ - QUESTIONS FREQUENTES D'ATELIER CARE</span>
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
                  >
                    + Ajouter une FAQ
                  </button>
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
                      <div className="py-4 text-center border border-dashed border-white/10 text-xs text-neutral-500 uppercase font-mono tracking-wider">
                        Aucune Question Fréquente définie.
                      </div>
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
                        >
                          Supprimer
                        </button>
                      </div>
                      <span className="text-[9px] font-mono text-amber-400 uppercase">SBMJ FAQ #{fIdx + 1}</span>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">Question (Français)</label>
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
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">Question (Anglais)</label>
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
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">Réponse (Français)</label>
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
                          <label className="text-[9px] font-mono text-neutral-500 uppercase block">Réponse (Anglais)</label>
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
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest text-amber-500">
                  CONTENU DU FOOTER DE LA MAISON
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description Footer (Français)</label>
                  <textarea
                    id="sett-footer-text-fr"
                    rows={2}
                    value={settings.footerText || ''}
                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Description Footer (Anglais)</label>
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
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Crédits Footer (Français)</label>
                  <input
                    id="sett-footer-credits-fr"
                    type="text"
                    value={settings.footerCredits || ''}
                    onChange={(e) => setSettings({ ...settings, footerCredits: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase block">Crédits Footer (Anglais)</label>
                  <input
                    id="sett-footer-credits-en"
                    type="text"
                    value={settings.footerCreditsEn || ''}
                    onChange={(e) => setSettings({ ...settings, footerCreditsEn: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 text-xs px-3.5 py-3 text-white font-sans"
                  />
                </div>
              </div>

              {/* SECTION: SECURITE SOUVERAINETÉ */}
              <div className="border-b border-white/5 pb-2 pt-4">
                <h3 className="text-xs font-semibold text-white uppercase tracking-widest text-red-500">
                  SÉCURITÉ ET ACCÈS SOUVERAIN (ADMIN)
                </h3>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-red-400 uppercase block">Nouveau Mot de Passe d'Accès Administratif *</label>
                <input
                  id="sett-admin-pass"
                  type="text"
                  required
                  value={settings.adminPassword || 'stevenbmj123'}
                  onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                  className="w-full bg-neutral-900 border border-red-500/20 text-xs px-3.5 py-3 text-white font-mono text-red-400 font-bold"
                />
              </div>

              <button
                id="btn-save-settings"
                type="submit"
                className="px-6 h-11 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded cursor-pointer duration-300"
              >
                METTRE À JOUR LA CONFIRMATION
              </button>

            </form>
          )}

          {/* TAB 7: ADVANCED CYBERSECURITY MONITOR */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              <div className="border-b border-red-500/20 pb-4">
                <div className="flex items-center space-x-2 text-red-500">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest">
                    PARE-FEU LOGICIEL CYBER-ESPACE ET PAQUETS LOGS
                  </h3>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                  Ethical Hacking active shield block. Anti SQL Injection & anti Cross-site Scripting acts initialized.
                </p>
              </div>

              {/* Secure status boxes grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-black p-4 border border-white/5 rounded">
                  <p className="text-[9px] font-mono text-neutral-500 uppercase">SYS SECURE SHIELD</p>
                  <p className="text-xs text-emerald-400 font-bold font-mono">● EN LIGNE / OK</p>
                </div>
                <div className="bg-black p-4 border border-white/5 rounded">
                  <p className="text-[9px] font-mono text-neutral-500 uppercase">INJECTIONS SQL DETECTÉES</p>
                  <p className="text-xs text-emerald-400 font-bold font-mono">0 ATTENDED / CLEAN</p>
                </div>
                <div className="bg-black p-4 border border-white/5 rounded">
                  <p className="text-[9px] font-mono text-neutral-500 uppercase">PROTECT XSS / DATA VALIDATOR</p>
                  <p className="text-xs text-emerald-400 font-bold font-mono">ZOD SCHEMA ACTIF</p>
                </div>
                <div className="bg-black p-4 border border-white/5 rounded">
                  <p className="text-[9px] font-mono text-neutral-500 uppercase">DOS LIMITER BLOCKS</p>
                  <p className="text-xs text-red-400 font-bold font-mono">🛡 RATE LIMIT ENGINE</p>
                </div>
              </div>

              {/* Logs visualizer outputs */}
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block tracking-wider text-left">CYBER PACKET AUDITS TERMINAL LOGS :</span>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="Rechercher par texte (ex: Connexion, Promo...)"
                      className="bg-neutral-900 border border-white/10 text-xs px-3 py-1.5 text-white placeholder-neutral-600 font-mono w-full sm:w-60"
                    />
                    <input
                      type="date"
                      value={logSearchDate}
                      onChange={(e) => setLogSearchDate(e.target.value)}
                      className="bg-neutral-900 border border-white/10 text-xs px-3 py-1.5 text-neutral-400 font-mono w-full sm:w-40"
                    />
                    { (logSearchQuery || logSearchDate) && (
                      <button
                        onClick={() => {
                          setLogSearchQuery('');
                          setLogSearchDate('');
                        }}
                        className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-[10px] font-mono uppercase cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="p-1.5 px-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-[9px] font-mono uppercase tracking-widest duration-300 rounded cursor-pointer"
                  >
                    🗑 Vider les logs
                  </button>
                </div>
                <div className="bg-black/90 text-[10.5px] font-mono text-neutral-400 p-4 border border-white/10 rounded-lg max-h-64 overflow-y-auto space-y-1.5 font-sans leading-relaxed text-left">
                  {(() => {
                    const filteredLogs = logs.filter((log: any) => {
                      const matchesText = logSearchQuery ? (
                        log.event.toLowerCase().includes(logSearchQuery.toLowerCase()) || 
                        log.status.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                        log.timestamp.toLowerCase().includes(logSearchQuery.toLowerCase())
                      ) : true;
                      
                      // Match date string like YYYY-MM-DD
                      let matchesDate = true;
                      if (logSearchDate) {
                        // Date looks like YYYY-MM-DD, log timestamp looks like 24/05/2026 or ISO
                        // Let's check both format
                        const formattedLogDate = log.timestamp.split(' '); // e.g., ["24/05/2026", "11:30:15"]
                        const [year, month, day] = logSearchDate.split('-'); // e.g., "2026-05-24" -> ["2026", "05", "24"]
                        const expectedFrenchDate = `${day}/${month}/${year}`; // "24/05/2026"
                        const expectedAltFrenchDate = `${day}-${month}-${year}`;
                        matchesDate = log.timestamp.includes(expectedFrenchDate) || log.timestamp.includes(expectedAltFrenchDate) || log.timestamp.includes(logSearchDate);
                      }
                      return matchesText && matchesDate;
                    });

                    if (filteredLogs.length === 0) {
                      return <p className="text-neutral-600 italic uppercase">Aucun log ne correspond aux critères de recherche.</p>;
                    }

                    return filteredLogs.map((log: any, idx: number) => (
                      <p key={idx} className="border-b border-neutral-900/40 pb-1 flex justify-between gap-4">
                        <span className="text-neutral-500">[{log.timestamp}]</span>
                        <span className="text-white font-medium flex-1 text-neutral-300">{log.event}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] ${
                          log.status === 'ATTACK_BLOCKED' ? 'bg-red-500/10 text-red-400' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {log.status}
                        </span>
                      </p>
                    ));
                  })()}
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: CUSTOMER REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              
              <div className="border-b border-white/5 pb-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <MessageSquare className="w-5 h-5 animate-pulse" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[#10b981]">
                      MODÉRATION DES AVIS CLIENTÈLE
                    </h3>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1 uppercase font-mono">
                    Examinez, approuvez ou rejetez les témoignages soumis par vos clients d'exception.
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-emerald-400 font-mono text-xs">
                  {reviewsList.filter(r => r.status === 'pending').length} EN ATTENTE
                </div>
              </div>

              {reviewsList.length === 0 ? (
                <div className="py-12 border border-dashed border-white/10 rounded-lg text-center text-neutral-500 text-xs uppercase font-mono tracking-widest">
                  Aucun avis n'est actuellement enregistré dans la base de données.
                </div>
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
                          >
                            Approuver & Publier ⚜_
                          </button>
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
                >
                  ✕ Fermer la facture
                </button>

                {/* Print area */}
                <div id="print-area" className="space-y-8 bg-black text-white p-4 border border-white/5 rounded">
                  
                  {/* The Luxury Double Border Invoice Card */}
                  <div className="border-4 border-double border-amber-500/30 p-8 rounded bg-neutral-950 tracking-wide relative">
                    
                    {/* Top Row Invoice Branding header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-amber-500/20 pb-6 gap-6">
                      <div className="flex items-center space-x-3 text-left font-sans">
                        <Logo size={50} />
                        <div>
                          <span className="text-2xl font-light tracking-[0.25em] text-white uppercase font-sans">StevenBmj</span>
                          <span className="text-[8px] font-mono tracking-[0.4em] text-amber-500 block uppercase">HAUTE COUTURE ET JOAILLERIE</span>
                        </div>
                      </div>

                      <div className="text-left md:text-right font-mono text-[10px] text-neutral-400 space-y-1">
                        <p className="text-yellow-400 font-semibold tracking-wider uppercase text-xs">FACTURE DE PRESTIGE (ADMIN)</p>
                        <p>FACTURE ID: {selectedOrderForInvoice.id}</p>
                        <p>DATE D'ÉMISSION: {new Date(selectedOrderForInvoice.date).toLocaleDateString('fr-FR')}</p>
                        <p>ATELIER: Paris / Bénin / Genève</p>
                      </div>
                    </div>

                    {/* Buyer / Seller Details column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 text-xs border-b border-white/5 text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block mb-1">DESTINATAIRE VIP</span>
                        <p className="font-semibold text-white uppercase text-sm">{selectedOrderForInvoice.customerName}</p>
                        <p className="text-neutral-400 font-mono">WhatsApp: {selectedOrderForInvoice.whatsapp}</p>
                        <p className="text-neutral-450">{selectedOrderForInvoice.address}, {selectedOrderForInvoice.city}</p>
                        {selectedOrderForInvoice.notes && (
                          <p className="text-[10px] text-neutral-500 italic mt-2">Notes d'Atelier: {selectedOrderForInvoice.notes}</p>
                        )}
                      </div>

                      <div className="space-y-1 md:text-right text-left">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block mb-1">MAISON DE VENTES</span>
                        <p className="font-semibold text-white">StevenBmj West Africa SARL</p>
                        <p className="text-neutral-400">Siège Cotonou, Bénin</p>
                        <p className="text-neutral-400 font-mono">Contact Concierge: +22955468138</p>
                        <p className="text-neutral-500">Email: stevenbmj202@gmail.com</p>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="py-6 overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-400 border-collapse">
                        <thead>
                          <tr className="border-b border-amber-500/20 text-white uppercase tracking-wider text-[10px] font-mono">
                            <th className="py-3 pr-4">CRÉATION / SÉLECTION</th>
                            <th className="py-3 px-4 text-center">QUANTITÉ</th>
                            <th className="py-3 px-4 text-right">PRIX UNITAIRE</th>
                            <th className="py-3 pl-4 text-right">MONTANT NET</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                          {selectedOrderForInvoice.items.map((item: any, id: number) => (
                            <tr key={id} className="hover:bg-white/5 duration-300">
                              <td className="py-4 pr-4 font-sans text-white text-left">
                                <span className="font-medium text-xs block">{item.productName}</span>
                                {item.selectedSize && (
                                  <span className="text-[9px] font-mono text-amber-500/80 uppercase">
                                    Taille sélectionnée: {item.selectedSize}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-center text-neutral-300">{item.quantity}</td>
                              <td className="py-4 px-4 text-right text-neutral-300">{formatPrice(item.price)}</td>
                              <td className="py-4 pl-4 text-right text-white font-semibold">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Calculations and Visual Signature QR Code bottom */}
                    <div className="border-t border-amber-500/20 pt-6 flex flex-col md:flex-row md:justify-between gap-8 items-center">
                      
                      {/* Real interactive QR code stamp */}
                      <div className="flex items-center space-x-4 bg-neutral-900/60 p-4 border border-white/5 rounded">
                        <div className="w-16 h-16 bg-white p-1 rounded inline-block shrink-0 flex items-center justify-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=121212&bgcolor=ffffff&data=${encodeURIComponent(
                              `MAISON STEVENBMJ\nFacture de prestige: ${selectedOrderForInvoice.id}\nClient: ${selectedOrderForInvoice.customerName}\nTotal paye: ${selectedOrderForInvoice.totalPrice} EUR\nDate d'emission: ${new Date(selectedOrderForInvoice.date).toLocaleDateString('fr-FR')}\nAchats: ${selectedOrderForInvoice.items.map((it: any) => `${it.quantity}x ${it.productName}`).join(', ')}\nMerci de votre confiance.`
                            )}`}
                            alt="QR Code Facture Souveraine"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-left font-mono">
                          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">CERTIFICAT D'AUTHENTICITÉ</p>
                          <p className="text-[9px] text-neutral-500 leading-snug">Timbre unique de conciergerie. Propriété exclusive garantie.</p>
                        </div>
                      </div>

                      <div className="text-right text-sm space-y-1.5 min-w-[15rem] font-mono text-left">
                        <div className="flex justify-between text-neutral-500">
                          <span>Livraison assurée :</span>
                          <span className="text-white text-right">Inclus</span>
                        </div>
                        <div className="flex justify-between text-yellow-500 text-lg font-bold border-t border-white/5 pt-2">
                          <span>TOTAL LIQUIDÉ :</span>
                          <span className="text-right">{formatPrice(selectedOrderForInvoice.totalPrice)}</span>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Print button row */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                  <button
                    onClick={() => handlePrintInvoice(selectedOrderForInvoice)}
                    className="px-6 h-12 border border-white/20 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded text-xs font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <span>🖨 IMPRIMER LA FACTURE DIRECTE</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = `Bonjour, voici le reçu de facturation pour votre commande en cours chez StevenBmj sous la référence : ${selectedOrderForInvoice.id}`;
                      window.open(`https://wa.me/${selectedOrderForInvoice.whatsapp.replace(/\+/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="px-6 h-12 bg-amber-400 text-black hover:bg-amber-300 rounded text-xs font-mono uppercase tracking-widest duration-300 flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <span>💬 RELANCER LE CLIENT SUR WHATSAPP</span>
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
