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
          min-h-12 rounded-xl border border-[#ded1c1] bg-white px-4 py-2.5
          font-semibold text-neutral-900
          text-sm shadow-sm transition-colors
          hover:border-[#bc9f83] hover:bg-[#fff8ec]
          focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-800
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        
<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.42 13.72 17.74 9.5 24 9.5Z" />
          <path fill="#4285F4" d="M47.53 24.55c0-1.57-.15-3.08-.4-4.55H24v9.09h13.25c-.59 2.98-2.27 5.5-4.79 7.18l7.72 5.99c4.5-4.17 7.35-10.32 7.35-17.71Z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.75-2.99-.75-4.59s.27-3.14.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.92 7.53 2.56 10.78l7.97-6.19Z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.72-5.99c-2.15 1.45-4.92 2.28-8.18 2.28-6.26 0-11.58-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48Z" />
        </svg>

        {loading ? "Conectando..." : "Continuar com Google"}
      </button>

      {error && (
        <p role="alert" className="text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}