import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const output = resolve('dist')
const siteOrigin = (process.env.PUBLIC_SITE_URL ?? 'https://communityglows.com').replace(/\/+$/, '')

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : path
  }))).flat()
}

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

const pages = await walk(output)
const urls = new Set()

for (const file of pages.filter(path => path.endsWith('.html'))) {
  const html = await readFile(file, 'utf8')
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue

  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]
  if (!canonical) throw new Error(`Missing canonical URL in ${relative(output, file)}`)

  const url = new URL(canonical)
  if (url.origin !== siteOrigin) {
    throw new Error(`Canonical URL uses ${url.origin}; expected ${siteOrigin} in ${relative(output, file)}`)
  }
  urls.add(url.href)
}

if (urls.size === 0) throw new Error('No indexable canonical pages found for sitemap')

const body = [...urls].sort().map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
await writeFile(join(output, 'sitemap.xml'), xml, 'utf8')
console.log(`Generated sitemap.xml with ${urls.size} canonical indexable URLs.`)
