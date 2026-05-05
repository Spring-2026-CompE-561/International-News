const TOKEN_KEY = "horizon-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("auth-changed"));
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("auth-changed"));
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
