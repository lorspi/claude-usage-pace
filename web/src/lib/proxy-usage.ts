const ANTHROPIC_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";

// Cabeceras que imitan a un navegador real accediendo a claude.ai, para reducir
// las posibilidades de que el WAF / bot-management de Anthropic bloquee la
// petición (que desde un Worker sale con IP de datacenter).
// NOTA: NO incluimos Accept-Encoding porque el runtime de Cloudflare lo gestiona.
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  Origin: "https://claude.ai",
  Referer: "https://claude.ai/",
  "anthropic-beta": "oauth-2025-04-20",
  "Content-Type": "application/json",
};

export interface ProxyResult {
  status: number;
  body: string;
  contentType: string;
}

/**
 * Llama al endpoint de uso de Anthropic desde el servidor (Pages Function / middleware de Vite),
 * evitando las restricciones CORS del navegador y los bloqueadores de terceros.
 */
export async function proxyAnthropicUsage(token: string): Promise<ProxyResult> {
  const res = await fetch(ANTHROPIC_USAGE_URL, {
    headers: {
      ...BROWSER_HEADERS,
      Authorization: `Bearer ${token}`,
    },
  });
  const body = await res.text();
  return {
    status: res.status,
    body,
    contentType: res.headers.get("content-type") || "application/json",
  };
}
