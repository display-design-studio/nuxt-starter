import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

// Run after a synthetic Netlify build. No requests leave this process.
const server = resolve('.netlify/functions-internal/server')
const { SanityClient } = await import(pathToFileURL(`${server}/node_modules/@sanity/client/dist/index.node.js`))
const originalFetch = SanityClient.prototype.fetch
let calls = 0
let draftTitle = 'Synthetic draft one'
process.env.NUXT_SANITY_VISUAL_EDITING_PREVIEW_MODE_ID = 'synthetic-preview-id'
SanityClient.prototype.fetch = async function (query, params, options) {
  calls++
  assert.equal(this.config().projectId, 'synthetic')
  if ((options?.perspective ?? this.config().perspective) === 'drafts') {
    assert.equal(options?.token ?? this.config().token, 'synthetic-preview-token')
    const result = { _id: 'synthetic-page', _type: 'page', title: draftTitle }
    return options?.filterResponse === false
      ? { result }
      : result
  }
  assert.equal(this.config().useCdn, false)
  assert.equal(this.config().perspective, 'published')
  assert.ok(!this.config().token)
  assert.equal(options.stega, false)
  if (query.includes('_type == "home"'))
    return { _id: 'synthetic-home', _type: 'home', title: 'Synthetic live home' }
  if (params.slug === 'missing')
    return null
  return { _id: 'synthetic-page', _type: 'page', title: 'Synthetic live page' }
}

try {
  const { default: handler } = await import(pathToFileURL(`${server}/main.mjs`))
  for (const [path, tag, marker] of [
    ['/', 'doc:synthetic-home,collection:home', 'Synthetic live home'],
    ['/about', 'doc:synthetic-page', 'Synthetic live page'],
    ['/api/sanity/home?lang=en', 'doc:synthetic-home,collection:home', 'Synthetic live home'],
    ['/api/sanity/page?lang=en&slug=about', 'doc:synthetic-page', 'Synthetic live page'],
  ]) {
    calls = 0
    const response = await handler(new Request(`https://example.test${path}`))
    const body = await response.text()
    assert.equal(response.status, 200, `Unexpected response for ${path}`)
    assert.equal(calls, 1, `${path}: expected exactly one Sanity fetch for the whole response`)
    assert.equal(response.headers.get('netlify-cache-tag'), tag)
    assert.equal(response.headers.get('cache-control'), 'public, max-age=0, must-revalidate')
    const policy = response.headers.get('netlify-cdn-cache-control')
    assert.match(policy, /max-age=31536000/)
    assert.match(policy, /must-revalidate/)
    assert.match(policy, /durable/)
    assert.doesNotMatch(policy, /stale-while-revalidate/)
    assert.ok(body.includes(marker))
    if (!path.startsWith('/api/')) {
      assert.equal(response.headers.get('netlify-vary'), 'cookie=sanity-preview-id')
      assert.ok(body.includes('__NUXT_DATA__'), 'SSR result must be included in the hydration payload')
    }
    console.log(`PASS ${path}: one Sanity fetch, shared dependencies and long-lived cache policy`)
  }
  for (const [path, status, expectedCalls] of [
    ['/api/sanity/page?slug=missing', 404, 1],
    ['/missing', 404, 1],
    ['/api/sanity/page?slug=nested%2Fpage', 400, 0],
  ]) {
    calls = 0
    const response = await handler(new Request(`https://example.test${path}`))
    await response.text()
    assert.equal(response.status, status)
    assert.equal(calls, expectedCalls)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('netlify-cdn-cache-control'), 'no-store')
    assert.equal(response.headers.get('netlify-cache-tag'), null)
    console.log(`PASS ${path}: ${status}, no-store and no dependency tags`)
  }

  for (const title of ['Synthetic draft one', 'Synthetic draft two']) {
    draftTitle = title
    calls = 0
    const response = await handler(new Request('https://example.test/about', {
      headers: { cookie: 'sanity-preview-id=synthetic-preview-id' },
    }))
    const body = await response.text()
    assert.equal(response.status, 200, 'Preview request failed')
    assert.ok(body.includes(title), 'Preview must render the current draft')
    assert.equal(calls, 1)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('netlify-cdn-cache-control'), 'no-store')
    assert.equal(response.headers.get('netlify-cache-tag'), null)
    console.log(`PASS preview: ${title}, draft client and no-store`)
  }

  for (const headers of [
    { accept: 'application/json' },
    { 'user-agent': 'curl/8' },
    { 'sec-fetch-mode': 'cors' },
  ]) {
    const response = await handler(new Request('https://example.test/missing', { headers }))
    await response.text()
    assert.equal(response.status, 404)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal(response.headers.get('netlify-cdn-cache-control'), 'no-store')
    console.log('PASS negotiated JSON page error: 404 and no-store')
  }

  calls = 0
  const published = await handler(new Request('https://example.test/about'))
  const publishedBody = await published.text()
  assert.equal(published.status, 200)
  assert.equal(calls, 1)
  assert.ok(publishedBody.includes('Synthetic live page'))
  assert.ok(!publishedBody.includes('Synthetic draft'))
  assert.equal(published.headers.get('netlify-cache-tag'), 'doc:synthetic-page')
  console.log('PASS public after preview: anonymous published client remains isolated')
}
finally {
  SanityClient.prototype.fetch = originalFetch
}
