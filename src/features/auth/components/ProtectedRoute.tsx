
import { Navigate, Outlet } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

import { useSession } from "../../../lib/auth-client";

type UserRole = "CUSTOMER" | "ADMIN" | "DELIVERY";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const {
    data: session,
    isPending,
    error,
  } = useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fffaf5]">
        <LoaderCircle
          size={36}
          className="animate-spin text-orange-700"
        />

        <p className="text-sm font-semibold text-stone-600">
          Verificando suas permissões...
        </p>
      </div>
    );
  }

  if (error || !session?.user) {
    return (
      <Navigate
        to="/perfil"
        replace
      />
    );
  }

  const user = session.user as typeof session.user & {
    role?: string;
  };

  const role = user.role;

  if (
    !role ||
    !allowedRoles.includes(role as UserRole)
  ) {
    if (role === "ADMIN") {
      return (
        <Navigate
          to="/dashboard-admin"
          replace
        />
      );
    }

    if (role === "CUSTOMER") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
