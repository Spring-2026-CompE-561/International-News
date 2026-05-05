import { getAuthHeaders } from "./auth";

/** Thrown when the API returns a non-2xx response. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Typed fetch wrapper for the backend API.
 *
 * - Automatically attaches auth headers when a token is present.
 * - Parses `{ detail }` from FastAPI error bodies.
 * - Returns `undefined` for 204 No Content responses.
 * - All paths are relative to /api/v1 (proxied by Next.js in the browser).
 *
 * @example
 *   const user = await apiFetch<UserProfile>("/users/me");
 *   await apiFetch("/bookmarks/5", { method: "DELETE" });
 */
export async function apiFetch<T = void>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      res.status,
      body.detail ?? `${res.status} ${res.statusText}`,
    );
  }

  return res.json() as Promise<T>;
}
