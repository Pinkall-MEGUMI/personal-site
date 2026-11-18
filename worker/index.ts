/**
 * Cloudflare Worker 入口。
 *
 * - POST /api/chat → 调用模型接口（API Key 只存在于服务端环境变量，永不进前端）
 * - 其他所有请求   → 交给静态资源（Astro 构建产物 dist/）
 *
 * 这里的 Key 在 Cloudflare 控制台设置：
 *   Workers & Pages → pinkallspace → Settings → Variables and Secrets
 *   OPENAI_API_KEY（Secret）/ OPENAI_BASE_URL（可选）/ OPENAI_MODEL（可选）
 */

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  OPENAI_MODEL?: string;
}

const SYSTEM_PROMPT =
  '你是 pinkallspace 个人站点的助手。回答简洁、用中文，不确定时直接说不知道，不要编造。';

/**
 * 安全响应头。静态资源由 public/_headers 控制；
 * 这里用于 Worker 自己生成的响应（接口、404 兜底页）。
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 强制 HTTPS：http 请求一律 301 到 https。
    // Cloudflare 可能把 request.url 统一成 https，所以同时看 X-Forwarded-Proto。
    const proto = (request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '')).toLowerCase();
    if (proto === 'http') {
      const secure = new URL(url.toString());
      secure.protocol = 'https:';
      return Response.redirect(secure.toString(), 301);
    }

    if (url.pathname === '/api/chat') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
      if (request.method !== 'POST') return json({ error: '只支持 POST' }, 405);
      return handleChat(request, env);
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};

async function handleChat(request: Request, env: Env): Promise<Response> {
  let message = '';
  try {
    const body = (await request.json()) as { message?: unknown };
    message = String(body.message ?? '').slice(0, 4000);
  } catch {
    return json({ error: '请求体必须是 JSON' }, 400);
  }
  if (!message) return json({ error: 'message 不能为空' }, 400);

  const key = env.OPENAI_API_KEY;
  if (!key) {
    return json(
      {
        error: '未配置 OPENAI_API_KEY',
        hint: '在 Cloudflare 控制台 → Workers & Pages → pinkallspace → Settings → Variables and Secrets 添加，然后重新部署',
      },
      500,
    );
  }

  const base = (env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = env.OPENAI_MODEL ?? 'gpt-4o-mini';

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        temperature: 0.3,
      }),
    });
  } catch (e) {
    return json({ error: '无法连接模型接口', detail: String(e) }, 502);
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return json(
      { error: '上游模型调用失败', status: upstream.status, detail: text.slice(0, 500) },
      502,
    );
  }

  const data = (await upstream.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content ?? '（模型没有返回内容）';
  return json({ reply });
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
