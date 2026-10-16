
import type { RequestHandler } from "express";
import { z } from "zod";

import {
  disableAddon,
  editAddon,
  findAddonById,
  findAllAddons,
  insertAddon,
  type AddonUpdateInput,
} from "./addon.service.js";

// ============================================
// VALIDAÇÃO DOS DADOS
// ============================================

const addonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),

  description: z
    .string()
    .trim()
    .max(2000, "A descrição deve ter no máximo 2000 caracteres.")
    .nullable()
    .optional(),

  imageUrl: z
    .string()
    .trim()
    .max(2048, "A URL da imagem é muito longa.")
    .nullable()
    .optional(),

  priceCents: z
    .number()
    .int("O preço deve ser um número inteiro em centavos.")
    .min(0, "O preço não pode ser negativo.")
    .max(2147483647, "O preço excede o limite permitido."),

  isActive: z.boolean().optional(),
});

// Atualizações permitem enviar somente os campos alterados
const updateAddonSchema = addonSchema.partial();

// ============================================
// VALIDAR ID
// ============================================

function parseId(
  value: string | string[] | undefined,
): number | null {
  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const id = Number(value);

  if (
    !Number.isSafeInteger(id) ||
    id > 2147483647
  ) {
    return null;
  }

  return id;
}

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handleError(error: unknown): {
  status: number;
  message: string;
} {
  const dbError = error as {
    code?: string;
    constraint?: string;
  };

  if (dbError.code === "23505") {
    return {
      status: 409,
      message: "Já existe um registro com esses dados.",
    };
  }

  if (dbError.code === "23503") {
    return {
      status: 400,
      message: "Relacionamento inválido no banco de dados.",
    };
  }

  if (dbError.code === "23514") {
    return {
      status: 400,
      message: "Os dados violam uma regra do banco.",
    };
  }

  console.error("Erro na API de adicionais:", error);

  return {
    status: 500,
    message: "Erro interno ao processar adicional.",
  };
}

// ============================================
// LISTAR ADICIONAIS ATIVOS
// GET /api/addons
// ============================================

export const listAddons: RequestHandler = async (
  _req,
  res,
) => {
  try {
    const addons = await findAllAddons(false);

    res.status(200).json(addons);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// LISTAR TODOS OS ADICIONAIS (ADMIN)
// GET /api/addons/admin
// ============================================

export const listAdminAddons: RequestHandler = async (
  _req,
  res,
) => {
  try {
    const addons = await findAllAddons(true);

    res.status(200).json(addons);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// BUSCAR ADICIONAL POR ID
// GET /api/addons/:id
// ============================================

export const getAddonById: RequestHandler = async (
  req,
  res,
) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "ID do adicional inválido.",
    });
    return;
  }

  try {
    const addon = await findAddonById(id);

    if (!addon || !addon.isActive) {
      res.status(404).json({
        message: "Adicional não encontrado.",
      });
      return;
    }

    res.status(200).json(addon);
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// CADASTRAR ADICIONAL
// POST /api/addons
// ============================================

export const createAddon: RequestHandler = async (
  req,
  res,
) => {
  const parsed = addonSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Dados inválidos para cadastrar adicional.",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  try {
    const addon = await insertAddon(parsed.data);

    res.status(201).json({
      message: "Adicional cadastrado com sucesso.",
      addon,
    });
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// ATUALIZAR ADICIONAL
// PATCH /api/addons/:id
// ============================================

export const updateAddon: RequestHandler = async (
  req,
  res,
) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "ID do adicional inválido.",
    });
    return;
  }

  const parsed = updateAddonSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Dados inválidos para atualizar adicional.",
      errors: z.flattenError(parsed.error),
    });
    return;
  }

  if (Object.keys(parsed.data).length === 0) {
    res.status(400).json({
      message: "Informe pelo menos um campo para atualizar.",
    });
    return;
  }

  try {
    const current = await findAddonById(id);

    if (!current) {
      res.status(404).json({
        message: "Adicional não encontrado.",
      });
      return;
    }

    const input: AddonUpdateInput = {
      ...parsed.data,
    };

    const addon = await editAddon(id, input);

    res.status(200).json({
      message: "Adicional atualizado com sucesso.",
      addon,
    });
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};

// ============================================
// DESATIVAR ADICIONAL
// DELETE /api/addons/:id
// ============================================

export const deactivateAddon: RequestHandler = async (
  req,
  res,
) => {
  const id = parseId(req.params.id);

  if (id === null) {
    res.status(400).json({
      message: "ID do adicional inválido.",
    });
    return;
  }

  try {
    const addon = await disableAddon(id);

    if (!addon) {
      res.status(404).json({
        message: "Adicional não encontrado.",
      });
      return;
    }

    res.status(200).json({
      message: "Adicional desativado com sucesso.",
      addon,
    });
  } catch (error) {
    const result = handleError(error);

    res.status(result.status).json({
      message: result.message,
    });
  }
};
