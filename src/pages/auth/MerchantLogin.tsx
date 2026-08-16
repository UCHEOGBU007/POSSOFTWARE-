// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { ShoppingBag, Mail, Lock, Eye, EyeOff } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import { useToast } from "@/components/ui/Toast";
// import { useTheme } from "@/contexts/ThemeContext";

// export default function MerchantLogin() {
//   const { loginMerchant } = useAuth();
//   const { error: showError } = useToast();
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await loginMerchant(form.email, form.password);
//       navigate("/merchant/dashboard");
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-pos-bg flex">
//       <div className="hidden lg:flex w-1/2 bg-pos-sidebar border-r border-pos-border flex-col justify-between p-12">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
//             <ShoppingBag size={20} className="text-white" />
//           </div>
//           <span className="font-bold text-pos-text text-lg">KasihPOS  Pro</span>
//         </div>
//         <div>
//           <h2 className="text-3xl font-bold text-pos-text leading-tight mb-4">
//             Power your retail business <br />
//             <span className="text-blue-400">from anywhere.</span>
//           </h2>
//           <p className="text-pos-muted text-sm leading-relaxed">
//             Manage multiple outlets, track inventory, process sales, and grow
//             your business — all in one platform built for Nigerian merchants.
//           </p>
//           <div className="mt-8 grid grid-cols-3 gap-4">
//             {[
//               { label: "Merchants", value: "2,400+" },
//               { label: "Outlets", value: "8,900+" },
//               { label: "Transactions/day", value: "45K+" },
//             ].map((s) => (
//               <div
//                 key={s.label}
//                 className="bg-pos-card rounded-xl p-4 border border-pos-border"
//               >
//                 <p className="text-xl font-bold text-blue-400">{s.value}</p>
//                 <p className="text-xs text-pos-muted mt-1">{s.label}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//         <p className="text-xs text-pos-muted">
//           © 2025 KasihPOS  Pro. All rights reserved.
//         </p>
//       </div>

//       <div className="flex-1 flex items-center justify-center p-6">
//         <div className="w-full max-w-sm">
//           <div className="flex items-center justify-between gap-3 mb-8">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
//                 <ShoppingBag size={18} className="text-white" />
//               </div>
//               <span className="font-bold text-pos-text">KasihPOS  Pro</span>
//             </div>
//             <button
//               type="button"
//               onClick={toggleTheme}
//               className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-2 text-sm text-pos-muted transition-colors hover:text-pos-text"
//             >
//               {theme === "dark" ? <span>☀️</span> : <span>🌙</span>}
//               {theme === "dark" ? "Light" : "Dark"}
//             </button>
//           </div>

//           <h1 className="text-2xl font-bold text-pos-text mb-1">
//             Merchant Login
//           </h1>
//           <p className="text-sm text-pos-muted mb-8">
//             Sign in to manage your business
//           </p>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <Input
//               label="Email Address"
//               type="email"
//               placeholder="you@business.com"
//               value={form.email}
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//               leftIcon={<Mail size={15} />}
//               required
//             />
//             <Input
//               label="Password"
//               type={showPw ? "text" : "password"}
//               placeholder="••••••••"
//               value={form.password}
//               onChange={(e) => setForm({ ...form, password: e.target.value })}
//               leftIcon={<Lock size={15} />}
//               rightIcon={
//                 <button
//                   type="button"
//                   onClick={() => setShowPw(!showPw)}
//                   className="pointer-events-auto cursor-pointer"
//                 >
//                   {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
//                 </button>
//               }
//               required
//             />
//             <Button
//               type="submit"
//               className="w-full"
//               size="lg"
//               loading={loading}
//             >
//               Sign In
//             </Button>
//           </form>

//           <p className="text-center text-sm text-pos-muted mt-6">
//             No account?{" "}
//             <Link
//               to="/register"
//               className="text-blue-400 hover:text-blue-300 font-medium"
//             >
//               Create one free
//             </Link>
//           </p>

//           <div className="mt-6 pt-6 border-t border-pos-border">
//             <Link
//               to="/outlet-login"
//               className="flex items-center justify-center gap-2 text-sm text-pos-muted hover:text-pos-text transition-colors"
//             >
//               <ShoppingBag size={15} />
//               Staff / Outlet Login
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function MerchantLogin() {
  const { loginMerchant } = useAuth();
  const { error: showError } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginMerchant(form.email, form.password);
      navigate("/merchant/dashboard");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg flex">
      <div className="hidden lg:flex w-1/2 bg-pos-sidebar border-r border-pos-border flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <span className="font-bold text-pos-text text-lg">KasihPOS Pro</span>
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
          {new Date().getFullYear()} KasihPOS Pro. All rights reserved.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <ShoppingBag size={18} className="text-white" />
              </div>
              <span className="font-bold text-pos-text">KasihPOS Pro</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-2 text-sm text-pos-muted transition-colors hover:text-pos-text"
            >
              {theme === "dark" ? <span>☀️</span> : <span>🌙</span>}
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>

          <h1 className="text-2xl font-bold text-pos-text mb-1">
            Merchant Login
          </h1>
          <p className="text-sm text-pos-muted mb-8">
            Sign in to manage your business
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@business.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={<Mail size={15} />}
              required
            />
            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              leftIcon={<Lock size={15} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="pointer-events-auto cursor-pointer"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-pos-muted mt-6">
            No account?{" "}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Create one free
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-pos-border">
            <Link
              to="/outlet-login"
              className="flex items-center justify-center gap-2 text-sm text-pos-muted hover:text-pos-text transition-colors"
            >
              <ShoppingBag size={15} />
              Staff / Outlet Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
