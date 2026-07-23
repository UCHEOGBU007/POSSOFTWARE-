// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { ShoppingBag, Store, LogIn } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import { useToast } from "@/components/ui/Toast";
// import { useTheme } from "@/contexts/ThemeContext";

// export default function OutletLogin() {
//   const { loginStaff } = useAuth();
//   const { error: showError } = useToast();
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!email || !password) {
//       showError("Email and password are required.");
//       return;
//     }
//     setLoading(true);
//     try {
//       await loginStaff(email, password);
//       navigate("/outlet/dashboard");
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-pos-bg flex items-center justify-center p-6">
//       <div className="w-full max-w-sm">
//         <div className="flex flex-col items-center mb-8">
//           <div className="flex w-full justify-end mb-4">
//             <button
//               type="button"
//               onClick={toggleTheme}
//               className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-2 text-sm text-pos-muted transition-colors hover:text-pos-text"
//             >
//               {theme === "dark" ? <span>☀️</span> : <span>🌙</span>}
//               {theme === "dark" ? "Light" : "Dark"}
//             </button>
//           </div>
//           <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
//             <Store size={28} className="text-blue-400" />
//           </div>
//           <h1 className="text-xl font-bold text-pos-text">Staff Login</h1>
//           <p className="text-sm text-pos-muted text-center mt-1">
//             Sign in with your staff email and password
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <Input
//             label="Email"
//             type="email"
//             placeholder="staff@outlet.com"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             autoComplete="email"
//             required
//           />
//           <Input
//             label="Password (PIN)"
//             type="password"
//             placeholder="Your PIN"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             autoComplete="current-password"
//             required
//           />
//           <Button
//             type="submit"
//             className="w-full"
//             size="lg"
//             loading={loading}
//             icon={<LogIn size={18} />}
//           >
//             Sign In
//           </Button>
//         </form>

//         <div className="mt-6 text-center">
//           <Link
//             to="/login"
//             className="text-sm text-pos-muted hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
//           >
//             <ShoppingBag size={14} />
//             Merchant Admin Login
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Store,
  LogIn,
  Lock,
  Delete,
  RefreshCw,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";
import { hashPin } from "@/utils/helpers";
import type { Outlet, Staff } from "@/types";

export default function OutletLogin() {
  const { loginStaff } = useAuth();
  const { error: showError, success } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [pairedOutlet, setPairedOutlet] = useState<Outlet | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncingStaff, setSyncingStaff] = useState(false);

  const [outletCode, setOutletCode] = useState("");
  const [setupPin, setSetupPin] = useState("");

  useEffect(() => {
    const boundOutletId = localStorage.getItem("pos_terminal_outlet_id");
    if (boundOutletId) {
      loadTerminalData(boundOutletId);
    }
  }, []);

  // Robust Cloud Fetcher for Staff
  const fetchCloudStaffForOutlet = async (targetOutletId: string) => {
    try {
      console.log("[Terminal] Fetching staff for outlet ID:", targetOutletId);

      // Query 1: Query by snake_case outlet_id
      let { data: cloudStaff, error: errSnake } = await supabase
        .from("staff")
        .select("*")
        .eq("outlet_id", targetOutletId);

      if (errSnake) {
        console.warn(
          "[Terminal] Staff query (outlet_id) failed:",
          errSnake.message,
        );
      }

      // Query 2: Fallback to camelCase outletId if no staff found or column differs
      if (!cloudStaff || cloudStaff.length === 0) {
        const { data: dataCamel, error: errCamel } = await supabase
          .from("staff")
          .select("*")
          .eq("outletId", targetOutletId);

        if (errCamel) {
          console.warn(
            "[Terminal] Staff query (outletId) failed:",
            errCamel.message,
          );
        } else if (dataCamel && dataCamel.length > 0) {
          cloudStaff = dataCamel;
        }
      }

      // Query 3: General fallback - fetch all staff if RLS allows and match manually
      if (!cloudStaff || cloudStaff.length === 0) {
        const { data: allStaff, error: allErr } = await supabase
          .from("staff")
          .select("*");

        if (allErr) {
          console.error("[Terminal] Fetch all staff error:", allErr.message);
        } else if (allStaff) {
          cloudStaff = allStaff.filter(
            (s: any) =>
              s.outlet_id === targetOutletId ||
              s.outletId === targetOutletId ||
              String(s.outlet_id).toLowerCase() ===
                String(targetOutletId).toLowerCase(),
          );
        }
      }

      console.log("[Terminal] Cloud staff retrieved:", cloudStaff);

      if (cloudStaff && cloudStaff.length > 0) {
        const localStaffArray = cloudStaff.map((s: any) => ({
          id: s.id,
          outletId: s.outlet_id || s.outletId || targetOutletId,
          name: s.name,
          email: s.email,
          phone: s.phone ?? "",
          pin: s.pin,
          role: s.role,
          isActive: s.is_active ?? s.isActive ?? true,
          createdAt: s.created_at || s.createdAt || new Date().toISOString(),
          syncStatus: "synced",
        }));

        // Write directly to Dexie IndexedDB
        await db.staff.bulkPut(localStaffArray as any);
        return localStaffArray;
      }
    } catch (err) {
      console.error("[Terminal] Unexpected error fetching cloud staff:", err);
    }
    return [];
  };

  const loadTerminalData = async (outletId: string) => {
    try {
      const outlet = await db.outlets.get(outletId);
      if (outlet && outlet.isActive) {
        setPairedOutlet(outlet);

        // Check local Dexie first
        let localStaff = await db.staff
          .where("outletId")
          .equals(outletId)
          .toArray();

        // If local Dexie has no staff, pull from cloud immediately
        if (localStaff.length === 0) {
          await fetchCloudStaffForOutlet(outletId);
          localStaff = await db.staff
            .where("outletId")
            .equals(outletId)
            .toArray();
        }

        setStaffList(localStaff.filter((s) => s.isActive));
      } else {
        localStorage.removeItem("pos_terminal_outlet_id");
        setPairedOutlet(null);
      }
    } catch (err) {
      localStorage.removeItem("pos_terminal_outlet_id");
      setPairedOutlet(null);
    }
  };

  const handleSyncStaffManual = async () => {
    if (!pairedOutlet) return;
    setSyncingStaff(true);
    try {
      await fetchCloudStaffForOutlet(pairedOutlet.id);

      // Re-read from local Dexie
      const allStaff = await db.staff.toArray();
      const matched = allStaff.filter(
        (s) =>
          s.outletId === pairedOutlet.id ||
          String(s.outletId).toLowerCase() ===
            String(pairedOutlet.id).toLowerCase(),
      );

      const activeList = matched.filter((s) => s.isActive);
      setStaffList(activeList);

      if (activeList.length > 0) {
        success(`Found ${activeList.length} staff member(s)!`);
      } else {
        showError(
          "No matching active staff found in Supabase for this outlet.",
        );
      }
    } catch (err: any) {
      showError(err.message || "Failed to sync staff.");
    } finally {
      setSyncingStaff(false);
    }
  };

  // 🌐 SEAMLESS REMOTE PAIRING (Dexie + Supabase Hybrid)
  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletCode.trim() || !setupPin) {
      showError("Device Pair Code and Setup PIN are required.");
      return;
    }
    setLoading(true);
    try {
      const hashedSetupPin = await hashPin(setupPin);
      const codeUpper = outletCode.trim().toUpperCase();

      // 1. Try local Dexie IndexedDB
      const allOutlets = await db.outlets.toArray();
      let outlet: Outlet | undefined = allOutlets.find(
        (o) =>
          ((o as any).outletCode &&
            (o as any).outletCode.toUpperCase() === codeUpper) ||
          o.id.toUpperCase().startsWith(codeUpper),
      );

      // 2. 🌐 CLOUD FETCH: Query Supabase if not found locally
      if (!outlet) {
        let cloudOutlet: any = null;

        const { data: codeData, error: codeErr } = await supabase
          .from("outlets")
          .select("*")
          .or(`outlet_code.eq.${codeUpper},outletCode.eq.${codeUpper}`)
          .maybeSingle();

        if (codeErr) console.error("Supabase pair query error:", codeErr);
        cloudOutlet = codeData;

        if (!cloudOutlet) {
          const { data: allCloudOutlets } = await supabase
            .from("outlets")
            .select("*");

          if (allCloudOutlets) {
            cloudOutlet = allCloudOutlets.find(
              (o: any) =>
                (o.outletCode && o.outletCode.toUpperCase() === codeUpper) ||
                (o.outlet_code && o.outlet_code.toUpperCase() === codeUpper) ||
                (o.id && o.id.toUpperCase().startsWith(codeUpper)),
            );
          }
        }

        if (!cloudOutlet) {
          throw new Error("Invalid Pair Code or terminal not found in cloud.");
        }

        const newOutlet: Outlet & Record<string, any> = {
          id: cloudOutlet.id,
          merchantId: cloudOutlet.merchantId || cloudOutlet.merchant_id,
          outletCode:
            cloudOutlet.outletCode || cloudOutlet.outlet_code || codeUpper,
          name: cloudOutlet.name,
          address: cloudOutlet.address,
          phone: cloudOutlet.phone ?? "",
          pin: cloudOutlet.pin,
          isActive: cloudOutlet.isActive ?? cloudOutlet.is_active ?? true,
          taxEnabled: cloudOutlet.taxEnabled ?? cloudOutlet.tax_enabled ?? true,
          receiptFooter:
            cloudOutlet.receiptFooter ?? cloudOutlet.receipt_footer ?? "",
          createdAt: cloudOutlet.createdAt || cloudOutlet.created_at,
          updatedAt: cloudOutlet.updatedAt || cloudOutlet.updated_at,
          syncStatus: "synced",
        };

        outlet = newOutlet;

        await db.outlets.put(outlet);
        await fetchCloudStaffForOutlet(outlet.id);
      }

      if (!outlet) {
        throw new Error("Terminal outlet could not be resolved.");
      }

      const isPinValid =
        outlet.pin === setupPin || outlet.pin === hashedSetupPin;

      if (!isPinValid) {
        throw new Error("Invalid Setup PIN.");
      }

      if (!outlet.isActive) {
        throw new Error("This outlet is currently deactivated.");
      }

      localStorage.setItem("pos_terminal_outlet_id", outlet.id);
      success(`Terminal paired with ${outlet.name}!`);
      await loadTerminalData(outlet.id);
    } catch (err: any) {
      showError(err.message || "Failed to pair terminal device.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumpadKey = (val: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleStaffLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedStaff) {
      showError("Please select a cashier profile.");
      return;
    }
    if (pin.length < 4) {
      showError("PIN must be 4 to 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await loginStaff(selectedStaff.email, pin);
      navigate("/outlet/dashboard");
    } catch (err: any) {
      showError(err.message || "Invalid Staff PIN.");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const unbindTerminal = () => {
    if (confirm("Unbind this terminal from this outlet location?")) {
      localStorage.removeItem("pos_terminal_outlet_id");
      setPairedOutlet(null);
      setSelectedStaff(null);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg flex flex-col justify-between p-6 select-none">
      <div className="flex w-full justify-between items-center">
        <div className="flex items-center gap-2">
          <Store className="text-blue-500" size={24} />
          <span className="font-bold text-pos-text text-lg">
            National POS Terminal
          </span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-1.5 text-xs text-pos-muted hover:text-pos-text transition-colors"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-6">
        {!pairedOutlet ? (
          <div className="bg-pos-card border border-pos-border rounded-2xl p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                <Smartphone size={28} className="text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-pos-text">
                Pair Terminal Device
              </h1>
              <p className="text-xs text-pos-muted mt-1">
                Enter your Merchant Outlet Pair Code and Setup PIN
              </p>
            </div>

            <form onSubmit={handlePairDevice} className="space-y-4">
              <Input
                label="Outlet Pair Code"
                placeholder="e.g. OUT-9A82X1"
                value={outletCode}
                onChange={(e) => setOutletCode(e.target.value.toUpperCase())}
                required
              />
              <Input
                label="Outlet Setup PIN"
                type="password"
                placeholder="••••"
                maxLength={6}
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
                required
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
                icon={<LogIn size={18} />}
              >
                Pair & Register Hardware
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-pos-card border border-pos-border rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-pos-border pb-4">
              <div>
                <h2 className="font-bold text-pos-text text-lg">
                  {pairedOutlet.name}
                </h2>
                <p className="text-xs text-pos-muted">{pairedOutlet.address}</p>
              </div>
              <button
                onClick={unbindTerminal}
                className="text-xs text-pos-muted hover:text-rose-400 transition-colors flex items-center gap-1"
                title="Unbind Device"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-pos-muted">
                  Select Cashier / Manager
                </label>
                <button
                  type="button"
                  onClick={handleSyncStaffManual}
                  disabled={syncingStaff}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw
                    size={12}
                    className={syncingStaff ? "animate-spin" : ""}
                  />
                  Sync Staff
                </button>
              </div>

              {staffList.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                    No active staff found for this outlet. Click "Sync Staff" or
                    verify staff outlet assignment in Merchant Admin.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleSyncStaffManual}
                    loading={syncingStaff}
                    icon={<UserCheck size={14} />}
                  >
                    Sync Staff From Cloud
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {staffList.map((staff) => {
                    const isSelected = selectedStaff?.id === staff.id;
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(staff);
                          setPin("");
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10 text-blue-400 font-semibold"
                            : "border-pos-border bg-pos-bg/50 text-pos-text hover:bg-pos-hover"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs truncate">{staff.name}</p>
                          <p className="text-[10px] text-pos-muted capitalize">
                            {staff.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <div className="inline-flex gap-3 justify-center mb-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? "bg-blue-500 border-blue-500 scale-110"
                        : "border-pos-border bg-pos-bg"
                    }`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadKey(num)}
                    disabled={!selectedStaff || loading}
                    className="h-12 rounded-xl bg-pos-bg hover:bg-pos-hover text-pos-text text-lg font-bold border border-pos-border/60 transition-colors active:scale-95 disabled:opacity-40"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={!selectedStaff || loading}
                  className="h-12 rounded-xl bg-pos-bg hover:bg-rose-500/20 hover:text-rose-400 text-pos-text flex items-center justify-center border border-pos-border/60 transition-colors disabled:opacity-40"
                >
                  <Delete size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadKey("0")}
                  disabled={!selectedStaff || loading}
                  className="h-12 rounded-xl bg-pos-bg hover:bg-pos-hover text-pos-text text-lg font-bold border border-pos-border/60 transition-colors active:scale-95 disabled:opacity-40"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleStaffLogin()}
                  disabled={!selectedStaff || pin.length < 4 || loading}
                  className="h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Lock size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs text-pos-muted hover:text-blue-400 transition-colors inline-flex items-center gap-1.5"
          >
            <Lock size={12} /> Merchant Admin Login
          </Link>
        </div>
      </div>

      <div className="text-center text-[11px] text-pos-muted">
        Enterprise POS Framework &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}
