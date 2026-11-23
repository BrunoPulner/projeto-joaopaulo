import { HomeHero } from "./components/HomeHero";
import "../../styles/home.css";

export function HomePage() {
  return (
    <main className="restaurant-home">
      <img
        className="restaurant-home-photo"
        src="/images/restaurante-salao.jpg"
        alt=""
        fetchPriority="high"
        width={1672}
        height={941}
      />
      <div className="restaurant-home-content">
        <HomeHero />
      </div>
    </main>
  );
}
