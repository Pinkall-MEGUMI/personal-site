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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/chat') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
      if (request.method !== 'POST') return json({ error: '只支持 POST' }, 405);
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
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
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
