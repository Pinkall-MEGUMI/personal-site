/**
 * 文章收集与索引。
 * 新增文章 = 在 src/pages/blog/ 或 src/pages/notes/ 里加一个 .md 文件，无需改代码。
 * 以 _ 开头的文件（如 _template.md）不会被收录。
 */

export type Section = 'blog' | 'notes';

export interface PostMeta {
  url: string;
  slug: string;
  section: Section;
  title: string;
  description: string;
  date: string;
  tags: string[];
  /** 预估阅读时间（分钟） */
  minutes: number;
}

export interface TagInfo {
  tag: string;
  slug: string;
  count: number;
}

export interface SearchItem {
  url: string;
  title: string;
  description: string;
  section: Section;
  date: string;
  tags: string[];
  text: string;
}

/** Astro 解析过的 Markdown 模块（拿 frontmatter 和正文） */
const MODULES = import.meta.glob<any>('../pages/{blog,notes}/*.md', { eager: true });
/** 原始 Markdown 文本（算阅读时长、做搜索索引） */
const RAW = import.meta.glob('../pages/{blog,notes}/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** YAML 里的 `date: 2026-02-18` 会被解析成 Date，这里统一成 YYYY-MM-DD */
export function toISODate(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** 标签转 URL 片段：空格换连字符，中文原样保留 */
export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, '-');
}

function isPostPath(path: string): boolean {
  const file = path.split('/').pop() ?? '';
  return !file.startsWith('_');
}

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function plainText(md: string): string {
  return stripFrontmatter(md)
    .replace(/```[\s\S]*?```/g, ' ') // 代码块
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/<[^>]+>/g, ' ') // HTML
    .replace(/^[>#\-*\s|]+/gm, ' ') // 引用/标题/列表/表格符号
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readingMinutes(text: string): number {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

function buildAll(): PostMeta[] {
  return Object.entries(MODULES)
    .filter(([path]) => isPostPath(path))
    .map(([path, mod]) => {
      const fm = (mod && mod.frontmatter) || {};
      const bare = path.replace(/\.md$/, '');
      const parts = bare.split('/');
      const slug = parts.pop() as string;
      const section = (parts.pop() as Section) ?? 'blog';
      const raw = RAW[path] ?? '';
      const body = stripFrontmatter(raw);
      const tags: string[] = Array.isArray(fm.tags)
        ? fm.tags.map((t: unknown) => String(t))
        : fm.tag
          ? [String(fm.tag)]
          : [];
      return {
        url: `/${section}/${slug}/`,
        slug,
        section,
        title: fm.title ?? slug,
        description: fm.description ?? '',
        date: toISODate(fm.date),
        tags,
        minutes: readingMinutes(body),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
}

let cache: PostMeta[] | null = null;
function all(): PostMeta[] {
  if (!cache) cache = buildAll();
  return cache;
}

export function getAllPosts(): PostMeta[] {
  return all();
}

export function getPosts(section: Section): PostMeta[] {
  return all().filter((p) => p.section === section);
}

export function getTags(): TagInfo[] {
  const map = new Map<string, number>();
  for (const p of all()) for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTagSlug(slug: string): PostMeta[] {
  return all().filter((p) => p.tags.some((t) => tagSlug(t) === slug));
}

export function getSearchIndex(): SearchItem[] {
  return all().map((p) => {
    const path = Object.keys(MODULES).find((k) => k.endsWith(`/${p.section}/${p.slug}.md`));
    const text = path ? plainText(RAW[path] ?? '').slice(0, 4000) : p.description;
    return {
      url: p.url,
      title: p.title,
      description: p.description,
      section: p.section,
      date: p.date,
      tags: p.tags,
      text,
    };
  });
}
