import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request } from "express";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs";
import { traceStore } from "../middleware/trace-id.middleware";

/**
 * LoggingInterceptor 配置项接口
 */
export interface LoggingInterceptorOptions {
  /**
   * 判定为“慢 Handler”的阈值（单位：毫秒）
   * @default 1000
   */
  slowThresholdMs?: number;

  /**
   * 是否在日志中包含控制器名称与方法名（例如 UsersController#findAll）
   * @default true
   */
  includeHandlerName?: boolean;

  /**
   * 是否打印返回的 Response Data（接口响应体）
   * @default false
   */
  logResponseBody?: boolean;

  /**
   * 需要在响应体中进行脱敏掩码处理的敏感字段列表
   * @default ['password', 'token', 'accessToken', 'refreshToken', 'secret']
   */
  sanitizedFields?: string[];
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type LoggingInterceptorConfig = boolean | LoggingInterceptorOptions;

/**
 * 默认配置常量
 */
const DEFAULT_LOGGING_INTERCEPTOR_OPTIONS: LoggingInterceptorOptions = {
  slowThresholdMs: 1000,
  includeHandlerName: true,
  logResponseBody: false,
  sanitizedFields: ["password", "token", "accessToken", "refreshToken", "secret"],
};

/**
 * 全局 Handler 切面日志与耗时拦截器 (LoggingInterceptor)
 *
 * 核心功能：
 * 1. 记录 Controller 方法（Handler）从进入到响应完毕的精确耗时及类名/方法名。
 * 2. 结合 AsyncLocalStorage 提取当前请求的 Trace ID，实现日志全链路标记。
 * 3. 支持对接口出参（Response Data）进行日志记录与脱敏处理。
 * 4. 捕获 Handler 执行过程中的异常并打点，便于分析业务方法内部抛错。
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HandlerLog");
  private readonly slowThresholdMs: number;
  private readonly includeHandlerName: boolean;
  private readonly logResponseBody: boolean;
  private readonly sanitizedFields: string[];

  constructor(options: LoggingInterceptorOptions = DEFAULT_LOGGING_INTERCEPTOR_OPTIONS) {
    this.slowThresholdMs = options.slowThresholdMs ?? DEFAULT_LOGGING_INTERCEPTOR_OPTIONS.slowThresholdMs!;
    this.includeHandlerName = options.includeHandlerName ?? DEFAULT_LOGGING_INTERCEPTOR_OPTIONS.includeHandlerName!;
    this.logResponseBody = options.logResponseBody ?? DEFAULT_LOGGING_INTERCEPTOR_OPTIONS.logResponseBody!;
    this.sanitizedFields = options.sanitizedFields || DEFAULT_LOGGING_INTERCEPTOR_OPTIONS.sanitizedFields!;
  }

  /**
   * 静态配置解析函数：用于 setupInterceptors 中处理 boolean | Options 配置项
   */
  static resolveOptions(config?: LoggingInterceptorConfig): LoggingInterceptorOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_LOGGING_INTERCEPTOR_OPTIONS;
    return { ...DEFAULT_LOGGING_INTERCEPTOR_OPTIONS, ...config };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // 仅针对 HTTP 上下文进行拦截处理（忽略 GraphQL / WebSocket / Microservice 等场景）
    if (context.getType() !== "http") {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const httpRequest = httpContext.getRequest<Request>();
    const { method, originalUrl } = httpRequest;

    // 获取当前调用的 Class 名称与 Handler 方法名
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const targetHandler = this.includeHandlerName ? `${controllerName}#${handlerName}` : "";

    const executionStartTimestamp = Date.now();
    const response$ = next.handle();

    return response$.pipe(
      tap((responseData) => {
        const durationMs = Date.now() - executionStartTimestamp;
        const traceId = traceStore.getStore() || "N/A";

        // 格式化响应数据（如果开启了 logResponseBody）
        let responseBodyStr = "";
        if (this.logResponseBody && responseData !== undefined) {
          const sanitized = this.sanitize(responseData);
          responseBodyStr = ` - Response: ${JSON.stringify(sanitized)}`;
        }

        const logMessage = `[${traceId}] ${method} ${originalUrl} ${targetHandler ? `[${targetHandler}] ` : ""}+${durationMs}ms${responseBodyStr}`;

        // 根据执行耗时情况动态提升日志级别
        if (durationMs >= this.slowThresholdMs) {
          this.logger.warn(`[SLOW_HANDLER] ${logMessage}`);
        } else {
          this.logger.log(logMessage);
        }
      }),
      catchError((error: unknown) => {
        const durationMs = Date.now() - executionStartTimestamp;
        const traceId = traceStore.getStore() || "N/A";
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

        this.logger.error(`[${traceId}] ${method} ${originalUrl} ${targetHandler ? `[${targetHandler}] ` : ""}+${durationMs}ms [FAILED] - Exception: ${errorMessage}`);

        return throwError(() => error);
      }),
    );
  }

  /**
   * 对响应数据中的敏感字段进行掩码脱敏处理
   */
  private sanitize<T>(data: T): T {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item)) as unknown as T;
    }

    const sanitizedObj = { ...data } as Record<string, unknown>;

    for (const key of Object.keys(sanitizedObj)) {
      if (this.sanitizedFields.some((field) => field.toLowerCase() === key.toLowerCase())) {
        sanitizedObj[key] = "***";
      } else if (typeof sanitizedObj[key] === "object" && sanitizedObj[key] !== null) {
        sanitizedObj[key] = this.sanitize(sanitizedObj[key]);
      }
    }

    return sanitizedObj as T;
  }
}
