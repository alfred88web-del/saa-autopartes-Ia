import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Chat } from './components/Chat';
import { ProductGrid } from './components/ProductGrid';
import { SetupModal } from './components/SetupModal';
import { ChatMessage, Product, AppConfig } from './types';
import { parseUserQuery, generateSummary, performSemanticSearch } from './services/gemini';
import { searchInventory, MOCK_INVENTORY } from './services/inventory';

const STORAGE_KEY = 'autopartes_config_v1';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! 👋 Soy Carlos, tu experto en repuestos. ¿En qué puedo ayudarte hoy? Cuéntame qué auto tienes o qué problema te está dando.',
      timestamp: new Date()
    }
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  
  // Mobile Navigation State
  const [activeTab, setActiveTab] = useState<'chat' | 'results'>('chat');
  
  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Default config with Persistence Logic
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading config from storage", e);
    }
    return {
      useMockData: true, 
      appsScriptUrl: '', 
      googleApiKey: '',  
      whatsappNumber: '' 
    };
  });

  // Check for Magic Link config on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedConfig = params.get('cfg');
    
    if (encodedConfig) {
      try {
        const decodedStr = atob(encodedConfig);
        const parsedConfig = JSON.parse(decodedStr) as AppConfig;
        
        if (parsedConfig && typeof parsedConfig === 'object') {
            setConfig(parsedConfig);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedConfig));
            window.history.replaceState({}, document.title, window.location.pathname);

            if (parsedConfig.appsScriptUrl || parsedConfig.googleApiKey) {
                setMessages(prev => [{
                    id: 'sys_connect',
                    role: 'system',
                    text: '✅ Configuración cargada y guardada automáticamente.',
                    timestamp: new Date()
                }, ...prev]);
            }
        }
      } catch (e) {
        console.error("Error parsing magic link config", e);
      }
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (text.trim().toLowerCase() === '/admin') {
        setIsSettingsOpen(true);
        return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date()
    };
    // Update UI immediately
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    
    try {
      let foundProducts: Product[] = [];
      let replyText = "";

      // STRATEGY A: SEMANTIC SEARCH (AI sees full Mock DB + History)
      if (config.useMockData) {
        
        // Pass the CURRENT conversation history (including the new user message we just added logic-wise)
        const currentHistory = [...messages, userMsg];
        
        const result = await performSemanticSearch(text, currentHistory, MOCK_INVENTORY, config.googleApiKey);
        foundProducts = result.matches;
        replyText = result.reply;

      } 
      // STRATEGY B: REMOTE SEARCH (Legacy flow)
      else {
          const criteria = await parseUserQuery(text, config.googleApiKey);
          
          if (criteria.intent === 'AGENT') {
             const reply = criteria.conversationalReply || "Para esa información, contacta a un asesor.";
             const phone = config.whatsappNumber || "5490000000000";
             const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Consulta: " + text)}`;

             setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: reply,
                timestamp: new Date(),
                actionLabel: "Contactar WhatsApp",
                actionLink: waUrl
             }]);
             setIsProcessing(false);
             return; 
          }

          if (criteria.intent === 'CHAT') {
             setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: criteria.conversationalReply || "¡Hola! ¿En qué puedo ayudarte?",
                timestamp: new Date()
             }]);
             setIsProcessing(false);
             return;
          }

          foundProducts = await searchInventory(criteria, false, config.appsScriptUrl);
          replyText = await generateSummary(text, foundProducts, criteria, config.googleApiKey);
      }

      // Update Products
      setProducts(foundProducts);

      // Only switch tab if products were actually found (meaning the AI decided it was a search result)
      if (foundProducts.length > 0) {
        setTimeout(() => setActiveTab('results'), 500);
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Pipeline Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Uh, disculpa. Se me colgó el sistema un segundo. ¿Me lo puedes repetir?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => [...prev, product]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const phone = config.whatsappNumber || "5490000000000"; 
    const cartSummary = cart.map(p => `- ${p.name} ($${p.price})`).join('\n');
    const total = cart.reduce((acc, p) => acc + p.price, 0).toFixed(2);
    const message = `Hola Carlos, quiero pedir estos repuestos:\n\n${cartSummary}\n\nTotal estimado: $${total}`;
    
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setIsSettingsOpen(false);
    
    setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        text: newConfig.useMockData 
            ? 'Modo Demo: Activado. Soy Carlos y tengo acceso al stock local.' 
            : 'Modo Remoto: Activado. Conectado a base de datos externa.',
        timestamp: new Date()
    }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden font-sans bg-black">
      {/* Header */}
      <div className="flex-none">
        <Header 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          cartCount={cart.length} 
          onCheckout={handleCheckout}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full max-w-[1920px] mx-auto">
        
        {/* Chat Section */}
        <div className={`
            absolute inset-0 md:relative md:inset-auto 
            w-full md:w-[400px] lg:w-[450px] 
            h-full flex flex-col z-20 
            transition-transform duration-300 ease-in-out bg-slate-900/95 md:bg-transparent
            ${activeTab === 'chat' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Chat 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isProcessing={isProcessing} 
          />
        </div>

        {/* Product Grid Section */}
        <div className={`
            absolute inset-0 md:relative md:inset-auto 
            flex-1 h-full 
            transition-transform duration-300 ease-in-out bg-black/90 md:bg-transparent
            ${activeTab === 'results' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="h-full overflow-y-auto custom-scrollbar bg-gradient-to-br from-black/40 to-slate-900/40 backdrop-blur-sm">
             <div className="p-4 md:p-8 pb-24 md:pb-8"> 
                <div className="flex items-center justify-between mb-4 md:mb-6 border-b border-white/10 pb-4 sticky top-0 bg-black/40 backdrop-blur-md z-10 -mx-4 px-4 md:mx-0 md:px-0">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                      <span className="md:hidden text-blue-400" onClick={() => setActiveTab('chat')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </span>
                      Resultados
                    </h2>
                    {products.length > 0 && (
                        <span className="text-xs font-medium text-blue-300 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            {products.length} encontrados
                        </span>
                    )}
                </div>
                <ProductGrid 
                  products={products} 
                  isLoading={isProcessing} 
                  onAddToCart={handleAddToCart}
                />
             </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex-none bg-slate-900 border-t border-white/10 pb-safe pt-2 px-6 flex justify-around items-center h-[70px] z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
         <button 
           onClick={() => setActiveTab('chat')}
           className={`flex flex-col items-center space-y-1 ${activeTab === 'chat' ? 'text-blue-400' : 'text-slate-500'}`}
         >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
           <span className="text-[10px] font-medium">Asistente</span>
         </button>

         <div className="relative -top-5">
            <button 
              onClick={() => setActiveTab('results')}
              className={`h-14 w-14 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-lg shadow-blue-900/40 transition-all ${activeTab === 'results' ? 'bg-blue-500 text-white scale-110' : 'bg-slate-800 text-slate-400'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
         </div>

         <button 
           onClick={handleCheckout}
           className={`flex flex-col items-center space-y-1 relative ${cart.length > 0 ? 'text-green-400' : 'text-slate-500'}`}
         >
           <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-slate-900">
                  {cart.length}
                </span>
              )}
           </div>
           <span className="text-[10px] font-medium">Carrito</span>
         </button>
      </div>

      <SetupModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onSave={saveConfig}
      />
    </div>
  );
}