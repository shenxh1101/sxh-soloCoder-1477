import type { Product, Ingredient, BomItem, Supplier, Purchase, Sale } from "@/types";
import { genId } from "@/utils/id";
import { todayStr, nowStr } from "@/utils/date";

const p1 = genId();
const p2 = genId();
const p3 = genId();
const p4 = genId();
const p5 = genId();

const i1 = genId();
const i2 = genId();
const i3 = genId();
const i4 = genId();
const i5 = genId();

const s1 = genId();
const s2 = genId();
const s3 = genId();

export const seedProducts: Product[] = [
  { id: p1, name: "包子", emoji: "🥟", price: 2.0, active: true },
  { id: p2, name: "油条", emoji: "🥖", price: 2.5, active: true },
  { id: p3, name: "豆浆", emoji: "🥛", price: 3.0, active: true },
  { id: p4, name: "稀饭", emoji: "🍚", price: 2.0, active: true },
  { id: p5, name: "茶叶蛋", emoji: "🥚", price: 1.5, active: true },
];

export const seedIngredients: Ingredient[] = [
  { id: i1, name: "面粉", emoji: "🌾", unit: "斤", stock: 50, minThreshold: 10, avgCost: 3.5 },
  { id: i2, name: "食用油", emoji: "🫒", unit: "斤", stock: 20, minThreshold: 5, avgCost: 12.0 },
  { id: i3, name: "黄豆", emoji: "🫘", unit: "斤", stock: 15, minThreshold: 3, avgCost: 5.0 },
  { id: i4, name: "鸡蛋", emoji: "🥚", unit: "个", stock: 100, minThreshold: 30, avgCost: 0.8 },
  { id: i5, name: "调料", emoji: "🧂", unit: "斤", stock: 10, minThreshold: 2, avgCost: 8.0 },
];

export const seedBom: BomItem[] = [
  { id: genId(), productId: p1, ingredientId: i1, quantity: 0.05 },
  { id: genId(), productId: p1, ingredientId: i5, quantity: 0.01 },
  { id: genId(), productId: p2, ingredientId: i1, quantity: 0.08 },
  { id: genId(), productId: p2, ingredientId: i2, quantity: 0.02 },
  { id: genId(), productId: p3, ingredientId: i3, quantity: 0.03 },
  { id: genId(), productId: p3, ingredientId: i5, quantity: 0.005 },
  { id: genId(), productId: p4, ingredientId: i1, quantity: 0.02 },
  { id: genId(), productId: p5, ingredientId: i4, quantity: 0.1 },
  { id: genId(), productId: p5, ingredientId: i5, quantity: 0.01 },
];

export const seedSuppliers: Supplier[] = [
  { id: s1, name: "老王粮油店", phone: "13812345678", mainIngredient: "面粉、食用油" },
  { id: s2, name: "张记豆业", phone: "13987654321", mainIngredient: "黄豆、鸡蛋" },
  { id: s3, name: "鲜味调料行", phone: "13600001111", mainIngredient: "调料" },
];

export const seedPurchases: Purchase[] = [
  {
    id: genId(),
    ingredientId: i1,
    supplierId: s1,
    supplierName: "老王粮油店",
    ingredientName: "面粉",
    quantity: 50,
    unitPrice: 3.5,
    totalCost: 175,
    date: todayStr(),
  },
  {
    id: genId(),
    ingredientId: i4,
    supplierId: s2,
    supplierName: "张记豆业",
    ingredientName: "鸡蛋",
    quantity: 100,
    unitPrice: 0.8,
    totalCost: 80,
    date: todayStr(),
  },
];

const sampleSaleId = genId();
export const seedSales: Sale[] = [
  {
    id: sampleSaleId,
    date: todayStr(),
    totalAmount: 19.5,
    totalCost: 6.8,
    profit: 12.7,
    createdAt: nowStr(),
    items: [
      {
        id: genId(),
        productId: p1,
        productName: "包子",
        emoji: "🥟",
        quantity: 3,
        unitPrice: 2.0,
        subtotal: 6.0,
        cost: 2.2,
      },
      {
        id: genId(),
        productId: p3,
        productName: "豆浆",
        emoji: "🥛",
        quantity: 2,
        unitPrice: 3.0,
        subtotal: 6.0,
        cost: 2.0,
      },
      {
        id: genId(),
        productId: p5,
        productName: "茶叶蛋",
        emoji: "🥚",
        quantity: 5,
        unitPrice: 1.5,
        subtotal: 7.5,
        cost: 2.6,
      },
    ],
  },
];
