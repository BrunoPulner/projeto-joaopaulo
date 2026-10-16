
import { Router } from "express";

import {
  createAddon,
  deactivateAddon,
  getAddonById,
  listAddons,
  listAdminAddons,
  updateAddon,
} from "./addons.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

// ============================================
// ROUTER DE ADICIONAIS
// ============================================

export const addonsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// Listar adicionais ativos
// GET /api/addons
addonsRouter.get("/", listAddons);

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// Listar todos os adicionais,
// incluindo os desativados
// GET /api/addons/admin
addonsRouter.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  listAdminAddons,
);

// ============================================
// CONSULTAR ADICIONAL
// ============================================

// Buscar adicional ativo por ID
// GET /api/addons/:id
addonsRouter.get("/:id", getAddonById);

// ============================================
// CADASTRAR ADICIONAL
// ============================================

// POST /api/addons
addonsRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  createAddon,
);

// ============================================
// ATUALIZAR ADICIONAL
// ============================================

// PATCH /api/addons/:id
addonsRouter.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  updateAddon,
);

// ============================================
// DESATIVAR ADICIONAL
// ============================================

// DELETE /api/addons/:id
// Exclusão lógica: isActive = false
addonsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  deactivateAddon,
);
