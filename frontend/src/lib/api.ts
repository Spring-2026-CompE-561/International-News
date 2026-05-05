/**
 * Central API base URL.
 * Override by setting NEXT_PUBLIC_API_URL in .env.local:
 *   NEXT_PUBLIC_API_URL=http://192.168.1.50:8000/api/v1
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
