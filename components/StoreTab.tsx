import React from 'react';

export const StoreTab: React.FC = () => {
  const whatsappCatalogLink = "https://wa.me/c/5511994783930";

  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 pt-4 animate-fade-in flex flex-col items-center justify-center min-h-[70vh]">
      
      {/* Ícone Principal */}
      <div className="w-28 h-28 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-100 animate-bounce-slow">
         <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
      </div>

      {/* Títulos e Chamada */}
      <div className="text-center mb-12 max-w-xs">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Catálogo Oficial</h2>
        <p className="text-slate-500 text-lg leading-relaxed">
          Clique abaixo para acessar nossos produtos e consultorias exclusivas no WhatsApp.
        </p>
      </div>

      {/* Botão Principal - O único foco da página */}
      <button 
        onClick={() => window.open(whatsappCatalogLink, '_blank')}
        className="w-full bg-emerald-600 text-white font-bold text-xl py-6 rounded-3xl shadow-2xl shadow-emerald-300 hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center justify-center group"
      >
         <span className="mr-3">Acessar Catálogo</span>
         <svg className="w-7 h-7 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
      </button>

    </div>
  );
};