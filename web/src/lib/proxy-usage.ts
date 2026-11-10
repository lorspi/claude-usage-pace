const ANTHROPIC_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";

// Cabeceras que imitan a un navegador real accediendo a claude.ai, para reducir
// las posibilidades de que el WAF / bot-management de Anthropic bloquee la
// petición (que desde un Worker sale con IP de datacenter).
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
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
    cf: {
      cacheTtl: 0,
      cacheEverything: false,
    },
  });
  return {
    status: res.status,
    body: await res.text(),
    contentType: res.headers.get("content-type") || "application/json",
  };
}
