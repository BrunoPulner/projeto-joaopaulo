import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AppLoadingScreen } from "./AppLoadingScreen";

type AppLoadingGateProps = {
  children: ReactNode;
};

const MIN_LOADING_TIME = 360;
const EXIT_ANIMATION_TIME = 220;

export function AppLoadingGate({
  children,
}: AppLoadingGateProps) {
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let exitTimer: number | undefined;

    const finishTimer = window.setTimeout(() => {
      setLeaving(true);
      exitTimer = window.setTimeout(() => setLoading(false), EXIT_ANIMATION_TIME);
    }, MIN_LOADING_TIME);

    return () => {
      window.clearTimeout(finishTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  return (
  <div className="relative min-h-dvh">
    <div
      className={`
        transition-opacity
        duration-200 motion-reduce:transition-none

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