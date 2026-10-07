import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AppLoadingScreen } from "./AppLoadingScreen";

type AppLoadingGateProps = {
  children: ReactNode;
};

const MIN_LOADING_TIME = 1400;
const EXIT_ANIMATION_TIME = 500;

export function AppLoadingGate({
  children,
}: AppLoadingGateProps) {
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const startedAt = performance.now();

    let finishTimer: number | undefined;
    let exitTimer: number | undefined;

    function finishLoading() {
      const elapsed =
        performance.now() - startedAt;

      const remainingTime = Math.max(
        0,
        MIN_LOADING_TIME - elapsed,
      );

      finishTimer = window.setTimeout(() => {
        setLeaving(true);

        exitTimer = window.setTimeout(() => {
          setLoading(false);
        }, EXIT_ANIMATION_TIME);
      }, remainingTime);
    }

    if (document.readyState === "complete") {
      finishLoading();
    } else {
      window.addEventListener(
        "load",
        finishLoading,
        { once: true },
      );
    }

    return () => {
      window.removeEventListener(
        "load",
        finishLoading,
      );

      if (finishTimer) {
        window.clearTimeout(finishTimer);
      }

      if (exitTimer) {
        window.clearTimeout(exitTimer);
      }
    };
  }, []);

  return (
  <div className="relative min-h-dvh">
    <div
      className={`
        transition-opacity
        duration-500

        ${
          leaving || !loading
            ? "visible opacity-100"
            : "invisible opacity-0"
        }
      `}
      aria-hidden={
        loading && !leaving
      }
    >
      {children}
    </div>

    {loading && (
      <AppLoadingScreen
        leaving={leaving}
      />
    )}
  </div>
);
}