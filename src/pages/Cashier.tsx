import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { fmtMoney } from "@/utils/money";
import { cn } from "@/lib/utils";
import Modal from "@/components/Modal";
import type { Product, Ingredient } from "@/types";

export default function Cashier() {
  const products = useAppStore((s) => s.products);
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const checkout = useAppStore((s) => s.checkout);

  const [resultModal, setResultModal] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: false, message: "" });
  const [lowStockModal, setLowStockModal] = useState<{
    open: boolean;
    items: Ingredient[];
  }>({ open: false, items: [] });

  const getCartQty = (productId: string): number => {
    const item = cart.find((c) => c.productId === productId);
    return item ? item.quantity : 0;
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    const result = checkout();
    setResultModal({ open: true, success: result.success, message: result.message });
    if (result.success && result.lowStock && result.lowStock.length > 0) {
      setTimeout(() => {
        setResultModal({ open: false, success: false, message: "" });
        setLowStockModal({ open: true, items: result.lowStock! });
      }, 1500);
    }
  };

  const handleDeleteItem = (productId: string) => {
    const qty = getCartQty(productId);
    for (let i = 0; i < qty; i++) {
      removeFromCart(productId);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-[7] p-6 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products
            .filter((p) => p.active)
            .map((product: Product) => {
              const qty = getCartQty(product.id);
              const selected = qty > 0;
              return (
                <div
                  key={product.id}
                  className={cn(
                    "card-hover p-5 cursor-pointer transition-all duration-200 active:scale-95 border-2",
                    selected ? "border-brand-400 shadow-pop" : "border-transparent"
                  )}
                >
                  <div className="text-center mb-3">
                    <span className="text-6xl block mb-2">{product.emoji}</span>
                    <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-brand-500 font-bold text-xl mt-1">{fmtMoney(product.price)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCart(product.id);
                      }}
                      disabled={qty === 0}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        qty === 0
                          ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                          : "bg-brand-100 text-brand-600 hover:bg-brand-200 active:scale-90"
                      )}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span
                      className={cn(
                        "text-xl font-bold w-8 text-center",
                        selected ? "text-brand-500" : "text-gray-400"
                      )}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 active:scale-90 transition-all shadow-soft"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="flex-[3] bg-white border-l border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-500" />
            <h2 className="text-xl font-semibold text-gray-800">当前订单</h2>
            {cart.length > 0 && (
              <span className="ml-auto chip bg-brand-100 text-brand-600">
                {cart.reduce((s, c) => s + c.quantity, 0)} 件
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-3 opacity-30" />
              <p>购物车是空的</p>
              <p className="text-sm mt-1">点击左侧商品添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-cream-50 hover:bg-cream-100 transition-colors"
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      {fmtMoney(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-brand-500 whitespace-nowrap">
                    {fmtMoney(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => handleDeleteItem(item.productId)}
                    className="p-2 rounded-full text-gray-400 hover:text-warn-500 hover:bg-warn-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">合计</span>
            <span className="text-3xl font-bold text-brand-500">{fmtMoney(totalAmount)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="btn-secondary flex-1"
            >
              <Trash2 className="w-4 h-4" />
              清空订单
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="btn-primary flex-1"
            >
              结账
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={resultModal.open}
        onClose={() => setResultModal({ open: false, success: false, message: "" })}
      >
        <div className="text-center py-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              resultModal.success ? "bg-success-400/20" : "bg-warn-400/20"
            )}
          >
            {resultModal.success ? (
              <CheckCircle className="w-10 h-10 text-success-500" />
            ) : (
              <AlertTriangle className="w-10 h-10 text-warn-500" />
            )}
          </div>
          <p className="text-lg font-medium text-gray-800">{resultModal.message}</p>
          <button
            onClick={() => setResultModal({ open: false, success: false, message: "" })}
            className="btn-primary mt-6 w-full"
          >
            确定
          </button>
        </div>
      </Modal>

      <Modal
        open={lowStockModal.open}
        onClose={() => setLowStockModal({ open: false, items: [] })}
        title="补货提醒"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-warn-500/10 rounded-xl text-warn-600">
            <Package className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">以下原料库存已低于安全阈值，请及时补货：</p>
          </div>
          <div className="space-y-2">
            {lowStockModal.items.map((ing) => (
              <div
                key={ing.id}
                className="flex items-center justify-between p-3 bg-cream-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ing.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-800">{ing.name}</p>
                    <p className="text-sm text-gray-500">安全阈值: {ing.minThreshold}{ing.unit}</p>
                  </div>
                </div>
                <span className="font-bold text-warn-500">
                  {ing.stock}{ing.unit}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setLowStockModal({ open: false, items: [] })}
            className="btn-primary w-full mt-2"
          >
            我知道了
          </button>
        </div>
      </Modal>
    </div>
  );
}
