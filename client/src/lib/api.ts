type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  throw new Error('VITE_API_URL is not set. Copy client/.env.example to client/.env.');
}

/** Per-field messages from a 400 response, e.g. `{ price: ['Must be greater than 0'] }`. */
export type ApiErrorDetails = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;

  constructor(status: number, code: string, message: string, details?: ApiErrorDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorBody {
  error: { code: string; message: string; details?: ApiErrorDetails };
}

function isErrorBody(value: unknown): value is ErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  if (isErrorBody(body)) {
    const { code, message, details } = body.error;
    return new ApiError(response.status, code, message, details);
  }
  return new ApiError(
    response.status,
    'UNKNOWN_ERROR',
    `Request failed with status ${response.status}`,
  );
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server');
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T = undefined>(path: string) => request<T>('DELETE', path),
};
