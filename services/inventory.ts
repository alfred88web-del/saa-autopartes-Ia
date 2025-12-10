import { Product, SearchCriteria } from "../types";

// Datos de prueba ampliados para cubrir búsquedas comunes
const MOCK_INVENTORY: Product[] = [
  // MOTOR
  {
    id: "REP-001",
    name: "Kit de Distribución Completo",
    category: "Motor",
    price: 120.00,
    currency: "USD",
    compatibleModels: ["Toyota Corolla", "Toyota Yaris", "Toyota Etios"],
    stock: 5,
    imageUrl: "https://picsum.photos/300/300?random=1",
    description: "Incluye correa, tensores y bomba de agua."
  },
  {
    id: "REP-003",
    name: "Bomba de Agua",
    category: "Motor",
    price: 35.00,
    currency: "USD",
    compatibleModels: ["Ford Fiesta", "Ford Ecosport", "Ford Ka"],
    stock: 8,
    imageUrl: "https://picsum.photos/300/300?random=2",
    description: "Bomba de agua de alto rendimiento."
  },
  {
    id: "REP-006",
    name: "Juego de Bujías Iridium (x4)",
    category: "Motor",
    price: 45.00,
    currency: "USD",
    compatibleModels: ["Honda Civic", "Honda Fit", "Toyota Corolla", "Nissan Sentra"],
    stock: 25,
    imageUrl: "https://picsum.photos/300/300?random=3",
    description: "Bujías de larga duración para mejor encendido."
  },
  {
    id: "REP-007",
    name: "Radiador de Aluminio",
    category: "Motor",
    price: 150.00,
    currency: "USD",
    compatibleModels: ["Chevrolet Aveo", "Chevrolet Corsa", "Chevrolet Onix"],
    stock: 3,
    imageUrl: "https://picsum.photos/300/300?random=4",
    description: "Radiador reforzado para climas cálidos."
  },

  // SUSPENSIÓN Y FRENOS
  {
    id: "REP-002",
    name: "Amortiguador Trasero",
    category: "Suspensión",
    price: 45.50,
    currency: "USD",
    compatibleModels: ["Chevrolet Corsa", "Chevrolet Onix", "Chevrolet Prisma"],
    stock: 12,
    imageUrl: "https://picsum.photos/300/300?random=5",
    description: "Amortiguador a gas, mayor confort."
  },
  {
    id: "REP-004",
    name: "Juego de Pastillas de Freno Delanteras",
    category: "Frenos",
    price: 28.99,
    currency: "USD",
    compatibleModels: ["Volkswagen Gol", "Volkswagen Golf", "Volkswagen Vento"],
    stock: 20,
    imageUrl: "https://picsum.photos/300/300?random=6",
    description: "Pastillas cerámicas de bajo ruido."
  },
  {
    id: "REP-008",
    name: "Discos de Freno Ventilados (Par)",
    category: "Frenos",
    price: 80.00,
    currency: "USD",
    compatibleModels: ["Ford Ranger", "Toyota Hilux", "Volkswagen Amarok"],
    stock: 10,
    imageUrl: "https://picsum.photos/300/300?random=7",
    description: "Discos ventilados para camionetas."
  },

  // ELECTRICIDAD E ILUMINACIÓN
  {
    id: "REP-009",
    name: "Batería 12V 75Ah Libre Mantenimiento",
    category: "Electricidad",
    price: 110.00,
    currency: "USD",
    compatibleModels: ["Universal", "Toyota Hilux", "Ford Ranger", "Volkswagen Amarok"],
    stock: 15,
    imageUrl: "https://picsum.photos/300/300?random=8",
    description: "Batería reforzada con 18 meses de garantía."
  },
  {
    id: "REP-010",
    name: "Óptica Delantera Izquierda",
    category: "Iluminación",
    price: 95.00,
    currency: "USD",
    compatibleModels: ["Peugeot 208", "Peugeot 2008"],
    stock: 4,
    imageUrl: "https://picsum.photos/300/300?random=9",
    description: "Faro delantero original con lupa."
  },
  {
    id: "REP-011",
    name: "Kit Luces LED Cree H7",
    category: "Iluminación",
    price: 25.00,
    currency: "USD",
    compatibleModels: ["Universal", "Volkswagen Gol", "Fiat Palio"],
    stock: 30,
    imageUrl: "https://picsum.photos/300/300?random=10",
    description: "Kit LED 20.000 lúmenes blanco frío."
  },

  // MANTENIMIENTO
  {
    id: "REP-005",
    name: "Filtro de Aceite",
    category: "Mantenimiento",
    price: 8.50,
    currency: "USD",
    compatibleModels: ["Fiat Cronos", "Fiat Palio", "Fiat Argo"],
    stock: 50,
    imageUrl: "https://picsum.photos/300/300?random=11",
    description: "Filtro blindado de alta eficiencia."
  },
  {
    id: "REP-012",
    name: "Aceite Sintético 5W-30 (4L)",
    category: "Mantenimiento",
    price: 55.00,
    currency: "USD",
    compatibleModels: ["Universal"],
    stock: 40,
    imageUrl: "https://picsum.photos/300/300?random=12",
    description: "Aceite 100% sintético para motores modernos."
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

    // Filtrado local (Modo Demo mejorado para búsqueda Universal)
    return MOCK_INVENTORY.filter(product => {
      const partName = (criteria.partName?.toLowerCase() || "").trim();
      const partNameSingular = partName.replace(/es$/, "").replace(/s$/, ""); 
      const make = (criteria.make?.toLowerCase() || "").trim();
      const model = (criteria.model?.toLowerCase() || "").trim();

      // Creamos un "blob" de texto del producto para buscar en todo a la vez
      // Esto simula la lógica del nuevo Script de Google
      const productBlob = (
        product.id + " " + 
        product.name + " " + 
        product.compatibleModels.join(" ") + " " + 
        product.category + " " +
        product.description
      ).toLowerCase();

      // 1. Verificamos si el término principal (partName) está en CUALQUIER lugar
      const matchesPart = partName 
        ? productBlob.includes(partName) || productBlob.includes(partNameSingular)
        : true;

      // 2. Verificamos Marca (si existe)
      const matchesMake = make 
        ? productBlob.includes(make)
        : true;

      // 3. Verificamos Modelo (si existe)
      const matchesModel = model 
        ? productBlob.includes(model)
        : true;

      return matchesPart && matchesMake && matchesModel;
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