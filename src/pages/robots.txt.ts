import type { APIRoute } from 'astro';
import { SITE } from '../config';

// 构建期生成 /robots.txt，sitemap 地址由 SITE.domain 自动拼出
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${SITE.domain}/sitemap-index.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
