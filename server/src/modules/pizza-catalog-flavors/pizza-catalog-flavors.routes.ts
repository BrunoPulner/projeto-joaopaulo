
import { Router } from "express";

import {
  listPublicCatalogPizzaFlavorsHandler,
  listAdminCatalogPizzaFlavorsHandler,
  getAdminCatalogPizzaFlavorHandler,
  createCatalogPizzaFlavorHandler,
  updateCatalogPizzaFlavorHandler,
  deactivateCatalogPizzaFlavorHandler,
  reactivateCatalogPizzaFlavorHandler,
} from "./pizza-catalog-flavors.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

// ============================================
// ROUTER - CATÁLOGO DE SABORES DE PIZZA
// ============================================

export const pizzaCatalogFlavorsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/pizza-catalog-flavors
//
// Lista somente sabores ativos.
//
// Filtros opcionais:
// ?subcategoryId=5
// ?subcategoryId=6
// ?sizeId=1
// ?subcategoryId=5&sizeId=1

pizzaCatalogFlavorsRouter.get(
  "/",
  listPublicCatalogPizzaFlavorsHandler,
);

// ============================================
// PROTEÇÃO DAS ROTAS ADMINISTRATIVAS
// ============================================

// Todas as rotas iniciadas por /admin
// exigem autenticação e perfil ADMIN.

pizzaCatalogFlavorsRouter.use(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// LISTAGEM ADMINISTRATIVA
// ============================================

// GET /api/pizza-catalog-flavors/admin
//
// Retorna todos os sabores,
// inclusive os desativados.

pizzaCatalogFlavorsRouter.get(
  "/admin",
  listAdminCatalogPizzaFlavorsHandler,
);

// ============================================
// CONSULTAR SABOR POR ID
// ============================================

// GET /api/pizza-catalog-flavors/admin/:id

pizzaCatalogFlavorsRouter.get(
  "/admin/:id",
  getAdminCatalogPizzaFlavorHandler,
);

// ============================================
// CADASTRAR NOVO SABOR
// ============================================

// POST /api/pizza-catalog-flavors/admin

pizzaCatalogFlavorsRouter.post(
  "/admin",
  createCatalogPizzaFlavorHandler,
);

// ============================================
// EDITAR SABOR
// ============================================

// PATCH /api/pizza-catalog-flavors/admin/:id

pizzaCatalogFlavorsRouter.patch(
  "/admin/:id",
  updateCatalogPizzaFlavorHandler,
);

// ============================================
// DESATIVAR SABOR
// ============================================

// DELETE /api/pizza-catalog-flavors/admin/:id
//
// Desativação lógica: não exclui do banco.

pizzaCatalogFlavorsRouter.delete(
  "/admin/:id",
  deactivateCatalogPizzaFlavorHandler,
);

// ============================================
// REATIVAR SABOR
// ============================================

// PATCH /api/pizza-catalog-flavors/admin/:id/reactivate

pizzaCatalogFlavorsRouter.patch(
  "/admin/:id/reactivate",
  reactivateCatalogPizzaFlavorHandler,
);
