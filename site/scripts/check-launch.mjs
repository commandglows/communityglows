import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative, join } from 'node:path'

const root = resolve('dist')
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
for (const [path, html] of pages) {
  const fail = message => failures.push(`${path}: ${message}`)
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail('expected exactly one H1')
  if (/github\.com\/dianedef\/CommunityGlows/i.test(html)) fail('obsolete GitHub destination')
  if (/Simulate submission/.test(html)) fail('simulated newsletter remains')
  if (/<form[^>]*data-newsletter-form/.test(html) && !/<form[^>]*action="\/api\/newsletter\/subscribe"[^>]*method="post"/.test(html)) fail('newsletter has no real same-origin submission')
  if (/href=["']#["']/.test(html)) fail('placeholder link')
  if (path.startsWith('/fr/') && !/<html[^>]*lang="fr"/.test(html)) fail('French page language mismatch')
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
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Launch route checks passed: ${pages.size} pages; headings, local links, anchors, locale alternates and retired placeholders.`)
