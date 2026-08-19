// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import {
//   ShoppingBag,
//   Building2,
//   User,
//   Mail,
//   Phone,
//   Lock,
//   Eye,
//   EyeOff,
//   CheckCircle,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import { useToast } from "@/components/ui/Toast";
// import { useTheme } from "@/contexts/ThemeContext";
// import { TIER_LIMITS, type MerchantTier } from "@/types/index";
// import { formatCurrency } from "@/utils/helpers";

// const tiers: { key: MerchantTier; features: string[] }[] = [
//   {
//     key: "basic",
//     features: [
//       "1 outlet",
//       "Unlimited products",
//       "Sales reports",
//       "Customer management",
//       "Staff management",
//       "Expense tracking",
//       "Advanced analytics",
//       "Priority support",
//     ],
//   },
//   {
//     key: "standard",
//     features: [
//       "Up to 5 outlets",
//       "Unlimited products",
//       "Sales reports",
//       "Customer management",
//       "Staff management",
//       "Expense tracking",
//       "Advanced analytics",
//       "Priority support",
//     ],
//   },
//   {
//     key: "premium",
//     features: [
//       "Up to 50 outlets",
//       "Unlimited products",
//       "Sales reports",
//       "Customer management",
//       "Staff management",
//       "Expense tracking",
//       "Advanced analytics",
//       "Priority support",
//     ],
//   },
// ];

// export default function MerchantRegister() {
//   const { registerMerchant } = useAuth();
//   const { error: showError, success } = useToast();
//   const { theme, toggleTheme } = useTheme();
//   const navigate = useNavigate();
//   const [step, setStep] = useState(1);
//   const [selectedTier, setSelectedTier] = useState<MerchantTier>("basic");
//   const [showPw, setShowPw] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [form, setForm] = useState({
//     businessName: "",
//     ownerName: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (form.password !== form.confirmPassword) {
//       showError("Passwords do not match.");
//       return;
//     }
//     if (form.password.length < 8) {
//       showError("Password must be at least 8 characters.");
//       return;
//     }
//     setLoading(true);
//     try {
//       await registerMerchant({ ...form, tier: selectedTier });
//       success("Account created! Welcome to KasihPOS  Pro.");
//       navigate("/merchant/dashboard");
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-pos-bg flex items-center justify-center p-6">
//       <div className="w-full max-w-2xl">
//         <div className="flex items-center justify-between gap-3 mb-8">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
//               <ShoppingBag size={18} className="text-white" />
//             </div>
//             <span className="font-bold text-pos-text">KasihPOS Pro</span>
//           </div>
//           <button
//             type="button"
//             onClick={toggleTheme}
//             className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-2 text-sm text-pos-muted transition-colors hover:text-pos-text"
//           >
//             {theme === "dark" ? <span>☀️</span> : <span>🌙</span>}
//             {theme === "dark" ? "Light" : "Dark"}
//           </button>
//         </div>

//         <div className="flex items-center justify-center gap-2 mb-8">
//           {[1, 2].map((s) => (
//             <div key={s} className="flex items-center gap-2">
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
//                   step >= s
//                     ? "bg-blue-600 text-white"
//                     : "bg-pos-card text-pos-muted border border-pos-border"
//                 }`}
//               >
//                 {step > s ? <CheckCircle size={16} /> : s}
//               </div>
//               {s < 2 && (
//                 <div
//                   className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-pos-border"}`}
//                 />
//               )}
//             </div>
//           ))}
//         </div>

//         {step === 1 && (
//           <div>
//             <h1 className="text-2xl font-bold text-pos-text text-center mb-1">
//               Choose Your Plan
//             </h1>
//             <p className="text-sm text-pos-muted text-center mb-8">
//               Select the tier that fits your business
//             </p>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//               {tiers.map(({ key, features }) => {
//                 const tier = TIER_LIMITS[key];
//                 const isSelected = selectedTier === key;
//                 return (
//                   <button
//                     key={key}
//                     onClick={() => setSelectedTier(key)}
//                     className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${
//                       isSelected
//                         ? "border-blue-500 bg-blue-600/10"
//                         : "border-pos-border bg-pos-card hover:border-pos-border/70"
//                     }`}
//                   >
//                     {key === "standard" && (
//                       <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mb-3 inline-block">
//                         Popular
//                       </span>
//                     )}
//                     <p className="font-bold text-pos-text text-lg">
//                       {tier.name}
//                     </p>
//                     <p className="text-blue-400 font-bold mt-1">
//                       {formatCurrency(tier.price, "IDR")}
//                       <span className="text-xs text-pos-muted font-normal">
//                         /mo
//                       </span>
//                     </p>
//                     <ul className="mt-4 space-y-2">
//                       {features.map((f) => (
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
//                   </button>
//                 );
//               })}
//             </div>
//             <Button onClick={() => setStep(2)} className="w-full" size="lg">
//               Continue with {TIER_LIMITS[selectedTier].name}
//             </Button>
//           </div>
//         )}

//         {step === 2 && (
//           <div>
//             <h1 className="text-2xl font-bold text-pos-text text-center mb-1">
//               Create Your Account
//             </h1>
//             <p className="text-sm text-pos-muted text-center mb-8">
//               {TIER_LIMITS[selectedTier].name} Plan —{" "}
//               {formatCurrency(TIER_LIMITS[selectedTier].price, "NGN")}/month
//             </p>
//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="Business Name"
//                   placeholder="Adeyemi Stores Ltd"
//                   value={form.businessName}
//                   onChange={(e) =>
//                     setForm({ ...form, businessName: e.target.value })
//                   }
//                   leftIcon={<Building2 size={15} />}
//                   required
//                 />
//                 <Input
//                   label="Owner Name"
//                   placeholder="Tunde Adeyemi"
//                   value={form.ownerName}
//                   onChange={(e) =>
//                     setForm({ ...form, ownerName: e.target.value })
//                   }
//                   leftIcon={<User size={15} />}
//                   required
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="Email Address"
//                   type="email"
//                   placeholder="tunde@business.com"
//                   value={form.email}
//                   onChange={(e) => setForm({ ...form, email: e.target.value })}
//                   leftIcon={<Mail size={15} />}
//                   required
//                 />
//                 <Input
//                   label="Phone Number"
//                   type="tel"
//                   placeholder="08012345678"
//                   value={form.phone}
//                   onChange={(e) => setForm({ ...form, phone: e.target.value })}
//                   leftIcon={<Phone size={15} />}
//                   required
//                 />
//               </div>
//               <div className="grid grid-cols-2 gap-4">
//                 <Input
//                   label="Password"
//                   type={showPw ? "text" : "password"}
//                   placeholder="Min. 8 characters"
//                   value={form.password}
//                   onChange={(e) =>
//                     setForm({ ...form, password: e.target.value })
//                   }
//                   leftIcon={<Lock size={15} />}
//                   rightIcon={
//                     <button
//                       type="button"
//                       onClick={() => setShowPw(!showPw)}
//                       className="pointer-events-auto cursor-pointer"
//                     >
//                       {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
//                     </button>
//                   }
//                   required
//                 />
//                 <Input
//                   label="Confirm Password"
//                   type={showPw ? "text" : "password"}
//                   placeholder="Repeat password"
//                   value={form.confirmPassword}
//                   onChange={(e) =>
//                     setForm({ ...form, confirmPassword: e.target.value })
//                   }
//                   leftIcon={<Lock size={15} />}
//                   required
//                 />
//               </div>
//               <div className="flex gap-3 pt-2">
//                 <Button
//                   variant="outline"
//                   onClick={() => setStep(1)}
//                   className="flex-1"
//                   size="lg"
//                 >
//                   Back
//                 </Button>
//                 <Button
//                   type="submit"
//                   className="flex-1"
//                   size="lg"
//                   loading={loading}
//                 >
//                   Create Account
//                 </Button>
//               </div>
//             </form>
//           </div>
//         )}

//         <p className="text-center text-sm text-pos-muted mt-6">
//           Already have an account?{" "}
//           <Link
//             to="/login"
//             className="text-blue-400 hover:text-blue-300 font-medium"
//           >
//             Sign in
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  TIER_LIMITS,
  type MerchantTier,
  type BillingCycle,
} from "@/types/index";
import { formatCurrency } from "@/utils/helpers";

const tiers: { key: MerchantTier; features: string[] }[] = [
  {
    key: "basic",
    features: [
      "1 outlet",
      "Unlimited products",
      "Sales reports",
      "Customer management",
      "Staff management",
      "Expense tracking",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    key: "standard",
    features: [
      "Up to 5 outlets",
      "Unlimited products",
      "Sales reports",
      "Customer management",
      "Staff management",
      "Expense tracking",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    key: "premium",
    features: [
      "Up to 50 outlets",
      "Unlimited products",
      "Sales reports",
      "Customer management",
      "Staff management",
      "Expense tracking",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

export default function MerchantRegister() {
  const { registerMerchant } = useAuth();
  const { error: showError, success } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<MerchantTier>("basic");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await registerMerchant({ ...form, tier: selectedTier, billingCycle });
      success("Account created! Welcome to KasihPOS Pro.");
      navigate("/merchant/dashboard");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pos-bg flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
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

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-pos-card text-pos-muted border border-pos-border"
                }`}
              >
                {step > s ? <CheckCircle size={16} /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-pos-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-pos-text text-center mb-1">
              Choose Your Plan
            </h1>
            <p className="text-sm text-pos-muted text-center mb-6">
              Select the tier that fits your business
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center bg-pos-card border border-pos-border rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    billingCycle === "monthly"
                      ? "bg-blue-600 text-white shadow"
                      : "text-pos-muted hover:text-pos-text"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    billingCycle === "yearly"
                      ? "bg-emerald-600 text-white shadow"
                      : "text-pos-muted hover:text-pos-text"
                  }`}
                >
                  Yearly
                  <span className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                    7.5% OFF
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {tiers.map(({ key, features }) => {
                const tier = TIER_LIMITS[key];
                const isSelected = selectedTier === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTier(key)}
                    className={`text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-200 relative flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-500 bg-blue-600/10"
                        : "border-pos-border bg-pos-card hover:border-pos-border/70"
                    }`}
                  >
                    <div>
                      {key === "standard" && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full mb-3 inline-block font-medium">
                          Popular
                        </span>
                      )}

                      <p className="font-bold text-pos-text text-lg leading-tight">
                        {tier.name}
                      </p>

                      {/* Monthly Rate */}
                      <p className="text-blue-400 font-bold mt-1 text-base sm:text-lg">
                        {formatCurrency(tier.price, "IDR")}
                        <span className="text-xs text-pos-muted font-normal">
                          {" "}
                          /mo
                        </span>
                      </p>

                      {/* Features List */}
                      <ul className="mt-4 space-y-2">
                        {features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-2 text-xs text-pos-muted"
                          >
                            <CheckCircle
                              size={12}
                              className="text-emerald-400 shrink-0"
                            />
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Yearly Discounted Rate Section */}
                    <div className="mt-4 pt-3 border-t border-pos-border/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-pos-muted font-semibold">
                          Annual Plan
                        </span>
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="text-xs line-through text-pos-muted truncate">
                            {formatCurrency(tier.price * 12, "IDR")}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-400 truncate">
                            {formatCurrency(tier.yearlyPrice, "IDR")}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                        <Tag size={10} />
                        7.5% OFF
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button onClick={() => setStep(2)} className="w-full" size="lg">
              Continue with {TIER_LIMITS[selectedTier].name} (
              {billingCycle === "yearly"
                ? `${formatCurrency(TIER_LIMITS[selectedTier].yearlyPrice, "IDR")}/yr`
                : `${formatCurrency(TIER_LIMITS[selectedTier].price, "IDR")}/mo`}
              )
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-pos-text text-center mb-1">
              Create Your Account
            </h1>
            <p className="text-sm text-pos-muted text-center mb-8">
              {TIER_LIMITS[selectedTier].name} Plan —{" "}
              {billingCycle === "yearly" ? (
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(TIER_LIMITS[selectedTier].yearlyPrice, "IDR")}
                  /year (7.5% OFF)
                </span>
              ) : (
                `${formatCurrency(TIER_LIMITS[selectedTier].price, "IDR")}/month`
              )}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  placeholder="Adeyemi Stores Ltd"
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  leftIcon={<Building2 size={15} />}
                  required
                />
                <Input
                  label="Owner Name"
                  placeholder="Tunde Adeyemi"
                  value={form.ownerName}
                  onChange={(e) =>
                    setForm({ ...form, ownerName: e.target.value })
                  }
                  leftIcon={<User size={15} />}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="tunde@business.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  leftIcon={<Mail size={15} />}
                  required
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  leftIcon={<Phone size={15} />}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
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
                <Input
                  label="Confirm Password"
                  type={showPw ? "text" : "password"}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  leftIcon={<Lock size={15} />}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  loading={loading}
                >
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-pos-muted mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
