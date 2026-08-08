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
import { formatDateShort } from "@/utils/helpers";
import type { Outlet, Staff } from "@/types";

/**
 * Form state layout for creating and editing staff members
 */
interface StaffForm {
  name: string;
  email: string;
  phone: string;
  pin: string;
  confirmPin: string;
  outletId: string;
  role: "cashier" | "manager";
}

/**
 * Initial empty state defaults for staff creation form
 */
const defaultForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  pin: "",
  confirmPin: "",
  outletId: "",
  role: "cashier",
};

/**
 * Staff Management Component
 * Allows merchants to add, edit, deactivate, and delete staff/cashiers
 * and assign them to specific store outlets.
 */
export default function StaffPage() {
  const { merchantSession, createStaff } = useAuth();
  const merchant = merchantSession?.merchant;
  const { success, error: showError } = useToast();

  // Local state for staff list, outlet dropdowns, and modal controls
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffForm>(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Fetches all outlets for the current merchant and loads corresponding
   * staff records from IndexedDB.
   */
  const loadData = async () => {
    if (!merchant?.id) return;

    // Fetch outlets owned by active merchant
    const outs = await db.outlets
      .where("merchantId")
      .equals(merchant.id)
      .toArray();
    setOutlets(outs);

    // Fetch staff records associated with retrieved outlets
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

  // Re-fetch staff and outlet data whenever merchant ID changes
  useEffect(() => {
    loadData();
  }, [merchant?.id]);

  // Render fallback loading state if merchant session is unavailable
  if (!merchant) {
    return (
      <div className="p-8 text-center text-pos-muted">
        Loading merchant session...
      </div>
    );
  }

  /**
   * Opens the creation modal and pre-selects the first outlet if available
   */
  const openCreate = () => {
    setEditingStaff(null);
    setForm({
      ...defaultForm,
      outletId: outlets.length > 0 ? outlets[0].id : "",
    });
    setShowModal(true);
  };

  /**
   * Opens the edit modal prepopulated with existing staff record data
   */
  const openEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone ?? "",
      pin: "", // Keep PIN fields empty by default during edit
      confirmPin: "",
      outletId: staff.outletId,
      role: staff.role as "cashier" | "manager",
    });
    setShowModal(true);
  };

  /**
   * Validates form input and persists staff data (create or update) to local DB and server sync
   */
  const handleSave = async () => {
    // Basic requirement check
    if (!form.name.trim() || !form.email.trim() || !form.outletId) {
      showError("Name, email, and outlet assignment are required.");
      return;
    }

    // Require valid PIN during initial creation
    if (!editingStaff && (!form.pin || form.pin.length < 12)) {
      showError("Staff password must be at least 12 characters.");
      return;
    }

    // Ensure PIN confirmation matches if a PIN value was entered
    if (form.pin && form.pin !== form.confirmPin) {
      showError("PINs do not match.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      if (editingStaff) {
        // Prepare patch updates for existing staff
        const updates: Partial<Staff> & Record<string, any> = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          outletId: form.outletId,
          role: form.role,
          updatedAt: now,
          syncStatus: "pending",
        };

        // Update PIN only if user provided a new one
        if (form.pin) {
          updates.pin = form.pin;
        }

        await db.staff.update(editingStaff.id, updates);
        const updatedStaff = await db.staff.get(editingStaff.id);
        if (updatedStaff) {
          const syncResult = await syncRecord("staff", updatedStaff);
          if (!syncResult.ok) {
            throw new Error(
              (syncResult.error as Error)?.message ||
                "Failed to sync updated staff to Supabase.",
            );
          }
        }

        success("Staff details updated.");
      } else {
        await createStaff(
          form.outletId,
          form.name.trim(),
          form.email.trim().toLowerCase(),
          form.phone.trim(),
          form.role,
          form.pin,
        );

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

  /**
   * Toggles active status for the target staff member
   */
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

  /**
   * Removes staff member from local DB and triggers backend deletion sync
   */
  const deleteStaff = async (staff: Staff) => {
    if (!confirm(`Delete staff member "${staff.name}"?`)) return;

    await db.staff.delete(staff.id);
    await syncRecord("staff", staff.id, "delete");
    success("Staff member deleted.");
    loadData();
  };

  return (
    <div>
      {/* Header section with dynamic action button based on outlet availability */}
      <Header
        title="Staff & Cashiers"
        subtitle={`Manage cashier terminal access and branch assignments`}
        actions={
          outlets.length > 0 ? (
            <Button
              icon={<Plus size={16} />}
              onClick={openCreate}
              className="w-full sm:w-auto"
            >
              Add New Staff
            </Button>
          ) : (
            <Button
              variant="secondary"
              disabled
              title="Create an outlet first"
              className="w-full sm:w-auto"
            >
              Create Outlet First
            </Button>
          )
        }
      />

      <div className="p-4 sm:p-6">
        {/* State 1: Prompt user to create an outlet first if none exist */}
        {outlets.length === 0 ? (
          <div className="p-6 sm:p-8 text-center bg-pos-card border border-pos-border rounded-xl">
            <p className="text-pos-muted text-sm">
              You must create at least one outlet before assigning cashiers.
            </p>
          </div>
        ) : staffList.length === 0 ? (
          /* State 2: Empty staff list state */
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center px-4">
            <Users size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">
              No staff members yet
            </h3>
            <p className="text-sm text-pos-muted mb-6 max-w-sm">
              Add cashiers and managers to enable terminal logins on your POS
              devices.
            </p>
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Add First Staff Member
            </Button>
          </div>
        ) : (
          /* State 3: Staff card directory listing */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => {
              // Map assigned outlet entity for name display
              const assignedOutlet = outlets.find(
                (o) => o.id === staff.outletId,
              );

              return (
                <div
                  key={staff.id}
                  className="bg-pos-card border border-pos-border rounded-xl p-4 sm:p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Staff avatar, name, email & active badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-violet-600/15 flex items-center justify-center shrink-0">
                          <UserCheck size={18} className="text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-pos-text truncate">
                            {staff.name}
                          </p>
                          <p className="text-xs text-pos-muted truncate">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Badge
                          variant={staff.isActive ? "success" : "muted"}
                          dot
                        >
                          {staff.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Metadata summary box */}
                    <div className="bg-pos-bg rounded-lg p-3 space-y-1 border border-pos-border/40 text-xs">
                      <div className="flex justify-between text-pos-muted gap-2">
                        <span>Assigned Branch:</span>
                        <span className="font-medium text-pos-text truncate">
                          {assignedOutlet ? assignedOutlet.name : "Unassigned"}
                        </span>
                      </div>
                      <div className="flex justify-between text-pos-muted gap-2">
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
                  </div>

                  {/* Action toolbar for individual staff card */}
                  <div className="flex gap-2 pt-2 border-t border-pos-border/40">
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

      {/* Staff Create / Edit Modal Dialog */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? "Edit Staff Details" : "Add New Staff / Cashier"}
        size="md"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              className="w-full sm:w-auto"
            >
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Branch Outlet Dropdown Selection */}
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

          {/* Role Selection */}
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

          {/* Staff credentials are Supabase Auth passwords, not a local PIN. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={
                editingStaff
                  ? "New staff password (not supported here)"
                  : "Initial staff password (12+ characters) *"
              }
              type={showPin ? "text" : "password"}
              placeholder="Use a unique 12+ character password"
              value={form.pin}
              onChange={(e) =>
                setForm({ ...form, pin: e.target.value })
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
              label="Confirm password"
              type={showPin ? "text" : "password"}
              placeholder="Repeat password"
              value={form.confirmPin}
              onChange={(e) =>
                setForm({ ...form, confirmPin: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
