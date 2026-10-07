import { RouterProvider } from "react-router-dom";

import { router } from "./app/router";
import { AppLoadingGate } from "./components/loading/AppLoadingGate";
import { CartProvider } from "./features/cart/CartProvider";

export default function App() {
  return (
    <AppLoadingGate>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AppLoadingGate>
  );
}