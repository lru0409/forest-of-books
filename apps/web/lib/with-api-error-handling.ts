import type { ApiResponse } from './types/api';

// TODO 더 좋은 방법 없을지 고민해보자.

/**
 * fetch 자체가 실패하는 경우(네트워크 미연결 등)를 잡아 일관된 ApiResponse 실패 형태로 변환한다.
 * res.ok가 false인 HTTP 에러는 각 서비스 함수가 이미 처리하므로 여기서는 건드리지 않는다.
 */
export function withApiErrorHandling<Args extends unknown[], T, E>(
  fn: (...args: Args) => Promise<ApiResponse<T, E>>,
) {
  return async (...args: Args): Promise<ApiResponse<T, E>> => {
    try {
      return await fn(...args);
    } catch {
      return { isSuccess: false, statusCode: 0, errorCode: 'NETWORK_ERROR' } as ApiResponse<T, E>;
    }
  };
}
