import { memo, useEffect, useRef, useState, type ComponentProps } from "react";
import { ChevronRight, House, Menu, ShoppingBag, UserRound, UtensilsCrossed, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { CartDrawer } from "../../features/cart/components/CartDrawer";
import { useCart } from "../../features/cart/useCart";
import { useSession } from "../../lib/auth-client";
import { ScrollToTop } from "./ScrollToTop";

const navigation = [
  { to: "/", label: "Início", end: true, icon: House },
  { to: "/cardapio", label: "Cardápio", end: false, icon: UtensilsCrossed },
];

type ProfileLinkProps = ComponentProps<typeof NavLink> & {
  rememberPage: boolean;
};

function ProfileLink({ rememberPage, ...props }: ProfileLinkProps) {
  const { pathname, search, hash } = useLocation();
  return <NavLink {...props} state={rememberPage ? { from: pathname + search + hash } : undefined} />;
}

const PublicNavigation = memo(function PublicNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLElement>(null);
  const { itemCount, openCart } = useCart();
  const { data: session } = useSession();
  const user = session?.user;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Perfil";
  const profileDestination = user ? "/dashboard" : "/perfil";

  useEffect(() => {
    const element = header.current;
    if (!element) return;

    function syncHeight() {
      element?.toggleAttribute("data-compact", window.scrollY > 12);
    }

    syncHeight();
    window.addEventListener("scroll", syncHeight, { passive: true });
    return () => window.removeEventListener("scroll", syncHeight);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    menuTrigger.current?.focus();
  }

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuClose.current?.focus();

    const desktop = window.matchMedia("(min-width: 768px)");
    function closeAtDesktop() {
      if (desktop.matches) setMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        menuTrigger.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const controls = menuPanel.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!controls?.length) return;

      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!menuPanel.current?.contains(document.activeElement) || document.activeElement === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    }

    desktop.addEventListener("change", closeAtDesktop);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", closeAtDesktop);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const avatar = user?.image ? (
    <img src={user.image} alt="" referrerPolicy="no-referrer" className="size-7 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
  ) : (
    <UserRound size={18} className="shrink-0" aria-hidden="true" />
  );

  return (
    <>
      <header ref={header} className="public-header fixed inset-x-0 top-0 z-40">
        <nav aria-label="Navegação principal" className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:px-8">
          <Link to="/" aria-label="Borcelle — Início" className="inline-flex w-fit max-w-full shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#83371f]">
            <img src="/images/borcelle-header.svg" alt="" width={196} height={56} className="public-header-brand h-auto w-35 sm:w-40 lg:w-44" />
          </Link>

          <div className="hidden items-center justify-center gap-5 px-3 md:flex lg:gap-6">
            {navigation.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `group relative grid min-h-11 place-items-center rounded-sm px-1 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83371f] motion-reduce:transition-none ${isActive ? "text-[#83371f]" : "text-stone-800 hover:text-[#83371f]"}`}
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-x-1 bottom-1.5 h-0.5 origin-left rounded-full bg-[#a43f20] transition-transform duration-300 ease-out motion-reduce:transition-none ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"}`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={openCart}
              aria-label={`Abrir sacola com ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#a43f20] px-2.5 text-sm font-bold text-white transition-colors hover:bg-[#be4f28] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#83371f] sm:px-3"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              <span className="hidden sm:inline">Sacola</span>
              {itemCount > 0 && (
                <span aria-hidden="true" className="grid min-h-5 min-w-5 place-items-center rounded-full bg-[#ffedd7] px-1 text-[10px] font-black leading-none text-[#71331d]">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            <ProfileLink
              to={profileDestination}
              rememberPage={!user}
              aria-label={user ? `Acessar a conta de ${user.name}` : "Acessar perfil"}
              className="hidden min-h-11 min-w-0 items-center gap-2 rounded-xl border border-[#846b55]/35 bg-white/30 px-2.5 text-sm font-semibold text-stone-900 transition-colors hover:border-[#846b55]/60 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#83371f] md:inline-flex"
            >
              {avatar}
              <span className="max-w-24 truncate lg:max-w-32">{firstName}</span>
            </ProfileLink>

            <button
              ref={menuTrigger}
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(true)}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#846b55]/35 bg-white/30 text-stone-900 transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#83371f] md:hidden"
            >
              <Menu size={21} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </header>

      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={`fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none md:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        ref={menuPanel}
        id="mobile-navigation"
        role="dialog"
        aria-modal={menuOpen ? true : undefined}
        aria-label="Menu do restaurante"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        className={`fixed inset-y-0 right-0 z-60 flex w-[min(88vw,22rem)] flex-col bg-[#fffcf7] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden ${menuOpen ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#846b55]/25 bg-[#f4e7d8] p-4">
          <Link to="/" onClick={closeMenu} aria-label="Borcelle — Início" className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83371f]">
            <img src="/images/borcelle-header.svg" alt="" width={196} height={56} className="h-auto w-40 max-w-full" />
          </Link>
          <button
            ref={menuClose}
            type="button"
            onClick={closeMenu}
            aria-label="Fechar menu"
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#846b55]/35 text-stone-900 transition-colors hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83371f]"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <nav aria-label="Navegação no celular" className="grid gap-2">
            {navigation.map(({ to, label, end, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={closeMenu}
                className={({ isActive }) => `flex min-h-14 items-center gap-3 rounded-xl border px-3 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-800 ${isActive ? "border-[#e4c6ac] bg-[#f5e6d5] text-[#713c20]" : "border-stone-200 bg-white text-stone-800 hover:bg-[#fbf3e8]"}`}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
                <ChevronRight size={17} className="ml-auto" aria-hidden="true" />
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-5">
            <ProfileLink
              to={profileDestination}
              rememberPage={!user}
              onClick={closeMenu}
              className="flex min-h-15 items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 text-stone-800 transition-colors hover:bg-[#fbf3e8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-800"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2e5d5] text-[#754223]">{avatar}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{user?.name || "Entrar na minha conta"}</span>
                <span className="block text-xs text-stone-600">{user ? "Pedidos e dados da conta" : "Acesse seus pedidos"}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-[#754223]" aria-hidden="true" />
            </ProfileLink>
          </div>
        </div>
      </aside>
    </>
  );
});

function PublicPageContent() {
  const { pathname } = useLocation();

  return (
    <>
      <ScrollToTop />
      <div className="public-page-viewport" data-public-page={pathname === "/" ? "home" : "catalog"}>
        <div key={pathname} className="public-page-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}

function PublicCart() {
  const { items, open, closeCart, increase, decrease, remove } = useCart();

  return (
      <CartDrawer
        open={open}
        items={items}
        onClose={closeCart}
        onIncrease={increase}
        onDecrease={decrease}
        onRemove={remove}
      />

  );
}

export function PublicLayout() {
  return (
    <div className="public-layout">
      <PublicNavigation />
      <PublicPageContent />
      <PublicCart />
    </div>
  );
}
