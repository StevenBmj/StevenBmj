/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Category } from '../types';
import { Search, SlidersHorizontal, Heart, ShoppingBag, Eye, Star, Sparkles, Check } from 'lucide-react';

interface BoutiqueProps {
  onSelectProduct: (product: Product) => void;
}

export default function Boutique({ onSelectProduct }: BoutiqueProps) {
  const { 
    language, 
    products, 
    addToCart, 
    toggleWishlist, 
    wishlist, 
    formatPrice,
    cart,
    setCartOpen
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [priceRange, setPriceRange] = useState<number>(35000);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [addedNotifyId, setAddedNotifyId] = useState<string | null>(null);

  // Categories list
  const categoriesList = useMemo(() => [
    { id: 'all', labelFr: "Tout voir", labelEn: "All Products" },
    { id: 'watches', labelFr: "Montres d'exception", labelEn: "Prestige Watches" },
    { id: 'chains', labelFr: "Chaînes & Orfèvrerie", labelEn: "Luxury Chains" },
    { id: 'suits', labelFr: "Tailoring & Tissus", labelEn: "Tailoring & Royal Fabrics" },
    { id: 'women', labelFr: "Maison Femme Act I", labelEn: "Women's Haute Couture" },
    { id: 'perfumes', labelFr: "Parfums de Qualité", labelEn: "Exquisite Perfumes" },
    { id: 'shoes', labelFr: "Souliers & Mocassins", labelEn: "High-end Shoes" },
    { id: 'accessories', labelFr: "Accessoires d'Élite", labelEn: "Elegant Accessories" },
  ], []);

  // Filter and sort computation
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filter by text search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.nameEn.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q)
      );
    }

    // Filter by price base (EUR)
    result = result.filter(p => {
      const actualPrice = p.promoPrice || p.price;
      return actualPrice <= priceRange;
    });

    // Sort
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy, priceRange]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedNotifyId(product.id);
    setTimeout(() => {
      setAddedNotifyId(null);
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Search and Navigation Panel header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-2xl font-light tracking-[0.2em] text-white uppercase sm:text-3xl">
            {language === 'FR' ? 'Les Salons de Vente' : 'The Exhibition Halls'}
          </h2>
          <p className="text-xs text-neutral-500 tracking-wider mt-1">
            {language === 'FR' 
              ? 'Sélection souveraine de pièces de haute façon pour gentleman exigeant.'
              : 'Sovereign curation of high-end tailoring and luxurious mechanics.'}
          </p>
        </div>

        {/* Quick Search Input */}
        <div className="relative w-full max-w-xs">
          <input
            id="boutique-search-query"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'FR' ? 'Rechercher une pièce...' : 'Search fine pieces...'}
            className="w-full bg-neutral-900/50 border border-white/10 text-xs px-10 py-3 rounded-md text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/30 transition-all duration-300"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
        </div>
      </div>

      {/* Main filters grid and lists */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-8">
        
        {/* Sidebar Controls (Filters & Sorting) */}
        <div className="space-y-8 lg:col-span-1">
          <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-6 space-y-6 backdrop-blur-md">
            
            {/* Control Header */}
            <div className="flex items-center space-x-2 text-white border-b border-white/5 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider">FILTRES</span>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                {language === 'FR' ? 'CATÉGORIES' : 'CATEGORIES'}
              </label>
              <div className="flex flex-col space-y-1">
                {categoriesList.map((cat) => (
                  <button
                    id={`btn-cat-filter-${cat.id}`}
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`text-xs text-left py-2 px-3 rounded duration-300 cursor-pointer flex justify-between items-center ${
                      selectedCategory === cat.id 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' 
                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{language === 'FR' ? cat.labelFr : cat.labelEn}</span>
                    {selectedCategory === cat.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Max Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
                  {language === 'FR' ? 'PRIX MAX' : 'MAX PRICE'}
                </label>
                <span className="text-xs text-amber-400 font-mono">{formatPrice(priceRange)}</span>
              </div>
              <input
                id="filter-price-range"
                type="range"
                min="500"
                max="35000"
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
                <span>{formatPrice(500)}</span>
                <span>{formatPrice(35000)}</span>
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">
                {language === 'FR' ? 'TRI INTÉLLIGENT' : 'SMART ORDER'}
              </label>
              <select
                id="filter-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-neutral-950 border border-white/10 text-xs px-3 py-2.5 rounded text-neutral-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="featured">{language === 'FR' ? 'Exclusivités d\'abord' : 'Featured Pieces'}</option>
                <option value="price-asc">{language === 'FR' ? 'Prix croissant' : 'Price: Low to High'}</option>
                <option value="price-desc">{language === 'FR' ? 'Prix décroissant' : 'Price: High to Low'}</option>
                <option value="rating">{language === 'FR' ? 'Pièces les mieux notées' : 'Top Customer Rated'}</option>
              </select>
            </div>

          </div>
        </div>

        {/* Products Grid list */}
        <div className="lg:col-span-3">
          
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 border border-dashed border-white/5 rounded-xl bg-neutral-900/10">
              <Sparkles className="w-8 h-8 text-neutral-600 mb-4 stroke-1 animate-pulse" />
              <p className="text-sm text-neutral-400 uppercase tracking-widest">
                {language === 'FR' ? 'Aucun chef-d\'œuvre ne correspond' : 'No exquisite pieces matched your search'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setPriceRange(35000);
                }}
                className="text-amber-400 text-xs mt-3 underline font-mono cursor-pointer"
              >
                {language === 'FR' ? 'Réinitialiser les filtres' : 'Reset exhibition filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => {
                const isFavorite = wishlist.includes(product.id);
                const hasPromo = !!product.promoPrice;
                const isNotifiedAdded = addedNotifyId === product.id;

                return (
                  <div
                    id={`product-card-${product.id}`}
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-white/5 bg-neutral-950/80 duration-500 hover:border-amber-500/35 hover:shadow-[0_12px_30px_rgba(217,119,6,0.08)] cursor-pointer"
                  >
                    
                    {/* Badge container absolute */}
                    {(product.badge || product.isExclu) && (
                      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-1">
                        {product.isExclu && (
                          <span className="bg-gradient-to-r from-amber-700 to-amber-500 text-[8px] font-mono tracking-widest text-white uppercase px-2.5 py-1 rounded shadow-lg backdrop-blur">
                            {language === 'FR' ? 'EXCLUSIF' : 'EXCLUSIVE'}
                          </span>
                        )}
                        {product.badge && (
                          <span className="bg-neutral-900/95 text-yellow-400 text-[8px] font-mono tracking-widest uppercase border border-yellow-500/20 px-2.5 py-1 rounded shadow-md">
                            {language === 'FR' ? product.badge : product.badgeEn}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stock Alert Label */}
                    {product.stock <= 3 && product.stock > 0 && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-red-950/90 border border-red-500/30 text-red-400 text-[8px] font-mono tracking-wider px-2 py-0.5 rounded">
                          {language === 'FR' ? `Reste ${product.stock}` : `Only ${product.stock} left`}
                        </span>
                      </div>
                    )}

                    {/* Product visual area, scaled on hover */}
                    <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 filter brightness-95 group-hover:brightness-100"
                        loading="lazy"
                      />
                      
                      {/* Glassmorphism Quick Controls Toolbar appearing on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
                        <button
                          id={`btn-quick-view-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickViewProduct(product);
                          }}
                          className="p-3 bg-neutral-900/90 border border-white/10 text-white rounded-full hover:bg-amber-400 hover:text-black hover:border-amber-400 hover:scale-110 active:scale-95 duration-300 cursor-pointer shadow-xl"
                          title="Aperçu rapide / Quick view"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          id={`btn-toggle-wish-prod-${product.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(product.id);
                          }}
                          className={`p-3 rounded-full border shadow-xl hover:scale-110 active:scale-95 duration-300 cursor-pointer ${
                            isFavorite 
                              ? 'bg-red-500/90 border-red-500 text-white hover:bg-red-600' 
                              : 'bg-neutral-900/90 border-white/10 text-neutral-300 hover:text-red-400'
                          }`}
                          title="Ajouter aux favoris / Wishlist"
                        >
                          <Heart className={`${isFavorite ? 'fill-current' : ''} w-4 h-4`} />
                        </button>
                      </div>
                    </div>

                    {/* Card Body Information */}
                    <div className="flex flex-1 flex-col p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        {/* Rating block */}
                        <div className="flex items-center space-x-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-1" />
                          <span className="text-[10px] font-mono font-semibold text-neutral-300">{product.rating.toFixed(1)}</span>
                        </div>
                        {/* Category tag */}
                        <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500">
                          {product.category}
                        </span>
                      </div>

                      {/* Title heading */}
                      <h3 className="text-sm font-light tracking-wide text-white group-hover:text-amber-400 duration-300">
                        {language === 'FR' ? product.name : product.nameEn}
                      </h3>

                      {/* Brief text review */}
                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                        {language === 'FR' ? product.description : product.descriptionEn}
                      </p>

                      {/* Spacer layout */}
                      <div className="flex-1" />

                      {/* Card Lower (Pricing and Bag trigger) */}
                      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                        <div className="flex flex-col text-left">
                          {hasPromo ? (
                            <>
                              <span className="text-[10px] text-neutral-600 line-through font-mono">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-sm font-semibold text-yellow-400 font-mono">
                                {formatPrice(product.promoPrice!)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-white font-mono">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>

                        {/* Interactive Add Button */}
                        <button
                          id={`btn-add-to-cart-${product.id}`}
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock === 0}
                          className={`flex items-center justify-center rounded px-3 py-1.5 duration-300 relative select-none cursor-pointer ${
                            product.stock === 0
                              ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
                              : isNotifiedAdded
                                ? 'bg-amber-400 text-black border border-amber-400'
                                : 'bg-white/5 border border-white/10 text-white hover:bg-amber-400 hover:text-black hover:border-amber-400'
                          }`}
                        >
                          {product.stock === 0 ? (
                            <span className="text-[9px] font-mono uppercase tracking-widest">{language === 'FR' ? 'Rupture' : 'Sold Out'}</span>
                          ) : isNotifiedAdded ? (
                            <span className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1">
                              <Check className="w-3 h-3" /> {language === 'FR' ? 'Ajouté!' : 'Added!'}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono uppercase tracking-widest flex items-center gap-1">
                              <ShoppingBag className="w-3 h-3" /> {language === 'FR' ? 'Prendre' : 'Select'}
                            </span>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Quick View Modal Overlay popup */}
      {quickViewProduct && (
        <div id="quickview-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/10 rounded-lg shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto">
            {/* Close trigger */}
            <button
              id="btn-close-quickview"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white bg-black/40 border border-white/10 rounded-full cursor-pointer"
            >
              ✕
            </button>

            {/* Product image section */}
            <div className="w-full md:w-1/2 bg-neutral-900 aspect-square md:aspect-auto">
              <img
                src={quickViewProduct.images[0]}
                alt={quickViewProduct.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center filter brightness-95"
              />
            </div>

            {/* Informative description column */}
            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4 text-left">
              <div>
                <span className="text-[8px] font-mono bg-yellow-400/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded inline-block uppercase">
                  {quickViewProduct.category}
                </span>

                <h3 className="text-xl font-light tracking-wide text-white mt-3">
                  {language === 'FR' ? quickViewProduct.name : quickViewProduct.nameEn}
                </h3>

                <div className="flex items-center space-x-1 mt-2">
                  <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-mono font-semibold text-neutral-300">{quickViewProduct.rating}</span>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed mt-4">
                  {language === 'FR' ? quickViewProduct.description : quickViewProduct.descriptionEn}
                </p>

                {/* Specific features listings table */}
                <div className="space-y-1.5 mt-5">
                  <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">
                    {language === 'FR' ? 'SPÉCIFICATIONS' : 'SPECIFICATIONS'}
                  </span>
                  <div className="border border-white/5 rounded divide-y divide-white/5 bg-neutral-900/10">
                    {quickViewProduct.specs.map((spec, i) => (
                      <div key={i} className="flex justify-between items-center p-2 text-[10px]">
                        <span className="text-neutral-500">{spec.key}</span>
                        <span className="text-neutral-300 font-mono text-right">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lower dynamic buy section inside quickview */}
              <div className="border-t border-white/5 pt-4 flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase">{language === 'FR' ? 'PRIX' : 'PRICE'}</span>
                    {quickViewProduct.promoPrice ? (
                      <div className="flex items-baseline space-x-2">
                        <span className="text-xs text-neutral-600 line-through font-mono">
                          {formatPrice(quickViewProduct.price)}
                        </span>
                        <span className="text-lg font-bold text-yellow-400 font-mono">
                          {formatPrice(quickViewProduct.promoPrice)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-white font-mono">
                        {formatPrice(quickViewProduct.price)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase">
                      {language === 'FR' ? 'STOCK INVENTAIRE' : 'INVENTORY STOCK'}
                    </span>
                    <span className="text-xs font-mono font-medium text-neutral-300">
                      {quickViewProduct.stock > 0 
                        ? `${quickViewProduct.stock} ${language === 'FR' ? 'Unités' : 'Units'}` 
                        : language === 'FR' ? 'Épuisé' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-quick-add-to-cart"
                  onClick={(e) => {
                    handleAddToCart(e, quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  disabled={quickViewProduct.stock === 0}
                  className="w-full bg-amber-400 text-black py-3 rounded text-xs select-none uppercase tracking-widest font-mono font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  {quickViewProduct.stock === 0 
                    ? language === 'FR' ? 'Indisponible' : 'Out of Stock'
                    : language === 'FR' ? 'Placer dans le Panier' : 'Place inside Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Fast Checkout CTA Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg bg-neutral-900 border-2 border-amber-500/80 p-4 rounded-xl shadow-[0_20px_50px_rgba(217,119,6,0.3)] text-center flex items-center justify-between gap-4 backdrop-blur-md">
          <div className="text-left font-mono">
            <span className="text-[9px] text-amber-500 uppercase font-bold block tracking-widest">
              {language === 'FR' ? 'SBMJ PANIER ACTIF' : 'SBMJ ACTIVE BAG'}
            </span>
            <span className="text-xs text-white uppercase block mt-0.5 font-bold font-sans">
              {cart.reduce((acc, c) => acc + c.quantity, 0)} {language === 'FR' ? 'Pièce(s) d\'exception' : 'Prestige Item(s)'}
            </span>
          </div>
          <button
            id="btn-fast-checkout"
            onClick={() => setCartOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-mono font-bold text-xs uppercase rounded hover:brightness-110 duration-200 cursor-pointer shadow-md animate-pulse"
          >
            {language === 'FR' ? 'Valider mon panier sans attendre ⚜️' : 'Check out my cart now ⚜️'}
          </button>
        </div>
      )}

    </div>
  );
}
