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
import { TIER_LIMITS, type MerchantTier } from "@/types";
import { formatCurrency, formatDateShort } from "@/utils/helpers";

/**
 * BillingPage Component
 * Displays the merchant's current subscription details, status warnings,
 * available tier plans for upgrading, and payment provider instructions.
 */
export default function BillingPage() {
  // Access global context hooks for authentication state and toast notifications
  const { merchantSession, updateMerchant } = useAuth();
  const { success, info } = useToast();

  // Extract current merchant details safely from session
  const merchant = merchantSession!.merchant;

  // Local state to manage loading state during tier upgrades
  const [upgrading, setUpgrading] = useState(false);

  // Define tier hierarchy to determine valid upgrade vs downgrade paths
  const tierOrder: MerchantTier[] = ["basic", "standard", "premium"];
  const currentIdx = tierOrder.indexOf(merchant.tier);

  /**
   * Handles tier upgrade requests.
   * Prompts user with support info and updates merchant subscription details.
   */
  const handleUpgrade = async (tier: MerchantTier) => {
    setUpgrading(true);
    try {
      // Notify merchant regarding manual payment gateway step
      info("Payment gateway integration required. Contact support to upgrade.");

      // Synchronize upgraded tier to the backend / state context
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

  // Status flags for conditional alert banners
  const isExpired = merchant.subscriptionStatus === "expired";
  const isTrial = merchant.subscriptionStatus === "trial";

  return (
    <div>
      {/* Page Navigation Header */}
      <Header
        title="Billing & Subscription"
        subtitle="Manage your plan and payment"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
        {/* ==================================================================== */}
        {/* CURRENT PLAN CARD                                                   */}
        {/* ==================================================================== */}
        <div className="bg-pos-card border border-pos-border rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
            <div>
              <h3 className="font-semibold text-pos-text text-lg">
                Current Plan
              </h3>
              <p className="text-sm text-pos-muted mt-0.5 sm:mt-1">
                Active subscription details
              </p>
            </div>

            {/* Dynamic Status Badge (Active, Trial, Expired) */}
            <div className="self-start sm:self-auto">
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
          </div>

          {/* Current Tier Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 border-t border-pos-border/50 pt-4 sm:border-0 sm:pt-0">
            <div>
              <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
                Plan
              </p>
              <p className="text-lg sm:text-xl font-bold text-pos-text">
                {TIER_LIMITS[merchant.tier].name}
              </p>
            </div>
            <div>
              <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
                Monthly Price
              </p>
              <p className="text-lg sm:text-xl font-bold text-pos-text">
                {formatCurrency(TIER_LIMITS[merchant.tier].price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
                Outlets Allowed
              </p>
              <p className="text-lg sm:text-xl font-bold text-pos-text">
                {TIER_LIMITS[merchant.tier].maxOutlets}
              </p>
            </div>
          </div>

          {/* Alert Banner: Active Trial */}
          {isTrial && (
            <div className="mt-4 flex items-start sm:items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Trial expires {formatDateShort(merchant.subscriptionExpiry)}.
                Upgrade to keep access.
              </span>
            </div>
          )}

          {/* Alert Banner: Subscription Expired */}
          {isExpired && (
            <div className="mt-4 flex items-start sm:items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={16} className="shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Your subscription has expired. Renew to restore full access.
              </span>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* AVAILABLE PLANS GRID                                               */}
        {/* ==================================================================== */}
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
                    className={`bg-pos-card border-2 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between ${
                      isCurrent ? "border-blue-500" : "border-pos-border"
                    }`}
                  >
                    <div>
                      {/* Highlight standard plan as popular choice */}
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

                      {/* Feature Checklist */}
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
                        ].map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-2 text-xs text-pos-muted"
                          >
                            <CheckCircle
                              size={12}
                              className="text-emerald-400 shrink-0"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button Area */}
                    <div className="mt-6">
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

        {/* ==================================================================== */}
        {/* PAYMENT METHODS & SUPPORT INFO                                       */}
        {/* ==================================================================== */}
        <div className="bg-pos-card border border-pos-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <CreditCard size={18} className="text-blue-400 shrink-0" />
            <h3 className="font-semibold text-pos-text">Payment Methods</h3>
          </div>
          <p className="text-xs sm:text-sm text-pos-muted leading-relaxed">
            Payment is processed via Paystack or Flutterwave. Bank transfer and
            card payments supported. Contact{" "}
            <span className="text-blue-400 font-medium">
              billing@KasihPOS .com
            </span>{" "}
            for manual renewal.
          </p>
        </div>
      </div>
    </div>
  );
}
