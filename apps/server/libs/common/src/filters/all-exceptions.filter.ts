import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { traceStore } from "../middleware/trace-id.middleware";

/**
 * AllExceptionsFilter 配置项接口
 */
export interface AllExceptionsFilterOptions {
  /**
   * 是否在控制台/日志文件记录异常堆栈跟踪 (Stack Trace)
   * @default true
   */
  logStackTrace?: boolean;

  /**
   * 兜底的默认错误提示信息
   * @default 'Internal server error'
   */
  defaultErrorMessage?: string;
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type AllExceptionsFilterConfig = boolean | AllExceptionsFilterOptions;

/**
 * 默认配置常量
 */
const DEFAULT_FILTER_OPTIONS: AllExceptionsFilterOptions = {
  logStackTrace: true,
  defaultErrorMessage: "Internal server error",
};

/**
 * 全局统一异常捕获过滤器 (AllExceptionsFilter)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("AllExceptionsFilter");
  private readonly logStackTrace: boolean;
  private readonly defaultErrorMessage: string;

  constructor(options: AllExceptionsFilterOptions = DEFAULT_FILTER_OPTIONS) {
    this.logStackTrace = options.logStackTrace ?? DEFAULT_FILTER_OPTIONS.logStackTrace!;
    this.defaultErrorMessage = options.defaultErrorMessage || DEFAULT_FILTER_OPTIONS.defaultErrorMessage!;
  }

  /**
   * 静态配置解析函数：用于 setupFilters 中处理 boolean | Options 配置项
   */
  static resolveOptions(config?: AllExceptionsFilterConfig): AllExceptionsFilterOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_FILTER_OPTIONS;
    return { ...DEFAULT_FILTER_OPTIONS, ...config };
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const traceId = traceStore.getStore() || "N/A";

    let message = this.defaultErrorMessage;
    let errorDetails: string | object | null = null;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        message = (res as { message?: string | string[] }).message
          ? Array.isArray((res as { message?: string | string[] }).message)
            ? (res as { message: string[] }).message.join("; ")
            : (res as { message: string }).message
          : exception.message;
        errorDetails = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message || this.defaultErrorMessage;
    }

    // 记录错误日志
    const logMsg = `[${traceId}] ${request.method} ${request.originalUrl} - Status: ${status} - Message: ${message}`;
    if (status >= 500) {
      this.logger.error(logMsg, this.logStackTrace && exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(logMsg);
    }

    // 输出统一规范的 JSON 错误响应
    response.status(status).json({
      code: status,
      message,
      data: null,
      error: errorDetails,
      traceId,
      timestamp: Date.now(),
    });
  }
}
