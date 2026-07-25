import { useEffect, useState } from "react";
import {
  Plus,
  Store,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Copy,
  Check,
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
import { generateId, hashPin, formatDateShort } from "@/utils/helpers";
import type { Outlet } from "@/types";
import { TIER_LIMITS } from "@/types";

/**
 * Interface representing the internal form state for creating or editing an outlet.
 */
interface OutletForm {
  name: string;
  address: string;
  phone: string;
  pin: string;
  confirmPin: string;
  taxEnabled: boolean;
  receiptFooter: string;
}

/** Default initial values for the outlet creation form */
const defaultForm: OutletForm = {
  name: "",
  address: "",
  phone: "",
  pin: "",
  confirmPin: "",
  taxEnabled: true,
  receiptFooter: "Thank you for your patronage!",
};

/**
 * OutletsPage Component
 * Manages physical store locations/branches for a merchant.
 * Handles adding, editing, deactivating, and deleting outlets, as well as managing device pairing codes and setup PINs.
 */
export default function OutletsPage() {
  // Retrieve merchant session and toast notification context
  const { merchantSession } = useAuth();
  const merchant = merchantSession?.merchant;
  const { success, error: showError } = useToast();

  // Local component state
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [form, setForm] = useState<OutletForm>(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Fetches all outlets assigned to the current active merchant from IndexedDB.
   */
  const loadOutlets = async () => {
    if (!merchant?.id) return;
    const data = await db.outlets
      .where("merchantId")
      .equals(merchant.id)
      .toArray();
    setOutlets(data);
  };

  // Synchronize outlets state when merchant session becomes available
  useEffect(() => {
    loadOutlets();
  }, [merchant?.id]);

  // Render loading feedback if session isn't available yet
  if (!merchant) {
    return (
      <div className="p-8 text-center text-pos-muted">
        Loading merchant session...
      </div>
    );
  }

  // Determine subscription plan allowance for outlets
  const tierLimit = TIER_LIMITS[merchant.tier] || {
    maxOutlets: 1,
    name: "Basic",
  };
  const canAddMore = outlets.length < tierLimit.maxOutlets;

  /**
   * Utility helper to generate a unique random pairing code for POS terminals.
   */
  const generateOutletCode = () => {
    return `OUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  /** Opens the creation modal initialized with default values */
  const openCreate = () => {
    setEditingOutlet(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  /**
   * Opens the edit modal pre-filled with the selected outlet's existing data.
   * @param outlet - The outlet entity selected for editing.
   */
  const openEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    setForm({
      name: outlet.name,
      address: outlet.address,
      phone: outlet.phone ?? "",
      pin: "",
      confirmPin: "",
      taxEnabled: outlet.taxEnabled,
      receiptFooter: outlet.receiptFooter ?? "",
    });
    setShowModal(true);
  };

  /**
   * Copies the outlet device pairing code to the user's system clipboard.
   * @param code - The pairing code string to copy.
   */
  const copyOutletCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success("Device Pair Code copied!");
    setTimeout(() => setCopiedCode(null), 3000);
  };

  /**
   * Handles saving (creating or updating) an outlet in IndexedDB and queuing network sync.
   */
  const handleSave = async () => {
    // Basic form validation checks
    if (!form.name.trim() || !form.address.trim()) {
      showError("Outlet name and address are required.");
      return;
    }
    if (!editingOutlet && (!form.pin || form.pin.length < 4)) {
      showError("Device Setup PIN must be at least 4 digits.");
      return;
    }
    if (form.pin && form.pin !== form.confirmPin) {
      showError("PINs do not match.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      if (editingOutlet) {
        // Prepare patch payload for existing outlet
        const updates: Partial<Outlet> & Record<string, any> = {
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          taxEnabled: form.taxEnabled,
          receiptFooter: form.receiptFooter.trim(),
          updatedAt: now,
          syncStatus: "pending",
        };

        // Hash new PIN if provided during update
        if (form.pin) updates.pin = await hashPin(form.pin);

        await db.outlets.update(editingOutlet.id, updates);
        const updatedOutlet = await db.outlets.get(editingOutlet.id);
        if (updatedOutlet) await syncRecord("outlets", updatedOutlet);
        success("Outlet configuration updated.");
      } else {
        // Construct entity for brand new outlet creation
        const pinHash = await hashPin(form.pin);
        const outletCode = generateOutletCode();
        const newOutletId = generateId();

        const outlet: Outlet & Record<string, any> = {
          id: newOutletId,
          merchantId: merchant.id,
          outletCode,
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          pin: pinHash,
          isActive: true,
          taxEnabled: form.taxEnabled,
          receiptFooter: form.receiptFooter.trim(),
          createdAt: now,
          updatedAt: now,
          syncStatus: "pending",
        };

        await db.outlets.add(outlet as Outlet);
        await syncRecord("outlets", outlet);
        success(`Outlet created! Pair Code: ${outletCode}`);
      }

      setShowModal(false);
      loadOutlets();
    } catch (err: any) {
      showError(err.message || "Failed to save outlet.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggles the active/inactive operational status of an outlet.
   * @param outlet - The target outlet to toggle.
   */
  const toggleActive = async (outlet: Outlet) => {
    const updatedStatus = !outlet.isActive;
    const now = new Date().toISOString();
    await db.outlets.update(outlet.id, {
      isActive: updatedStatus,
      updatedAt: now,
      syncStatus: "pending",
    } as any);
    const updatedOutlet = await db.outlets.get(outlet.id);
    if (updatedOutlet) await syncRecord("outlets", updatedOutlet);
    success(`Outlet ${updatedStatus ? "activated" : "deactivated"}.`);
    loadOutlets();
  };

  /**
   * Deletes an outlet record locally and triggers backend synchronization.
   * @param outlet - The outlet to delete.
   */
  const deleteOutlet = async (outlet: Outlet) => {
    if (!confirm(`Delete "${outlet.name}"? This revokes terminal access.`))
      return;
    await db.outlets.delete(outlet.id);
    await syncRecord("outlets", outlet.id, "delete");
    success("Outlet deleted.");
    loadOutlets();
  };

  return (
    <div>
      {/* Header with plan limits indicator and create trigger action */}
      <Header
        title="Outlets Management"
        subtitle={`${outlets.length} / ${tierLimit.maxOutlets} outlets active on ${tierLimit.name} plan`}
        actions={
          canAddMore ? (
            <Button
              icon={<Plus size={16} />}
              onClick={openCreate}
              className="w-full sm:w-auto"
            >
              New Outlet
            </Button>
          ) : (
            <Button variant="secondary" disabled className="w-full sm:w-auto">
              Plan Limit Reached
            </Button>
          )
        }
      />

      {/* Main Page Layout */}
      <div className="p-4 sm:p-6">
        {outlets.length === 0 ? (
          /* Empty State View */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
            <Store size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">No outlets yet</h3>
            <p className="text-sm text-pos-muted mb-6 max-w-sm">
              Create your first physical branch to pair terminals and assign
              cashiers.
            </p>
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Create First Outlet
            </Button>
          </div>
        ) : (
          /* Outlets Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlets.map((outlet) => {
              const displayCode =
                (outlet as any).outletCode ||
                outlet.id.substring(0, 8).toUpperCase();
              return (
                <div
                  key={outlet.id}
                  className="bg-pos-card border border-pos-border rounded-xl p-4 sm:p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Outlet basic information header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center shrink-0">
                          <Store size={18} className="text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-pos-text truncate">
                            {outlet.name}
                          </p>
                          <p className="text-xs text-pos-muted truncate">
                            {outlet.address}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Badge
                          variant={outlet.isActive ? "success" : "muted"}
                          dot
                        >
                          {outlet.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Device pairing code box */}
                    <div className="bg-pos-bg rounded-lg p-3 flex items-center justify-between border border-pos-border/40">
                      <div>
                        <p className="text-xs text-pos-muted mb-0.5">
                          Device Pair Code
                        </p>
                        <p className="text-sm font-mono font-bold tracking-wider text-blue-400">
                          {displayCode}
                        </p>
                      </div>
                      <button
                        onClick={() => copyOutletCode(displayCode)}
                        className="p-2 rounded-lg bg-pos-card text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors border border-pos-border/60"
                        title="Copy Pair Code"
                      >
                        {copiedCode === displayCode ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>

                    {/* Metadata details */}
                    <p className="text-xs text-pos-muted">
                      Created {formatDateShort(outlet.createdAt)}
                      {outlet.phone && ` · ${outlet.phone}`}
                    </p>
                  </div>

                  {/* Outlet item action bar */}
                  <div className="flex gap-2 pt-2 border-t border-pos-border/40">
                    <Button
                      size="xs"
                      variant="outline"
                      icon={<Pencil size={13} />}
                      onClick={() => openEdit(outlet)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant={outlet.isActive ? "secondary" : "success"}
                      icon={
                        outlet.isActive ? (
                          <ToggleLeft size={13} />
                        ) : (
                          <ToggleRight size={13} />
                        )
                      }
                      onClick={() => toggleActive(outlet)}
                      className="flex-1"
                    >
                      {outlet.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="xs"
                      variant="danger"
                      icon={<Trash2 size={13} />}
                      onClick={() => deleteOutlet(outlet)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal form for creating and editing outlet configurations */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingOutlet ? "Edit Outlet" : "Create New Branch Outlet"}
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
              {editingOutlet ? "Save Changes" : "Create Outlet"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Outlet Name"
            placeholder="Main Branch, Ikeja"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            placeholder="123 Allen Avenue, Ikeja, Lagos"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="08012345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {/* PIN inputs for POS device terminal access authorization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={
                editingOutlet
                  ? "New Setup PIN (optional)"
                  : "Device Setup PIN (4–6 digits)"
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
          <Input
            label="Receipt Footer Message"
            placeholder="Thank you for shopping with us!"
            value={form.receiptFooter}
            onChange={(e) =>
              setForm({ ...form, receiptFooter: e.target.value })
            }
          />
          {/* Outlet specific sales tax configuration */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.taxEnabled}
              onChange={(e) =>
                setForm({ ...form, taxEnabled: e.target.checked })
              }
              className="w-4 h-4 rounded accent-blue-500 shrink-0"
            />
            <span className="text-sm text-pos-text">
              Enable standard sales tax calculation at this outlet
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
