import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Bell, DollarSign, ShoppingCart } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { todayStr } from "@/utils/date";
import { round2 } from "@/utils/money";

const titleMap: Record<string, string> = {
  "/": "收银台",
  "/inventory": "库存管理",
  "/products": "商品管理",
  "/suppliers": "供货商",
  "/reports": "经营报表",
  "/purchases": "进货记录",
  "/settlement": "今日结算",
};

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title }: TopBarProps) {
  const location = useLocation();
  const sales = useAppStore((s) => s.sales);
  const ingredients = useAppStore((s) => s.ingredients);

  const today = todayStr();

  const stats = useMemo(() => {
    const todaySales = sales.filter((s) => s.date === today);
    return {
      revenue: round2(todaySales.reduce((sum, s) => sum + s.totalAmount, 0)),
      orders: todaySales.length,
    };
  }, [sales, today]);

  const lowStockCount = useMemo(() => {
    return ingredients.filter((i) => i.stock <= i.minThreshold).length;
  }, [ingredients]);

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
          <Bell className={cn("w-6 h-6", lowStockCount > 0 ? "text-warn-500" : "text-gray-400")} />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-warn-500 rounded-full border-2 border-white text-white text-[10px] font-bold animate-pulse-slow">
              {lowStockCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
