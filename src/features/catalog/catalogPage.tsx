import { useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";

import {
  categories,
  products,
  subcategories,
  type Product,
} from "./catalogData";

import { CategoryVideo } from "./components/CategoryVideo";
import { CategoryTabs } from "./components/CategoryTabs";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailsModal } from "./components/ProductDetailsModal";
import { useCart } from "../cart/useCart";

import "../../styles/catalog.css";

export function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState(
    categories[0].id,
  );

  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | null
  >(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [leaving, setLeaving] = useState(false);

  const pendingCategory = useRef<string | null>(null);

  const { addItem, openCart } = useCart();

  const availableSubcategories = subcategories.filter(
    (subcategory) =>
      subcategory.categoryId === selectedCategory,
  );

  const showSubcategoryTabs =
    availableSubcategories.length > 1;

  const activeSubcategory = showSubcategoryTabs
    ? availableSubcategories.find(
        (subcategory) =>
          subcategory.id === selectedSubcategory,
      )?.id ?? availableSubcategories[0].id
    : null;

  const visibleProducts = products.filter((product) => {
    if (product.categoryId !== selectedCategory) {
      return false;
    }

    return (
      !showSubcategoryTabs ||
      product.subcategoryId === activeSubcategory
    );
  });

  const selectedCategoryData = categories.find(
    (category) => category.id === selectedCategory,
  );

  const categoryName = selectedCategoryData?.name;

  const selectedSubcategoryData =
    availableSubcategories.find(
      (subcategory) =>
        subcategory.id === activeSubcategory,
    );

  const subcategoryName =
    selectedSubcategoryData?.name;

  const videoSrc =
    selectedSubcategoryData?.video ??
    selectedCategoryData?.video;

  function handleCategorySelect(categoryId: string) {
    if (
      categoryId === selectedCategory &&
      !leaving
    ) {
      return;
    }

    pendingCategory.current = categoryId;
    setLeaving(true);
  }

  function finishCategoryTransition() {
    const categoryId = pendingCategory.current;

    if (!categoryId) return;

    const firstSubcategory = subcategories.find(
      (subcategory) =>
        subcategory.categoryId === categoryId,
    );

    setSelectedCategory(categoryId);
    setSelectedSubcategory(
      firstSubcategory?.id ?? null,
    );

    pendingCategory.current = null;
    setLeaving(false);
  }

  function handleViewProduct(product: Product) {
    setSelectedProduct(product);
  }

  function handleCloseProduct() {
    setSelectedProduct(null);
  }

  function handleAddProduct(
  product: Product,
  quantity: number,
  notes: string,
) {
  addItem({
    product,
    quantity,
    notes,
  });

  setSelectedProduct(null);
  openCart();
}

  return (
    <>
      <main className="min-h-[calc(100dvh-89px)] bg-[#fffaf5] sm:min-h-[calc(100dvh-105px)]">
        <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
          <header className="text-center">
            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-700 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-md shadow-orange-700/15">
              <ShoppingBag
                size={15}
                aria-hidden="true"
              />

              Faça seu pedido
            </span>

            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-stone-950 sm:text-4xl">
              Seu próximo pedido começa aqui.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base">
              Escolha uma categoria e encontre seu
              favorito.
            </p>
          </header>

          <div className="mt-7 sm:mt-8">
            <CategoryTabs
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={handleCategorySelect}
            />
          </div>

          <section
            aria-labelledby="category-title"
            aria-busy={leaving}
            className="mt-8 sm:mt-10"
          >
            <div
              key={selectedCategory}
              inert={leaving}
              className={
                leaving
                  ? "catalog-content-exit"
                  : "catalog-content-enter"
              }
              onAnimationEnd={(event) => {
                if (
                  event.target !==
                  event.currentTarget
                ) {
                  return;
                }

                if (leaving) {
                  finishCategoryTransition();
                }
              }}
            >
              {showSubcategoryTabs && (
                <div
                  role="group"
                  aria-label={`Tipos de ${categoryName}`}
                  className="flex justify-center"
                >
                  <div className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-stone-200 bg-white p-1 sm:rounded-full">
                    {availableSubcategories.map(
                      (subcategory) => {
                        const selected =
                          subcategory.id ===
                          activeSubcategory;

                        return (
                          <button
                            key={subcategory.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() =>
                              setSelectedSubcategory(
                                subcategory.id,
                              )
                            }
                            className={`min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 motion-reduce:transition-none sm:rounded-full ${
                              selected
                                ? "bg-orange-700 text-white"
                                : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"
                            }`}
                          >
                            {subcategory.name}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              <div
                className={
                  showSubcategoryTabs
                    ? "mt-7"
                    : ""
                }
              >
                <h2
                  id="category-title"
                  className="text-2xl font-black tracking-tight text-stone-900"
                >
                  {categoryName}
                </h2>

                {showSubcategoryTabs && (
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    {subcategoryName}
                  </p>
                )}
              </div>

              <div
                key={
                  activeSubcategory ?? "all"
                }
                className="catalog-products-enter mt-5"
              >
                {visibleProducts.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-3 lg:gap-5">
                    {visibleProducts.map(
                      (product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onView={
                            handleViewProduct
                          }
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 px-6 py-12 text-center">
                    <ShoppingBag
                      size={32}
                      aria-hidden="true"
                      className="mx-auto text-orange-300"
                    />

                    <p className="mt-4 font-semibold text-stone-700">
                      Novidades chegando por aqui!
                    </p>

                    <p className="mt-2 text-sm text-stone-500">
                      Os produtos desta seleção serão
                      adicionados em breve.
                    </p>
                  </div>
                )}
              </div>

              {videoSrc && (
                <CategoryVideo
                  src={videoSrc}
                  title={
                    subcategoryName
                      ? `${categoryName} — ${subcategoryName}`
                      : categoryName ??
                        "cardápio"
                  }
                />
              )}
            </div>
          </section>
        </div>
      </main>

      {selectedProduct && (
        <ProductDetailsModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={handleCloseProduct}
          onAdd={handleAddProduct}
        />
      )}
    </>
  );
}