# personal-site

个人站点：博客 + 学习记录 + 标签 + 站内搜索 + RSS + 预留的 Agent 接口。
技术栈：**Astro（纯静态）+ Markdown**，托管在 **Cloudflare Pages**（免费，免服务器）。

```
npm install
npm run dev        # http://localhost:4321
```

## 上线前只需要改一个文件

`src/config.ts` —— 站名、作者、域名、GitHub、邮箱全在这里：

```ts
export const SITE = {
  name: 'pinkallspace',
  domain: 'https://pinkallspace.pages.dev',   // 买了域名后改成 https://你的域名
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
| 404 页 | `public/404.html` |
| 暗色/亮色主题（记忆选择） | 右上角 ◐ |
| 阅读时长 + 上一篇/下一篇 | 文章页底部 |
| Agent 页面与接口 | `/chat/` + `/api/chat` |

## 上线（Cloudflare Pages，免费）

1. 推到 GitHub：

```bash
git init
git add -A
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/personal-site.git
git push -u origin main
```

2. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git → 选仓库
   （**项目名填 `pinkallspace`**，这样地址就是 `pinkallspace.pages.dev`，和 `src/config.ts` 里的 `domain` 一致）
3. 构建设置：

| 项 | 值 |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |

4. Deploy。几十秒后得到 `https://xxx.pages.dev`
5. 绑自己的域名：Pages 项目 → Custom domains → 输入域名 → 按提示配 DNS

之后每次 `git push` 自动重新部署。`functions/` 目录会被自动识别成服务端接口。

## Agent 怎么接上（第二阶段）

`functions/api/chat.ts` 已经写好，是 `POST /api/chat`。Key 只在服务端，前端拿不到。

1. Pages 项目 → Settings → Variables and Secrets，添加（类型选 **Secret**）：

| 变量 | 说明 |
|---|---|
| `OPENAI_API_KEY` | 你的模型 Key（必填） |
| `OPENAI_BASE_URL` | 可选，如 `https://api.deepseek.com/v1` |
| `OPENAI_MODEL` | 可选，如 `deepseek-chat` |

2. 重新部署一次，打开 `/chat/` 就能对话。

本地调试接口：

```bash
npm run build
npm run agent:dev      # npx wrangler pages dev dist
```

以后要加"记忆"和"知识库"：D1 存对话（建表 SQL 见 `db/schema.sql`），Vectorize 做 RAG，KV 做限流。
全部还是同一个项目、同一个平台，不用买服务器。

**安全底线**：Key 只放 Cloudflare 环境变量里，永远不要写进前端代码或提交到仓库。

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
│  │  ├─ blog/               博客：*.md + index
│  │  └─ notes/              学习记录：*.md + index
│  ├─ components/PostList.astro   文章列表组件
│  ├─ layouts/               Base（全站外壳）/ Post（文章页）
│  ├─ lib/posts.ts           文章收集、标签、搜索索引、阅读时长
│  └─ styles/global.css      全站样式（含暗色主题、响应式）
├─ functions/api/chat.ts     Agent 接口（Key 在这里）
├─ db/schema.sql             D1 建表 SQL（第二阶段用）
├─ public/                   favicon、404.html
├─ astro.config.ts           读 config.ts 里的域名 + sitemap
└─ README.md
```

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 本地开发，热更新，`localhost:4321` |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 本地预览构建产物 |
| `npm run agent:dev` | 本地跑带接口的完整环境（wrangler） |

## 还没做（按需再加）

- 评论（可用 giscus，免费，基于 GitHub Discussions）
- 图片上传 / 图床（Cloudflare R2）
- 访问统计（Cloudflare Web Analytics，免费无 Cookie）
- 英文化 / i18n
