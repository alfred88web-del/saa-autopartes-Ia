import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { SearchCriteria, Product, ChatMessage } from "../types";

const modelId = "gemini-2.5-flash";

// Helper to safely get env var
const getEnvApiKey = () => {
  try {
    return typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
  } catch (e) {
    return undefined;
  }
};

// Helper to clean Markdown JSON code blocks
const cleanJson = (text: string) => {
  if (!text) return "{}";
  let clean = text.replace(/```json/g, "").replace(/```/g, "");
  return clean.trim();
};

/**
 * Perform a "Smart Search" with CONVERSATIONAL MEMORY.
 */
export const performSemanticSearch = async (
    userText: string, 
    history: ChatMessage[],
    allProducts: Product[], 
    apiKey: string
): Promise<{
    matches: Product[],
    reply: string,
    criteria: SearchCriteria
}> => {
    const key = apiKey || getEnvApiKey();
    if (!key) throw new Error("API Key required for semantic search");

    const ai = new GoogleGenAI({ apiKey: key });

    // 1. Prepare Inventory Context (Condensed)
    const inventoryContext = allProducts.map(p => 
        `ID:${p.id} | Name:${p.name} | Cars:${p.compatibleModels.join(',')} | Cat:${p.category} | Price:$${p.price}`
    ).join('\n');

    // 2. Prepare Conversation History (Last 6 messages for context)
    const conversationContext = history.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'CLIENTE' : 'CARLOS (VENDEDOR)'}: ${msg.text}`
    ).join('\n');

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            matchedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of Product IDs from the DB that match the user request. Return EMPTY list if you need to ask more questions first."
            },
            expertReply: {
                type: Type.STRING,
                description: "Your conversational response as Carlos. Be human, warm, and professional."
            },
            technicalNote: {
                type: Type.STRING,
                description: "Internal diagnostic thought."
            },
            inferredCriteria: {
                type: Type.OBJECT,
                properties: {
                    make: { type: Type.STRING },
                    model: { type: Type.STRING },
                    year: { type: Type.STRING },
                    partName: { type: Type.STRING }
                }
            }
        },
        required: ["matchedProductIds", "expertReply"]
    };

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `
            Role: You are 'Carlos', a charismatic and expert auto parts salesman with 20 years of experience. You are NOT a robot. You are a helpful human interacting via chat.
            
            Inventory Database:
            ${inventoryContext}
            
            Conversation History:
            ${conversationContext}
            
            Current User Input: "${userText}"
            
            Your Mission:
            1. **Analyze:** specific car model mentioned? specific part or symptom?
            2. **Search:** Look at the Inventory Database. Find items that match the user's need.
            3. **Decision (The most important part):**
               - If you found relevant parts in the DB that solve the user's problem: **YOU MUST** include their IDs in 'matchedProductIds'. 
               - Your 'expertReply' should be persuasive: "¡Tengo justo lo que buscas! Mira..."
               - **CLOSING THE SALE**: The user cannot buy if you don't return the IDs. Always prefer showing products over just talking, if the product exists in the DB.
               - If the user describes a symptom (e.g. "car won't start"): Diagnose it. If you have the part (e.g. Battery) in the DB, SHOW IT immediately.
            
            4. **Data Gathering:** If you strictly CANNOT find the part or don't know the car model yet (and it's relevant for compatibility), ask for it nicely.
            
            5. **Persona:** Speak like a local expert mechanic/seller (Carlos). Warm, confident, helpful. Use Latin American Spanish.
            
            Output JSON format only.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = JSON.parse(cleanJson(response.text || "{}"));
        
        const matchedProducts = allProducts.filter(p => result.matchedProductIds?.includes(p.id));

        return {
            matches: matchedProducts,
            reply: result.expertReply || "Déjame revisar el stock un momento...",
            criteria: {
                intent: 'SEARCH',
                expertAdvice: result.technicalNote,
                ...result.inferredCriteria
            }
        };

    } catch (e) {
        console.error("Semantic search failed", e);
        return {
            matches: [],
            reply: "Disculpa, se me cortó un poco la señal. ¿Me podrías repetir qué repuesto buscabas?",
            criteria: { intent: 'SEARCH' }
        };
    }
};

/**
 * Legacy Parser (Kept for Remote Mode fallback, but improved prompt)
 */
export const parseUserQuery = async (userText: string, apiKey: string): Promise<SearchCriteria> => {
  const key = apiKey || getEnvApiKey();
  if (!key) return { intent: 'SEARCH', partName: userText }; 

  const ai = new GoogleGenAI({ apiKey: key });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      intent: { type: Type.STRING, enum: ["SEARCH", "CHAT", "AGENT"] },
      conversationalReply: { type: Type.STRING },
      partName: { type: Type.STRING },
      make: { type: Type.STRING },
      model: { type: Type.STRING },
      year: { type: Type.STRING },
    },
    required: ["intent"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are Carlos, a friendly auto parts expert. Analyze: "${userText}".
      If it's just a greeting, intent=CHAT.
      If asking for admin/wholesale, intent=AGENT.
      If looking for parts, intent=SEARCH and extract details.`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });

    if (response.text) return JSON.parse(cleanJson(response.text)) as SearchCriteria;
    return { intent: 'SEARCH', partName: userText };
  } catch (error) {
    return { intent: 'SEARCH', partName: userText };
  }
};

export const generateSummary = async (query: string, products: Product[], criteria: SearchCriteria, apiKey: string): Promise<string> => {
  const key = apiKey || getEnvApiKey();
  const count = products.length;
  if (!key) return `Encontré ${count} productos.`;

  const ai = new GoogleGenAI({ apiKey: key });
  const productContext = products.slice(0, 3).map(p => `${p.name} ($${p.price})`).join(", ");

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Role: Carlos (Expert Salesman).
      User asked: "${query}".
      Found ${count} items: ${productContext}.
      
      Write a short, engaging response. 
      If 0 items: Apologize and ask for more details on the car model.
      If > 0 items: Recommend the best value option enthusiastically.
      `,
    });
    return response.text || `Aquí tienes los ${count} productos.`;
  } catch (e) {
    return `Aquí están las opciones que encontré.`;
  }
};