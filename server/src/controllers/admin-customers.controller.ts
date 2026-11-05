
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

import {
  adminCustomerIdParamsSchema,
  updateAdminCustomerNameSchema,
  blockAdminCustomerSchema,
} from "../schemas/admin-customers.schema.js";

// ============================================
// RESPOSTAS PADRONIZADAS
// ============================================

function sendError(
  res: Response,
  status: number,
  message: string,
): void {
  res.status(status).json({
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
): void {
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
  res: Response,
): string | null {
  const parsed =
    adminCustomerIdParamsSchema.safeParse(
      req.params,
    );

  if (!parsed.success) {
    sendError(
      res,
      400,
      "ID do cliente inválido.",
    );

    return null;
  }

  return parsed.data.id;
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
  const customerId = getCustomerId(req, res);

  if (customerId === null) {
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
  const customerId = getCustomerId(req, res);

  if (customerId === null) {
    return;
  }

  const parsed =
    updateAdminCustomerNameSchema.safeParse(
      req.body,
    );

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ??
      "Dados inválidos para atualizar o nome.";

    sendError(res, 400, message);
    return;
  }

  try {
    const customer =
      await updateAdminCustomerName(
        customerId,
        parsed.data.displayName,
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
  const customerId = getCustomerId(req, res);

  if (customerId === null) {
    return;
  }

  const parsed =
    blockAdminCustomerSchema.safeParse(
      req.body ?? {},
    );

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ??
      "Dados inválidos para bloquear o cliente.";

    sendError(res, 400, message);
    return;
  }

  const reason =
    parsed.data.reason ?? null;

  try {
    const customer =
      await blockAdminCustomer(
        customerId,
        reason,
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
  const customerId = getCustomerId(req, res);

  if (customerId === null) {
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
