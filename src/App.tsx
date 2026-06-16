import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/Layout/Sidebar";
import TopBar from "@/components/Layout/TopBar";
import Cashier from "@/pages/Cashier";
import Inventory from "@/pages/Inventory";
import Products from "@/pages/Products";
import Suppliers from "@/pages/Suppliers";
import Purchases from "@/pages/Purchases";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Sidebar />
      <div className="ml-60">
        <TopBar />
        <Routes>
          <Route path="/" element={<Cashier />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/purchases" element={<Purchases />} />
        </Routes>
      </div>
    </Router>
  );
}
