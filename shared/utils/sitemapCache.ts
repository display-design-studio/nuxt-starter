interface ResolvedSitemapConfig {
  sitemapName: string
  isMultiSitemap: boolean
  sitemapsPathPrefix?: string | false
  sitemaps: Record<string, { _route?: string, route?: string }>
}

/** Consume the installed module's resolved metadata, never evaluate generated JavaScript. */
export function getSitemapCacheRouteRules(virtualConfig: string) {
  const prefix = 'export default '
  if (!virtualConfig.startsWith(prefix))
    throw new Error('Unsupported sitemap virtual configuration')
  const config = JSON.parse(virtualConfig.slice(prefix.length).trim().replace(/;$/, '')) as ResolvedSitemapConfig
  const routes = new Set([`/${config.sitemapName.replace(/^\/+/, '')}`])

  if (config.isMultiSitemap) {
    routes.add('/sitemap.xml')
    routes.add('/sitemap_index.xml')
    if (config.sitemapsPathPrefix && config.sitemapsPathPrefix !== '/')
      routes.add(`/${config.sitemapsPathPrefix.replace(/^\/+|\/+$/g, '')}/**`)
  }

  for (const sitemap of Object.values(config.sitemaps)) {
    const route = sitemap._route ?? sitemap.route
    if (route)
      routes.add(`/${route.replace(/^\/+/, '')}`)
  }

  return Object.fromEntries([...routes].map(route => [route, { isr: 86400 }]))
}
