import type { RequestHandler } from "express";
import { z } from "zod";

import {
  PizzaFlavorError,
  createPizzaFlavor,
  deactivatePizzaFlavor,
  findPizzaFlavorById,
  linkFlavorAddonsBulk,
  listFlavorAddons,
  listPizzaFlavors,
  unlinkFlavorAddon,
  updatePizzaFlavor,
} from "./pizza-flavors.service.js";

const MAX_INT = 2_147_483_647;
const idSchema = z.coerce.number().int().min(1).max(MAX_INT);
const priceSchema = z.number().int().min(0).max(MAX_INT);

const flavorBaseSchema = z.object({
  productId: idSchema,
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().nullable().optional(),
  imageUrl: z.string().trim().max(2048).nullable().optional(),
  flavorType: z.enum(["SAVORY", "SWEET"]),
  additionalPriceCents: priceSchema,
  isPremium: z.boolean().optional(),
  premiumAdditionalCents: priceSchema.optional(),
  isActive: z.boolean().optional(),
  sortOrder: priceSchema.optional(),
}).strict();

const flavorSchema = flavorBaseSchema.superRefine((data, context) => {
  if (data.isPremium !== true && (data.premiumAdditionalCents ?? 0) > 0) {
    context.addIssue({
      code: "custom",
      path: ["premiumAdditionalCents"],
      message: "Acréscimo nobre exige isPremium: true.",
    });
  }
});

// A validação combinada de isPremium/premiumAdditionalCents em edições
// fica no serviço, pois depende dos valores atuais do sabor.
const flavorUpdateSchema = flavorBaseSchema.omit({ productId: true }).partial();

const bulkSchema = z.object({
  flavorIds: z.array(idSchema).min(1).max(100),
  addonIds: z.array(idSchema).min(1).max(100),
}).strict();

function errorResponse(error: unknown, res: Parameters<RequestHandler>[1]): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      message: "Dados inválidos.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof PizzaFlavorError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  const pgError = error as { code?: string; constraint?: string } | null;
  if (pgError?.code === "23505") {
    res.status(409).json({ message: "Este sabor ou vínculo já está cadastrado." });
    return;
  }
  if (pgError?.code === "23503") {
    res.status(400).json({ message: "Produto, sabor ou adicional relacionado não encontrado." });
    return;
  }
  if (pgError?.code === "23514" || pgError?.code === "22P02" || pgError?.code === "22003") {
    res.status(400).json({ message: "Os dados informados não são válidos para o banco." });
    return;
  }

  console.error("Erro na API de sabores de pizza:", error);
  res.status(500).json({ message: "Erro interno ao processar o sabor de pizza." });
}

export const listProductPizzaFlavors: RequestHandler = async (req, res) => {
  try {
    const productId = idSchema.parse(req.params.productId);
    // A rota pública sempre exclui sabores desativados.
    const flavors = await listPizzaFlavors(productId, false);
    res.json(flavors);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const listAdminProductPizzaFlavors: RequestHandler = async (req, res) => {
  try {
    const productId = idSchema.parse(req.params.productId);
    const flavors = await listPizzaFlavors(productId, true);
    res.json(flavors);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const getAdminPizzaFlavor: RequestHandler = async (req, res) => {
  try {
    const id = idSchema.parse(req.params.id);
    const flavor = await findPizzaFlavorById(id);
    if (!flavor) {
      res.status(404).json({ message: "Sabor não encontrado." });
      return;
    }
    res.json(flavor);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const createPizzaFlavorHandler: RequestHandler = async (req, res) => {
  try {
    const input = flavorSchema.parse(req.body);
    const flavor = await createPizzaFlavor(input);
    res.status(201).json(flavor);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const updatePizzaFlavorHandler: RequestHandler = async (req, res) => {
  try {
    const id = idSchema.parse(req.params.id);
    const input = flavorUpdateSchema.parse(req.body);
    if (Object.keys(input).length === 0) {
      res.status(400).json({ message: "Informe ao menos um campo para atualizar." });
      return;
    }
    const flavor = await updatePizzaFlavor(id, input);
    res.json(flavor);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const deactivatePizzaFlavorHandler: RequestHandler = async (req, res) => {
  try {
    const id = idSchema.parse(req.params.id);
    const flavor = await deactivatePizzaFlavor(id);
    res.json(flavor);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const listPizzaFlavorAddonsHandler: RequestHandler = async (req, res) => {
  try {
    const id = idSchema.parse(req.params.id);
    const flavor = await findPizzaFlavorById(id);
    if (!flavor) {
      res.status(404).json({ message: "Sabor não encontrado." });
      return;
    }
    // Esta rota é administrativa: inclui vínculos desativados.
    const addons = await listFlavorAddons(id, true);
    res.json(addons);
  } catch (error) {
    errorResponse(error, res);
  }
};

export const linkPizzaFlavorAddonsBulkHandler: RequestHandler = async (req, res) => {
  try {
    const input = bulkSchema.parse(req.body);
    const result = await linkFlavorAddonsBulk(input);
    res.json({ message: "Adicionais vinculados aos sabores.", ...result });
  } catch (error) {
    errorResponse(error, res);
  }
};

export const unlinkPizzaFlavorAddonHandler: RequestHandler = async (req, res) => {
  try {
    const flavorId = idSchema.parse(req.params.id);
    const addonId = idSchema.parse(req.params.addonId);
    const unlinked = await unlinkFlavorAddon(flavorId, addonId);
    if (!unlinked) {
      res.status(404).json({ message: "Vínculo ativo não encontrado." });
      return;
    }
    res.json({ message: "Adicional desvinculado do sabor." });
  } catch (error) {
    errorResponse(error, res);
  }
};
