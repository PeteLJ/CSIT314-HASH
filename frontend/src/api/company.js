// API base URL - uses localhost in development, PythonAnywhere in production
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000/api'
  : 'https://petelj.pythonanywhere.com/api'

export async function companyRequest(path, method = 'GET', data, designerId) {
  const id = designerId || localStorage.getItem('designer_id') || ''
  const separator = path.includes('?') ? '&' : '?'
  const url = id ? `${API_BASE}${path}${separator}designer_id=${id}` : `${API_BASE}${path}`
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const details = payload ? Object.values(payload).flat().join(' ') : `Request failed (${response.status}).`
    throw new Error(details)
  }
  return payload
}