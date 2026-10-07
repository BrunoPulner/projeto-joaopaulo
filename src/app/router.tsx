import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";

import { CatalogPage } from "../features/catalog/catalogPage";
import { HomePage } from "../features/home/homePage";
import { LoginPage } from "../features/account/pages/LoginPage";

import { CustomerDashboardPage } from "../features/account/pages/CustomerDashboardPage";
import { AdminDashboardPage } from "../features/account/admin/pages/AdminDashboardPage";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/cardapio", element: <CatalogPage /> },
    ],
  },
  {
    path: "/perfil",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <CustomerDashboardPage />,
  },
  {
    path: "/dashboard-admin",
    element: <AdminDashboardPage />,
  },
]);