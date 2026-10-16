
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

import {
  getAddonSubcategories,
  saveAddonSubcategories,
} from "./addon-subcategory.controller.js";

import {
  getAddonCategories,
  putAddonCategories,
} from "./addon-category.controller.js";
import { putAddonLinks } from "./addon-links.controller.js";

// ============================================
// ROUTER DE ADICIONAIS
// ============================================

export const addonsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/addons
// Listar adicionais ativos
addonsRouter.get("/", listAddons);

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// GET /api/addons/admin
// Listar todos os adicionais, incluindo inativos
addonsRouter.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  listAdminAddons,
);

// ============================================
// VÍNCULOS POR CATEGORIA INTEIRA
// ============================================

// GET /api/addons/admin/:id/categories
// Consultar categorias vinculadas ao adicional
addonsRouter.get(
  "/admin/:id/categories",
  requireAuth,
  requireRole("ADMIN"),
  getAddonCategories,
);

// PUT /api/addons/admin/:id/categories
// Salvar categorias vinculadas ao adicional
addonsRouter.put(
  "/admin/:id/categories",
  requireAuth,
  requireRole("ADMIN"),
  putAddonCategories,
);

// ============================================
// VÍNCULOS POR SUBCATEGORIA
// ============================================

// GET /api/addons/admin/:id/subcategories
// Consultar subcategorias vinculadas
addonsRouter.get(
  "/admin/:id/subcategories",
  requireAuth,
  requireRole("ADMIN"),
  getAddonSubcategories,
);

// PUT /api/addons/admin/:id/subcategories
// Salvar subcategorias vinculadas
addonsRouter.put(
  "/admin/:id/subcategories",
  requireAuth,
  requireRole("ADMIN"),
  saveAddonSubcategories,
);

// ============================================
// CONSULTAR ADICIONAL POR ID
// ============================================

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


// ============================================
// VÍNCULOS UNIFICADOS
// ============================================

// PUT /api/addons/admin/:id/links
// Salvar categorias e subcategorias em uma transação
addonsRouter.put(
  "/admin/:id/links",
  requireAuth,
  requireRole("ADMIN"),
  putAddonLinks,
);