
import { useEffect, useRef, useState } from "react";

import { loadGoogleMapsLibrary } from "../../../../shared/lib/googleMapsLoader";

import {
  AlertCircle,
  Check,
  Loader2,
  MapPin,
  Navigation,
} from "lucide-react";

import type {
  DeliveryCoordinates,
} from "../deliveryAddress.types";

// ============================================
// TIPOS
// ============================================

type DeliveryAddressMapProps = {
  coordinates: DeliveryCoordinates;
  onConfirm: (coordinates: DeliveryCoordinates) => void;
  onChange?: (coordinates: DeliveryCoordinates) => void;
  accuracyMeters?: number | null;
  disabled?: boolean;
};

type MapPoint = {
  lat: number;
  lng: number;
};

// ============================================
// CONFIGURAÇÕES
// ============================================

const DEFAULT_ZOOM = 18;

// ============================================
// COMPONENTE
// ============================================

export function DeliveryAddressMap({
  coordinates,
  onConfirm,
  onChange,
  accuracyMeters = null,
  disabled = false,
}: DeliveryAddressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Guardar as coordenadas iniciais sem
  // recriar o mapa a cada alteração.
  const initialCoordinatesRef =
    useRef<DeliveryCoordinates>(coordinates);

  const mapRef = useRef<google.maps.Map | null>(null);

  const markerRef =
    useRef<google.maps.Marker | null>(null);

  const accuracyCircleRef =
    useRef<google.maps.Circle | null>(null);

  const clickListenerRef =
    useRef<google.maps.MapsEventListener | null>(null);

  const dragListenerRef =
    useRef<google.maps.MapsEventListener | null>(null);

  // Callbacks e permissões sempre atualizados.
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);

  const [selectedPoint, setSelectedPoint] =
    useState<DeliveryCoordinates>(coordinates);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [ready, setReady] = useState(false);

  // ============================================
  // ATUALIZAR REFERÊNCIAS
  // ============================================

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    disabledRef.current = disabled;
    markerRef.current?.setDraggable(!disabled);
  }, [disabled]);

  // ============================================
  // INICIALIZAR GOOGLE MAPS
  // ============================================

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        const { Map } =
          (await loadGoogleMapsLibrary("maps")) as google.maps.MapsLibrary;

        if (cancelled || !containerRef.current) {
          return;
        }

        const initialPoint: MapPoint = {
          lat: initialCoordinatesRef.current.latitude,
          lng: initialCoordinatesRef.current.longitude,
        };

        const map = new Map(containerRef.current, {
          center: initialPoint,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "cooperative",
        });

        mapRef.current = map;

        // ====================================
        // MARCADOR DO ENDEREÇO
        // ====================================

        const marker = new google.maps.Marker({
          map,
          position: initialPoint,
          draggable: !disabledRef.current,
          title: "Local de entrega",
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#ea580c",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
        });

        markerRef.current = marker;

        // ====================================
        // FUNÇÃO PARA SELECIONAR UM PONTO
        // ====================================

        function selectPoint(
          nextCoordinates: DeliveryCoordinates,
        ) {
          if (disabledRef.current) return;

          marker.setPosition({
            lat: nextCoordinates.latitude,
            lng: nextCoordinates.longitude,
          });

          setSelectedPoint(nextCoordinates);

          onChangeRef.current?.(nextCoordinates);
        }

        // ====================================
        // ARRASTAR MARCADOR
        // ====================================

        dragListenerRef.current = marker.addListener(
          "dragend",
          (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;

            selectPoint({
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng(),
            });
          },
        );

        // ====================================
        // CLICAR NO MAPA
        // ====================================

        clickListenerRef.current = map.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            if (!event.latLng) return;

            selectPoint({
              latitude: event.latLng.lat(),
              longitude: event.latLng.lng(),
            });
          },
        );

        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o Google Maps.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeMap();

    // ========================================
    // LIMPEZA DOS RECURSOS
    // ========================================

    return () => {
      cancelled = true;

      clickListenerRef.current?.remove();
      clickListenerRef.current = null;

      dragListenerRef.current?.remove();
      dragListenerRef.current = null;

      markerRef.current?.setMap(null);
      markerRef.current = null;

      accuracyCircleRef.current?.setMap(null);
      accuracyCircleRef.current = null;

      mapRef.current = null;
    };
  }, []);

  // ============================================
  // SINCRONIZAR COORDENADAS EXTERNAS
  // ============================================

  useEffect(() => {
    if (!ready) return;

    const nextPoint = {
      lat: coordinates.latitude,
      lng: coordinates.longitude,
    };

    mapRef.current?.panTo(nextPoint);
    markerRef.current?.setPosition(nextPoint);

    // O estado precisa refletir um novo endereço
    // recebido do componente pai.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPoint({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
  }, [
    ready,
    coordinates.latitude,
    coordinates.longitude,
  ]);

  // ============================================
  // CÍRCULO DE PRECISÃO DO GPS
  // ============================================

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    accuracyCircleRef.current?.setMap(null);
    accuracyCircleRef.current = null;

    if (
      accuracyMeters === null ||
      !Number.isFinite(accuracyMeters) ||
      accuracyMeters <= 0
    ) {
      return;
    }

    const circle = new google.maps.Circle({
      map: mapRef.current,
      center: {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      },
      radius: accuracyMeters,
      strokeColor: "#2563eb",
      strokeOpacity: 0.65,
      strokeWeight: 1,
      fillColor: "#3b82f6",
      fillOpacity: 0.08,
      clickable: false,
    });

    accuracyCircleRef.current = circle;

    return () => {
      circle.setMap(null);

      if (accuracyCircleRef.current === circle) {
        accuracyCircleRef.current = null;
      }
    };
  }, [
    ready,
    accuracyMeters,
    coordinates.latitude,
    coordinates.longitude,
  ]);

  // ============================================
  // CENTRALIZAR MAPA
  // ============================================

  function handleCenterMap() {
    const map = mapRef.current;

    if (!map) return;

    map.panTo({
      lat: selectedPoint.latitude,
      lng: selectedPoint.longitude,
    });

    map.setZoom(DEFAULT_ZOOM);
  }

  // ============================================
  // CONFIRMAR LOCALIZAÇÃO
  // ============================================

  function handleConfirm() {
    if (!ready || disabled) return;

    onConfirm({
      latitude: selectedPoint.latitude,
      longitude: selectedPoint.longitude,
    });
  }

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <div className="space-y-4">
      {/* CABEÇALHO */}

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <MapPin size={21} />
        </div>

        <div>
          <h3 className="text-base font-bold text-stone-900">
            Confirme sua localização
          </h3>

          <p className="mt-1 text-sm leading-relaxed text-stone-500">
            Confira se o marcador está exatamente
            no local onde deseja receber seu pedido.
          </p>
        </div>
      </div>

      {/* MENSAGEM DE ERRO */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle
            size={18}
            className="shrink-0"
          />

          <span>{error}</span>
        </div>
      )}

      {/* GOOGLE MAPS */}

      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <div
          ref={containerRef}
          className="h-72 w-full sm:h-80"
          aria-label="Mapa para confirmar o local de entrega"
        />

        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-100">
            <Loader2
              size={28}
              className="animate-spin text-orange-600"
            />

            <p className="text-sm font-medium text-stone-500">
              Carregando mapa...
            </p>
          </div>
        )}

        {ready && (
          <button
            type="button"
            onClick={handleCenterMap}
            className="absolute bottom-4 right-4 z-10 flex size-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-lg transition hover:bg-orange-50"
            title="Centralizar mapa"
            aria-label="Centralizar mapa"
          >
            <Navigation size={20} />
          </button>
        )}
      </div>

      {/* INSTRUÇÕES */}

      <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3">
        <p className="text-xs leading-relaxed text-orange-800">
          <strong>Não está no local correto?</strong>{" "}
          Toque em outro ponto do mapa ou arraste
          o marcador até a entrada da residência.
        </p>
      </div>

      {/* PRECISÃO DO GPS */}

      {accuracyMeters !== null &&
        accuracyMeters > 0 && (
          <p className="text-xs text-stone-500">
            Precisão aproximada do GPS:{" "}
            <strong>
              {Math.round(accuracyMeters)} metros
            </strong>
            . Confirme o marcador antes de continuar.
          </p>
        )}

      {/* COORDENADAS */}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs text-stone-500">
            Latitude
          </p>

          <p className="mt-1 font-mono text-xs font-semibold text-stone-800">
            {selectedPoint.latitude.toFixed(6)}
          </p>
        </div>

        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs text-stone-500">
            Longitude
          </p>

          <p className="mt-1 font-mono text-xs font-semibold text-stone-800">
            {selectedPoint.longitude.toFixed(6)}
          </p>
        </div>
      </div>

      {/* CONFIRMAR LOCALIZAÇÃO */}

      <button
        type="button"
        disabled={!ready || disabled}
        onClick={handleConfirm}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check size={19} />

        Confirmar localização
      </button>
    </div>
  );
}
