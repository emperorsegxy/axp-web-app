export interface ApiError {
  error: string;
  needsVerification?: boolean;
  email?: string;
}

export function apiFetch<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}) {
  // During SSR, relative $fetch calls hit our own Nitro server directly rather than
  // going through the browser, so the incoming request's session cookie must be
  // forwarded by hand or the user appears signed out on every full-page load.
  const headers = import.meta.server
    ? { ...useRequestHeaders(['cookie']), ...(opts.headers as Record<string, string> | undefined) }
    : opts.headers;

  return $fetch<T>(`/api${path}`, {
    credentials: 'include',
    ...opts,
    headers,
  }) as Promise<T>;
}

export function extractErrorMessage(err: unknown, fallback: string) {
  const data = (err as { data?: ApiError })?.data;
  return data?.error || fallback;
}
