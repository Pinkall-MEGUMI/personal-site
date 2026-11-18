/**
 * 全站唯一配置：想改站名、域名、联系方式，只改这个文件。
 */
export const SITE = {
  /** 站点名，显示在左上角、标题、RSS 里 */
  name: 'pinkallspace',
  /** 站点副标题 */
  title: 'pinkallspace · 博客与学习记录',
  description: 'pinkallspace 的个人博客与学习记录，以及一个属于我自己的 Agent',

  /**
   * 站点地址：sitemap、RSS 绝对链接、页面 canonical 都依赖它。
   * 已绑定自定义域名 pinkallspace.com（阿里云注册，DNS 托管在 Cloudflare）。
   */
  domain: 'https://pinkallspace.com',

  author: 'pinkallspace',
  email: '3182095656@qq.com',
  github: 'https://github.com/Pinkall-MEGUMI',

  nav: [
    { href: '/blog/', label: '博客' },
    { href: '/notes/', label: '学习记录' },
    { href: '/tags/', label: '标签' },
    { href: '/search/', label: '搜索' },
    { href: '/about/', label: '关于' },
    { href: '/chat/', label: 'Agent' },
  ],
} as const;
