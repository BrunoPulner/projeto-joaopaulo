
// ============================================
// COORDENADAS GEOGRÁFICAS
// ============================================

export type DeliveryCoordinates = {
  latitude: number;
  longitude: number;
};

// ============================================
// DADOS DO ENDEREÇO
// ============================================

export type DeliveryAddress = {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;

  // Cidade fixa nesta primeira versão.
  city: "Rebouças";
  state: "PR";

  // Localização confirmada no Google Maps.
  coordinates: DeliveryCoordinates;
};

// ============================================
// FORMULÁRIO DE ENDEREÇO
// ============================================

export type DeliveryAddressForm = {
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
};

// ============================================
// ORIGEM DA LOCALIZAÇÃO
// ============================================

export type DeliveryLocationSource =
  | "ADDRESS_SEARCH"
  | "CURRENT_LOCATION"
  | "MAP_ADJUSTMENT";

// ============================================
// DISPONIBILIDADE DE ENTREGA
// ============================================

export type DeliveryAvailabilityReason =
  | "AVAILABLE"
  | "OUTSIDE_DELIVERY_AREA"
  | "DELIVERY_DISABLED"
  | "NO_ACTIVE_ZONES";

export type DeliveryAvailability = {
  available: boolean;
  reason: DeliveryAvailabilityReason | string;
  feeCents: number | null;
  contactPhone: string | null;
  message: string | null;
};

// ============================================
// ESTADO DA VALIDAÇÃO
// ============================================

export type DeliveryValidationStatus =
  | "idle"
  | "locating"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

// ============================================
// ENDEREÇO VALIDADO
// ============================================

export type ValidatedDeliveryAddress = {
  address: DeliveryAddress;
  availability: DeliveryAvailability;
  source: DeliveryLocationSource;
};
