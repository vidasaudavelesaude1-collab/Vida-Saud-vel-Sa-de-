import React, { useState, useEffect } from 'react';
import { User, UserGoal, UserStats, FoodAnalysis, MealNotification, RecipeSearchResult, DietStrategy } from '../types';
import { FoodAnalysisResult } from './FoodAnalysisResult';
import { generateDietStrategy } from '../services/geminiService';

interface ProfileTabProps {
  user: User;
  userStats: UserStats;
  setUserStats: (stats: UserStats) => void;
  favorites: FoodAnalysis[];
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleFavorite: (item: FoodAnalysis) => void;
  savedRecipes: RecipeSearchResult[];
  onSelectRecipe: (recipe: RecipeSearchResult) => void;
  onDeleteRecipe: (id: string) => void;
  onShareRecipe: (recipe: RecipeSearchResult) => void;
  onNavigateToStore: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  userStats,
  setUserStats,
  favorites,
  onUpdateUser,
  onLogout,
  fileInputRef,
  handleProfilePicChange,
  onToggleFavorite,
  savedRecipes,
  onSelectRecipe,
  onDeleteRecipe,
  onShareRecipe,
  onNavigateToStore
}) => {
  const [viewingFavorite, setViewingFavorite] = useState<FoodAnalysis | null>(null);
  const [targetWeight, setTargetWeight] = useState(user.targetWeight || '');
  
  // Strategy State
  const [strategy, setStrategy] = useState<DietStrategy | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  
  // Local Calculated Metrics
  const [metrics, setMetrics] = useState<{ bmr: number; tdee: number; calorieTarget: number; diff: number } | null>(null);

  // Load Strategy from LocalStorage on mount
  useEffect(() => {
    const savedStrategy = localStorage.getItem(`vss_diet_strategy_${user.id}`);
    if (savedStrategy) {
        try {
            setStrategy(JSON.parse(savedStrategy));
        } catch (e) {
            console.error("Erro ao carregar estratégia salva", e);
        }
    }
  }, [user.id]);

  // Calcular Métricas ao alterar inputs
  useEffect(() => {
    if (userStats.weight && userStats.height && userStats.age && targetWeight) {
        const w = parseFloat(userStats.weight);
        const h = parseFloat(userStats.height);
        const a = parseFloat(userStats.age);
        const target = parseFloat(targetWeight);
        
        // Harris-Benedict
        let bmr = 0;
        if (userStats.gender === 'Masculino') {
            bmr = 88.36 + (13.4 * w) + (4.8 * h) - (5.7 * a);
        } else {
            bmr = 447.6 + (9.2 * w) + (3.1 * h) - (4.3 * a);
        }
        
        const tdee = bmr * 1.35; // Atividade leve/moderada média
        let calorieTarget = Math.round(tdee);

        if (user.goal === UserGoal.LOSE_WEIGHT) calorieTarget -= 500;
        else if (user.goal === UserGoal.GAIN_MUSCLE || user.goal === UserGoal.GAIN_WEIGHT) calorieTarget += 400;

        setMetrics({
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            calorieTarget: calorieTarget,
            diff: parseFloat((target - w).toFixed(1))
        });
    }
  }, [userStats, user.goal, targetWeight]);

  const handleStatChange = (field: keyof UserStats, value: string) => {
      setUserStats({ ...userStats, [field]: value });
      if (field === 'weight') {
          onUpdateUser({ ...user, lastWeightUpdate: Date.now() }); 
      }
  };

  const handleTargetWeightChange = (val: string) => {
      setTargetWeight(val);
      onUpdateUser({ ...user, targetWeight: val });
  };

  const handleGoalChange = (newGoal: UserGoal) => {
      onUpdateUser({ ...user, goal: newGoal });
      // Não resetamos a estratégia aqui automaticamente, deixamos o usuário decidir se quer gerar outra
  };

  const handleNotificationChange = (notifId: string, field: keyof MealNotification, value: any) => {
    if(!user.mealNotifications) return;
    const newNotifs = user.mealNotifications.map(n => 
        n.id === notifId ? { ...n, [field]: value } : n
    );
    onUpdateUser({ ...user, mealNotifications: newNotifs });
  };

  const handleGenerateStrategy = async (days: number) => {
      if (!userStats.weight || !userStats.height || !userStats.age) {
          alert("Preencha peso, altura e idade primeiro.");
          return;
      }
      
      // Se já existe, confirmar substituição
      if (strategy && !window.confirm("Isso substituirá o guia atual. Deseja continuar?")) {
          return;
      }

      setSelectedDuration(days);
      setIsLoadingStrategy(true);
      setStrategy(null);
      try {
          const result = await generateDietStrategy(userStats, user.goal, days);
          setStrategy(result);
          // Save to LocalStorage
          localStorage.setItem(`vss_diet_strategy_${user.id}`, JSON.stringify(result));
      } catch (e) {
          alert("Erro ao gerar estratégia. Tente novamente.");
      } finally {
          setIsLoadingStrategy(false);
      }
  };

  const handleDeleteStrategy = () => {
      if (window.confirm("Tem certeza que deseja excluir este guia nutricional?")) {
          setStrategy(null);
          localStorage.removeItem(`vss_diet_strategy_${user.id}`);
          setSelectedDuration(null);
      }
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 pt-4 animate-fade-in">
        
        {/* Header with Avatar */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative group cursor-pointer mb-4" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white shadow-lg">
                    {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                </div>
                <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full border-2 border-white shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
            <p className="text-slate-500 text-sm">{user.email}</p>
        </div>

        {/* DADOS PESSOAIS & META & CALCULADORA */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 text-sm">👤</span>
                Dados & Calculadora Metabólica
            </h3>

            {/* Goal Selector */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Objetivo Atual</label>
                <div className="grid grid-cols-2 gap-2">
                {Object.values(UserGoal).map((g) => (
                    <button
                    key={g}
                    onClick={() => handleGoalChange(g)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${user.goal === g ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                    >
                    {g}
                    </button>
                ))}
                </div>
            </div>

            {/* Stats Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Peso Atual (kg)</label>
                    <input 
                        type="number" 
                        value={userStats.weight}
                        onChange={(e) => handleStatChange('weight', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="00"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-emerald-600 mb-1">Meta de Peso (kg)</label>
                    <input 
                        type="number" 
                        value={targetWeight}
                        onChange={(e) => handleTargetWeightChange(e.target.value)}
                        className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-center font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="00"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Altura (cm)</label>
                    <input 
                        type="number" 
                        value={userStats.height}
                        onChange={(e) => handleStatChange('height', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="000"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Idade / Sexo</label>
                    <div className="flex space-x-2">
                         <input 
                            type="number" 
                            value={userStats.age}
                            onChange={(e) => handleStatChange('age', e.target.value)}
                            className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center font-bold text-slate-800 outline-none"
                            placeholder="Idade"
                        />
                        <select 
                            value={userStats.gender}
                            onChange={(e) => handleStatChange('gender', e.target.value as any)}
                            className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-1 py-2 text-[10px] font-bold text-slate-800 outline-none"
                        >
                            <option value="Feminino">F</option>
                            <option value="Masculino">M</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Metrics Display */}
            {metrics && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 animate-fade-in mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Diferença Peso</span>
                        <span className={`text-sm font-bold ${metrics.diff > 0 ? 'text-blue-500' : 'text-emerald-500'}`}>
                            {metrics.diff > 0 ? `+${metrics.diff} kg` : `${metrics.diff} kg`}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Metabolismo Basal</span>
                        <span className="text-sm font-bold text-slate-700">{metrics.bmr} kcal</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <span className="text-xs font-bold text-emerald-600 uppercase">Meta Diária Sugerida</span>
                        <span className="text-lg font-extrabold text-emerald-600">{metrics.calorieTarget} kcal</span>
                    </div>
                </div>
            )}

            {/* STRATEGY GENERATOR */}
            <div className="mt-6 border-t border-slate-100 pt-6">
                 
                 {/* Only show generator buttons if NO strategy exists, OR if user explicitly deleted it */}
                 {!strategy && (
                    <div className="animate-fade-in">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                            <span className="mr-2">⚡</span> Gerar Guia Nutricional
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">Escolha a duração para receber dicas personalizadas de alimentos.</p>
                        
                        <div className="flex gap-2 mb-4">
                            {[7, 15, 21].map(d => (
                                <button
                                    key={d}
                                    onClick={() => handleGenerateStrategy(d)}
                                    disabled={isLoadingStrategy}
                                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${selectedDuration === d && isLoadingStrategy ? 'bg-slate-100 border-slate-300 text-slate-400' : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                    {d} Dias
                                </button>
                            ))}
                        </div>
                    </div>
                 )}

                 {isLoadingStrategy && (
                     <div className="text-center py-4 text-emerald-600 text-xs font-bold animate-pulse">
                         Consultando Nutricionista IA...
                     </div>
                 )}

                 {strategy && (
                     <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 animate-slide-up relative">
                         {/* Delete Button */}
                         <button 
                            onClick={handleDeleteStrategy}
                            className="absolute top-2 right-2 p-2 bg-white/50 hover:bg-red-100 text-emerald-300 hover:text-red-500 rounded-full transition-colors"
                            title="Excluir este Guia"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>

                         <div className="flex justify-between items-start mb-4 pr-8">
                             <div>
                                <span className="text-[10px] uppercase font-bold text-emerald-400">Projeção ({strategy.durationDays} dias)</span>
                                <p className="text-xl font-bold text-emerald-800">{strategy.projectedChange}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-emerald-400">Foco Macro</span>
                                <p className="text-xs font-bold text-emerald-700 max-w-[120px]">{strategy.macroSplit}</p>
                             </div>
                         </div>

                         <div className="mb-4">
                             <p className="text-xs font-bold text-emerald-600 mb-2 uppercase">✅ Top Alimentos (Coma!)</p>
                             <div className="flex flex-wrap gap-1">
                                 {strategy.superFoods?.map((f, i) => (
                                     <span key={i} className="text-[10px] bg-white text-emerald-700 px-2 py-1 rounded border border-emerald-100 shadow-sm">{f}</span>
                                 ))}
                             </div>
                         </div>

                         <div className="mb-4">
                             <p className="text-xs font-bold text-red-500 mb-2 uppercase">❌ Evite ao Máximo</p>
                             <div className="flex flex-wrap gap-1">
                                 {strategy.avoidFoods?.map((f, i) => (
                                     <span key={i} className="text-[10px] bg-white text-red-600 px-2 py-1 rounded border border-red-100 shadow-sm">{f}</span>
                                 ))}
                             </div>
                         </div>

                         <div className="mb-4">
                             <p className="text-xs font-bold text-slate-600 mb-2 uppercase">🍽️ Exemplo de Dia</p>
                             <p className="text-xs text-slate-600 leading-relaxed bg-white/60 p-2 rounded-lg italic">
                                 "{strategy.oneDayMenu}"
                             </p>
                         </div>
                         
                         <div className="mt-4 pt-3 border-t border-emerald-100/50 text-center">
                            <p className="text-[10px] text-emerald-400 mb-2">Deseja mudar a estratégia?</p>
                            <div className="flex justify-center gap-2">
                                <button onClick={() => handleGenerateStrategy(7)} className="text-[10px] font-bold text-emerald-600 bg-white/50 px-2 py-1 rounded hover:bg-white">7 Dias</button>
                                <button onClick={() => handleGenerateStrategy(15)} className="text-[10px] font-bold text-emerald-600 bg-white/50 px-2 py-1 rounded hover:bg-white">15 Dias</button>
                                <button onClick={() => handleGenerateStrategy(21)} className="text-[10px] font-bold text-emerald-600 bg-white/50 px-2 py-1 rounded hover:bg-white">21 Dias</button>
                            </div>
                         </div>
                     </div>
                 )}
            </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-2 text-sm">⏰</span>
                Horários
            </h3>
            <div className="space-y-4">
              {user.mealNotifications?.map(notif => (
                  <div key={notif.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <p className="font-bold text-slate-600 text-xs">{notif.label}</p>
                      <div className="flex items-center space-x-2">
                             <input 
                                type="time" 
                                className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none"
                                value={notif.time}
                                onChange={(e) => handleNotificationChange(notif.id, 'time', e.target.value)}
                             />
                             <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={notif.enabled}
                                    onChange={(e) => handleNotificationChange(notif.id, 'enabled', e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                             </label>
                      </div>
                  </div>
              ))}
            </div>
        </div>

        {/* Saved Favorites */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-2 text-sm">❤️</span>
                    Favoritos
                </span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500">{favorites.length}</span>
            </h3>

            {favorites.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                    Nenhuma refeição salva ainda.
                </div>
            ) : (
                <div className="space-y-3">
                    {favorites.map((fav) => (
                        <div 
                            key={fav.id} 
                            onClick={() => setViewingFavorite(fav)}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded-xl cursor-pointer hover:bg-slate-100 hover:scale-[1.01] transition-all group"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm mr-3">
                                    🍽️
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm capitalize">{fav.foodName}</p>
                                    <p className="text-xs text-slate-500">{fav.macros.calories} kcal</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* SAVED RECIPES */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-2 text-sm">📖</span>
                    Receitas Salvas
                </span>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-500">{savedRecipes.length}</span>
            </h3>

            {savedRecipes.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                    Nenhuma receita salva.
                </div>
            ) : (
                <div className="space-y-3">
                    {savedRecipes.map((recipe) => (
                        <div 
                            key={recipe.id} 
                            onClick={() => { onSelectRecipe(recipe); }}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded-xl cursor-pointer hover:bg-slate-100"
                        >
                            <div className="flex items-center overflow-hidden">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm mr-3 shrink-0 overflow-hidden">
                                    <img 
                                      src={`https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.imageKeyword)}%20food%20photography%204k?width=100&height=100&nologo=true`}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0 pr-2">
                                    <p className="font-bold text-slate-800 text-sm truncate">{recipe.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onShareRecipe(recipe); }}
                                    className="text-slate-400 hover:text-blue-500 p-2 mr-1"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteRecipe(recipe.id); }}
                                    className="text-slate-400 hover:text-red-500 p-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button 
            onClick={onLogout}
            className="w-full py-3 border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors"
        >
            Sair da Conta
        </button>

        {viewingFavorite && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setViewingFavorite(null)}></div>
                <div className="relative bg-white w-full max-w-lg h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto animate-slide-up flex flex-col">
                    <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/95 backdrop-blur-md border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800">Detalhes</h3>
                        <button onClick={() => setViewingFavorite(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                           <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto custom-scrollbar">
                        <FoodAnalysisResult 
                            data={viewingFavorite}
                            history={[]} 
                            onSelectHistoryItem={() => {}} 
                            onSave={onToggleFavorite}
                            isSaved={true} 
                            userGoal={user.goal}
                            onViewPlan={() => {
                                onNavigateToStore();
                                setViewingFavorite(null);
                            }}
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};