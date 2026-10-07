import { useEffect, useState } from "react";

import {
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
} from "react-router-dom";

import { CartDrawer } from "../../features/cart/components/CartDrawer";
import { useCart } from "../../features/cart/useCart";

import { ScrollToTop } from "../../components/layout/ScrollToTop";

const navigation = [
  {
    to: "/",
    label: "Início",
    end: true,
  },
  {
    to: "/cardapio",
    label: "Cardápio",
    end: false,
  },
];

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();

  const returnTo =
    location.pathname +
    location.search +
    location.hash;

  const isHome = location.pathname === "/";

  const transparentHomeHeader =
    isHome && !scrolled;

  /*
   * Mantemos a mesma versão clara da logo
   * em todas as páginas públicas.
   */
  const headerLogo =
    "/images/Logo-branco-loading.png";

  const {
    items,
    itemCount,
    open,
    openCart,
    closeCart,
    increase,
    decrease,
    remove,
  } = useCart();

  /* ========================================
     HEADER COMPACTO AO ROLAR
     ======================================== */

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, []);

  /* ========================================
     MENU MOBILE
     ======================================== */

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen">
      <ScrollToTop />

      {/* =====================================
          HEADER
          ===================================== */}

      <header
        className={`
          fixed
          inset-x-0
          top-0
          z-40

          border-b

          transition-all
          duration-500
          ease-out

          motion-reduce:transition-none

          ${
            transparentHomeHeader
              ? `
                  border-transparent
                  bg-transparent
                  shadow-none
                `
              : `
                  border-white/10
                  bg-[#090604]/92
                  shadow-lg
                  shadow-black/20
                  backdrop-blur-xl
                `
          }
        `}
      >
        <nav
          aria-label="Navegação principal"
          className={`
            mx-auto
            flex
            max-w-6xl
            items-center
            justify-between
            gap-4
            px-5

            transition-[height]
            duration-300
            ease-in-out

            motion-reduce:transition-none

            md:px-8

            ${
              scrolled
                ? "h-16"
                : "h-20 sm:h-22"
            }
          `}
        >
          {/* LOGO */}

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            aria-label="Espetinhos João Paulo — Início"
            className="
              flex
              h-full
              shrink-0
              items-center
            "
          >
            <img
              src={headerLogo}
              alt="Espetinhos João Paulo"
              className={`
                w-auto
                object-contain

                transition-all
                duration-300
                ease-out

                motion-reduce:transition-none

                ${
                  scrolled
                    ? "h-12 sm:h-14"
                    : "h-16 sm:h-18"
                }
              `}
            />
          </Link>

          {/* NAVEGAÇÃO DESKTOP */}

          <div className="hidden items-center gap-7 md:flex">
            {navigation.map(
              ({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `
                      group
                      relative
                      rounded-sm
                      py-2

                      text-sm
                      font-bold

                      transition-colors
                      duration-300

                      focus-visible:outline-2
                      focus-visible:outline-offset-4
                      focus-visible:outline-white

                      motion-reduce:transition-none

                      ${
                        isActive
                          ? "text-red-500"
                          : "text-white hover:text-red-400"
                      }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}

                      <span
                        aria-hidden="true"
                        className={`
                          pointer-events-none
                          absolute
                          inset-x-0
                          bottom-0
                          h-0.5
                          origin-left
                          rounded-full
                          bg-red-500

                          transition-transform
                          duration-300
                          ease-out

                          motion-reduce:transition-none

                          ${
                            isActive
                              ? "scale-x-100"
                              : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                          }
                        `}
                      />
                    </>
                  )}
                </NavLink>
              ),
            )}
          </div>

          {/* AÇÕES */}

          <div className="flex items-center gap-2">
            {/* SACOLA */}

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openCart();
              }}
              aria-label={`Abrir sacola com ${itemCount} itens`}
              className="
                inline-flex
                items-center
                gap-2

                rounded-xl
                bg-red-600

                px-3
                py-2.5

                font-bold
                text-white

                shadow-lg
                shadow-black/10

                transition-all
                duration-300

                hover:-translate-y-0.5
                hover:bg-red-700
                hover:shadow-xl

                active:translate-y-0

                focus-visible:outline-2
                focus-visible:outline-offset-4
                focus-visible:outline-white

                motion-reduce:transform-none
                motion-reduce:transition-none

                sm:px-4
              "
            >
              <span className="relative">
                <ShoppingBag
                  size={20}
                  aria-hidden="true"
                />

                {itemCount > 0 && (
                  <span
                    className="
                      absolute
                      -right-2
                      -top-2

                      flex
                      min-h-5
                      min-w-5
                      items-center
                      justify-center

                      rounded-full
                      bg-white
                      px-1

                      text-[11px]
                      font-black
                      text-red-700

                      shadow-sm
                    "
                  >
                    {itemCount > 99
                      ? "99+"
                      : itemCount}
                  </span>
                )}
              </span>

              <span className="hidden text-sm sm:inline">
                Sacola
              </span>
            </button>

            {/* PERFIL */}

            <NavLink
  to="/perfil"
  state={{ from: returnTo }}
  onClick={() =>
    setMenuOpen(false)
  }
  aria-label="Acessar perfil"
  className={({ isActive }) =>
    `
      hidden
      items-center
      justify-center
      md:inline-flex
                  gap-2

                  rounded-xl
                  border

                  px-3
                  py-2.5

                  font-bold

                  backdrop-blur-md

                  transition-all
                  duration-300

                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  focus-visible:outline-white

                  motion-reduce:transform-none
                  motion-reduce:transition-none

                  sm:px-4

                  ${
                    isActive
                      ? `
                          border-red-500
                          bg-red-500
                          text-white
                          shadow-lg
                          shadow-black/10
                        `
                      : `
                          border-white/30
                          bg-black/20
                          text-white
                          shadow-sm

                          hover:-translate-y-0.5
                          hover:border-white/60
                          hover:bg-white/15
                        `
                  }
                `
              }
            >
              <UserRound
                size={20}
                aria-hidden="true"
              />

              <span className="hidden text-sm sm:inline">
                Perfil
              </span>
            </NavLink>

            {/* HAMBÚRGUER */}

            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() =>
                setMenuOpen(true)
              }
              className="
                inline-flex
                items-center
                justify-center

                rounded-xl
                border
                border-white/30

                bg-black/20

                p-2

                text-white

                shadow-sm
                backdrop-blur-md

                transition-all
                duration-300

                hover:border-white/60
                hover:bg-white/15

                active:scale-95

                focus-visible:outline-2
                focus-visible:outline-offset-4
                focus-visible:outline-white

                md:hidden
              "
            >
              <Menu
                size={22}
                aria-hidden="true"
              />
            </button>
          </div>
        </nav>
      </header>

      {/* =====================================
          BACKDROP MOBILE
          ===================================== */}

      <button
        type="button"
        tabIndex={menuOpen ? 0 : -1}
        aria-label="Fechar menu"
        onClick={() =>
          setMenuOpen(false)
        }
        className={`
          fixed
          inset-0
          z-50

          bg-stone-950/55
          backdrop-blur-[3px]

          transition-opacity
          duration-400
          ease-out

          motion-reduce:transition-none

          md:hidden

          ${
            menuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      />

      {/* =====================================
          DRAWER MOBILE
          ===================================== */}

      <aside
        id="mobile-navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`
          fixed
          inset-y-0
          right-0
          z-60

          flex
          w-[74vw]
          max-w-80
          flex-col

          border-l
          border-orange-100

          bg-[#fffaf5]

          shadow-2xl
          shadow-stone-950/20

          transition-transform
          duration-500
          ease-[cubic-bezier(0.16,1,0.3,1)]

          motion-reduce:transition-none

          md:hidden

          ${
            menuOpen
              ? "translate-x-0"
              : "pointer-events-none translate-x-full"
          }
        `}
      >
        {/* CABEÇALHO DO MENU */}

        <div
          className="
            flex
            items-center
            justify-between

            border-b
            border-orange-100

            bg-[#f8dfc9]

            px-5
            py-4
          "
        >
          <Link
            to="/"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-label="Espetinhos João Paulo — Início"
            className="shrink-0"
          >
            <img
              src="/images/logo-semfundo.png"
              alt="Espetinhos João Paulo"
              className="
                h-16
                w-auto
                object-contain
              "
            />
          </Link>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-label="Fechar menu"
            className="
              inline-flex
              h-10
              w-10
              items-center
              justify-center

              rounded-full

              border
              border-orange-200

              bg-white

              text-stone-700

              shadow-sm

              transition-all
              duration-200

              hover:border-red-300
              hover:bg-red-50
              hover:text-red-600

              active:scale-95

              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-red-500
            "
          >
            <X
              size={20}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* NAVEGAÇÃO CENTRAL */}

        <nav
          aria-label="Navegação no celular"
          className="
            flex
            flex-1
            flex-col
            items-center
            justify-center

            px-6
            pb-16
          "
        >
          <p
            className="
              mb-7

              text-[10px]
              font-black
              uppercase
              tracking-[0.22em]

              text-red-600
            "
          >
            Navegação
          </p>

          <div
            className="
              flex
              w-full
              flex-col
              items-center
              gap-2
            "
          >
            {navigation.map(
              (
                { to, label, end },
                index,
              ) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  style={{
                    transitionDelay:
                      menuOpen
                        ? `${120 + index * 70}ms`
                        : "0ms",
                  }}
                  className={({ isActive }) =>
                    `
                      relative
                      flex
                      w-full
                      items-center
                      justify-center

                      rounded-2xl

                      px-5
                      py-4

                      text-center
                      text-base
                      font-black

                      transition-all
                      duration-400

                      focus-visible:outline-2
                      focus-visible:outline-offset-2
                      focus-visible:outline-red-500

                      ${
                        menuOpen
                          ? "translate-x-0 opacity-100"
                          : "translate-x-5 opacity-0"
                      }

                      ${
                        isActive
                          ? `
                              bg-red-600
                              text-white
                              shadow-md
                              shadow-red-600/15
                            `
                          : `
                              text-stone-700
                              hover:bg-red-50
                              hover:text-red-600
                            `
                      }
                    `
                  }
                >
                  {label}
                </NavLink>
              ),
            )}
          </div>
        </nav>

        {/* RODAPÉ DO MENU */}

        <div
          className="
            border-t
            border-orange-100

            bg-white/60

            px-6
            py-5

            text-center
          "
        >
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.16em]

              text-stone-400
            "
          >
            Espetinhos do João Paulo
          </p>
        </div>
      </aside>

      {/* =====================================
          CONTEÚDO DAS ROTAS
          ===================================== */}

      <div
        className={
          isHome
            ? "pt-0"
            : "pt-22.25 sm:pt-26.25"
        }
      >
        <Outlet />
      </div>

      {/* =====================================
          SACOLA
          ===================================== */}

      <CartDrawer
        open={open}
        items={items}
        onClose={closeCart}
        onIncrease={increase}
        onDecrease={decrease}
        onRemove={remove}
      />
    </div>
  );
}