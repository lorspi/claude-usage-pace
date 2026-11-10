import type { UsageData } from "./types";

// Mismo endpoint que usa `/usage` en Claude Code.
// Se consulta directamente desde el navegador con el token de la cuenta.
const USAGE_URL = "https://api.anthropic.com/api/oauth/usage";

/** Devuelve el JSON completo del endpoint de uso. */
export async function fetchUsage(token: string): Promise<UsageData> {
  const res = await fetch(USAGE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "anthropic-beta": "oauth-2025-04-20",
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 401) {
    throw new Error("Token expirado o inválido. Renueva tu sesión de Claude Code.");
  }
  if (!res.ok) throw new Error(`Error ${res.status} al consultar el uso.`);
  return res.json();
}
