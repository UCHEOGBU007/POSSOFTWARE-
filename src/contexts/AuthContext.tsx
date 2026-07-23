// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   type ReactNode,
// } from "react";
// import { db } from "../db/database";
// import { supabase, getSupabaseConfigStatus } from "../lib/supabase";
// import type { Merchant, Outlet, Staff } from "../types";
// import { syncPendingData, syncRecord } from "../lib/sync";
// import { generateId } from "../utils/helpers";

// interface MerchantSession {
//   merchant: Merchant;
// }

// interface OutletSession {
//   outlet: Outlet;
//   staff: Staff | null;
// }

// interface AuthContextType {
//   merchantSession: MerchantSession | null;
//   outletSession: OutletSession | null;
//   loginMerchant: (email: string, password: string) => Promise<void>;
//   logoutMerchant: () => void;
//   loginStaff: (email: string, password: string) => Promise<OutletSession>;
//   logoutOutlet: () => void;
//   registerMerchant: (data: RegisterMerchantData) => Promise<void>;
//   createStaff: (
//     outletId: string,
//     name: string,
//     email: string,
//     phone: string,
//     role: Staff["role"],
//     pin: string,
//   ) => Promise<Staff>;
//   updateMerchant: (data: Partial<Merchant>) => Promise<void>;
//   isLoading: boolean;
// }

// interface RegisterMerchantData {
//   businessName: string;
//   ownerName: string;
//   email: string;
//   phone: string;
//   password: string;
//   tier: Merchant["tier"];
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// const MERCHANT_SESSION_KEY = "pos_merchant_session";
// const OUTLET_SESSION_KEY = "pos_outlet_session";

// const { isConfigured } = getSupabaseConfigStatus();

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [merchantSession, setMerchantSession] =
//     useState<MerchantSession | null>(null);
//   const [outletSession, setOutletSession] = useState<OutletSession | null>(
//     null,
//   );
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const restoreSessions = async () => {
//       try {
//         // Try Supabase session first (staff or merchant)
//         if (isConfigured) {
//           const {
//             data: { session },
//           } = await supabase.auth.getSession();
//           if (session?.user) {
//             const uid = session.user.id;

//             // Check if this user is a merchant
//             const merchant = await db.merchants.where("id").equals(uid).first();
//             if (merchant) {
//               setMerchantSession({ merchant });
//               sessionStorage.setItem(
//                 MERCHANT_SESSION_KEY,
//                 JSON.stringify({ merchantId: merchant.id }),
//               );
//               setIsLoading(false);
//               await syncPendingData();
//               return;
//             }

//             // Check if this user is a staff member
//             const staff = await db.staff
//               .where("id")
//               .equals(uid)
//               .and((s) => s.isActive)
//               .first();
//             if (staff) {
//               const outlet = await db.outlets.get(staff.outletId);
//               if (outlet && outlet.isActive) {
//                 setOutletSession({ outlet, staff });
//                 sessionStorage.setItem(
//                   OUTLET_SESSION_KEY,
//                   JSON.stringify({
//                     outletId: outlet.id,
//                     staffId: staff.id,
//                   }),
//                 );
//               }
//               setIsLoading(false);
//               await syncPendingData();
//               return;
//             }
//           }
//         }

//         // Fallback: restore from sessionStorage
//         const mRaw = sessionStorage.getItem(MERCHANT_SESSION_KEY);
//         if (mRaw) {
//           const { merchantId } = JSON.parse(mRaw);
//           const merchant = await db.merchants.get(merchantId);
//           if (merchant) {
//             setMerchantSession({ merchant });
//             if (isConfigured) {
//               // Try to restore Supabase session silently
//               const {
//                 data: { session },
//               } = await supabase.auth.getSession();
//               if (!session?.user) {
//                 // Try to sign in with stored credentials
//                 try {
//                   await supabase.auth.signInWithPassword({
//                     email: merchant.email,
//                     password: "",
//                   });
//                 } catch {
//                   // Silently fail — sessionStorage is sufficient fallback
//                 }
//               }
//             }
//           }
//         }

//         const oRaw = sessionStorage.getItem(OUTLET_SESSION_KEY);
//         if (oRaw) {
//           const { outletId, staffId } = JSON.parse(oRaw);
//           const outlet = await db.outlets.get(outletId);
//           const staff = staffId
//             ? ((await db.staff.get(staffId)) ?? null)
//             : null;
//           if (outlet && outlet.isActive) {
//             setOutletSession({ outlet, staff });
//           }
//         }
//       } finally {
//         await syncPendingData();
//         setIsLoading(false);
//       }
//     };
//     restoreSessions();
//   }, []);

//   // ============================================================
//   // MERCHANT AUTH
//   // ============================================================

//   const loginMerchant = async (email: string, password: string) => {
//     const normalizedEmail = email.toLowerCase();

//     if (!isConfigured) {
//       // No Supabase configured — fallback to local-only
//       const merchant = await db.merchants
//         .where("email")
//         .equals(normalizedEmail)
//         .first();
//       if (!merchant) throw new Error("No account found with this email.");
//       setMerchantSession({ merchant });
//       sessionStorage.setItem(
//         MERCHANT_SESSION_KEY,
//         JSON.stringify({ merchantId: merchant.id }),
//       );
//       return;
//     }

//     // Sign in via Supabase Auth
//     const { data: authData, error: authError } =
//       await supabase.auth.signInWithPassword({
//         email: normalizedEmail,
//         password,
//       });

//     if (authError || !authData.user) {
//       throw new Error(authError?.message || "Invalid email or password.");
//     }

//     // Load merchant record from Supabase (or local fallback)
//     let merchant: Merchant | undefined;
//     if (isConfigured) {
//       const { data: cloudMerchant } = await supabase
//         .from("merchants")
//         .select("*")
//         .eq("id", authData.user.id)
//         .single();

//       if (cloudMerchant) {
//         merchant = mapSupabaseMerchant(cloudMerchant);
//         await db.merchants.put(merchant);
//       }
//     }

//     if (!merchant) {
//       merchant = await db.merchants.get(authData.user.id);
//     }

//     if (!merchant) throw new Error("Account not found. Please register first.");

//     setMerchantSession({ merchant });
//     sessionStorage.setItem(
//       MERCHANT_SESSION_KEY,
//       JSON.stringify({ merchantId: merchant.id }),
//     );
//   };

//   const logoutMerchant = async () => {
//     if (isConfigured) {
//       await supabase.auth.signOut().catch(() => {});
//     }
//     setMerchantSession(null);
//     sessionStorage.removeItem(MERCHANT_SESSION_KEY);
//   };

//   const registerMerchant = async (data: RegisterMerchantData) => {
//     const normalizedEmail = data.email.toLowerCase();

//     // Check local duplicates
//     const existing = await db.merchants
//       .where("email")
//       .equals(normalizedEmail)
//       .count();
//     if (existing > 0)
//       throw new Error("An account with this email already exists.");

//     const now = new Date().toISOString();
//     const expiry = new Date(
//       Date.now() + 30 * 24 * 60 * 60 * 1000,
//     ).toISOString();

//     let merchantId = generateId();
//     let passwordHash = ""; // We rely on Supabase Auth for password verification

//     if (isConfigured) {
//       const { data: authData, error: authError } = await supabase.auth.signUp({
//         email: normalizedEmail,
//         password: data.password,
//       });

//       if (authError) {
//         // If Supabase Auth fails, fallback to local-only
//         console.warn(
//           "Supabase sign-up failed, continuing with local registration",
//           authError,
//         );
//         const { hashPassword } = await import("../utils/helpers");
//         passwordHash = await hashPassword(data.password);
//       } else if (authData.user) {
//         merchantId = authData.user.id;
//       }
//     } else {
//       const { hashPassword } = await import("../utils/helpers");
//       passwordHash = await hashPassword(data.password);
//     }

//     const merchant: Merchant = {
//       id: merchantId,
//       businessName: data.businessName,
//       ownerName: data.ownerName,
//       email: normalizedEmail,
//       phone: data.phone,
//       passwordHash,
//       tier: data.tier,
//       subscriptionStatus: "trial",
//       subscriptionExpiry: expiry,
//       currency: "NGN",
//       taxRate: 7.5,
//       createdAt: now,
//       updatedAt: now,
//       syncStatus: "pending",
//     };

//     await db.merchants.add(merchant);
//     await syncRecord("merchants", merchant);

//     setMerchantSession({ merchant });
//     sessionStorage.setItem(
//       MERCHANT_SESSION_KEY,
//       JSON.stringify({ merchantId: merchant.id }),
//     );
//   };

//   const updateMerchant = async (data: Partial<Merchant>) => {
//     if (!merchantSession) return;
//     const updated: Merchant = {
//       ...merchantSession.merchant,
//       ...data,
//       updatedAt: new Date().toISOString(),
//       syncStatus: "pending",
//     };
//     await db.merchants.put(updated);
//     await syncRecord("merchants", updated);
//     setMerchantSession({ merchant: updated });
//     sessionStorage.setItem(
//       MERCHANT_SESSION_KEY,
//       JSON.stringify({ merchantId: updated.id }),
//     );
//   };

//   // ============================================================
//   // STAFF AUTH (Supabase Auth)
//   // ============================================================

//   const createStaff = async (
//     outletId: string,
//     name: string,
//     email: string,
//     phone: string,
//     role: Staff["role"],
//     pin: string,
//   ): Promise<Staff> => {
//     const normalizedEmail = email.toLowerCase();
//     const now = new Date().toISOString();

//     let staffId = generateId();
//     let staffPin = pin;

//     if (isConfigured) {
//       // Sign the staff member up in Supabase Auth (they'll use email+password)
//       const defaultPassword = pin || generateId().slice(0, 8);
//       console.log("Creating staff account with password:", defaultPassword);

//       const { data: authData, error: authError } = await supabase.auth.signUp({
//         email: normalizedEmail,
//         password: defaultPassword,
//       });

//       if (authError) {
//         console.warn("Supabase staff sign-up failed", authError);
//         // Fall through to local-only
//       } else if (authData.user) {
//         staffId = authData.user.id;
//       }
//     }

//     const staff: Staff = {
//       id: staffId,
//       outletId,
//       name,
//       email: normalizedEmail,
//       phone,
//       pin: staffPin,
//       role,
//       isActive: true,
//       createdAt: now,
//       syncStatus: "pending",
//     };

//     await db.staff.add(staff);
//     await syncRecord("staff", staff);
//     return staff;
//   };

//   const loginStaff = async (
//     email: string,
//     password: string,
//   ): Promise<OutletSession> => {
//     const normalizedEmail = email.toLowerCase();

//     if (!isConfigured) {
//       // Local-only: find staff by email + PIN (stored as pin)
//       const staff = await db.staff
//         .where("email")
//         .equals(normalizedEmail)
//         .and((s) => s.isActive)
//         .first();
//       if (!staff) throw new Error("Staff account not found.");
//       const { hashPin } = await import("../utils/helpers");
//       if (staff.pin) {
//         const pinHash = await hashPin(password);
//         if (staff.pin !== pinHash) {
//           throw new Error("Invalid password.");
//         }
//       }
//       const outlet = await db.outlets.get(staff.outletId);
//       if (!outlet || !outlet.isActive) {
//         throw new Error("This outlet is not currently active.");
//       }
//       const session: OutletSession = { outlet, staff };
//       setOutletSession(session);
//       sessionStorage.setItem(
//         OUTLET_SESSION_KEY,
//         JSON.stringify({ outletId: outlet.id, staffId: staff.id }),
//       );
//       return session;
//     }

//     // Sign in via Supabase Auth
//     const { data: authData, error: authError } =
//       await supabase.auth.signInWithPassword({
//         email: normalizedEmail,
//         password,
//       });

//     if (authError || !authData.user) {
//       throw new Error(authError?.message || "Invalid email or password.");
//     }

//     let staff = await db.staff.where("email").equals(normalizedEmail).first();

//     if (!staff) {
//       // Staff record may exist in Supabase but not locally — pull it
//       const { data: cloudStaff } = await supabase
//         .from("staff")
//         .select("*")
//         .eq("email", normalizedEmail)
//         .single();

//       if (cloudStaff) {
//         staff = mapSupabaseStaff(cloudStaff);
//         await db.staff.put(staff);
//       }
//     }

//     if (!staff) throw new Error("Staff account not found.");
//     if (!staff.isActive)
//       throw new Error("This staff account has been deactivated.");

//     const outlet = await db.outlets.get(staff.outletId);
//     if (!outlet || !outlet.isActive) {
//       throw new Error("This outlet is not currently active.");
//     }

//     const session: OutletSession = { outlet, staff };
//     setOutletSession(session);
//     sessionStorage.setItem(
//       OUTLET_SESSION_KEY,
//       JSON.stringify({ outletId: outlet.id, staffId: staff.id }),
//     );

//     await syncPendingData();
//     return session;
//   };

//   const logoutOutlet = async () => {
//     if (isConfigured) {
//       await supabase.auth.signOut().catch(() => {});
//     }
//     setOutletSession(null);
//     sessionStorage.removeItem(OUTLET_SESSION_KEY);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         merchantSession,
//         outletSession,
//         loginMerchant,
//         logoutMerchant,
//         loginStaff,
//         logoutOutlet,
//         registerMerchant,
//         createStaff,
//         updateMerchant,
//         isLoading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

// // ============================================================
// // Supabase row → our type mappers
// // ============================================================

// function mapSupabaseMerchant(row: Record<string, any>): Merchant {
//   return {
//     id: row.id,
//     businessName: row.business_name,
//     ownerName: row.owner_name,
//     email: row.email,
//     phone: row.phone,
//     passwordHash: row.password_hash ?? "",
//     tier: row.tier,
//     subscriptionStatus: row.subscription_status,
//     subscriptionExpiry: row.subscription_expiry,
//     address: row.address,
//     logo: row.logo,
//     currency: row.currency ?? "NGN",
//     taxRate: row.tax_rate ?? 7.5,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at,
//     syncStatus: "synced",
//   };
// }

// function mapSupabaseStaff(row: Record<string, any>): Staff {
//   return {
//     id: row.id,
//     outletId: row.outlet_id,
//     name: row.name,
//     email: row.email,
//     phone: row.phone,
//     pin: row.pin,
//     role: row.role,
//     isActive: row.is_active ?? true,
//     createdAt: row.created_at,
//     syncStatus: "synced",
//   };
// }

// import {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   type ReactNode,
// } from "react";
// import { db } from "../db/database";
// import { supabase, getSupabaseConfigStatus } from "../lib/supabase";
// import type { Merchant, Outlet, Staff } from "../types";
// import { syncPendingData, syncRecord } from "../lib/sync";
// // Cleaned up static imports: Added hashPassword and hashPin directly
// import { generateId, hashPassword, hashPin } from "@/utils/helpers";

// interface MerchantSession {
//   merchant: Merchant;
// }

// interface OutletSession {
//   outlet: Outlet;
//   staff: Staff | null;
// }

// interface AuthContextType {
//   merchantSession: MerchantSession | null;
//   outletSession: OutletSession | null;
//   loginMerchant: (email: string, password: string) => Promise<void>;
//   logoutMerchant: () => void;
//   loginStaff: (email: string, password: string) => Promise<OutletSession>;
//   logoutOutlet: () => void;
//   registerMerchant: (data: RegisterMerchantData) => Promise<void>;
//   createStaff: (
//     outletId: string,
//     name: string,
//     email: string,
//     phone: string,
//     role: Staff["role"],
//     pin: string,
//   ) => Promise<Staff>;
//   updateMerchant: (data: Partial<Merchant>) => Promise<void>;
//   isLoading: boolean;
// }

// interface RegisterMerchantData {
//   businessName: string;
//   ownerName: string;
//   email: string;
//   phone: string;
//   password: string;
//   tier: Merchant["tier"];
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// const MERCHANT_SESSION_KEY = "pos_merchant_session";
// const OUTLET_SESSION_KEY = "pos_outlet_session";

// const { isConfigured } = getSupabaseConfigStatus();

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [merchantSession, setMerchantSession] =
//     useState<MerchantSession | null>(null);
//   const [outletSession, setOutletSession] = useState<OutletSession | null>(
//     null,
//   );
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const restoreSessions = async () => {
//       try {
//         // Try Supabase session first (staff or merchant)
//         if (isConfigured) {
//           const {
//             data: { session },
//           } = await supabase.auth.getSession();
//           if (session?.user) {
//             const uid = session.user.id;

//             // Check if this user is a merchant
//             const merchant = await db.merchants.where("id").equals(uid).first();
//             if (merchant) {
//               setMerchantSession({ merchant });
//               sessionStorage.setItem(
//                 MERCHANT_SESSION_KEY,
//                 JSON.stringify({ merchantId: merchant.id }),
//               );
//               setIsLoading(false);
//               await syncPendingData();
//               return;
//             }

//             // Check if this user is a staff member
//             const staff = await db.staff
//               .where("id")
//               .equals(uid)
//               .and((s) => s.isActive)
//               .first();
//             if (staff) {
//               const outlet = await db.outlets.get(staff.outletId);
//               if (outlet && outlet.isActive) {
//                 setOutletSession({ outlet, staff });
//                 sessionStorage.setItem(
//                   OUTLET_SESSION_KEY,
//                   JSON.stringify({
//                     outletId: outlet.id,
//                     staffId: staff.id,
//                   }),
//                 );
//               }
//               setIsLoading(false);
//               await syncPendingData();
//               return;
//             }
//           }
//         }

//         // Fallback: restore from sessionStorage
//         const mRaw = sessionStorage.getItem(MERCHANT_SESSION_KEY);
//         if (mRaw) {
//           const { merchantId } = JSON.parse(mRaw);
//           const merchant = await db.merchants.get(merchantId);
//           if (merchant) {
//             setMerchantSession({ merchant });
//             if (isConfigured) {
//               // Try to restore Supabase session silently
//               const {
//                 data: { session },
//               } = await supabase.auth.getSession();
//               if (!session?.user) {
//                 // Try to sign in with stored credentials
//                 try {
//                   await supabase.auth.signInWithPassword({
//                     email: merchant.email,
//                     password: "",
//                   });
//                 } catch {
//                   // Silently fail — sessionStorage is sufficient fallback
//                 }
//               }
//             }
//           }
//         }

//         const oRaw = sessionStorage.getItem(OUTLET_SESSION_KEY);
//         if (oRaw) {
//           const { outletId, staffId } = JSON.parse(oRaw);
//           const outlet = await db.outlets.get(outletId);
//           const staff = staffId
//             ? ((await db.staff.get(staffId)) ?? null)
//             : null;
//           if (outlet && outlet.isActive) {
//             setOutletSession({ outlet, staff });
//           }
//         }
//       } finally {
//         await syncPendingData();
//         setIsLoading(false);
//       }
//     };
//     restoreSessions();
//   }, []);

//   // ============================================================
//   // MERCHANT AUTH
//   // ============================================================

//   const loginMerchant = async (email: string, password: string) => {
//     const normalizedEmail = email.toLowerCase();

//     if (!isConfigured) {
//       // No Supabase configured — fallback to local-only
//       const merchant = await db.merchants
//         .where("email")
//         .equals(normalizedEmail)
//         .first();
//       if (!merchant) throw new Error("No account found with this email.");
//       setMerchantSession({ merchant });
//       sessionStorage.setItem(
//         MERCHANT_SESSION_KEY,
//         JSON.stringify({ merchantId: merchant.id }),
//       );
//       return;
//     }

//     // Sign in via Supabase Auth
//     const { data: authData, error: authError } =
//       await supabase.auth.signInWithPassword({
//         email: normalizedEmail,
//         password,
//       });

//     if (authError || !authData.user) {
//       throw new Error(authError?.message || "Invalid email or password.");
//     }

//     // Load merchant record from Supabase (or local fallback)
//     let merchant: Merchant | undefined;
//     if (isConfigured) {
//       const { data: cloudMerchant } = await supabase
//         .from("merchants")
//         .select("*")
//         .eq("id", authData.user.id)
//         .single();

//       if (cloudMerchant) {
//         merchant = mapSupabaseMerchant(cloudMerchant);
//         await db.merchants.put(merchant);
//       }
//     }

//     if (!merchant) {
//       merchant = await db.merchants.get(authData.user.id);
//     }

//     if (!merchant) throw new Error("Account not found. Please register first.");

//     setMerchantSession({ merchant });
//     sessionStorage.setItem(
//       MERCHANT_SESSION_KEY,
//       JSON.stringify({ merchantId: merchant.id }),
//     );
//   };

//   const logoutMerchant = async () => {
//     if (isConfigured) {
//       await supabase.auth.signOut().catch(() => {});
//     }
//     setMerchantSession(null);
//     sessionStorage.removeItem(MERCHANT_SESSION_KEY);
//   };

//   const registerMerchant = async (data: RegisterMerchantData) => {
//     const normalizedEmail = data.email.toLowerCase();

//     // Check local duplicates
//     const existing = await db.merchants
//       .where("email")
//       .equals(normalizedEmail)
//       .count();
//     if (existing > 0)
//       throw new Error("An account with this email already exists.");

//     const now = new Date().toISOString();
//     const expiry = new Date(
//       Date.now() + 30 * 24 * 60 * 60 * 1000,
//     ).toISOString();

//     let merchantId = generateId();
//     let passwordHash = "";

//     if (isConfigured) {
//       const { data: authData, error: authError } = await supabase.auth.signUp({
//         email: normalizedEmail,
//         password: data.password,
//       });

//       if (authError) {
//         console.warn(
//           "Supabase sign-up failed, continuing with local registration",
//           authError,
//         );
//         // Fixed: Replaced dynamic dynamic import with static function call
//         passwordHash = await hashPassword(data.password);
//       } else if (authData.user) {
//         merchantId = authData.user.id;
//       }
//     } else {
//       // Fixed: Replaced dynamic import with static function call
//       passwordHash = await hashPassword(data.password);
//     }

//     const merchant: Merchant = {
//       id: merchantId,
//       businessName: data.businessName,
//       ownerName: data.ownerName,
//       email: normalizedEmail,
//       phone: data.phone,
//       passwordHash,
//       tier: data.tier,
//       subscriptionStatus: "trial",
//       subscriptionExpiry: expiry,
//       currency: "NGN",
//       taxRate: 7.5,
//       createdAt: now,
//       updatedAt: now,
//       syncStatus: "pending",
//     };

//     await db.merchants.add(merchant);
//     await syncRecord("merchants", merchant);

//     setMerchantSession({ merchant });
//     sessionStorage.setItem(
//       MERCHANT_SESSION_KEY,
//       JSON.stringify({ merchantId: merchant.id }),
//     );
//   };

//   const updateMerchant = async (data: Partial<Merchant>) => {
//     if (!merchantSession) return;
//     const updated: Merchant = {
//       ...merchantSession.merchant,
//       ...data,
//       updatedAt: new Date().toISOString(),
//       syncStatus: "pending",
//     };
//     await db.merchants.put(updated);
//     await syncRecord("merchants", updated);
//     setMerchantSession({ merchant: updated });
//     sessionStorage.setItem(
//       MERCHANT_SESSION_KEY,
//       JSON.stringify({ merchantId: updated.id }),
//     );
//   };

//   // ============================================================
//   // STAFF AUTH (Supabase Auth)
//   // ============================================================

//   const createStaff = async (
//     outletId: string,
//     name: string,
//     email: string,
//     phone: string,
//     role: Staff["role"],
//     pin: string,
//   ): Promise<Staff> => {
//     const normalizedEmail = email.toLowerCase();
//     const now = new Date().toISOString();

//     let staffId = generateId();
//     let staffPin = pin;

//     if (isConfigured) {
//       const defaultPassword = pin || generateId().slice(0, 8);
//       console.log("Creating staff account with password:", defaultPassword);

//       const { data: authData, error: authError } = await supabase.auth.signUp({
//         email: normalizedEmail,
//         password: defaultPassword,
//       });

//       if (authError) {
//         console.warn("Supabase staff sign-up failed", authError);
//       } else if (authData.user) {
//         staffId = authData.user.id;
//       }
//     }

//     const staff: Staff = {
//       id: staffId,
//       outletId,
//       name,
//       email: normalizedEmail,
//       phone,
//       pin: staffPin,
//       role,
//       isActive: true,
//       createdAt: now,
//       syncStatus: "pending",
//     };

//     await db.staff.add(staff);
//     await syncRecord("staff", staff);
//     return staff;
//   };

//   const loginStaff = async (
//     email: string,
//     password: string,
//   ): Promise<OutletSession> => {
//     const normalizedEmail = email.toLowerCase();

//     if (!isConfigured) {
//       const staff = await db.staff
//         .where("email")
//         .equals(normalizedEmail)
//         .and((s) => s.isActive)
//         .first();
//       if (!staff) throw new Error("Staff account not found.");

//       if (staff.pin) {
//         // Fixed: Replaced dynamic import with static function call
//         const pinHash = await hashPin(password);
//         if (staff.pin !== pinHash) {
//           throw new Error("Invalid password.");
//         }
//       }
//       const outlet = await db.outlets.get(staff.outletId);
//       if (!outlet || !outlet.isActive) {
//         throw new Error("This outlet is not currently active.");
//       }
//       const session: OutletSession = { outlet, staff };
//       setOutletSession(session);
//       sessionStorage.setItem(
//         OUTLET_SESSION_KEY,
//         JSON.stringify({ outletId: outlet.id, staffId: staff.id }),
//       );
//       return session;
//     }

//     // Sign in via Supabase Auth
//     const { data: authData, error: authError } =
//       await supabase.auth.signInWithPassword({
//         email: normalizedEmail,
//         password,
//       });

//     if (authError || !authData.user) {
//       throw new Error(authError?.message || "Invalid email or password.");
//     }

//     let staff = await db.staff.where("email").equals(normalizedEmail).first();

//     if (!staff) {
//       const { data: cloudStaff } = await supabase
//         .from("staff")
//         .select("*")
//         .eq("email", normalizedEmail)
//         .single();

//       if (cloudStaff) {
//         staff = mapSupabaseStaff(cloudStaff);
//         await db.staff.put(staff);
//       }
//     }

//     if (!staff) throw new Error("Staff account not found.");
//     if (!staff.isActive)
//       throw new Error("This staff account has been deactivated.");

//     const outlet = await db.outlets.get(staff.outletId);
//     if (!outlet || !outlet.isActive) {
//       throw new Error("This outlet is not currently active.");
//     }

//     const session: OutletSession = { outlet, staff };
//     setOutletSession(session);
//     sessionStorage.setItem(
//       OUTLET_SESSION_KEY,
//       JSON.stringify({ outletId: outlet.id, staffId: staff.id }),
//     );

//     await syncPendingData();
//     return session;
//   };

//   const logoutOutlet = async () => {
//     if (isConfigured) {
//       await supabase.auth.signOut().catch(() => {});
//     }
//     setOutletSession(null);
//     sessionStorage.removeItem(OUTLET_SESSION_KEY);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         merchantSession,
//         outletSession,
//         loginMerchant,
//         logoutMerchant,
//         loginStaff,
//         logoutOutlet,
//         registerMerchant,
//         createStaff,
//         updateMerchant,
//         isLoading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//   return ctx;
// }

// // ============================================================
// // Supabase row → our type mappers
// // ============================================================

// function mapSupabaseMerchant(row: Record<string, any>): Merchant {
//   return {
//     id: row.id,
//     businessName: row.business_name,
//     ownerName: row.owner_name,
//     email: row.email,
//     phone: row.phone,
//     passwordHash: row.password_hash ?? "",
//     tier: row.tier,
//     subscriptionStatus: row.subscription_status,
//     subscriptionExpiry: row.subscription_expiry,
//     address: row.address,
//     logo: row.logo,
//     currency: row.currency ?? "NGN",
//     taxRate: row.tax_rate ?? 7.5,
//     createdAt: row.created_at,
//     updatedAt: row.updated_at,
//     syncStatus: "synced",
//   };
// }

// function mapSupabaseStaff(row: Record<string, any>): Staff {
//   return {
//     id: row.id,
//     outletId: row.outlet_id,
//     name: row.name,
//     email: row.email,
//     phone: row.phone,
//     pin: row.pin,
//     role: row.role,
//     isActive: row.is_active ?? true,
//     createdAt: row.created_at,
//     syncStatus: "synced",
//   };
// }

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { db } from "../db/database";
import { supabase, getSupabaseConfigStatus } from "../lib/supabase";
import type { Merchant, Outlet, Staff } from "../types";
import { syncPendingData, syncRecord } from "../lib/sync";
import { generateId, hashPassword, hashPin } from "@/utils/helpers";

interface MerchantSession {
  merchant: Merchant;
}

interface OutletSession {
  outlet: Outlet;
  staff: Staff | null;
}

interface AuthContextType {
  merchantSession: MerchantSession | null;
  outletSession: OutletSession | null;
  loginMerchant: (email: string, password: string) => Promise<void>;
  logoutMerchant: () => void;
  loginStaff: (email: string, pinInput: string) => Promise<OutletSession>;
  logoutOutlet: () => void;
  registerMerchant: (data: RegisterMerchantData) => Promise<void>;
  createStaff: (
    outletId: string,
    name: string,
    email: string,
    phone: string,
    role: Staff["role"],
    pin: string,
  ) => Promise<Staff>;
  updateMerchant: (data: Partial<Merchant>) => Promise<void>;
  isLoading: boolean;
}

interface RegisterMerchantData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  tier: Merchant["tier"];
}

const AuthContext = createContext<AuthContextType | null>(null);

const MERCHANT_SESSION_KEY = "pos_merchant_session";
const OUTLET_SESSION_KEY = "pos_outlet_session";

const { isConfigured } = getSupabaseConfigStatus();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [merchantSession, setMerchantSession] =
    useState<MerchantSession | null>(null);
  const [outletSession, setOutletSession] = useState<OutletSession | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSessions = async () => {
      try {
        // 1. Try restoring Outlet Session (Terminal Cashier Login) from storage
        const oRaw =
          sessionStorage.getItem(OUTLET_SESSION_KEY) ||
          localStorage.getItem(OUTLET_SESSION_KEY);

        if (oRaw) {
          const { outletId, staffId } = JSON.parse(oRaw);
          const outlet = await db.outlets.get(outletId);
          const staff = staffId
            ? ((await db.staff.get(staffId)) ?? null)
            : null;

          if (outlet && outlet.isActive) {
            setOutletSession({ outlet, staff });
          }
        }

        // 2. Try Supabase session for Merchant Auth
        if (isConfigured) {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            const uid = session.user.id;
            const merchant = await db.merchants.where("id").equals(uid).first();

            if (merchant) {
              setMerchantSession({ merchant });
              sessionStorage.setItem(
                MERCHANT_SESSION_KEY,
                JSON.stringify({ merchantId: merchant.id }),
              );
              setIsLoading(false);
              await syncPendingData();
              return;
            }
          }
        }

        // 3. Fallback: Restore Merchant session from sessionStorage
        const mRaw = sessionStorage.getItem(MERCHANT_SESSION_KEY);
        if (mRaw) {
          const { merchantId } = JSON.parse(mRaw);
          const merchant = await db.merchants.get(merchantId);
          if (merchant) {
            setMerchantSession({ merchant });
          }
        }
      } catch (err) {
        console.warn("Error restoring auth sessions:", err);
      } finally {
        await syncPendingData();
        setIsLoading(false);
      }
    };

    restoreSessions();
  }, []);

  // ============================================================
  // MERCHANT AUTH
  // ============================================================

  const loginMerchant = async (email: string, password: string) => {
    const normalizedEmail = email.toLowerCase();

    if (!isConfigured) {
      const merchant = await db.merchants
        .where("email")
        .equals(normalizedEmail)
        .first();
      if (!merchant) throw new Error("No account found with this email.");
      setMerchantSession({ merchant });
      sessionStorage.setItem(
        MERCHANT_SESSION_KEY,
        JSON.stringify({ merchantId: merchant.id }),
      );
      return;
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Invalid email or password.");
    }

    let merchant: Merchant | undefined;
    if (isConfigured) {
      const { data: cloudMerchant } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (cloudMerchant) {
        merchant = mapSupabaseMerchant(cloudMerchant);
        await db.merchants.put(merchant);
      }
    }

    if (!merchant) {
      merchant = await db.merchants.get(authData.user.id);
    }

    if (!merchant) throw new Error("Account not found. Please register first.");

    setMerchantSession({ merchant });
    sessionStorage.setItem(
      MERCHANT_SESSION_KEY,
      JSON.stringify({ merchantId: merchant.id }),
    );
  };

  const logoutMerchant = async () => {
    if (isConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setMerchantSession(null);
    sessionStorage.removeItem(MERCHANT_SESSION_KEY);
  };

  const registerMerchant = async (data: RegisterMerchantData) => {
    const normalizedEmail = data.email.toLowerCase();

    const existing = await db.merchants
      .where("email")
      .equals(normalizedEmail)
      .count();
    if (existing > 0)
      throw new Error("An account with this email already exists.");

    const now = new Date().toISOString();
    const expiry = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    let merchantId = generateId();
    let passwordHash = "";

    if (isConfigured) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
      });

      if (authError) {
        console.warn(
          "Supabase sign-up failed, continuing with local registration",
          authError,
        );
        passwordHash = await hashPassword(data.password);
      } else if (authData.user) {
        merchantId = authData.user.id;
      }
    } else {
      passwordHash = await hashPassword(data.password);
    }

    const merchant: Merchant = {
      id: merchantId,
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: normalizedEmail,
      phone: data.phone,
      passwordHash,
      tier: data.tier,
      subscriptionStatus: "trial",
      subscriptionExpiry: expiry,
      currency: "NGN",
      taxRate: 7.5,
      createdAt: now,
      updatedAt: now,
      syncStatus: "pending",
    };

    await db.merchants.add(merchant);
    await syncRecord("merchants", merchant);

    setMerchantSession({ merchant });
    sessionStorage.setItem(
      MERCHANT_SESSION_KEY,
      JSON.stringify({ merchantId: merchant.id }),
    );
  };

  const updateMerchant = async (data: Partial<Merchant>) => {
    if (!merchantSession) return;
    const updated: Merchant = {
      ...merchantSession.merchant,
      ...data,
      updatedAt: new Date().toISOString(),
      syncStatus: "pending",
    };
    await db.merchants.put(updated);
    await syncRecord("merchants", updated);
    setMerchantSession({ merchant: updated });
    sessionStorage.setItem(
      MERCHANT_SESSION_KEY,
      JSON.stringify({ merchantId: updated.id }),
    );
  };

  // ============================================================
  // STAFF AUTH (PIN-based Terminal Login)
  // ============================================================

  const createStaff = async (
    outletId: string,
    name: string,
    email: string,
    phone: string,
    role: Staff["role"],
    pin: string,
  ): Promise<Staff> => {
    const normalizedEmail = email.toLowerCase();
    const now = new Date().toISOString();
    const staffId = generateId();

    const staff: Staff = {
      id: staffId,
      outletId,
      name,
      email: normalizedEmail,
      phone,
      pin,
      role,
      isActive: true,
      createdAt: now,
      syncStatus: "pending",
    };

    await db.staff.add(staff);
    await syncRecord("staff", staff);
    return staff;
  };

  const loginStaff = async (
    email: string,
    pinInput: string,
  ): Promise<OutletSession> => {
    const normalizedEmail = email.toLowerCase();
    const hashedPinInput = await hashPin(pinInput);

    // 1. Search staff in local Dexie IndexedDB
    let staff = await db.staff.where("email").equals(normalizedEmail).first();

    // 2. Fallback search in Supabase Cloud if missing locally
    if (!staff && isConfigured) {
      const { data: cloudStaff } = await supabase
        .from("staff")
        .select("*")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (cloudStaff) {
        staff = mapSupabaseStaff(cloudStaff);
        await db.staff.put(staff);
      }
    }

    if (!staff) {
      throw new Error("Staff profile not found.");
    }

    if (!staff.isActive) {
      throw new Error("This staff profile has been deactivated.");
    }

    // 3. Verify PIN (Check plain text PIN or hashed PIN)
    const isPinValid = staff.pin === pinInput || staff.pin === hashedPinInput;

    if (!isPinValid) {
      throw new Error("Invalid Staff PIN.");
    }

    // 4. Resolve outlet
    const boundOutletId =
      localStorage.getItem("pos_terminal_outlet_id") || staff.outletId;

    let outlet = await db.outlets.get(boundOutletId);

    if (!outlet && isConfigured) {
      const { data: cloudOutlet } = await supabase
        .from("outlets")
        .select("*")
        .eq("id", boundOutletId)
        .maybeSingle();

      if (cloudOutlet) {
        outlet = {
          id: cloudOutlet.id,
          merchantId: cloudOutlet.merchant_id || cloudOutlet.merchantId,
          outletCode: cloudOutlet.outlet_code || cloudOutlet.outletCode,
          name: cloudOutlet.name,
          address: cloudOutlet.address,
          phone: cloudOutlet.phone ?? "",
          pin: cloudOutlet.pin,
          isActive: cloudOutlet.is_active ?? cloudOutlet.isActive ?? true,
          taxEnabled: cloudOutlet.tax_enabled ?? cloudOutlet.taxEnabled ?? true,
          receiptFooter:
            cloudOutlet.receipt_footer ?? cloudOutlet.receiptFooter ?? "",
          createdAt: cloudOutlet.created_at || cloudOutlet.createdAt,
          updatedAt: cloudOutlet.updated_at || cloudOutlet.updatedAt,
          syncStatus: "synced",
        } as Outlet;
        await db.outlets.put(outlet);
      }
    }

    if (!outlet || !outlet.isActive) {
      throw new Error("Assigned outlet is not active or missing.");
    }

    const session: OutletSession = { outlet, staff };

    // 5. Store session and set state
    const sessionPayload = JSON.stringify({
      outletId: outlet.id,
      staffId: staff.id,
    });

    sessionStorage.setItem(OUTLET_SESSION_KEY, sessionPayload);
    localStorage.setItem(OUTLET_SESSION_KEY, sessionPayload);

    setOutletSession(session);

    return session;
  };

  const logoutOutlet = async () => {
    setOutletSession(null);
    sessionStorage.removeItem(OUTLET_SESSION_KEY);
    localStorage.removeItem(OUTLET_SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        merchantSession,
        outletSession,
        loginMerchant,
        logoutMerchant,
        loginStaff,
        logoutOutlet,
        registerMerchant,
        createStaff,
        updateMerchant,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// ============================================================
// Supabase row → our type mappers
// ============================================================

function mapSupabaseMerchant(row: Record<string, any>): Merchant {
  return {
    id: row.id,
    businessName: row.business_name,
    ownerName: row.owner_name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash ?? "",
    tier: row.tier,
    subscriptionStatus: row.subscription_status,
    subscriptionExpiry: row.subscription_expiry,
    address: row.address,
    logo: row.logo,
    currency: row.currency ?? "NGN",
    taxRate: row.tax_rate ?? 7.5,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: "synced",
  };
}

function mapSupabaseStaff(row: Record<string, any>): Staff {
  return {
    id: row.id,
    outletId: row.outlet_id || row.outletId,
    name: row.name,
    email: row.email,
    phone: row.phone,
    pin: row.pin,
    role: row.role,
    isActive: row.is_active ?? row.isActive ?? true,
    createdAt: row.created_at || row.createdAt,
    syncStatus: "synced",
  };
}

