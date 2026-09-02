import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { Merchant, MerchantTier } from "@/types";

export type MerchantRow = Merchant & { outletCount: number };
const TIER_OPTIONS: MerchantTier[] = ["basic", "standard", "premium"];

interface MerchantListProps {
  merchants: MerchantRow[];
  loading: boolean;
  savingId: string | null;
  onUpdate: (
    merchant: MerchantRow,
    approval?: "approved" | "rejected",
    tier?: MerchantTier
  ) => void;
}

export function MerchantList({
  merchants,
  loading,
  savingId,
  onUpdate,
}: MerchantListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center text-pos-muted bg-pos-card rounded-xl border border-pos-border">
        Loading merchants…
      </div>
    );
  }

  if (merchants.length === 0) {
    return (
      <div className="p-8 text-center text-pos-muted bg-pos-card rounded-xl border border-pos-border">
        No merchants found matching the filter criteria.
      </div>
    );
  }

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-pos-border bg-pos-card">
        <table className="w-full text-sm">
          <thead className="text-left text-pos-muted border-b border-pos-border">
            <tr>
              <th className="p-3">Merchant</th>
              <th className="p-3">Requested / active plan</th>
              <th className="p-3">Outlets</th>
              <th className="p-3">Approval</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr
                key={merchant.id}
                className="border-b border-pos-border/60 hover:bg-pos-input/40 transition-colors"
              >
                <td className="p-3">
                  <p className="font-medium text-pos-text">
                    {merchant.businessName}
                  </p>
                  <p className="text-xs text-pos-muted">
                    {merchant.ownerName} · {merchant.email}
                  </p>
                </td>
                <td className="p-3 capitalize">
                  {merchant.requestedTier ?? merchant.tier} /{" "}
                  <strong>{merchant.tier}</strong>
                </td>
                <td className="p-3">{merchant.outletCount}</td>
                <td className="p-3">
                  <Badge
                    variant={
                      merchant.approvalStatus === "approved"
                        ? "success"
                        : merchant.approvalStatus === "rejected"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {merchant.approvalStatus}
                  </Badge>
                </td>
                <td className="p-3">
                  {new Date(merchant.subscriptionExpiry).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-pos-input border border-pos-border rounded px-2 py-1 text-xs"
                      value={merchant.tier}
                      onChange={(e) =>
                        onUpdate(
                          merchant,
                          undefined,
                          e.target.value as MerchantTier
                        )
                      }
                      disabled={savingId === merchant.id}
                    >
                      {TIER_OPTIONS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                    {merchant.approvalStatus !== "approved" && (
                      <Button
                        size="xs"
                        variant="success"
                        loading={savingId === merchant.id}
                        onClick={() =>
                          onUpdate(
                            merchant,
                            "approved",
                            merchant.requestedTier ?? merchant.tier
                          )
                        }
                      >
                        Approve
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="danger"
                      loading={savingId === merchant.id}
                      onClick={() => onUpdate(merchant, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {merchants.map((merchant) => (
          <div
            key={merchant.id}
            className="bg-pos-card border border-pos-border rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-pos-text">
                  {merchant.businessName}
                </h3>
                <p className="text-xs text-pos-muted">{merchant.ownerName}</p>
                <p className="text-xs text-pos-muted">{merchant.email}</p>
              </div>
              <Badge
                variant={
                  merchant.approvalStatus === "approved"
                    ? "success"
                    : merchant.approvalStatus === "rejected"
                      ? "danger"
                      : "warning"
                }
              >
                {merchant.approvalStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-pos-border/40">
              <div>
                <span className="text-pos-muted block">Plan (Req / Active):</span>
                <span className="font-medium text-pos-text capitalize">
                  {merchant.requestedTier ?? merchant.tier} / {merchant.tier}
                </span>
              </div>
              <div>
                <span className="text-pos-muted block">Outlets:</span>
                <span className="font-medium text-pos-text">
                  {merchant.outletCount}
                </span>
              </div>
              <div>
                <span className="text-pos-muted block">Expiry:</span>
                <span className="font-medium text-pos-text">
                  {new Date(merchant.subscriptionExpiry).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-pos-muted block">Created:</span>
                <span className="font-medium text-pos-text">
                  {new Date(merchant.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <select
                className="bg-pos-input border border-pos-border rounded px-2 py-1 text-xs"
                value={merchant.tier}
                onChange={(e) =>
                  onUpdate(
                    merchant,
                    undefined,
                    e.target.value as MerchantTier
                  )
                }
                disabled={savingId === merchant.id}
              >
                {TIER_OPTIONS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                {merchant.approvalStatus !== "approved" && (
                  <Button
                    size="xs"
                    variant="success"
                    loading={savingId === merchant.id}
                    onClick={() =>
                      onUpdate(
                        merchant,
                        "approved",
                        merchant.requestedTier ?? merchant.tier
                      )
                    }
                  >
                    Approve
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="danger"
                  loading={savingId === merchant.id}
                  onClick={() => onUpdate(merchant, "rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}