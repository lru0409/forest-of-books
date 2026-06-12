type ApiSuccess<T> = [T] extends [undefined]
  ? { isSuccess: true; statusCode: number }
  : { isSuccess: true; statusCode: number; data: T };

type ApiFailure<E> = [E] extends [undefined]
  ? { isSuccess: false; statusCode: number; errorCode?: string }
  : { isSuccess: false; statusCode: number; errorCode?: string; data?: E };

export type ApiResponse<T = undefined, E = undefined> = ApiSuccess<T> | ApiFailure<E>;
