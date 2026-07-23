import { useEffect, useState } from "react";
import { Plus, TrendingDown, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { syncRecord } from "@/lib/sync";
import {
  generateId,
  formatCurrency,
  formatDateShort,
  getMonthStart,
} from "@/utils/helpers";
import type { Expense } from "@/types";

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities",
  "Salaries",
  "Purchases",
  "Maintenance",
  "Transport",
  "Marketing",
  "Miscellaneous",
];

export default function ExpensesPage() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const { success, error: showError } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: "Miscellaneous",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await db.expenses
      .where("outletId")
      .equals(outlet.id)
      .reverse()
      .sortBy("date");
    setExpenses(data);
  };

  useEffect(() => {
    load();
  }, [outlet.id]);

  const monthStart = getMonthStart().split("T")[0];
  const monthExpenses = expenses.filter((e) => e.date >= monthStart);
  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const handleSave = async () => {
    if (!form.amount || !form.description) {
      showError("Amount and description are required.");
      return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      showError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      const expense = {
        id: generateId(),
        outletId: outlet.id,
        category: form.category,
        amount,
        description: form.description,
        date: form.date,
        createdAt: new Date().toISOString(),
        syncStatus: "pending" as const,
      };
      await db.expenses.add(expense);
      await syncRecord("expenses", expense);
      success("Expense recorded.");
      setShowModal(false);
      setForm({
        category: "Miscellaneous",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      load();
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (e: Expense) => {
    if (!confirm("Delete this expense?")) return;
    await db.expenses.delete(e.id);
    await syncRecord("expenses", e.id, "delete");
    success("Expense deleted.");
    load();
  };

  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: monthExpenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
  }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <Header
        title="Expenses"
        subtitle={`This month: ${formatCurrency(totalMonth)}`}
        actions={
          <Button
            icon={<Plus size={16} />}
            size="sm"
            onClick={() => setShowModal(true)}
          >
            Record Expense
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        {byCategory.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {byCategory.slice(0, 4).map(({ cat, total }) => (
              <div
                key={cat}
                className="bg-pos-card border border-pos-border rounded-xl p-4"
              >
                <p className="text-xs text-pos-muted mb-1">{cat}</p>
                <p className="text-lg font-bold text-pos-text">
                  {formatCurrency(total)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-pos-card border border-pos-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-pos-border">
            <h3 className="font-semibold text-pos-text">Expense Records</h3>
          </div>
          {expenses.length === 0 ? (
            <div className="py-12 text-center text-pos-muted text-sm">
              <TrendingDown size={36} className="mx-auto mb-3 opacity-30" />
              No expenses recorded yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pos-border">
                  {["Date", "Category", "Description", "Amount", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border">
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-pos-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-pos-muted text-xs">
                      {formatDateShort(e.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-pos-bg border border-pos-border px-2 py-1 rounded-md text-pos-muted">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-pos-text">{e.description}</td>
                    <td className="px-4 py-3 font-semibold text-red-400">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteExpense(e)}
                        className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Record Expense"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Amount (₦)"
            type="number"
            min="0"
            placeholder="5000"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label="Description"
            placeholder="Electricity bill payment"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
