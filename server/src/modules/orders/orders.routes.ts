
import { Router } from "express";

import { requireAuth } from
  "../../middlewares/requireAuth.js";

import { requireRole } from
  "../../middlewares/requireRole.js";

import {
  postOrder,
  getMyOrders,
  getMyOrderById,
  patchMyOrderCancel,
  getAdminOrders,
  getAdminOrderById,
  patchAdminOrderStatus,
} from "./orders.controller.js";

// ============================================
// ROUTERS
// ============================================

export const ordersRouter = Router();

export const adminOrdersRouter = Router();

// ============================================
// CLIENTES AUTENTICADOS
// ============================================

ordersRouter.use(
  requireAuth,
  requireRole("CUSTOMER"),
);

// Criar pedido
ordersRouter.post(
  "/",
  postOrder,
);

// Listar meus pedidos
ordersRouter.get(
  "/my",
  getMyOrders,
);

// Cancelar pedido do próprio cliente
// Disponível somente nos primeiros 5 minutos
// e enquanto o status for PENDING.
ordersRouter.patch(
  "/:id/cancel",
  patchMyOrderCancel,
);

// Consultar pedido específico
ordersRouter.get(
  "/:id",
  getMyOrderById,
);

// ============================================
// ADMINISTRADOR
// ============================================

adminOrdersRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

// Listar pedidos
adminOrdersRouter.get(
  "/",
  getAdminOrders,
);

// Consultar pedido
adminOrdersRouter.get(
  "/:id",
  getAdminOrderById,
);

// Atualizar status
adminOrdersRouter.patch(
  "/:id/status",
  patchAdminOrderStatus,
);
