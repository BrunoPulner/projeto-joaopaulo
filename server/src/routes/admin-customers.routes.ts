
import { Router } from "express";

import {
  requireAuth,
  
} from "../../../server/src/middlewares/requireAuth.js";


import {
  requireRole,
} from "../../../server/src/middlewares/requireRole.js";


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
// 1. Usuário autenticado
// 2. Permissão de administrador

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

// Esta rota deve ficar antes de /:id
// para evitar que "stats" seja interpretado
// como o ID de um cliente.

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
