import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Phone, Package, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { fmtMoney } from "@/utils/money";
import { formatDate } from "@/utils/date";
import Modal from "@/components/Modal";
import Empty from "@/components/Empty";
import type { Supplier, Purchase } from "@/types";

interface SupplierFormData {
  name: string;
  phone: string;
  mainIngredient: string;
}

export default function Suppliers() {
  const suppliers = useAppStore((s) => s.suppliers);
  const purchases = useAppStore((s) => s.purchases);
  const addSupplier = useAppStore((s) => s.addSupplier);
  const updateSupplier = useAppStore((s) => s.updateSupplier);
  const deleteSupplier = useAppStore((s) => s.deleteSupplier);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    phone: "",
    mainIngredient: "",
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: "", phone: "", mainIngredient: "" });
    setModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      mainIngredient: supplier.mainIngredient,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingSupplier(null);
    setFormData({ name: "", phone: "", mainIngredient: "" });
    setModalOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.mainIngredient.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier(formData);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除该供货商吗？")) {
      deleteSupplier(id);
      if (expandedId === id) {
        setExpandedId(null);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const supplierPurchasesMap = useMemo(() => {
    const map = new Map<string, Purchase[]>();
    purchases.forEach((p) => {
      const list = map.get(p.supplierId) || [];
      list.push(p);
      map.set(p.supplierId, list);
    });
    map.forEach((list, key) => {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    return map;
  }, [purchases]);

  const calcPriceDiff = (purchases: Purchase[], index: number): { diff: number; type: "up" | "down" | "same" } | null => {
    if (index >= purchases.length - 1) return null;
    const current = purchases[index].unitPrice;
    const prev = purchases[index + 1].unitPrice;
    const diff = current - prev;
    if (diff > 0) return { diff, type: "up" };
    if (diff < 0) return { diff: Math.abs(diff), type: "down" };
    return { diff: 0, type: "same" };
  };

  const isFormValid = () => {
    return formData.name.trim() && formData.phone.trim() && formData.mainIngredient.trim();
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">供货商管理</h1>
          <button className="btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            新增供货商
          </button>
        </div>

        {suppliers.length === 0 ? (
          <div className="h-80">
            <Empty />
          </div>
        ) : (
          <div className="space-y-3">
            {suppliers.map((sp) => {
              const isExpanded = expandedId === sp.id;
              const supplierPurchases = supplierPurchasesMap.get(sp.id) || [];

              return (
                <div key={sp.id} className="card overflow-hidden">
                  <div
                    className="p-5 cursor-pointer transition-colors hover:bg-cream-50"
                    onClick={() => toggleExpand(sp.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
                        🏪
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-800">{sp.name}</h3>
                          <span className="chip bg-cream-100 text-gray-600">
                            <Package size={12} />
                            {sp.mainIngredient}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {sp.phone}
                          </span>
                          <span>历史进货 {supplierPurchases.length} 次</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="rounded-lg p-2 text-gray-400 hover:bg-brand-50 hover:text-brand-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(sp);
                          }}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="rounded-lg p-2 text-gray-400 hover:bg-warn-500/10 hover:text-warn-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(sp.id);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="ml-2 text-gray-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-cream-50">
                      <div className="px-5 py-4">
                        <h4 className="mb-3 text-sm font-semibold text-gray-700">
                          历史进价记录
                        </h4>
                        {supplierPurchases.length === 0 ? (
                          <div className="py-6 text-center text-sm text-gray-400">
                            暂无进货记录
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                    日期
                                  </th>
                                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                                    原料
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                                    数量
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                                    单价
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                                    涨跌
                                  </th>
                                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                                    总金额
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {supplierPurchases.map((p, idx) => {
                                  const diff = calcPriceDiff(supplierPurchases, idx);
                                  return (
                                    <tr
                                      key={p.id}
                                      className="border-b border-gray-50 last:border-none"
                                    >
                                      <td className="px-4 py-3 text-sm text-gray-700">
                                        {formatDate(p.date)}
                                      </td>
                                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                        {p.ingredientName}
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm text-gray-700">
                                        {p.quantity}
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm text-gray-800">
                                        {fmtMoney(p.unitPrice)}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {diff ? (
                                          <span
                                            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                              diff.type === "up"
                                                ? "text-warn-500"
                                                : diff.type === "down"
                                                ? "text-success-600"
                                                : "text-gray-400"
                                            }`}
                                          >
                                            {diff.type === "up" && <ArrowUp size={12} />}
                                            {diff.type === "down" && <ArrowDown size={12} />}
                                            {diff.type === "same" && <Minus size={12} />}
                                            {diff.type !== "same" && fmtMoney(diff.diff)}
                                            {diff.type === "same" && "持平"}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-gray-300">—</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right text-sm font-semibold text-brand-600">
                                        {fmtMoney(p.totalCost)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={closeModal}
          title={editingSupplier ? "编辑供货商" : "新增供货商"}
        >
          <div className="space-y-4">
            <div>
              <label className="label">供货商名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入供货商名称"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="label">联系电话</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
                className="input"
              />
            </div>
            <div>
              <label className="label">主营原料</label>
              <input
                type="text"
                value={formData.mainIngredient}
                onChange={(e) => setFormData({ ...formData, mainIngredient: e.target.value })}
                placeholder="例如：面粉、食用油"
                className="input"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button className="btn-secondary flex-1" onClick={closeModal}>
                取消
              </button>
              <button
                className="btn-primary flex-1"
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                {editingSupplier ? "保存修改" : "确认添加"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
