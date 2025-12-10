import React, { useState, useRef, useEffect } from 'react';
import { analyzeFoodImage, searchRecipes } from './services/geminiService';
import { authService } from './services/authService';
import { FoodAnalysis, UserGoal, RecipeSearchResult, User, UserStats } from './types';
import { FoodAnalysisResult } from './components/FoodAnalysisResult';
import { AuthScreen } from './components/AuthScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { StoreTab } from './components/StoreTab';
import { ProfileTab } from './components/ProfileTab';
import { HistoryTab } from './components/HistoryTab';

// --- Icons ---
const CameraIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SearchIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const ClockIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIconSmall = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const FireIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>;
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>;
const StoreIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;

function App() {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // --- App State ---
  const [activeTab, setActiveTab] = useState<'camera' | 'search' | 'profile' | 'admin' | 'store' | 'history'>('camera');
  const [notification, setNotification] = useState<string | null>(null); // To show fallback messages

  // Camera/Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
  const [history, setHistory] = useState<FoodAnalysis[]>([]);
  const [favorites, setFavorites] = useState<FoodAnalysis[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile State
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [showWeightUpdateModal, setShowWeightUpdateModal] = useState(false);
  const [currentWeightInput, setCurrentWeightInput] = useState(''); // Peso Atual
  
  const [userStats, setUserStats] = useState<UserStats>({
    weight: '',
    height: '',
    age: '',
    gender: 'Feminino'
  });

  // Search & Recipe State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RecipeSearchResult[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSearchResult | null>(null); 
  const [savedRecipes, setSavedRecipes] = useState<RecipeSearchResult[]>([]);

  // --- Effects ---
  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        setCurrentWeightInput(currentUser.targetWeight ? (parseFloat(currentUser.targetWeight) + 5).toString() : '70'); 
        setUserStats({
            weight: '', 
            height: '',
            age: '',
            gender: 'Feminino'
        });
      }
      setLoadingUser(false);
    };
    loadUser();
  }, []);

  // Notifications & Weight Reminder Check
  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    const lastUpdate = user.lastWeightUpdate || 0;
    if (Date.now() - lastUpdate > FIFTEEN_DAYS_MS) {
      setShowWeightUpdateModal(true);
    }

    const notificationInterval = setInterval(() => {
        if (!user.mealNotifications) return;
        
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        user.mealNotifications.forEach(notif => {
             const isDaySelected = notif.days ? notif.days.includes(currentDay) : true;
             if (notif.enabled && notif.time === currentTime && isDaySelected) {
                 if (Notification.permission === 'granted') {
                     let bodyMsg = "Hora de se alimentar!";
                     if (user.goal === UserGoal.LOSE_WEIGHT) bodyMsg = "Lembre-se: Proteína e Fibras para saciedade.";
                     if (user.goal === UserGoal.GAIN_MUSCLE) bodyMsg = "Hora do anabolismo! Não pule sua refeição.";
                     if (user.goal === UserGoal.GAIN_WEIGHT) bodyMsg = "Mantenha o superávit calórico. Hora de comer!";

                     new Notification(`⏰ Hora do ${notif.label}!`, {
                         body: bodyMsg,
                         icon: '/icon.png'
                     });
                 }
             }
        });
    }, 60000); 

    return () => clearInterval(notificationInterval);
  }, [user]);

  // Load History, Favorites AND SAVED RECIPES
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`vss_history_${user.id}`);
      if (savedHistory) {
        try { 
            const parsed = JSON.parse(savedHistory);
            setHistory(Array.isArray(parsed) ? parsed : []); 
        } catch (e) { setHistory([]); }
      }
      const savedFavorites = localStorage.getItem(`vss_favorites_${user.id}`);
      if (savedFavorites) {
        try { 
            const parsed = JSON.parse(savedFavorites);
            setFavorites(Array.isArray(parsed) ? parsed : []);
        } catch (e) { setFavorites([]); }
      }
      // Load Saved Recipes
      const savedRecs = localStorage.getItem(`vss_saved_recipes_${user.id}`);
      if (savedRecs) {
        try { 
            const parsed = JSON.parse(savedRecs);
            setSavedRecipes(Array.isArray(parsed) ? parsed : []);
        } catch (e) { setSavedRecipes([]); }
      }
    } else {
      setHistory([]);
      setFavorites([]);
      setSavedRecipes([]);
    }
  }, [user]);

  // Helper to show temporary notification
  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Handlers ---

  const handleLoginSuccess = (loggedInUser: User, isNewUser: boolean = false) => {
    setUser(loggedInUser);
    if (isNewUser) {
      setTimeout(() => {
        setActiveTab('store'); // Redirect to Store for new users
        window.scrollTo(0,0);
      }, 500);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setActiveTab('camera');
    setAnalysisResult(null);
    setSelectedImage(null);
    setHistory([]);
    setFavorites([]);
    setSavedRecipes([]);
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          const updatedUser = { ...user, avatar: base64String };
          const savedUser = await authService.updateUser(updatedUser);
          setUser(savedUser);
        } catch (e) {}
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateWeight = async (weightValue: string) => {
      if (!user || !weightValue) return;
      const updatedUser = { 
          ...user, 
          lastWeightUpdate: Date.now()
      };
      setUserStats(prev => ({ ...prev, weight: weightValue }));
      setCurrentWeightInput(weightValue);

      const savedUser = await authService.updateUser(updatedUser);
      setUser(savedUser);
      setShowWeightUpdateModal(false);
  };

  const handleUpdateUser = async (updatedUser: User) => {
      const saved = await authService.updateUser(updatedUser);
      setUser(saved);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        handleAnalyze(base64String.split(',')[1]); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64: string) => {
    if (!user) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeFoodImage(base64, user.goal);
      
      // Check if fallback was used
      if (result.isFallback) {
         showToast("Limite de IA atingido. Mostrando exemplo.");
      }

      const resultWithMeta: FoodAnalysis = {
        ...result,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      setAnalysisResult(resultWithMeta);
      const newHistory = [resultWithMeta, ...history].slice(0, 50);
      setHistory(newHistory);
      localStorage.setItem(`vss_history_${user.id}`, JSON.stringify(newHistory));
    } catch (error) {
      alert("Erro crítico. Verifique sua conexão.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHistoryItemSelect = (item: FoodAnalysis) => {
    setAnalysisResult(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('camera'); 
  };

  const handleToggleFavorite = (item: FoodAnalysis) => {
    if (!user) return;
    const exists = favorites.find(f => f.id === item.id);
    let newFavorites;
    if (exists) {
      newFavorites = favorites.filter(f => f.id !== item.id);
    } else {
      newFavorites = [item, ...favorites];
    }
    setFavorites(newFavorites);
    localStorage.setItem(`vss_favorites_${user.id}`, JSON.stringify(newFavorites));
  };

  const handleDeleteHistoryItem = (id: string) => {
    if (!user) return;
    const newHistory = history.filter(item => item.id !== id);
    setHistory(newHistory);
    localStorage.setItem(`vss_history_${user.id}`, JSON.stringify(newHistory));
  };

  // --- RECIPE HANDLERS ---

  const handleToggleSaveRecipe = (recipe: RecipeSearchResult) => {
    if (!user) return;
    const exists = savedRecipes.find(r => r.id === recipe.id);
    let newSaved;
    if (exists) {
        newSaved = savedRecipes.filter(r => r.id !== recipe.id);
    } else {
        newSaved = [recipe, ...savedRecipes];
    }
    setSavedRecipes(newSaved);
    localStorage.setItem(`vss_saved_recipes_${user.id}`, JSON.stringify(newSaved));
  };

  const handleDeleteRecipe = (recipeId: string) => {
      if(!user) return;
      if(window.confirm("Deseja remover esta receita dos seus salvos?")) {
        const newSaved = savedRecipes.filter(r => r.id !== recipeId);
        setSavedRecipes(newSaved);
        localStorage.setItem(`vss_saved_recipes_${user.id}`, JSON.stringify(newSaved));
        // Se estiver vendo a receita que deletou, fecha o modal
        if (selectedRecipe?.id === recipeId) setSelectedRecipe(null);
      }
  };

  const handleShareRecipe = async (recipe: RecipeSearchResult) => {
    const text = `🍳 Receita: ${recipe.title}\n` +
                 `🔥 ${recipe.calories} | ⏱️ ${recipe.timeToCook}\n\n` +
                 `🛒 Ingredientes:\n${recipe.ingredients?.map(i => `• ${i}`).join('\n') || ''}\n\n` +
                 `👨‍🍳 Modo de Preparo:\n${recipe.steps?.map((s, i) => `${i+1}. ${s}`).join('\n') || ''}\n\n` +
                 `📲 Ver no app Vida Saudável!`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: recipe.title,
                text: text,
            });
        } catch (err) { console.log(err); }
    } else {
        navigator.clipboard.writeText(text);
        alert("Receita completa copiada!");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchRecipes(searchQuery);
      if (results.length > 0 && results[0].isFallback) {
         showToast("Limite de IA atingido. Mostrando sugestões.");
      }
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const getTipsForGoal = (goal: UserGoal) => {
      switch (goal) {
          case UserGoal.LOSE_WEIGHT:
              return [
                  { icon: '🥗', title: 'Volume no Prato', text: 'Encha metade do prato com vegetais. Eles dão saciedade com poucas calorias.' },
                  { icon: '💧', title: 'Água Pré-Refeição', text: '500ml de água 30min antes de comer ajuda a reduzir a ingestão calórica.' },
                  { icon: '📉', title: 'Déficit Calórico', text: 'Para emagrecer, você precisa gastar mais do que consome. O app te ajuda a monitorar isso.' }
              ];
          case UserGoal.GAIN_MUSCLE:
              return [
                  { icon: '🥩', title: 'Proteína Alta', text: 'Consuma proteína em todas as refeições (ovos, carnes, laticínios) para construir fibras musculares.' },
                  { icon: '🏋️', title: 'Treino de Força', text: 'O músculo só cresce se for estimulado. A dieta dá o tijolo, o treino é o pedreiro.' },
                  { icon: '🍚', title: 'Carboidrato Amigo', text: 'Não corte carboidratos! Eles são o combustível para treinar pesado.' }
              ];
          case UserGoal.GAIN_WEIGHT:
              return [
                  { icon: '🥑', title: 'Densidade Calórica', text: 'Aposte em gorduras boas (azeite, abacate, pasta de amendoim) para aumentar calorias sem muito volume.' },
                  { icon: '🥤', title: 'Calorias Líquidas', text: 'Vitamina com frutas e aveia é uma forma fácil de bater a meta calórica.' },
                  { icon: '⏰', title: 'Frequência', text: 'Tente não ficar mais de 4 horas sem comer. Leve lanches práticos.' }
              ];
          case UserGoal.MAINTAIN:
              return [
                  { icon: '⚖️', title: 'Equilíbrio 80/20', text: 'Mantenha a alimentação limpa 80% do tempo e aproveite os outros 20%.' },
                  { icon: '🌈', title: 'Variedade', text: 'Quanto mais colorido o prato, maior a gama de micronutrientes para sua saúde.' },
                  { icon: '😴', title: 'Sono Reparador', text: 'Dormir bem regula os hormônios da fome e saciedade (grelina e leptina).' }
              ];
          default:
              return [];
      }
  };

  // --- Render Sections ---

  const renderHeader = () => (
    <div className="bg-white shadow-sm pt-safe pb-3 px-4 flex items-center justify-center sticky top-0 z-30">
       {activeTab !== 'camera' && (
         <button 
            onClick={() => setActiveTab('camera')} 
            className="absolute left-4 p-2 text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors"
         >
            <BackIcon />
         </button>
       )}
       <h1 className="text-xl font-bold text-emerald-800 tracking-tight">Vida Saudável é Saúde</h1>
    </div>
  );

  const renderCameraTab = () => (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto pb-24">
      <div className="w-full bg-emerald-600 p-6 rounded-b-3xl shadow-lg mb-6 text-white text-center">
        <h2 className="text-xl font-bold">Olá, {user?.name.split(' ')[0]}! 👋</h2>
        <p className="opacity-90 text-sm">Descubra os nutrientes da sua refeição.</p>
      </div>

      <div className="w-full px-4 space-y-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${selectedImage ? 'border-emerald-500' : 'border-slate-300 hover:border-emerald-400 bg-white'}`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          {selectedImage ? (
            <>
              <img src={selectedImage} alt="Food" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                 <p className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Toque para trocar</p>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                <CameraIcon />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Fotografar Refeição</h3>
              <p className="text-sm text-slate-400 mt-2">Toque aqui para começar a análise</p>
            </div>
          )}
        </div>

        {!selectedImage && !isAnalyzing && user && (
          <div className="w-full mt-4 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-4 px-1 flex items-center">
               <span className="bg-emerald-100 text-emerald-600 rounded-lg p-1 mr-2 text-xs">🎯</span> 
               Dicas para: <span className="text-emerald-600 ml-1 underline">{user.goal}</span>
            </h3>
            <div className="space-y-3">
                 {getTipsForGoal(user.goal).map((tip, index) => (
                    <div key={index} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-start shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-2xl mr-3 bg-slate-50 rounded-full w-10 h-10 flex items-center justify-center">{tip.icon}</span>
                        <div>
                        <h4 className="font-bold text-slate-800 text-sm">{tip.title}</h4>
                        <p className="text-slate-500 text-xs mt-1 leading-relaxed">{tip.text}</p>
                        </div>
                    </div>
                 ))}
            </div>
          </div>
        )}

        {isAnalyzing && (
           <div className="flex flex-col items-center justify-center py-10 animate-pulse">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-slate-500 font-medium">Analisando nutrientes com IA...</p>
           </div>
        )}

        {!isAnalyzing && (
          <FoodAnalysisResult 
            data={analysisResult} 
            history={history}
            onSelectHistoryItem={handleHistoryItemSelect}
            onSave={handleToggleFavorite}
            onReset={handleResetAnalysis}
            onViewPlan={() => { setActiveTab('store'); window.scrollTo(0,0); }}
            isSaved={analysisResult ? favorites.some(f => f.id === analysisResult.id) : false}
            userGoal={user?.goal}
          />
        )}
      </div>
    </div>
  );

  const renderSearchTab = () => (
    <div className="w-full max-w-lg mx-auto pb-24 px-4 pt-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Receitas Incríveis</h2>
      
      <form onSubmit={handleSearch} className="relative mb-8">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="O que você quer cozinhar hoje?"
          className="w-full py-4 pl-5 pr-12 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 placeholder-slate-400"
        />
        <button type="submit" className="absolute right-3 top-3 p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </button>
      </form>

      {isSearching && (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse"></div>)}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {searchResults.map((recipe) => (
          <div 
            key={recipe.id} 
            onClick={() => setSelectedRecipe(recipe)}
            className="group bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
             <div className="h-48 overflow-hidden relative">
               <img 
                 src={`https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.imageKeyword)}%20food%20photography%204k?width=800&height=600&nologo=true`} 
                 alt={recipe.title} 
                 loading="lazy"
                 decoding="async"
                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop';
                 }}
               />
               <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-700 shadow-sm flex items-center">
                 <FireIcon /> <span className="ml-1">{recipe.calories}</span>
               </div>
             </div>
             
             <div className="p-5">
               <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{recipe.title}</h3>
               <p className="text-slate-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
               
               <div className="flex items-center justify-between text-sm text-slate-400">
                  <span className="flex items-center"><ClockIconSmall /><span className="ml-1">{recipe.timeToCook}</span></span>
                  <span className="font-bold text-emerald-600 group-hover:underline">Ver Receita &rarr;</span>
               </div>
             </div>
          </div>
        ))}
      </div>

      
      {!isSearching && searchResults.length === 0 && (
        <div className="text-center text-slate-400 mt-10">
          <p className="text-sm">Busque por ingredientes ou nomes de pratos.<br/>Ex: "Salada de Frango", "Panqueca de Banana".</p>
        </div>
      )}
    </div>
  );

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-600 animate-pulse">Carregando sua saúde...</div>;
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification for API Limits */}
      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center animate-fade-in">
           <svg className="w-4 h-4 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           {notification}
        </div>
      )}

      {renderHeader()}
      <main className="flex-1">
        {activeTab === 'camera' && renderCameraTab()}
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'store' && <StoreTab />}
        {activeTab === 'profile' && (
            <ProfileTab 
              user={user}
              userStats={userStats}
              setUserStats={setUserStats}
              favorites={favorites}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              fileInputRef={profileInputRef}
              handleProfilePicChange={handleProfilePicChange}
              onToggleFavorite={handleToggleFavorite}
              savedRecipes={savedRecipes}
              onSelectRecipe={setSelectedRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onShareRecipe={handleShareRecipe}
              onNavigateToStore={() => { setActiveTab('store'); window.scrollTo(0,0); }}
            />
        )}
        {activeTab === 'history' && (
          <HistoryTab 
            history={history}
            favorites={favorites}
            onSelect={handleHistoryItemSelect}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteHistoryItem}
          />
        )}
        {activeTab === 'admin' && user.isAdmin && <AdminDashboard />}
      </main>

      {/* GLOBAL RECIPE MODAL (Rendered here so it works from ProfileTab too) */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRecipe(null)}></div>
           <div className="relative bg-white w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto animate-slide-up">
              
              {/* MODAL HEADER WITH ACTIONS */}
              <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center space-x-2">
                    {/* Share */}
                    <button 
                        onClick={() => handleShareRecipe(selectedRecipe)}
                        className="p-2 bg-blue-50 text-blue-500 rounded-full hover:bg-blue-100"
                        title="Compartilhar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    
                    {/* Save/Favorite */}
                    <button 
                        onClick={() => handleToggleSaveRecipe(selectedRecipe)}
                        className={`p-2 rounded-full transition-colors ${savedRecipes.find(r => r.id === selectedRecipe.id) ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400 hover:text-red-400'}`}
                        title={savedRecipes.find(r => r.id === selectedRecipe.id) ? "Remover dos Favoritos" : "Salvar Favorito"}
                    >
                        <svg className="w-5 h-5" fill={savedRecipes.find(r => r.id === selectedRecipe.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>

                    {/* Delete (only if saved, acts same as toggle actually but explicitly trash icon) */}
                    {savedRecipes.find(r => r.id === selectedRecipe.id) && (
                        <button 
                            onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                            className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500"
                            title="Excluir"
                        >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    )}
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-0">
                <img 
                   src={`https://image.pollinations.ai/prompt/${encodeURIComponent(selectedRecipe.imageKeyword)}%20food%20photography%204k?width=800&height=600&nologo=true`} 
                   className="w-full h-64 object-cover" 
                   alt={selectedRecipe.title}
                   loading="lazy"
                   onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop'; }}
                />
              </div>

              <div className="p-6 space-y-8">
                 {/* Title Row */}
                 <div className="flex flex-col">
                    <h3 className="font-bold text-2xl text-slate-800 leading-tight mb-2">{selectedRecipe.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{selectedRecipe.description}</p>
                 </div>

                 {/* Video Button */}
                 <button 
                    onClick={() => window.open(`https://www.youtube.com/results?search_query=receita+${encodeURIComponent(selectedRecipe.title)}`, '_blank')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-200 flex items-center justify-center transition-all transform active:scale-95"
                 >
                    <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    Assistir Vídeo do Preparo
                 </button>

                 <div className="flex justify-around bg-slate-50 p-4 rounded-xl">
                    <div className="text-center">
                       <span className="block text-slate-400 text-xs uppercase font-bold">Tempo</span>
                       <span className="text-slate-800 font-bold">{selectedRecipe.timeToCook}</span>
                    </div>
                    <div className="text-center">
                       <span className="block text-slate-400 text-xs uppercase font-bold">Calorias</span>
                       <span className="text-slate-800 font-bold">{selectedRecipe.calories}</span>
                    </div>
                    <div className="text-center">
                       <span className="block text-slate-400 text-xs uppercase font-bold">Ingredientes</span>
                       <span className="text-slate-800 font-bold">{selectedRecipe.ingredients?.length || 0}</span>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs mr-2">1</span> 
                      Ingredientes
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedRecipe.ingredients?.map((ing, i) => (
                        <li key={i} className="flex items-start text-slate-600 text-sm p-2 bg-slate-50 rounded-lg">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 mr-2"></span>
                          {ing}
                        </li>
                      ))}
                    </ul>
                 </div>

                 <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                      Modo de Preparo
                    </h4>
                    <div className="space-y-4">
                      {selectedRecipe.steps?.map((step, i) => (
                        <div key={i} className="flex">
                           <div className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                             {i+1}
                           </div>
                           <p className="text-slate-600 text-sm leading-relaxed pt-1">{step}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
              <div className="h-safe"></div>
           </div>
        </div>
      )}

      {/* WEIGHT UPDATE MODAL (Every 15 days) */}
      {showWeightUpdateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
              <div className="relative bg-white w-full max-w-sm rounded-3xl p-8 text-center animate-slide-up shadow-2xl">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Hora de Atualizar!</h3>
                  <p className="text-slate-500 mb-6 text-sm">Passaram-se 15 dias. Atualize seu peso para que a IA continue gerando dicas precisas.</p>
                  
                  <input 
                      type="number" 
                      placeholder="Peso atual (kg)"
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-center text-lg font-bold mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={currentWeightInput}
                      onChange={(e) => setCurrentWeightInput(e.target.value)}
                  />
                  
                  <button 
                      onClick={() => handleUpdateWeight(currentWeightInput)}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                      Confirmar Peso Atual
                  </button>
              </div>
          </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-1">
          <button 
            onClick={() => { setActiveTab('search'); window.scrollTo(0,0); }}
            className={`flex flex-col items-center space-y-1 w-14 transition-colors ${activeTab === 'search' ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            <SearchIcon />
            <span className="text-[9px] font-medium">Receitas</span>
          </button>

          <button 
            onClick={() => { setActiveTab('history'); window.scrollTo(0,0); }}
            className={`flex flex-col items-center space-y-1 w-14 transition-colors ${activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            <ClockIcon />
            <span className="text-[9px] font-medium">Histórico</span>
          </button>

          <button 
            onClick={() => { setActiveTab('camera'); window.scrollTo(0,0); }}
            className="relative -top-6 bg-emerald-600 text-white p-3 rounded-full shadow-lg shadow-emerald-200 hover:scale-105 hover:bg-emerald-500 transition-all active:scale-95"
          >
            <CameraIcon />
          </button>

          <button 
            onClick={() => { setActiveTab('store'); window.scrollTo(0,0); }}
            className={`flex flex-col items-center space-y-1 w-14 transition-colors ${activeTab === 'store' ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            <StoreIcon />
            <span className="text-[9px] font-medium">Catálogo</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('profile'); window.scrollTo(0,0); }}
            className={`flex flex-col items-center space-y-1 w-14 transition-colors ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500'}`}
          >
            <UserIcon />
            <span className="text-[9px] font-medium">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;