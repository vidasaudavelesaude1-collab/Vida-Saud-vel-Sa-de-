import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis, UserGoal, RecipeSearchResult, UserStats, DietStrategy } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- DADOS MOCKADOS PARA FALLBACK (CASO A API FALHE/COTA EXCEDIDA) ---
const MOCK_FOODS: FoodAnalysis[] = [
    {
        foodName: "Salada Caesar com Frango (Exemplo)",
        macros: { calories: 350, protein: "30g", carbs: "10g", fat: "15g" },
        micros: { fiber: "5g", vitamins: ["A", "C", "K"], minerals: ["Ferro", "Potássio"] },
        healthScore: 9,
        shortDescription: "Refeição leve, rica em proteínas e fibras.",
        proTips: [
            "Excelente para saciedade devido ao volume de folhas.",
            "Cuidado com excesso de molho se o objetivo for secar.",
            "Acompanhe com água para melhorar a digestão."
        ],
        dietFit: "Perfeito para seu objetivo. Baixa caloria e alta densidade nutricional.",
        isFallback: true
    },
    {
        foodName: "Prato Feito Brasileiro (Exemplo)",
        macros: { calories: 650, protein: "35g", carbs: "80g", fat: "20g" },
        micros: { fiber: "8g", vitamins: ["B12", "C"], minerals: ["Ferro", "Zinco"] },
        healthScore: 8,
        shortDescription: "Arroz, feijão e carne. Combinação completa de aminoácidos.",
        proTips: [
            "Controle a quantidade de arroz se quiser emagrecer.",
            "O feijão é excelente fonte de ferro e fibra.",
            "Prefira carnes magras grelhadas."
        ],
        dietFit: "Ótima refeição anabólica. Boa para pós-treino.",
        isFallback: true
    },
    {
        foodName: "Hambúrguer Artesanal (Exemplo)",
        macros: { calories: 850, protein: "40g", carbs: "60g", fat: "45g" },
        micros: { fiber: "2g", vitamins: ["B6"], minerals: ["Sódio"] },
        healthScore: 4,
        shortDescription: "Delicioso, mas calórico e rico em gorduras saturadas.",
        proTips: [
            "Considere como refeição livre.",
            "Tente comer apenas metade do pão para reduzir carbos.",
            "Beba bastante água para compensar o sódio."
        ],
        dietFit: "Cuidado! Alta densidade calórica pode atrapalhar o déficit.",
        isFallback: true
    }
];

// Analyze Food Image
export const analyzeFoodImage = async (
  base64Image: string, 
  userGoal: UserGoal | null
): Promise<FoodAnalysis> => {
  
  const goalInstructions = userGoal 
    ? `O usuário tem o objetivo ESTRITO de: "${userGoal}". Sua análise deve focar 100% nisso.` 
    : "O usuário quer ser saudável.";

  const prompt = `
    Você é um nutricionista esportivo de elite. ${goalInstructions}
    Analise a imagem da comida fornecida.

    Retorne um JSON estritamente formatado com:
    1. foodName (string): Nome popular do prato.
    2. macros (object): Estimativa de calories (number), protein, carbs, fat (strings com unidades g/mg).
    3. micros (object): fiber (string), vitamins (array), minerals (array).
    4. healthScore (number 1-10): Nota de saúde baseada no objetivo "${userGoal}".
    5. shortDescription (string): Descrição apetitosa em 1 frase.
    6. proTips (array of strings): 3 Conselhos Táticos.
    7. dietFit (string): Um "Veredito Final" direto falando com o usuário sobre o objetivo dele.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            macros: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.STRING },
                carbs: { type: Type.STRING },
                fat: { type: Type.STRING },
              }
            },
            micros: {
              type: Type.OBJECT,
              properties: {
                fiber: { type: Type.STRING },
                vitamins: { type: Type.ARRAY, items: { type: Type.STRING } },
                minerals: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            healthScore: { type: Type.NUMBER },
            shortDescription: { type: Type.STRING },
            proTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            dietFit: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    return JSON.parse(text) as FoodAnalysis;

  } catch (error: any) {
    console.warn("API Error (using fallback data):", error.message);
    const randomMock = MOCK_FOODS[Math.floor(Math.random() * MOCK_FOODS.length)];
    return { ...randomMock, timestamp: Date.now() };
  }
};

// Generate Diet Strategy (Short Profile Plan)
export const generateDietStrategy = async (
  stats: UserStats, 
  goal: UserGoal, 
  duration: number
): Promise<DietStrategy> => {
  try {
    const prompt = `
      Crie uma estratégia nutricional RÁPIDA para um usuário de ${stats.age} anos, ${stats.weight}kg, ${stats.height}cm, Sexo: ${stats.gender}.
      Objetivo: ${goal}. Duração: ${duration} dias.
      
      Retorne JSON com:
      - projectedChange: estimativa de peso ganho/perdido em kg (string ex: "-1.5kg")
      - dailyCalories: numero (kcal)
      - macroSplit: texto curto (ex: "40% Carb, 30% Prot, 30% Gord")
      - superFoods: 5 alimentos essenciais para comer
      - avoidFoods: 3 alimentos para evitar
      - oneDayMenu: Um texto corrido descrevendo Café, Almoço e Jantar simples.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                projectedChange: { type: Type.STRING },
                dailyCalories: { type: Type.NUMBER },
                macroSplit: { type: Type.STRING },
                superFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                avoidFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                oneDayMenu: { type: Type.STRING },
            }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No strategy returned");
    const result = JSON.parse(text);
    return { ...result, durationDays: duration };

  } catch (error: any) {
    console.warn("Strategy Error:", error);
    // Fallback Mock Strategy
    return {
        durationDays: duration,
        projectedChange: goal === UserGoal.LOSE_WEIGHT ? "-0.5kg a -1kg" : "+0.5kg",
        dailyCalories: 2000,
        macroSplit: "Equilibrado",
        superFoods: ["Ovos", "Aveia", "Frango", "Vegetais Verdes", "Água"],
        avoidFoods: ["Açúcar Refinado", "Frituras", "Refrigerante"],
        oneDayMenu: "Café: Ovos mexidos. Almoço: Frango grelhado com salada. Jantar: Sopa de legumes."
    };
  }
};

// Search Detailed Recipes
export const searchRecipes = async (query: string): Promise<RecipeSearchResult[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Crie 3 receitas detalhadas para: "${query}".
      Retorne um JSON ARRAY puro com id, title, description, ingredients, steps, calories, timeToCook, imageKeyword (english).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                    calories: { type: Type.STRING },
                    timeToCook: { type: Type.STRING },
                    imageKeyword: { type: Type.STRING }
                }
            }
        }
      }
    });

    let text = response.text;
    if (!text) return [];
    return JSON.parse(text) as RecipeSearchResult[];
  } catch (error: any) {
    console.warn("API Error (using fallback recipes):", error.message);
    
    // Fallback Recipes
    return [
      {
        id: "fallback-1",
        title: "Salada Caesar com Frango (Sugestão)",
        description: "Opção leve e clássica, disponível mesmo offline.",
        ingredients: ["1 Peito de frango", "Alface romana", "Iogurte natural", "Queijo parmesão", "Limão", "Alho"],
        steps: ["Grelhe o frango.", "Lave a alface.", "Misture o molho de iogurte.", "Sirva tudo junto."],
        calories: "320 kcal",
        timeToCook: "15 min",
        imageKeyword: "healthy chicken caesar salad",
        isFallback: true
      },
      {
        id: "fallback-2",
        title: "Omelete de Espinafre (Sugestão)",
        description: "Rápido e proteico.",
        ingredients: ["2 ovos", "Espinafre", "Tomate", "Sal"],
        steps: ["Bata os ovos.", "Refogue o espinafre.", "Cozinhe a omelete na frigideira."],
        calories: "210 kcal",
        timeToCook: "10 min",
        imageKeyword: "spinach omelette",
        isFallback: true
      },
       {
        id: "fallback-3",
        title: "Crepioca de Frango (Sugestão)",
        description: "Energia saudável com tapioca e ovo.",
        ingredients: ["1 ovo", "2 colheres tapioca", "Frango desfiado"],
        steps: ["Misture ovo e tapioca.", "Faça o disco na frigideira.", "Recheie com frango."],
        calories: "350 kcal",
        timeToCook: "10 min",
        imageKeyword: "tapioca crepe",
        isFallback: true
      }
    ];
  }
};