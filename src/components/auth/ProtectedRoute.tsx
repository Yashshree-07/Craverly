import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

export function ProtectedRoute() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}