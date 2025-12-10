import React, { useState, useEffect } from 'react';
import { User, UserGoal, DietPlan, UserStats } from '../types';

interface PlanTabProps {
  user: User;
  userStats: UserStats;
  generatedPlan: DietPlan | null;
  loadingPlan: boolean;
  onGenerate: (days: number) => void;
}

export const PlanTab: React.FC<PlanTabProps> = ({ 
  user, 
  userStats, 
  generatedPlan, 
  loadingPlan, 
  onGenerate 
}) => {
  const [daysInput, setDaysInput] = useState<number>(7);
  const [caloricTarget, setCaloricTarget] = useState<number | null>(null);
  
  // Loading Steps Animation State
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Analisando Metabolismo Basal...",
    "Calculando Déficit/Superávit...",
    "Selecionando Alimentos...",
    "Otimizando Macros...",
    "Finalizando Cardápio..."
  ];

  // Handle Loading Animation
  useEffect(() => {
    let interval: any;
    if (loadingPlan) {
        setLoadingStep(0);
        interval = setInterval(() => {
            setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
        }, 800); // Change message every 800ms to feel fast but readable
    }
    return () => clearInterval(interval);
  }, [loadingPlan]);

  // Simple Harris-Benedict Calculator for visuals
  useEffect(() => {
    if (userStats.weight && userStats.height && userStats.age) {
        const w = parseFloat(userStats.weight);
        const h = parseFloat(userStats.height);
        const a = parseFloat(userStats.age);
        
        // BMR Calc
        let bmr = 0;
        if (userStats.gender === 'Masculino') {
            bmr = 88.36 + (13.4 * w) + (4.8 * h) - (5.7 * a);
        } else {
            bmr = 447.6 + (9.2 * w) + (3.1 * h) - (4.3 * a);
        }

        // Adjustment based on Goal
        let target = bmr * 1.3; // Sedentary/Light activity base
        if (user.goal === UserGoal.LOSE_WEIGHT) target -= 500;
        if (user.goal === UserGoal.GAIN_MUSCLE) target += 300;
        if (user.goal === UserGoal.GAIN_WEIGHT) target += 500;
        
        setCaloricTarget(Math.round(target));
    }
  }, [userStats, user.goal]);

  return (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 pt-4 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Seu Plano Nutricional</h2>
            <p className="text-slate-500 text-sm">Estratégia rápida para {user.goal}</p>
        </div>

        {/* 1. Calculator Card (Real-time Feedback) */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden transition-all duration-500 hover:scale-[1.01]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">Meta Diária Estimada</p>
                    <div className="flex items-baseline">
                         <span className="text-4xl font-bold text-emerald-400">
                            {caloricTarget ? caloricTarget : '---'}
                         </span>
                         <span className="ml-2 text-sm text-slate-400">kcal/dia</span>
                    </div>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm border-b border-white/10 pb-2">
                    <span className="text-slate-400">Peso Atual</span>
                    <span className="font-bold">{userStats.weight || '--'} kg</span>
                </div>
                <div className="flex justify-between text-sm border-b border-white/10 pb-2">
                    <span className="text-slate-400">Objetivo</span>
                    <span className="font-bold text-emerald-300">{user.goal}</span>
                </div>
            </div>
        </div>

        {/* 2. Generation Controls */}
        {!generatedPlan && !loadingPlan && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6 animate-slide-up">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                    <span className="mr-2">⚡</span> Gerar Ciclo Rápido
                </h3>
                
                <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Duração do Foco</label>
                    <div className="flex gap-3">
                        {[7, 15, 30].map(d => (
                            <button
                                key={d}
                                onClick={() => setDaysInput(d)}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${daysInput === d ? 'bg-emerald-500 text-white shadow-md transform scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                                {d} Dias
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={() => onGenerate(daysInput)}
                    disabled={!userStats.weight}
                    className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all disabled:opacity-50 flex items-center justify-center active:scale-95"
                >
                    Gerar Plano Agora
                </button>
                {!userStats.weight && (
                    <p className="text-center text-red-400 text-xs mt-3">Atualize seu peso no Perfil para gerar o plano.</p>
                )}
            </div>
        )}

        {/* LOADING STATE (Visual Feedback) */}
        {loadingPlan && (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-lg mb-6 text-center animate-pulse">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{loadingMessages[loadingStep]}</h3>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
                    <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                    ></div>
                </div>
            </div>
        )}

        {/* 3. The Plan Display */}
        {generatedPlan && !loadingPlan && (
            <div className="animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-xl text-slate-800">Seu Ciclo Semanal</h3>
                    <button 
                       onClick={() => onGenerate(daysInput)} // Re-generate
                       className="text-xs text-emerald-600 font-bold underline"
                    >
                        Regerar
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden mb-6">
                    {/* Plan Header */}
                    <div className="bg-emerald-600 p-4 text-white">
                        <h4 className="font-bold text-lg leading-tight">{generatedPlan.title}</h4>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-emerald-100 text-xs font-bold bg-emerald-700/50 px-2 py-1 rounded">
                                Repetir por {Math.ceil(daysInput / 7)} semanas
                            </span>
                             <span className="text-white text-xs font-bold flex items-center">
                                🎯 {generatedPlan.estimatedResult}
                            </span>
                        </div>
                    </div>

                    {/* Days Accordion/List */}
                    <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        {generatedPlan.days?.map((day) => (
                        <div key={day.day} className="relative pl-6 border-l-2 border-slate-100 pb-2">
                            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-200 border-2 border-white"></span>
                            <h5 className="font-bold text-slate-800 mb-1">Dia {day.day} do Ciclo</h5>
                            
                            <div className="space-y-3 mt-3">
                                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealKey) => {
                                    const meal = (day.meals as any)?.[mealKey];
                                    if (!meal) return null;
                                    
                                    const mealLabels: any = { breakfast: 'Café', lunch: 'Almoço', dinner: 'Jantar', snack: 'Lanche' };
                                    return (
                                        <div key={mealKey} className="bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">{mealLabels[mealKey]}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{meal.calories}</span>
                                            </div>
                                            <p className="font-bold text-slate-800 text-sm mb-1">{meal.name}</p>
                                            <p className="text-xs text-slate-500 mb-2 leading-snug">{meal.items?.join(', ')}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};