// import { useEffect, useState } from "react";
// import {
//   Plus,
//   Store,
//   Pencil,
//   Trash2,
//   ToggleLeft,
//   ToggleRight,
//   Eye,
//   EyeOff,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import Modal from "@/components/ui/Modal";
// import Badge from "@/components/ui/Badge";
// import { useToast } from "@/components/ui/Toast";
// import { syncRecord } from "@/lib/sync";
// import { generateId, hashPin, formatDateShort } from "@/utils/helpers";
// import type { Outlet } from "@/types";
// import { TIER_LIMITS } from "@/types";

// interface OutletForm {
//   name: string;
//   address: string;
//   phone: string;
//   pin: string;
//   confirmPin: string;
//   taxEnabled: boolean;
//   receiptFooter: string;
// }

// const defaultForm: OutletForm = {
//   name: "",
//   address: "",
//   phone: "",
//   pin: "",
//   confirmPin: "",
//   taxEnabled: true,
//   receiptFooter: "Thank you for your patronage!",
// };

// export default function OutletsPage() {
//   const { merchantSession } = useAuth();
//   const merchant = merchantSession!.merchant;
//   const { success, error: showError } = useToast();
//   const [outlets, setOutlets] = useState<Outlet[]>([]);
//   const [showModal, setShowModal] = useState(false);
//   const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
//   const [form, setForm] = useState<OutletForm>(defaultForm);
//   const [showPin, setShowPin] = useState(false);
//   const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
//   const [saving, setSaving] = useState(false);

//   const loadOutlets = async () => {
//     const data = await db.outlets
//       .where("merchantId")
//       .equals(merchant.id)
//       .toArray();
//     setOutlets(data);
//   };

//   useEffect(() => {
//     loadOutlets();
//   }, [merchant.id]);

//   const tierLimit = TIER_LIMITS[merchant.tier];
//   const canAddMore = outlets.length < tierLimit.maxOutlets;

//   const openCreate = () => {
//     setEditingOutlet(null);
//     setForm(defaultForm);
//     setShowModal(true);
//   };

//   const openEdit = (outlet: Outlet) => {
//     setEditingOutlet(outlet);
//     setForm({
//       name: outlet.name,
//       address: outlet.address,
//       phone: outlet.phone ?? "",
//       pin: "",
//       confirmPin: "",
//       taxEnabled: outlet.taxEnabled,
//       receiptFooter: outlet.receiptFooter ?? "",
//     });
//     setShowModal(true);
//   };

//   const handleSave = async () => {
//     if (!form.name || !form.address) {
//       showError("Outlet name and address are required.");
//       return;
//     }
//     if (!editingOutlet && (!form.pin || form.pin.length < 4)) {
//       showError("PIN must be at least 4 digits.");
//       return;
//     }
//     if (form.pin && form.pin !== form.confirmPin) {
//       showError("PINs do not match.");
//       return;
//     }
//     setSaving(true);
//     try {
//       const now = new Date().toISOString();
//       if (editingOutlet) {
//         const updates: Partial<Outlet> = {
//           name: form.name,
//           address: form.address,
//           phone: form.phone,
//           taxEnabled: form.taxEnabled,
//           receiptFooter: form.receiptFooter,
//           updatedAt: now,
//           syncStatus: "pending",
//         };
//         if (form.pin) updates.pin = await hashPin(form.pin);
//         await db.outlets.update(editingOutlet.id, updates);
//         const updatedOutlet = await db.outlets.get(editingOutlet.id);
//         if (updatedOutlet) await syncRecord("outlets", updatedOutlet);
//         success("Outlet updated successfully.");
//       } else {
//         const pinHash = await hashPin(form.pin);
//         const outlet: Outlet = {
//           id: generateId(),
//           merchantId: merchant.id,
//           name: form.name,
//           address: form.address,
//           phone: form.phone,
//           pin: pinHash,
//           isActive: true,
//           taxEnabled: form.taxEnabled,
//           receiptFooter: form.receiptFooter,
//           createdAt: now,
//           updatedAt: now,
//           syncStatus: "pending",
//         };
//         await db.outlets.add(outlet);
//         await syncRecord("outlets", outlet);
//         success("Outlet created successfully.");
//       }
//       setShowModal(false);
//       loadOutlets();
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const toggleActive = async (outlet: Outlet) => {
//     await db.outlets.update(outlet.id, {
//       isActive: !outlet.isActive,
//       updatedAt: new Date().toISOString(),
//       syncStatus: "pending",
//     });
//     const updatedOutlet = await db.outlets.get(outlet.id);
//     if (updatedOutlet) await syncRecord("outlets", updatedOutlet);
//     success(`Outlet ${outlet.isActive ? "deactivated" : "activated"}.`);
//     loadOutlets();
//   };

//   const deleteOutlet = async (outlet: Outlet) => {
//     if (!confirm(`Delete "${outlet.name}"? This cannot be undone.`)) return;
//     await db.outlets.delete(outlet.id);
//     await syncRecord("outlets", outlet.id, "delete");
//     success("Outlet deleted.");
//     loadOutlets();
//   };

//   return (
//     <div>
//       <Header
//         title="Outlets"
//         subtitle={`${outlets.length} / ${tierLimit.maxOutlets} outlets on ${tierLimit.name} plan`}
//         actions={
//           canAddMore ? (
//             <Button icon={<Plus size={16} />} onClick={openCreate}>
//               New Outlet
//             </Button>
//           ) : (
//             <Button variant="secondary" disabled>
//               Limit reached — Upgrade plan
//             </Button>
//           )
//         }
//       />
//       <div className="p-6">
//         {outlets.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-24 text-center">
//             <Store size={48} className="text-pos-muted mb-4 opacity-40" />
//             <h3 className="text-pos-text font-semibold mb-2">No outlets yet</h3>
//             <p className="text-sm text-pos-muted mb-6">
//               Create your first outlet to start selling.
//             </p>
//             <Button icon={<Plus size={16} />} onClick={openCreate}>
//               Create First Outlet
//             </Button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {outlets.map((outlet) => (
//               <div
//                 key={outlet.id}
//                 className="bg-pos-card border border-pos-border rounded-xl p-5 space-y-4"
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
//                       <Store size={18} className="text-blue-400" />
//                     </div>
//                     <div>
//                       <p className="font-semibold text-pos-text">
//                         {outlet.name}
//                       </p>
//                       <p className="text-xs text-pos-muted truncate max-w-40">
//                         {outlet.address}
//                       </p>
//                     </div>
//                   </div>
//                   <Badge variant={outlet.isActive ? "success" : "muted"} dot>
//                     {outlet.isActive ? "Active" : "Inactive"}
//                   </Badge>
//                 </div>

//                 <div className="bg-pos-bg rounded-lg p-3 flex items-center justify-between">
//                   <div>
//                     <p className="text-xs text-pos-muted mb-0.5">Outlet PIN</p>
//                     <p className="text-sm font-mono text-pos-text">
//                       {visiblePins[outlet.id] ? "(stored as hash)" : "••••••"}
//                     </p>
//                   </div>
//                   <div className="flex gap-1">
//                     <button
//                       onClick={() =>
//                         setVisiblePins((v) => ({
//                           ...v,
//                           [outlet.id]: !v[outlet.id],
//                         }))
//                       }
//                       className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
//                     >
//                       {visiblePins[outlet.id] ? (
//                         <EyeOff size={14} />
//                       ) : (
//                         <Eye size={14} />
//                       )}
//                     </button>
//                   </div>
//                 </div>

//                 <p className="text-xs text-pos-muted">
//                   Created {formatDateShort(outlet.createdAt)}
//                   {outlet.phone && ` · ${outlet.phone}`}
//                 </p>

//                 <div className="flex gap-2 pt-1">
//                   <Button
//                     size="xs"
//                     variant="outline"
//                     icon={<Pencil size={13} />}
//                     onClick={() => openEdit(outlet)}
//                     className="flex-1"
//                   >
//                     Edit
//                   </Button>
//                   <Button
//                     size="xs"
//                     variant={outlet.isActive ? "secondary" : "success"}
//                     icon={
//                       outlet.isActive ? (
//                         <ToggleLeft size={13} />
//                       ) : (
//                         <ToggleRight size={13} />
//                       )
//                     }
//                     onClick={() => toggleActive(outlet)}
//                     className="flex-1"
//                   >
//                     {outlet.isActive ? "Deactivate" : "Activate"}
//                   </Button>
//                   <Button
//                     size="xs"
//                     variant="danger"
//                     icon={<Trash2 size={13} />}
//                     onClick={() => deleteOutlet(outlet)}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <Modal
//         open={showModal}
//         onClose={() => setShowModal(false)}
//         title={editingOutlet ? "Edit Outlet" : "Create New Outlet"}
//         size="md"
//         footer={
//           <div className="flex gap-3 justify-end">
//             <Button variant="outline" onClick={() => setShowModal(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleSave} loading={saving}>
//               {editingOutlet ? "Save Changes" : "Create Outlet"}
//             </Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <Input
//             label="Outlet Name"
//             placeholder="Main Branch, Ikeja"
//             value={form.name}
//             onChange={(e) => setForm({ ...form, name: e.target.value })}
//             required
//           />
//           <Input
//             label="Address"
//             placeholder="123 Allen Avenue, Ikeja, Lagos"
//             value={form.address}
//             onChange={(e) => setForm({ ...form, address: e.target.value })}
//             required
//           />
//           <Input
//             label="Phone (optional)"
//             type="tel"
//             placeholder="08012345678"
//             value={form.phone}
//             onChange={(e) => setForm({ ...form, phone: e.target.value })}
//           />
//           <div className="grid grid-cols-2 gap-4">
//             <Input
//               label={
//                 editingOutlet
//                   ? "New PIN (leave blank to keep)"
//                   : "Outlet PIN (4–6 digits)"
//               }
//               type={showPin ? "text" : "password"}
//               placeholder="e.g. 1234"
//               value={form.pin}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   pin: e.target.value.replace(/\D/g, "").slice(0, 6),
//                 })
//               }
//               rightIcon={
//                 <button
//                   type="button"
//                   onClick={() => setShowPin(!showPin)}
//                   className="pointer-events-auto cursor-pointer"
//                 >
//                   {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
//                 </button>
//               }
//             />
//             <Input
//               label="Confirm PIN"
//               type={showPin ? "text" : "password"}
//               placeholder="Repeat PIN"
//               value={form.confirmPin}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   confirmPin: e.target.value.replace(/\D/g, "").slice(0, 6),
//                 })
//               }
//             />
//           </div>
//           <Input
//             label="Receipt Footer Message"
//             placeholder="Thank you for your patronage!"
//             value={form.receiptFooter}
//             onChange={(e) =>
//               setForm({ ...form, receiptFooter: e.target.value })
//             }
//           />
//           <label className="flex items-center gap-3 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={form.taxEnabled}
//               onChange={(e) =>
//                 setForm({ ...form, taxEnabled: e.target.checked })
//               }
//               className="w-4 h-4 rounded accent-blue-500"
//             />
//             <span className="text-sm text-pos-text">
//               Enable tax on this outlet
//             </span>
//           </label>
//         </div>
//       </Modal>
//     </div>
//   );
// }

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

interface OutletForm {
  name: string;
  address: string;
  phone: string;
  pin: string;
  confirmPin: string;
  taxEnabled: boolean;
  receiptFooter: string;
}

const defaultForm: OutletForm = {
  name: "",
  address: "",
  phone: "",
  pin: "",
  confirmPin: "",
  taxEnabled: true,
  receiptFooter: "Thank you for your patronage!",
};

export default function OutletsPage() {
  const { merchantSession } = useAuth();
  const merchant = merchantSession?.merchant;
  const { success, error: showError } = useToast();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [form, setForm] = useState<OutletForm>(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadOutlets = async () => {
    if (!merchant?.id) return;
    const data = await db.outlets
      .where("merchantId")
      .equals(merchant.id)
      .toArray();
    setOutlets(data);
  };

  useEffect(() => {
    loadOutlets();
  }, [merchant?.id]);

  if (!merchant) {
    return (
      <div className="p-8 text-center text-pos-muted">
        Loading merchant session...
      </div>
    );
  }

  const tierLimit = TIER_LIMITS[merchant.tier] || {
    maxOutlets: 1,
    name: "Basic",
  };
  const canAddMore = outlets.length < tierLimit.maxOutlets;

  const generateOutletCode = () => {
    return `OUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const openCreate = () => {
    setEditingOutlet(null);
    setForm(defaultForm);
    setShowModal(true);
  };

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

  const copyOutletCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success("Device Pair Code copied!");
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleSave = async () => {
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
        const updates: Partial<Outlet> & Record<string, any> = {
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          taxEnabled: form.taxEnabled,
          receiptFooter: form.receiptFooter.trim(),
          updatedAt: now,
          syncStatus: "pending",
        };
        if (form.pin) updates.pin = await hashPin(form.pin);
        await db.outlets.update(editingOutlet.id, updates);
        const updatedOutlet = await db.outlets.get(editingOutlet.id);
        if (updatedOutlet) await syncRecord("outlets", updatedOutlet);
        success("Outlet configuration updated.");
      } else {
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

        // 1. Save to local Dexie IndexedDB
        await db.outlets.add(outlet as Outlet);

        // 2. Queue for Supabase Cloud Sync
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
      <Header
        title="Outlets Management"
        subtitle={`${outlets.length} / ${tierLimit.maxOutlets} outlets active on ${tierLimit.name} plan`}
        actions={
          canAddMore ? (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              New Outlet
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Plan Limit Reached
            </Button>
          )
        }
      />
      <div className="p-6">
        {outlets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Store size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">No outlets yet</h3>
            <p className="text-sm text-pos-muted mb-6">
              Create your first physical branch to pair terminals and assign
              cashiers.
            </p>
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Create First Outlet
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlets.map((outlet) => {
              const displayCode =
                (outlet as any).outletCode ||
                outlet.id.substring(0, 8).toUpperCase();
              return (
                <div
                  key={outlet.id}
                  className="bg-pos-card border border-pos-border rounded-xl p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
                        <Store size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-pos-text">
                          {outlet.name}
                        </p>
                        <p className="text-xs text-pos-muted truncate max-w-40">
                          {outlet.address}
                        </p>
                      </div>
                    </div>
                    <Badge variant={outlet.isActive ? "success" : "muted"} dot>
                      {outlet.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

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

                  <p className="text-xs text-pos-muted">
                    Created {formatDateShort(outlet.createdAt)}
                    {outlet.phone && ` · ${outlet.phone}`}
                  </p>

                  <div className="flex gap-2 pt-1">
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

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingOutlet ? "Edit Outlet" : "Create New Branch Outlet"}
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
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
          <div className="grid grid-cols-2 gap-4">
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.taxEnabled}
              onChange={(e) =>
                setForm({ ...form, taxEnabled: e.target.checked })
              }
              className="w-4 h-4 rounded accent-blue-500"
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
