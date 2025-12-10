export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  compatibleModels: string[]; // e.g., ["Toyota Corolla 2015-2020", "Mazda 3"]
  stock: number;
  imageUrl: string;
  description: string;
}

export interface SearchCriteria {
  partName?: string;
  make?: string;
  model?: string;
  year?: string;
  category?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface AppConfig {
  useMockData: boolean;
  appsScriptUrl: string;
  googleApiKey: string;
  whatsappNumber: string;
}