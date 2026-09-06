/** Token usable for Authorization: Bearer (real JWT, not Patreon/Discord temp placeholders). */
export function isUsableAuthToken(token: string | null | undefined): token is string {
  return Boolean(token && !token.startsWith('temp_'));
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('gw2_token');
  return isUsableAuthToken(token) ? token : null;
}

export function getAuthHeaders(extra?: HeadersInit): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...extra,
  };
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
