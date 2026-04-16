export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  message: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;
