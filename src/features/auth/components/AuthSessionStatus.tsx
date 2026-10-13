import { useSession, signOut } from "../../../../src/lib/auth-client";

export function AuthSessionStatus() {
  const { data: session, isPending, error } = useSession();

  if (isPending) {
    return <p>Verificando autenticação...</p>;
  }

  if (error) {
    return <p>Não foi possível verificar a sessão.</p>;
  }

  if (!session) {
    return <p>Você ainda não está conectado.</p>;
  }

  return (
    <div className="space-y-3">
      <p>Olá, {session.user.name}!</p>
      <p>{session.user.email}</p>

      <button
        type="button"
        onClick={() =>
          signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/perfil";
              },
            },
          })
        }
      >
        Sair da conta
      </button>
    </div>
  );
}