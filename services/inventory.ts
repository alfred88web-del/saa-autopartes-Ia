import { Product, SearchCriteria } from "../types";

// Datos de prueba actualizados para coincidir con la estructura: Codigo, Marca, Repuesto...
const MOCK_INVENTORY: Product[] = [
  {
    id: "REP-001",
    name: "Kit de Distribución",
    category: "Motor",
    price: 120.00,
    currency: "USD",
    compatibleModels: ["Toyota", "Corolla", "Yaris"], // Simulando la columna 'Marca'
    stock: 5,
    imageUrl: "https://picsum.photos/300/300?random=10",
    description: "Kit de Distribución para Toyota"
  },
  {
    id: "REP-002",
    name: "Amortiguador Trasero",
    category: "Suspensión",
    price: 45.50,
    currency: "USD",
    compatibleModels: ["Chevrolet", "Corsa", "Onix"],
    stock: 12,
    imageUrl: "https://picsum.photos/300/300?random=11",
    description: "Amortiguador Trasero para Chevrolet"
  },
  {
    id: "REP-003",
    name: "Bomba de Agua",
    category: "Refrigeración",
    price: 35.00,
    currency: "USD",
    compatibleModels: ["Ford", "Fiesta", "Ecosport"],
    stock: 8,
    imageUrl: "https://picsum.photos/300/300?random=12",
    description: "Bomba de Agua para Ford"
  },
  {
    id: "REP-004",
    name: "Juego de Pastillas de Freno",
    category: "Frenos",
    price: 28.99,
    currency: "USD",
    compatibleModels: ["Volkswagen", "Gol", "Golf"],
    stock: 20,
    imageUrl: "https://picsum.photos/300/300?random=13",
    description: "Juego de Pastillas de Freno para Volkswagen"
  },
  {
    id: "REP-005",
    name: "Filtro de Aceite",
    category: "Mantenimiento",
    price: 8.50,
    currency: "USD",
    compatibleModels: ["Fiat", "Cronos", "Palio"],
    stock: 50,
    imageUrl: "https://picsum.photos/300/300?random=14",
    description: "Filtro de Aceite para Fiat"
  }
];

export const searchInventory = async (
  criteria: SearchCriteria,
  useMock: boolean,
  appsScriptUrl?: string
): Promise<Product[]> => {
  console.log("Buscando repuestos:", criteria);

  if (useMock || !appsScriptUrl) {
    // Simular retardo de red
    await new Promise(resolve => setTimeout(resolve, 600));

    // Filtrado local (Modo Demo)
    return MOCK_INVENTORY.filter(product => {
      // 1. Coincidencia de Nombre (Repuesto)
      const matchName = criteria.partName 
        ? product.name.toLowerCase().includes(criteria.partName.toLowerCase())
        : true;
      
      // 2. Coincidencia de Marca (Buscamos en compatibleModels que simula la columna Marca)
      const matchMake = criteria.make
        ? product.compatibleModels.some(m => m.toLowerCase().includes(criteria.make!.toLowerCase()))
        : true;

      // 3. Coincidencia de Modelo (si la IA detecta modelo específico)
      const matchModel = criteria.model
        ? product.compatibleModels.some(m => m.toLowerCase().includes(criteria.model!.toLowerCase()))
        : true;

      return matchName && (matchMake || matchModel);
    });
  } else {
    // Conexión Real a Google Apps Script
    try {
      const url = new URL(appsScriptUrl);
      
      // Mapeamos los criterios de la IA a los parámetros que espera el script
      if (criteria.partName) url.searchParams.append("part", criteria.partName);
      if (criteria.make) url.searchParams.append("make", criteria.make);
      if (criteria.model) url.searchParams.append("model", criteria.model);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data as Product[];
    } catch (error) {
      console.error("Error conectando con Apps Script:", error);
      throw error; 
    }
  }
};