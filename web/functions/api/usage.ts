import { proxyAnthropicUsage } from "../../src/lib/proxy-usage";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-claude-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  const token = request.headers.get("x-claude-token");
  if (!token) {
    return new Response(JSON.stringify({ error: "missing token" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const { status, body, contentType } = await proxyAnthropicUsage(token);
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "content-type": contentType },
  });
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}
