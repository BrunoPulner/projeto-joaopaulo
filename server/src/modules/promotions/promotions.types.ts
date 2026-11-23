
/**
 * restaurante.com
 * Tipagens do módulo de promoções
 */

// ============================================
// TIPOS DE PROMOÇÃO
// ============================================

export const PROMOTION_TARGET_TYPES = [
  "PRODUCT",
  "PIZZA_FLAVOR",
] as const;

export type PromotionTargetType =
  (typeof PROMOTION_TARGET_TYPES)[number];

// ============================================
// REGISTRO DE PROMOÇÃO INDIVIDUAL
// ============================================

export interface Promotion {
  id: number;
  name: string;

  targetType: PromotionTargetType;

  productId: number | null;
  pizzaFlavorId: number | null;

  // Vínculo opcional com uma oferta agrupada.
  groupId: number | null;

  promotionalPriceCents: number;

  isActive: boolean;

  startsAt: Date | null;
  endsAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CADASTRO DE PROMOÇÃO INDIVIDUAL
// ============================================

interface PromotionInputBase {
  name: string;
  promotionalPriceCents: number;

  isActive?: boolean;

  startsAt?: string | null;
  endsAt?: string | null;
}

export type CreatePromotionInput =
  PromotionInputBase &
    (
      | {
          targetType: "PRODUCT";
          productId: number;
          pizzaFlavorId?: never;
        }
      | {
          targetType: "PIZZA_FLAVOR";
          pizzaFlavorId: number;
          productId?: never;
        }
    );

// ============================================
// ATUALIZAÇÃO DE PROMOÇÃO INDIVIDUAL
// ============================================

export type UpdatePromotionInput = Partial<
  PromotionInputBase
>;

// ============================================
// PROMOÇÃO DISPONÍVEL AO CLIENTE
// ============================================

export interface PublicPromotion {
  id: number;
  name: string;

  targetType: PromotionTargetType;

  productId: number | null;
  pizzaFlavorId: number | null;

  promotionalPriceCents: number;

  startsAt: Date | null;
  endsAt: Date | null;
}

// ============================================
// GRUPO DE PROMOÇÕES
// ============================================

/**
 * Representa uma oferta administrativa.
 *
 * Exemplo:
 * "Terça da Pizza"
 *
 * Um grupo pode conter várias promoções
 * individuais, uma para cada sabor.
 */
export interface PromotionGroup {
  id: number;
  name: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// OFERTA AGRUPADA
// ============================================

/**
 * Estrutura retornada ao painel administrativo.
 *
 * Os dados comerciais permanecem nos
 * registros individuais da tabela Promotion.
 */
export interface PromotionGroupWithPromotions
  extends PromotionGroup {
  promotions: Promotion[];
}

// ============================================
// CADASTRO DE OFERTA AGRUPADA
// ============================================

interface PromotionGroupInputBase {
  name: string;

  // Preço aplicado individualmente a cada
  // sabor participante da oferta.
  promotionalPriceCents: number;

  isActive?: boolean;

  // Datas opcionais:
  // null = sem limite definido.
  startsAt?: string | null;
  endsAt?: string | null;
}

/**
 * Inicialmente, os grupos serão utilizados
 * para ofertas de pizzas com múltiplos sabores.
 *
 * Cada sabor gera uma promoção individual,
 * vinculada ao mesmo grupo.
 */
export interface CreatePromotionGroupInput
  extends PromotionGroupInputBase {
  targetType: "PIZZA_FLAVOR";

  // IDs dos sabores participantes.
  pizzaFlavorIds: number[];
}

// ============================================
// ATUALIZAÇÃO DE OFERTA AGRUPADA
// ============================================

/**
 * Permite atualizar os dados da oferta
 * e também sua lista de sabores.
 *
 * O service será responsável por sincronizar
 * os registros individuais em uma transação.
 */
export type UpdatePromotionGroupInput = Partial<
  PromotionGroupInputBase & {
    pizzaFlavorIds: number[];
  }
>;

// ============================================
// OFERTA AGRUPADA PARA O DASHBOARD
// ============================================

/**
 * Representação simplificada da oferta,
 * adequada para a interface administrativa.
 */
export interface AdminPromotionGroup {
  id: number;
  name: string;

  targetType: "PIZZA_FLAVOR";

  pizzaFlavorIds: number[];

  promotionalPriceCents: number;

  isActive: boolean;

  startsAt: Date | null;
  endsAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// PROMOÇÃO AGRUPADA DISPONÍVEL AO CLIENTE
// ============================================

/**
 * Utilizada futuramente para apresentar
 * uma única oferta com vários sabores
 * na seção de promoções do cardápio.
 */
export interface PublicPromotionGroup {
  id: number;
  name: string;

  targetType: "PIZZA_FLAVOR";

  pizzaFlavorIds: number[];

  promotionalPriceCents: number;

  startsAt: Date | null;
  endsAt: Date | null;
}
