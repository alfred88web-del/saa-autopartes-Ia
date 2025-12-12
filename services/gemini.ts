import { GoogleGenAI, Type } from "@google/genai";
import type { Schema } from "@google/genai";
import { SearchCriteria, Product } from "../types";

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

// Local detection for basic interactions
const detectBasicIntent = (text: string): SearchCriteria | null => {
  const t = text.toLowerCase().trim();
  
  if (/^(hola|buen|buenas|hi|hello|gracias|chau)([\s\W]*)$/.test(t)) {
    return { 
      intent: 'CHAT', 
      conversationalReply: "¡Hola! 👋 Soy Carlos, tu asesor experto en repuestos. Cuéntame, ¿qué problema tiene tu auto o qué mantenimiento necesitas hacer hoy?" 
    };
  }

  if (t.includes('mayor') || t.includes('gremio') || t.includes('distribui') || t.includes('asesor') || t.includes('humano')) {
    return {
      intent: 'AGENT',
      conversationalReply: "Claro, entiendo que buscas una atención comercial especializada. Para listas de precios al gremio o compras mayoristas, te conectaré con administración."
    };
  }

  return null;
};

/**
 * Perform a "Smart Search" where the AI sees the entire inventory (or a subset) 
 * and decides which products match the user's need.
 */
export const performSemanticSearch = async (userText: string, allProducts: Product[], apiKey: string): Promise<{
    matches: Product[],
    reply: string,
    criteria: SearchCriteria
}> => {
    const key = apiKey || getEnvApiKey();
    if (!key) throw new Error("API Key required for semantic search");

    const ai = new GoogleGenAI({ apiKey: key });

    // We condense the product list to save tokens, but keep essential info
    const inventoryContext = allProducts.map(p => 
        `ID:${p.id} | Name:${p.name} | Cars:${p.compatibleModels.join(',')} | Cat:${p.category} | Desc:${p.description}`
    ).join('\n');

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            matchedProductIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of Product IDs that match the user request. Empty if no matches."
            },
            expertReply: {
                type: Type.STRING,
                description: "A friendly, expert explanation of why these products were chosen or advice if none were found."
            },
            technicalNote: {
                type: Type.STRING,
                description: "Brief diagnostic thought (e.g. 'Symptoms suggest worn struts')."
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
            Role: Expert Auto Parts AI with full knowledge of the database.
            
            Inventory Database:
            ${inventoryContext}
            
            User Query: "${userText}"
            
            Task: 
            1. Understand the user's problem (semantic search). E.g. "my car doesn't start" -> check Battery/Alternator. "makes noise when stopping" -> check Brakes.
            2. Select the IDs of products from the Database that solve this. Be flexible with synonyms (e.g., "focos" = "optica/luces").
            3. Write a helpful response.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const result = JSON.parse(cleanJson(response.text || "{}"));
        
        // Filter the full product list based on IDs returned by AI
        const matchedProducts = allProducts.filter(p => result.matchedProductIds?.includes(p.id));

        return {
            matches: matchedProducts,
            reply: result.expertReply || "Aquí tienes lo que encontré.",
            criteria: {
                intent: 'SEARCH',
                expertAdvice: result.technicalNote,
                ...result.inferredCriteria
            }
        };

    } catch (e) {
        console.error("Semantic search failed", e);
        // Fallback
        return {
            matches: [],
            reply: "Lo siento, tuve un problema analizando el inventario. ¿Puedes ser más específico?",
            criteria: { intent: 'SEARCH' }
        };
    }
};

/**
 * Parses user natural language into structured search criteria AND expert advice.
 * (Legacy/Remote mode)
 */
export const parseUserQuery = async (userText: string, apiKey: string): Promise<SearchCriteria> => {
  const localIntent = detectBasicIntent(userText);
  const key = apiKey || getEnvApiKey();
  
  if (!key) {
    console.warn("API Key missing");
    if (localIntent) return localIntent;
    return { intent: 'SEARCH', partName: userText }; 
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      intent: { 
        type: Type.STRING, 
        enum: ["SEARCH", "CHAT", "AGENT"], 
        description: "SEARCH if the user describes a car problem or asks for a part. CHAT for greetings. AGENT for wholesale/admin." 
      },
      conversationalReply: {
        type: Type.STRING,
        description: "Only for CHAT/AGENT. A polite expert response."
      },
      expertAdvice: {
        type: Type.STRING,
        description: "Brief technical insight based on the user's problem. E.g., if user says 'squeaky noise', advise 'Sounds like worn pads, checking brakes'."
      },
      partName: { type: Type.STRING, description: "Inferred part name from symptoms or explicit request. E.g., 'frenos' -> 'pastillas de freno'." },
      make: { type: Type.STRING, description: "Car make." },
      model: { type: Type.STRING, description: "Car model." },
      year: { type: Type.STRING, description: "Car year." },
    },
    required: ["intent"],
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `You are Carlos, a Senior Auto Parts Salesman and Mechanic.
      User Input: "${userText}"
      Analyze intent and extract keywords for search.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    if (response.text) {
      return JSON.parse(cleanJson(response.text)) as SearchCriteria;
    }
    return localIntent || { intent: 'SEARCH', partName: userText };

  } catch (error) {
    console.error("Gemini parse error:", error);
    return localIntent || { intent: 'SEARCH', partName: userText };
  }
};

/**
 * Generates a SALES PITCH summary based on search results.
 */
export const generateSummary = async (query: string, products: Product[], criteria: SearchCriteria, apiKey: string): Promise<string> => {
  const key = apiKey || getEnvApiKey();
  const count = products.length;

  // Fallback text if no API key
  if (!key) return `Encontré ${count} opciones disponibles.`;

  const ai = new GoogleGenAI({ apiKey: key });

  // Create a simplified list of products for the prompt to save tokens
  const productContext = products.slice(0, 5).map(p => 
    `- ${p.name} (${p.category}): $${p.price} [${p.stock > 0 ? 'En Stock' : 'Agotado'}] - ${p.description}`
  ).join("\n");

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `
      Role: Senior Auto Parts Salesperson.
      User Query: "${query}"
      Expert Context: "${criteria.expertAdvice || ''}"
      Inventory Results Found (${count}):
      ${productContext}
      
      Task: Write a persuasive, helpful response in Spanish to the customer.
      `,
    });
    return response.text || `Aquí tienes los ${count} productos que encontré.`;
  } catch (e) {
    return `He encontrado ${count} productos que coinciden con tu búsqueda.`;
  }
};