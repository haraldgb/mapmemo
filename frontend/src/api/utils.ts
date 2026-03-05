export const fetchWithSessionRetry = async (
  input: RequestInfo,
  init: RequestInit,
) => {
  const response = await fetch(input, { ...init, credentials: 'include' })
  if (response.status !== 401) {
    return response
  }

  const healthResponse = await fetch('/api/health', {
    method: 'GET',
    credentials: 'include',
  })
  if (!healthResponse.ok) {
    return response
  }

  return fetch(input, { ...init, credentials: 'include' })
}
