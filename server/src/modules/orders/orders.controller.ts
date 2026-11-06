
import type { Request, Response } from "express";
import { z } from "zod";

import {
  createOrderSchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "./orders.schemas.js";

import {
  cancelCustomerOrder,
  createOrder,
  findOrderById,
  listAdminOrders,
  listCustomerOrders,
  OrderServiceError,
  updateOrderStatus,
} from "./orders.service.js";

// ============================================
// USUÁRIO AUTENTICADO
// ============================================

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function getAuthUser(
  response: Response,
): AuthUser | null {
  const user = response.locals.authUser as
    | Partial<AuthUser>
    | undefined;

  if (
    typeof user?.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string"
  ) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

// ============================================
// TRATAMENTO DE ERROS
// ============================================

function handleOrderError(
  response: Response,
  error: unknown,
  operation: string,
): void {
  if (error instanceof z.ZodError) {
    response.status(400).json({
      success: false,
      message: "Dados do pedido inválidos.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof OrderServiceError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error(
    `[ORDERS] Erro ao ${operation}:`,
    error,
  );

  response.status(500).json({
    success: false,
    message: "Erro interno ao processar pedido.",
  });
}

// ============================================
// VALIDAR ID
// ============================================

function parseOrderId(
  request: Request,
): number | null {
  const raw = request.params.id;

  if (
    typeof raw !== "string" ||
    !/^[1-9]\d*$/.test(raw)
  ) {
    return null;
  }

  const result = orderIdSchema.safeParse(raw);

  return result.success ? result.data : null;
}

// ============================================
// CRIAR PEDIDO
// ============================================

export async function postOrder(
  request: Request,
  response: Response,
): Promise<void> {
  const user = getAuthUser(response);

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Cliente não autenticado.",
    });
    return;
  }

  try {
    const input = createOrderSchema.parse(
      request.body,
    );

    const order = await createOrder(input, user);

    response.status(201).json({
      success: true,
      message: "Pedido registrado com sucesso.",
      data: order,
    });
  } catch (error) {
    handleOrderError(response, error, "criar pedido");
  }
}

// ============================================
// PEDIDOS DO CLIENTE
// ============================================

export async function getMyOrders(
  _request: Request,
  response: Response,
): Promise<void> {
  const user = getAuthUser(response);

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Cliente não autenticado.",
    });
    return;
  }

  try {
    const orders = await listCustomerOrders(
      user.id,
    );

    response.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    handleOrderError(
      response,
      error,
      "listar pedidos do cliente",
    );
  }
}

// ============================================
// CONSULTAR PEDIDO DO CLIENTE
// ============================================

export async function getMyOrderById(
  request: Request,
  response: Response,
): Promise<void> {
  const user = getAuthUser(response);
  const id = parseOrderId(request);

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Cliente não autenticado.",
    });
    return;
  }

  if (id === null) {
    response.status(400).json({
      success: false,
      message: "ID do pedido inválido.",
    });
    return;
  }

  try {
    const order = await findOrderById(id);

    // Não revelar pedidos de outros clientes.
    if (!order || order.customerId !== user.id) {
      response.status(404).json({
        success: false,
        message: "Pedido não encontrado.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleOrderError(
      response,
      error,
      "consultar pedido do cliente",
    );
  }
}

// ============================================
// CANCELAR PEDIDO - CLIENTE
// PATCH /api/orders/:id/cancel
// ============================================

export async function patchMyOrderCancel(
  request: Request,
  response: Response,
): Promise<void> {
  const user = getAuthUser(response);

  if (!user) {
    response.status(401).json({
      success: false,
      message: "Cliente não autenticado.",
    });
    return;
  }

  const id = parseOrderId(request);

  if (id === null) {
    response.status(400).json({
      success: false,
      message: "ID do pedido inválido.",
    });
    return;
  }

  try {
    // O service valida:
    // - Propriedade do pedido;
    // - Status PENDING;
    // - Prazo máximo de 5 minutos;
    // - Reposição de estoque.
    const order = await cancelCustomerOrder(
      id,
      user.id,
    );

    response.status(200).json({
      success: true,
      message: "Pedido cancelado com sucesso.",
      data: order,
    });
  } catch (error) {
    handleOrderError(
      response,
      error,
      "cancelar pedido do cliente",
    );
  }
}

// ============================================
// LISTAR PEDIDOS - ADMIN
// ============================================

export async function getAdminOrders(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const orders = await listAdminOrders();

    response.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    handleOrderError(
      response,
      error,
      "listar pedidos administrativos",
    );
  }
}

// ============================================
// CONSULTAR PEDIDO - ADMIN
// ============================================

export async function getAdminOrderById(
  request: Request,
  response: Response,
): Promise<void> {
  const id = parseOrderId(request);

  if (id === null) {
    response.status(400).json({
      success: false,
      message: "ID do pedido inválido.",
    });
    return;
  }

  try {
    const order = await findOrderById(id);

    if (!order) {
      response.status(404).json({
        success: false,
        message: "Pedido não encontrado.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleOrderError(
      response,
      error,
      "consultar pedido administrativo",
    );
  }
}

// ============================================
// ATUALIZAR STATUS - ADMIN
// ============================================

export async function patchAdminOrderStatus(
  request: Request,
  response: Response,
): Promise<void> {
  const id = parseOrderId(request);

  if (id === null) {
    response.status(400).json({
      success: false,
      message: "ID do pedido inválido.",
    });
    return;
  }

  try {
    const input = updateOrderStatusSchema.parse(
      request.body,
    );

    const order = await updateOrderStatus(
      id,
      input.status,
    );

    if (!order) {
      response.status(404).json({
        success: false,
        message: "Pedido não encontrado ou encerrado.",
      });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Status atualizado com sucesso.",
      data: order,
    });
  } catch (error) {
    handleOrderError(
      response,
      error,
      "atualizar status",
    );
  }
}
