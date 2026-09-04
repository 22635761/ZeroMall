import { API_BASE_URL } from '../config/api.config';
export { API_BASE_URL };

export async function apiRequest<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${response.statusText}`);
  }

  return response.json();
}
