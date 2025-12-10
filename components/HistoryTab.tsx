import React, { useState } from 'react';
import { FoodAnalysis } from '../types';

interface HistoryTabProps {
  history: FoodAnalysis[];
  favorites: FoodAnalysis[];
  onSelect: (item: FoodAnalysis) => void;
  onToggleFavorite: (item: FoodAnalysis) => void;
  onDelete: (id: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ 
  history, 
  favorites, 
  onSelect, 
  onToggleFavorite, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('pt-BR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleShare = async (e: React.MouseEvent, item: FoodAnalysis) => {
    e.stopPropagation();
    const text = `🥗 Análise Nutricional: ${item.foodName}\n🔥 Calorias: ${item.macros.calories}kcal\n💪 Proteína: ${item.macros.protein}\n💚 Score: ${item.healthScore}/10\n\nVerificado no app Vida Saudável!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Análise: ${item.foodName}`,
          text: text,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Resumo copiado para a área de transferência!');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja apagar este item do histórico?')) {
      onDelete(id);
    }
  };

  const filteredHistory = history.filter(item => 
    item.foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.dietFit?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 pt-4 animate-fade-in">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Histórico Completo</h2>
        <p className="text-slate-500 text-sm">Gerencie todas as suas análises passadas.</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Buscar no histórico..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-3xl border border-slate-100">
          <p>Nenhum item encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const isFav = favorites.some(f => f.id === item.id);
            return (
              <div 
                key={item.id}
                onClick={() => onSelect(item)}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.99] transition-transform cursor-pointer relative group overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0">
                      🍽️
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight capitalize">{item.foodName}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {formatDate(item.timestamp)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{item.macros.calories} kcal</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.healthScore >= 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>Score {item.healthScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end items-center gap-3">
                    {/* Save Button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
                      className={`p-2 rounded-full transition-colors ${isFav ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      title={isFav ? "Remover dos Favoritos" : "Salvar nos Favoritos"}
                    >
                      <svg className="w-5 h-5" fill={isFav ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>

                    {/* Share Button */}
                    <button 
                      onClick={(e) => handleShare(e, item)}
                      className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100 transition-colors"
                      title="Compartilhar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>

                    {/* Delete Button */}
                    <button 
                      onClick={(e) => handleDelete(e, item.id || '')}
                      className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Apagar do Histórico"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};