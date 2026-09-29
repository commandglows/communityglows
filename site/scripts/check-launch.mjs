import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative, join } from 'node:path'

const root = resolve('dist')
const siteOrigin = (process.env.PUBLIC_SITE_URL ?? 'https://communityglows.com').replace(/\/+$/, '')
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name)))).flat()
}
const files = await walk(root)
const pages = new Map()
for (const file of files.filter(f => f.endsWith('.html'))) {
  const path = '/' + relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '').replace(/\/$/, '')
  pages.set(path || '/', await readFile(file, 'utf8'))
}
const failures = []
const normalize = path => decodeURI(path).replace(/\/$/, '') || '/'
const canonicalUrls = new Set()
const expectedSitemap = new Set()
for (const [path, html] of pages) {
  const fail = message => failures.push(`${path}: ${message}`)
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail('expected exactly one H1')
  if (/github\.com\/dianedef\/CommunityGlows/i.test(html)) fail('obsolete GitHub destination')
  if (/Simulate submission/.test(html)) fail('simulated newsletter remains')
  if (/<form[^>]*data-newsletter-form/.test(html) && !/<form[^>]*action="\/api\/newsletter\/subscribe"[^>]*method="post"/.test(html)) fail('newsletter has no real same-origin submission')
  if (/href=["']#["']/.test(html)) fail('placeholder link')
  if (path.startsWith('/fr/') && !/<html[^>]*lang="fr"/.test(html)) fail('French page language mismatch')
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]
  if (!canonical) fail('missing canonical URL')
  else {
    const url = new URL(canonical)
    if (url.origin !== siteOrigin) fail(`canonical origin mismatch: ${url.origin}`)
    if (canonicalUrls.has(url.href)) fail(`duplicate canonical URL: ${url.href}`)
    canonicalUrls.add(url.href)
    if (!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) expectedSitemap.add(url.href)
  }
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue
    const url = new URL(href.replaceAll('&amp;', '&'), 'https://communityglows.com')
    const target = normalize(url.pathname)
    if (pages.has(target)) {
      if (url.hash && !pages.get(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) fail(`missing anchor ${href}`)
    } else if (!files.includes(resolve(root, '.' + url.pathname))) fail(`missing internal destination ${href}`)
  }
  for (const [, lang, href] of html.matchAll(/<link[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g)) {
    const target = normalize(new URL(href).pathname)
    if (!pages.has(target)) fail(`missing ${lang} alternate ${target}`)
    else if (lang !== 'x-default' && !pages.get(target).includes(`lang="${lang}"`)) fail(`wrong language for ${target}`)
  }
}

const robotsPath = resolve(root, 'robots.txt')
if (!files.includes(robotsPath)) failures.push('/robots.txt: missing generated file')
else {
  const robots = await readFile(robotsPath, 'utf8')
  if (!/^User-agent:\s*\*\s*$/m.test(robots)) failures.push('/robots.txt: missing wildcard crawler policy')
  if (!robots.includes(`Sitemap: ${new URL('/sitemap.xml', siteOrigin).href}`)) failures.push('/robots.txt: missing canonical sitemap declaration')
}

const sitemapPath = resolve(root, 'sitemap.xml')
if (!files.includes(sitemapPath)) failures.push('/sitemap.xml: missing generated file')
else {
  const sitemap = await readFile(sitemapPath, 'utf8')
  const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url.replaceAll('&amp;', '&')))
  if (!sitemap.includes('<urlset')) failures.push('/sitemap.xml: invalid urlset document')
  for (const url of expectedSitemap) if (!sitemapUrls.has(url)) failures.push(`/sitemap.xml: missing indexable canonical ${url}`)
  for (const url of sitemapUrls) if (!expectedSitemap.has(url)) failures.push(`/sitemap.xml: unexpected or non-indexable URL ${url}`)
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Launch route checks passed: ${pages.size} pages; headings, local links, anchors, locale alternates and retired placeholders.`)
