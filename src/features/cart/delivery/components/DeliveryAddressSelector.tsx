
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LocateFixed,
  MapPin,
  Search,
  Truck,
} from "lucide-react";

import { loadGoogleMapsLibrary } from "../../../../shared/lib/googleMapsLoader";

import { DeliveryAddressMap } from "./DeliveryAddressMap";

import {
  checkDeliveryAvailability,
  formatDeliveryFee,
  getDeliveryAvailabilityMessage,
} from "../api/deliveryAvailabilityApi";

import type {
  DeliveryAddress,
  DeliveryAddressForm,
  DeliveryAvailability,
  DeliveryCoordinates,
  DeliveryLocationSource,
  ValidatedDeliveryAddress,
} from "../deliveryAddress.types";

// ============================================
// TIPOS
// ============================================

type DeliveryAddressSelectorProps = {
  onConfirm: (
    result: ValidatedDeliveryAddress,
  ) => void;

  initialAddress?: DeliveryAddress | null;
  onCancel?: () => void;
};

type Step = "form" | "map" | "result";

type AddressComponent =
  google.maps.GeocoderAddressComponent;

// ============================================
// CONFIGURAÇÕES
// ============================================

const CITY = "Rebouças";
const STATE = "PR";
const COUNTRY = "Brasil";

const EMPTY_FORM: DeliveryAddressForm = {
  street: "",
  number: "",
  neighborhood: "",
  complement: "",
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getAddressPart(
  components: AddressComponent[],
  type: string,
): string {
  return (
    components.find((component) =>
      component.types.includes(type),
    )?.long_name ?? ""
  );
}

function parseGoogleAddress(
  components: AddressComponent[],
): Partial<DeliveryAddressForm> {
  return {
    street: getAddressPart(components, "route"),
    number: getAddressPart(
      components,
      "street_number",
    ),
    neighborhood:
      getAddressPart(
        components,
        "sublocality_level_1",
      ) ||
      getAddressPart(
        components,
        "sublocality",
      ) ||
      getAddressPart(
        components,
        "neighborhood",
      ),
  };
}

function buildFullAddress(
  form: DeliveryAddressForm,
): string {
  return [
    `${form.street.trim()}, ${form.number.trim()}`,
    form.neighborhood.trim(),
    CITY,
    STATE,
    COUNTRY,
  ]
    .filter(Boolean)
    .join(", ");
}

function isValidCoordinates(
  coordinates: DeliveryCoordinates,
): boolean {
  return (
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

// ============================================
// COMPONENTE
// ============================================

export function DeliveryAddressSelector({
  onConfirm,
  initialAddress = null,
  onCancel,
}: DeliveryAddressSelectorProps) {
  const [form, setForm] =
    useState<DeliveryAddressForm>(() =>
      initialAddress
        ? {
            street: initialAddress.street,
            number: initialAddress.number,
            neighborhood: initialAddress.neighborhood,
            complement: initialAddress.complement,
          }
        : { ...EMPTY_FORM },
    );

  const [step, setStep] = useState<Step>("form");

  const [coordinates, setCoordinates] =
    useState<DeliveryCoordinates | null>(
      initialAddress?.coordinates ?? null,
    );

  const [source, setSource] =
    useState<DeliveryLocationSource>(
      "ADDRESS_SEARCH",
    );

  const [accuracyMeters, setAccuracyMeters] =
    useState<number | null>(null);

  const [availability, setAvailability] =
    useState<DeliveryAvailability | null>(null);

  const [loadingAddress, setLoadingAddress] =
    useState(false);

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const [checkingDelivery, setCheckingDelivery] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // Evita que consultas antigas atualizem
  // o resultado após uma nova pesquisa.
  const requestIdRef = useRef(0);

  const mountedRef = useRef(true);

  
const formRef = useRef(form);
const sourceRef = useRef(source);

// Sincronizar as referências após a renderização,
// evitando alterações de refs durante o render.
useEffect(() => {
  formRef.current = form;
}, [form]);

useEffect(() => {
  sourceRef.current = source;
}, [source]);


  const abortControllerRef =
    useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortControllerRef.current?.abort();
    };
  }, []);

  // ============================================
  // INVALIDAR CONSULTA ANTERIOR
  // ============================================

  const invalidateAvailability = useCallback(() => {
    requestIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    setAvailability(null);
    setCheckingDelivery(false);
  }, []);

  // ============================================
  // ATUALIZAR FORMULÁRIO
  // ============================================

  function updateField(
    field: keyof DeliveryAddressForm,
    value: string,
  ) {
    invalidateAvailability();

    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError(null);

    if (step !== "form") {
      setStep("form");
    }
  }

  // ============================================
  // GEOCODIFICAR ENDEREÇO
  // ============================================

  async function handleSearchAddress() {
    if (
      !form.street.trim() ||
      !form.number.trim() ||
      !form.neighborhood.trim()
    ) {
      setError(
        "Preencha rua, número e bairro para localizar o endereço.",
      );
      return;
    }

    invalidateAvailability();
    setLoadingAddress(true);
    setError(null);

    const requestId = requestIdRef.current;

    try {
      const { Geocoder } =
        (await loadGoogleMapsLibrary(
          "geocoding",
        )) as google.maps.GeocodingLibrary;

      const geocoder = new Geocoder();

      const response = await geocoder.geocode({
        address: buildFullAddress(form),
        componentRestrictions: {
          country: "BR",
        },
      });

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const result = response.results[0];

      if (!result?.geometry?.location) {
        throw new Error(
          "Não encontramos esse endereço. Confira os dados informados.",
        );
      }

      const location = result.geometry.location;

      const nextCoordinates = {
        latitude: location.lat(),
        longitude: location.lng(),
      };

      if (!isValidCoordinates(nextCoordinates)) {
        throw new Error(
          "O Google Maps retornou uma localização inválida.",
        );
      }

      // Impede resultados localizados em outra
      // cidade ou estado.
      const components = result.address_components;

      const city =
        getAddressPart(
          components,
          "administrative_area_level_2",
        ) ||
        getAddressPart(components, "locality");

      const state = components.find(
        (component) =>
          component.types.includes(
            "administrative_area_level_1",
          ),
      )?.short_name;

      if (
        city.toLocaleLowerCase("pt-BR") !==
          CITY.toLocaleLowerCase("pt-BR") ||
        state !== STATE
      ) {
        throw new Error(
          "O endereço encontrado não pertence a Rebouças - PR.",
        );
      }

      // Resultados aproximados não devem ser
      // tratados como localização exata.
      if (
        result.partial_match ||
        result.geometry.location_type ===
          google.maps.GeocoderLocationType.APPROXIMATE
      ) {
        throw new Error(
          "Não foi possível identificar esse endereço com precisão. Confira rua, número e bairro.",
        );
      }

      setCoordinates(nextCoordinates);
      setAccuracyMeters(null);
      setSource("ADDRESS_SEARCH");
      setStep("map");
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível localizar o endereço.",
      );
    } finally {
      if (mountedRef.current) {
        setLoadingAddress(false);
      }
    }
  }

  // ============================================
  // LOCALIZAÇÃO ATUAL DO APARELHO
  // ============================================

  async function handleCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        "Seu navegador não oferece suporte à localização.",
      );
      return;
    }

    if (!window.isSecureContext) {
      setError(
        "A localização atual exige uma conexão segura (HTTPS ou localhost).",
      );
      return;
    }

    invalidateAvailability();
    setError(null);
    setLoadingLocation(true);

    const requestId = requestIdRef.current;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (!isValidCoordinates(nextCoordinates)) {
          setError(
            "O aparelho retornou coordenadas inválidas.",
          );
          setLoadingLocation(false);
          return;
        }

        try {
          const { Geocoder } =
            (await loadGoogleMapsLibrary(
              "geocoding",
            )) as google.maps.GeocodingLibrary;

          const geocoder = new Geocoder();

          const response = await geocoder.geocode({
            location: {
              lat: nextCoordinates.latitude,
              lng: nextCoordinates.longitude,
            },
          });

          if (
            !mountedRef.current ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          const result = response.results[0];

          if (result) {
            const addressParts = parseGoogleAddress(
              result.address_components,
            );

            setForm((previous) => ({
              ...previous,
              street: addressParts.street || "",
              number: addressParts.number || "",
              neighborhood:
                addressParts.neighborhood || "",
            }));
          }

          setCoordinates(nextCoordinates);

          setAccuracyMeters(
            position.coords.accuracy,
          );

          setSource("CURRENT_LOCATION");
          setStep("map");
        } catch {
          if (
            !mountedRef.current ||
            requestId !== requestIdRef.current
          ) {
            return;
          }

          // Mesmo que a geocodificação reversa
          // falhe, ainda podemos mostrar o ponto.
          setCoordinates(nextCoordinates);

          setAccuracyMeters(
            position.coords.accuracy,
          );

          setSource("CURRENT_LOCATION");
          setStep("map");

          setError(
            "Localização obtida. Confira os dados do endereço antes de confirmar.",
          );
        } finally {
          if (mountedRef.current) {
            setLoadingLocation(false);
          }
        }
      },
      (geoError) => {
        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const messages: Record<number, string> = {
          1: "Permissão de localização negada. Você pode informar o endereço manualmente.",
          2: "Não foi possível determinar sua localização.",
          3: "A localização demorou demais. Tente novamente.",
        };

        setError(
          messages[geoError.code] ||
            "Não foi possível obter sua localização.",
        );

        setLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  // ============================================
  // ALTERAÇÃO DO MARCADOR
  // ============================================

  function handleMapChange(
    nextCoordinates: DeliveryCoordinates,
  ) {
    invalidateAvailability();

    setCoordinates(nextCoordinates);
    setSource("MAP_ADJUSTMENT");
    setAccuracyMeters(null);
    setError(null);
  }

  // ============================================
  // CONFIRMAR PONTO E CONSULTAR FRETE
  // ============================================

  async function handleMapConfirm(
    confirmedCoordinates: DeliveryCoordinates,
  ) {
    invalidateAvailability();

    setCoordinates(confirmedCoordinates);
    setError(null);

    const currentForm = formRef.current;

    if (
      !currentForm.street.trim() ||
      !currentForm.number.trim() ||
      !currentForm.neighborhood.trim()
    ) {
      setError(
        "Antes de confirmar, informe rua, número e bairro. Esses dados são necessários para a entrega.",
      );
      setStep("form");
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = requestIdRef.current;

    setCheckingDelivery(true);

    try {
      const result = await checkDeliveryAvailability(
        confirmedCoordinates,
        controller.signal,
      );

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setAvailability(result);
      setStep("result");
    } catch (err) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível consultar a disponibilidade.",
      );
    } finally {
      if (
        mountedRef.current &&
        requestId === requestIdRef.current
      ) {
        setCheckingDelivery(false);
      }
    }
  }

  // ============================================
  // FINALIZAR SELEÇÃO
  // ============================================

  function handleFinish() {
    if (
      !availability ||
      !availability.available ||
      !coordinates
    ) {
      return;
    }

    const currentForm = formRef.current;

    if (
      !currentForm.street.trim() ||
      !currentForm.number.trim() ||
      !currentForm.neighborhood.trim()
    ) {
      setError(
        "Informe os dados completos do endereço.",
      );
      setStep("form");
      return;
    }

    const address: DeliveryAddress = {
      street: currentForm.street.trim(),
      number: currentForm.number.trim(),
      neighborhood:
        currentForm.neighborhood.trim(),
      complement: currentForm.complement.trim(),
      city: CITY,
      state: STATE,
      coordinates,
    };

    onConfirm({
      address,
      availability,
      source: sourceRef.current,
    });
  }

  // ============================================
  // VOLTAR PARA O FORMULÁRIO
  // ============================================

  function handleBackToForm() {
    invalidateAvailability();
    setStep("form");
    setError(null);
  }

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <div className="space-y-5">
      {/* CABEÇALHO */}

      <div className="flex items-center gap-3">
        {step !== "form" && (
          <button
            type="button"
            onClick={handleBackToForm}
            className="flex size-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
            aria-label="Voltar para o endereço"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div>
          <h2 className="text-lg font-black text-stone-900">
            {step === "form"
              ? "Onde devemos entregar?"
              : step === "map"
                ? "Confirme seu endereço"
                : "Disponibilidade de entrega"}
          </h2>

          <p className="mt-1 text-xs text-stone-500">
            {CITY} - {STATE}
          </p>
        </div>
      </div>

      {/* ERRO */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================
          ETAPA 1 - FORMULÁRIO
      ======================================== */}

      {step === "form" && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSearchAddress();
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="delivery-street"
              className="text-sm font-semibold text-stone-700"
            >
              Rua
            </label>

            <input
              id="delivery-street"
              type="text"
              required
              autoComplete="address-line1"
              value={form.street}
              onChange={(event) =>
                updateField(
                  "street",
                  event.target.value,
                )
              }
              placeholder="Ex.: Rua XV de Novembro"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="delivery-number"
                className="text-sm font-semibold text-stone-700"
              >
                Número
              </label>

              <input
                id="delivery-number"
                type="text"
                required
                value={form.number}
                onChange={(event) =>
                  updateField(
                    "number",
                    event.target.value,
                  )
                }
                placeholder="Ex.: 250"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="delivery-neighborhood"
                className="text-sm font-semibold text-stone-700"
              >
                Bairro
              </label>

              <input
                id="delivery-neighborhood"
                type="text"
                required
                autoComplete="address-level3"
                value={form.neighborhood}
                onChange={(event) =>
                  updateField(
                    "neighborhood",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Centro"
                className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="delivery-complement"
              className="text-sm font-semibold text-stone-700"
            >
              Complemento{" "}
              <span className="font-normal text-stone-400">
                (opcional)
              </span>
            </label>

            <input
              id="delivery-complement"
              type="text"
              value={form.complement}
              onChange={(event) =>
                updateField(
                  "complement",
                  event.target.value,
                )
              }
              placeholder="Casa, apartamento, referência..."
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <button
            type="submit"
            disabled={
              loadingAddress || loadingLocation
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            {loadingAddress ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <Search size={18} />
            )}

            {loadingAddress
              ? "Localizando endereço..."
              : "Localizar endereço"}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs text-stone-400">
              ou
            </span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <button
            type="button"
            onClick={() =>
              void handleCurrentLocation()
            }
            disabled={
              loadingLocation || loadingAddress
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 text-sm font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
          >
            {loadingLocation ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <LocateFixed size={18} />
            )}

            {loadingLocation
              ? "Obtendo localização..."
              : "Usar minha localização atual"}
          </button>

          <p className="text-center text-xs leading-relaxed text-stone-400">
            A localização só será solicitada
            com sua permissão.
          </p>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-sm font-medium text-stone-500 hover:text-stone-800"
            >
              Cancelar
            </button>
          )}
        </form>
      )}

      {/* ========================================
          ETAPA 2 - MAPA
      ======================================== */}

      {step === "map" && coordinates && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <div className="flex gap-2">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0 text-orange-600"
              />

              <div className="text-sm text-stone-700">
                <p className="font-bold">
                  {form.street || "Rua não identificada"}
                  {form.number
                    ? `, ${form.number}`
                    : ""}
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  {form.neighborhood || "Bairro não identificado"}
                  {" - "}
                  {CITY}/{STATE}
                </p>
              </div>
            </div>
          </div>

          <DeliveryAddressMap
            coordinates={coordinates}
            accuracyMeters={accuracyMeters}
            disabled={checkingDelivery}
            onChange={handleMapChange}
            onConfirm={(point) =>
              void handleMapConfirm(point)
            }
          />

          {checkingDelivery && (
            <div
              role="status"
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-50 p-3 text-sm font-medium text-orange-700"
            >
              <Loader2
                size={17}
                className="animate-spin"
              />
              Verificando área de entrega...
            </div>
          )}
        </div>
      )}

      {/* ========================================
          ETAPA 3 - RESULTADO
      ======================================== */}

      {step === "result" && availability && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-5 ${
              availability.available
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {availability.available ? (
                <CheckCircle2
                  size={25}
                  className="shrink-0 text-green-600"
                />
              ) : (
                <AlertCircle
                  size={25}
                  className="shrink-0 text-red-600"
                />
              )}

              <div>
                <h3
                  className={`font-black ${
                    availability.available
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {availability.available
                    ? "Entrega disponível!"
                    : "Entrega indisponível"}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  {getDeliveryAvailabilityMessage(
                    availability,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 p-4">
            <div className="flex items-start gap-3">
              <MapPin
                size={19}
                className="shrink-0 text-orange-600"
              />

              <div className="min-w-0">
                <p className="text-sm font-bold text-stone-900">
                  {form.street}, {form.number}
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  {form.neighborhood} - {CITY}/{STATE}
                </p>

                {form.complement && (
                  <p className="mt-1 text-xs text-stone-500">
                    {form.complement}
                  </p>
                )}
              </div>
            </div>
          </div>

          {availability.available && (
            <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-4">
              <div className="flex items-center gap-2">
                <Truck
                  size={20}
                  className="text-orange-600"
                />

                <span className="text-sm font-semibold text-stone-700">
                  Taxa de entrega
                </span>
              </div>

              <span className="text-lg font-black text-orange-700">
                {formatDeliveryFee(
                  availability.feeCents,
                )}
              </span>
            </div>
          )}

          {availability.available ? (
            <button
              type="button"
              onClick={handleFinish}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700"
            >
              <CheckCircle2 size={19} />
              Usar este endereço
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBackToForm}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3.5 text-sm font-bold text-stone-700 hover:bg-stone-50"
            >
              <ArrowLeft size={18} />
              Informar outro endereço
            </button>
          )}
        </div>
      )}
    </div>
  );
}
