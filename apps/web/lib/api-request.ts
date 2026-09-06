import { useAuthStore } from '@/store/authStore';

import { API_URL } from './constants/api';
import { type ApiResponse } from './types/api';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  // TODO: httpOnly 쿠키 기반으로 전환 시 credentials: 'include'를 기본값으로 하고,
  // 각 서비스 호출부의 수동 Authorization 헤더 첨부 제거.
  credentials?: RequestCredentials;
  timeoutMs?: number;
}

export async function apiRequest<T = undefined, E = undefined>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T, E>> {
  const { method = 'GET', body, headers, credentials, timeoutMs = 10_000 } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData = body instanceof FormData;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      credentials,
      headers: isFormData ? headers : { 'Content-Type': 'application/json', ...headers },
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const responseBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        useAuthStore.getState().clearToken();
      }
      return {
        isSuccess: false,
        statusCode: res.status,
        errorCode: responseBody.errorCode,
        data: responseBody.data,
      } as ApiResponse<T, E>;
    }
    return { isSuccess: true, statusCode: res.status, data: responseBody } as ApiResponse<T, E>;
  } catch (err) {
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    return {
      isSuccess: false,
      statusCode: 0,
      errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
    } as ApiResponse<T, E>;
  } finally {
    clearTimeout(timeoutId);
  }
}
