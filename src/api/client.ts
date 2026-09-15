/**
 * HTTP client — docs/10-rn-cli-implementation-guide.md §5.4.
 *
 * Three responsibilities and no more (there is no fixture mode: every call goes to the API):
 *   1. Unwrap the platform envelope `{message, error, data, formatting_args}` ONCE, centrally.
 *   2. Map transport + status + `data.code` into the ApiError taxonomy.
 *   3. Turn a 401 into a session reset, exactly once.
 *
 * WHAT CHANGED IN V2: there is no `/auth/token/refresh` endpoint and no refresh token. The
 * bearer token from `POST /auth/otp/verify` is the whole session, so a 401 cannot be repaired
 * in flight — it can only end the session and send the influencer back to Login. The silent
 * re-auth interceptor is gone with it.
 *
 * Anything else belongs in an endpoint module or a screen.
 */
import { ApiError, type ApiErrorKind } from './errors';
import type { Envelope } from './types';
import { secureStore } from '../store/secureStore';
import { API_BASE_URL, PLATFORM_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

let accessToken: string | null = null;

/**
 * The token lives in memory for the request path AND in the Keychain for cold start. With no
 * refresh endpoint it is the only credential, so losing it on every launch would mean logging
 * in daily — `restoreSession()` reads it back.
 */
export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

export async function restoreSession(): Promise<boolean> {
  const token = await secureStore.getToken();
  setAccessToken(token);
  return !!token;
}

/**
 * Registered by the session store. A 401 means the token is dead and nothing can revive it, so
 * the client hands control back to the shell rather than deciding navigation itself.
 */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
/** Which base URL a call targets. `platform` is the deletion pair outside /influencer/v1. */
type Host = 'influencer' | 'platform';

function statusToKind(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 422) return 'validation';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Drops undefined/null params, so a caller can pass an optional query value straight through. */
export function query(params: Record<string, string | number | undefined | null>): string {
  const pairs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

async function withTimeout(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function raw<T>(method: Method, path: string, body?: unknown, host: Host = 'influencer'): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const base = host === 'platform' ? PLATFORM_BASE_URL : API_BASE_URL;

  let res: Response;
  try {
    res = await withTimeout(`${base}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === 'AbortError';
    throw new ApiError({
      kind: aborted ? 'timeout' : 'offline',
      message: aborted ? 'Request timed out' : 'Network request failed',
    });
  }

  // 401 is the ONE deliberate departure from always-200 (backend V2/01-api-reference.md), so
  // this is the only transport-level signal worth hooking. It is terminal in V2.
  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError({ kind: 'unauthorized', message: 'Session expired', status: 401 });
  }

  if (!res.ok) {
    throw new ApiError({ kind: statusToKind(res.status), message: `HTTP ${res.status}`, status: res.status });
  }

  const envelope = (await res.json()) as Envelope<T>;

  // Business outcomes arrive as HTTP 200 with error:true. `data.code` is the only branchable
  // field — never the status, never the message.
  if (envelope.error) {
    const data = (envelope.data ?? {}) as Record<string, unknown>;
    throw new ApiError({
      kind: 'business',
      message: envelope.message,
      code: typeof data.code === 'string' ? data.code : undefined,
      field: typeof data.field === 'string' ? data.field : undefined,
      status: res.status,
      data,
    });
  }
  return envelope.data;
}

export const api = {
  get:  <T>(path: string) => raw<T>('GET', path),
  post: <T>(path: string, body?: unknown) => raw<T>('POST', path, body),
  put:  <T>(path: string, body?: unknown) => raw<T>('PUT', path, body),
  del:  <T>(path: string, body?: unknown) => raw<T>('DELETE', path, body),
  /** The platform host — account deletion only (V2 §7). */
  platform: {
    get: <T>(path: string) => raw<T>('GET', path, undefined, 'platform'),
    del: <T>(path: string, body?: unknown) => raw<T>('DELETE', path, body, 'platform'),
  },
};
