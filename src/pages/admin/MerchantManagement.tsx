// import { useEffect, useMemo, useState } from "react";
// import {
//   LogOut,
//   RefreshCw,
//   Search,
//   Calendar,
//   X,
//   Filter,
//   Users,
//   Clock,
//   UserX,
//   Layers,
// } from "lucide-react";
// import { supabase } from "@/lib/supabase";
// import { useAuth } from "@/contexts/AuthContext";
// import Button from "@/components/ui/Button";
// import Badge from "@/components/ui/Badge";
// import { useToast } from "@/components/ui/Toast";
// import type { Merchant, MerchantTier } from "@/types";

// // Extended interface combining base Merchant properties with aggregated outlet count
// type MerchantRow = Merchant & { outletCount: number };

// // Available tier options for dropdown controls
// const tierOptions: MerchantTier[] = ["basic", "standard", "premium"];

// export default function MerchantManagement() {
//   // Authentication & Notification context hooks
//   const { logoutAdmin, adminSession } = useAuth();
//   const { success, error: showError } = useToast();

//   // Primary data & operation state
//   const [merchants, setMerchants] = useState<MerchantRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [savingId, setSavingId] = useState<string | null>(null);

//   // Filter & Search input state
//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [approvalFilter, setApprovalFilter] = useState<string>("all");

//   /**
//    * Fetches all merchants and outlet counts in parallel from Supabase,
//    * maps database column names (snake_case) to application types (camelCase).
//    */
//   const load = async () => {
//     setLoading(true);
//     try {
//       const [
//         { data: merchantRows, error: merchantError },
//         { data: outletRows, error: outletError },
//       ] = await Promise.all([
//         supabase
//           .from("merchants")
//           .select(
//             "id, business_name, owner_name, email, phone, tier, subscription_status, subscription_expiry, approval_status, requested_tier, billing_cycle, approved_at, deletion_scheduled_at, currency, tax_rate, created_at, updated_at",
//           )
//           .order("created_at", { ascending: false }),
//         supabase.from("outlets").select("merchant_id"),
//       ]);

//       if (merchantError || outletError) throw merchantError || outletError;

//       // Count the total number of outlets per merchant ID
//       const counts = new Map<string, number>();
//       (outletRows ?? []).forEach((outlet: { merchant_id: string }) =>
//         counts.set(
//           outlet.merchant_id,
//           (counts.get(outlet.merchant_id) ?? 0) + 1,
//         ),
//       );

//       // Normalize row data structure
//       setMerchants(
//         (merchantRows ?? []).map((row: any) => ({
//           id: row.id,
//           businessName: row.business_name,
//           ownerName: row.owner_name,
//           email: row.email,
//           phone: row.phone,
//           passwordHash: "",
//           tier: row.tier,
//           subscriptionStatus: row.subscription_status,
//           subscriptionExpiry: row.subscription_expiry,
//           approvalStatus: row.approval_status,
//           requestedTier: row.requested_tier ?? undefined,
//           billingCycle: row.billing_cycle ?? undefined,
//           approvedAt: row.approved_at ?? undefined,
//           deletionScheduledAt: row.deletion_scheduled_at ?? undefined,
//           currency: row.currency,
//           taxRate: Number(row.tax_rate),
//           createdAt: row.created_at,
//           updatedAt: row.updated_at,
//           syncStatus: "synced",
//           outletCount: counts.get(row.id) ?? 0,
//         })),
//       );
//     } catch (error: any) {
//       showError(error.message || "Unable to load merchant accounts.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initial data load on mount
//   useEffect(() => {
//     load();
//   }, []);

//   /**
//    * Calculates accounts whose subscriptions expire within 14 days
//    */
//   const expiring = useMemo(
//     () =>
//       merchants.filter((merchant) => {
//         const days =
//           (new Date(merchant.subscriptionExpiry).getTime() - Date.now()) /
//           86_400_000;
//         return (
//           merchant.approvalStatus === "approved" && days >= 0 && days <= 14
//         );
//       }),
//     [merchants],
//   );

//   /**
//    * Feature: Calculates overall merchant stats including:
//    * - Total pending accounts
//    * - Total rejected accounts
//    * - Total active/approved accounts and their subscription plan breakdown
//    */
//   const stats = useMemo(() => {
//     let pending = 0;
//     let approved = 0;
//     let rejected = 0;
//     const plans: Record<MerchantTier, number> = {
//       basic: 0,
//       standard: 0,
//       premium: 0,
//     };

//     merchants.forEach((merchant) => {
//       if (merchant.approvalStatus === "approved") {
//         approved++;
//         if (plans[merchant.tier] !== undefined) {
//           plans[merchant.tier]++;
//         }
//       } else if (merchant.approvalStatus === "rejected") {
//         rejected++;
//       } else {
//         pending++;
//       }
//     });

//     return { pending, approved, rejected, plans };
//   }, [merchants]);

//   /**
//    * Client-side multi-variable filtering logic (Search query, Date Range, Status)
//    */
//   const filteredMerchants = useMemo(() => {
//     return merchants.filter((merchant) => {
//       // 1. Text search on business name, owner name, or email address
//       const query = searchQuery.toLowerCase().trim();
//       const matchesSearch =
//         !query ||
//         merchant.businessName.toLowerCase().includes(query) ||
//         merchant.ownerName.toLowerCase().includes(query) ||
//         merchant.email.toLowerCase().includes(query);

//       // 2. Approval status matching
//       const matchesStatus =
//         approvalFilter === "all" || merchant.approvalStatus === approvalFilter;

//       // 3. Date range filtering against creation date
//       let matchesDate = true;
//       if (startDate) {
//         const start = new Date(startDate);
//         start.setHours(0, 0, 0, 0);
//         matchesDate = matchesDate && new Date(merchant.createdAt) >= start;
//       }
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         matchesDate = matchesDate && new Date(merchant.createdAt) <= end;
//       }

//       return matchesSearch && matchesStatus && matchesDate;
//     });
//   }, [merchants, searchQuery, startDate, endDate, approvalFilter]);

//   /**
//    * Resets all search and filter fields to default values
//    */
//   const clearFilters = () => {
//     setSearchQuery("");
//     setStartDate("");
//     setEndDate("");
//     setApprovalFilter("all");
//   };

//   /**
//    * Invokes Edge function to approve/reject merchant status or modify account tier
//    */
//   const update = async (
//     merchant: MerchantRow,
//     approval?: "approved" | "rejected",
//     tier?: MerchantTier,
//   ) => {
//     setSavingId(merchant.id);
//     try {
//       const { error } = await supabase.functions.invoke("admin-merchant", {
//         body: {
//           merchantId: merchant.id,
//           approvalStatus: approval ?? null,
//           tier: tier ?? null,
//           expiry:
//             approval === "approved"
//               ? new Date(Date.now() + 30 * 86_400_000).toISOString()
//               : null,
//         },
//       });
//       if (error) throw error;
//       success("Merchant account updated.");
//       await load();
//     } catch (error: any) {
//       showError(error.message || "Merchant update failed.");
//     } finally {
//       setSavingId(null);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-pos-bg p-3 sm:p-6 space-y-6">
//       {/* SECTION: Page Header */}
//       <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-xl sm:text-2xl font-bold text-pos-text">
//             Merchant Management
//           </h1>
//           <p className="text-xs sm:text-sm text-pos-muted">
//             Signed in as {adminSession?.email}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button
//             variant="outline"
//             icon={<RefreshCw size={15} />}
//             onClick={load}
//             className="w-full sm:w-auto"
//           >
//             Refresh
//           </Button>
//           <Button
//             variant="danger"
//             icon={<LogOut size={15} />}
//             onClick={logoutAdmin}
//             className="w-full sm:w-auto"
//           >
//             Sign out
//           </Button>
//         </div>
//       </header>

//       {/* FEATURE: Stats Overview Dashboard */}
//       <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* Active Accounts & Plan Distribution */}
//         <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
//           <div className="flex items-center justify-between text-pos-muted">
//             <span className="text-xs font-medium uppercase tracking-wider">
//               Active Accounts
//             </span>
//             <Users size={18} className="text-emerald-400" />
//           </div>
//           <div className="text-2xl font-bold text-pos-text">
//             {stats.approved}
//           </div>
//           <div className="flex items-center gap-2 pt-1 border-t border-pos-border/40 text-xs text-pos-muted">
//             <span className="capitalize">
//               Basic: <strong>{stats.plans.basic}</strong>
//             </span>
//             <span>·</span>
//             <span className="capitalize">
//               Std: <strong>{stats.plans.standard}</strong>
//             </span>
//             <span>·</span>
//             <span className="capitalize">
//               Prem: <strong>{stats.plans.premium}</strong>
//             </span>
//           </div>
//         </div>

//         {/* Pending Approvals Metric */}
//         <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
//           <div className="flex items-center justify-between text-pos-muted">
//             <span className="text-xs font-medium uppercase tracking-wider">
//               Pending Approvals
//             </span>
//             <Clock size={18} className="text-amber-400" />
//           </div>
//           <div className="text-2xl font-bold text-pos-text">
//             {stats.pending}
//           </div>
//           <p className="text-xs text-pos-muted pt-1 border-t border-pos-border/40">
//             Requires admin action
//           </p>
//         </div>

//         {/* Rejected Accounts Metric */}
//         <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
//           <div className="flex items-center justify-between text-pos-muted">
//             <span className="text-xs font-medium uppercase tracking-wider">
//               Rejected Users
//             </span>
//             <UserX size={18} className="text-rose-400" />
//           </div>
//           <div className="text-2xl font-bold text-pos-text">
//             {stats.rejected}
//           </div>
//           <p className="text-xs text-pos-muted pt-1 border-t border-pos-border/40">
//             Access denied accounts
//           </p>
//         </div>

//         {/* Total Merchants Registered */}
//         <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
//           <div className="flex items-center justify-between text-pos-muted">
//             <span className="text-xs font-medium uppercase tracking-wider">
//               Total Merchants
//             </span>
//             <Layers size={18} className="text-indigo-400" />
//           </div>
//           <div className="text-2xl font-bold text-pos-text">
//             {merchants.length}
//           </div>
//           <p className="text-xs text-pos-muted pt-1 border-t border-pos-border/40">
//             All registered records
//           </p>
//         </div>
//       </section>

//       {/* SECTION: Subscription Expiry Alert Banner */}
//       {expiring.length > 0 && (
//         <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-200">
//           {expiring.length} approved merchant account(s) expire within 14 days.
//           The lifecycle job will send reminders when configured.
//         </section>
//       )}

//       {/* SECTION: Search & Filter Toolbar */}
//       <section className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-3">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
//           {/* Search Input */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
//             <input
//               type="text"
//               placeholder="Search name or email..."
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500"
//             />
//           </div>

//           {/* Start Date Filter */}
//           <div className="relative">
//             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
//             <input
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500"
//             />
//           </div>

//           {/* End Date Filter */}
//           <div className="relative">
//             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
//             <input
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500"
//             />
//           </div>

//           {/* Status Dropdown Filter */}
//           <div className="relative">
//             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
//             <select
//               value={approvalFilter}
//               onChange={(e) => setApprovalFilter(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500 capitalize"
//             >
//               <option value="all">All Approvals</option>
//               <option value="pending">Pending</option>
//               <option value="approved">Approved</option>
//               <option value="rejected">Rejected</option>
//             </select>
//           </div>
//         </div>

//         {/* Active Filter Clear Bar */}
//         {(searchQuery || startDate || endDate || approvalFilter !== "all") && (
//           <div className="flex items-center justify-between pt-2 border-t border-pos-border/40 text-xs">
//             <span className="text-pos-muted">
//               Showing {filteredMerchants.length} of {merchants.length} merchants
//             </span>
//             <button
//               onClick={clearFilters}
//               className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
//             >
//               <X size={14} /> Clear filters
//             </button>
//           </div>
//         )}
//       </section>

//       {/* SECTION: Desktop Data Table (Visible on Large Screens) */}
//       <div className="hidden lg:block overflow-x-auto rounded-xl border border-pos-border bg-pos-card">
//         <table className="w-full text-sm">
//           <thead className="text-left text-pos-muted border-b border-pos-border">
//             <tr>
//               <th className="p-3">Merchant</th>
//               <th className="p-3">Requested / active plan</th>
//               <th className="p-3">Outlets</th>
//               <th className="p-3">Approval</th>
//               <th className="p-3">Expiry</th>
//               <th className="p-3">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td className="p-6 text-pos-muted text-center" colSpan={6}>
//                   Loading merchants…
//                 </td>
//               </tr>
//             ) : filteredMerchants.length === 0 ? (
//               <tr>
//                 <td className="p-6 text-pos-muted text-center" colSpan={6}>
//                   No merchants found matching the filter criteria.
//                 </td>
//               </tr>
//             ) : (
//               filteredMerchants.map((merchant) => (
//                 <tr
//                   key={merchant.id}
//                   className="border-b border-pos-border/60 hover:bg-pos-input/40 transition-colors"
//                 >
//                   <td className="p-3">
//                     <p className="font-medium text-pos-text">
//                       {merchant.businessName}
//                     </p>
//                     <p className="text-xs text-pos-muted">
//                       {merchant.ownerName} · {merchant.email}
//                     </p>
//                   </td>
//                   <td className="p-3 capitalize">
//                     {merchant.requestedTier ?? merchant.tier} /{" "}
//                     <strong>{merchant.tier}</strong>
//                   </td>
//                   <td className="p-3">{merchant.outletCount}</td>
//                   <td className="p-3">
//                     <Badge
//                       variant={
//                         merchant.approvalStatus === "approved"
//                           ? "success"
//                           : merchant.approvalStatus === "rejected"
//                             ? "danger"
//                             : "warning"
//                       }
//                     >
//                       {merchant.approvalStatus}
//                     </Badge>
//                   </td>
//                   <td className="p-3">
//                     {new Date(merchant.subscriptionExpiry).toLocaleDateString()}
//                   </td>
//                   <td className="p-3">
//                     <div className="flex items-center gap-2">
//                       <select
//                         className="bg-pos-input border border-pos-border rounded px-2 py-1 text-xs"
//                         value={merchant.tier}
//                         onChange={(event) =>
//                           update(
//                             merchant,
//                             undefined,
//                             event.target.value as MerchantTier,
//                           )
//                         }
//                         disabled={savingId === merchant.id}
//                       >
//                         {tierOptions.map((tier) => (
//                           <option key={tier} value={tier}>
//                             {tier}
//                           </option>
//                         ))}
//                       </select>
//                       {merchant.approvalStatus !== "approved" && (
//                         <Button
//                           size="xs"
//                           variant="success"
//                           loading={savingId === merchant.id}
//                           onClick={() =>
//                             update(
//                               merchant,
//                               "approved",
//                               merchant.requestedTier ?? merchant.tier,
//                             )
//                           }
//                         >
//                           Approve
//                         </Button>
//                       )}
//                       <Button
//                         size="xs"
//                         variant="danger"
//                         loading={savingId === merchant.id}
//                         onClick={() => update(merchant, "rejected")}
//                       >
//                         Reject
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* SECTION: Mobile/Tablet Card View (Visible on Mobile & Medium Screens) */}
//       <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
//         {loading ? (
//           <div className="p-6 text-center text-pos-muted bg-pos-card rounded-xl border border-pos-border col-span-full">
//             Loading merchants…
//           </div>
//         ) : filteredMerchants.length === 0 ? (
//           <div className="p-6 text-center text-pos-muted bg-pos-card rounded-xl border border-pos-border col-span-full">
//             No merchants found matching the filter criteria.
//           </div>
//         ) : (
//           filteredMerchants.map((merchant) => (
//             <div
//               key={merchant.id}
//               className="bg-pos-card border border-pos-border rounded-xl p-4 space-y-3"
//             >
//               <div className="flex items-start justify-between gap-2">
//                 <div>
//                   <h3 className="font-semibold text-pos-text">
//                     {merchant.businessName}
//                   </h3>
//                   <p className="text-xs text-pos-muted">{merchant.ownerName}</p>
//                   <p className="text-xs text-pos-muted">{merchant.email}</p>
//                 </div>
//                 <Badge
//                   variant={
//                     merchant.approvalStatus === "approved"
//                       ? "success"
//                       : merchant.approvalStatus === "rejected"
//                         ? "danger"
//                         : "warning"
//                   }
//                 >
//                   {merchant.approvalStatus}
//                 </Badge>
//               </div>

//               <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-pos-border/40">
//                 <div>
//                   <span className="text-pos-muted block">
//                     Plan (Req / Active):
//                   </span>
//                   <span className="font-medium text-pos-text capitalize">
//                     {merchant.requestedTier ?? merchant.tier} / {merchant.tier}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-pos-muted block">Outlets:</span>
//                   <span className="font-medium text-pos-text">
//                     {merchant.outletCount}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-pos-muted block">Expiry:</span>
//                   <span className="font-medium text-pos-text">
//                     {new Date(merchant.subscriptionExpiry).toLocaleDateString()}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-pos-muted block">Created:</span>
//                   <span className="font-medium text-pos-text">
//                     {new Date(merchant.createdAt).toLocaleDateString()}
//                   </span>
//                 </div>
//               </div>

//               <div className="flex items-center justify-between gap-2 pt-1">
//                 <select
//                   className="bg-pos-input border border-pos-border rounded px-2 py-1 text-xs"
//                   value={merchant.tier}
//                   onChange={(event) =>
//                     update(
//                       merchant,
//                       undefined,
//                       event.target.value as MerchantTier,
//                     )
//                   }
//                   disabled={savingId === merchant.id}
//                 >
//                   {tierOptions.map((tier) => (
//                     <option key={tier} value={tier}>
//                       {tier}
//                     </option>
//                   ))}
//                 </select>

//                 <div className="flex items-center gap-2">
//                   {merchant.approvalStatus !== "approved" && (
//                     <Button
//                       size="xs"
//                       variant="success"
//                       loading={savingId === merchant.id}
//                       onClick={() =>
//                         update(
//                           merchant,
//                           "approved",
//                           merchant.requestedTier ?? merchant.tier,
//                         )
//                       }
//                     >
//                       Approve
//                     </Button>
//                   )}
//                   <Button
//                     size="xs"
//                     variant="danger"
//                     loading={savingId === merchant.id}
//                     onClick={() => update(merchant, "rejected")}
//                   >
//                     Reject
//                   </Button>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </main>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  RefreshCw,
  Users,
  Clock,
  UserX,
  Layers,
  Search,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import type { MerchantTier } from "@/types";
import { MerchantList, type MerchantRow } from "./MerchantList";
export default function MerchantManagement() {
  const { logoutAdmin, adminSession } = useAuth();
  const { success, error: showError } = useToast();
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const [
        { data: merchantRows, error: merchantError },
        { data: outletRows, error: outletError },
      ] = await Promise.all([
        supabase
          .from("merchants")
          .select(
            "id, business_name, owner_name, email, phone, tier, subscription_status, subscription_expiry, approval_status, requested_tier, billing_cycle, approved_at, deletion_scheduled_at, currency, tax_rate, created_at, updated_at",
          )
          .order("created_at", { ascending: false }),
        supabase.from("outlets").select("merchant_id"),
      ]);

      if (merchantError || outletError) throw merchantError || outletError;

      const counts = new Map<string, number>();
      (outletRows ?? []).forEach((outlet: { merchant_id: string }) =>
        counts.set(
          outlet.merchant_id,
          (counts.get(outlet.merchant_id) ?? 0) + 1,
        ),
      );

      setMerchants(
        (merchantRows ?? []).map((row: any) => ({
          id: row.id,
          businessName: row.business_name,
          ownerName: row.owner_name,
          email: row.email,
          phone: row.phone,
          passwordHash: "",
          tier: row.tier,
          subscriptionStatus: row.subscription_status,
          subscriptionExpiry: row.subscription_expiry,
          approvalStatus: row.approval_status,
          requestedTier: row.requested_tier ?? undefined,
          billingCycle: row.billing_cycle ?? undefined,
          approvedAt: row.approved_at ?? undefined,
          deletionScheduledAt: row.deletion_scheduled_at ?? undefined,
          currency: row.currency,
          taxRate: Number(row.tax_rate),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          syncStatus: "synced",
          outletCount: counts.get(row.id) ?? 0,
        })),
      );
    } catch (error: any) {
      showError(error.message || "Unable to load merchant accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const expiring = useMemo(
    () =>
      merchants.filter((m) => {
        const days =
          (new Date(m.subscriptionExpiry).getTime() - Date.now()) / 86_400_000;
        return m.approvalStatus === "approved" && days >= 0 && days <= 14;
      }),
    [merchants],
  );

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    const plans: Record<MerchantTier, number> = {
      basic: 0,
      standard: 0,
      premium: 0,
    };

    merchants.forEach((m) => {
      if (m.approvalStatus === "approved") {
        approved++;
        if (plans[m.tier] !== undefined) plans[m.tier]++;
      } else if (m.approvalStatus === "rejected") {
        rejected++;
      } else {
        pending++;
      }
    });

    return { pending, approved, rejected, plans };
  }, [merchants]);

  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.businessName.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);

      const matchesStatus =
        approvalFilter === "all" || m.approvalStatus === approvalFilter;

      let matchesDate = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && new Date(m.createdAt) >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(m.createdAt) <= end;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [merchants, searchQuery, startDate, endDate, approvalFilter]);

  const hasActiveFilters =
    searchQuery || startDate || endDate || approvalFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setApprovalFilter("all");
  };

  const update = async (
    merchant: MerchantRow,
    approval?: "approved" | "rejected",
    tier?: MerchantTier,
  ) => {
    setSavingId(merchant.id);
    try {
      const { error } = await supabase.functions.invoke("admin-merchant", {
        body: {
          merchantId: merchant.id,
          approvalStatus: approval ?? null,
          tier: tier ?? null,
          expiry:
            approval === "approved"
              ? new Date(Date.now() + 30 * 86_400_000).toISOString()
              : null,
        },
      });
      if (error) throw error;
      success("Merchant account updated.");
      await load();
    } catch (error: any) {
      showError(error.message || "Merchant update failed.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-pos-bg p-3 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-pos-text">
            Merchant Management
          </h1>
          <p className="text-xs sm:text-sm text-pos-muted">
            Signed in as {adminSession?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={<RefreshCw size={15} />}
            onClick={load}
            className="w-full sm:w-auto"
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            icon={<LogOut size={15} />}
            onClick={logoutAdmin}
            className="w-full sm:w-auto"
          >
            Sign out
          </Button>
        </div>
      </header>

      {/* Above the fold metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
          <div className="flex items-center justify-between text-pos-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Active Accounts
            </span>
            <Users size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-pos-text">
            {stats.approved}
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-pos-border/40 text-xs text-pos-muted">
            <span>
              Basic: <strong>{stats.plans.basic}</strong>
            </span>
            <span>·</span>
            <span>
              Std: <strong>{stats.plans.standard}</strong>
            </span>
            <span>·</span>
            <span>
              Prem: <strong>{stats.plans.premium}</strong>
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
          <div className="flex items-center justify-between text-pos-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Pending Approvals
            </span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-pos-text">
            {stats.pending}
          </div>
          <p className="text-xs text-pos-muted pt-1 border-t border-pos-border/40">
            Requires admin action
          </p>
        </div>

        <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
          <div className="flex items-center justify-between text-pos-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Rejected Users
            </span>
            <UserX size={18} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-pos-text">
            {stats.rejected}
          </div>
          <p className="text-xs text-pos-muted pt-1 border-t border-pos-border/40">
            Access denied accounts
          </p>
        </div>

        <div className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-2">
          <div className="flex items-center justify-between text-pos-muted">
            <span className="text-xs font-medium uppercase tracking-wider">
              Total Merchants
            </span>
            <Layers size={18} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-pos-text">
            {merchants.length}
          </div>
          <p className="text-xs text-pos-muted pt-1 border-t border-pos-border/40">
            All registered records
          </p>
        </div>
      </section>

      {expiring.length > 0 && (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-200">
          {expiring.length} approved merchant account(s) expire within 14 days.
        </section>
      )}

      {/* Filter bar */}
      <section className="rounded-xl border border-pos-border bg-pos-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted h-4 w-4" />
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-pos-input border border-pos-border rounded-lg text-pos-text focus:outline-none focus:ring-1 focus:ring-amber-500 capitalize"
            >
              <option value="all">All Approvals</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-pos-border/40 text-xs">
            <span className="text-pos-muted">
              Showing {filteredMerchants.length} of {merchants.length} merchants
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
            >
              <X size={14} /> Clear filters
            </button>
          </div>
        )}
      </section>

      {/* List Component */}
      <MerchantList
        merchants={filteredMerchants}
        loading={loading}
        savingId={savingId}
        onUpdate={update}
      />
    </main>
  );
}
