export type ApiResponse<T> =
  | { isSuccess: true; statusCode: number; data: T }
  | { isSuccess: false; statusCode: number; errorCode?: string };
