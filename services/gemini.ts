import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { SearchCriteria } from "../types";

const modelId = "gemini-2.5-flash";

// Helper to safely get env var
const getEnvApiKey = () => {
  try {
    return typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
  } catch (e) {
    return undefined;
  }
};

/**
 * Parses user natural language into structured search criteria.
 */
export const parseUserQuery = async (userText: string, apiKey: string): Promise<SearchCriteria> => {
  // Use provided key or fallback to env var (safely checked)
  const key = apiKey || getEnvApiKey();
  
  if (!key) {
    console.warn("API Key missing");
    return { partName: userText }; // Fallback simple search
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      partName: { type: Type.STRING, description: "The specific name of the auto part requested (e.g., 'amortiguador', 'aceite', 'bujía')." },
      make: { type: Type.STRING, description: "Car brand/make (e.g., Toyota, Ford)." },
      model: { type: Type.STRING, description: "Car model (e.g., Corolla, Focus)." },
      year: { type: Type.STRING, description: "Car year." },
      category: { type: Type.STRING, description: "General category (Motor, Suspensión, Frenos, Interior, Exterior)." }
    },
    required: ["partName"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are an auto parts expert assistant. 
      Analyze the following user query and extract technical search criteria to query a database.
      If information is missing, leave it null/undefined.
      User Query: "${userText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Extract auto part search parameters from Spanish or English text.",
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SearchCriteria;
    }
    return {};
  } catch (error) {
    console.error("Gemini parse error:", error);
    return { partName: userText }; // Fallback
  }
};

/**
 * Generates a friendly summary response based on search results.
 */
export const generateSummary = async (query: string, resultCount: number, criteria: SearchCriteria, apiKey: string): Promise<string> => {
  const key = apiKey || getEnvApiKey();
  if (!key) return `Encontré ${resultCount} resultados para tu búsqueda.`;

  const ai = new GoogleGenAI({ apiKey: key });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `User asked: "${query}".
      Extracted criteria: ${JSON.stringify(criteria)}.
      Database found: ${resultCount} products.
      
      Generate a very short, friendly, helpful response in Spanish telling the user what was found. 
      If 0 results, suggest they check the model year or ask for a different part.`,
    });
    return response.text || `He encontrado ${resultCount} productos.`;
  } catch (e) {
    return `He encontrado ${resultCount} productos compatibles.`;
  }
};