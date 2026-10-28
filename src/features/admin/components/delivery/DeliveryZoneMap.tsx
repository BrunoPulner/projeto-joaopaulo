
/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from "react";

import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPinned,
  MousePointer2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import {
  createDeliveryPolygon,
  createDeliveryZone,
  deactivateDeliveryZone,
  getDeliveryZones,
  polygonToMapPoints,
  reactivateDeliveryZone,
  updateDeliveryZone,
  type DeliveryZone,
} from "./deliverySettingsApi";

// ============================================
// CONFIGURAÇÕES
// ============================================

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

// Centro aproximado de Rebouças - PR.
// O administrador definirá o perímetro real.
const MAP_CENTER = {
  lat: -25.623,
  lng: -50.688,
};

const MAP_ZOOM = 14;

// Configurar o loader uma única vez.
if (GOOGLE_MAPS_API_KEY) {
  setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: "weekly",
  });
}

// ============================================
// TIPOS
// ============================================

type MapPoint = {
  lat: number;
  lng: number;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type EditorMode = "idle" | "creating" | "editing";

// ============================================
// COMPONENTE
// ============================================

export function DeliveryZoneMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const polygonRef =
    useRef<google.maps.Polygon | null>(null);

  const markersRef =
    useRef<google.maps.Marker[]>([]);

  const clickListenerRef =
    useRef<google.maps.MapsEventListener | null>(null);

  const pointsRef = useRef<MapPoint[]>([]);

  const modeRef = useRef<EditorMode>("idle");

  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);

  const [mode, setMode] = useState<EditorMode>("idle");
  const [points, setPoints] = useState<MapPoint[]>([]);

  const [selectedZoneId, setSelectedZoneId] =
    useState<number | null>(null);

  const [zoneName, setZoneName] = useState(
    "Zona urbana de Rebouças",
  );

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // ============================================
  // SINCRONIZAR REFS
  // ============================================

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ============================================
  // LIMPAR DESENHO
  // ============================================

  const clearDrawing = useCallback(() => {
    polygonRef.current?.setMap(null);
    polygonRef.current = null;

    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    markersRef.current = [];
  }, []);

  // ============================================
  // DESENHAR POLÍGONO
  // ============================================

  const renderPolygon = useCallback(
    (mapPoints: MapPoint[]) => {
      const map = mapRef.current;

      if (!map) return;

      clearDrawing();

      if (mapPoints.length === 0) return;

      // Marcadores dos vértices.
      mapPoints.forEach((point, index) => {
        const marker = new google.maps.Marker({
          position: point,
          map,
          label: {
            text: String(index + 1),
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "bold",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: "#ea580c",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        markersRef.current.push(marker);
      });

      if (mapPoints.length >= 2) {
        polygonRef.current = new google.maps.Polygon({
          paths: mapPoints,
          strokeColor: "#ea580c",
          strokeOpacity: 0.95,
          strokeWeight: 3,
          fillColor: "#fb923c",
          fillOpacity: 0.22,
          map,
        });
      }
    },
    [clearDrawing],
  );

  // ============================================
  // CARREGAR ÁREAS
  // ============================================

  const loadZones = useCallback(async () => {
    setZonesLoading(true);

    try {
      const result = await getDeliveryZones();
      setZones(result);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as áreas.",
      });
    } finally {
      setZonesLoading(false);
    }
  }, []);

  // ============================================
  // INICIALIZAR GOOGLE MAPS
  // ============================================

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!GOOGLE_MAPS_API_KEY) {
        setFeedback({
          type: "error",
          message:
            "A chave VITE_GOOGLE_MAPS_API_KEY não foi configurada.",
        });
        setMapLoading(false);
        return;
      }

      try {
        const { Map } =
          (await importLibrary("maps")) as google.maps.MapsLibrary;

        if (cancelled || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
          center: MAP_CENTER,
          zoom: MAP_ZOOM,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
        });

        mapRef.current = map;
        setMapReady(true);
      } catch (error) {
        if (cancelled) return;

        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o Google Maps.",
        });
      } finally {
        if (!cancelled) {
          setMapLoading(false);
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      clickListenerRef.current?.remove();
      clickListenerRef.current = null;

      clearDrawing();
      mapRef.current = null;
    };
  }, [clearDrawing]);

  // ============================================
  // CARREGAR DADOS INICIAIS
  // ============================================

  useEffect(() => {
  let cancelled = false;

  async function initializeZones() {
    try {
      const result = await getDeliveryZones();

      if (cancelled) return;

      setZones(result);
    } catch (error) {
      if (cancelled) return;

      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as áreas.",
      });
    } finally {
      if (!cancelled) {
        setZonesLoading(false);
      }
    }
  }

  void initializeZones();

  return () => {
    cancelled = true;
  };
}, []);

  // ============================================
  // ATUALIZAR DESENHO
  // ============================================

  useEffect(() => {
    if (!mapReady) return;

    renderPolygon(points);
  }, [points, mapReady, renderPolygon]);

  // ============================================
  // CLIQUES NO MAPA
  // ============================================

  useEffect(() => {
    const map = mapRef.current;

    if (!mapReady || !map) return;

    clickListenerRef.current?.remove();

    clickListenerRef.current = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        if (modeRef.current === "idle") return;

        const latLng = event.latLng;
        if (!latLng) return;

        const nextPoint = {
          lat: latLng.lat(),
          lng: latLng.lng(),
        };

        setPoints((current) => [...current, nextPoint]);
      },
    );

    return () => {
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
    };
  }, [mapReady]);

  // ============================================
  // NOVA ÁREA
  // ============================================

  function handleCreateZone() {
    setSelectedZoneId(null);
    setZoneName("Zona urbana de Rebouças");
    setPoints([]);
    setMode("creating");
    setFeedback(null);
  }

  // ============================================
  // EDITAR ÁREA
  // ============================================

  function handleEditZone(zone: DeliveryZone) {
    setSelectedZoneId(zone.id);
    setZoneName(zone.name);

    const mapPoints = polygonToMapPoints(zone.polygon);

    setPoints(mapPoints);
    setMode("editing");
    setFeedback(null);

    const map = mapRef.current;

    if (map && mapPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();

      mapPoints.forEach((point) => bounds.extend(point));

      map.fitBounds(bounds);
    }
  }

  // ============================================
  // DESFAZER ÚLTIMO PONTO
  // ============================================

  function handleUndoPoint() {
    setPoints((current) => current.slice(0, -1));
  }

  // ============================================
  // CANCELAR EDIÇÃO
  // ============================================

  function handleCancel() {
    setPoints([]);
    setSelectedZoneId(null);
    setMode("idle");
    setFeedback(null);
  }

  // ============================================
  // SALVAR ÁREA
  // ============================================

  async function handleSaveZone() {
    if (points.length < 3) {
      setFeedback({
        type: "error",
        message:
          "Selecione pelo menos três pontos para definir a área.",
      });
      return;
    }

    if (zoneName.trim().length < 3) {
      setFeedback({
        type: "error",
        message:
          "Informe um nome com pelo menos três caracteres.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const polygon = createDeliveryPolygon(points);

      if (mode === "editing" && selectedZoneId !== null) {
        await updateDeliveryZone(selectedZoneId, {
          name: zoneName.trim(),
          polygon,
        });
      } else {
        await createDeliveryZone({
          name: zoneName.trim(),
          polygon,
          isActive: true,
        });
      }

      await loadZones();

      setPoints([]);
      setSelectedZoneId(null);
      setMode("idle");

      setFeedback({
        type: "success",
        message:
          "Área de entrega salva com sucesso!",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a área.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // DESATIVAR / REATIVAR ÁREA
  // ============================================

  async function handleToggleZone(zone: DeliveryZone) {
    setSaving(true);
    setFeedback(null);

    try {
      if (zone.isActive) {
        await deactivateDeliveryZone(zone.id);
      } else {
        await reactivateDeliveryZone(zone.id);
      }

      await loadZones();

      setFeedback({
        type: "success",
        message: zone.isActive
          ? "Área desativada com sucesso."
          : "Área reativada com sucesso.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a área.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // INTERFACE
  // ============================================

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black text-stone-900">
            <MapPinned size={21} className="text-orange-600" />
            Áreas de entrega
          </h3>

          <p className="mt-1 text-sm text-stone-500">
            Desenhe no mapa as regiões atendidas pelo restaurante.
          </p>
        </div>

        {mode === "idle" && (
          <button
            type="button"
            onClick={handleCreateZone}
            disabled={!mapReady || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            <Plus size={17} />
            Nova área
          </button>
        )}
      </div>

      {/* FEEDBACK */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            feedback.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MAPA */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
        <div
          ref={mapContainerRef}
          className="h-95 w-full sm:h-120"
        />

        {mapLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90">
            <Loader2
              size={28}
              className="animate-spin text-orange-600"
            />
          </div>
        )}
      </div>

      {/* EDITOR */}
      {mode !== "idle" && (
        <div className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
          <div className="flex items-center gap-2">
            <Pencil size={18} className="text-orange-600" />
            <h4 className="font-bold text-stone-900">
              {mode === "creating"
                ? "Desenhar nova área"
                : "Editar área de entrega"}
            </h4>
          </div>

          <p className="text-sm text-stone-600">
            <MousePointer2
              size={15}
              className="mr-1 inline"
            />
            Clique no mapa para adicionar os vértices do perímetro.
            São necessários pelo menos três pontos.
          </p>

          <div>
            <label
              htmlFor="delivery-zone-name"
              className="mb-2 block text-sm font-semibold text-stone-700"
            >
              Nome da área
            </label>

            <input
              id="delivery-zone-name"
              value={zoneName}
              onChange={(event) =>
                setZoneName(event.target.value)
              }
              maxLength={100}
              className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
              placeholder="Ex.: Zona urbana de Rebouças"
            />
          </div>

          <p className="text-xs font-semibold text-stone-600">
            Pontos selecionados: {points.length}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={points.length === 0 || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50"
            >
              <Undo2 size={16} />
              Desfazer ponto
            </button>

            <button
              type="button"
              onClick={() => setPoints([])}
              disabled={points.length === 0 || saving}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Limpar desenho
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 disabled:opacity-50"
            >
              <X size={16} />
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => void handleSaveZone()}
              disabled={points.length < 3 || saving}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Salvar área
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE ÁREAS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <h4 className="mb-4 font-bold text-stone-900">
          Áreas cadastradas
        </h4>

        {zonesLoading ? (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 size={17} className="animate-spin" />
            Carregando áreas...
          </div>
        ) : zones.length === 0 ? (
          <p className="text-sm text-stone-500">
            Nenhuma área cadastrada até o momento.
          </p>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
              >
                <div>
                  <p className="font-semibold text-stone-900">
                    {zone.name}
                  </p>

                  <p
                    className={`mt-1 text-xs font-semibold ${
                      zone.isActive
                        ? "text-green-700"
                        : "text-stone-400"
                    }`}
                  >
                    {zone.isActive ? "Ativa" : "Desativada"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditZone(zone)}
                    disabled={saving || !mapReady}
                    className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-orange-50 disabled:opacity-50"
                    title="Editar área"
                    aria-label={`Editar ${zone.name}`}
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleToggleZone(zone)}
                    disabled={saving}
                    className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                    title={
                      zone.isActive
                        ? "Desativar área"
                        : "Reativar área"
                    }
                    aria-label={
                      zone.isActive
                        ? `Desativar ${zone.name}`
                        : `Reativar ${zone.name}`
                    }
                  >
                    {zone.isActive ? (
                      <Trash2 size={17} />
                    ) : (
                      <RotateCcw size={17} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
