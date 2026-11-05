
import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

import { pool } from "../../lib/db.js";
import { checkDeliveryAvailability } from
  "../delivery-settings/delivery-settings.service.js";

import type {
  CreateOrderInput,
  CreateOrderItemInput,
  Order,
  OrderAddonSnapshot,
  OrderItem,
  OrderPizzaSnapshot,
  OrderRemovedIngredientSnapshot,
  OrderStatus,
} from "./orders.types.js";

// ============================================
// ERROS DE NEGÓCIO
// ============================================

export class OrderServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

// ============================================
// TIPOS INTERNOS
// ============================================

export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
}

interface ProductRow {
  id: number;
  name: string;
  imageUrl: string | null;
  priceCents: number;
  pricingType: string;
  allowsAddons: boolean;
  stockQuantity: number | null;
  isActive: boolean;
  isAvailable: boolean;
}

interface AddonRow {
  id: number;
  name: string;
  priceCents: number;
}

interface IngredientRow {
  id: number;
  name: string;
  isRemovable: boolean;
}

interface PreparedItem {
  productId: number;
  productName: string;
  productImageUrl: string | null;
  quantity: number;
  notes: string;
  unitPriceCents: number;
  totalPriceCents: number;
  addons: OrderAddonSnapshot[];
  removedIngredients: OrderRemovedIngredientSnapshot[];
  type: "PRODUCT" | "PIZZA";
  pizza: OrderPizzaSnapshot | null;
}

// ============================================
// UTILITÁRIOS
// ============================================

const MAX_CENTS = 2_147_483_647;

function assertMoney(value: number): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_CENTS
  ) {
    throw new OrderServiceError(
      "O valor calculado para o pedido é inválido.",
    );
  }
}

// Canonicaliza objetos para que a ordem das propriedades não altere o hash.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

function createRequestHash(
  input: CreateOrderInput,
  customerId: string,
): string {
  // Remove idempotencyKey do conteúdo utilizado
  // para gerar a assinatura da requisição.
  const payload = { ...input };

  delete (payload as Partial<CreateOrderInput>)
    .idempotencyKey;

  return createHash("sha256")
    .update(
      JSON.stringify(
        canonicalize({
          customerId,
          ...payload,
        }),
      ),
    )
    .digest("hex");
}

function buildOrderNumber(id: number): string {
  return `JP-${String(id).padStart(6, "0")}`;
}

function assertCustomer(customer: OrderCustomer): void {
  if (!customer.id || !customer.email) {
    throw new OrderServiceError(
      "Cliente não autenticado.",
      401,
    );
  }
}


 // ============================================
 // VALIDAR PERMISSÃO DO CLIENTE PARA PEDIDOS
 // ============================================

 async function assertCustomerCanOrder(
   client: PoolClient,
   customerId: string,
 ): Promise<void> {
   const result = await client.query<{
     ordersBlocked: boolean;
   }>(
     `
     SELECT "ordersBlocked"
     FROM public."user"
     WHERE id = $1
       AND role = 'CUSTOMER'
     FOR SHARE
     `,
     [customerId],
   );

   const customer = result.rows[0];

   if (!customer) {
     throw new OrderServiceError(
       "Cliente não encontrado ou sem permissão para realizar pedidos.",
       403,
     );
   }

   if (customer.ordersBlocked) {
     throw new OrderServiceError(
       "Sua conta está temporariamente impedida de realizar pedidos. Entre em contato com o restaurante.",
       403,
     );
   }
 }


// ============================================
// BUSCAR PRODUTO
// ============================================

async function getProduct(
  client: PoolClient,
  productId: number,
): Promise<ProductRow> {
  const result = await client.query<ProductRow>(
    `
    SELECT
      id,
      name,
      "imageUrl",
      "priceCents",
      "pricingType",
      "allowsAddons",
      "stockQuantity",
      "isActive",
      "isAvailable"
    FROM public."Product"
    WHERE id = $1
    FOR UPDATE
    `,
    [productId],
  );

  const product = result.rows[0];

  if (!product) {
    throw new OrderServiceError(
      "Produto não encontrado.",
      404,
    );
  }

  if (!product.isActive || !product.isAvailable) {
    throw new OrderServiceError(
      `O produto ${product.name} está indisponível.`,
      409,
    );
  }

  return product;
}

// ============================================
// VALIDAR ADICIONAIS
// ============================================

async function resolveAddons(
  client: PoolClient,
  product: ProductRow,
  item: CreateOrderItemInput,
): Promise<{
  addons: OrderAddonSnapshot[];
  additionalCents: number;
}> {
  const selected = item.addons ?? [];

  if (selected.length === 0) {
    return { addons: [], additionalCents: 0 };
  }

  if (!product.allowsAddons) {
    throw new OrderServiceError(
      `${product.name} não permite adicionais.`,
    );
  }

  const ids = selected.map((addon) => addon.id);

  if (new Set(ids).size !== ids.length) {
    throw new OrderServiceError(
      "Existem adicionais duplicados.",
    );
  }

  // O adicional pode estar associado diretamente ao produto,
  // à sua subcategoria ou à categoria principal.
  const result = await client.query<AddonRow>(
    `
    SELECT DISTINCT a.id, a.name, a."priceCents"
    FROM public."Addon" a
    JOIN public."Product" p ON p.id = $1
    WHERE a.id = ANY($2::integer[])
      AND a."isActive" = TRUE
      AND (
        EXISTS (
          SELECT 1 FROM public."ProductAddon" pa
          WHERE pa."productId" = p.id
            AND pa."addonId" = a.id
            AND pa."isActive" = TRUE
        )
        OR EXISTS (
          SELECT 1 FROM public."AddonSubcategory" sa
          WHERE sa."subcategoryId" = p."subcategoryId"
            AND sa."addonId" = a.id
            AND sa."isActive" = TRUE
        )
        OR EXISTS (
          SELECT 1 FROM public."AddonCategory" ca
          WHERE ca."categoryId" = p."categoryId"
            AND ca."addonId" = a.id
            AND ca."isActive" = TRUE
        )
      )
    `,
    [product.id, ids],
  );

  if (result.rows.length !== ids.length) {
    throw new OrderServiceError(
      "Um ou mais adicionais não estão disponíveis.",
      409,
    );
  }

  const addonMap = new Map(
    result.rows.map((addon) => [addon.id, addon]),
  );

  const snapshots: OrderAddonSnapshot[] = [];
  let additionalCents = 0;

  for (const selectedAddon of selected) {
    const addon = addonMap.get(selectedAddon.id);

    if (!addon) {
      throw new OrderServiceError(
        "Adicional não encontrado.",
      );
    }

    const quantity = selectedAddon.quantity;

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 50
    ) {
      throw new OrderServiceError(
        "Quantidade de adicional inválida.",
      );
    }

    additionalCents += addon.priceCents * quantity;
    assertMoney(additionalCents);

    snapshots.push({
      id: addon.id,
      name: addon.name,
      quantity,
      unitPriceCents: addon.priceCents,
    });
  }

  return {
    addons: snapshots,
    additionalCents,
  };
}

// ============================================
// VALIDAR INGREDIENTES REMOVIDOS
// ============================================

async function resolveRemovedIngredients(
  client: PoolClient,
  productId: number,
  ids: number[],
): Promise<OrderRemovedIngredientSnapshot[]> {
  if (ids.length === 0) return [];

  if (new Set(ids).size !== ids.length) {
    throw new OrderServiceError(
      "Existem ingredientes duplicados.",
    );
  }

  const result = await client.query<IngredientRow>(
    `
    SELECT
      id,
      name,
      "isRemovable"
    FROM public."ProductIngredient"
    WHERE "productId" = $1
      AND id = ANY($2::integer[])
    `,
    [productId, ids],
  );

  if (result.rows.length !== ids.length) {
    throw new OrderServiceError(
      "Um ou mais ingredientes são inválidos.",
    );
  }

  if (result.rows.some((row) => !row.isRemovable)) {
    throw new OrderServiceError(
      "Um ingrediente selecionado não pode ser removido.",
    );
  }

  return result.rows.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
  }));
}

// ============================================
// PREPARAR ITEM CONVENCIONAL
// ============================================

async function prepareItem(
  client: PoolClient,
  item: CreateOrderItemInput,
): Promise<PreparedItem> {
  if (item.type !== "PRODUCT" || item.pizza) {
    throw new OrderServiceError("Configuração incompatível com produto convencional.", 400);
  }

  if (
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 99
  ) {
    throw new OrderServiceError(
      "Quantidade de produto inválida.",
    );
  }

  const product = await getProduct(
    client,
    item.productId,
  );

  if (product.pricingType !== "FIXED") {
    throw new OrderServiceError(
      "Este produto exige uma configuração específica.",
      409,
    );
  }

  // ==========================================
  // ESTOQUE
  // ==========================================

  if (product.stockQuantity !== null) {
    if (product.stockQuantity < item.quantity) {
      throw new OrderServiceError(
        `Estoque insuficiente para ${product.name}.`,
        409,
      );
    }
  }

  // ==========================================
  // PERSONALIZAÇÕES
  // ==========================================

  const { addons, additionalCents } =
    await resolveAddons(client, product, item);

  const removedIngredients =
    await resolveRemovedIngredients(
      client,
      product.id,
      item.removedIngredientIds ?? [],
    );

  // ==========================================
  // PREÇO
  // ==========================================

  const unitPriceCents =
    product.priceCents + additionalCents;

  const totalPriceCents =
    unitPriceCents * item.quantity;

  assertMoney(unitPriceCents);
  assertMoney(totalPriceCents);

  return {
    productId: product.id,
    productName: product.name,
    productImageUrl: product.imageUrl,
    quantity: item.quantity,
    notes: item.notes ?? "",
    unitPriceCents,
    totalPriceCents,
    addons,
    removedIngredients,
    type: "PRODUCT",
    pizza: null,
  };
}

// ============================================
// PREPARAR PIZZA PERSONALIZADA
// ============================================

interface PizzaSizeRow {
  id: number;
  name: string;
  basePriceCents: number;
  maxFlavors: number;
}

interface PizzaFlavorRow {
  id: number;
  name: string;
  additionalPriceCents: number;
  isPremium: boolean;
  premiumAdditionalCents: number;
}

interface PizzaAddonRow {
  id: number;
  name: string;
  priceCents: number;
}

async function preparePizzaItem(
  client: PoolClient,
  item: CreateOrderItemInput,
): Promise<PreparedItem> {
  if (item.type !== "PIZZA" || !item.pizza) {
    throw new OrderServiceError("Informe a configuração da pizza.");
  }
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
    throw new OrderServiceError("Quantidade de pizzas inválida.");
  }
  if ((item.addons?.length ?? 0) > 0 || (item.removedIngredientIds?.length ?? 0) > 0) {
    throw new OrderServiceError("Para pizzas, informe adicionais em pizza.addonIds; ingredientes removidos não são aceitos neste fluxo.");
  }

  const product = await getProduct(client, item.productId);
  if (product.pricingType !== "PIZZA_CUSTOM") {
    throw new OrderServiceError("O produto não permite configuração de pizza.", 409);
  }

  const config = item.pizza;
  if (!Number.isInteger(config.sizeId) || !Array.isArray(config.flavorIds) || !Array.isArray(config.addonIds)) {
    throw new OrderServiceError("Configuração da pizza inválida.");
  }
  if (config.flavorIds.length === 0 || new Set(config.flavorIds).size !== config.flavorIds.length) {
    throw new OrderServiceError("Selecione sabores distintos para a pizza.");
  }
  if (new Set(config.addonIds).size !== config.addonIds.length) {
    throw new OrderServiceError("Existem adicionais de pizza duplicados.");
  }
  if (![...config.flavorIds, ...config.addonIds].every((id) => Number.isSafeInteger(id) && id > 0)) {
    throw new OrderServiceError("Identificadores de sabores ou adicionais inválidos.");
  }

  const sizeResult = await client.query<PizzaSizeRow>(
    `SELECT id, name, "basePriceCents", "maxFlavors"
     FROM public."PizzaSize"
     WHERE id = $1 AND "isActive" = TRUE AND "isAvailable" = TRUE`,
    [config.sizeId],
  );
  const size = sizeResult.rows[0];
  if (!size) throw new OrderServiceError("Tamanho de pizza indisponível.", 409);
  if (config.flavorIds.length > size.maxFlavors) {
    throw new OrderServiceError(`O tamanho ${size.name} permite no máximo ${size.maxFlavors} sabores.`, 409);
  }
  assertMoney(size.basePriceCents);

  const flavorsResult = await client.query<PizzaFlavorRow>(
    `SELECT f.id, f.name, f."additionalPriceCents", f."isPremium", f."premiumAdditionalCents"
     FROM public."PizzaFlavor" f
     WHERE f.id = ANY($1::integer[])
       AND f."isActive" = TRUE
       AND (
         f."allSizes" = TRUE
         OR EXISTS (
           SELECT 1 FROM public."PizzaFlavorSize" fs
           WHERE fs."pizzaFlavorId" = f.id
             AND fs."pizzaSizeId" = $2
             AND fs."isActive" = TRUE
         )
       )`,
    [config.flavorIds, config.sizeId],
  );
  if (flavorsResult.rows.length !== config.flavorIds.length) {
    throw new OrderServiceError("Um ou mais sabores não estão disponíveis para esse tamanho.", 409);
  }
  const flavorMap = new Map(flavorsResult.rows.map((flavor) => [flavor.id, flavor]));
  const flavors = config.flavorIds.map((id) => {
    const flavor = flavorMap.get(id);
    if (!flavor) throw new OrderServiceError("Sabor não encontrado.", 409);
    assertMoney(flavor.additionalPriceCents);
    assertMoney(flavor.premiumAdditionalCents);
    return {
      id: flavor.id,
      name: flavor.name,
      additionalPriceCents: flavor.additionalPriceCents,
      isPremium: flavor.isPremium,
      premiumAdditionalCents: flavor.isPremium ? flavor.premiumAdditionalCents : 0,
    };
  });

  // Política: um adicional precisa estar vinculado a pelo menos um sabor selecionado.
  
  // ==========================================
  // ADICIONAIS DA PIZZA
  // ==========================================
  // Aceita adicionais vinculados:
  // 1. Diretamente a um dos sabores selecionados;
  // 2. À subcategoria de um dos sabores selecionados.
  //
  // Basta existir um vínculo ativo em uma dessas
  // modalidades. O adicional também precisa estar ativo.

  const addonsResult = config.addonIds.length
    ? await client.query<PizzaAddonRow>(
        `
          SELECT
            a.id,
            a.name,
            a."priceCents"
          FROM public."Addon" a
          WHERE a.id = ANY($1::integer[])
            AND a."isActive" = TRUE
            AND (
              EXISTS (
                SELECT 1
                FROM public."PizzaFlavorAddon" pfa
                WHERE pfa."addonId" = a.id
                  AND pfa."pizzaFlavorId" = ANY($2::integer[])
                  AND pfa."isActive" = TRUE
              )

              OR EXISTS (
                SELECT 1
                FROM public."AddonSubcategory" ads
                INNER JOIN public."PizzaFlavor" pf
                  ON pf."subcategoryId" = ads."subcategoryId"
                WHERE ads."addonId" = a.id
                  AND pf.id = ANY($2::integer[])
                  AND pf."isActive" = TRUE
                  AND ads."isActive" = TRUE
              )
            )
        `,
        [config.addonIds, config.flavorIds],
      )
    : { rows: [] as PizzaAddonRow[] };

  if (addonsResult.rows.length !== config.addonIds.length) {
    throw new OrderServiceError(
      "Um ou mais adicionais não estão disponíveis para os sabores escolhidos.",
      409,
    );
  }

  const addonMap = new Map(addonsResult.rows.map((addon) => [addon.id, addon]));
  const pizzaAddons = config.addonIds.map((id) => {
    const addon = addonMap.get(id);
    if (!addon) throw new OrderServiceError("Adicional não encontrado.", 409);
    assertMoney(addon.priceCents);
    return { id: addon.id, name: addon.name, priceCents: addon.priceCents };
  });

  const flavorsCents = flavors.reduce(
    (sum, flavor) => sum + flavor.additionalPriceCents + flavor.premiumAdditionalCents,
    0,
  );
  const addonsCents = pizzaAddons.reduce((sum, addon) => sum + addon.priceCents, 0);
  const unitPriceCents = size.basePriceCents + flavorsCents + addonsCents;
  const totalPriceCents = unitPriceCents * item.quantity;
  assertMoney(unitPriceCents);
  assertMoney(totalPriceCents);

  return {
    productId: product.id,
    productName: product.name,
    productImageUrl: product.imageUrl,
    quantity: item.quantity,
    notes: item.notes ?? "",
    unitPriceCents,
    totalPriceCents,
    type: "PIZZA",
    addons: [],
    removedIngredients: [],
    pizza: {
      size: { id: size.id, name: size.name, basePriceCents: size.basePriceCents },
      flavors,
      addons: pizzaAddons,
    },
  };
}

// ============================================
// CONSULTAR PEDIDO COMPLETO
// ============================================

async function findOrderWithClient(
  client: PoolClient,
  id: number,
): Promise<Order | null> {
  const result = await client.query<Order>(
    `
    SELECT *
    FROM public."Order"
    WHERE id = $1
    LIMIT 1
    `,
    [id],
  );

  const order = result.rows[0];

  if (!order) return null;

  const items = await client.query<OrderItem>(
    `
    SELECT *
    FROM public."OrderItem"
    WHERE "orderId" = $1
    ORDER BY id ASC
    `,
    [id],
  );

  return {
    ...order,
    items: items.rows,
  };
}

// ============================================
// CRIAR PEDIDO
// ============================================

export async function createOrder(
  input: CreateOrderInput,
  customer: OrderCustomer,
): Promise<Order> {
  assertCustomer(customer);

  if (!input.idempotencyKey) {
    throw new OrderServiceError(
      "Chave de confirmação do pedido não informada.",
    );
  }

  if (input.items.length === 0) {
    throw new OrderServiceError(
      "O carrinho está vazio.",
    );
  }

  // ==========================================
  // VERIFICAR ENTREGA
  // ==========================================

  let deliveryFeeCents = 0;

  if (input.fulfillmentType === "DELIVERY") {
    const address = input.deliveryAddress;

    if (!address) {
      throw new OrderServiceError(
        "Informe o endereço de entrega.",
      );
    }

    const availability =
      await checkDeliveryAvailability({
        latitude: address.coordinates.latitude,
        longitude: address.coordinates.longitude,
      });

    if (
      !availability.available ||
      availability.feeCents === null
    ) {
      throw new OrderServiceError(
        availability.message ??
          "Entrega indisponível neste endereço.",
        409,
      );
    }

    deliveryFeeCents = availability.feeCents;
  } else if (
    input.fulfillmentType === "PICKUP" &&
    input.deliveryAddress
  ) {
    throw new OrderServiceError(
      "Pedidos para retirada não devem conter endereço.",
    );
  }

  assertMoney(deliveryFeeCents);

  const requestHash = createRequestHash(input, customer.id);

  // ==========================================
  // INICIAR TRANSAÇÃO
  // ==========================================

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Serializa tentativas com a mesma chave.
    await client.query(
      `SELECT pg_advisory_xact_lock(
        hashtextextended($1, 0)
      )`,
      [input.idempotencyKey],
    );

    // ========================================
    // VALIDAR PERMISSÃO DO CLIENTE
    // ========================================

    await assertCustomerCanOrder(
      client,
      customer.id,
    );

    // ========================================
    // VERIFICAR IDEMPOTÊNCIA
    // ========================================

    const existing = await client.query<{
      id: number;
      customerId: string;
      requestHash: string | null;
    }>(
      `
      SELECT id, "customerId", "requestHash"
      FROM public."Order"
      WHERE "idempotencyKey" = $1
      `,
      [input.idempotencyKey],
    );

    const previous = existing.rows[0];

    if (previous) {
      if (previous.customerId !== customer.id) {
        throw new OrderServiceError(
          "Chave de pedido já utilizada.",
          409,
        );
      }

      if (previous.requestHash !== requestHash) {
        throw new OrderServiceError(
          "Esta chave de confirmação já foi usada com outro conteúdo de pedido.",
          409,
        );
      }

      const previousOrder = await findOrderWithClient(
        client,
        previous.id,
      );

      if (!previousOrder) {
        throw new OrderServiceError(
          "Não foi possível recuperar o pedido.",
          500,
        );
      }

      await client.query("COMMIT");
      return previousOrder;
    }

    // ========================================
    // PREPARAR ITENS
    // ========================================

    const prepared: PreparedItem[] = [];

    // Ordem estável dos bloqueios de estoque.
    const sortedItems = [...input.items].sort(
      (a, b) => a.productId - b.productId,
    );

    for (const item of sortedItems) {
      prepared.push(
        await (item.type === "PIZZA" ? preparePizzaItem(client, item) : prepareItem(client, item)),
      );
    }

    // ========================================
    // VALIDAR ESTOQUE AGREGADO
    // ========================================

    const quantitiesByProduct = new Map<number, number>();
    for (const item of prepared) {
      quantitiesByProduct.set(
        item.productId,
        (quantitiesByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    // As linhas dos produtos já foram bloqueadas por prepareItem/getProduct.
    // Confere a soma antes de inserir qualquer pedido.
    for (const [productId, quantity] of quantitiesByProduct) {
      const result = await client.query<{
        name: string;
        stockQuantity: number | null;
      }>(
        `SELECT name, "stockQuantity" FROM public."Product" WHERE id = $1`,
        [productId],
      );
      const product = result.rows[0];
      if (!product) {
        throw new OrderServiceError("Produto não encontrado.", 404);
      }
      if (product.stockQuantity !== null && product.stockQuantity < quantity) {
        throw new OrderServiceError(
          `Estoque insuficiente para ${product.name}.`,
          409,
        );
      }
    }

    // ========================================
    // CALCULAR TOTAL
    // ========================================

    const subtotalCents = prepared.reduce(
      (sum, item) => sum + item.totalPriceCents,
      0,
    );

    const totalCents =
      subtotalCents + deliveryFeeCents;

    assertMoney(subtotalCents);
    assertMoney(totalCents);

    // ========================================
    // INSERIR PEDIDO
    // ========================================

    const orderId = randomUUID();

    // O ID numérico é gerado pelo banco.
    // O número público será atualizado em seguida.
    const inserted = await client.query<{
      id: number;
    }>(
      `
      INSERT INTO public."Order" (
        "orderNumber",
        "idempotencyKey",
        "requestHash",
        "customerId",
        "customerName",
        "customerEmail",
        status,
        "paymentStatus",
        "paymentMethod",
        "fulfillmentType",
        "deliveryAddress",
        notes,
        "subtotalCents",
        "deliveryFeeCents",
        "totalCents",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        'PENDING',
        'NOT_PROCESSED',
        $7, $8, $9::jsonb,
        $10, $11, $12, $13,
        NOW()
      )
      RETURNING id
      `,
      [
        `TEMP-${orderId}`,
        input.idempotencyKey,
        requestHash,
        customer.id,
        customer.name,
        customer.email,
        input.paymentMethod,
        input.fulfillmentType,
        input.deliveryAddress
          ? JSON.stringify(input.deliveryAddress)
          : null,
        input.notes ?? "",
        subtotalCents,
        deliveryFeeCents,
        totalCents,
      ],
    );

    const id = inserted.rows[0]?.id;

    if (!id) {
      throw new OrderServiceError(
        "Falha ao criar pedido.",
        500,
      );
    }

    await client.query(
      `
      UPDATE public."Order"
      SET "orderNumber" = $1
      WHERE id = $2
      `,
      [buildOrderNumber(id), id],
    );

    // ========================================
    // INSERIR ITENS
    // ========================================

    for (const item of prepared) {
      await client.query(
        `
        INSERT INTO public."OrderItem" (
          "orderId",
          "productId",
          "productName",
          "productImageUrl",
          type,
          quantity,
          notes,
          "unitPriceCents",
          "totalPriceCents",
          addons,
          pizza,
          "removedIngredients"
        )
        VALUES (
          $1, $2, $3, $4,
          $5,
          $6, $7, $8, $9,
          $10::jsonb,
          $11::jsonb,
          $12::jsonb
        )
        `,
        [
          id,
          item.productId,
          item.productName,
          item.productImageUrl,
          item.type,
          item.quantity,
          item.notes,
          item.unitPriceCents,
          item.totalPriceCents,
          JSON.stringify(item.addons),
          item.pizza ? JSON.stringify(item.pizza) : null,
          JSON.stringify(item.removedIngredients),
        ],
      );


    }

    // Baixa única por produto, mesmo que apareça em várias linhas.
    for (const [productId, quantity] of quantitiesByProduct) {
      const result = await client.query<{
        stockQuantity: number | null;
      }>(
        `
        UPDATE public."Product"
        SET "stockQuantity" = "stockQuantity" - $1,
            "updatedAt" = NOW()
        WHERE id = $2
          AND "stockQuantity" IS NOT NULL
          AND "stockQuantity" >= $1
        RETURNING "stockQuantity"
        `,
        [quantity, productId],
      );
      if (result.rowCount === 0) {
        const check = await client.query<{ stockQuantity: number | null }>(
          `SELECT "stockQuantity" FROM public."Product" WHERE id = $1`,
          [productId],
        );
        if (!check.rows[0] || check.rows[0].stockQuantity !== null) {
          throw new OrderServiceError("Estoque insuficiente para concluir o pedido.", 409);
        }
      }
    }

    const order = await findOrderWithClient(client, id);

    if (!order) {
      throw new OrderServiceError(
        "Pedido não encontrado após criação.",
        500,
      );
    }

    await client.query("COMMIT");

    return order;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// ============================================
// PEDIDOS DO CLIENTE
// ============================================

export async function listCustomerOrders(
  customerId: string,
): Promise<Order[]> {
  const result = await pool.query<{ id: number }>(
    `
    SELECT id
    FROM public."Order"
    WHERE "customerId" = $1
    ORDER BY "createdAt" DESC
    LIMIT 100
    `,
    [customerId],
  );

  const client = await pool.connect();

  try {
    const orders: Order[] = [];

    for (const row of result.rows) {
      const order = await findOrderWithClient(
        client,
        row.id,
      );

      if (order) orders.push(order);
    }

    return orders;
  } finally {
    client.release();
  }
}

// ============================================
// PEDIDOS DO ADMINISTRADOR
// ============================================

export async function listAdminOrders(): Promise<Order[]> {
  const result = await pool.query<{ id: number }>(
    `
    SELECT id
    FROM public."Order"
    ORDER BY "createdAt" DESC
    LIMIT 100
    `,
  );

  const client = await pool.connect();

  try {
    const orders: Order[] = [];

    for (const row of result.rows) {
      const order = await findOrderWithClient(
        client,
        row.id,
      );

      if (order) orders.push(order);
    }

    return orders;
  } finally {
    client.release();
  }
}

// ============================================
// CONSULTAR PEDIDO
// ============================================

export async function findOrderById(
  id: number,
): Promise<Order | null> {
  const client = await pool.connect();

  try {
    return await findOrderWithClient(client, id);
  } finally {
    client.release();
  }
}


 // ============================================
 // REGRAS DE TRANSIÇÃO DOS PEDIDOS
 // ============================================

 const ORDER_STATUS_TRANSITIONS: Record<
   OrderStatus,
   OrderStatus[]
 > = {
   PENDING: ["CONFIRMED", "CANCELLED"],

   CONFIRMED: ["PREPARING", "CANCELLED"],

   PREPARING: ["READY", "CANCELLED"],

   READY: [
     "OUT_FOR_DELIVERY",
     "COMPLETED",
     "CANCELLED",
   ],

   OUT_FOR_DELIVERY: [
     "COMPLETED",
     "CANCELLED",
   ],

   COMPLETED: [],

   CANCELLED: [],
 };

 // ============================================
 // DEVOLVER ESTOQUE AO CANCELAR
 // ============================================

 async function restoreOrderStock(
   client: PoolClient,
   orderId: number,
 ): Promise<void> {
   const result = await client.query<{
     productId: number;
     quantity: number;
   }>(
     `
     SELECT
       "productId",
       SUM(quantity)::integer AS quantity

     FROM public."OrderItem"

     WHERE "orderId" = $1
       AND "productId" IS NOT NULL

     GROUP BY "productId"
     ORDER BY "productId" ASC
     `,
     [orderId],
   );

   for (const item of result.rows) {
     const updated = await client.query(
       `
       UPDATE public."Product"
       SET
         "stockQuantity" =
           "stockQuantity" + $1,
         "updatedAt" = NOW()

       WHERE id = $2
         AND "stockQuantity" IS NOT NULL

       RETURNING
         id,
         name,
         "stockQuantity"
       `,
       [item.quantity, item.productId],
     );

     console.log(
       "[ORDERS] Reposição de estoque:",
       {
         orderId,
         productId: item.productId,
         quantity: item.quantity,
         affectedRows: updated.rowCount,
         product: updated.rows[0] ?? null,
       },
     );
   }
 }

 // ============================================
 // ATUALIZAR STATUS - ADMIN
 // ============================================

 export async function updateOrderStatus(
   id: number,
   nextStatus: OrderStatus,
 ): Promise<Order | null> {
   const client = await pool.connect();

   try {
     await client.query("BEGIN");

     // Bloqueia o pedido durante a alteração.
     const result = await client.query<{
       id: number;
       status: OrderStatus;
     }>(
       `
       SELECT id, status
       FROM public."Order"
       WHERE id = $1
       FOR UPDATE
       `,
       [id],
     );

     const current = result.rows[0];

     if (!current) {
       await client.query("COMMIT");
       return null;
     }

     // Evita executar a mesma operação duas vezes.
     if (current.status === nextStatus) {
       const order = await findOrderWithClient(
         client,
         id,
       );

       await client.query("COMMIT");
       return order;
     }

     const allowed =
       ORDER_STATUS_TRANSITIONS[current.status];

     if (!allowed?.includes(nextStatus)) {
       throw new OrderServiceError(
         `Não é permitido alterar o pedido de ${current.status} para ${nextStatus}.`,
         409,
       );
     }

     // Devolve o estoque somente na primeira
     // transição para CANCELLED.
     if (nextStatus === "CANCELLED") {
       await restoreOrderStock(client, id);
     }

     await client.query(
       `
       UPDATE public."Order"
       SET
         status = $1,
         "updatedAt" = NOW(),
         "cancelledAt" =
           CASE
             WHEN $1 = 'CANCELLED'
             THEN NOW()
             ELSE "cancelledAt"
           END
       WHERE id = $2
       `,
       [nextStatus, id],
     );

     const order = await findOrderWithClient(
       client,
       id,
     );

     if (!order) {
       throw new OrderServiceError(
         "Pedido não encontrado após atualização.",
         500,
       );
     }

     await client.query("COMMIT");

     return order;
   } catch (error) {
     await client.query("ROLLBACK");
     throw error;
   } finally {
     client.release();
   }
 }
