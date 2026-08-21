// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { POSProvider } from "./contexts/POSContext";
// import { ToastProvider } from "./components/ui/Toast";
// import Layout from "./components/layout/Layout";
// import { ThemeProvider } from "./contexts/ThemeContext";

// import MerchantLogin from "./pages/auth/MerchantLogin";
// import MerchantRegister from "./pages/auth/MerchantRegister";
// import OutletLogin from "./pages/auth/OutletLogin";

// import MerchantDashboard from "./pages/merchant/Dashboard";
// import OutletsPage from "./pages/merchant/Outlets";
// import MerchantStaff from "./pages/merchant/staffPage"; // 👈 Add Merchant Staff Page
// import BillingPage from "./pages/merchant/Billing";
// import MerchantSettings from "./pages/merchant/Settings";
// import MerchantReports from "./pages/merchant/Reports";

// import OutletDashboard from "./pages/outlet/Dashboard";
// import POSTerminal from "./pages/outlet/POSTerminal";
// import InventoryPage from "./pages/outlet/Inventory";
// import SalesHistory from "./pages/outlet/Sales";
// import CustomersPage from "./pages/outlet/Customers";
// // import StaffPage from "./pages/outlet/Staff";
// import ExpensesPage from "./pages/outlet/Expenses";
// import OutletReports from "./pages/outlet/Reports";
// import OutletSettings from "./pages/outlet/OutletSettings";

// function MerchantRoutes() {
//   const { merchantSession, logoutMerchant } = useAuth();
//   if (!merchantSession) return <Navigate to="/login" replace />;
//   const tier = merchantSession.merchant.tier;
//   return (
//     <Layout
//       type="merchant"
//       businessName={merchantSession.merchant.businessName}
//       subtitle={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`}
//       onLogout={logoutMerchant}
//     >
//       <Routes>
//         <Route path="dashboard" element={<MerchantDashboard />} />
//         <Route path="outlets" element={<OutletsPage />} />
//         <Route path="staff" element={<MerchantStaff />} />{" "}
//         {/* 👈 FIXED: Route added here */}
//         <Route path="billing" element={<BillingPage />} />
//         <Route path="reports" element={<MerchantReports />} />
//         <Route path="settings" element={<MerchantSettings />} />
//         <Route path="*" element={<Navigate to="dashboard" replace />} />
//       </Routes>
//     </Layout>
//   );
// }

// function OutletRoutes() {
//   const { outletSession, logoutOutlet } = useAuth();
//   if (!outletSession) return <Navigate to="/outlet-login" replace />;
//   return (
//     <POSProvider>
//       <Layout
//         type="outlet"
//         businessName={outletSession.outlet.name}
//         subtitle={
//           outletSession.staff
//             ? `${outletSession.staff.name} (${outletSession.staff.role})`
//             : "Outlet Portal"
//         }
//         onLogout={logoutOutlet}
//       >
//         <Routes>
//           <Route path="dashboard" element={<OutletDashboard />} />
//           <Route path="pos" element={<POSTerminal />} />
//           <Route path="inventory" element={<InventoryPage />} />
//           <Route path="sales" element={<SalesHistory />} />
//           <Route path="customers" element={<CustomersPage />} />
//           {/* <Route path="staff" element={<StaffPage />} /> */}
//           <Route path="expenses" element={<ExpensesPage />} />
//           <Route path="reports" element={<OutletReports />} />
//           <Route path="settings" element={<OutletSettings />} />
//           <Route path="*" element={<Navigate to="dashboard" replace />} />
//         </Routes>
//       </Layout>
//     </POSProvider>
//   );
// }

// function RootRedirect() {
//   const { merchantSession, outletSession, isLoading } = useAuth();
//   if (isLoading) return null;
//   if (merchantSession) return <Navigate to="/merchant/dashboard" replace />;
//   if (outletSession) return <Navigate to="/outlet/dashboard" replace />;
//   return <Navigate to="/login" replace />;
// }

// function AppInner() {
//   const { isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 bg-pos-bg flex items-center justify-center z-50">
//         <div className="text-center">
//           <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
//             <svg
//               width="22"
//               height="22"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="white"
//               strokeWidth="2"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
//               <line x1="3" y1="6" x2="21" y2="6" />
//               <path d="M16 10a4 4 0 0 1-8 0" />
//             </svg>
//           </div>
//           <p className="text-pos-text font-semibold">KasihPOS Pro</p>
//           <p className="text-pos-muted text-xs mt-1">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <Routes>
//       <Route path="/" element={<RootRedirect />} />
//       <Route path="/login" element={<MerchantLogin />} />
//       <Route path="/register" element={<MerchantRegister />} />
//       <Route path="/outlet-login" element={<OutletLogin />} />
//       <Route path="/merchant/*" element={<MerchantRoutes />} />
//       <Route path="/outlet/*" element={<OutletRoutes />} />
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   );
// }

// export default function App() {
//   return (
//     <ThemeProvider>
//       <BrowserRouter>
//         <ToastProvider>
//           <AuthProvider>
//             <AppInner />
//           </AuthProvider>
//         </ToastProvider>
//       </BrowserRouter>
//     </ThemeProvider>
//   );
// }

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { POSProvider } from "./contexts/POSContext";
import { ToastProvider } from "./components/ui/Toast";
import Layout from "./components/layout/Layout";
import { ThemeProvider } from "./contexts/ThemeContext";

// Auth Components & Route Guards
import {
  ProtectedMerchantRoute,
  ProtectedOutletRoute,
} from "./pages/auth/ProtectedRoute";
import MerchantLogin from "./pages/auth/MerchantLogin";
import MerchantRegister from "./pages/auth/MerchantRegister";
import OutletLogin from "./pages/auth/OutletLogin";

// Merchant Pages
import MerchantDashboard from "./pages/merchant/Dashboard";
import OutletsPage from "./pages/merchant/Outlets";
import MerchantStaff from "./pages/merchant/staffPage";
import BillingPage from "./pages/merchant/Billing";
import MerchantSettings from "./pages/merchant/Settings";
import MerchantReports from "./pages/merchant/Reports";

// Outlet / POS Pages
import OutletDashboard from "./pages/outlet/Dashboard";
import POSTerminal from "./pages/outlet/POSTerminal";
import InventoryPage from "./pages/outlet/Inventory";
import SalesHistory from "./pages/outlet/Sales";
import CustomersPage from "./pages/outlet/Customers";
import ExpensesPage from "./pages/outlet/Expenses";
import OutletReports from "./pages/outlet/Reports";
import OutletSettings from "./pages/outlet/OutletSettings";

function MerchantRoutes() {
  const { merchantSession, logoutMerchant } = useAuth();

  // Guarantees merchantSession exists before proceeding
  if (!merchantSession) {
    return <Navigate to="/login" replace />;
  }

  const tier = merchantSession.merchant.tier;

  return (
    <Layout
      type="merchant"
      businessName={merchantSession.merchant.businessName}
      subtitle={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`}
      onLogout={logoutMerchant}
    >
      <Routes>
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="outlets" element={<OutletsPage />} />
        <Route path="staff" element={<MerchantStaff />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="reports" element={<MerchantReports />} />
        <Route path="settings" element={<MerchantSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function OutletRoutes() {
  const { outletSession, logoutOutlet } = useAuth();

  // Guarantees outletSession exists before proceeding
  if (!outletSession) {
    return <Navigate to="/outlet-login" replace />;
  }

  return (
    <POSProvider>
      <Layout
        type="outlet"
        businessName={outletSession.outlet.name}
        subtitle={
          outletSession.staff
            ? `${outletSession.staff.name} (${outletSession.staff.role})`
            : "Outlet Portal"
        }
        onLogout={logoutOutlet}
      >
        <Routes>
          <Route path="dashboard" element={<OutletDashboard />} />
          <Route path="pos" element={<POSTerminal />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesHistory />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<OutletReports />} />
          <Route path="settings" element={<OutletSettings />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Layout>
    </POSProvider>
  );
}

function RootRedirect() {
  const { merchantSession, outletSession, isLoading } = useAuth();

  if (isLoading) return null;
  if (merchantSession) return <Navigate to="/merchant/dashboard" replace />;
  if (outletSession) return <Navigate to="/outlet/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function AppInner() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-pos-bg flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <p className="text-pos-text font-semibold">KasihPOS Pro</p>
          <p className="text-pos-muted text-xs mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root handling */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes (Supports both /login and /merchant-login) */}
      <Route path="/login" element={<MerchantLogin />} />
      <Route path="/merchant-login" element={<MerchantLogin />} />
      <Route path="/register" element={<MerchantRegister />} />
      <Route path="/outlet-login" element={<OutletLogin />} />

      {/* Protected Portal Routes */}
      <Route
        path="/merchant/*"
        element={
          <ProtectedMerchantRoute>
            <MerchantRoutes />
          </ProtectedMerchantRoute>
        }
      />
      <Route
        path="/outlet/*"
        element={
          <ProtectedOutletRoute>
            <OutletRoutes />
          </ProtectedOutletRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppInner />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
