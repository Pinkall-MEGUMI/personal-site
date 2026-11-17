// Cloudflare Pages Functions：文件路径自动映射成路由
// functions/api/chat.ts  ->  POST /api/chat
// 关键点：API Key 只存在于服务端环境变量里，永远不会进入前端代码。
// @ts-nocheck

export async function onRequestPost(context) {
  const { env, request } = context;

  let message = '';
  try {
    const body = await request.json();
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
        hint: '在 Cloudflare 控制台 → Workers & Pages → 你的项目 → Settings → Variables 添加并重新部署',
      },
      500
    );
  }

  const base = env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = env.OPENAI_MODEL ?? 'gpt-4o-mini';

  // 这里就是你的 agent 未来的"系统提示词"入口
  const system =
    '你是我的个人站点助手。回答简洁、用中文，不确定时直接说不知道。';

  const upstream = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return json({ error: '上游模型调用失败', status: upstream.status, detail: text.slice(0, 500) }, 502);
  }

  const data = await upstream.json();
  const reply = data?.choices?.[0]?.message?.content ?? '（模型没有返回内容）';
  return json({ reply });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
