/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, MessageSquare, X, Send, User, Bot, ShoppingBag } from 'lucide-react';
import Logo from './Logo';
import { Product } from '../types';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  recommendedProduct?: Product;
}

export default function LuxuryChatbot() {
  const { language, products, addToCart, formatPrice } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: language === 'FR'
        ? "Salutations de la Maison StevenBmj. Je suis votre conseiller personnel d'exception. Comment puis-je vous guider dans les salons de haute couture et d'orfèvrerie aujourd'hui ?"
        : "Salutations from the House of StevenBmj. I am your private cognitive assistant. How may I guide you through our Prestige galleries today?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, language })
      });

      if (res.ok) {
        const data = await res.json();
        
        let recommendedProduct: Product | undefined;
        // Attempt search in local catalogue to attach product object if ai recommended one
        if (data.recommendedProductId) {
          recommendedProduct = products.find(p => p.id === data.recommendedProductId);
        }

        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.reply,
          recommendedProduct
        }]);
      } else {
        // Fallback message
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: language === 'FR' 
            ? "Pardonnez cette brève interruption de réseau de notre salon privé. Je reste entièrement à votre service par WhatsApp au +22955468138."
            : "Apologies, our concierge wire is temporarily busy. Feel free to connect directly through our luxury WhatsApp line at +22955468138."
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      
      {/* Floating Sparkled launcher bubble */}
      {!isOpen && (
        <button
          id="btn-chatbot-launch"
          onClick={() => setIsOpen(true)}
          className="p-4 bg-amber-400 hover:bg-amber-300 text-black hover:scale-105 active:scale-95 transition-all duration-300 rounded-full shadow-2xl flex items-center justify-center cursor-pointer relative group-hover:after:content-['Assistant']"
        >
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </div>
          <Bot className="w-5.5 h-5.5" />
        </button>
      )}

      {/* Structured chatbot widget frame */}
      {isOpen && (
        <div className="w-[22rem] sm:w-[24rem] h-[30rem] bg-neutral-950 border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden text-left relative">
          
          {/* Chat header area */}
          <div className="bg-neutral-900 border-b border-white/5 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center space-x-2.5">
              <Logo size={32} />
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-white">CONCIERGERIE PRIVÉE AI</p>
                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest">STEVENBMJ CONCIERGE</span>
                </div>
              </div>
            </div>
            <button
              id="btn-chatbot-close"
              onClick={() => setIsOpen(false)}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/5 duration-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages list */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-950 text-xs text-neutral-300 leading-relaxed max-h-[calc(100%-8rem)] border-b border-white/5"
          >
            {messages.map((m, id) => {
              const isUser = m.sender === 'user';
              return (
                <div key={id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2.5`}>
                  {/* Avatar bubble logo */}
                  {!isUser && (
                    <div className="h-7 w-7 rounded-full bg-amber-400/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-amber-500" />
                    </div>
                  )}

                  <div className="max-w-[78%] flex flex-col space-y-1">
                    {/* Message Box */}
                    <div className={`p-3 rounded-lg border text-left ${
                      isUser 
                        ? 'bg-amber-400 text-black border-amber-400 font-medium' 
                        : 'bg-neutral-900/80 border-white/5 text-neutral-300'
                    }`}>
                      <p>{m.text}</p>
                    </div>

                    {/* Highly interactive micro product card if bot recommends one */}
                    {m.recommendedProduct && (
                      <div className="mt-2.5 bg-neutral-950 border border-amber-500/25 rounded p-2.5 flex items-center gap-3 backdrop-blur shadow-lg animate-fade-in text-left">
                        <img 
                          src={m.recommendedProduct.images[0]} 
                          alt={m.recommendedProduct.name} 
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 object-cover rounded" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-white font-semibold truncate uppercase">
                            {language === 'FR' ? m.recommendedProduct.name : m.recommendedProduct.nameEn}
                          </p>
                          <p className="text-[9px] text-amber-500 font-mono font-bold mt-0.5">
                            {formatPrice(m.recommendedProduct.promoPrice || m.recommendedProduct.price)}
                          </p>
                        </div>
                        <button
                          id={`btn-bot-add-cart-${m.recommendedProduct.id}`}
                          onClick={() => addToCart(m.recommendedProduct!, 1)}
                          className="p-1 px-2.5 bg-amber-400 text-black text-[9px] font-mono tracking-widest uppercase rounded hover:bg-amber-300 duration-200 cursor-pointer shrink-0"
                          title="Ajouter au coffret"
                        >
                          PRENDRE
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start items-center space-x-2">
                <div className="h-7 w-7 rounded-full bg-amber-400/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-500 animate-spin" />
                </div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-neutral-500 animate-pulse">Le concierge réfléchit...</span>
              </div>
            )}
          </div>

          {/* Input text form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-neutral-900 border-t border-white/5 flex items-center space-x-2 shrink-0">
            <input
              id="chatbot-msg-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={language === 'FR' ? 'Demander un costume, une montre...' : 'Inquire about watches, chains...'}
              className="flex-1 bg-neutral-950 border border-white/5 text-xs px-3 py-2.5 rounded text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/15"
            />
            <button
              id="btn-chatbot-send"
              type="submit"
              className="p-2.5 bg-amber-400 text-black rounded-lg hover:bg-white hover:text-black duration-300 cursor-pointer flex justify-center items-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
