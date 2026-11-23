
const API_URL = (
  import.meta.env.VITE_API_URL ??
  "http://localhost:3000"
).replace(/\/$/, "");

// ============================================
// TIPOS DE PROMOÇÕES
// ============================================

export type PromotionTargetType =
  | "PRODUCT"
  | "PIZZA_FLAVOR";

export type PromotionStatus =
  | "ACTIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "INACTIVE";

// ============================================
// PROMOÇÃO INDIVIDUAL
// ============================================

export interface AdminPromotion {
  id: number;
  name: string;

  targetType: PromotionTargetType;

  productId: number | null;
  pizzaFlavorId: number | null;

  // Associação opcional com uma oferta agrupada.
  groupId: number | null;

  promotionalPriceCents: number;

  isActive: boolean;

  startsAt: string | null;
  endsAt: string | null;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// PROMOÇÃO PÚBLICA
// ============================================

export interface PublicPromotion {
  id: number;
  name: string;

  targetType: PromotionTargetType;

  productId: number | null;
  pizzaFlavorId: number | null;

  promotionalPriceCents: number;

  startsAt: string | null;
  endsAt: string | null;
}

// ============================================
// CAMPOS COMPARTILHADOS
// ============================================

interface PromotionBasePayload {
  name: string;

  // Valor em centavos.
  promotionalPriceCents: number;

  isActive?: boolean;

  // null significa ausência do limite.
  startsAt?: string | null;
  endsAt?: string | null;
}

// ============================================
// CADASTRAR PROMOÇÃO INDIVIDUAL
// ============================================

export type CreatePromotionPayload =
  | (PromotionBasePayload & {
      targetType: "PRODUCT";
      productId: number;
      pizzaFlavorId?: never;
    })
  | (PromotionBasePayload & {
      targetType: "PIZZA_FLAVOR";
      pizzaFlavorId: number;
      productId?: never;
    });

// ============================================
// EDITAR PROMOÇÃO INDIVIDUAL
// ============================================

export type UpdatePromotionPayload = Partial<
  PromotionBasePayload
>;

// ============================================
// OFERTA AGRUPADA
// ============================================

/**
 * Representa uma oferta com vários sabores.
 *
 * Exemplo:
 * Terça da Pizza
 * Sabores: Calabresa, Crocante
 * Preço: R$ 25,00
 */
export interface AdminPromotionGroup {
  id: number;
  name: string;

  targetType: "PIZZA_FLAVOR";

  pizzaFlavorIds: number[];

  promotionalPriceCents: number;

  isActive: boolean;

  startsAt: string | null;
  endsAt: string | null;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// CADASTRAR OFERTA AGRUPADA
// ============================================

export interface CreatePromotionGroupPayload
  extends PromotionBasePayload {
  targetType: "PIZZA_FLAVOR";

  // IDs dos sabores selecionados.
  pizzaFlavorIds: number[];
}

// ============================================
// EDITAR OFERTA AGRUPADA
// ============================================

/**
 * A lista pizzaFlavorIds, quando enviada,
 * substitui os sabores participantes.
 */
export type UpdatePromotionGroupPayload = Partial<
  PromotionBasePayload & {
    pizzaFlavorIds: number[];
  }
>;

// ============================================
// RESPOSTAS DO BACKEND
// ============================================

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorResponse {
  success: false;
  message: string;
}

type ApiResponse<T> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

// ============================================
// FUNÇÃO CENTRAL DE REQUISIÇÕES
// ============================================

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      credentials: "include",

      headers: {
        ...(options.body
          ? {
              "Content-Type": "application/json",
            }
          : {}),

        ...options.headers,
      },
    },
  );

  const result: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const message =
      result &&
      typeof result === "object" &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : `Erro na requisição (${response.status}).`;

    throw new Error(message);
  }

  if (
    !result ||
    typeof result !== "object" ||
    !("success" in result)
  ) {
    throw new Error(
      "Resposta inválida do servidor.",
    );
  }

  const apiResponse = result as ApiResponse<T>;

  if (!apiResponse.success) {
    throw new Error(apiResponse.message);
  }

  return apiResponse.data;
}

// ============================================
// API DE PROMOÇÕES INDIVIDUAIS
// ============================================

export const adminPromotionsApi = {
  // ==========================================
  // LISTAR TODAS AS PROMOÇÕES (ADMIN)
  // ==========================================

  listAdmin: () =>
    request<AdminPromotion[]>(
      "/api/admin/promotions",
    ),

  // ==========================================
  // LISTAR PROMOÇÕES PÚBLICAS
  // ==========================================

  listPublic: () =>
    request<PublicPromotion[]>(
      "/api/promotions",
    ),

  // ==========================================
  // CONSULTAR PROMOÇÃO POR ID
  // ==========================================

  getById: (id: number) =>
    request<AdminPromotion>(
      `/api/admin/promotions/${id}`,
    ),

  // ==========================================
  // CADASTRAR PROMOÇÃO
  // ==========================================

  create: (
    payload: CreatePromotionPayload,
  ) =>
    request<AdminPromotion>(
      "/api/admin/promotions",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  // ==========================================
  // EDITAR PROMOÇÃO
  // ==========================================

  update: (
    id: number,
    payload: UpdatePromotionPayload,
  ) =>
    request<AdminPromotion>(
      `/api/admin/promotions/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  // ==========================================
  // DESATIVAR PROMOÇÃO
  // ==========================================

  deactivate: (id: number) =>
    request<AdminPromotion>(
      `/api/admin/promotions/${id}/deactivate`,
      {
        method: "PATCH",
      },
    ),

  // ==========================================
  // REATIVAR PROMOÇÃO
  // ==========================================

  reactivate: (id: number) =>
    request<AdminPromotion>(
      `/api/admin/promotions/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          isActive: true,
        }),
      },
    ),
};

// ============================================
// API DE OFERTAS AGRUPADAS
// ============================================

export const adminPromotionGroupsApi = {
  // ==========================================
  // LISTAR OFERTAS
  // ==========================================

  listAdmin: () =>
    request<AdminPromotionGroup[]>(
      "/api/admin/promotion-groups",
    ),

  // ==========================================
  // CONSULTAR OFERTA POR ID
  // ==========================================

  getById: (id: number) =>
    request<AdminPromotionGroup>(
      `/api/admin/promotion-groups/${id}`,
    ),

  // ==========================================
  // CADASTRAR OFERTA
  // ==========================================

  create: (
    payload: CreatePromotionGroupPayload,
  ) =>
    request<AdminPromotionGroup>(
      "/api/admin/promotion-groups",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),

  // ==========================================
  // EDITAR OFERTA
  // ==========================================

  update: (
    id: number,
    payload: UpdatePromotionGroupPayload,
  ) =>
    request<AdminPromotionGroup>(
      `/api/admin/promotion-groups/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    ),

  // ==========================================
  // DESATIVAR OFERTA
  // ==========================================

  deactivate: (id: number) =>
    request<AdminPromotionGroup>(
      `/api/admin/promotion-groups/${id}/deactivate`,
      {
        method: "PATCH",
      },
    ),

  // ==========================================
  // REATIVAR OFERTA
  // ==========================================

  reactivate: (id: number) =>
    request<AdminPromotionGroup>(
      `/api/admin/promotion-groups/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          isActive: true,
        }),
      },
    ),
};

// ============================================
// UTILITÁRIOS DE FORMATAÇÃO
// ============================================

const currencyFormatter = new Intl.NumberFormat(
  "pt-BR",
  {
    style: "currency",
    currency: "BRL",
  },
);

export function formatPromotionPrice(
  priceCents: number,
): string {
  return currencyFormatter.format(
    priceCents / 100,
  );
}

export function promotionPriceToCents(
  value: number,
): number {
  return Math.round(value * 100);
}

// ============================================
// MÁSCARA MONETÁRIA
// ============================================

/**
 * Converte uma sequência de dígitos
 * para o formato brasileiro.
 *
 * Exemplos:
 * "1"     -> "0,01"
 * "250"   -> "2,50"
 * "2500"  -> "25,00"
 * "2990"  -> "29,90"
 *
 * Pode ser utilizada diretamente no onChange
 * do input de preço.
 */
export function maskPromotionCurrency(
  value: string,
): string {
  const digits = value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "");

  if (!digits) {
    return "";
  }

  const cents = Number(digits);

  if (!Number.isSafeInteger(cents)) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Converte a máscara monetária em centavos.
 *
 * Exemplos:
 * "25,00" -> 2500
 * "29,90" -> 2990
 * "1.250,50" -> 125050
 */
export function maskedPromotionCurrencyToCents(
  value: string,
): number {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  const cents = Number(digits);

  return Number.isSafeInteger(cents)
    ? cents
    : 0;
}

/**
 * Converte centavos para um valor editável
 * com máscara brasileira.
 */
export function promotionCentsToMaskedCurrency(
  cents: number,
): string {
  if (
    !Number.isSafeInteger(cents) ||
    cents < 0
  ) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// ============================================
// STATUS DAS PROMOÇÕES
// ============================================

export function getPromotionStatus(
  promotion: Pick<
    AdminPromotion,
    "isActive" | "startsAt" | "endsAt"
  >,
): PromotionStatus {
  if (!promotion.isActive) {
    return "INACTIVE";
  }

  const now = Date.now();

  if (
    promotion.startsAt &&
    new Date(promotion.startsAt).getTime() > now
  ) {
    return "SCHEDULED";
  }

  if (
    promotion.endsAt &&
    new Date(promotion.endsAt).getTime() <= now
  ) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

// ============================================
// LABELS
// ============================================

export const PROMOTION_STATUS_LABELS = {
  ACTIVE: "Ativa",
  SCHEDULED: "Agendada",
  EXPIRED: "Expirada",
  INACTIVE: "Desativada",
} as const;

export const PROMOTION_TARGET_LABELS = {
  PRODUCT: "Produto",
  PIZZA_FLAVOR: "Sabor de pizza",
} as const;
