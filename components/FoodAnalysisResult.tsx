import React, { useState, useEffect } from 'react';
import { FoodAnalysis, UserGoal } from '../types';

interface Props {
  data: FoodAnalysis | null; // Data can be null now if only showing history
  history: FoodAnalysis[];
  onSelectHistoryItem: (item: FoodAnalysis) => void;
  onSave?: (item: FoodAnalysis) => void;
  onReset?: () => void;
  onViewPlan?: () => void; // Novo: Navegar para o perfil/plano
  isSaved?: boolean;
  userGoal?: UserGoal; // Added userGoal prop
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const FoodAnalysisResult: React.FC<Props> = ({ data, history, onSelectHistoryItem, onSave, onReset, onViewPlan, isSaved, userGoal }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isTipsExpanded, setIsTipsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');
  
  // Estado para animação de "Pop" ao salvar
  const [isSavingAnim, setIsSavingAnim] = useState(false);

  // Reset expansion when data changes
  useEffect(() => {
    setIsTipsExpanded(false);
  }, [data?.id]);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave && data) {
        // Se ainda não estava salvo, ativa a animação
        if (!isSaved) {
            setIsSavingAnim(true);
            setTimeout(() => setIsSavingAnim(false), 500);
        }
        onSave(data);
    }
  };

  // Sort History Logic
  const sortedHistory = [...history].sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;

    switch (sortBy) {
      case 'newest':
        return timeB - timeA;
      case 'oldest':
        return timeA - timeB;
      case 'score':
        return b.healthScore - a.healthScore;
      default:
        return 0;
    }
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Current Analysis Result */}
      {data && (
        <>
          {/* Header Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 capitalize">{data.foodName}</h2>
                <p className="text-slate-500 text-sm mt-1">{data.shortDescription}</p>
                {data.timestamp && (
                   <p className="text-xs text-slate-400 mt-1">{formatDate(data.timestamp)}</p>
                )}
              </div>
              <div className="flex space-x-2">
                {onSave && (
                  <button 
                    onClick={handleSaveClick}
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active:scale-95 
                    ${isSaved ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400 hover:text-red-400'}
                    ${isSavingAnim ? 'scale-125 rotate-12 shadow-lg bg-emerald-100 text-emerald-500' : ''}`}
                    aria-label="Salvar Análise"
                  >
                    <svg className="w-6 h-6" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${data.healthScore >= 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {data.healthScore}
                </div>
              </div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-4 gap-2 mt-6">
              <div className="bg-slate-50 p-3 rounded-xl text-center">
                <span className="block text-xs text-slate-400 uppercase font-bold tracking-wider">Cal</span>
                <span className="block text-lg font-bold text-slate-800">{data.macros.calories}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <span className="block text-xs text-blue-400 uppercase font-bold tracking-wider">Prot</span>
                <span className="block text-lg font-bold text-blue-800">{data.macros.protein}</span>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl text-center">
                <span className="block text-xs text-orange-400 uppercase font-bold tracking-wider">Carb</span>
                <span className="block text-lg font-bold text-orange-800">{data.macros.carbs}</span>
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl text-center">
                <span className="block text-xs text-yellow-500 uppercase font-bold tracking-wider">Gord</span>
                <span className="block text-lg font-bold text-yellow-800">{data.macros.fat}</span>
              </div>
            </div>
          </div>

          {/* Coach Analysis Section - HIGHLY VISIBLE GOAL */}
          <div className="relative rounded-2xl p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="flex items-center font-bold text-indigo-900 text-lg">
                    <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    Coach Nutricional
                  </h3>
                  {userGoal && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-white px-2 py-1 rounded-full border border-indigo-100 shadow-sm">
                      Foco: {userGoal}
                    </span>
                  )}
              </div>
              
              <div className="space-y-5">
                <div className="bg-white/60 p-4 rounded-xl border border-indigo-50/50">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></span>
                        Veredito
                    </h4>
                    <p className="text-indigo-900 leading-relaxed font-medium text-sm">
                      {data.dietFit}
                    </p>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase mb-3 flex items-center">
                         <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2"></span>
                         Dicas para {userGoal || 'Você'}
                    </h4>
                    <ul className="space-y-3">
                      {(isTipsExpanded ? data.proTips : data.proTips?.slice(0, 1))?.map((tip, idx) => (
                        <li key={idx} className="flex items-start text-indigo-800 text-sm bg-indigo-100/30 p-2.5 rounded-lg animate-fade-in">
                          <span className="mr-2 text-indigo-500 font-bold">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                    {data.proTips && data.proTips.length > 1 && (
                      <button 
                        onClick={() => setIsTipsExpanded(!isTipsExpanded)}
                        className="text-xs font-bold text-indigo-600 mt-2 hover:text-indigo-800 transition-colors flex items-center focus:outline-none"
                      >
                        {isTipsExpanded ? 'Ver menos' : 'Ver mais'}
                        <svg className={`w-3 h-3 ml-1 transform transition-transform ${isTipsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Micronutrients Section */}
          <div className="relative rounded-2xl p-6 bg-white border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              Micronutrientes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fiber */}
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-700 font-medium">Fibras</span>
                  <span className="font-bold text-emerald-900">{data.micros?.fiber || '--'}</span>
              </div>
              
              {/* Vitamins */}
              <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="block text-slate-500 text-xs font-bold uppercase mb-2">Vitaminas</span>
                  {data.micros?.vitamins?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {data.micros.vitamins.map((v, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{v}</span>
                      ))}
                    </div>
                  ) : <span className="text-slate-400 text-sm">--</span>}
              </div>

              {/* Minerals */}
              <div className="p-3 bg-slate-50 rounded-lg md:col-span-2">
                  <span className="block text-slate-500 text-xs font-bold uppercase mb-2">Minerais</span>
                  {data.micros?.minerals?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {data.micros.minerals.map((m, i) => (
                        <span key={i} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{m}</span>
                      ))}
                    </div>
                  ) : <span className="text-slate-400 text-sm">--</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons (Save & New) */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              {onSave && (
                  <button 
                    onClick={handleSaveClick}
                    className={`py-3 rounded-xl font-bold flex items-center justify-center transition-all duration-300 ${isSaved 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600'} 
                      ${isSavingAnim ? 'scale-105 ring-4 ring-emerald-200' : ''}`}
                  >
                    {isSaved ? (
                         <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                         </svg>
                    ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                    {isSaved ? 'Salvo!' : 'Salvar Favorito'}
                  </button>
              )}
              
              {onReset && (
                  <button 
                    onClick={onReset}
                    className="py-3 rounded-xl font-bold flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Nova Análise
                  </button>
              )}
            </div>

            {/* NEW: View Plan Link if Saved */}
            {isSaved && onViewPlan && (
              <button 
                onClick={onViewPlan}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center hover:opacity-95 transition-opacity animate-fade-in"
              >
                Potencialize seus resultados (Ver Loja) ➝
              </button>
            )}
          </div>
        </>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-700">Histórico Recente</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm font-medium"
            >
              <option value="newest">📅 Mais Recentes</option>
              <option value="oldest">📅 Mais Antigas</option>
              <option value="score">💚 Maior Score</option>
            </select>
          </div>
          <div className="space-y-3">
             {sortedHistory.map((item, index) => {
               const itemId = item.id || String(index);
               const isExpanded = expandedId === itemId;
               const isCurrent = data?.id === item.id;
               
               return (
                 <div 
                    key={itemId}
                    onClick={() => onSelectHistoryItem(item)}
                    className={`bg-white rounded-xl border transition-all cursor-pointer overflow-hidden group ${isCurrent ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-100 hover:border-emerald-200'}`}
                 >
                   {/* Summary Row */}
                   <div className="p-4 flex justify-between items-center">
                     <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${isCurrent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm capitalize">{item.foodName}</p>
                          <p className="text-xs text-slate-400">{formatDate(item.timestamp)}</p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.healthScore >= 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>Score {item.healthScore}</span>
                           <span className="block font-bold text-emerald-600 text-sm">{item.macros.calories} Cal</span>
                        </div>
                        <button 
                          onClick={(e) => toggleExpand(e, itemId)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${isExpanded ? 'bg-slate-200 text-slate-600' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        >
                          {isExpanded ? 'Fechar' : 'Ver Detalhes'}
                        </button>
                     </div>
                   </div>

                   {/* Expanded Details */}
                   {isExpanded && (
                     <div className="bg-slate-50 border-t border-slate-100 p-4 animate-slide-up cursor-default" onClick={(e) => e.stopPropagation()}>
                        {/* Short Description */}
                        <p className="text-sm text-slate-600 mb-4 italic">"{item.shortDescription}"</p>

                        {/* Mini Macros */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                             <span className="text-[10px] text-slate-400 uppercase font-bold block">Prot</span>
                             <span className="text-sm font-bold text-blue-600">{item.macros.protein}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                             <span className="text-[10px] text-slate-400 uppercase font-bold block">Carb</span>
                             <span className="text-sm font-bold text-orange-600">{item.macros.carbs}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                             <span className="text-[10px] text-slate-400 uppercase font-bold block">Gord</span>
                             <span className="text-sm font-bold text-yellow-600">{item.macros.fat}</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                             <span className="text-[10px] text-slate-400 uppercase font-bold block">Fibra</span>
                             <span className="text-sm font-bold text-emerald-600">{item.micros?.fiber || '-'}</span>
                          </div>
                        </div>

                        {/* Diet Fit / Verdict */}
                        <div className="mb-4">
                           <h4 className="text-xs font-bold text-indigo-500 uppercase mb-1">Análise do Coach</h4>
                           <p className="text-sm text-indigo-800 leading-relaxed bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                             {item.dietFit}
                           </p>
                        </div>
                        
                        {/* Tips */}
                        {item.proTips && item.proTips.length > 0 && (
                          <div className="mb-4">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Dicas para {userGoal || 'Você'}</h4>
                             <ul className="text-sm text-slate-600 list-disc list-inside">
                               {item.proTips.slice(0, 2).map((tip, idx) => (
                                 <li key={idx}>{tip}</li>
                               ))}
                             </ul>
                          </div>
                        )}

                        {!isCurrent && (
                          <button 
                            onClick={() => onSelectHistoryItem(item)}
                            className="w-full mt-2 py-2 border border-emerald-500 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors"
                          >
                            Visualizar no Topo
                          </button>
                        )}
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      )}
    </div>
  );
};