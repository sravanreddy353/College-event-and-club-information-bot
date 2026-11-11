export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || '/api'

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Cannot reach the assistant server. Run "cd frontend" and "npm run dev" in the project terminal, and keep it open.',
      )
    }
    throw error
  }

  if (response.status === 204) return null

  const data = await response.json()
  if (!response.ok) {
    const error = new Error(data.detail || `The request failed (${response.status}).`)
    error.status = response.status
    throw error
  }
  return data
}
