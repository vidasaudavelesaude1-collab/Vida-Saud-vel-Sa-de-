
export enum UserGoal {
  LOSE_WEIGHT = 'Emagrecer',
  GAIN_MUSCLE = 'Ganhar Massa',
  GAIN_WEIGHT = 'Ganhar Peso',
  MAINTAIN = 'Manter Peso'
}

export interface MealNotification {
  id: string;
  label: string; // ex: "Café da Manhã"
  time: string; // ex: "08:00"
  days: number[]; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  goal: UserGoal;
  isAdmin?: boolean; 
  isVerified?: boolean; // Novo: Para validação de cadastro
  
  // Novos campos para metas e acompanhamento
  targetWeight?: string; // Meta de peso (kg)
  lastWeightUpdate?: number; // Timestamp da ultima pesagem
  mealNotifications?: MealNotification[]; // Horários de notificação
}

export interface UserStats {
  weight: string;
  height: string;
  age: string;
  gender: 'Masculino' | 'Feminino';
}

export interface MacroNutrients {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface MicroNutrients {
  fiber: string;
  vitamins: string[];
  minerals: string[];
}

export interface FoodAnalysis {
  id?: string;
  timestamp?: number;
  foodName: string;
  macros: MacroNutrients;
  micros?: MicroNutrients;
  healthScore: number; // 1-10
  shortDescription: string;
  proTips?: string[];
  dietFit?: string;
  isFallback?: boolean; // Identifica se é dado simulado
}

export interface RecipeSearchResult {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[]; // Passo a passo
  calories: string;
  timeToCook: string; // Ex: "30 min"
  imageKeyword: string; // Para buscar foto
  isFallback?: boolean; // Identifica se é dado simulado
}

// Nova interface para a estratégia gerada no perfil
export interface DietStrategy {
  durationDays: number;
  projectedChange: string; // Ex: "-1.5kg"
  dailyCalories: number;
  macroSplit: string; // Ex: "40% Carb, 30% Prot"
  superFoods: string[]; // Alimentos recomendados
  avoidFoods: string[]; // Alimentos a evitar
  oneDayMenu: string; // Descrição textual de um dia exemplo
}

export interface Meal {
  name: string;
  items: string[];
  calories: string;
  preparation?: string; // Dica ou passo a passo rápido
}

export interface DailyPlan {
  day: number;
  summary: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snack: Meal;
  };
}

export interface DietPlan {
  title: string;
  durationDays: number;
  goal: string;
  estimatedResult: string; // Ex: "Perda estimada de 2kg"
  days: DailyPlan[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: 'ebook' | 'clothing' | 'accessories';
  image: string;
}
