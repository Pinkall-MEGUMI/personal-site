// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE } from './src/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // 域名只在 src/config.ts 里改一次，这里自动读取
  site: SITE.domain,
  output: 'static', // 纯静态产物；需要后端时用 functions/ 目录加接口
  build: {
    format: 'directory', // 生成 /blog/hello-site/ 这种目录结构，URL 更干净
  },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
