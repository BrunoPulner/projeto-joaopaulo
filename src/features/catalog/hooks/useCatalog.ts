
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getCatalogData } from "../api/catalog.api";

import type {
  CatalogData,
} from "../types/catalog.types";

const emptyCatalog: CatalogData = {
  categories: [],
  subcategories: [],
  products: [],
};

export function useCatalog() {
  const [data, setData] =
    useState<CatalogData>(emptyCatalog);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      setLoading(true);
      setError(null);

      try {
        const catalog = await getCatalogData(
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setData(catalog);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o catálogo.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      controller.abort();
    };
  }, [reloadKey]);

  return {
    categories: data.categories,
    subcategories: data.subcategories,
    products: data.products,
    loading,
    error,
    reload,
  };
}
