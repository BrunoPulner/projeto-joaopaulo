
import { Router } from "express";

// ============================================
// MIDDLEWARES DE AUTENTICAÇÃO
// ============================================

import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

// ============================================
// CONTROLLERS DO PERFIL
// ============================================

import {
  getCustomerProfileController,
  saveCustomerProfileController,
} from "../controllers/customer-profile.controller.js";

// ============================================
// ROUTER DO PERFIL DO CLIENTE
// ============================================

export const customerProfileRouter = Router();

// ============================================
// AUTENTICAÇÃO E AUTORIZAÇÃO
// ============================================

// Somente usuários autenticados com
// role CUSTOMER podem acessar o próprio perfil.

customerProfileRouter.use(
  requireAuth,
  requireRole("CUSTOMER"),
);

// ============================================
// CONSULTAR PERFIL
// ============================================

// GET /api/customer/profile

customerProfileRouter.get(
  "/",
  getCustomerProfileController,
);

// ============================================
// SALVAR OU ATUALIZAR PERFIL
// ============================================

// PUT /api/customer/profile

customerProfileRouter.put(
  "/",
  saveCustomerProfileController,
);
