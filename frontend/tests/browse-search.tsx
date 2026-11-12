import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import React from 'react'

const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost:5173' })
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'navigator']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true })
}
globalThis.React = React
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { render, screen, fireEvent, act } = await import('@testing-library/react')
const { MemoryRouter } = await import('react-router-dom')
const { default: BrowsePage } = await import('../src/pages/BrowsePage.jsx')
const requests = []
const originalFetch = globalThis.fetch
const json = (data, status = 200) => new Response(JSON.stringify(data), { status })
globalThis.fetch = input => {
  const url = new URL(input)
  if (url.pathname !== '/api/projects/') return Promise.resolve(json([]))
  return new Promise((resolve, reject) => requests.push({ url, resolve, reject }))
}

const last = () => requests.at(-1)
const reply = (request, data, status = 200) => act(async () => request.resolve(json(data, status)))
const query = value => fireEvent.change(screen.getByPlaceholderText('Search by keyword...'), { target: { value } })
const oak = { id: 1, title: 'Oak Studio', budget_min: 20000 }
const birch = { id: 2, title: 'Birch Studio', budget_min: 30000 }
const pageOf = (...results) => ({ results, total: 14, total_pages: 2 })

let view
try {
  await act(async () => { view = render(<MemoryRouter><BrowsePage /></MemoryRouter>) })
  await reply(last(), { results: [], total: 0, total_pages: 0 })
  assert.match(screen.getByRole('status').textContent, /No projects match/)
  assert.equal(screen.queryByRole('alert'), null)

  query('Studio')
  fireEvent.change(screen.getByRole('option', { name: 'All Budgets' }).closest('select'), {
    target: { value: '20k-40k' },
  })
  assert.equal(last().url.searchParams.get('budget_min'), '20000')
  assert.equal(last().url.searchParams.get('budget_max'), '40000')
  await reply(last(), pageOf(oak))

  fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  const failed = last()
  assert.equal(failed.url.searchParams.get('search'), 'Studio')
  assert.equal(failed.url.searchParams.get('page'), '2')
  await reply(failed, { detail: 'Unavailable' }, 503)
  assert.match(screen.getByRole('alert').textContent, /Could not load projects/)
  assert.equal(screen.queryByText('No projects match your search.'), null)
  assert.equal(screen.queryByRole('link', { name: oak.title }), null)

  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  assert.equal(last().url.href, failed.url.href, 'Retry keeps filters and the page')
  assert.match(screen.getByRole('status').textContent, /Loading projects/)
  await reply(last(), pageOf(birch))
  assert.ok(screen.getByRole('link', { name: birch.title }))
  assert.equal(screen.queryByRole('alert'), null)

  query('old')
  const old = last()
  query('Birch')
  await reply(last(), pageOf(birch))
  await act(async () => old.reject(new Error('Older request failed')))
  assert.ok(screen.getByRole('link', { name: birch.title }))
  assert.equal(screen.queryByRole('alert'), null, 'An older failure cannot replace current results')
  console.log('PASS: successful empty results, request failure, same-page retry, and stale response handling')
} finally {
  view?.unmount()
  globalThis.fetch = originalFetch
  dom.window.close()
}
