import type { Purchase } from "@/types";
import { round2 } from "./money";

export interface PriceDiff {
  diff: number;
  type: "up" | "down" | "same";
  percent: number;
}

export const calcPurchasePriceDiff = (
  allPurchases: Purchase[],
  currentPurchase: Purchase
): PriceDiff | null => {
  const sameGroup = allPurchases.filter(
    (p) =>
      p.ingredientId === currentPurchase.ingredientId &&
      p.supplierId === currentPurchase.supplierId
  );

  sameGroup.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentIndex = sameGroup.findIndex((p) => p.id === currentPurchase.id);
  if (currentIndex === -1 || currentIndex >= sameGroup.length - 1) return null;

  const current = sameGroup[currentIndex].unitPrice;
  const prev = sameGroup[currentIndex + 1].unitPrice;
  const diff = current - prev;

  let type: "up" | "down" | "same" = "same";
  if (diff > 0.005) type = "up";
  else if (diff < -0.005) type = "down";

  const percent = prev > 0 ? round2((Math.abs(diff) / prev) * 100) : 0;

  return { diff: Math.abs(diff), type, percent };
};
