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

## 还没做（按需再加）

- 评论（可用 giscus，免费，基于 GitHub Discussions）
- 图片上传 / 图床（Cloudflare R2）
- 访问统计（Cloudflare Web Analytics，免费无 Cookie）
- 英文化 / i18n
