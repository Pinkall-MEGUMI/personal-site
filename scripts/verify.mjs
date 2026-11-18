/**
 * 上线后自检：npm run verify
 * 检查线上每个路由的状态码、canonical、RSS、robots、sitemap、Agent 接口、404 页。
 * 任何一项不通过会以非 0 退出码结束，方便以后接 CI。
 */

const BASE = process.env.SITE_URL ?? 'https://pinkallspace.com';

const PATHS = [
  '/', '/blog/', '/notes/', '/tags/', '/search/', '/about/', '/chat/',
  '/rss.xml', '/sitemap-index.xml', '/robots.txt', '/search.json',
  '/tags/agent/', '/blog/from-jd-to-6-tools/', '/tags/langgraph/',
  '/.well-known/security.txt',
];

let failed = 0;
const fail = (msg) => { failed++; console.log(`  ✗ ${msg}`); };
const ok = (msg) => console.log(`  ✓ ${msg}`);

console.log(`自检目标: ${BASE}\n`);

console.log('路由状态');
for (const p of PATHS) {
  try {
    const r = await fetch(BASE + encodeURI(p), { redirect: 'follow' });
    if (r.status === 200) ok(`${p} — 200`);
    else fail(`${p} — ${r.status}`);
    await r.arrayBuffer();
  } catch (e) {
    fail(`${p} — ${e.message} ${e.cause?.code ?? ''}`);
  }
}

console.log('\n内容');
try {
  const home = await (await fetch(BASE + '/')).text();
  const canonical = home.match(/rel="canonical" href="([^"]+)"/)?.[1];
  if (home.includes('pinkallspace')) ok('首页含站名');
  else fail('首页没有站名');
  if (canonical === BASE + '/') ok(`canonical — ${canonical}`);
  else fail(`canonical 不对 — ${canonical}`);

  const rss = await (await fetch(BASE + '/rss.xml')).text();
  if (rss.includes(`<link>${BASE}/`)) ok(`RSS 绝对链接正确（${(rss.match(/<item>/g) ?? []).length} 条）`);
  else fail('RSS 里的链接不对');

  const robots = await (await fetch(BASE + '/robots.txt')).text();
  if (robots.includes(`Sitemap: ${BASE}/sitemap-index.xml`)) ok('robots.txt 指向正确 sitemap');
  else fail('robots.txt 的 sitemap 地址不对');

  const sj = await (await fetch(BASE + '/search.json')).json();
  if (sj.length > 0) ok(`搜索索引 ${sj.length} 条`);
  else fail('搜索索引为空');

  const sitemap = await (await fetch(BASE + '/sitemap-index.xml')).text();
  if (sitemap.includes(BASE)) ok('sitemap 引用域名正确');
  else fail('sitemap 域名不对');
} catch (e) {
  fail(`内容检查异常 — ${e.message}`);
}

console.log('\n接口与安全');
try {
  const api = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'ping' }),
  });
  const body = await api.text();
  if (api.status === 200) ok('Agent 已配置 Key，可正常对话');
  else if (body.includes('OPENAI_API_KEY')) ok('Agent 接口已通（尚未配置 Key，属预期）');
  else fail(`Agent 接口异常 — ${api.status} ${body.slice(0, 120)}`);
} catch (e) {
  fail(`Agent 接口请求失败 — ${e.message}`);
}

try {
  const r = await fetch('http://pinkallspace.com/', { redirect: 'manual' });
  if (r.status >= 300 && r.status < 400) ok(`HTTP 自动跳转 HTTPS（${r.status}）`);
  else fail(`HTTP 没有跳转 HTTPS（${r.status}）— 去 SSL/TLS → Edge Certificates 打开 Always Use HTTPS`);
} catch (e) {
  fail(`HTTP 跳转检查失败 — ${e.message}`);
}

try {
  const r = await fetch(BASE + '/this-page-does-not-exist/', { redirect: 'follow' });
  const body = await r.text();
  if (r.status === 404 && body.includes('404')) ok('404 页正常');
  else fail(`404 页异常 — ${r.status}`);
} catch (e) {
  fail(`404 检查失败 — ${e.message}`);
}

console.log('\n安全响应头');
try {
  const r = await fetch(BASE + '/');
  const need = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'strict-transport-security': null,
    'content-security-policy': null,
    'cross-origin-opener-policy': 'same-origin',
  };
  for (const [name, expected] of Object.entries(need)) {
    const got = r.headers.get(name);
    if (got && (expected === null || got.toLowerCase().includes(expected.toLowerCase()))) ok(`${name}: ${got.slice(0, 60)}`);
    else fail(`${name} 缺失或不正确 — ${got ?? 'null'}`);
  }
  await r.arrayBuffer();

  const api = await fetch(BASE + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  if (api.headers.get('x-content-type-options') === 'nosniff') ok('接口响应带 nosniff');
  else fail('接口响应缺少 nosniff');
  await api.arrayBuffer();

  const hdrFile = await fetch(BASE + '/_headers');
  if (hdrFile.status === 404) ok('_headers 文件本身不对外暴露');
  else fail(`_headers 被当作静态文件返回了（${hdrFile.status}）`);
  await hdrFile.arrayBuffer();
} catch (e) {
  fail(`安全头检查异常 — ${e.message}`);
}

console.log(`\n${failed === 0 ? '全部通过 ✅' : `${failed} 项失败 ❌`}`);
process.exit(failed === 0 ? 0 : 1);
