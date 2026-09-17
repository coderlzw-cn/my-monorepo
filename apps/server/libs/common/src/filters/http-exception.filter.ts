import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { traceStore } from "../middleware/trace-id.middleware";

/**
 * HttpExceptionFilter 配置项接口
 */
export interface HttpExceptionFilterOptions {
  /**
   * 是否在响应结果中输出 Trace ID
   * @default true
   */
  showTraceId?: boolean;

  /**
   * 当参数校验（class-validator）返回数组消息时，是否自动将其连接为字符串
   * @default false （默认保留数组结构，便于前端针对特定字段提示）
   */
  flattenValidationErrors?: boolean;
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type HttpExceptionFilterConfig = boolean | HttpExceptionFilterOptions;

/**
 * 默认配置常量
 */
const DEFAULT_HTTP_FILTER_OPTIONS: HttpExceptionFilterOptions = {
  showTraceId: true,
  flattenValidationErrors: false,
};

/**
 * 结构化的错误响应体类型
 */
export interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  code?: number | string;
  timestamp: string;
  path: string;
  traceId?: string;
}

/**
 * 企业级 HTTP 业务已知异常过滤器 (HttpExceptionFilter)
 *
 * 核心功能：
 * 1. 专门捕获应用中主动抛出的 `HttpException` 及其派生类（如 `BadRequestException`）。
 * 2. 深度解析 `class-validator` 等校验管道抛出的复杂错误结构（数组、Nested Objects）。
 * 3. 支持提取业务自定义错误码 (`businessCode`)。
 * 4. 结合 `traceStore` 透传 Trace ID 并记录结构化警告日志。
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpExceptionFilter");
  private readonly showTraceId: boolean;
  private readonly flattenValidationErrors: boolean;

  constructor(options: HttpExceptionFilterOptions = DEFAULT_HTTP_FILTER_OPTIONS) {
    this.showTraceId = options.showTraceId ?? DEFAULT_HTTP_FILTER_OPTIONS.showTraceId!;
    this.flattenValidationErrors = options.flattenValidationErrors ?? DEFAULT_HTTP_FILTER_OPTIONS.flattenValidationErrors!;
  }

  /**
   * 静态配置解析函数：用于 setupFilters 中处理 boolean | Options 配置项
   */
  static resolveOptions(config?: HttpExceptionFilterConfig): HttpExceptionFilterOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_HTTP_FILTER_OPTIONS;
    return { ...DEFAULT_HTTP_FILTER_OPTIONS, ...config };
  }

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // 1. 获取全局链路 Trace ID
    const traceId = traceStore.getStore() || "N/A";

    // 2. 提取并解析 exception.getResponse() 内部结构
    const exceptionResponse = exception.getResponse();
    let errorMessage: string | string[] = exception.message;
    let errorType: string | undefined = undefined;
    let businessCode: number | string | undefined = undefined;

    if (typeof exceptionResponse === "string") {
      errorMessage = exceptionResponse;
    } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, unknown>;

      // 提取 class-validator 或自定义异常中的 message 字段
      if (resObj.message) {
        if (Array.isArray(resObj.message) && this.flattenValidationErrors) {
          errorMessage = resObj.message.join("; ");
        } else {
          errorMessage = resObj.message as string | string[];
        }
      }

      // 提取 HTTP 标准错误名称（例如 "Bad Request"）
      if (resObj.error && typeof resObj.error === "string") {
        errorType = resObj.error;
      }

      // 提取业务自定义错误码（如 { code: 10001, message: '...' }）
      if (resObj.code !== undefined) {
        businessCode = resObj.code as number | string;
      }
    }

    // 3. 构建规范化的响应体
    const responseBody: ErrorResponseBody = {
      statusCode: status,
      message: errorMessage,
      ...(errorType && { error: errorType }),
      ...(businessCode !== undefined && { code: businessCode }),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(this.showTraceId && traceId !== "N/A" && { traceId }),
    };

    // 4. 打点记录 WARNING 日志（对于业务主动抛出的 4xx 错误，使用 WARN 级别，避免污染 ERROR 告警）
    const formattedMsg = typeof errorMessage === "object" ? JSON.stringify(errorMessage) : errorMessage;
    this.logger.warn(`[${traceId}] ${request.method} ${request.url} ${status} - Message: ${formattedMsg}`);

    // 5. 响应客户端
    response.status(status).json(responseBody);
  }
}
