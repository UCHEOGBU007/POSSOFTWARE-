// import { useEffect, useState } from "react";
// import { Plus, TrendingDown, Trash2 } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import Modal from "@/components/ui/Modal";
// import Select from "@/components/ui/Select";
// import { useToast } from "@/components/ui/Toast";
// import { syncRecord } from "@/lib/sync";
// import {
//   generateId,
//   formatCurrency,
//   formatDateShort,
//   getMonthStart,
// } from "@/utils/helpers";
// import type { Expense } from "@/types";

// const EXPENSE_CATEGORIES = [
//   "Rent",
//   "Utilities",
//   "Salaries",
//   "Purchases",
//   "Maintenance",
//   "Transport",
//   "Marketing",
//   "Miscellaneous",
// ];

// export default function ExpensesPage() {
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;
//   const staff = outletSession!.staff;
//   const { success, error: showError } = useToast();
//   const [expenses, setExpenses] = useState<Expense[]>([]);
//   const [showModal, setShowModal] = useState(false);
//   const [form, setForm] = useState({
//     category: "Miscellaneous",
//     amount: "",
//     description: "",
//     date: new Date().toISOString().split("T")[0],
//   });
//   const [saving, setSaving] = useState(false);

//   const load = async () => {
//     const data = await db.expenses
//       .where("outletId")
//       .equals(outlet.id)
//       .reverse()
//       .sortBy("date");
//     setExpenses(data);
//   };

//   useEffect(() => {
//     load();
//   }, [outlet.id]);

//   const monthStart = getMonthStart().split("T")[0];
//   const monthExpenses = expenses.filter((e) => e.date >= monthStart);
//   const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

//   const handleSave = async () => {
//     if (!form.amount || !form.description) {
//       showError("Amount and description are required.");
//       return;
//     }
//     const amount = parseFloat(form.amount);
//     if (isNaN(amount) || amount <= 0) {
//       showError("Enter a valid amount.");
//       return;
//     }
//     setSaving(true);
//     try {
//       const expense = {
//         id: generateId(),
//         outletId: outlet.id,
//         category: form.category,
//         amount,
//         description: form.description,
//         date: form.date,
//         staffId: staff?.id,
//         createdAt: new Date().toISOString(),
//         syncStatus: "pending" as const,
//       };
//       await db.expenses.add(expense);
//       await syncRecord("expenses", expense);
//       success("Expense recorded.");
//       setShowModal(false);
//       setForm({
//         category: "Miscellaneous",
//         amount: "",
//         description: "",
//         date: new Date().toISOString().split("T")[0],
//       });
//       load();
//     } finally {
//       setSaving(false);
//     }
//   };

//   const deleteExpense = async (e: Expense) => {
//     if (!confirm("Delete this expense?")) return;
//     await db.expenses.delete(e.id);
//     await syncRecord("expenses", e.id, "delete");
//     success("Expense deleted.");
//     load();
//   };

//   const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
//     cat,
//     total: monthExpenses
//       .filter((e) => e.category === cat)
//       .reduce((s, e) => s + e.amount, 0),
//   }))
//     .filter((x) => x.total > 0)
//     .sort((a, b) => b.total - a.total);

//   return (
//     <div>
//       <Header
//         title="Expenses"
//         subtitle={`This month: ${formatCurrency(totalMonth)}`}
//         actions={
//           <Button
//             icon={<Plus size={16} />}
//             size="sm"
//             onClick={() => setShowModal(true)}
//           >
//             Record Expense
//           </Button>
//         }
//       />
//       <div className="p-6 space-y-6">
//         {byCategory.length > 0 && (
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//             {byCategory.slice(0, 4).map(({ cat, total }) => (
//               <div
//                 key={cat}
//                 className="bg-pos-card border border-pos-border rounded-xl p-4"
//               >
//                 <p className="text-xs text-pos-muted mb-1">{cat}</p>
//                 <p className="text-lg font-bold text-pos-text">
//                   {formatCurrency(total)}
//                 </p>
//               </div>
//             ))}
//           </div>
//         )}

//         <div className="bg-pos-card border border-pos-border rounded-xl overflow-x-auto">
//           <div className="px-6 py-4 border-b border-pos-border">
//             <h3 className="font-semibold text-pos-text">Expense Records</h3>
//           </div>
//           {expenses.length === 0 ? (
//             <div className="py-12 text-center text-pos-muted text-sm">
//               <TrendingDown size={36} className="mx-auto mb-3 opacity-30" />
//               No expenses recorded yet.
//             </div>
//           ) : (
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-pos-border">
//                   {["Date", "Category", "Description", "Amount", ""].map(
//                     (h) => (
//                       <th
//                         key={h}
//                         className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
//                       >
//                         {h}
//                       </th>
//                     ),
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-pos-border">
//                 {expenses.map((e) => (
//                   <tr
//                     key={e.id}
//                     className="hover:bg-pos-hover transition-colors"
//                   >
//                     <td className="px-4 py-3 text-pos-muted text-xs">
//                       {formatDateShort(e.date)}
//                     </td>
//                     <td className="px-4 py-3">
//                       <span className="text-xs bg-pos-bg border border-pos-border px-2 py-1 rounded-md text-pos-muted">
//                         {e.category}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-pos-text">{e.description}</td>
//                     <td className="px-4 py-3 font-semibold text-red-400">
//                       {formatCurrency(e.amount)}
//                     </td>
//                     <td className="px-4 py-3">
//                       <button
//                         onClick={() => deleteExpense(e)}
//                         className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
//                       >
//                         <Trash2 size={15} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>

//       <Modal
//         open={showModal}
//         onClose={() => setShowModal(false)}
//         title="Record Expense"
//         size="sm"
//         footer={
//           <div className="flex gap-3 justify-end">
//             <Button variant="outline" onClick={() => setShowModal(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleSave} loading={saving}>
//               Save
//             </Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Select
//             label="Category"
//             value={form.category}
//             onChange={(e) => setForm({ ...form, category: e.target.value })}
//             options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
//           />
//           <Input
//             label="Amount (₦)"
//             type="number"
//             min="0"
//             placeholder="5000"
//             value={form.amount}
//             onChange={(e) => setForm({ ...form, amount: e.target.value })}
//             required
//           />
//           <Input
//             label="Description"
//             placeholder="Electricity bill payment"
//             value={form.description}
//             onChange={(e) => setForm({ ...form, description: e.target.value })}
//             required
//           />
//           <Input
//             label="Date"
//             type="date"
//             value={form.date}
//             onChange={(e) => setForm({ ...form, date: e.target.value })}
//           />
//         </div>
//       </Modal>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Plus, TrendingDown, Trash2, Pencil } from "lucide-react";

// Contexts & Database
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";

// UI Components
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

// Utilities & Types
import { syncRecord } from "@/lib/sync";
import {
  generateId,
  formatCurrency,
  formatDateShort,
  getMonthStart,
} from "@/utils/helpers";
import type { Expense } from "@/types";

/**
 * Predefined list of category options available when categorizing expenses.
 */
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
  // ---------------------------------------------------------------------------
  // Context & Hooks Initialization
  // ---------------------------------------------------------------------------
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const staff = outletSession!.staff;
  const { success, error: showError } = useToast();

  // ---------------------------------------------------------------------------
  // Access Control / Role Verification
  // ---------------------------------------------------------------------------
  // Extract role from session or user object and determine manager status.
  const role = outletSession?.staff?.role || "staff"; // Default to 'staff' if role is undefined
  const isManager = role === "manager";

  // ---------------------------------------------------------------------------
  // Component State
  // ---------------------------------------------------------------------------
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null); // Holds the target expense item during edit mode
  const [form, setForm] = useState({
    category: "Miscellaneous",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------
  /**
   * Loads all expenses for the active outlet from Dexie local database,
   * sorted by date in descending order (most recent first).
   */
  const load = async () => {
    const data = await db.expenses
      .where("outletId")
      .equals(outlet.id)
      .reverse()
      .sortBy("date");
    setExpenses(data);
  };

  // Trigger initial data load when outlet ID changes
  useEffect(() => {
    load();
  }, [outlet.id]);

  // ---------------------------------------------------------------------------
  // Financial Calculations & Metrics
  // ---------------------------------------------------------------------------
  // Filters expenses recorded in the current month to calculate month-to-date total spending
  const monthStart = getMonthStart().split("T")[0];
  const monthExpenses = expenses.filter((e) => e.date >= monthStart);
  const totalMonth = monthExpenses.reduce((s, e) => s + e.amount, 0);

  // Group current month's expenses by category for summary metrics cards
  const byCategory = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: monthExpenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
  }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  // ---------------------------------------------------------------------------
  // User Actions & Handlers
  // ---------------------------------------------------------------------------
  /**
   * Resets form state and opens the modal to record a brand-new expense.
   */
  const openCreate = () => {
    setEditing(null);
    setForm({
      category: "Miscellaneous",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setShowModal(true);
  };

  /**
   * Opens the edit modal prepopulated with existing expense details.
   * Access Guard: Only users with the 'manager' role are allowed.
   */
  const openEdit = (e: Expense) => {
    if (!isManager) {
      showError("Only managers are authorized to edit expenses.");
      return;
    }
    setEditing(e);
    setForm({
      category: e.category,
      amount: e.amount.toString(),
      description: e.description,
      date: e.date,
    });
    setShowModal(true);
  };

  /**
   * Validates input fields and handles both Create and Update operations.
   * Updates local IndexedDB via Dexie and triggers sync service.
   */
  const handleSave = async () => {
    // Additional authorization check prior to executing update
    if (editing && !isManager) {
      showError("Only managers are authorized to edit expenses.");
      return;
    }
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
      if (editing) {
        // Handle Edit operation
        const updatedExpense = {
          ...editing,
          category: form.category,
          amount,
          description: form.description,
          date: form.date,
          syncStatus: "pending" as const,
        };
        await db.expenses.update(editing.id, updatedExpense);
        await syncRecord("expenses", updatedExpense);
        success("Expense updated.");
      } else {
        // Handle Create operation
        const expense = {
          id: generateId(),
          outletId: outlet.id,
          category: form.category,
          amount,
          description: form.description,
          date: form.date,
          staffId: staff?.id,
          createdAt: new Date().toISOString(),
          syncStatus: "pending" as const,
        };
        await db.expenses.add(expense);
        await syncRecord("expenses", expense);
        success("Expense recorded.");
      }
      setShowModal(false);
      setEditing(null);
      setForm({
        category: "Miscellaneous",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      load();
    } catch (err: any) {
      showError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deletes an expense record from IndexedDB and syncs deletion status.
   * Access Guard: Only users with the 'manager' role are allowed.
   */
  const deleteExpense = async (e: Expense) => {
    if (!isManager) {
      showError("Only managers are authorized to delete expenses.");
      return;
    }
    if (!confirm("Delete this expense?")) return;
    await db.expenses.delete(e.id);
    await syncRecord("expenses", e.id, "delete");
    success("Expense deleted.");
    load();
  };

  // ---------------------------------------------------------------------------
  // Component Markup (JSX)
  // ---------------------------------------------------------------------------
  return (
    <div>
      {/* Page Header Component with Action Button */}
      <Header
        title="Expenses"
        subtitle={`This month: ${formatCurrency(totalMonth)}`}
        actions={
          <Button icon={<Plus size={16} />} size="sm" onClick={openCreate}>
            Record Expense
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        {/* Category breakdown overview cards */}
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

        {/* Expenses Table Section */}
        <div className="bg-pos-card border border-pos-border rounded-xl overflow-x-auto">
          <div className="px-6 py-4 border-b border-pos-border">
            <h3 className="font-semibold text-pos-text">Expense Records</h3>
          </div>
          {expenses.length === 0 ? (
            /* Empty State Display */
            <div className="py-12 text-center text-pos-muted text-sm">
              <TrendingDown size={36} className="mx-auto mb-3 opacity-30" />
              No expenses recorded yet.
            </div>
          ) : (
            /* Data Table Display */
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pos-border">
                  {[
                    "Date",
                    "Category",
                    "Description",
                    "Amount",
                    // Conditionally include empty table header column for action buttons if manager
                    ...(isManager ? [""] : []),
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border">
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-pos-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-pos-muted text-xs whitespace-nowrap">
                      {formatDateShort(e.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs bg-pos-bg border border-pos-border px-2 py-1 rounded-md text-pos-muted">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-pos-text">{e.description}</td>
                    <td className="px-4 py-3 font-semibold text-red-400 whitespace-nowrap">
                      {formatCurrency(e.amount)}
                    </td>
                    {/* Conditionally render actions column (Edit/Delete buttons) only for managers */}
                    {isManager && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(e)}
                            className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
                            aria-label="Edit expense"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteExpense(e)}
                            className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label="Delete expense"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form Component for Adding or Editing Expenses */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Expense" : "Record Expense"}
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
