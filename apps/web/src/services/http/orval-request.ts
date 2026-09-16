import type { AxiosError, AxiosRequestConfig } from "axios";

import http from "@/services/http/http.client";

/**
 * 将 Orval 生成的请求交给项目统一 Axios 实例执行。
 */
export function orvalRequest<T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> {
  return http<T>({ ...config, ...options }).then((response) => response.data);
}

/**
 * Orval React Query 使用的错误类型。
 */
export type ErrorType<T> = AxiosError<T>;

/**
 * Orval 请求体类型。
 */
export type BodyType<T> = T;
