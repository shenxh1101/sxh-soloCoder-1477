import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { fmtMoney } from "@/utils/money";
import { round2 } from "@/utils/money";
import Modal from "@/components/Modal";
import type { BomItem } from "@/types";

interface BomFormItem {
  id: string;
  ingredientId: string;
  quantity: string;
}

export default function Products() {
  const products = useAppStore((s) => s.products);
  const ingredients = useAppStore((s) => s.ingredients);
  const bom = useAppStore((s) => s.bom);
  const updateProductPrice = useAppStore((s) => s.updateProductPrice);
  const updateBom = useAppStore((s) => s.updateBom);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceProductId, setPriceProductId] = useState("");
  const [priceValue, setPriceValue] = useState("");

  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [bomProductId, setBomProductId] = useState("");
  const [bomItems, setBomItems] = useState<BomFormItem[]>([]);

  const ingredientMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; unit: string; avgCost: number }>();
    ingredients.forEach((i) =>
      map.set(i.id, { name: i.name, emoji: i.emoji, unit: i.unit, avgCost: i.avgCost })
    );
    return map;
  }, [ingredients]);

  const productBomMap = useMemo(() => {
    const map = new Map<string, BomItem[]>();
    bom.forEach((b) => {
      const list = map.get(b.productId) || [];
      list.push(b);
      map.set(b.productId, list);
    });
    return map;
  }, [bom]);

  const calcProductCost = (productId: string): number => {
    const items = productBomMap.get(productId) || [];
    let cost = 0;
    items.forEach((b) => {
      const ing = ingredientMap.get(b.ingredientId);
      if (ing) {
        cost += b.quantity * ing.avgCost;
      }
    });
    return round2(cost);
  };

  const openPriceModal = (productId: string, currentPrice: number) => {
    setPriceProductId(productId);
    setPriceValue(String(currentPrice));
    setPriceModalOpen(true);
  };

  const closePriceModal = () => {
    setPriceProductId("");
    setPriceValue("");
    setPriceModalOpen(false);
  };

  const savePrice = () => {
    const price = parseFloat(priceValue);
    if (!priceProductId || isNaN(price) || price <= 0) return;
    updateProductPrice(priceProductId, price);
    closePriceModal();
  };

  const openBomModal = (productId: string) => {
    const items = productBomMap.get(productId) || [];
    setBomProductId(productId);
    setBomItems(
      items.map((b) => ({
        id: b.id,
        ingredientId: b.ingredientId,
        quantity: String(b.quantity),
      }))
    );
    setBomModalOpen(true);
  };

  const closeBomModal = () => {
    setBomProductId("");
    setBomItems([]);
    setBomModalOpen(false);
  };

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      {
        id: `tmp-${Date.now()}`,
        ingredientId: "",
        quantity: "",
      },
    ]);
  };

  const removeBomItem = (id: string) => {
    setBomItems(bomItems.filter((i) => i.id !== id));
  };

  const updateBomItem = (id: string, field: "ingredientId" | "quantity", value: string) => {
    setBomItems(
      bomItems.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const saveBom = () => {
    if (!bomProductId) return;
    const validItems = bomItems
      .filter((i) => i.ingredientId && i.quantity)
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: parseFloat(i.quantity),
      }))
      .filter((i) => !isNaN(i.quantity) && i.quantity > 0);

    const hasDuplicate = new Set(validItems.map((i) => i.ingredientId)).size !== validItems.length;
    if (hasDuplicate) return;

    updateBom(bomProductId, validItems);
    closeBomModal();
  };

  const bomIsValid = () => {
    if (bomItems.length === 0) return false;
    const validItems = bomItems.filter((i) => i.ingredientId && i.quantity);
    if (validItems.length !== bomItems.length) return false;
    const ids = validItems.map((i) => i.ingredientId);
    if (new Set(ids).size !== ids.length) return false;
    return validItems.every((i) => {
      const q = parseFloat(i.quantity);
      return !isNaN(q) && q > 0;
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">商品管理</h1>
          <div className="text-sm text-gray-500">共 {products.length} 种商品</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const cost = calcProductCost(p.id);
            const margin = round2(p.price - cost);
            const marginRate = p.price > 0 ? round2((margin / p.price) * 100) : 0;

            return (
              <div key={p.id} className="card-hover p-5">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
                    <div className="mt-1 text-2xl font-bold text-brand-600">
                      {fmtMoney(p.price)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-xl bg-cream-50 px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">成本估算</span>
                    <span className="font-medium text-gray-800">{fmtMoney(cost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">毛利</span>
                    <span className={`font-medium ${margin >= 0 ? "text-success-600" : "text-warn-500"}`}>
                      {fmtMoney(margin)} ({marginRate}%)
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className="btn-secondary flex-1 text-sm py-2"
                    onClick={() => openPriceModal(p.id, p.price)}
                  >
                    <Pencil size={16} />
                    编辑售价
                  </button>
                  <button
                    className="btn-secondary flex-1 text-sm py-2"
                    onClick={() => openBomModal(p.id)}
                  >
                    <Pencil size={16} />
                    编辑配方
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <Modal
          open={priceModalOpen}
          onClose={closePriceModal}
          title="编辑售价"
        >
          <div className="space-y-4">
            <div>
              <label className="label">商品售价（元）</label>
              <input
                type="number"
                value={priceValue}
                onChange={(e) => setPriceValue(e.target.value)}
                placeholder="请输入售价"
                className="input"
                min="0"
                step="any"
                autoFocus
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={closePriceModal}>
                取消
              </button>
              <button
                className="btn-primary flex-1"
                onClick={savePrice}
                disabled={!priceValue || isNaN(parseFloat(priceValue)) || parseFloat(priceValue) <= 0}
              >
                确认
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          open={bomModalOpen}
          onClose={closeBomModal}
          title="编辑配方（BOM）"
          className="max-w-lg"
        >
          <div className="space-y-4">
            {bomItems.length === 0 ? (
              <div className="py-8 text-center text-gray-400">暂无配方，点击下方按钮添加</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {bomItems.map((item, idx) => {
                  const ing = ingredientMap.get(item.ingredientId);
                  return (
                    <div key={item.id} className="flex items-start gap-2 rounded-xl bg-cream-50 p-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white text-sm font-semibold text-gray-500">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <select
                          value={item.ingredientId}
                          onChange={(e) => updateBomItem(item.id, "ingredientId", e.target.value)}
                          className="input h-10 py-2 text-sm"
                        >
                          <option value="">选择原料</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.emoji} {ing.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateBomItem(item.id, "quantity", e.target.value)}
                            placeholder="用量"
                            className="input h-10 flex-1 py-2 text-sm"
                            min="0"
                            step="any"
                          />
                          {ing && (
                            <span className="text-sm text-gray-500 w-12">{ing.unit}</span>
                          )}
                        </div>
                        {ing && item.quantity && !isNaN(parseFloat(item.quantity)) && (
                          <div className="text-xs text-gray-500">
                            小计成本：{fmtMoney(parseFloat(item.quantity) * ing.avgCost)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeBomItem(item.id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-warn-500/10 hover:text-warn-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              className="btn-secondary w-full"
              onClick={addBomItem}
            >
              <Plus size={18} />
              添加配方行
            </button>

            {bomItems.length > 0 && (
              <div className="rounded-xl bg-brand-50 px-4 py-3">
                <div className="text-sm text-brand-600">
                  预计总成本：
                  <span className="text-lg font-semibold">
                    {fmtMoney(
                      bomItems.reduce((sum, i) => {
                        const ing = ingredientMap.get(i.ingredientId);
                        const q = parseFloat(i.quantity);
                        if (ing && !isNaN(q) && q > 0) {
                          return sum + q * ing.avgCost;
                        }
                        return sum;
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={closeBomModal}>
                取消
              </button>
              <button
                className="btn-primary flex-1"
                onClick={saveBom}
                disabled={!bomIsValid()}
              >
                保存配方
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
