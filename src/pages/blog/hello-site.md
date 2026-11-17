---
layout: ../../layouts/Post.astro
title: 我用一周搭好了自己的网站
description: 从零到线上可访问的个人站点，实际动手只花了几个小时。
date: 2026-02-18
tags: [建站, Astro]
---

这篇文章记录我搭这个站点的过程。结论先说：**真正花时间的不是技术，是决定先做什么。**

## 为什么选 Astro

- 写 Markdown 就是写文章，不需要数据库、不需要后台
- 构建产物是纯静态 HTML，放哪儿都能跑，托管免费
- 想加接口时，加一个 `functions/` 目录就行，不用换平台

## 三个命令跑起来

```bash
npm install
npm run dev      # 本地 http://localhost:4321
npm run build    # 产物在 dist/
```

## 上线

推送到 GitHub，Cloudflare Pages 连上仓库，30 秒后就有链接了。
