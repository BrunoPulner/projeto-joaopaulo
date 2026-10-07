const sessionKey = "admin-demo-session";

export function isDemoAdmin(email: string, password: string) {
  return (
    email.trim().toLowerCase() === "teste@teste.com" &&
    password === "teste"
  );
}

export function startAdminDemoSession() {
  sessionStorage.setItem(sessionKey, "authenticated");
}

export function hasAdminDemoSession() {
  return sessionStorage.getItem(sessionKey) === "authenticated";
}

export function endAdminDemoSession() {
  sessionStorage.removeItem(sessionKey);
}