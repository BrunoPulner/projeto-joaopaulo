
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  listAdminCustomers,
  getAdminCustomerById,
  getAdminCustomerStats,
  updateAdminCustomerName,
  blockAdminCustomer,
  unblockAdminCustomer,
  CustomerNotFoundError,
} from "../services/admin-customers.service.js";

// ============================================
// RESPOSTAS PADRONIZADAS
// ============================================

function sendError(
  res: Response,
  status: number,
  message: string,
) {
  return res.status(status).json({
    success: false,
    message,
  });
}

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handleCustomerError(
  error: unknown,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof CustomerNotFoundError) {
    sendError(
      res,
      404,
      "Cliente não encontrado.",
    );
    return;
  }

  next(error);
}

// ============================================
// VALIDAR ID DO CLIENTE
// ============================================

function getCustomerId(
  req: Request,
): string | null {
  const value = req.params.id;

  if (typeof value !== "string") {
    return null;
  }

  const id = value.trim();

  return id.length > 0 ? id : null;
}

// ============================================
// LISTAR TODOS OS CLIENTES
// GET /api/admin/customers
// ============================================

export async function listAdminCustomersController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customers =
      await listAdminCustomers();

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// INDICADORES DE CLIENTES
// GET /api/admin/customers/stats
// ============================================

export async function getAdminCustomerStatsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats =
      await getAdminCustomerStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

// ============================================
// CONSULTAR CLIENTE POR ID
// GET /api/admin/customers/:id
// ============================================

export async function getAdminCustomerByIdController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const customerId = getCustomerId(req);

  if (!customerId) {
    sendError(res, 400, "ID do cliente inválido.");
    return;
  }

  try {
    const customer =
      await getAdminCustomerById(customerId);

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    handleCustomerError(error, res, next);
  }
}

// ============================================
// ALTERAR NOME EXIBIDO
// PATCH /api/admin/customers/:id/name
// ============================================

export async function updateAdminCustomerNameController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const customerId = getCustomerId(req);

  if (!customerId) {
    sendError(res, 400, "ID do cliente inválido.");
    return;
  }

  const body = req.body as
    | { displayName?: unknown }
    | undefined;

  const displayName = body?.displayName;

  if (
    displayName !== null &&
    typeof displayName !== "string"
  ) {
    sendError(
      res,
      400,
      "Informe um nome válido ou null para restaurar o nome original.",
    );
    return;
  }

  if (
    typeof displayName === "string" &&
    displayName.trim().length > 100
  ) {
    sendError(
      res,
      400,
      "O nome deve ter no máximo 100 caracteres.",
    );
    return;
  }

  try {
    const customer =
      await updateAdminCustomerName(
        customerId,
        displayName as string | null,
      );

    res.status(200).json({
      success: true,
      message: "Nome atualizado com sucesso.",
      data: customer,
    });
  } catch (error) {
    handleCustomerError(error, res, next);
  }
}

// ============================================
// BLOQUEAR CLIENTE
// PATCH /api/admin/customers/:id/block
// ============================================

export async function blockAdminCustomerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const customerId = getCustomerId(req);

  if (!customerId) {
    sendError(res, 400, "ID do cliente inválido.");
    return;
  }

  const body = req.body as
    | { reason?: unknown }
    | undefined;

  const reason = body?.reason;

  if (
    reason !== undefined &&
    reason !== null &&
    typeof reason !== "string"
  ) {
    sendError(
      res,
      400,
      "O motivo do bloqueio deve ser um texto.",
    );
    return;
  }

  if (
    typeof reason === "string" &&
    reason.trim().length > 500
  ) {
    sendError(
      res,
      400,
      "O motivo deve ter no máximo 500 caracteres.",
    );
    return;
  }

  try {
    const customer =
      await blockAdminCustomer(
        customerId,
        typeof reason === "string"
          ? reason
          : null,
      );

    res.status(200).json({
      success: true,
      message: "Cliente bloqueado com sucesso.",
      data: customer,
    });
  } catch (error) {
    handleCustomerError(error, res, next);
  }
}

// ============================================
// DESBLOQUEAR CLIENTE
// PATCH /api/admin/customers/:id/unblock
// ============================================

export async function unblockAdminCustomerController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const customerId = getCustomerId(req);

  if (!customerId) {
    sendError(res, 400, "ID do cliente inválido.");
    return;
  }

  try {
    const customer =
      await unblockAdminCustomer(customerId);

    res.status(200).json({
      success: true,
      message: "Cliente desbloqueado com sucesso.",
      data: customer,
    });
  } catch (error) {
    handleCustomerError(error, res, next);
  }
}
