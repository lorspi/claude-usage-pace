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
  if (res.status === 403) {
    throw new Error("Anthropic bloqueó la petición (403). Espera un momento e inténtalo de nuevo.");
  }
  if (res.status === 429) {
    throw new Error("Límite de peticiones alcanzado (429). Espera unos minutos antes de volver a actualizar.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed?.error?.message) detail = parsed.error.message;
    } catch {
      /* no es JSON */
    }
    throw new Error(detail || `Error ${res.status} al consultar el uso.`);
  }
  return res.json();
}
