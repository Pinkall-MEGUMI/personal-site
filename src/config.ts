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
   * TODO: 买到自己的域名后，把这一行改成 https://你的域名
   */
  domain: 'https://pinkallspace.3182095656.workers.dev',

  author: 'pinkallspace',
  /** TODO: 换成你常用的邮箱，会显示在「关于」页 */
  email: 'pinkall_megumi@example.com',
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
