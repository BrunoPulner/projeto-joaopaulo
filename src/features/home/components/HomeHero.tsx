import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HomeHero() {
  return (
    <section className="max-w-2xl" aria-labelledby="home-title">
      <h1 id="home-title" className="restaurant-home-title">
        O sabor tem <em>encontro marcado.</em>
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-stone-100 sm:mt-6 sm:text-lg">
        Escolha o que vai à mesa e peça online para entrega ou retirada.
      </p>
      <Link
        to="/cardapio"
        className="mt-6 inline-flex min-h-12 items-center gap-6 rounded-xl bg-[#f2e3cd] px-5 py-2.5 text-sm font-bold text-[#201911] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mt-8 sm:px-6"
      >
        Explorar cardápio <ArrowUpRight size={19} aria-hidden="true" />
      </Link>
    </section>
  );
}
