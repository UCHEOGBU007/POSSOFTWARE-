import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, LogIn, Smartphone, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * A terminal is deliberately not paired with a reusable outlet PIN. An active
 * staff member authenticates with Supabase Auth and RLS derives their outlet.
 * This works on a new browser without exposing a merchant-wide secret.
 */
export default function OutletLogin() {
  const { loginStaff } = useAuth();
  const { success, error: showError } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      showError("Enter your staff email and password.");
      return;
    }
    setLoading(true);
    try {
      await loginStaff(email.trim().toLowerCase(), password);
      success("Signed in to your assigned outlet.");
      navigate("/outlet/dashboard", { replace: true });
    } catch (error: any) {
      showError(error?.message || "Unable to sign in to this outlet.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg flex flex-col justify-between p-4 sm:p-6">
      <div className="flex w-full justify-between items-center">
        <div className="flex items-center gap-2">
          <Store className="text-blue-500" size={24} />
          <span className="font-bold text-pos-text text-lg">
            Kasih POS Terminal
          </span>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-full border border-pos-border bg-pos-card px-3 py-1.5 text-xs text-pos-muted hover:text-pos-text"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <main className="w-full max-w-md mx-auto py-8">
        <div className="bg-pos-card border border-pos-border rounded-2xl p-6 shadow-xl">
          <div className="text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
              <Smartphone size={28} className="text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-pos-text">
              Staff terminal sign in
            </h1>
            <p className="text-xs text-pos-muted mt-2">
              Sign in with the account assigned to this outlet. Your outlet and
              permissions are loaded securely.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff email"
              type="email"
              autoComplete="username"
              placeholder="cashier@business.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Staff password"
              type="password"
              autoComplete="current-password"
              placeholder="Your staff password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={<LogIn size={18} />}
            >
              Sign in to POS
            </Button>
          </form>
        </div>
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs text-blue-600  hover:text-blue-400 inline-flex items-center gap-1.5"
          >
            <Lock size={12} className="text-blue-600" />
            Merchant Admin Login
          </Link>
        </div>
      </main>
      <p className="text-center text-[11px] text-pos-muted">
        Enterprise POS Framework © 2026
      </p>
    </div>
  );
}
