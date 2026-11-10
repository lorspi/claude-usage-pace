import { proxyAnthropicUsage } from "../../src/lib/proxy-usage";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-claude-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_TTL = 90;

async function getCachedUsage(token: string): Promise<Response | null> {
  const cache = caches.default;
  const cacheKey = new Request("https://claude-quota-pace.local/api/usage", {
    headers: { "x-claude-token": token },
  });
  const cached = await cache.match(cacheKey);
  return cached ?? null;
}

async function setCachedUsage(token: string, response: Response): Promise<void> {
  const cache = caches.default;
  const cacheKey = new Request("https://claude-quota-pace.local/api/usage", {
    headers: { "x-claude-token": token },
  });
  const copy = new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
  copy.headers.append("Cache-Control", `public, max-age=${CACHE_TTL}`);
  await cache.put(cacheKey, copy);
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  const token = request.headers.get("x-claude-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "missing token" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const cached = await getCachedUsage(token);
  if (cached) {
    const body = await cached.text();
    return new Response(body, {
      status: cached.status,
      headers: { ...corsHeaders, "content-type": cached.headers.get("content-type") || "application/json", "x-cache": "HIT" },
    });
  }

  const { status, body, contentType } = await proxyAnthropicUsage(token);
  const response = new Response(body, {
    status,
    headers: { ...corsHeaders, "content-type": contentType, "x-cache": "MISS" },
  });

  // Solo cacheamos respuestas exitosas (2xx) para no guardar errores transitorios.
  if (status >= 200 && status < 300) {
    await setCachedUsage(token, response);
  }

  return response;
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}
