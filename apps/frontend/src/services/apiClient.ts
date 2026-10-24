// ─── API Client ─────────────────────────────────────────────────────────────
// Centralized HTTP client for FastAPI communication.
// Fallback to mock mode is only enabled if VITE_USE_MOCK_API === 'true'.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
export const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorJson = await response.json()
      if (errorJson && typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail
      } else if (errorJson && Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ')
      }
    } catch {
      // Body not JSON
    }
    throw new ApiError(response.status, errorDetail)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}
