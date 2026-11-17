import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { SITE } from '../config';
import { getAllPosts } from '../lib/posts';

// 构建期生成 /rss.xml，博客和学习记录都进同一个订阅源
export const GET: APIRoute = (context) => {
  const posts = getAllPosts();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.domain,
    items: posts.map((p) => ({
      title: p.title,
      pubDate: new Date(p.date || '1970-01-01'),
      description: p.description,
      link: p.url,
      categories: p.tags,
    })),
    customData: '<language>zh-cn</language>',
  });
};
