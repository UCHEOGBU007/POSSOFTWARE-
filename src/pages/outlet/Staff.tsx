// import { useEffect, useState } from "react";
// import { Plus, UserCheck, Pencil, Trash2 } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import Modal from "@/components/ui/Modal";
// import Badge from "@/components/ui/Badge";
// import Select from "@/components/ui/Select";
// import { useToast } from "@/components/ui/Toast";
// import { syncRecord } from "@/lib/sync";
// import { formatDateShort } from "@/utils/helpers";
// import type { Staff, StaffRole } from "@/types";

// interface StaffForm {
//   name: string;
//   email: string;
//   phone: string;
//   pin: string;
//   confirmPin: string;
//   role: StaffRole;
// }
// const defaultForm: StaffForm = {
//   name: "",
//   email: "",
//   phone: "",
//   pin: "",
//   confirmPin: "",
//   role: "cashier",
// };

// export default function StaffPage() {
//   const { outletSession, createStaff } = useAuth();
//   const outlet = outletSession!.outlet;
//   const { success, error: showError } = useToast();
//   const [staffList, setStaffList] = useState<Staff[]>([]);
//   const [showModal, setShowModal] = useState(false);
//   const [editing, setEditing] = useState<Staff | null>(null);
//   const [form, setForm] = useState<StaffForm>(defaultForm);
//   const [saving, setSaving] = useState(false);

//   const load = async () => {
//     const data = await db.staff.where("outletId").equals(outlet.id).toArray();
//     setStaffList(data);
//   };

//   useEffect(() => {
//     load();
//   }, [outlet.id]);

//   const openCreate = () => {
//     setEditing(null);
//     setForm(defaultForm);
//     setShowModal(true);
//   };
//   const openEdit = (s: Staff) => {
//     setEditing(s);
//     setForm({
//       name: s.name,
//       email: s.email,
//       phone: s.phone ?? "",
//       pin: "",
//       confirmPin: "",
//       role: s.role,
//     });
//     setShowModal(true);
//   };

//   const handleSave = async () => {
//     if (!form.name || !form.email) {
//       showError("Name and email are required.");
//       return;
//     }
//     if (!form.email.includes("@")) {
//       showError("Please enter a valid email address.");
//       return;
//     }
//     if (!editing && (!form.pin || form.pin.length < 4)) {
//       showError("PIN must be at least 4 digits.");
//       return;
//     }
//     if (form.pin && form.pin !== form.confirmPin) {
//       showError("PINs do not match.");
//       return;
//     }
//     setSaving(true);
//     try {
//       if (editing) {
//         const updates: Partial<Staff> = {
//           name: form.name,
//           phone: form.phone,
//           role: form.role,
//           syncStatus: "pending",
//         };
//         if (form.pin) updates.pin = form.pin;
//         await db.staff.update(editing.id, updates);
//         const updatedStaff = await db.staff.get(editing.id);
//         if (updatedStaff) await syncRecord("staff", updatedStaff);
//         success("Staff member updated.");
//       } else {
//         // Use createStaff from AuthContext — handles Supabase Auth sign-up
//         await createStaff(
//           outlet.id,
//           form.name,
//           form.email,
//           form.phone,
//           form.role,
//           form.pin,
//         );
//         success(
//           `Staff member "${form.name}" added. They log in with email: ${form.email}`,
//         );
//       }
//       setShowModal(false);
//       load();
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const toggleActive = async (s: Staff) => {
//     await db.staff.update(s.id, {
//       isActive: !s.isActive,
//       syncStatus: "pending",
//     });
//     const updatedStaff = await db.staff.get(s.id);
//     if (updatedStaff) await syncRecord("staff", updatedStaff);
//     load();
//   };

//   const deleteStaff = async (s: Staff) => {
//     if (!confirm(`Remove "${s.name}"?`)) return;
//     await db.staff.delete(s.id);
//     await syncRecord("staff", s.id, "delete");
//     success("Staff removed.");
//     load();
//   };

//   return (
//     <div>
//       <Header
//         title="Staff"
//         subtitle={`${staffList.length} members`}
//         actions={
//           <Button icon={<Plus size={16} />} size="sm" onClick={openCreate}>
//             Add Staff
//           </Button>
//         }
//       />
//       <div className="p-6">
//         {staffList.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-24 text-center">
//             <UserCheck size={48} className="text-pos-muted mb-4 opacity-40" />
//             <h3 className="text-pos-text font-semibold mb-2">
//               No staff members
//             </h3>
//             <Button icon={<Plus size={16} />} onClick={openCreate}>
//               Add First Staff Member
//             </Button>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//             {staffList.map((s) => (
//               <div
//                 key={s.id}
//                 className="bg-pos-card border border-pos-border rounded-xl p-5"
//               >
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
//                       {s.name.slice(0, 1).toUpperCase()}
//                     </div>
//                     <div>
//                       <p className="font-semibold text-pos-text">{s.name}</p>
//                       <p className="text-xs text-pos-muted">{s.email}</p>
//                       {s.phone && (
//                         <p className="text-xs text-pos-muted">{s.phone}</p>
//                       )}
//                     </div>
//                   </div>
//                   <Badge variant={s.role === "manager" ? "info" : "muted"}>
//                     {s.role}
//                   </Badge>
//                 </div>
//                 <div className="flex items-center justify-between mb-4">
//                   <Badge variant={s.isActive ? "success" : "muted"} dot>
//                     {s.isActive ? "Active" : "Inactive"}
//                   </Badge>
//                   <p className="text-xs text-pos-muted">
//                     Since {formatDateShort(s.createdAt)}
//                   </p>
//                 </div>
//                 <div className="flex gap-2">
//                   <Button
//                     size="xs"
//                     variant="outline"
//                     icon={<Pencil size={13} />}
//                     onClick={() => openEdit(s)}
//                     className="flex-1"
//                   >
//                     Edit
//                   </Button>
//                   <Button
//                     size="xs"
//                     variant={s.isActive ? "secondary" : "success"}
//                     onClick={() => toggleActive(s)}
//                     className="flex-1"
//                   >
//                     {s.isActive ? "Deactivate" : "Activate"}
//                   </Button>
//                   <Button
//                     size="xs"
//                     variant="danger"
//                     icon={<Trash2 size={13} />}
//                     onClick={() => deleteStaff(s)}
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
//         title={editing ? "Edit Staff" : "Add Staff Member"}
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
//           <Input
//             label="Full Name"
//             placeholder="Chidi Okonkwo"
//             value={form.name}
//             onChange={(e) => setForm({ ...form, name: e.target.value })}
//             required
//           />
//           <Input
//             label="Email"
//             type="email"
//             placeholder="chidi@outlet.com"
//             value={form.email}
//             onChange={(e) =>
//               setForm({ ...form, email: e.target.value.toLowerCase() })
//             }
//             required
//             disabled={!!editing}
//           />
//           {editing && (
//             <p className="text-xs text-pos-muted -mt-2">
//               Email cannot be changed after creation.
//             </p>
//           )}
//           <Input
//             label="Phone (optional)"
//             type="tel"
//             placeholder="08012345678"
//             value={form.phone}
//             onChange={(e) => setForm({ ...form, phone: e.target.value })}
//           />
//           <Select
//             label="Role"
//             value={form.role}
//             onChange={(e) =>
//               setForm({ ...form, role: e.target.value as StaffRole })
//             }
//             options={[
//               { value: "cashier", label: "Cashier" },
//               { value: "manager", label: "Manager" },
//             ]}
//           />
//           <div className="grid grid-cols-2 gap-4">
//             <Input
//               label={editing ? "New PIN (optional)" : "Login PIN (4–6 digits)"}
//               type="password"
//               placeholder="••••"
//               value={form.pin}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   pin: e.target.value.replace(/\D/g, "").slice(0, 6),
//                 })
//               }
//             />
//             <Input
//               label="Confirm PIN"
//               type="password"
//               placeholder="••••"
//               value={form.confirmPin}
//               onChange={(e) =>
//                 setForm({
//                   ...form,
//                   confirmPin: e.target.value.replace(/\D/g, "").slice(0, 6),
//                 })
//               }
//             />
//           </div>
//           {!editing && (
//             <p className="text-xs text-pos-muted bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
//               Staff will log in with their email and this PIN as their password.
//             </p>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import {
  Plus,
  UserCheck,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { syncRecord, syncPendingData } from "@/lib/sync";
import { formatDateShort, hashPin } from "@/utils/helpers";
import type { Staff, StaffRole } from "@/types";

interface StaffForm {
  name: string;
  email: string;
  phone: string;
  pin: string;
  confirmPin: string;
  role: StaffRole;
}

const defaultForm: StaffForm = {
  name: "",
  email: "",
  phone: "",
  pin: "",
  confirmPin: "",
  role: "cashier",
};

export default function StaffPage() {
  const { outletSession, createStaff } = useAuth();
  const outlet = outletSession?.outlet;
  const { success, error: showError } = useToast();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<StaffForm>(defaultForm);
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    if (!outlet?.id) return;
    const data = await db.staff.where("outletId").equals(outlet.id).toArray();
    setStaffList(data);
  };

  useEffect(() => {
    load();
  }, [outlet?.id]);

  if (!outlet) {
    return (
      <div className="p-8 text-center text-pos-muted">
        Loading outlet session...
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncPendingData();
      success("Pending local records synced to Supabase.");
      load();
    } catch (err: any) {
      showError(err.message || "Failed to sync data.");
    } finally {
      setSyncing(false);
    }
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      pin: "",
      confirmPin: "",
      role: s.role,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showError("Name and email are required.");
      return;
    }
    if (!form.email.includes("@")) {
      showError("Please enter a valid email address.");
      return;
    }
    if (!editing && (!form.pin || form.pin.length < 4)) {
      showError("Login PIN must be 4 to 6 digits.");
      return;
    }
    if (form.pin && form.pin !== form.confirmPin) {
      showError("PINs do not match.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updates: Partial<Staff> = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role,
          syncStatus: "pending",
        };

        if (form.pin) {
          updates.pin = await hashPin(form.pin);
        }

        await db.staff.update(editing.id, updates);
        const updatedStaff = await db.staff.get(editing.id);
        if (updatedStaff) {
          const syncResult = await syncRecord("staff", updatedStaff);
          if (!syncResult.ok) {
            throw new Error(
              (syncResult.error as Error)?.message ||
                "Failed to sync updated staff to Supabase.",
            );
          }
        }
        success("Staff record updated successfully.");
      } else {
        await createStaff(
          outlet.id,
          form.name.trim(),
          form.email.trim().toLowerCase(),
          form.phone.trim(),
          form.role,
          form.pin,
        );
        success(`Staff member "${form.name}" created.`);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      showError(err.message || "An error occurred while saving staff.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Staff) => {
    const nextStatus = !s.isActive;
    await db.staff.update(s.id, {
      isActive: nextStatus,
      syncStatus: "pending",
    });
    const updatedStaff = await db.staff.get(s.id);
    if (updatedStaff) {
      const syncResult = await syncRecord("staff", updatedStaff);
      if (!syncResult.ok) {
        throw new Error(
          (syncResult.error as Error)?.message ||
            "Failed to sync staff activation change.",
        );
      }
    }
    load();
    success(`Staff member ${nextStatus ? "activated" : "deactivated"}.`);
  };

  const deleteStaff = async (s: Staff) => {
    if (!confirm(`Remove "${s.name}"? This action cannot be undone.`)) return;
    await db.staff.delete(s.id);
    const syncResult = await syncRecord("staff", s.id, "delete");
    if (!syncResult.ok) {
      throw new Error(
        (syncResult.error as Error)?.message ||
          "Failed to delete staff from Supabase.",
      );
    }
    success("Staff member removed.");
    load();
  };

  return (
    <div>
      <Header
        title="Staff Management"
        subtitle={`${staffList.length} staff member(s) assigned to ${outlet.name}`}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              icon={<RefreshCw size={16} />}
              size="sm"
              variant="secondary"
              onClick={handleSyncNow}
              loading={syncing}
            >
              Sync Now
            </Button>
            <Button icon={<Plus size={16} />} size="sm" onClick={openCreate}>
              Add Staff
            </Button>
          </div>
        }
      />
      <div className="p-6">
        {staffList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <UserCheck size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">
              No staff members
            </h3>
            <p className="text-sm text-pos-muted mb-6">
              Add cashiers and store managers to enable shift access on
              terminals.
            </p>
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Add First Staff Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((s) => (
              <div
                key={s.id}
                className="bg-pos-card border border-pos-border rounded-xl p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                      {s.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-pos-text">{s.name}</p>
                      <p className="text-xs text-pos-muted truncate max-w-44">
                        {s.email}
                      </p>
                      {s.phone && (
                        <p className="text-xs text-pos-muted">{s.phone}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={s.role === "manager" ? "info" : "muted"}>
                    {s.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-pos-border/50">
                  <Badge variant={s.isActive ? "success" : "muted"} dot>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-xs text-pos-muted">
                    Joined {formatDateShort(s.createdAt)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    icon={<Pencil size={13} />}
                    onClick={() => openEdit(s)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant={s.isActive ? "secondary" : "success"}
                    onClick={() => toggleActive(s)}
                    className="flex-1"
                  >
                    {s.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="xs"
                    variant="danger"
                    icon={<Trash2 size={13} />}
                    onClick={() => deleteStaff(s)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Staff Details" : "Add New Staff Member"}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Chidi Okonkwo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="chidi@outlet.com"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value.toLowerCase() })
            }
            required
            disabled={!!editing}
          />
          {editing && (
            <p className="text-xs text-pos-muted -mt-2">
              Email addresses cannot be edited after creation.
            </p>
          )}
          <Input
            label="Phone (optional)"
            type="tel"
            placeholder="08012345678"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Select
            label="Staff Role"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as StaffRole })
            }
            options={[
              { value: "cashier", label: "Cashier (Sales Register)" },
              { value: "manager", label: "Manager (Full Access)" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={
                editing ? "New PIN (optional)" : "Terminal PIN (4–6 digits)"
              }
              type={showPin ? "text" : "password"}
              placeholder="••••"
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
              placeholder="••••"
              value={form.confirmPin}
              onChange={(e) =>
                setForm({
                  ...form,
                  confirmPin: e.target.value.replace(/\D/g, "").slice(0, 6),
                })
              }
            />
          </div>
          {!editing && (
            <p className="text-xs text-pos-muted bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
              💡 Staff tap their name and enter this numeric PIN on the POS
              Numpad to start shift sales.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
