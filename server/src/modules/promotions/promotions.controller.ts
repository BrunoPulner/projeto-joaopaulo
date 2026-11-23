
import type { Request, Response } from "express";
import { z } from "zod";

import {
  createPromotionSchema,
  createPromotionGroupSchema,
  promotionIdParamsSchema,
  promotionGroupIdParamsSchema,
  updatePromotionSchema,
  updatePromotionGroupSchema,
} from "./promotions.schemas.js";

import {
  PromotionServiceError,

  // Promoções individuais
  createPromotion,
  deactivatePromotion,
  findPromotionById,
  listActivePromotions,
  listPromotions,
  updatePromotion,

  // Ofertas agrupadas
  createPromotionGroup,
  deactivatePromotionGroup,
  findPromotionGroupById,
  listPromotionGroups,
  updatePromotionGroup,
} from "./promotions.service.js";

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handlePromotionError(
  response: Response,
  error: unknown,
  operation: string,
): void {
  if (error instanceof z.ZodError) {
    response.status(400).json({
      success: false,
      message: "Dados da promoção inválidos.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof PromotionServiceError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error(
    `[PROMOTIONS] Erro ao ${operation}:`,
    error,
  );

  response.status(500).json({
    success: false,
    message: "Erro interno ao processar promoção.",
  });
}

// ============================================
// VALIDAR IDENTIFICADORES
// ============================================

function parsePromotionId(
  request: Request,
): number {
  return promotionIdParamsSchema.parse({
    id: request.params.id,
  }).id;
}

function parsePromotionGroupId(
  request: Request,
): number {
  return promotionGroupIdParamsSchema.parse({
    id: request.params.id,
  }).id;
}

// ============================================
// PROMOÇÕES INDIVIDUAIS
// ============================================

// GET /api/promotions
export async function getPublicPromotions(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const promotions =
      await listActivePromotions();

    response.status(200).json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "listar promoções públicas",
    );
  }
}

// GET /api/admin/promotions
export async function getAdminPromotions(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const promotions = await listPromotions();

    response.status(200).json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "listar promoções administrativas",
    );
  }
}

// GET /api/admin/promotions/:id
export async function getAdminPromotionById(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const id = parsePromotionId(request);

    const promotion =
      await findPromotionById(id);

    if (!promotion) {
      response.status(404).json({
        success: false,
        message: "Promoção não encontrada.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "consultar promoção",
    );
  }
}

// POST /api/admin/promotions
export async function postAdminPromotion(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const input = createPromotionSchema.parse(
      request.body,
    );

    const promotion =
      await createPromotion(input);

    response.status(201).json({
      success: true,
      message: "Promoção cadastrada com sucesso.",
      data: promotion,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "cadastrar promoção",
    );
  }
}

// PATCH /api/admin/promotions/:id
export async function patchAdminPromotion(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const id = parsePromotionId(request);

    const input = updatePromotionSchema.parse(
      request.body,
    );

    const promotion = await updatePromotion(
      id,
      input,
    );

    response.status(200).json({
      success: true,
      message: "Promoção atualizada com sucesso.",
      data: promotion,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "atualizar promoção",
    );
  }
}

// PATCH /api/admin/promotions/:id/deactivate
export async function patchAdminPromotionDeactivate(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const id = parsePromotionId(request);

    const promotion =
      await deactivatePromotion(id);

    response.status(200).json({
      success: true,
      message: "Promoção desativada com sucesso.",
      data: promotion,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "desativar promoção",
    );
  }
}

// ============================================
// OFERTAS AGRUPADAS
// ============================================

// GET /api/admin/promotion-groups
export async function getAdminPromotionGroups(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const groups = await listPromotionGroups();

    response.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "listar ofertas agrupadas",
    );
  }
}

// GET /api/admin/promotion-groups/:id
export async function getAdminPromotionGroupById(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const id = parsePromotionGroupId(request);

    const group =
      await findPromotionGroupById(id);

    if (!group) {
      response.status(404).json({
        success: false,
        message: "Oferta agrupada não encontrada.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "consultar oferta agrupada",
    );
  }
}

// POST /api/admin/promotion-groups
export async function postAdminPromotionGroup(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const input =
      createPromotionGroupSchema.parse(
        request.body,
      );

    const group =
      await createPromotionGroup(input);

    response.status(201).json({
      success: true,
      message: "Oferta cadastrada com sucesso.",
      data: group,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "cadastrar oferta agrupada",
    );
  }
}

// PATCH /api/admin/promotion-groups/:id
export async function patchAdminPromotionGroup(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const id = parsePromotionGroupId(request);

    const input =
      updatePromotionGroupSchema.parse(
        request.body,
      );

    const group = await updatePromotionGroup(
      id,
      input,
    );

    response.status(200).json({
      success: true,
      message: "Oferta atualizada com sucesso.",
      data: group,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "atualizar oferta agrupada",
    );
  }
}

// PATCH /api/admin/promotion-groups/:id/deactivate
export async function patchAdminPromotionGroupDeactivate(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const id = parsePromotionGroupId(request);

    const group =
      await deactivatePromotionGroup(id);

    response.status(200).json({
      success: true,
      message: "Oferta desativada com sucesso.",
      data: group,
    });
  } catch (error) {
    handlePromotionError(
      response,
      error,
      "desativar oferta agrupada",
    );
  }
}
