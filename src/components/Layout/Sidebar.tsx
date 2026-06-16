import { NavLink } from "react-router-dom";
import {
  Calculator,
  Warehouse,
  ShoppingBag,
  Users,
  BarChart3,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { to: "/", label: "收银台", emoji: "💰", Icon: Calculator },
  { to: "/inventory", label: "库存管理", emoji: "📦", Icon: Warehouse },
  { to: "/products", label: "商品管理", emoji: "🍳", Icon: ShoppingBag },
  { to: "/suppliers", label: "供货商", emoji: "🚚", Icon: Users },
  { to: "/reports", label: "经营报表", emoji: "📊", Icon: BarChart3 },
  { to: "/purchases", label: "进货记录", emoji: "🧾", Icon: Receipt },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-2xl font-display text-brand-500">早点管家</h1>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map(({ to, label, emoji, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-brand-500 text-white shadow-soft"
                  : "text-gray-600 hover:bg-cream-100 hover:text-gray-900"
              )
            }
          >
            <span className="text-lg">{emoji}</span>
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
