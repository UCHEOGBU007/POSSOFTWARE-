import { useState } from "react";
import { Database, Wifi, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function OutletSettings() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const { success, error: showError } = useToast();
  const [cleaning, setCleaning] = useState(false);

  const handleCleanSyncedData = async () => {
    if (
      !confirm(
        "This will delete all sales, movements and expenses that have been synced to the cloud. Continue?",
      )
    )
      return;
    setCleaning(true);
    try {
      await db.deleteSyncedData(outlet.id);
      success("Synced data cleared from local storage.");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div>
      <Header title="Outlet Settings" subtitle={outlet.name} />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="bg-pos-card border border-pos-border rounded-xl p-6 space-y-3">
          <h3 className="font-semibold text-pos-text">Outlet Info</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-pos-muted text-xs mb-1">Name</p>
              <p className="text-pos-text">{outlet.name}</p>
            </div>
            <div>
              <p className="text-pos-muted text-xs mb-1">Address</p>
              <p className="text-pos-text">{outlet.address}</p>
            </div>
            <div>
              <p className="text-pos-muted text-xs mb-1">Phone</p>
              <p className="text-pos-text">{outlet.phone || "—"}</p>
            </div>
            <div>
              <p className="text-pos-muted text-xs mb-1">Tax</p>
              <p className="text-pos-text">
                {outlet.taxEnabled ? "Enabled (7.5% VAT)" : "Disabled"}
              </p>
            </div>
          </div>
          <p className="text-xs text-pos-muted">
            To change outlet settings, ask your merchant administrator.
          </p>
        </div>

        <div className="bg-pos-card border border-pos-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-blue-400" />
            <h3 className="font-semibold text-pos-text">
              Offline Data Management
            </h3>
          </div>
          <p className="text-sm text-pos-muted">
            NaijaPOS Pro stores data locally for offline use. Once data is
            synced to the cloud, you can clear it from the browser to free up
            storage.
          </p>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            Only clear synced data after confirming your cloud backup is
            complete.
          </div>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            loading={cleaning}
            onClick={handleCleanSyncedData}
          >
            Clear Synced Local Data
          </Button>
        </div>

        <div className="bg-pos-card border border-pos-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={18} className="text-blue-400" />
            <h3 className="font-semibold text-pos-text">Sync Status</h3>
          </div>
          <p className="text-sm text-pos-muted">
            Supabase sync is manually triggered. Connect to the internet and use
            the sync feature to push data to the cloud. All unsynced records are
            marked <span className="text-amber-400 font-medium">pending</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
