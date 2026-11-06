
import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

import {
  listAdminCustomersController,
  getAdminCustomerStatsController,
  getAdminCustomerByIdController,
  updateAdminCustomerNameController,
  blockAdminCustomerController,
  unblockAdminCustomerController,
} from "../controllers/admin-customers.controller.js";

// ============================================
// ROUTER ADMINISTRATIVO DE CLIENTES
// ============================================

export const adminCustomersRouter = Router();

// ============================================
// AUTENTICAÇÃO E PERMISSÕES
// ============================================

// Somente usuários autenticados com
// a função ADMIN podem acessar estas rotas.

adminCustomersRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// LISTAR CLIENTES
// ============================================

// GET /api/admin/customers

adminCustomersRouter.get(
  "/",
  listAdminCustomersController,
);

// ============================================
// ESTATÍSTICAS DOS CLIENTES
// ============================================

// GET /api/admin/customers/stats

adminCustomersRouter.get(
  "/stats",
  getAdminCustomerStatsController,
);

// ============================================
// CONSULTAR CLIENTE POR ID
// ============================================

// GET /api/admin/customers/:id

adminCustomersRouter.get(
  "/:id",
  getAdminCustomerByIdController,
);

// ============================================
// ALTERAR NOME EXIBIDO
// ============================================

// PATCH /api/admin/customers/:id/name

adminCustomersRouter.patch(
  "/:id/name",
  updateAdminCustomerNameController,
);

// ============================================
// BLOQUEAR CLIENTE
// ============================================

// PATCH /api/admin/customers/:id/block

adminCustomersRouter.patch(
  "/:id/block",
  blockAdminCustomerController,
);

// ============================================
// DESBLOQUEAR CLIENTE
// ============================================

// PATCH /api/admin/customers/:id/unblock

adminCustomersRouter.patch(
  "/:id/unblock",
  unblockAdminCustomerController,
);
