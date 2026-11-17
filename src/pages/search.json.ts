import type { APIRoute } from 'astro';
import { getSearchIndex } from '../lib/posts';

// 构建期生成 /search.json，供 /search/ 页面做纯前端搜索
export const GET: APIRoute = () =>
  new Response(JSON.stringify(getSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
