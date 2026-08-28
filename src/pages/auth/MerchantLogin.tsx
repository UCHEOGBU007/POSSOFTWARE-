import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  // ShoppingBag,
  Sun,
  Moon,
  KeyRound,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";
import { supabase } from "../../lib/supabase"; // Adjust path to your supabase client
import logo from "@/assest/logo1.svg";

export default function MerchantLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);

  const { loginMerchant } = useAuth() as any;
  const { theme, toggleTheme } = useTheme();

  const toastContext = useToast() as any;
  const triggerToast =
    toastContext?.showToast || toastContext?.toast || toastContext?.addToast;

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      if (triggerToast) triggerToast("Please fill in all fields", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionResult: any = await loginMerchant(email, password);

      if (triggerToast) triggerToast("Login successful!", "success");

      const isStaffUser =
        sessionResult?.staff ||
        sessionResult?.role === "staff" ||
        sessionResult?.type === "outlet" ||
        Boolean(sessionResult?.outletId);

      if (isStaffUser) {
        navigate("/outlet/dashboard", { replace: true });
      } else {
        navigate("/merchant/dashboard", { replace: true });
      }
    } catch (err: any) {
      if (triggerToast) {
        triggerToast(err.message || "Failed to log in", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resetEmail.trim().toLowerCase();

    if (!targetEmail) {
      if (triggerToast)
        triggerToast("Please enter your registered email", "error");
      return;
    }

    setIsSendingReset(true);
    try {
      // 1. Verify existence in Supabase database before sending reset link
      const { data: merchant, error: checkError } = await supabase
        .from("merchants") // Adjust table name if you use 'profiles' or 'users'
        .select("id, email")
        .eq("email", targetEmail)
        .maybeSingle();

      if (checkError) {
        throw new Error("Unable to verify merchant account right now.");
      }

      if (!merchant) {
        throw new Error(
          "No registered merchant account found with this email.",
        );
      }

      // 2. Trigger Supabase native reset password link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        targetEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) {
        throw new Error(resetError.message);
      }

      if (triggerToast) {
        triggerToast("Password reset link sent to your email!", "success");
      }
      setShowForgotModal(false);
      setResetEmail("");
    } catch (err: any) {
      if (triggerToast) {
        triggerToast(
          err.message || "Failed to process password reset",
          "error",
        );
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg flex transition-colors duration-200">
      {/* Left Column: STOCKURA Pro Hero Section */}
      <div className="hidden lg:flex w-1/2 bg-pos-sidebar border-r border-pos-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="STOCKURA Logo"
            className="w-100 h-100 rounded-xl bg-none"
          />
          {/* <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <span className="font-bold text-pos-text text-lg tracking-tight">
            Kasih<span className="text-blue-500">POS</span> Pro
          </span> */}
        </div>

        <div>
          <h2 className="text-3xl font-bold text-pos-text leading-tight mb-4">
            Power your retail business <br />
            <span className="text-blue-400">from anywhere.</span>
          </h2>
          <p className="text-pos-muted text-sm leading-relaxed">
            Manage multiple outlets, track inventory, process sales, and grow
            your business — all in one platform built for Nigerian merchants.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: "Merchants", value: "2,400+" },
              { label: "Outlets", value: "8,900+" },
              { label: "Transactions/day", value: "45K+" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-pos-card rounded-xl p-4 border border-pos-border"
              >
                <p className="text-xl font-bold text-blue-400">{s.value}</p>
                <p className="text-xs text-pos-muted mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-pos-muted">
          {new Date().getFullYear()} PT. Tech Solusions Group. All rights
          reserved.
        </p>
      </div>

      {/* Right Column: Login Form & Theme Toggle */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 relative">
        {/* Theme Toggle Button */}
        <div className="absolute top-6 right-6">
          <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl border border-pos-border bg-pos-card text-pos-text hover:bg-pos-border/30 transition-colors shadow-sm focus:outline-none"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} className="text-slate-700" />
            )}
          </button>
        </div>

        {/* Mobile Header Branding */}
        <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
          {/* <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-pos-text">
            Kasih<span className="text-blue-600">POS</span>
          </span> */}
          <img
            src={logo}
            alt="STOCKURA Logo"
            className="w-50 h-50 rounded-xl bg-none"
          />
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-pos-text">
            Merchant Portal
          </h2>
          <p className="mt-2 text-sm text-pos-muted">
            Manage your multi-outlet business, staff, and real-time analytics
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-pos-card py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-pos-border">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-pos-text mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="block w-full rounded-xl border border-pos-border bg-pos-bg px-3.5 py-2.5 text-pos-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-pos-text"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-pos-border bg-pos-bg px-3.5 py-2.5 text-pos-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
              </button>
            </form>

            <div className="mt-6 border-t border-pos-border pt-6 flex flex-col space-y-3 text-center text-sm">
              <div>
                <span className="text-pos-muted">Don't have an account? </span>
                <Link
                  to="/register"
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Register Merchant
                </Link>
              </div>
              <div>
                <span className="text-pos-muted">
                  Are you an outlet staff member?{" "}
                </span>
                <Link
                  to="/outlet-login"
                  className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Outlet Staff Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-pos-card border border-pos-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
              <KeyRound size={24} />
            </div>

            <h3 className="text-xl font-bold text-pos-text">
              Reset Merchant Password
            </h3>
            <p className="text-sm text-pos-muted mt-1 mb-6">
              Enter your registered merchant email address to receive a password
              reset link.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pos-text mb-1">
                  Registered Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="merchant@example.com"
                    className="block w-full rounded-xl border border-pos-border bg-pos-bg pl-10 pr-3.5 py-2.5 text-pos-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm transition-all"
                  />
                  <Mail
                    size={18}
                    className="absolute left-3 top-3 text-pos-muted"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-pos-border text-pos-text hover:bg-pos-border/30 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
                >
                  {isSendingReset ? "Verifying..." : "Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
