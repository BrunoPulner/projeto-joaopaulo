
import { Router } from "express";

// ============================================
// MIDDLEWARES DE AUTENTICAÇÃO
// ============================================

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

// ============================================
// CONTROLLERS ADMINISTRATIVOS
// ============================================

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

// Todas as rotas exigem:
// 1. Sessão autenticada pelo Better Auth
// 2. Usuário com permissão ADMIN

adminCustomersRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// LISTAR CLIENTES
// GET /api/admin/customers
// ============================================

adminCustomersRouter.get(
  "/",
  listAdminCustomersController,
);

// ============================================
// INDICADORES DE CLIENTES
// GET /api/admin/customers/stats
// ============================================

// Esta rota deve permanecer antes de /:id
// para que "stats" não seja interpretado
// como um identificador de cliente.

adminCustomersRouter.get(
  "/stats",
  getAdminCustomerStatsController,
);

// ============================================
// CONSULTAR CLIENTE POR ID
// GET /api/admin/customers/:id
// ============================================

adminCustomersRouter.get(
  "/:id",
  getAdminCustomerByIdController,
);

// ============================================
// ALTERAR NOME EXIBIDO
// PATCH /api/admin/customers/:id/name
// ============================================

adminCustomersRouter.patch(
  "/:id/name",
  updateAdminCustomerNameController,
);

// ============================================
// BLOQUEAR CLIENTE
// PATCH /api/admin/customers/:id/block
// ============================================

adminCustomersRouter.patch(
  "/:id/block",
  blockAdminCustomerController,
);

// ============================================
// DESBLOQUEAR CLIENTE
// PATCH /api/admin/customers/:id/unblock
// ============================================

adminCustomersRouter.patch(
  "/:id/unblock",
  unblockAdminCustomerController,
);
