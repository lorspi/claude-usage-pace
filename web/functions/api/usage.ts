import { proxyAnthropicUsage } from "../../src/lib/proxy-usage";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-claude-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_TTL_OK = 120;
const CACHE_TTL_ERROR = 30;

function cacheKeyFor(token: string): Request {
  return new Request("https://claude-quota-pace.local/api/usage", {
    headers: { "x-claude-token": token },
  });
}

async function getCached(token: string): Promise<Response | null> {
  try {
    const cached = await caches.default.match(cacheKeyFor(token));
    return cached ?? null;
  } catch {
    return null;
  }
}

async function setCached(token: string, response: Response, ttl: number): Promise<void> {
  try {
    const copy = new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
    copy.headers.append("Cache-Control", `public, max-age=${ttl}`);
    await caches.default.put(cacheKeyFor(token), copy);
  } catch {
    /* si la caché falla, no pasa nada: seguimos sin cachear */
  }
}

function jsonError(status: number, message: string, cacheHit = false): Response {
  return new Response(JSON.stringify({ error: { type: "proxy_error", message } }), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
      "x-cache": cacheHit ? "HIT" : "MISS",
    },
  });
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  try {
    const token = request.headers.get("x-claude-token");
    if (!token) {
      return jsonError(400, "missing token");
    }

    const cached = await getCached(token);
    if (cached) {
      const body = await cached.text();
      return new Response(body, {
        status: cached.status,
        headers: {
          ...corsHeaders,
          "content-type": cached.headers.get("content-type") || "application/json",
          "x-cache": "HIT",
        },
      });
    }

    const { status, body, contentType } = await proxyAnthropicUsage(token);
    const response = new Response(body, {
      status,
      headers: { ...corsHeaders, "content-type": contentType, "x-cache": "MISS" },
    });

    // Cacheamos tanto respuestas buenas como errores transitorios (403/429)
    // para no martillear a Anthropic.
    if ((status >= 200 && status < 300) || status === 403 || status === 429) {
      const ttl = status >= 200 && status < 300 ? CACHE_TTL_OK : CACHE_TTL_ERROR;
      await setCached(token, response, ttl);
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonError(502, `Proxy error: ${message}`);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}
