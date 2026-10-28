
import { Router } from "express";

import {
  getAdminDeliverySettings,
  patchAdminDeliverySettings,
  getAdminDeliveryZones,
  getAdminDeliveryZoneById,
  postAdminDeliveryZone,
  patchAdminDeliveryZone,
  deleteAdminDeliveryZone,
  postDeliveryAvailability,
} from "./delivery-settings.controller.js";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

// ============================================
// ROUTERS
// ============================================

// Rotas exclusivas do administrador
export const deliverySettingsAdminRouter = Router();

// Consulta de disponibilidade para clientes
export const deliveryAvailabilityRouter = Router();

// ============================================
// PROTEÇÃO ADMINISTRATIVA
// ============================================

// Todas as rotas administrativas exigem
// autenticação e perfil ADMIN.
deliverySettingsAdminRouter.use(
  requireAuth,
  requireRole("ADMIN"),
);

// ============================================
// CONFIGURAÇÕES DE ENTREGA
// ============================================

// Consultar taxa fixa, telefone e status
deliverySettingsAdminRouter.get(
  "/",
  getAdminDeliverySettings,
);

// Atualizar configurações
deliverySettingsAdminRouter.patch(
  "/",
  patchAdminDeliverySettings,
);

// ============================================
// ÁREAS DE ENTREGA
// ============================================

// Listar áreas cadastradas
deliverySettingsAdminRouter.get(
  "/zones",
  getAdminDeliveryZones,
);

// Consultar uma área específica
deliverySettingsAdminRouter.get(
  "/zones/:id",
  getAdminDeliveryZoneById,
);

// Cadastrar perímetro urbano
deliverySettingsAdminRouter.post(
  "/zones",
  postAdminDeliveryZone,
);

// Atualizar perímetro urbano
deliverySettingsAdminRouter.patch(
  "/zones/:id",
  patchAdminDeliveryZone,
);

// Desativar uma área
deliverySettingsAdminRouter.delete(
  "/zones/:id",
  deleteAdminDeliveryZone,
);

// ============================================
// DISPONIBILIDADE DE ENTREGA
// ============================================

// Verificar se as coordenadas informadas
// estão dentro da área de atendimento.
//
// A resposta é uma cotação informativa.
// No checkout, o servidor deverá validar
// novamente o endereço e o valor do frete.
deliveryAvailabilityRouter.post(
  "/availability",
  postDeliveryAvailability,
);
