---
layout: ../../layouts/Post.astro
title: 第 1 周：把站点跑起来
description: 装环境、写第一个页面、推到 GitHub、拿到公网链接。
date: 2026-02-15
tags: [周记, 建站]
---

## 学了什么

- Astro 的页面文件放在 `src/pages/`，文件路径就是 URL
- Markdown 文件加 `layout` 头信息，就能套统一模板
- `npm run build` 产出 `dist/`，是纯静态文件

## 卡在哪

一开始想直接上 Vue，配路由配了半天没出东西。后来发现这个站根本不需要前端框架——
内容站用静态生成器才是最短路径。

## 下次怎么改

- 每篇笔记固定三段：学了什么 / 卡在哪 / 下次怎么改
- 写完立刻 `git push`，不攒着
