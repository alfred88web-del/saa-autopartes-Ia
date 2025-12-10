import React from 'react';

interface HeaderProps {
  onOpenSettings: () => void;
  cartCount: number;
  onCheckout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, cartCount, onCheckout }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 md:space-x-3 group cursor-default">
          <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
            AutoPartes<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Desktop Checkout Button (Hidden on Mobile, moved to bottom bar) */}
          <button 
             onClick={onCheckout}
             className="hidden md:block relative group cursor-pointer border-none bg-transparent"
             title="Ver Pedido (WhatsApp)"
          >
             <div className={`p-2.5 rounded-xl transition-all ${cartCount > 0 ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
             </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-slate-900 shadow-lg animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};