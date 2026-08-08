import { useState } from "react";
import { Save, User, Building2, Phone, Mail, Percent } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

/**
 * MerchantSettings Component
 * Allows merchants to view and update their core profile details,
 * default tax rates, and base currency configuration.
 */
export default function MerchantSettings() {
  // Context hooks for merchant session data, update handlers, and toast notifications
  const { merchantSession, updateMerchant } = useAuth();
  const { success, error: showError } = useToast();

  // Safely extract active merchant metadata from session
  const merchant = merchantSession!.merchant;

  // Local state initialized with current merchant profile settings
  const [form, setForm] = useState({
    businessName: merchant.businessName,
    ownerName: merchant.ownerName,
    email: merchant.email,
    phone: merchant.phone,
    address: merchant.address ?? "",
    currency: merchant.currency,
    taxRate: merchant.taxRate.toString(), // Convert numeric tax rate to string for input handling
  });

  // Track async saving state to manage button loading status
  const [saving, setSaving] = useState(false);

  /**
   * Validates form inputs and updates merchant configuration on backend.
   */
  const handleSave = async () => {
    // Basic validation for mandatory profile fields
    if (!form.businessName || !form.ownerName || !form.email) {
      showError("Business name, owner name and email are required.");
      return;
    }

    // Tax rate validation (must be a valid percentage between 0 and 100)
    const taxRate = parseFloat(form.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      showError("Tax rate must be between 0 and 100.");
      return;
    }

    setSaving(true);
    try {
      // Persist updated merchant details via context provider action
      await updateMerchant({ ...form, taxRate });
      success("Settings saved successfully.");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your business profile" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        {/* SECTION: Business Profile Info */}
        <div className="bg-pos-card border border-pos-border rounded-xl p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-pos-text text-base sm:text-lg">
            Business Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              leftIcon={<Building2 size={15} />}
            />
            <Input
              label="Owner Name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              leftIcon={<User size={15} />}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={<Mail size={15} />}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              leftIcon={<Phone size={15} />}
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {/* SECTION: Regional Tax & Currency Configuration */}
        <div className="bg-pos-card border border-pos-border rounded-xl p-4 sm:p-6 space-y-4">
          <h3 className="font-semibold text-pos-text text-base sm:text-lg">
            Tax & Currency
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={[
                { value: "NGN", label: "NGN — Nigerian Naira" },
                { value: "USD", label: "USD — US Dollar" },
                { value: "GBP", label: "GBP — British Pound" },
                { value: "GHS", label: "GHS — Ghanaian Cedi" },
                { value: "IDR", label: "IDR — Indonesian Rupiah" },
              ]}
            />
            <Input
              label="Default Tax Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              leftIcon={<Percent size={15} />}
              hint="Applied to all outlets unless overridden"
            />
          </div>
        </div>

        {/* SECTION: Submit Action */}
        <div className="flex justify-start">
          <Button
            onClick={handleSave}
            loading={saving}
            icon={<Save size={16} />}
            size="lg"
            className="w-full sm:w-auto"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
