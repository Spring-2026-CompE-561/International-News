/**
 * API base URL.
 *
 * - Browser (Client Components): uses the Next.js proxy rewrite at /api/v1
 *   so requests stay same-origin — no CORS, no hardcoded IP.
 *
 * - Server (Server Components / Route Handlers): calls the backend directly.
 *   Override with BACKEND_URL in .env.local if the backend is on a different host.
 *
 * To point at a teammate's machine just set in frontend/.env.local:
 *   BACKEND_URL=http://192.168.1.50:8000
 */
export const API_URL =
  typeof window === "undefined"
    ? `${process.env.BACKEND_URL ?? "http://localhost:8000"}/api/v1`
    : "/api/v1";
