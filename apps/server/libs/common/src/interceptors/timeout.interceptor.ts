import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor, RequestTimeoutException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Observable, TimeoutError, catchError, throwError, timeout } from "rxjs";
import { TIMEOUT_METADATA_KEY } from "../decorators/timeout.decorator";
import { traceStore } from "../middleware/trace-id.middleware";

/**
 * TimeoutInterceptor 配置项接口
 */
export interface TimeoutInterceptorOptions {
  /**
   * 全局默认请求超时阈值（单位：毫秒）
   * @default 5000
   */
  timeoutMs?: number;

  /**
   * 超时熔断时返回给客户端的错误提示信息
   * @default 'Request execution timeout'
   */
  errorMessage?: string;

  /**
   * 是否在超时触发时打印告警日志
   * @default true
   */
  logOnTimeout?: boolean;
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type TimeoutInterceptorConfig = boolean | TimeoutInterceptorOptions;

/**
 * 默认配置常量
 */
const DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS: TimeoutInterceptorOptions = {
  timeoutMs: 5000,
  errorMessage: "Request execution timeout",
  logOnTimeout: true,
};

/**
 * 全局请求超时熔断拦截器 (TimeoutInterceptor)
 *
 * 核心功能：
 * 1. 拦截 Handler 执行时间，超时后自动终止 RxJS 数据流并抛出 HTTP 408 (RequestTimeoutException)。
 * 2. 支持通过 `@SetTimeout(ms)` 装饰器动态覆盖特定 Handler / Controller 的超时时间。
 * 3. 集成 AsyncLocalStorage (traceStore) 打印包含 Trace ID 和 Handler 元数据的熔断日志。
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger("TimeoutInterceptor");
  private readonly defaultTimeoutMs: number;
  private readonly errorMessage: string;
  private readonly logOnTimeout: boolean;

  constructor(
    private readonly reflector?: Reflector,
    options: TimeoutInterceptorOptions = DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS,
  ) {
    this.defaultTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS.timeoutMs!;
    this.errorMessage = options.errorMessage || DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS.errorMessage!;
    this.logOnTimeout = options.logOnTimeout ?? DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS.logOnTimeout!;
  }

  /**
   * 静态配置解析函数：用于 setupInterceptors 中处理 boolean | Options 配置项
   */
  static resolveOptions(config?: TimeoutInterceptorConfig): TimeoutInterceptorOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS;
    return { ...DEFAULT_TIMEOUT_INTERCEPTOR_OPTIONS, ...config };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // 非 HTTP 请求（如 RPC、WebSocket）跳过
    if (context.getType() !== "http") {
      return next.handle();
    }

    // 1. 优先从 Reflector 中读取通过 `@SetTimeout(ms)` 设置的自定义超时阈值
    let targetTimeoutMs = this.defaultTimeoutMs;
    if (this.reflector) {
      const customTimeout = this.reflector.getAllAndOverride<number>(TIMEOUT_METADATA_KEY, [context.getHandler(), context.getClass()]);
      if (typeof customTimeout === "number" && customTimeout > 0) {
        targetTimeoutMs = customTimeout;
      }
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const { method, originalUrl } = request;

    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const executionStartTimestamp = Date.now();

    return next.handle().pipe(
      // 2. 注入 RxJS 超时控制
      timeout(targetTimeoutMs),
      // 3. 捕获 RxJS TimeoutError 并转换为 NestJS 内置 408 异常
      catchError((error: unknown) => {
        if (error instanceof TimeoutError) {
          const durationMs = Date.now() - executionStartTimestamp;
          const traceId = traceStore.getStore() || "N/A";

          if (this.logOnTimeout) {
            this.logger.warn(`[${traceId}] ${method} ${originalUrl} [${controllerName}#${handlerName}] TIMEOUT after ${durationMs}ms (Threshold: ${targetTimeoutMs}ms)`);
          }

          return throwError(
            () =>
              new RequestTimeoutException({
                statusCode: 408,
                message: this.errorMessage,
                timeoutMs: targetTimeoutMs,
              }),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
