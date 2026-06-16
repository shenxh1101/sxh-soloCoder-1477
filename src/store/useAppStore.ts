import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Product,
  Ingredient,
  BomItem,
  Supplier,
  Purchase,
  Sale,
  CartItem,
  SaleItem,
} from "@/types";
import {
  seedProducts,
  seedIngredients,
  seedBom,
  seedSuppliers,
  seedPurchases,
  seedSales,
} from "@/data/seedData";
import { genId } from "@/utils/id";
import { todayStr, nowStr } from "@/utils/date";
import { round2 } from "@/utils/money";

interface AppState {
  products: Product[];
  ingredients: Ingredient[];
  bom: BomItem[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  cart: CartItem[];

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateCartQty: (productId: string, qty: number) => void;

  checkout: () => { success: boolean; message: string; lowStock?: Ingredient[] };

  addIngredientStock: (data: {
    ingredientId: string;
    supplierId: string;
    quantity: number;
    unitPrice: number;
  }) => void;

  updateProductPrice: (productId: string, price: number) => void;
  updateBom: (productId: string, items: { ingredientId: string; quantity: number }[]) => void;

  addSupplier: (s: Omit<Supplier, "id">) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  updateIngredientThreshold: (id: string, threshold: number) => void;

  getLowStockIngredients: () => Ingredient[];
  getTodayStats: () => { revenue: number; profit: number; orders: number };
  getLastPurchasePrice: (ingredientId: string, supplierId: string) => number | null;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      ingredients: seedIngredients,
      bom: seedBom,
      suppliers: seedSuppliers,
      purchases: seedPurchases,
      sales: seedSales,
      cart: [],

      addToCart: (product) => {
        set((s) => {
          const existing = s.cart.find((c) => c.productId === product.id);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
              ),
            };
          }
          return {
            cart: [
              ...s.cart,
              {
                productId: product.id,
                productName: product.name,
                emoji: product.emoji,
                price: product.price,
                quantity: 1,
              },
            ],
          };
        });
      },

      removeFromCart: (productId) => {
        set((s) => {
          const existing = s.cart.find((c) => c.productId === productId);
          if (!existing) return {};
          if (existing.quantity <= 1) {
            return { cart: s.cart.filter((c) => c.productId !== productId) };
          }
          return {
            cart: s.cart.map((c) =>
              c.productId === productId ? { ...c, quantity: c.quantity - 1 } : c
            ),
          };
        });
      },

      updateCartQty: (productId, qty) => {
        if (qty <= 0) {
          set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) }));
          return;
        }
        set((s) => ({
          cart: s.cart.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
        }));
      },

      clearCart: () => set({ cart: [] }),

      checkout: () => {
        const { cart, ingredients, bom, products } = get();
        if (cart.length === 0) return { success: false, message: "购物车为空" };

        const needMap = new Map<string, number>();
        for (const ci of cart) {
          const boms = bom.filter((b) => b.productId === ci.productId);
          for (const b of boms) {
            const cur = needMap.get(b.ingredientId) || 0;
            needMap.set(b.ingredientId, cur + b.quantity * ci.quantity);
          }
        }

        const lowStock: Ingredient[] = [];
        for (const [ingId, need] of needMap.entries()) {
          const ing = ingredients.find((i) => i.id === ingId);
          if (!ing) continue;
          if (ing.stock < need) {
            lowStock.push(ing);
          }
        }
        if (lowStock.length > 0) {
          return { success: false, message: "原料不足", lowStock };
        }

        let totalCost = 0;
        const saleItems: SaleItem[] = [];
        const newIngredients = [...ingredients];

        for (const ci of cart) {
          const boms = bom.filter((b) => b.productId === ci.productId);
          let itemCost = 0;
          for (const b of boms) {
            const ingIdx = newIngredients.findIndex((i) => i.id === b.ingredientId);
            if (ingIdx >= 0) {
              const ing = newIngredients[ingIdx];
              const used = b.quantity * ci.quantity;
              itemCost += used * ing.avgCost;
              newIngredients[ingIdx] = { ...ing, stock: round2(ing.stock - used) };
            }
          }
          saleItems.push({
            id: genId(),
            productId: ci.productId,
            productName: ci.productName,
            emoji: ci.emoji,
            quantity: ci.quantity,
            unitPrice: ci.price,
            subtotal: round2(ci.price * ci.quantity),
            cost: round2(itemCost),
          });
          totalCost += itemCost;
        }

        const totalAmount = saleItems.reduce((s, it) => s + it.subtotal, 0);
        const newSale: Sale = {
          id: genId(),
          date: todayStr(),
          totalAmount: round2(totalAmount),
          totalCost: round2(totalCost),
          profit: round2(totalAmount - totalCost),
          createdAt: nowStr(),
          items: saleItems,
        };

        const triggeredLow = newIngredients.filter((i) => i.stock <= i.minThreshold);

        set({
          ingredients: newIngredients,
          sales: [newSale, ...get().sales],
          cart: [],
        });

        if (triggeredLow.length > 0) {
          return {
            success: true,
            message: "结账成功！部分原料库存偏低",
            lowStock: triggeredLow,
          };
        }
        return { success: true, message: "结账成功！" };
      },

      addIngredientStock: (data) => {
        set((s) => {
          const ing = s.ingredients.find((i) => i.id === data.ingredientId);
          const supplier = s.suppliers.find((sp) => sp.id === data.supplierId);
          if (!ing) return {};

          const oldTotal = ing.stock * ing.avgCost;
          const addTotal = data.quantity * data.unitPrice;
          const newStock = ing.stock + data.quantity;
          const newAvg = newStock > 0 ? round2((oldTotal + addTotal) / newStock) : data.unitPrice;

          const newIngredients = s.ingredients.map((i) =>
            i.id === data.ingredientId ? { ...i, stock: newStock, avgCost: newAvg } : i
          );

          const purchase: Purchase = {
            id: genId(),
            ingredientId: data.ingredientId,
            supplierId: data.supplierId,
            supplierName: supplier?.name || "",
            ingredientName: ing.name,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            totalCost: round2(data.quantity * data.unitPrice),
            date: todayStr(),
          };

          return {
            ingredients: newIngredients,
            purchases: [purchase, ...s.purchases],
          };
        });
      },

      updateProductPrice: (productId, price) => {
        set((s) => ({
          products: s.products.map((p) =>
            p.id === productId ? { ...p, price: round2(price) } : p
          ),
        }));
      },

      updateBom: (productId, items) => {
        set((s) => {
          const filtered = s.bom.filter((b) => b.productId !== productId);
          const newBom = items.map((it) => ({
            id: genId(),
            productId,
            ingredientId: it.ingredientId,
            quantity: it.quantity,
          }));
          return { bom: [...filtered, ...newBom] };
        });
      },

      addSupplier: (s) => {
        set((st) => ({
          suppliers: [...st.suppliers, { ...s, id: genId() }],
        }));
      },

      updateSupplier: (id, s) => {
        set((st) => ({
          suppliers: st.suppliers.map((sp) => (sp.id === id ? { ...sp, ...s } : sp)),
        }));
      },

      deleteSupplier: (id) => {
        set((st) => ({
          suppliers: st.suppliers.filter((sp) => sp.id !== id),
        }));
      },

      updateIngredientThreshold: (id, threshold) => {
        set((s) => ({
          ingredients: s.ingredients.map((i) =>
            i.id === id ? { ...i, minThreshold: threshold } : i
          ),
        }));
      },

      getLowStockIngredients: () => {
        return get().ingredients.filter((i) => i.stock <= i.minThreshold);
      },

      getTodayStats: () => {
        const today = todayStr();
        const todaySales = get().sales.filter((s) => s.date === today);
        return {
          revenue: round2(todaySales.reduce((sum, s) => sum + s.totalAmount, 0)),
          profit: round2(todaySales.reduce((sum, s) => sum + s.profit, 0)),
          orders: todaySales.length,
        };
      },

      getLastPurchasePrice: (ingredientId, supplierId) => {
        const purchases = get().purchases.filter(
          (p) => p.ingredientId === ingredientId && p.supplierId === supplierId
        );
        if (purchases.length === 0) return null;
        return purchases[0].unitPrice;
      },
    }),
    {
      name: "breakfast-shop-store",
      partialize: (state) => ({
        products: state.products,
        ingredients: state.ingredients,
        bom: state.bom,
        suppliers: state.suppliers,
        purchases: state.purchases,
        sales: state.sales,
      }),
    }
  )
);
