import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'bun:test'
import { evaluate, parse } from 'groq-js'

describe('documented signed webhook projection', () => {
  test('classifies actual delta values and preserves identity on unpublish', async () => {
    const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8')
    const projection = readme.match(/<!-- webhook-projection:start -->\s*```groq\n([\s\S]*?)\n```/)?.[1]
    expect(projection).toBeDefined()
    const tree = parse(projection!, { mode: 'delta' })
    const page = { _id: 'A', _type: 'page', slug: { en: { current: 'about' } }, title: 'Old' }
    const cases = [
      { before: page, after: { ...page, title: 'New' }, operation: 'update', collectionChanged: false },
      { before: page, after: { ...page, slug: { en: { current: 'new-slug' } } }, operation: 'update', collectionChanged: true },
      { before: null, after: page, operation: 'create', collectionChanged: true },
      { before: page, after: null, operation: 'delete', collectionChanged: true },
    ]
    for (const fixture of cases) {
      const value = await evaluate(tree, { root: fixture.after ?? fixture.before, before: fixture.before, after: fixture.after })
      expect(await value.get()).toEqual({ _id: 'A', _type: 'page', operation: fixture.operation, collectionChanged: fixture.collectionChanged })
    }

    const other = { ...page, _type: 'article' }
    const value = await evaluate(tree, { root: other, before: other, after: { ...other, title: 'New' } })
    expect(await value.get()).toMatchObject({ operation: 'update', collectionChanged: true })
  })
})
