const base = (import.meta.env?.VITE_API_BASE_URL || 'https://petelj.pythonanywhere.com/api').replace(/\/$/, '')
export async function companyRequest(path, method = 'GET', data) {
  const token = sessionStorage.getItem('apiToken')
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const details = payload ? Object.values(payload).flat().join(' ') : `Request failed (${response.status}).`
    throw new Error(details)
  }
  return payload
}
