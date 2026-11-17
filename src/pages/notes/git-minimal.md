---
layout: ../../layouts/Post.astro
title: Git 最小可用命令（够用版）
description: 只记 6 条命令，覆盖日常 95% 的场景。
date: 2026-02-16
tags: [Git, 基础]
---

## 六条命令

```bash
git init                     # 目录变成仓库（只做一次）
git add -A                   # 把改动加进暂存区
git commit -m "说明"         # 存一个快照
git remote add origin <url>  # 关联远端（只做一次）
git push                     # 推到 GitHub
git status                   # 我现在到底改了啥
```

## 两个高频问题

**推不上去，提示 rejected**：远端有你没有的提交，先 `git pull --rebase` 再 push。

**改错了想撤回**：`git restore <文件>` 丢弃未提交改动；已经 commit 了用 `git revert`。

## 一个习惯

一个功能一次 commit，说明写"做了什么"而不是"改了文件"。
以后回头看历史才知道当时在想什么。
