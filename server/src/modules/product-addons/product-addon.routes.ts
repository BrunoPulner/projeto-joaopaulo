
import { Router } from "express";

import {
  createProductAddon,
  deactivateProductAddon,
  getProductAddonById,
  listAdminProductAddons,
  listProductAddons,
  updateProductAddon,
} from "./product-addons.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

// ============================================
// ROUTER PÚBLICO
// ============================================

export const productAddonsPublicRouter = Router();

// GET /api/products/:productId/addons
// Lista adicionais ativos de um produto
productAddonsPublicRouter.get(
  "/:productId/addons",
  listProductAddons,
);

// ============================================
// ROUTER ADMINISTRATIVO
// ============================================

export const productAddonsAdminRouter = Router();

// Todas as rotas abaixo exigem ADMIN
productAddonsAdminRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// LISTAR ADICIONAIS DE UM PRODUTO
// ============================================

// GET /api/admin/product-addons/product/:productId
// Inclui vínculos ativos e desativados
productAddonsAdminRouter.get(
  "/product/:productId",
  listAdminProductAddons,
);

// ============================================
// CONSULTAR VÍNCULO POR ID
// ============================================

// GET /api/admin/product-addons/:id
productAddonsAdminRouter.get(
  "/:id",
  getProductAddonById,
);

// ============================================
// VINCULAR ADICIONAL AO PRODUTO
// ============================================

// POST /api/admin/product-addons
productAddonsAdminRouter.post(
  "/",
  createProductAddon,
);

// ============================================
// ATUALIZAR VÍNCULO
// ============================================

// PATCH /api/admin/product-addons/:id
productAddonsAdminRouter.patch(
  "/:id",
  updateProductAddon,
);

// ============================================
// DESATIVAR VÍNCULO
// ============================================

// DELETE /api/admin/product-addons/:id
// Não exclui fisicamente o registro
productAddonsAdminRouter.delete(
  "/:id",
  deactivateProductAddon,
);
