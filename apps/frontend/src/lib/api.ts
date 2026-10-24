/**
 * API client abstraction layer.
 *
 * All backend calls go through this module.
 * Phase 1: returns a health check only.
 * Phase 3: will replace mock data with real API calls.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export interface HealthResponse {
  status: 'ok' | 'degraded'
  database: 'connected' | 'unavailable'
  service: string
  version: string
  disclaimer: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/health'),
}
