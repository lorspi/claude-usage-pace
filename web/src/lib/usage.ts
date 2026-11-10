import type { UsageData } from "./types";

/**
 * Consulta el uso a través del proxy del propio sitio (`/api/usage`), que en
 * Cloudflare Pages se sirve como Pages Function. Así no hay CORS ni bloqueos de
 * terceros, y el token nunca sale del navegador salvo a través del proxy.
 */
export async function fetchUsage(token: string): Promise<UsageData> {
  const res = await fetch("/api/usage", {
    method: "POST",
    headers: {
      "x-claude-token": token,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (res.status === 401) {
    throw new Error("Token expirado o inválido. Renueva tu sesión de Claude Code.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status} al consultar el uso.`);
  }
  return res.json();
}
