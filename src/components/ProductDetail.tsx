/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { MOCK_REVIEWS } from '../data/products';
import { Star, ShoppingBag, Heart, Shield, Sparkles, RefreshCw, Send, HelpCircle, Eye } from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenCheckout?: () => void;
}

export default function ProductDetail({ product, onClose, onSelectProduct, onOpenCheckout }: ProductDetailProps) {
  const { language, addToCart, wishlist, toggleWishlist, formatPrice, products, addVipPoints } = useApp();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [addedToCartRecently, setAddedToCartRecently] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isHoveredImg, setIsHoveredImg] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [view3D, setView3D] = useState(false);
  
  // Custom Reviews State
  const [reviewsList, setReviewsList] = useState(MOCK_REVIEWS);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');

  // 3D holographic rotation effect ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [angle, setAngle] = useState(0);

  // Suggested products recommended
  const recommendedInSameCategory = useMemo(() => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 3);
  }, [products, product.category, product.id]);

  const sizes = useMemo(() => {
    if (product.category === 'suits') return ['S', 'M', 'L', 'XL'];
    if (product.category === 'shoes') return ['40', '41', '42', '43', '44'];
    return []; // No size for watches / accessories / chains
  }, [product.category]);

  const isFavorite = wishlist.includes(product.id);

  // Set default size on mount
  useEffect(() => {
    if (sizes.length > 0) {
      setSelectedSize(sizes[0]);
    } else {
      setSelectedSize('');
    }
    setActiveImageIdx(0);
  }, [product, sizes]);

  // Simulated WebGL 3D rotating holographic wireframe model on custom Canvas
  useEffect(() => {
    if (!view3D || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localAngle = 0;

    const drawHologram = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      localAngle += 0.012;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const size3D = 90;

      // Outer rings of the holographic interface
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, size3D * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.arc(cx, cy, size3D * 1.3, localAngle, localAngle + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Rotating Cube / Diamond wireframe representing the object digitally
      const vertices = [
        { x: -1, y: -1, z: -1 },
        { x: 1, y: -1, z: -1 },
        { x: 1, y: 1, z: -1 },
        { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 },
        { x: 1, y: -1, z: 1 },
        { x: 1, y: 1, z: 1 },
        { x: -1, y: 1, z: 1 }
      ];

      // Rotate around X, Y, Z
      const radX = localAngle * 0.8;
      const radY = localAngle * 1.2;
      
      const projected = vertices.map(v => {
        // Rot Y
        let x1 = v.x * Math.cos(radY) - v.z * Math.sin(radY);
        let z1 = v.x * Math.sin(radY) + v.z * Math.cos(radY);
        // Rot X
        let y2 = v.y * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = v.y * Math.sin(radX) + z1 * Math.cos(radX);

        // Perspective projection
        const d = 3;
        const scaleDist = d / (d + z2);
        return {
          x: cx + x1 * size3D * scaleDist,
          y: cy + y2 * size3D * scaleDist
        };
      });

      // Connections lines
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#D97706';

      const drawLine = (i: number, j: number) => {
        ctx.beginPath();
        ctx.moveTo(projected[i].x, projected[i].y);
        ctx.lineTo(projected[j].x, projected[j].y);
        ctx.stroke();
      };

      // Connect lower face
      drawLine(0, 1); drawLine(1, 2); drawLine(2, 3); drawLine(3, 0);
      // Connect upper face
      drawLine(4, 5); drawLine(5, 6); drawLine(6, 7); drawLine(7, 4);
      // Connect vertical edges
      drawLine(0, 4); drawLine(1, 5); drawLine(2, 6); drawLine(3, 7);

      ctx.shadowBlur = 0; // reset

      // Draw scanner cyber-grid line slicing down
      const scanY = cy + Math.sin(localAngle * 2.5) * (size3D * 1.5);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - size3D * 1.6, scanY);
      ctx.lineTo(cx + size3D * 1.6, scanY);
      ctx.stroke();

      // Digital labels
      ctx.fillStyle = '#D97706';
      ctx.font = '9px monospace';
      ctx.fillText(`VECTOR MODEL LOADED // COMPILATION OK`, cx - 90, cy + size3D * 1.8);
      ctx.fillText(`ROT_ANGLE_Y: ${(localAngle % (Math.PI * 2)).toFixed(2)} RAD`, cx - 90, cy + size3D * 2.0);

      animId = requestAnimationFrame(drawHologram);
    };

    drawHologram();
    return () => cancelAnimationFrame(animId);
  }, [view3D]);

  // Advanced zoom handler
  const handleMouseMoveImg = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !newComment) return;

    const addedReview = {
      id: `rev-${Date.now()}`,
      author: reviewerName,
      rating: newRating,
      comment: newComment,
      commentEn: newComment,
      date: new Date().toISOString().split('T')[0],
      verified: true
    };

    setReviewsList([addedReview, ...reviewsList]);
    setReviewerName('');
    setNewComment('');
    addVipPoints(25); // high loyalty reward for review!
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-left">
      
      {/* Return button row */}
      <div className="flex items-center justify-between mb-8">
        <button
          id="btn-back-to-boutique"
          onClick={onClose}
          className="text-neutral-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 duration-300 cursor-pointer"
        >
          ← {language === 'FR' ? 'Retourner à la boutique' : 'Back to exhibition'}
        </button>
        <span className="text-[10px] font-mono tracking-widest text-neutral-600 block uppercase">
          STEVENBMJ HAUTE COUTURE SYSTEM CODE: {product.id}
        </span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Hand: Gallery Images and Hologram 3D */}
        <div className="space-y-6">
          
          {/* Main Visual Arena with Zoom/3D Toggle */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center">
            
            {view3D ? (
              // Cyber holographic model canvas
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/95">
                <canvas 
                  ref={canvasRef} 
                  width={340} 
                  height={340} 
                  className="w-[340px] h-[340px]" 
                />
                <span className="absolute bottom-6 font-mono text-[9px] text-neutral-600 tracking-[0.2em] uppercase">
                  PROJECTION HOLOGRAPHIQUE 3D DISCLOSÉ // CYBER MODEL
                </span>
              </div>
            ) : (
              // HD Image with Advanced Mouse Zooming Hover effect
              <div
                id="hd-zoom-container"
                className="w-full h-full relative cursor-zoom-in"
                onMouseMove={handleMouseMoveImg}
                onMouseEnter={() => setIsHoveredImg(true)}
                onMouseLeave={() => setIsHoveredImg(false)}
              >
                <img
                  src={product.images[activeImageIdx]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover object-center transition-all duration-300 ${
                    isHoveredImg ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                
                {/* Simulated zoom lens frame */}
                {isHoveredImg && (
                  <div
                    className="absolute inset-0 bg-no-repeat pointer-events-none rounded-lg"
                    style={{
                      backgroundImage: `url(${product.images[activeImageIdx]})`,
                      backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                      backgroundSize: '200%', // 2x magnification
                      height: '100%',
                      width: '100%',
                    }}
                  />
                )}
              </div>
            )}

            {/* Float badges over media */}
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                id="btn-toggle-3d-visual"
                onClick={() => setView3D(!view3D)}
                className={`px-3 py-1.5 border border-white/10 text-[9px] font-mono uppercase tracking-widest rounded-full duration-500 flex items-center gap-1 cursor-pointer bg-black/60 shadow-lg ${
                  view3D ? 'border-amber-400 bg-amber-400/15 text-amber-300' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${view3D ? 'animate-spin' : ''}`} />
                <span>{view3D ? 'Vue HD' : 'VUE 3D'}</span>
              </button>
            </div>
          </div>

          {/* Sub Thumbnails gallery selection list (HD is standard) */}
          {!view3D && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, i) => (
                <button
                  id={`btn-thumbnail-idx-${i}`}
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`aspect-square relative overflow-hidden rounded bg-neutral-900 border transition-all duration-300 cursor-pointer ${
                    activeImageIdx === i ? 'border-amber-400 scale-[1.02]' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} subimage ${i}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center filter brightness-90"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Luxury guarantees */}
          <div className="bg-neutral-950 border border-white/5 rounded-lg p-5 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Shield className="w-5 h-5 text-amber-500 mx-auto stroke-1" />
              <p className="text-[10px] text-white font-semibold uppercase tracking-wider">Matières Nobles</p>
              <p className="text-[9px] text-neutral-500">Sélection Or 18k & Cuir italien</p>
            </div>
            <div className="space-y-1 border-x border-white/5">
              <Sparkles className="w-5 h-5 text-amber-500 mx-auto stroke-1 animate-pulse" />
              <p className="text-[10px] text-white font-semibold uppercase tracking-wider">Expédition Privée</p>
              <p className="text-[9px] text-neutral-500">Par porteur de confiance</p>
            </div>
            <div className="space-y-1">
              <RefreshCw className="w-5 h-5 text-amber-500 mx-auto stroke-1" />
              <p className="text-[10px] text-white font-semibold uppercase tracking-wider">Sur Mesure</p>
              <p className="text-[9px] text-neutral-500">Ajustements ateliers offerts</p>
            </div>
          </div>

        </div>

        {/* Right Hand: Product Information buying controls */}
        <div className="space-y-6">
          <div>
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded uppercase tracking-[0.2em]">
              {product.category}
            </span>

            <h1 className="text-3xl md:text-4xl font-light text-white uppercase tracking-wide mt-4">
              {language === 'FR' ? product.name : product.nameEn}
            </h1>

            <div className="flex items-center space-x-6 mt-3">
              <div className="flex items-center space-x-1">
                <Star className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-mono font-bold text-neutral-300">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-neutral-600">|</span>
              <span className="text-xs font-mono tracking-wider text-amber-500/80">
                {product.stock > 0 ? `STOCK GARANTI: ${product.stock} UNITÉS DISPONIBLES` : 'SOUS COMMANDE ATELIER'}
              </span>
            </div>
          </div>

          {/* Pricing area */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-lg p-6 flex flex-col justify-center space-y-1">
            <span className="text-[9px] font-mono text-neutral-500 uppercase">Tarif Souverain</span>
            {product.promoPrice ? (
              <div className="flex items-baseline space-x-3">
                <span className="text-sm text-neutral-500 line-through font-mono">
                  {formatPrice(product.price)}
                </span>
                <span className="text-3xl font-extrabold text-yellow-400 font-mono tracking-tight filter drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                  {formatPrice(product.promoPrice)}
                </span>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-widest">
                  OFFRE PRIVILÈGE
                </span>
              </div>
            ) : (
              <span className="text-2xl font-semibold text-white font-mono">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Size pickers if tailoring or shoe */}
          {sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                <span>{product.category === 'suits' ? 'TAILLE COSTUME' : 'POINTURE SOULIER'}</span>
                <span className="text-white font-bold underline cursor-pointer">{language === 'FR' ? 'GUIDE DES TAILLES' : 'SIZE GUIDE'}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {sizes.map((s) => (
                  <button
                    id={`btn-size-pick-${s}`}
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`h-11 min-w-[3rem] px-4 rounded border text-xs font-mono font-medium transition-all duration-300 cursor-pointer flex items-center justify-center ${
                      selectedSize === s
                        ? 'bg-amber-400 text-black border-amber-400 font-bold scale-[1.03]'
                        : 'bg-neutral-900 border-white/5 text-neutral-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description details */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">LA CRÉATION</span>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              {language === 'FR' ? product.description : product.descriptionEn}
            </p>
          </div>

          {/* Technical specification table */}
          {product.specs.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">FICHE TECHNIQUE</span>
              <div className="border border-white/5 rounded-lg overflow-hidden bg-neutral-950 flex flex-col divide-y divide-white/5">
                {product.specs.map((item, id) => (
                  <div key={id} className="flex justify-between items-center p-3 text-xs">
                    <span className="text-neutral-500 font-mono tracking-wider">{item.key}</span>
                    <span className="text-neutral-300 font-medium text-right font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row Add to bag / Wishlist */}
          <div className="flex items-center space-x-4 border-t border-white/5 pt-8 mt-6">
            {/* Quantity adjust */}
            <div className="flex items-center border border-white/10 rounded overflow-hidden h-12 bg-neutral-950">
              <button
                id="btn-qty-minus"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="px-4 font-mono text-xs text-white min-w-[3rem] text-center">{quantity}</span>
              <button
                id="btn-qty-plus"
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Direct Add Bag button */}
            <button
              id="btn-add-to-cart-detail"
              onClick={() => {
                addToCart(product, quantity, selectedSize);
                addVipPoints(quantity * 10);
                setAddedToCartRecently(true);
              }}
              disabled={product.stock === 0}
              className="flex-1 h-12 bg-amber-400 text-black rounded text-xs tracking-widest font-mono uppercase font-black hover:bg-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{product.stock === 0 ? 'RUPTURE STOCK' : 'PRENDRE LA CRÉATION'}</span>
            </button>

            {/* Direct wishlist toggle button */}
            <button
              id="btn-wishlist-detail-toggle"
              onClick={() => toggleWishlist(product.id)}
              className={`h-12 w-12 border rounded-md flex items-center justify-center duration-300 cursor-pointer ${
                isFavorite 
                  ? 'border-red-500 bg-red-500/10 text-red-400' 
                  : 'border-white/10 bg-neutral-900 text-neutral-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick checkout redirect shortcut when added recently */}
          {addedToCartRecently && (
            <button
              id="btn-quick-redirect-cart"
              onClick={() => {
                if (onOpenCheckout) {
                  onOpenCheckout();
                }
              }}
              className="w-full h-11 bg-amber-500 hover:bg-amber-400 text-black font-mono text-[11px] font-black uppercase tracking-widest rounded transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 animate-bounce mt-4 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
            >
              <span>{language === 'FR' ? '✦ VALIDER MON PANIER SANS ATTENDRE ➔' : '✦ PROCEED TO PRIVATE CHECKOUT ➔'}</span>
            </button>
          )}

        </div>
      </div>

      {/* Suggested Recommendations carousel */}
      {recommendedInSameCategory.length > 0 && (
        <div className="mt-24 border-t border-white/5 pt-16">
          <h3 className="text-lg font-light tracking-[0.25em] text-white uppercase mb-8">
            {language === 'FR' ? 'Accords Recommandés' : 'Recommended Pairings'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {recommendedInSameCategory.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectProduct(rec)}
                className="group cursor-pointer rounded-lg overflow-hidden border border-white/5 bg-neutral-950/40 p-3 space-y-3 hover:border-amber-500/20 duration-300 flex flex-col"
              >
                <div className="aspect-square bg-neutral-900 rounded overflow-hidden">
                  <img
                    src={rec.images[0]}
                    alt={rec.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center filter brightness-90 group-hover:brightness-100 group-hover:scale-103 duration-500"
                  />
                </div>
                <div className="flex flex-col text-left space-y-1">
                  <h4 className="text-xs text-white group-hover:text-amber-400 duration-300 uppercase tracking-wider">{language === 'FR' ? rec.name : rec.nameEn}</h4>
                  <span className="text-xs font-mono font-medium text-amber-500">{formatPrice(rec.promoPrice || rec.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structured Customer Notes and ratings listings table */}
      <div className="mt-24 border-t border-white/5 pt-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        
        {/* Review summary stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-light tracking-[0.2em] text-white uppercase">
            {language === 'FR' ? 'Avis de la Clientèle' : 'Clientelle Appraisals'}
          </h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            {language === 'FR' 
              ? "Chaque avis représente une expertise authentique certifiée par acte d'huissier de la maison."
              : "Every appraisal relates an authenticated record validated by private secure brand couriers."}
          </p>

          <div className="flex items-center space-x-3 bg-neutral-950 p-6 rounded-lg border border-white/5">
            <span className="text-4xl font-black font-mono text-white">{product.rating.toFixed(1)}</span>
            <div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-3.5 h-3.5 ${star <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-500'}`} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono tracking-wider text-amber-500/80 uppercase block mt-1">
                Note de Prestige {reviewsList.length} avis
              </span>
            </div>
          </div>
          
          {/* Add Review form */}
          <form onSubmit={submitReview} className="space-y-3 bg-neutral-900/30 p-5 rounded-lg border border-white/5">
            <h4 className="text-xs uppercase tracking-[0.2em] text-amber-400 font-bold">Rédiger un avis privé</h4>
            
            <div className="flex items-center space-x-1 py-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  id={`btn-star-rating-select-${s}`}
                  key={s}
                  onClick={() => setNewRating(s)}
                  className="p-1 cursor-pointer duration-200 hover:scale-115"
                >
                  <Star className={`w-4 h-4 ${s <= newRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'}`} />
                </button>
              ))}
            </div>

            <input 
              id="form-review-name"
              type="text"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder={language === 'FR' ? 'Votre nom complet' : 'Your full name'}
              className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3.5 text-white focus:outline-none focus:border-amber-400 rounded"
            />

            <textarea 
              id="form-review-comment"
              required
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={language === 'FR' ? 'Partagez votre appréciation...' : 'Write your private reviews here...'}
              className="w-full bg-neutral-950 border border-white/10 text-xs px-3.5 py-3.5 text-white focus:outline-none focus:border-amber-400 rounded"
            />

            <button
              id="btn-submit-review"
              type="submit"
              className="w-full bg-neutral-900 border border-white/10 text-[10px] uppercase font-mono tracking-widest text-amber-500 hover:bg-amber-400 hover:text-black py-2.5 duration-300 cursor-pointer rounded font-medium"
            >
              Envoyer l'évaluation
            </button>
          </form>
        </div>

        {/* Reviews lists */}
        <div className="lg:col-span-2 space-y-6">
          {reviewsList.map((review) => (
            <div key={review.id} className="border-b border-white/5 pb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">{review.author}</h4>
                  <span className="text-[9px] font-mono text-neutral-500">{review.date}</span>
                </div>
                <div className="flex items-center space-x-1 py-0.5 px-2 bg-neutral-900/80 rounded border border-white/5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-mono font-bold text-neutral-400">{review.rating}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-450 italic leading-relaxed">
                "{language === 'FR' ? review.comment : review.commentEn}"
              </p>
              {review.verified && (
                <span className="text-[8px] font-mono text-amber-500/80 mt-2 block uppercase tracking-widest">
                  ✓ CLIENT PRIVILÈGE SBMJ CERTIFIÉ
                </span>
              )}
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
