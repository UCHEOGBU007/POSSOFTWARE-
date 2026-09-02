// import type { ReactNode } from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";

// interface GuardProps {
//   children: ReactNode;
// }

// /**
//  * Guards Merchant routes (e.g. /merchant/dashboard).
//  * Redirects to /merchant-login if merchantSession is not active.
//  */
// export function ProtectedMerchantRoute({ children }: GuardProps) {
//   const { merchantSession, isLoading } = useAuth();
//   const location = useLocation();

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-pos-bg flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//       </div>
//     );
//   }

//   if (!merchantSession) {
//     return <Navigate to="/merchant-login" state={{ from: location }} replace />;
//   }

//   return <>{children}</>;
// }

// /**
//  * Guards Terminal/Outlet routes (e.g. POS terminal screens).
//  * Redirects to /outlet-login if outletSession is not active.
//  */
// export function ProtectedOutletRoute({ children }: GuardProps) {
//   const { outletSession, isLoading } = useAuth();
//   const location = useLocation();

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-pos-bg flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
//       </div>
//     );
//   }

//   if (!outletSession) {
//     return <Navigate to="/outlet-login" state={{ from: location }} replace />;
//   }

//   return <>{children}</>;
// }

import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface GuardProps {
  children: ReactNode;
}

/**
 * Guards Merchant routes (e.g. /merchant/dashboard).
 * Redirects to /outlet/dashboard if a staff member tries to access merchant routes.
 * Redirects to /merchant-login if unauthenticated.
 */
export function ProtectedMerchantRoute({ children }: GuardProps) {
  const { merchantSession, outletSession, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pos-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Deny staff accounts access to the merchant portal and redirect them to their outlet
  if (!merchantSession) {
    if (outletSession) {
      return <Navigate to="/outlet/dashboard" replace />;
    }
    return <Navigate to="/merchant-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards Terminal/Outlet routes (e.g. POS terminal screens).
 * Validates active outlet session and ensures staff is operating within assigned outlet scope.
 */
export function ProtectedOutletRoute({ children }: GuardProps) {
  const { outletSession, merchantSession, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pos-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Redirect merchant sessions attempting to access staff routes back to merchant dashboard
  if (!outletSession) {
    if (merchantSession) {
      return <Navigate to="/merchant/dashboard" replace />;
    }
    return <Navigate to="/outlet-login" state={{ from: location }} replace />;
  }

  // Enforce staff scope safely using optional chaining to avoid null pointer errors
  const { staff, outlet } = outletSession;
  if (staff?.outletId && staff.outletId !== outlet?.id) {
    return <Navigate to="/outlet-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function ProtectedAdminRoute({ children }: GuardProps) {
  const { adminSession, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!adminSession) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
