import type { Request, Response } from "express";
import { z } from "zod";

import {
  createDeliveryZoneSchema,
  updateDeliverySettingsSchema,
  updateDeliveryZoneSchema,
  validateDeliveryLocationSchema,
} from "./delivery-settings.schemas.js";

import {
  checkDeliveryAvailability,
  createDeliveryZone,
  deactivateDeliveryZone,
  getDeliverySettings,
  getDeliveryZoneById,
  listDeliveryZones,
  updateDeliverySettings,
  updateDeliveryZone,
} from "./delivery-settings.service.js";

// ============================================
// RESPOSTAS E TRATAMENTO DE ERROS
// ============================================

function respondWithError(
  response: Response,
  error: unknown,
  operation: string,
): void {
  if (error instanceof z.ZodError) {
    response.status(400).json({
      success: false,
      message: "Os dados informados são inválidos.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  console.error(`[DELIVERY] Erro ao ${operation}:`, error);
  response.status(500).json({
    success: false,
    message: "Não foi possível concluir a operação de entregas.",
  });
}

const zoneIdSchema = z.coerce.number().int().positive();

function parseZoneId(request: Request): number | null {
  const rawId = request.params.id;
  if (typeof rawId !== "string" || !/^\d+$/.test(rawId)) {
    return null;
  }

  const parsed = zoneIdSchema.safeParse(rawId);
  return parsed.success ? parsed.data : null;
}

// ============================================
// CONFIGURAÇÕES DO RESTAURANTE
// ============================================

export async function getAdminDeliverySettings(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const settings = await getDeliverySettings();

    if (!settings) {
      response.status(404).json({
        success: false,
        message: "Configurações de entrega ainda não inicializadas.",
      });
      return;
    }

    response.status(200).json({ success: true, data: settings });
  } catch (error) {
    respondWithError(response, error, "consultar configurações");
  }
}

export async function patchAdminDeliverySettings(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const input = updateDeliverySettingsSchema.parse(request.body);
    const settings = await updateDeliverySettings(input);

    if (!settings) {
      response.status(404).json({
        success: false,
        message: "Configurações de entrega ainda não inicializadas.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Configurações de entrega atualizadas com sucesso.",
      data: settings,
    });
  } catch (error) {
    respondWithError(response, error, "atualizar configurações");
  }
}

// ============================================
// ÁREAS DE ENTREGA
// ============================================

export async function getAdminDeliveryZones(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const zones = await listDeliveryZones(true);
    response.status(200).json({ success: true, data: zones });
  } catch (error) {
    respondWithError(response, error, "listar áreas");
  }
}

export async function getAdminDeliveryZoneById(
  request: Request,
  response: Response,
): Promise<void> {
  const id = parseZoneId(request);
  if (id === null) {
    response.status(400).json({ success: false, message: "ID da área inválido." });
    return;
  }

  try {
    const zone = await getDeliveryZoneById(id);
    if (!zone) {
      response.status(404).json({ success: false, message: "Área de entrega não encontrada." });
      return;
    }

    response.status(200).json({ success: true, data: zone });
  } catch (error) {
    respondWithError(response, error, "consultar área");
  }
}

export async function postAdminDeliveryZone(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const input = createDeliveryZoneSchema.parse(request.body);
    const zone = await createDeliveryZone(input);

    response.status(201).json({
      success: true,
      message: "Área de entrega cadastrada com sucesso.",
      data: zone,
    });
  } catch (error) {
    respondWithError(response, error, "cadastrar área");
  }
}

export async function patchAdminDeliveryZone(
  request: Request,
  response: Response,
): Promise<void> {
  const id = parseZoneId(request);
  if (id === null) {
    response.status(400).json({ success: false, message: "ID da área inválido." });
    return;
  }

  try {
    const input = updateDeliveryZoneSchema.parse(request.body);
    const zone = await updateDeliveryZone(id, input);

    if (!zone) {
      response.status(404).json({ success: false, message: "Área de entrega não encontrada." });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Área de entrega atualizada com sucesso.",
      data: zone,
    });
  } catch (error) {
    respondWithError(response, error, "atualizar área");
  }
}

export async function deleteAdminDeliveryZone(
  request: Request,
  response: Response,
): Promise<void> {
  const id = parseZoneId(request);
  if (id === null) {
    response.status(400).json({ success: false, message: "ID da área inválido." });
    return;
  }

  try {
    const zone = await deactivateDeliveryZone(id);
    if (!zone) {
      response.status(404).json({ success: false, message: "Área de entrega não encontrada." });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Área de entrega desativada com sucesso.",
      data: zone,
    });
  } catch (error) {
    respondWithError(response, error, "desativar área");
  }
}

// ============================================
// VERIFICAÇÃO DE DISPONIBILIDADE
// ============================================

// Este endpoint verifica coordenadas já obtidas de uma fonte
// confiável. A confirmação do endereço e a revalidação no
// checkout serão implementadas na etapa de pedidos.
export async function postDeliveryAvailability(
  request: Request,
  response: Response,
): Promise<void> {
  try {
    const location = validateDeliveryLocationSchema.parse(request.body);
    const availability = await checkDeliveryAvailability(location);

    response.status(200).json({ success: true, data: availability });
  } catch (error) {
    respondWithError(response, error, "verificar disponibilidade");
  }
}
