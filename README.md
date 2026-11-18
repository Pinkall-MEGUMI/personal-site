# personal-site

个人站点：博客 + 学习记录 + 标签 + 站内搜索 + RSS + 预留的 Agent 接口。
技术栈：**Astro（纯静态构建）+ Markdown**，部署在 **Cloudflare Workers（Static Assets）**，免费、免服务器。

```
npm install
npm run dev        # http://localhost:4321
```

## 上线前只需要改一个文件

`src/config.ts` —— 站名、作者、域名、GitHub、邮箱全在这里：

```ts
export const SITE = {
  name: 'pinkallspace',
  domain: 'https://pinkallspace.com',        // ← 自定义域名，DNS 托管在 Cloudflare
  author: 'pinkallspace',
  email: 'pinkall_megumi@example.com',        // TODO 换成常用邮箱
  github: 'https://github.com/Pinkall-MEGUMI',
  ...
};
```

改完 `domain` 之后，sitemap、RSS 里的绝对链接、页面 canonical 全部自动正确。

## 写文章

| 想写什么 | 放哪里 |
|---|---|
| 博客文章 | `src/pages/blog/新文件名.md` |
| 学习记录 | `src/pages/notes/新文件名.md` |

文件名就是 URL：`src/pages/notes/git-basics.md` → `/notes/git-basics/`。

已有模板可直接复制：

- `src/pages/blog/_template.md`
- `src/pages/notes/_template.md`

> 以 `_` 开头的文件不会被发布，可以放心当模板放着。

文件头格式：

```md
---
layout: ../../layouts/Post.astro
title: 文章标题
description: 一句话摘要，会显示在列表和搜索结果里
date: 2026-02-18
tags: [建站, Astro]
---

正文用 Markdown 写。
```

列表页、首页、标签页、搜索索引、RSS **全部自动更新**，不需要改任何代码。

## 已实现的功能

| 功能 | 位置 |
|---|---|
| 首页（最新博客 + 最新笔记 + 标签云） | `/` |
| 博客 / 学习记录列表 | `/blog/` `/notes/` |
| 标签聚合 + 单个标签页 | `/tags/` `/tags/建站/` |
| 站内搜索（纯前端，无外部服务） | `/search/` |
| RSS 订阅 | `/rss.xml` |
| Sitemap | `/sitemap-index.xml` |
| robots.txt（自动带 sitemap 地址） | `/robots.txt` |
| 404 页 | `dist/404.html` |
| 暗色/亮色主题（记忆选择） | 右上角 ◐ |
| 阅读时长 + 上一篇/下一篇 | 文章页底部 |
| Agent 页面与接口 | `/chat/` + `POST /api/chat` |

## 部署（Cloudflare Workers + Static Assets）

### 架构：一个 Worker 同时管两件事

`worker/index.ts` 是唯一入口：

| 请求 | 处理 |
|---|---|
| `POST /api/chat` | 走模型接口，Key 从环境变量读 |
| 其他所有路径 | 交给静态资源（Astro 产出的 `dist/`） |

`wrangler.jsonc` 把两者接起来：

```jsonc
{
  "name": "pinkallspace",
  "main": "worker/index.ts",
  "assets": { "directory": "./dist", "binding": "ASSETS", "not_found_handling": "404-page" }
}
```

### 首次部署（Git 集成，控制台操作）

1. Cloudflare 控制台 → **Workers & Pages** → **Create application** → **Connect to Git**
2. 授权 GitHub，仓库选 `Pinkall-MEGUMI/personal-site`
3. 表单填：

| 字段 | 值 |
|---|---|
| Project name | `pinkallspace` ← 必须与 `wrangler.jsonc` 的 `name` 一致 |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy`（默认值，不用改） |
| Preview command | `npx wrangler preview`（保留默认即可） |
| Root directory | 留空 |
| 环境变量 | 首次不加 |

4. 点 **Deploy**。构建日志依次是：安装依赖 → `npm run build` → 18 页 → `wrangler deploy` → 上传 44 个静态文件 + Worker
5. 拿到网址：`https://pinkallspace.<你的子域>.workers.dev`

### 之后每次更新

```bash
git add -A
git commit -m "新增：xxx"
git push
```

Cloudflare 自动重新构建部署，1~2 分钟生效。

## Agent 怎么接上（第二阶段）

接口已经写好，`POST /api/chat`，Key 只在服务端。打开：Workers & Pages → `pinkallspace` → **Settings** → **Variables and Secrets**，添加（类型选 **Secret**）：

| 变量 | 说明 |
|---|---|
| `OPENAI_API_KEY` | 你的模型 Key（必填） |
| `OPENAI_BASE_URL` | 可选，如 `https://api.deepseek.com/v1` |
| `OPENAI_MODEL` | 可选，如 `deepseek-chat` |

保存后 **必须重新部署一次**（Settings 里点 Deploy 或 push 一次空提交），然后打开 `/chat/` 就能对话。

本地调试（会起本地 Worker 运行时，静态资源 + 接口都能测）：

```bash
npm run build
npm run agent:dev      # wrangler dev
```

以后加"记忆"和"知识库"：D1 存对话（建表 SQL 见 `db/schema.sql`），Vectorize 做 RAG，KV 做限流。全部同一个 Worker，不用买服务器。

**安全底线**：Key 只放 Cloudflare 的 Secret 里，永远不要写进前端代码或提交到仓库。

## 目录结构

```
personal-site/
├─ src/
│  ├─ config.ts              ← 全站配置（站名/域名/导航）
│  ├─ pages/
│  │  ├─ index.astro         首页
│  │  ├─ about.astro         关于我
│  │  ├─ search.astro        站内搜索
│  │  ├─ chat.astro          Agent 页面
│  │  ├─ rss.xml.ts          RSS
│  │  ├─ robots.txt.ts       robots
│  │  ├─ search.json.ts      搜索索引
│  │  ├─ tags/               标签聚合 + [tag] 动态页
│  │  ├─ blog/               博客：*.md + index + _template
│  │  └─ notes/              学习记录：*.md + index + _template
│  ├─ components/PostList.astro   文章列表组件
│  ├─ layouts/               Base（全站外壳）/ Post（文章页）
│  ├─ lib/posts.ts           文章收集、标签、搜索索引、阅读时长
│  └─ styles/global.css      全站样式（含暗色主题、响应式）
├─ worker/index.ts           Worker 入口：/api/chat + 静态资源分发
├─ wrangler.jsonc            Worker 名、静态资源目录、404 策略
├─ db/schema.sql             D1 建表 SQL（第二阶段用）
├─ public/                   favicon、404.html
├─ astro.config.ts           读 config.ts 里的域名 + sitemap
└─ README.md
```

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 本地开发，热更新，`localhost:4321` |
| `npm run build` | 构建静态产物到 `dist/` |
| `npm run preview` | 本地预览构建产物（不含接口） |
| `npm run agent:dev` | 本地跑完整 Worker（静态资源 + /api/chat） |
| `npm run deploy` | 手动部署（一般用不到，push 会自动部署） |
| `npm run verify` | **上线后自检**：路由、canonical、RSS、robots、sitemap、接口、404 |

## 上线后自检

每次改完配置或大改内容，推完等 1~2 分钟后跑一次：

```bash
npm run verify
```

它会逐项检查线上的真实状态（`全部通过 ✅` / `N 项失败 ❌`），比肉眼点页面可靠。
换检查目标：`SITE_URL=http://localhost:4321 npm run verify`（本地也能用）。

> 首次部署后记得去 **SSL/TLS → Edge Certificates → Always Use HTTPS** 打开，
> 否则 `http://` 访问不会自动跳到 `https://`，`npm run verify` 会提示这一项失败。

## 安全与防爬虫（全部免费）

### 已在代码里自动生效

| 措施 | 位置 | 作用 |
|---|---|---|
| 安全响应头（CSP / HSTS / X-Frame-Options / nosniff / Referrer-Policy / COOP·CORP / Permissions-Policy） | `public/_headers` | 防点击劫持、防 MIME 嗅探、限制外部资源加载 |
| 静态资源不可变缓存 | `public/_headers`（`/_astro/*`） | 性能 + 减少重复抓取 |
| 接口响应头 + `no-store` | `worker/index.ts` | 接口不被缓存、不被当 HTML 解析 |
| 强制 HTTPS | Zone 设置 `Always Use HTTPS` + Worker 兜底 | 明文请求 301 |
| `security.txt` | `public/.well-known/security.txt` | 漏洞报告渠道 |
| Agents 密钥只存服务端 | Cloudflare Secret | 永不出现在前端 |
| 无任何第三方脚本 / 字体 / 统计 | 全局 | 没有供应链注入口 |

### 需要你在控制台点（一次性，2 分钟）

| 开关 | 位置 | 建议 |
|---|---|---|
| **Bot Fight Mode** | Security → Bots | 开（若发现 RSS 阅读器被拦再关） |
| **Email Address Obfuscation** | Scrape Shield | **开**（把页面里的邮箱转成乱码，防爬） |
| **Security Level** | Security → Settings | Medium 或 High |
| **Rate limiting rule** | Security → WAF → Rate limiting | 对 `/api/chat`：10 次/分钟/IP（Agent 上线后再开） |
| **Block AI bots**（可选） | Security → Bots | 不想被 AI 抓取就开 |
| **2FA** | 账号设置 | GitHub 和 Cloudflare 都开 —— **真正的"防黑"第一道** |

### 依赖审计

`npm audit` 目前剩 12 条（1 critical / 10 high / 1 low），全部在**构建期依赖链**（astro / vite / esbuild / sharp / zod），
且**在纯静态站里不可达**：本仓库不用图片优化、不渲染用户输入、不跑 SSR。

彻底消除需要把 Astro 5 升到 7（大版本、有破坏性变更），属于独立任务。

## 还没做（按需再加）

- 评论（可用 giscus，免费，基于 GitHub Discussions）
- 图片上传 / 图床（Cloudflare R2）
- 访问统计（Cloudflare Web Analytics，免费无 Cookie）
- 英文化 / i18n
