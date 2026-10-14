
import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { GoogleLoginButton } from "../../auth/components/GoogleLoginButton";
import { authClient } from "../../../lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Informe seu e-mail e sua senha.");
      return;
    }

    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (result.error) {
        setError("E-mail ou senha inválidos.");
        return;
      }

      const sessionResult = await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });

      const user = sessionResult.data?.user;

      if (sessionResult.error || !user) {
        setError(
          "Não foi possível confirmar sua sessão. Tente novamente.",
        );
        return;
      }

      const role = (user as typeof user & {
        role?: string;
      }).role;

      if (role !== "ADMIN") {
        await authClient.signOut();
        setError(
          "Esta área é exclusiva da administração do restaurante.",
        );
        return;
      }

      navigate("/dashboard-admin", {
        replace: true,
      });
    } catch (error) {
      console.error("Erro ao realizar login:", error);

      setError(
        "Não foi possível conectar ao servidor. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 space-y-5"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-stone-700"
        >
          E-mail
        </label>

        <div className="relative">
          <Mail
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            disabled={loading}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            className="min-h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10 disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-stone-700"
        >
          Senha
        </label>

        <div className="relative">
          <LockKeyhole
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          />

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={password}
            disabled={loading}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            className="min-h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-600 focus:ring-4 focus:ring-orange-600/10 disabled:opacity-60"
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPassword((current) => !current)}
            aria-label={
              showPassword ? "Ocultar senha" : "Mostrar senha"
            }
            aria-controls="password"
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-orange-700 disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 font-bold text-white transition hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <LoaderCircle
              size={18}
              className="animate-spin"
              aria-hidden="true"
            />
            Autenticando...
          </>
        ) : (
          "Entrar"
        )}
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-stone-400">
            ou continue com
          </span>
        </div>
      </div>

      <GoogleLoginButton />
    </form>
  );
}
