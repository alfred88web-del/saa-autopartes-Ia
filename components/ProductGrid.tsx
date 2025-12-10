import React from 'react';
import { Product } from '../types';

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onAddToCart: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading, onAddToCart }) => {
  // Función para manejar errores de imagen
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/400x400/1e293b/cbd5e1?text=Sin+Imagen";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse h-40 md:h-80 border border-white/5 flex md:block gap-4">
            <div className="bg-white/10 h-full w-1/3 md:w-full md:h-40 rounded-xl mb-0 md:mb-4 flex-none"></div>
            <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="h-8 bg-white/10 rounded w-full mt-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 text-center px-4">
        <div className="bg-white/5 p-6 rounded-full mb-6 border border-white/10 shadow-2xl animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Inicia una búsqueda</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Escribe en el chat qué repuesto necesitas y la IA buscará las mejores opciones.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-20 md:pb-0">
      {products.map((product, idx) => (
        <div 
          key={product.id} 
          className="bg-slate-900/80 md:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-blue-500/50 transition-all duration-300 shadow-lg fade-in-up flex flex-row md:flex-col h-auto md:h-full"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Mobile: Horizontal Layout / Desktop: Vertical */}
          <div className="relative w-1/3 md:w-full md:h-48 flex-none bg-slate-800">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 md:top-3 md:right-3 md:left-auto">
                 <span className="bg-black/60 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
                  {product.category}
                </span>
            </div>
          </div>
          
          <div className="p-3 md:p-5 flex-1 flex flex-col justify-between">
            <div>
                <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-2 leading-tight line-clamp-2">{product.name}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 mb-2 md:mb-4 line-clamp-2 md:line-clamp-3">{product.description}</p>
                
                <div className="hidden md:block mb-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Compatible:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {product.compatibleModels.slice(0, 2).map((model, idx) => (
                            <span key={idx} className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] px-2 py-1 rounded-md">
                                {model}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
              <div>
                  <span className="hidden md:block text-xs text-slate-500">Precio</span>
                  <span className="text-lg md:text-xl font-bold text-emerald-400">
                    ${product.price.toFixed(2)}
                  </span>
              </div>
              <button 
                onClick={() => onAddToCart(product)}
                className="w-full md:w-auto bg-blue-600 active:bg-blue-700 hover:bg-blue-500 text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all shadow-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Agregar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};