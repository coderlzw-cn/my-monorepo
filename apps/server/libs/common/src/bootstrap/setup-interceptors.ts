import { INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { LoggingInterceptor, LoggingInterceptorConfig } from "../interceptors/logging.interceptor";
import { TimeoutInterceptor, TimeoutInterceptorConfig } from "../interceptors/timeout.interceptor";
import { TransformInterceptor } from "../interceptors/transform.interceptor";

/**
 * 拦截器组装配配置接口
 * 支持对各个拦截器传入 `boolean`（开关）或具体的 `Options` 配置对象
 */
export interface InterceptorSetupOptions {
  /** 统一响应格式化拦截器（默认开启，无额外配置） */
  transform?: boolean;

  /** Controller 切面日志与耗时统计拦截器配置（默认开启） */
  logging?: LoggingInterceptorConfig;

  /** 请求全局超时熔断拦截器配置（默认开启） */
  timeout?: TimeoutInterceptorConfig;
}

/**
 * 模块化装配全局拦截器 (setupInterceptors)
 *
 * 核心功能：
 * 1. 按需解析并挂载统一响应拦截器、切面日志拦截器与超时拦截器。
 * 2. 自动从 NestJS IoC 容器获取 `Reflector` 传递给 `TimeoutInterceptor`，支持 `@SetTimeout()` 动态覆盖。
 *
 * @param app NestJS 应用实例 (`INestApplication`)
 * @param options 各拦截器的配置对象（默认全部开启）
 */
export function setupInterceptors(app: INestApplication, options: InterceptorSetupOptions = {}): void {
  const { transform = true, logging = true, timeout = true } = options;

  // 1. 装配统一响应格式化拦截器（注入 Reflector，用于读取 @SkipTransform 等元数据）
  if (transform) {
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new TransformInterceptor(reflector));
  }

  // 2. 装配 Controller 切面日志与耗时拦截器
  const loggingOpts = LoggingInterceptor.resolveOptions(logging);
  if (loggingOpts) {
    app.useGlobalInterceptors(new LoggingInterceptor(loggingOpts));
  }

  // 3. 装配请求超时熔断拦截器（注入 Reflector 用于读取路由元数据）
  const timeoutOpts = TimeoutInterceptor.resolveOptions(timeout);
  if (timeoutOpts) {
    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new TimeoutInterceptor(reflector, timeoutOpts));
  }
}
