import { useState } from "react";
import { signIn } from "../../../../src/lib/auth-client";


export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/perfil?login=success`,
      });

      if (result.error) {
        setError(
          result.error.message ?? "Não foi possível entrar com Google.",
        );
        setLoading(false);
      }
    } catch {
      setError("Erro ao iniciar o login. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="
          flex w-full items-center justify-center gap-3
          rounded-xl bg-white px-5 py-3
          font-semibold text-neutral-900
          shadow-sm transition
          hover:bg-neutral-100
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        <span className="text-xl font-bold text-blue-600">G</span>

        {loading ? "Conectando..." : "Continuar com Google"}
      </button>

      {error && (
        <p role="alert" className="text-center text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}