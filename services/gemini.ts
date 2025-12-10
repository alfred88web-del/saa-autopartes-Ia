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
 * Parses user natural language into structured search criteria OR a conversational intent.
 */
export const parseUserQuery = async (userText: string, apiKey: string): Promise<SearchCriteria> => {
  // Use provided key or fallback to env var (safely checked)
  const key = apiKey || getEnvApiKey();
  
  if (!key) {
    console.warn("API Key missing");
    // Fallback simple search if no key
    return { intent: 'SEARCH', partName: userText }; 
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      intent: { 
        type: Type.STRING, 
        enum: ["SEARCH", "CHAT", "AGENT"], 
        description: "SEARCH: User looking for specific parts. CHAT: Greetings/small talk. AGENT: Wholesale (mayorista), bulk buying, company info, address, or complex questions." 
      },
      conversationalReply: {
        type: Type.STRING,
        description: "For CHAT or AGENT intents, write a polite Spanish response. For AGENT, invite them to contact support."
      },
      partName: { type: Type.STRING, description: "The specific name OR CODE of the auto part. Normalize to SINGULAR." },
      make: { type: Type.STRING, description: "Car brand/make (e.g., Toyota, Ford)." },
      model: { type: Type.STRING, description: "Car model (e.g., Corolla, Focus)." },
      year: { type: Type.STRING, description: "Car year." },
      category: { type: Type.STRING, description: "General category." }
    },
    required: ["intent"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are an expert auto parts store assistant.
      Analyze the user input: "${userText}"
      
      Rules:
      1. **SEARCH**: If user asks for a part, price, stock, or compatibility (e.g., "bujias para gol").
      2. **CHAT**: If user says "Hola", "Gracias", or small talk.
      3. **AGENT**: If user asks for:
         - Wholesale prices ("precio al mayor", "por mayor", "gremio").
         - Becoming a distributor.
         - Company address or specific contact info.
         - Complex mechanical advice not related to finding a part.
         - "Hablar con alguien" or "Soporte".
      
      Output JSON with the correct intent. If AGENT, write a polite message in 'conversationalReply' saying you can help connect them with an advisor.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a smart assistant. Distinguish between Product Search, Small Talk, and requests requiring Human Agent (Wholesale/Info).",
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SearchCriteria;
    }
    return { intent: 'SEARCH', partName: userText };
  } catch (error) {
    console.error("Gemini parse error:", error);
    return { intent: 'SEARCH', partName: userText }; // Fallback
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
      
      Generate a very short, friendly, professional response in Spanish summarizing the results. 
      - If found > 0: Say something like "Encontré estas opciones para [coche/repuesto]..."
      - If found 0: Apologize and suggest they check the year/model or ask for a generic part.
      `,
    });
    return response.text || `He encontrado ${resultCount} productos.`;
  } catch (e) {
    return `He encontrado ${resultCount} productos compatibles.`;
  }
};