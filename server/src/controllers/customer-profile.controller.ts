
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getCustomerProfile,
  saveCustomerProfile,
  CustomerProfileNotFoundError,
} from "../services/customer-profile.service.js";

import {
  updateCustomerProfileSchema,
} from "../schemas/customer-profile.schema.js";

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handleProfileError(
  error: unknown,
  res: Response,
  next: NextFunction,
): void {
  if (
    error instanceof CustomerProfileNotFoundError
  ) {
    res.status(404).json({
      success: false,
      message: "Cliente não encontrado.",
    });

    return;
  }

  next(error);
}

// ============================================
// IDENTIFICAR CLIENTE AUTENTICADO
// ============================================

function getAuthenticatedCustomerId(
  res: Response,
): string | null {
  const user = res.locals.authUser as
    | { id?: string }
    | undefined;

  if (!user?.id) {
    res.status(401).json({
      success: false,
      message: "Você precisa estar autenticado.",
    });

    return null;
  }

  return user.id;
}

// ============================================
// CONSULTAR PERFIL
// GET /api/customer/profile
// ============================================

export async function getCustomerProfileController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getAuthenticatedCustomerId(res);

  if (!userId) {
    return;
  }

  try {
    const profile = await getCustomerProfile(
      userId,
    );

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    handleProfileError(error, res, next);
  }
}

// ============================================
// SALVAR PERFIL
// PUT /api/customer/profile
// ============================================

export async function saveCustomerProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = getAuthenticatedCustomerId(res);

  if (!userId) {
    return;
  }

  // ==========================================
  // VALIDAR DADOS RECEBIDOS
  // ==========================================

  const parsed = updateCustomerProfileSchema.safeParse(
    req.body,
  );

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message:
        "Verifique os dados informados no perfil.",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });

    return;
  }

  // ==========================================
  // SALVAR NO NEON
  // ==========================================

  try {
    const profile = await saveCustomerProfile(
      userId,
      parsed.data,
    );

    res.status(200).json({
      success: true,
      message: "Perfil atualizado com sucesso.",
      data: profile,
    });
  } catch (error) {
    handleProfileError(error, res, next);
  }
}
