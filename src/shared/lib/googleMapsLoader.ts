
import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";

// ============================================
// CONFIGURAÇÕES
// ============================================

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let configured = false;

// ============================================
// CONFIGURAR GOOGLE MAPS
// ============================================

export function configureGoogleMaps(): void {
  if (configured) return;

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      "A chave do Google Maps não foi configurada.",
    );
  }

  setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: "weekly",
  });

  configured = true;
}

// ============================================
// CARREGAR BIBLIOTECA
// ============================================

export async function loadGoogleMapsLibrary(
  library: "maps" | "places" | "marker" | "geocoding",
) {
  configureGoogleMaps();

  return importLibrary(library);
}
