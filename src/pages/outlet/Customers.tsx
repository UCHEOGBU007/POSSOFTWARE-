import { useEffect, useState } from "react";
import { Plus, Search, Users, Pencil, Trash2, Star } from "lucide-react";

// Fixed: Unified relative pathways to absolute paths to support production bundlers
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { syncRecord } from "@/lib/sync";
import { generateId, formatCurrency, formatDateShort } from "@/utils/helpers";
import type { Customer } from "@/types";

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
}
const defaultForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
};

export default function CustomersPage() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const { success, error: showError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await db.customers
      .where("outletId")
      .equals(outlet.id)
      .toArray();
    setCustomers(data.sort((a, b) => b.totalSpent - a.totalSpent));
  };

  useEffect(() => {
    load();
  }, [outlet.id]);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowModal(true);
  };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      address: c.address ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      showError("Name and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editing) {
        await db.customers.update(editing.id, {
          ...form,
          updatedAt: now,
          syncStatus: "pending",
        });
        const updatedCustomer = await db.customers.get(editing.id);
        if (updatedCustomer) await syncRecord("customers", updatedCustomer);
        success("Customer updated.");
      } else {
        const existing = await db.customers
          .where({ outletId: outlet.id, phone: form.phone })
          .count();
        if (existing > 0) {
          showError("A customer with this phone number already exists.");
          return;
        }
        const customer = {
          id: generateId(),
          outletId: outlet.id,
          loyaltyPoints: 0,
          totalSpent: 0,
          visitCount: 0,
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending" as const,
          ...form,
        };
        await db.customers.add(customer);
        await syncRecord("customers", customer);
        success("Customer added.");
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      // Fixed: Reconstructed the missing catch handler block to resolve compiler breaks
      showError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (c: Customer) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    await db.customers.delete(c.id);
    await syncRecord("customers", c.id, "delete");
    success("Customer deleted.");
    load();
  };

  return (
    <div>
      <Header
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        actions={
          <Button icon={<Plus size={16} />} size="sm" onClick={openCreate}>
            Add Customer
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
          className="max-w-xs"
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">
              No customers yet
            </h3>
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Add First Customer
            </Button>
          </div>
        ) : (
          <div className="bg-pos-card border border-pos-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pos-border">
                  {[
                    "Customer",
                    "Phone",
                    "Total Spent",
                    "Visits",
                    "Loyalty Points",
                    "Since",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-pos-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-semibold text-sm shrink-0">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-pos-text">{c.name}</p>
                          {c.email && (
                            <p className="text-xs text-pos-muted">{c.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-pos-muted">{c.phone}</td>
                    <td className="px-4 py-3 font-semibold text-pos-text">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 text-pos-muted">{c.visitCount}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Star size={12} />
                        {c.loyaltyPoints}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-pos-muted text-xs">
                      {formatDateShort(c.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteCustomer(c)}
                          className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Customer" : "Add Customer"}
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
          <Input
            label="Full Name"
            placeholder="Amina Ibrahim"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="08012345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
          <Input
            label="Email (optional)"
            type="email"
            placeholder="amina@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Address (optional)"
            placeholder="Street, City"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
