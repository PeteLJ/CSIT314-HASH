import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import React from 'react'

const dom = new JSDOM('<html><body></body></html>', { url: 'http://localhost:5173' })
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'localStorage']) {
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true })
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.React = React
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { render, screen, fireEvent, act, within } = await import('@testing-library/react')
const { MemoryRouter } = await import('react-router-dom')
const { default: InterestDashboard } = await import('../src/pages/InterestDashboard.jsx')
const requests = []
const originalFetch = globalThis.fetch
const originalSetTimeout = globalThis.setTimeout
const originalClearTimeout = globalThis.clearTimeout
const polls = new Map()
let timerId = -1

// Control network completion and polling independently to exercise request races.
globalThis.fetch = url => new Promise((resolve, reject) => {
  requests.push({ url: new URL(url), resolve, reject })
})
globalThis.setTimeout = (callback, delay, ...args) => {
  if (delay !== 5000) return originalSetTimeout(callback, delay, ...args)
  const id = timerId--
  polls.set(id, callback)
  return id
}
globalThis.clearTimeout = id => {
  if (!polls.delete(id)) originalClearTimeout(id)
}

const project = { id: 10, title: 'Modern living room', style: 'Modern', status: 'PUBLISHED', view_count: 12, shortlist_count: 2 }
const active = { total_views: 12, total_shortlists: 2, project_count: 1, projects: [project] }
const zero = { total_views: 0, total_shortlists: 0, project_count: 1, projects: [{ ...project, view_count: 0, shortlist_count: 0 }] }
const empty = { total_views: 0, total_shortlists: 0, project_count: 0, projects: [] }
const lastRequest = () => requests.at(-1)
const respond = async (request, data, status = 200) => {
  await act(async () => request.resolve(new Response(JSON.stringify(data), { status })))
}
const choosePeriod = value => fireEvent.change(screen.getByLabelText('Reporting period:'), { target: { value } })
const chooseDesigner = id => {
  localStorage.setItem('designer_id', id)
  act(() => window.dispatchEvent(new dom.window.CustomEvent('designerChanged', { detail: id })))
}
const metric = label => screen.getByText(label).previousElementSibling.textContent

let view
try {
  localStorage.clear()
  view = render(<MemoryRouter><InterestDashboard /></MemoryRouter>)
  assert.match(screen.getByRole('status').textContent, /Select an interior designer/)
  assert.equal(requests.length, 0, 'Never silently show another designer before selection')

  chooseDesigner('1')
  assert.equal(lastRequest().url.searchParams.get('designer_id'), '1')
  assert.equal(lastRequest().url.searchParams.get('period'), 'all')
  await respond(lastRequest(), active)
  assert.equal(metric('Total Views'), '12')
  assert.equal(metric('Total Shortlists'), '2')

  choosePeriod('7d')
  assert.equal(lastRequest().url.searchParams.get('period'), '7d')
  assert.ok(screen.queryByText('Loading portfolio data...'))
  assert.equal(screen.queryByRole('table'), null, 'Previous period is hidden while loading')
  await respond(lastRequest(), zero)
  assert.equal(metric('Total Views'), '0')
  assert.equal(metric('Total Shortlists'), '0')
  assert.match(screen.getByRole('status').textContent, /No interest recorded/)
  assert.equal(screen.queryByText('No projects available'), null)
  const row = screen.getByRole('link', { name: project.title }).closest('tr')
  assert.deepEqual(within(row).getAllByRole('cell').slice(-2).map(cell => cell.textContent), ['0', '0'])

  // A slower old-period response must not overwrite the latest period.
  choosePeriod('30d')
  const oldPeriod = lastRequest()
  choosePeriod('90d')
  const currentPeriod = lastRequest()
  await respond(currentPeriod, active)
  await respond(oldPeriod, zero)
  assert.equal(metric('Total Views'), '12')
  assert.equal(screen.getByLabelText('Reporting period:').value, '90d')

  // A slower old-designer response must not overwrite the selected designer.
  choosePeriod('all')
  const oldDesigner = lastRequest()
  chooseDesigner('2')
  assert.equal(lastRequest().url.searchParams.get('designer_id'), '2')
  await respond(lastRequest(), empty)
  await respond(oldDesigner, active)
  assert.ok(screen.getByText('No projects available'))
  assert.equal(metric('Projects'), '0')
  assert.equal(screen.queryByRole('table'), null)
  assert.equal(screen.queryByText(/No interest recorded/), null)
  assert.equal(screen.getByRole('link', { name: 'Create a project' }).getAttribute('href'), '/create')

  choosePeriod('30d')
  await respond(lastRequest(), { error: 'Unavailable' }, 503)
  assert.match(screen.getByRole('alert').textContent, /Failed to load/)
  assert.equal(screen.queryByText('No projects available'), null, 'Failure is not an empty portfolio')
  assert.equal(screen.queryByText('Total Views'), null, 'Failure does not show false zero counts')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  assert.equal(lastRequest().url.searchParams.get('period'), '30d')
  assert.equal(lastRequest().url.searchParams.get('designer_id'), '2')
  await respond(lastRequest(), zero)

  assert.equal(polls.size, 1, 'Only the current request schedules polling')
  await act(async () => {
    const [id, callback] = polls.entries().next().value
    polls.delete(id)
    callback()
  })
  assert.equal(lastRequest().url.searchParams.get('period'), '30d', 'Polling preserves selected period')
  await respond(lastRequest(), active)
  assert.equal(metric('Total Views'), '12')

  // Failed refreshes clear stale totals and offer recovery.
  await act(async () => {
    const [id, callback] = polls.entries().next().value
    polls.delete(id)
    callback()
  })
  await act(async () => lastRequest().reject(new Error('Network unavailable')))
  assert.ok(screen.getByRole('alert'))
  assert.equal(screen.queryByText('Total Views'), null)
  view.unmount()
  view = null
  assert.equal(polls.size, 0, 'Unmount cancels polling')
  console.log('PASS: period changes, zero counts, no projects, selection, response races, retry, polling, and cleanup')
} finally {
  view?.unmount()
  globalThis.fetch = originalFetch
  globalThis.setTimeout = originalSetTimeout
  globalThis.clearTimeout = originalClearTimeout
  dom.window.close()
}
