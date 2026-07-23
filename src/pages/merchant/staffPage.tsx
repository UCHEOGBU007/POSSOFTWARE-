import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { syncRecord } from "@/lib/sync";
import { generateId, formatDateShort } from "@/utils/helpers";
import type { Outlet, Staff } from "@/types";

interface StaffForm {
  name: string;
  email: string;
  phone: string;
  pin: string;
  confirmPin: string;
  outletId: string;
  role: "cashier" | "manager";
}

const defaultForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  pin: "",
  confirmPin: "",
  outletId: "",
  role: "cashier",
};

export default function StaffPage() {
  const { merchantSession } = useAuth();
  const merchant = merchantSession?.merchant;
  const { success, error: showError } = useToast();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffForm>(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!merchant?.id) return;

    // Load Outlets first
    const outs = await db.outlets
      .where("merchantId")
      .equals(merchant.id)
      .toArray();
    setOutlets(outs);

    // Load Staff across all merchant outlets
    const outletIds = outs.map((o) => o.id);
    if (outletIds.length > 0) {
      const staffMembers = await db.staff
        .where("outletId")
        .anyOf(outletIds)
        .toArray();
      setStaffList(staffMembers);
    } else {
      setStaffList([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [merchant?.id]);

  if (!merchant) {
    return (
      <div className="p-8 text-center text-pos-muted">
        Loading merchant session...
      </div>
    );
  }

  const openCreate = () => {
    setEditingStaff(null);
    setForm({
      ...defaultForm,
      outletId: outlets.length > 0 ? outlets[0].id : "",
    });
    setShowModal(true);
  };

  const openEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone ?? "",
      pin: "",
      confirmPin: "",
      outletId: staff.outletId,
      role: staff.role as "cashier" | "manager",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.outletId) {
      showError("Name, email, and outlet assignment are required.");
      return;
    }

    if (!editingStaff && (!form.pin || form.pin.length < 4)) {
      showError("Terminal Login PIN must be 4 to 6 digits.");
      return;
    }

    if (form.pin && form.pin !== form.confirmPin) {
      showError("PINs do not match.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      if (editingStaff) {
        // UPDATE STAFF
        const updates: Partial<Staff> & Record<string, any> = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          outletId: form.outletId,
          role: form.role,
          updatedAt: now,
          syncStatus: "pending",
        };

        if (form.pin) {
          updates.pin = form.pin; // Stored for terminal keypad check
        }

        await db.staff.update(editingStaff.id, updates);
        const updatedStaff = await db.staff.get(editingStaff.id);
        if (updatedStaff) await syncRecord("staff", updatedStaff);

        success("Staff details updated.");
      } else {
        // CREATE NEW STAFF
        const newStaffId = generateId();

        const staffMember: Staff & Record<string, any> = {
          id: newStaffId,
          outletId: form.outletId,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          pin: form.pin,
          role: form.role,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending",
        };

        // 1. Local Dexie DB
        await db.staff.add(staffMember as Staff);

        // 2. Cloud Supabase Sync
        await syncRecord("staff", staffMember);

        success(`Staff member "${form.name}" created and assigned!`);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      showError(err.message || "Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (staff: Staff) => {
    const updatedStatus = !staff.isActive;
    const now = new Date().toISOString();

    await db.staff.update(staff.id, {
      isActive: updatedStatus,
      updatedAt: now,
      syncStatus: "pending",
    } as any);

    const updatedStaff = await db.staff.get(staff.id);
    if (updatedStaff) await syncRecord("staff", updatedStaff);

    success(`Staff member ${updatedStatus ? "activated" : "deactivated"}.`);
    loadData();
  };

  const deleteStaff = async (staff: Staff) => {
    if (!confirm(`Delete staff member "${staff.name}"?`)) return;

    await db.staff.delete(staff.id);
    await syncRecord("staff", staff.id, "delete");
    success("Staff member deleted.");
    loadData();
  };

  return (
    <div>
      <Header
        title="Staff & Cashiers"
        subtitle={`Manage cashier terminal access and branch assignments`}
        actions={
          outlets.length > 0 ? (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Add New Staff
            </Button>
          ) : (
            <Button variant="secondary" disabled title="Create an outlet first">
              Create Outlet First
            </Button>
          )
        }
      />

      <div className="p-6">
        {outlets.length === 0 ? (
          <div className="p-8 text-center bg-pos-card border border-pos-border rounded-xl">
            <p className="text-pos-muted text-sm mb-3">
              You must create at least one outlet before assigning cashiers.
            </p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">
              No staff members yet
            </h3>
            <p className="text-sm text-pos-muted mb-6">
              Add cashiers and managers to enable terminal logins on your POS
              devices.
            </p>
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              const assignedOutlet = outlets.find(
                (o) => o.id === staff.outletId,
              );

              return (
                <div
                  key={staff.id}
                  className="bg-pos-card border border-pos-border rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center">
                        <UserCheck size={18} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-pos-text">
                          {staff.name}
                        </p>
                        <p className="text-xs text-pos-muted truncate max-w-40">
                          {staff.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant={staff.isActive ? "success" : "muted"} dot>
                      {staff.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="bg-pos-bg rounded-lg p-3 space-y-1 border border-pos-border/40 text-xs">
                    <div className="flex justify-between text-pos-muted">
                      <span>Assigned Branch:</span>
                      <span className="font-medium text-pos-text">
                        {assignedOutlet ? assignedOutlet.name : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex justify-between text-pos-muted">
                      <span>Role:</span>
                      <span className="font-medium text-pos-text capitalize">
                        {staff.role}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-pos-muted">
                    Added {formatDateShort(staff.createdAt)}
                    {staff.phone && ` · ${staff.phone}`}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="xs"
                      variant="outline"
                      icon={<Pencil size={13} />}
                      onClick={() => openEdit(staff)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant={staff.isActive ? "secondary" : "success"}
                      icon={
                        staff.isActive ? (
                          <ToggleLeft size={13} />
                        ) : (
                          <ToggleRight size={13} />
                        )
                      }
                      onClick={() => toggleActive(staff)}
                      className="flex-1"
                    >
                      {staff.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="xs"
                      variant="danger"
                      icon={<Trash2 size={13} />}
                      onClick={() => deleteStaff(staff)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? "Edit Staff Details" : "Add New Staff / Cashier"}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingStaff ? "Save Changes" : "Create Staff"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="cashier@store.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number (optional)"
              type="tel"
              placeholder="08012345678"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-pos-muted mb-1 block">
              Assign to Branch Outlet *
            </label>
            <select
              value={form.outletId}
              onChange={(e) => setForm({ ...form, outletId: e.target.value })}
              className="w-full bg-pos-bg border border-pos-border rounded-xl p-3 text-sm text-pos-text focus:outline-none focus:border-blue-500"
              required
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.address})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-pos-muted mb-1 block">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as "cashier" | "manager",
                })
              }
              className="w-full bg-pos-bg border border-pos-border rounded-xl p-3 text-sm text-pos-text focus:outline-none focus:border-blue-500"
            >
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={
                editingStaff
                  ? "New Terminal PIN (optional)"
                  : "Terminal Login PIN (4–6 digits) *"
              }
              type={showPin ? "text" : "password"}
              placeholder="e.g. 1234"
              value={form.pin}
              onChange={(e) =>
                setForm({
                  ...form,
                  pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="pointer-events-auto cursor-pointer"
                >
                  {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />
            <Input
              label="Confirm PIN"
              type={showPin ? "text" : "password"}
              placeholder="Repeat PIN"
              value={form.confirmPin}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPin: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
