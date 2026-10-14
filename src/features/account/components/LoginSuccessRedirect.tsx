
import { useEffect, useRef } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useSession } from "../../../lib/auth-client";

export function LoginSuccessRedirect() {
  const { data: session, isPending } = useSession();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const redirected = useRef(false);

  const loginSuccess =
    searchParams.get("login") === "success";

  useEffect(() => {
    if (
      isPending ||
      !session?.user ||
      redirected.current
    ) {
      return;
    }

    const user = session.user as typeof session.user & {
      role?: string;
    };

    const destination =
      user.role === "ADMIN"
        ? "/dashboard-admin"
        : user.role === "CUSTOMER"
          ? "/dashboard"
          : null;

    if (!destination) return;

    redirected.current = true;

    navigate(destination, {
      replace: true,
      state: {
        loginSuccess,
      },
    });
  }, [
    isPending,
    session,
    navigate,
    loginSuccess,
  ]);

  if (isPending && loginSuccess) {
    return (
      <p className="mt-4 text-center text-sm text-stone-500">
        Confirmando seu login...
      </p>
    );
  }

  return null;
}
