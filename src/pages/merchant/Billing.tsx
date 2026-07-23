// import { useState } from "react";
// import {
//   CreditCard,
//   CheckCircle,
//   AlertCircle,
//   ArrowUpCircle,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import Header from "@/components/layout/Header";
// import Button from "@/components/ui/Button";
// import Badge from "@/components/ui/Badge";
// import { TIER_LIMITS, type MerchantTier } from "@/types";
// import { formatCurrency, formatDateShort } from "@/utils/helpers";
// import { useToast } from "@/components/ui/Toast";

// export default function BillingPage() {
//   const { merchantSession, updateMerchant } = useAuth();
//   const { success, info } = useToast();
//   const merchant = merchantSession!.merchant;
//   const [upgrading, setUpgrading] = useState(false);

//   const tierOrder: MerchantTier[] = ["basic", "standard", "premium"];
//   const currentIdx = tierOrder.indexOf(merchant.tier);

//   const handleUpgrade = async (tier: MerchantTier) => {
//     setUpgrading(true);
//     try {
//       // In a real integration, initiate Paystack/Flutterwave payment here
//       info("Payment gateway integration required. Contact support to upgrade.");
//       // Simulate upgrade for demo
//       await updateMerchant({
//         tier,
//         subscriptionStatus: "active",
//         syncStatus: "pending",
//       });
//       success(`Upgraded to ${TIER_LIMITS[tier].name} plan!`);
//     } finally {
//       setUpgrading(false);
//     }
//   };

//   const isExpired = merchant.subscriptionStatus === "expired";
//   const isTrial = merchant.subscriptionStatus === "trial";

//   return (
//     <div>
//       <Header
//         title="Billing & Subscription"
//         subtitle="Manage your plan and payment"
//       />
//       <div className="p-6 space-y-6 max-w-4xl">
//         <div className="bg-pos-card border border-pos-border rounded-xl p-6">
//           <div className="flex items-start justify-between mb-6">
//             <div>
//               <h3 className="font-semibold text-pos-text text-lg">
//                 Current Plan
//               </h3>
//               <p className="text-sm text-pos-muted mt-1">
//                 Active subscription details
//               </p>
//             </div>
//             <Badge
//               variant={
//                 merchant.subscriptionStatus === "active"
//                   ? "success"
//                   : merchant.subscriptionStatus === "trial"
//                     ? "info"
//                     : "danger"
//               }
//               dot
//             >
//               {merchant.subscriptionStatus.charAt(0).toUpperCase() +
//                 merchant.subscriptionStatus.slice(1)}
//             </Badge>
//           </div>

//           <div className="grid grid-cols-3 gap-6">
//             <div>
//               <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
//                 Plan
//               </p>
//               <p className="text-xl font-bold text-pos-text">
//                 {TIER_LIMITS[merchant.tier].name}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
//                 Monthly Price
//               </p>
//               <p className="text-xl font-bold text-pos-text">
//                 {formatCurrency(TIER_LIMITS[merchant.tier].price)}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
//                 Outlets Allowed
//               </p>
//               <p className="text-xl font-bold text-pos-text">
//                 {TIER_LIMITS[merchant.tier].maxOutlets}
//               </p>
//             </div>
//           </div>

//           {isTrial && (
//             <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
//               <AlertCircle size={16} />
//               Trial expires {formatDateShort(merchant.subscriptionExpiry)}.
//               Upgrade to keep access.
//             </div>
//           )}
//           {isExpired && (
//             <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
//               <AlertCircle size={16} />
//               Your subscription has expired. Renew to restore full access.
//             </div>
//           )}
//         </div>

//         <div>
//           <h3 className="font-semibold text-pos-text mb-4">Available Plans</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             {(["basic", "standard", "premium"] as MerchantTier[]).map(
//               (tier, idx) => {
//                 const info = TIER_LIMITS[tier];
//                 const isCurrent = merchant.tier === tier;
//                 const canUpgrade = idx > currentIdx;
//                 const isDowngrade = idx < currentIdx;
//                 return (
//                   <div
//                     key={tier}
//                     className={`bg-pos-card border-2 rounded-xl p-5 transition-all duration-200 ${
//                       isCurrent ? "border-blue-500" : "border-pos-border"
//                     }`}
//                   >
//                     {tier === "standard" && (
//                       <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mb-3">
//                         Popular
//                       </span>
//                     )}
//                     <p className="font-bold text-pos-text text-lg">
//                       {info.name}
//                     </p>
//                     <p className="text-2xl font-bold text-blue-400 mt-1">
//                       {formatCurrency(info.price)}
//                       <span className="text-sm text-pos-muted font-normal">
//                         /month
//                       </span>
//                     </p>
//                     <ul className="mt-4 space-y-2">
//                       {[
//                         `${info.maxOutlets} outlet${info.maxOutlets > 1 ? "s" : ""}`,
//                         "Inventory management",
//                         "Sales reporting",
//                         "Customer management",
//                         ...(tier !== "basic"
//                           ? ["Staff management", "Expense tracking"]
//                           : []),
//                         ...(tier === "premium"
//                           ? ["Advanced analytics", "Priority support"]
//                           : []),
//                       ].map((f) => (
//                         <li
//                           key={f}
//                           className="flex items-center gap-2 text-xs text-pos-muted"
//                         >
//                           <CheckCircle
//                             size={12}
//                             className="text-emerald-400 shrink-0"
//                           />
//                           {f}
//                         </li>
//                       ))}
//                     </ul>
//                     <div className="mt-5">
//                       {isCurrent ? (
//                         <div className="flex items-center justify-center gap-1.5 py-2 text-sm text-emerald-400 font-medium">
//                           <CheckCircle size={14} />
//                           Current Plan
//                         </div>
//                       ) : canUpgrade ? (
//                         <Button
//                           className="w-full"
//                           icon={<ArrowUpCircle size={15} />}
//                           onClick={() => handleUpgrade(tier)}
//                           loading={upgrading}
//                         >
//                           Upgrade to {info.name}
//                         </Button>
//                       ) : (
//                         <Button variant="ghost" className="w-full" disabled>
//                           {isDowngrade ? "Downgrade" : "Current"}
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               },
//             )}
//           </div>
//         </div>

//         <div className="bg-pos-card border border-pos-border rounded-xl p-5">
//           <div className="flex items-center gap-3 mb-4">
//             <CreditCard size={18} className="text-blue-400" />
//             <h3 className="font-semibold text-pos-text">Payment Methods</h3>
//           </div>
//           <p className="text-sm text-pos-muted">
//             Payment is processed via Paystack or Flutterwave. Bank transfer and
//             card payments supported. Contact{" "}
//             <span className="text-blue-400">billing@naijapos.com</span> for
//             manual renewal.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

// Fixed: Swapped out relative module tracking paths for clean absolute path targets
import { TIER_LIMITS, type MerchantTier } from "@/types";
import { formatCurrency, formatDateShort } from "@/utils/helpers";

export default function BillingPage() {
  const { merchantSession, updateMerchant } = useAuth();
  const { success, info } = useToast();
  const merchant = merchantSession!.merchant;
  const [upgrading, setUpgrading] = useState(false);

  const tierOrder: MerchantTier[] = ["basic", "standard", "premium"];
  const currentIdx = tierOrder.indexOf(merchant.tier);

  const handleUpgrade = async (tier: MerchantTier) => {
    setUpgrading(true);
    try {
      // In a real integration, initiate Paystack/Flutterwave payment here
      info("Payment gateway integration required. Contact support to upgrade.");
      // Simulate upgrade for demo
      await updateMerchant({
        tier,
        subscriptionStatus: "active",
        syncStatus: "pending",
      });
      success(`Upgraded to ${TIER_LIMITS[tier].name} plan!`);
    } finally {
      setUpgrading(false);
    }
  };

  const isExpired = merchant.subscriptionStatus === "expired";
  const isTrial = merchant.subscriptionStatus === "trial";

  return (
    <div>
      <Header
        title="Billing & Subscription"
        subtitle="Manage your plan and payment"
      />
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="bg-pos-card border border-pos-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-pos-text text-lg">
                Current Plan
              </h3>
              <p className="text-sm text-pos-muted mt-1">
                Active subscription details
              </p>
            </div>
            <Badge
              variant={
                merchant.subscriptionStatus === "active"
                  ? "success"
                  : merchant.subscriptionStatus === "trial"
                    ? "info"
                    : "danger"
              }
              dot
            >
              {merchant.subscriptionStatus.charAt(0).toUpperCase() +
                merchant.subscriptionStatus.slice(1)}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
                Plan
              </p>
              <p className="text-xl font-bold text-pos-text">
                {TIER_LIMITS[merchant.tier].name}
              </p>
            </div>
            <div>
              <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
                Monthly Price
              </p>
              <p className="text-xl font-bold text-pos-text">
                {formatCurrency(TIER_LIMITS[merchant.tier].price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
                Outlets Allowed
              </p>
              <p className="text-xl font-bold text-pos-text">
                {TIER_LIMITS[merchant.tier].maxOutlets}
              </p>
            </div>
          </div>

          {isTrial && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
              <AlertCircle size={16} />
              Trial expires {formatDateShort(merchant.subscriptionExpiry)}.
              Upgrade to keep access.
            </div>
          )}
          {isExpired && (
            <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={16} />
              Your subscription has expired. Renew to restore full access.
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-pos-text mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["basic", "standard", "premium"] as MerchantTier[]).map(
              (tier, idx) => {
                const info = TIER_LIMITS[tier];
                const isCurrent = merchant.tier === tier;
                const canUpgrade = idx > currentIdx;
                const isDowngrade = idx < currentIdx;
                return (
                  <div
                    key={tier}
                    className={`bg-pos-card border-2 rounded-xl p-5 transition-all duration-200 ${
                      isCurrent ? "border-blue-500" : "border-pos-border"
                    }`}
                  >
                    {tier === "standard" && (
                      <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mb-3">
                        Popular
                      </span>
                    )}
                    <p className="font-bold text-pos-text text-lg">
                      {info.name}
                    </p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {formatCurrency(info.price)}
                      <span className="text-sm text-pos-muted font-normal">
                        /month
                      </span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {[
                        `${info.maxOutlets} outlet${info.maxOutlets > 1 ? "s" : ""}`,
                        "Inventory management",
                        "Sales reporting",
                        "Customer management",
                        ...(tier !== "basic"
                          ? ["Staff management", "Expense tracking"]
                          : []),
                        ...(tier === "premium"
                          ? ["Advanced analytics", "Priority support"]
                          : []),
                      ].map((f) => (
                        <li
                          key={f}
                          className="flex items-center gap-2 text-xs text-pos-muted"
                        >
                          <CheckCircle
                            size={12}
                            className="text-emerald-400 shrink-0"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">
                      {isCurrent ? (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-sm text-emerald-400 font-medium">
                          <CheckCircle size={14} />
                          Current Plan
                        </div>
                      ) : canUpgrade ? (
                        <Button
                          className="w-full"
                          icon={<ArrowUpCircle size={15} />}
                          onClick={() => handleUpgrade(tier)}
                          loading={upgrading}
                        >
                          Upgrade to {info.name}
                        </Button>
                      ) : (
                        <Button variant="ghost" className="w-full" disabled>
                          {isDowngrade ? "Downgrade" : "Current"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        <div className="bg-pos-card border border-pos-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard size={18} className="text-blue-400" />
            <h3 className="font-semibold text-pos-text">Payment Methods</h3>
          </div>
          <p className="text-sm text-pos-muted">
            Payment is processed via Paystack or Flutterwave. Bank transfer and
            card payments supported. Contact{" "}
            <span className="text-blue-400">billing@naijapos.com</span> for
            manual renewal.
          </p>
        </div>
      </div>
    </div>
  );
}
