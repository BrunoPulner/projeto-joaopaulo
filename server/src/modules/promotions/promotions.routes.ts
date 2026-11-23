
import { Router } from "express";

import { requireAuth } from
  "../../middlewares/requireAuth.js";

import { requireRole } from
  "../../middlewares/requireRole.js";

import {
  // Promoções individuais
  getPublicPromotions,
  getAdminPromotions,
  getAdminPromotionById,
  postAdminPromotion,
  patchAdminPromotion,
  patchAdminPromotionDeactivate,

  // Ofertas agrupadas
  getAdminPromotionGroups,
  getAdminPromotionGroupById,
  postAdminPromotionGroup,
  patchAdminPromotionGroup,
  patchAdminPromotionGroupDeactivate,
} from "./promotions.controller.js";

// ============================================
// ROUTERS
// ============================================

// Promoções públicas
export const promotionsRouter = Router();

// Promoções individuais — administração
export const adminPromotionsRouter = Router();

// Ofertas agrupadas — administração
export const adminPromotionGroupsRouter = Router();

// ============================================
// ROTAS PÚBLICAS
// ============================================

// GET /api/promotions
// Lista somente promoções ativas e válidas.
promotionsRouter.get(
  "/",
  getPublicPromotions,
);

// ============================================
// AUTENTICAÇÃO ADMINISTRATIVA
// ============================================

// Ambos os routers administrativos exigem
// sessão válida e permissão ADMIN.
adminPromotionsRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

adminPromotionGroupsRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// PROMOÇÕES INDIVIDUAIS — ADMIN
// ============================================

// GET /api/admin/promotions
adminPromotionsRouter.get(
  "/",
  getAdminPromotions,
);

// GET /api/admin/promotions/:id
adminPromotionsRouter.get(
  "/:id",
  getAdminPromotionById,
);

// POST /api/admin/promotions
adminPromotionsRouter.post(
  "/",
  postAdminPromotion,
);

// PATCH /api/admin/promotions/:id
adminPromotionsRouter.patch(
  "/:id",
  patchAdminPromotion,
);

// PATCH /api/admin/promotions/:id/deactivate
adminPromotionsRouter.patch(
  "/:id/deactivate",
  patchAdminPromotionDeactivate,
);

// ============================================
// OFERTAS AGRUPADAS — ADMIN
// ============================================

// GET /api/admin/promotion-groups
// Lista todas as ofertas agrupadas.
adminPromotionGroupsRouter.get(
  "/",
  getAdminPromotionGroups,
);

// GET /api/admin/promotion-groups/:id
// Consulta uma oferta agrupada específica.
adminPromotionGroupsRouter.get(
  "/:id",
  getAdminPromotionGroupById,
);

// POST /api/admin/promotion-groups
// Cria uma oferta com vários sabores.
adminPromotionGroupsRouter.post(
  "/",
  postAdminPromotionGroup,
);

// PATCH /api/admin/promotion-groups/:id
// Atualiza nome, preço, datas e sabores.
adminPromotionGroupsRouter.patch(
  "/:id",
  patchAdminPromotionGroup,
);

// PATCH /api/admin/promotion-groups/:id/deactivate
// Desativa todos os sabores da oferta.
adminPromotionGroupsRouter.patch(
  "/:id/deactivate",
  patchAdminPromotionGroupDeactivate,
);
