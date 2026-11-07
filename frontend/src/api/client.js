//!!wait for complete token process!!

// API base URL - uses localhost in development, PythonAnywhere in production
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:8000/api'
  : 'https://petelj.pythonanywhere.com/api'

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  if (payload.error) return payload.error
  if (payload.detail) return payload.detail

  const firstError = Object.values(payload).flat().find(Boolean)
  return firstError ? String(firstError) : fallback
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const payload = res.status === 204
    ? null
    : await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(getErrorMessage(
      payload,
      `${options.method || 'GET'} ${endpoint} failed: ${res.status}`,
    ))
  }

  return payload
}

export function apiGet(endpoint) {
  return request(endpoint)
}

export function apiPost(endpoint, data) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function apiPatch(endpoint, data) {
  return request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function apiDelete(endpoint) {
  return request(endpoint, { method: 'DELETE' })
}
