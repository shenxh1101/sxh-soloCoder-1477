import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Bell, DollarSign, ShoppingCart } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const titleMap: Record<string, string> = {
  "/": "收银台",
  "/inventory": "库存管理",
  "/products": "商品管理",
  "/suppliers": "供货商",
  "/reports": "经营报表",
  "/purchases": "进货记录",
};

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const location = useLocation();
  const getTodayStats = useAppStore((s) => s.getTodayStats);
  const getLowStockIngredients = useAppStore((s) => s.getLowStockIngredients);

  const stats = useMemo(() => getTodayStats(), [getTodayStats]);
  const lowStockIngredients = useMemo(() => getLowStockIngredients(), [getLowStockIngredients]);
  const hasLowStock = lowStockIngredients.length > 0;

  const pageTitle = title || titleMap[location.pathname] || "早点管家";

  return (
    <header className="ml-60 h-16 bg-white/80 backdrop-blur border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-gray-800">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-500" />
          <div className="text-right">
            <p className="text-xs text-gray-500">今日营业额</p>
            <p className="text-sm font-semibold text-gray-800">¥{stats.revenue.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-500" />
          <div className="text-right">
            <p className="text-xs text-gray-500">今日订单</p>
            <p className="text-sm font-semibold text-gray-800">{stats.orders} 单</p>
          </div>
        </div>
        <div className="relative">
          <Bell className={cn("w-6 h-6", hasLowStock ? "text-warn-500" : "text-gray-400")} />
          {hasLowStock && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-warn-500 rounded-full border-2 border-white animate-pulse-slow" />
          )}
        </div>
      </div>
    </header>
  );
}
