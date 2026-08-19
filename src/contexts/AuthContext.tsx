import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { db } from "../db/database";
import { supabase, getSupabaseConfigStatus } from "../lib/supabase";
import type { Merchant, Outlet, Staff, BillingCycle } from "../types";
import { syncPendingData, syncRecord } from "../lib/sync";
import { generateId } from "@/utils/helpers";

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
  billingCycle?: BillingCycle;
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

        // A browser storage value is not an authentication credential. Never
        // restore an outlet session from it while Supabase is configured.
        if (oRaw && !isConfigured) {
          const { outletId, staffId } = JSON.parse(oRaw);
          const outlet = await db.outlets.get(outletId);
          const staff = staffId
            ? ((await db.staff.get(staffId)) ?? null)
            : null;

          if (outlet && outlet.isActive) {
            if (!outlet.currency && outlet.merchantId) {
              const merchant = await db.merchants.get(outlet.merchantId);
              if (merchant) outlet.currency = merchant.currency;
            }
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
            const { data: cloudStaff } = await supabase
              .from("staff")
              .select("*")
              .eq("id", uid)
              .eq("is_active", true)
              .maybeSingle();
            if (cloudStaff) {
              const staff = mapSupabaseStaff(cloudStaff);
              const { data: cloudOutlet } = await supabase
                .from("outlets")
                .select("*")
                .eq("id", staff.outletId)
                .eq("is_active", true)
                .maybeSingle();
              if (cloudOutlet) {
                const outlet = mapSupabaseOutlet(cloudOutlet);
                await db.transaction("rw", db.staff, db.outlets, async () => {
                  await db.staff.put(staff);
                  await db.outlets.put(outlet);
                });
                await hydrateOutletData(outlet.id);
                setOutletSession({ outlet, staff });
                setIsLoading(false);
                await syncPendingData();
                return;
              }
            }
            let merchant = await db.merchants.where("id").equals(uid).first();
            if (!merchant) {
              const { data: cloudMerchant } = await supabase
                .from("merchants")
                .select("*")
                .eq("id", uid)
                .maybeSingle();
              if (cloudMerchant) {
                merchant = mapSupabaseMerchant(cloudMerchant);
                await db.merchants.put(merchant);
              }
            }

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
        if (mRaw && !isConfigured) {
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
    // Passwords are managed exclusively by Supabase Auth. Never cache a
    // password hash in Dexie or send it to a public table.
    const passwordHash = "";

    if (isConfigured) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            business_name: data.businessName.trim(),
            owner_name: data.ownerName.trim(),
            phone: data.phone.trim(),
            tier: data.tier,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message || "Unable to create your account.");
      } else if (authData.user) {
        merchantId = authData.user.id;
      }
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

    await db.merchants.put(merchant);
    // In Supabase mode the auth.users trigger creates the tenant record. Do
    // not race it with a browser upsert, especially when email confirmation
    // means signUp returns no session yet.
    if (!isConfigured) await syncRecord("merchants", merchant);

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
    let staffId = generateId();

    if (isConfigured) {
      if (pin.length < 12) {
        throw new Error("Staff password must be at least 12 characters.");
      }
      const { data, error } = await supabase.functions.invoke(
        "provision-staff",
        {
          body: {
            outletId,
            name,
            email: normalizedEmail,
            phone,
            role,
            initialPassword: pin,
          },
        },
      );
      if (error || !data?.id) {
        const message = error?.message || "Failed to create staff account.";
        if (/failed to send a request|fetch/i.test(message)) {
          throw new Error(
            "Staff provisioning is unavailable. Deploy the 'provision-staff' Supabase Edge Function, then try again.",
          );
        }
        throw new Error(message);
      }
      staffId = data.id;
    }

    const staff: Staff = {
      id: staffId,
      outletId,
      name,
      email: normalizedEmail,
      phone,
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      syncStatus: "pending",
    };

    await db.staff.add(staff);
    // The Edge Function has already created the cloud profile atomically.
    if (!isConfigured) await syncRecord("staff", staff);
    return staff;
  };

  const loginStaff = async (
    email: string,
    pinInput: string,
  ): Promise<OutletSession> => {
    const normalizedEmail = email.toLowerCase();

    let authUserId: string | null = null;

    if (isConfigured) {
      // Try regular Supabase auth first
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: pinInput,
        });

      if (!authError && authData.user) authUserId = authData.user.id;
      else throw new Error("Invalid email or password.");
    }

    let staff = await db.staff.where("email").equals(normalizedEmail).first();

    if (isConfigured) {
      // Prefer fetching staff by authenticated user id, fallback to email
      let cloudStaff: any = null;

      if (authUserId) {
        const { data } = await supabase
          .from("staff")
          .select("*")
          .eq("id", authUserId)
          .maybeSingle();
        cloudStaff = data;
      }
      if (!cloudStaff) {
        const { data } = await supabase
          .from("staff")
          .select("*")
          .eq("email", normalizedEmail)
          .maybeSingle();
        cloudStaff = data;
      }

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

    if (!isConfigured)
      throw new Error("Supabase must be configured for staff login.");

    // The authenticated staff assignment is the only trusted outlet binding.
    const boundOutletId = staff.outletId;

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
          pin: "",
          currency: cloudOutlet.currency || undefined,
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

    await hydrateOutletData(outlet.id);

    if (!outlet.currency && outlet.merchantId) {
      const merchant = await db.merchants.get(outlet.merchantId);
      if (merchant) outlet.currency = merchant.currency;
    }

    const session: OutletSession = { outlet, staff };
    const sessionPayload = JSON.stringify({
      outletId: outlet.id,
      staffId: staff.id,
    });

    sessionStorage.setItem(OUTLET_SESSION_KEY, sessionPayload);
    setOutletSession(session);

    return session;
  };

  const logoutOutlet = async () => {
    if (isConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setOutletSession(null);
    sessionStorage.removeItem(OUTLET_SESSION_KEY);
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
    role: row.role,
    isActive: row.is_active ?? row.isActive ?? true,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    syncStatus: "synced",
  };
}

function mapSupabaseOutlet(row: Record<string, any>): Outlet {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    outletCode: row.outlet_code,
    name: row.name,
    address: row.address,
    phone: row.phone ?? "",
    // Pairing secrets are deliberately never returned to the browser.
    pin: "",
    currency: row.currency ?? undefined,
    isActive: row.is_active ?? true,
    taxEnabled: row.tax_enabled ?? true,
    receiptFooter: row.receipt_footer ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: "synced",
  };
}

/** Load the outlet-scoped offline cache after an authenticated staff login. */
async function hydrateOutletData(outletId: string) {
  const [categories, products, customers, sales, expenses, movements] =
    await Promise.all([
      supabase.from("categories").select("*").eq("outlet_id", outletId),
      supabase.from("products").select("*").eq("outlet_id", outletId),
      supabase.from("customers").select("*").eq("outlet_id", outletId),
      supabase.from("sales").select("*").eq("outlet_id", outletId),
      supabase.from("expenses").select("*").eq("outlet_id", outletId),
      supabase.from("stock_movements").select("*").eq("outlet_id", outletId),
    ]);
  const failure = [
    categories,
    products,
    customers,
    sales,
    expenses,
    movements,
  ].find((result) => result.error)?.error;
  if (failure)
    throw new Error(`Unable to load assigned outlet data: ${failure.message}`);

  await db.transaction(
    "rw",
    [
      db.categories,
      db.products,
      db.customers,
      db.sales,
      db.expenses,
      db.stockMovements,
    ],
    async () => {
      await db.categories.bulkPut(
        (categories.data ?? []).map((row: any) => ({
          id: row.id,
          outletId: row.outlet_id,
          name: row.name,
          color: row.color,
          createdAt: row.created_at,
          syncStatus: "synced" as const,
        })),
      );
      await db.products.bulkPut(
        (products.data ?? []).map((row: any) => ({
          id: row.id,
          outletId: row.outlet_id,
          categoryId: row.category_id ?? undefined,
          name: row.name,
          sku: row.sku,
          barcode: row.barcode ?? undefined,
          description: row.description ?? undefined,
          price: Number(row.price),
          costPrice: Number(row.cost_price),
          stock: Number(row.stock),
          lowStockAlert: Number(row.low_stock_alert),
          unit: row.unit,
          image: row.image ?? undefined,
          isActive: row.is_active,
          trackStock: row.track_stock,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          syncStatus: "synced" as const,
        })),
      );
      await db.customers.bulkPut(
        (customers.data ?? []).map((row: any) => ({
          id: row.id,
          outletId: row.outlet_id,
          name: row.name,
          phone: row.phone,
          email: row.email ?? undefined,
          address: row.address ?? undefined,
          loyaltyPoints: Number(row.loyalty_points),
          totalSpent: Number(row.total_spent),
          visitCount: Number(row.visit_count),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          syncStatus: "synced" as const,
        })),
      );
      await db.sales.bulkPut(
        (sales.data ?? []).map((row: any) => ({
          id: row.id,
          outletId: row.outlet_id,
          receiptNumber: row.receipt_number,
          items: row.items,
          subtotal: Number(row.subtotal),
          taxAmount: Number(row.tax_amount),
          discountAmount: Number(row.discount_amount),
          total: Number(row.total),
          amountPaid: Number(row.amount_paid),
          change: Number(row.change),
          paymentMethod: row.payment_method,
          status: row.status,
          customerId: row.customer_id ?? undefined,
          customerName: row.customer_name ?? undefined,
          staffId: row.staff_id ?? undefined,
          staffName: row.staff_name ?? undefined,
          note: row.note ?? undefined,
          createdAt: row.created_at,
          syncStatus: "synced" as const,
        })),
      );
      await db.expenses.bulkPut(
        (expenses.data ?? []).map((row: any) => ({
          id: row.id,
          outletId: row.outlet_id,
          category: row.category,
          amount: Number(row.amount),
          description: row.description,
          date: row.expense_date,
          staffId: row.staff_id ?? undefined,
          createdAt: row.created_at,
          syncStatus: "synced" as const,
        })),
      );
      await db.stockMovements.bulkPut(
        (movements.data ?? []).map((row: any) => ({
          id: row.id,
          outletId: row.outlet_id,
          productId: row.product_id,
          productName: row.product_name,
          type: row.type,
          qty: Number(row.qty),
          prevStock: Number(row.prev_stock),
          newStock: Number(row.new_stock),
          note: row.note ?? undefined,
          saleId: row.sale_id ?? undefined,
          createdAt: row.created_at,
          syncStatus: "synced" as const,
        })),
      );
    },
  );
}
