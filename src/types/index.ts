export interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  active: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  stock: number;
  minThreshold: number;
  avgCost: number;
}

export interface BomItem {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  mainIngredient: string;
}

export interface Purchase {
  id: string;
  ingredientId: string;
  supplierId: string;
  supplierName: string;
  ingredientName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  date: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  emoji: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  cost: number;
}

export interface Sale {
  id: string;
  date: string;
  totalAmount: number;
  totalCost: number;
  profit: number;
  createdAt: string;
  items: SaleItem[];
}

export interface CartItem {
  productId: string;
  productName: string;
  emoji: string;
  price: number;
  quantity: number;
}
