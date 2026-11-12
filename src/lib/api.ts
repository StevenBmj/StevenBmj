let refreshing: Promise<boolean> | null = null;

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const internal = url.startsWith('/api/');
  const options = internal ? { ...init, credentials: 'same-origin' as const } : init;
  const response = await globalThis.fetch(url, options);
  const authSubmission = url.startsWith('/api/auth/') && !url.startsWith('/api/auth/users');
  if (!internal || response.status !== 401 || authSubmission) return response;

  // One refresh for concurrent requests; an unauthorized mutation has not run yet.
  if (!refreshing) {
    refreshing = globalThis.fetch('/api/auth/session', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refresh' }),
    }).then(r => r.ok).catch(() => false).finally(() => { refreshing = null; });
  }
  if (!await refreshing) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('sbmj:session-expired'));
    return response;
  }
  return globalThis.fetch(url, options);
}
