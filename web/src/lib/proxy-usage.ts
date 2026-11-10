const ANTHROPIC_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";

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
      Authorization: `Bearer ${token}`,
      "anthropic-beta": "oauth-2025-04-20",
      "Content-Type": "application/json",
    },
  });
  return {
    status: res.status,
    body: await res.text(),
    contentType: res.headers.get("content-type") || "application/json",
  };
}
