import { useEffect, useMemo, useState } from "react";
import { FileText, Filter, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import { getSupabaseConfigStatus, supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { formatDate } from "@/utils/helpers";
import type { AuditAction, AuditLog, Outlet } from "@/types";

const actionLabels: Record<AuditAction, string> = {
  product_added: "Product added",
  product_edited: "Product edited",
  product_deleted: "Product deleted",
  sale_refunded: "Sale refunded",
};

export default function ActivityLog() {
  const { merchantSession } = useAuth();
  const merchant = merchantSession!.merchant;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletId, setOutletId] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const configured = getSupabaseConfigStatus().isConfigured;
      let availableOutlets: Outlet[];
      let records: AuditLog[];
      if (configured) {
        const { data: outletRows, error: outletError } = await supabase
          .from("outlets")
          .select("*")
          .eq("merchant_id", merchant.id);
        if (outletError) throw outletError;
        availableOutlets = (outletRows ?? []).map(
          (row: any) =>
            ({
              id: row.id,
              merchantId: row.merchant_id,
              name: row.name,
            }) as Outlet,
        );
        const ids = availableOutlets.map((outlet) => outlet.id);
        if (!ids.length) records = [];
        else {
          const { data, error } = await supabase
            .from("audit_logs")
            .select("*")
            .in("outlet_id", ids)
            .order("created_at", { ascending: false });
          if (error) throw error;
          records = (data ?? []).map((row: any) => ({
            id: row.id,
            outletId: row.outlet_id,
            action: row.action,
            actorId: row.actor_id,
            actorName: row.actor_name,
            actorRole: row.actor_role,
            productId: row.product_id,
            productName: row.product_name,
            saleId: row.sale_id,
            receiptNumber: row.receipt_number,
            details: row.details,
            createdAt: row.created_at,
            syncStatus: "synced",
          }));
          await db.auditLogs.bulkPut(records);
        }
      } else {
        availableOutlets = await db.outlets
          .where("merchantId")
          .equals(merchant.id)
          .toArray();
        records = await db.auditLogs
          .where("outletId")
          .anyOf(availableOutlets.map((outlet) => outlet.id))
          .reverse()
          .sortBy("createdAt");
      }
      if (mounted) {
        setOutlets(availableOutlets);
        setLogs(records);
      }
    };
    load().catch((error) =>
      console.error("Unable to load activity log:", error),
    );
    return () => {
      mounted = false;
    };
  }, [merchant.id]);

  const filtered = useMemo(
    () =>
      logs.filter(
        (log) =>
          (!outletId || log.outletId === outletId) &&
          (!action || log.action === action) &&
          (!dateFrom || log.createdAt >= `${dateFrom}T00:00:00`) &&
          (!dateTo || log.createdAt <= `${dateTo}T23:59:59.999`),
      ),
    [logs, outletId, action, dateFrom, dateTo],
  );
  const refundCount = useMemo(
    () =>
      logs.filter(
        (log) =>
          log.action === "sale_refunded" &&
          Date.now() - new Date(log.createdAt).getTime() <= 10 * 60 * 1000,
      ).length,
    [logs],
  );

  const printLog = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !filtered.length) return;
    printWindow.document.write(
      `<html><head><title>Merchant Activity Log</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#172033}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d8dee9;padding:8px;text-align:left}th{background:#f1f5f9}h1{font-size:20px}</style></head><body><h1>Merchant Activity Log</h1><p>Generated ${new Date().toLocaleString()} | ${filtered.length} events</p><table><thead><tr><th>Date</th><th>Outlet</th><th>Action</th><th>Product / Sale</th><th>By</th><th>Details</th></tr></thead><tbody>${filtered.map((log) => `<tr><td>${formatDate(log.createdAt)}</td><td>${outlets.find((outlet) => outlet.id === log.outletId)?.name ?? "Unknown"}</td><td>${actionLabels[log.action]}</td><td>${log.productName ?? log.receiptNumber ?? "-"}</td><td>${log.actorName}</td><td>${log.details ?? "-"}</td></tr>`).join("")}</tbody></table><script>window.onload=function(){window.print();window.close()}</script></body></html>`,
    );
    printWindow.document.close();
  };

  return (
    <div>
      <Header
        title="Activity Log"
        subtitle="Inventory changes and refund history across all outlets"
      />
      <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
        {refundCount > 10 && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <ShieldAlert size={20} className="shrink-0" />
            <div>
              <p className="font-semibold">Refund activity needs attention</p>
              <p className="text-sm">
                Managers processed {refundCount} refunds in the last 10 minutes.
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Select
              value={outletId}
              onChange={(event) => setOutletId(event.target.value)}
              options={[
                { value: "", label: "All outlets" },
                ...outlets.map((outlet) => ({
                  value: outlet.id,
                  label: outlet.name,
                })),
              ]}
            />
            <Input
              label="From date"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              aria-label="Activity from date"
              className="w-full sm:w-40"
            />
            <Input
              label="To date"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              aria-label="Activity to date"
              className="w-full sm:w-40"
            />
            <Select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              options={[
                { value: "", label: "All activity" },
                ...Object.entries(actionLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </div>
          <Button
            variant="secondary"
            icon={<FileText size={15} />}
            onClick={printLog}
          >
            Print / PDF
          </Button>
        </div>
        <div className="bg-pos-card border border-pos-border rounded-xl overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead>
              <tr className="border-b border-pos-border">
                {[
                  "Date",
                  "Outlet",
                  "Action",
                  "Product / Sale",
                  "By",
                  "Details",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs uppercase text-pos-muted"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pos-border">
              {filtered.length ? (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-xs text-pos-muted">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-pos-text">
                      {outlets.find((outlet) => outlet.id === log.outletId)
                        ?.name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          log.action === "sale_refunded"
                            ? "warning"
                            : log.action === "product_deleted"
                              ? "danger"
                              : "success"
                        }
                      >
                        {actionLabels[log.action]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-pos-text">
                      {log.productName ?? log.receiptNumber ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-pos-text">
                      {log.actorName}
                      {log.actorRole ? (
                        <span className="block text-xs text-pos-muted">
                          {log.actorRole}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-pos-muted">
                      {log.details ?? "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-pos-muted"
                  >
                    <Filter size={20} className="mx-auto mb-2 opacity-50" />
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
