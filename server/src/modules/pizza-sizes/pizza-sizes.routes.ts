
import { Router } from "express";

import {
  listPublicPizzaSizesHandler,
  listAdminPizzaSizesHandler,
  getAdminPizzaSizeHandler,
  createPizzaSizeHandler,
  updatePizzaSizeHandler,
  deactivatePizzaSizeHandler,
  reactivatePizzaSizeHandler,
  setPizzaSizeAvailabilityHandler,
} from "./pizza-sizes.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

export const pizzaSizesRouter = Router();

// ============================================
// CATÁLOGO PÚBLICO
// ============================================

// Listar tamanhos ativos e disponíveis
pizzaSizesRouter.get(
  "/",
  listPublicPizzaSizesHandler,
);

// ============================================
// GERENCIAMENTO ADMINISTRATIVO
// ============================================

// Todas as rotas /admin exigem autenticação
// e permissão de administrador.
pizzaSizesRouter.use(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
);

// Listar todos os tamanhos, incluindo inativos
pizzaSizesRouter.get(
  "/admin",
  listAdminPizzaSizesHandler,
);

// Consultar um tamanho específico
pizzaSizesRouter.get(
  "/admin/:id",
  getAdminPizzaSizeHandler,
);

// Cadastrar um novo tamanho
pizzaSizesRouter.post(
  "/admin",
  createPizzaSizeHandler,
);

// Editar informações de um tamanho
pizzaSizesRouter.patch(
  "/admin/:id",
  updatePizzaSizeHandler,
);

// Desativar um tamanho sem excluir o registro
pizzaSizesRouter.delete(
  "/admin/:id",
  deactivatePizzaSizeHandler,
);

// Reativar um tamanho
pizzaSizesRouter.patch(
  "/admin/:id/reactivate",
  reactivatePizzaSizeHandler,
);

// Alterar disponibilidade
pizzaSizesRouter.patch(
  "/admin/:id/availability",
  setPizzaSizeAvailabilityHandler,
);
