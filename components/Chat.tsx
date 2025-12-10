import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
}

export const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
      // Keep focus on desktop, but maybe blur on mobile to hide keyboard if needed?
      // For now, keep focus is usually better for chat apps.
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-md md:border-r border-white/5 relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/5 bg-white/5 flex-none">
        <h2 className="font-semibold text-white flex items-center text-lg">
           <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
           Asistente de Repuestos
        </h2>
        <p className="text-xs text-slate-400 mt-1 pl-6">
          IA Conectada • Inventario en tiempo real
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in-up`}
          >
            <div 
              className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
              }`}
            >
              {msg.text}
              <div className={`text-[10px] mt-1 opacity-60 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start fade-in-up">
            <div className="bg-slate-800 border border-white/5 p-4 rounded-2xl rounded-bl-none flex items-center space-x-2">
               <span className="text-xs text-slate-400 mr-2">Buscando en catálogo...</span>
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area - Fixed at bottom of flex container */}
      <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t border-white/5 bg-slate-900/90 backdrop-blur flex-none">
        <div className="relative group flex items-end gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="¿Qué repuesto buscas?"
            disabled={isProcessing}
            className="flex-1 bg-slate-800 text-white border border-slate-700 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 disabled:opacity-50 transition-all text-base"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isProcessing}
            className="h-[50px] w-[50px] bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all disabled:opacity-50 disabled:scale-95 flex items-center justify-center shadow-lg shadow-blue-900/20 flex-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform -rotate-45 relative left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};