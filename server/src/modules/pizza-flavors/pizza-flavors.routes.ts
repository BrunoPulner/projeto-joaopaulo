
import { Router } from "express";

import {
  listProductPizzaFlavors,
  listAdminProductPizzaFlavors,
  getAdminPizzaFlavor,
  createPizzaFlavorHandler,
  updatePizzaFlavorHandler,
  deactivatePizzaFlavorHandler,
  listPizzaFlavorAddonsHandler,
  linkPizzaFlavorAddonsBulkHandler,
  unlinkPizzaFlavorAddonHandler,
} from "./pizza-flavors.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

export const pizzaFlavorsRouter = Router();

// ============================================
// CATÁLOGO PÚBLICO
// ============================================

// Listar sabores ativos de uma pizza
pizzaFlavorsRouter.get(
  "/product/:productId",
  listProductPizzaFlavors,
);

// ============================================
// GERENCIAMENTO ADMINISTRATIVO
// ============================================

// Todas as rotas abaixo exigem ADMIN
pizzaFlavorsRouter.use(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
);

// Listar sabores de uma pizza, incluindo inativos
pizzaFlavorsRouter.get(
  "/admin/product/:productId",
  listAdminProductPizzaFlavors,
);

// Vincular adicionais a vários sabores
// Importante: registrar antes de /admin/:id
pizzaFlavorsRouter.post(
  "/admin/addons/bulk",
  linkPizzaFlavorAddonsBulkHandler,
);

// Consultar um sabor
pizzaFlavorsRouter.get(
  "/admin/:id",
  getAdminPizzaFlavor,
);

// Cadastrar sabor
pizzaFlavorsRouter.post(
  "/admin",
  createPizzaFlavorHandler,
);

// Editar sabor
pizzaFlavorsRouter.patch(
  "/admin/:id",
  updatePizzaFlavorHandler,
);

// Desativar sabor
pizzaFlavorsRouter.delete(
  "/admin/:id",
  deactivatePizzaFlavorHandler,
);

// Consultar adicionais de um sabor
pizzaFlavorsRouter.get(
  "/admin/:id/addons",
  listPizzaFlavorAddonsHandler,
);

// Desvincular um adicional de um sabor
pizzaFlavorsRouter.delete(
  "/admin/:id/addons/:addonId",
  unlinkPizzaFlavorAddonHandler,
);
