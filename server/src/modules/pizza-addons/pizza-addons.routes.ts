
import { Router } from "express";

import {
  listPublicSubcategoryPizzaAddonsHandler,
  listPublicFlavorPizzaAddonsHandler,
  listAdminSubcategoryPizzaAddonsHandler,
  listAdminFlavorPizzaAddonsHandler,
  linkSubcategoryPizzaAddonsBulkHandler,
  linkFlavorPizzaAddonsBulkHandler,
  unlinkSubcategoryPizzaAddonHandler,
  unlinkFlavorPizzaAddonHandler,
} from "./pizza-addons.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

// ============================================
// ROUTER - ADICIONAIS DE PIZZA
// ============================================

export const pizzaAddonsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/pizza-addons/subcategory/:subcategoryId
//
// Lista adicionais ativos vinculados
// a uma subcategoria de pizza.

pizzaAddonsRouter.get(
  "/subcategory/:subcategoryId",
  listPublicSubcategoryPizzaAddonsHandler,
);

// GET /api/pizza-addons/flavor/:flavorId
//
// Lista adicionais ativos vinculados
// a um sabor específico de pizza.

pizzaAddonsRouter.get(
  "/flavor/:flavorId",
  listPublicFlavorPizzaAddonsHandler,
);

// ============================================
// PROTEÇÃO ADMINISTRATIVA
// ============================================

// Todas as rotas /admin exigem
// autenticação e perfil ADMIN.

pizzaAddonsRouter.use(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// LISTAGENS ADMINISTRATIVAS
// ============================================

// GET /api/pizza-addons/admin/subcategory/:subcategoryId
//
// Inclui vínculos e adicionais desativados.

pizzaAddonsRouter.get(
  "/admin/subcategory/:subcategoryId",
  listAdminSubcategoryPizzaAddonsHandler,
);

// GET /api/pizza-addons/admin/flavor/:flavorId
//
// Inclui vínculos e adicionais desativados.

pizzaAddonsRouter.get(
  "/admin/flavor/:flavorId",
  listAdminFlavorPizzaAddonsHandler,
);

// ============================================
// VÍNCULOS EM LOTE
// ============================================

// POST /api/pizza-addons/admin/subcategories/bulk
//
// Vincula vários adicionais a uma
// ou mais subcategorias de pizza.

pizzaAddonsRouter.post(
  "/admin/subcategories/bulk",
  linkSubcategoryPizzaAddonsBulkHandler,
);

// POST /api/pizza-addons/admin/flavors/bulk
//
// Vincula vários adicionais a um
// ou mais sabores de pizza.

pizzaAddonsRouter.post(
  "/admin/flavors/bulk",
  linkFlavorPizzaAddonsBulkHandler,
);

// ============================================
// DESVINCULAR ADICIONAL DE SUBCATEGORIA
// ============================================

// DELETE
// /api/pizza-addons/admin/subcategory/:subcategoryId/addons/:addonId
//
// Desativa o vínculo sem excluir o adicional.

pizzaAddonsRouter.delete(
  "/admin/subcategory/:subcategoryId/addons/:addonId",
  unlinkSubcategoryPizzaAddonHandler,
);

// ============================================
// DESVINCULAR ADICIONAL DE SABOR
// ============================================

// DELETE
// /api/pizza-addons/admin/flavor/:flavorId/addons/:addonId
//
// Desativa o vínculo sem excluir o adicional.

pizzaAddonsRouter.delete(
  "/admin/flavor/:flavorId/addons/:addonId",
  unlinkFlavorPizzaAddonHandler,
);
