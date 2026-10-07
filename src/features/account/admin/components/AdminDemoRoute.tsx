import { Navigate, Outlet } from "react-router-dom";
import { hasAdminDemoSession } from "../adminDemoAuth";

export function AdminDemoRoute() {
  if (!hasAdminDemoSession()) {
    return <Navigate to="/perfil" replace />;
  }

  return <Outlet />;
}