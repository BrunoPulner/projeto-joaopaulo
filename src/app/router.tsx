
import { createBrowserRouter } from "react-router-dom";

import { PublicLayout } from "../components/layout/PublicLayout";

import { CatalogPage } from "../features/catalog/catalogPage";
import { HomePage } from "../features/home/homePage";

import { LoginPage } from "../features/account/pages/LoginPage";

import { CustomerDashboardPage } from "../features/account/pages/CustomerDashboardPage";

import { AdminDashboardPage } from "../features/account/admin/pages/AdminDashboardPage";

import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";

export const router = createBrowserRouter([
  // Rotas públicas
  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/cardapio",
        element: <CatalogPage />,
      },
    ],
  },

  // Login
  {
    path: "/perfil",
    element: <LoginPage />,
  },

  // Área do cliente
  {
    element: (
      <ProtectedRoute
        allowedRoles={["CUSTOMER"]}
      />
    ),
    children: [
      {
        path: "/dashboard",
        element: <CustomerDashboardPage />,
      },
    ],
  },

  // Área administrativa
  {
    element: (
      <ProtectedRoute
        allowedRoles={["ADMIN"]}
      />
    ),
    children: [
      {
        path: "/dashboard-admin",
        element: <AdminDashboardPage />,
      },
    ],
  },
]);
