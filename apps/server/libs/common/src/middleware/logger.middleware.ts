import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { traceStore } from "./trace-id.middleware";

/**
 * LoggerMiddleware 配置项接口
 */
export interface LoggerMiddlewareOptions {
  /**
   * 是否记录 Request Body 内容
   * @default false
   */
  logBody?: boolean;

  /**
   * 判定为“慢请求”的阈值（单位：毫秒）。
   * 当接口响应耗时超过该值时，自动提升日志级别为 WARN，便于监控排查性能瓶颈。
   * @default 1000
   */
  slowThresholdMs?: number;

  /**
   * 需要忽略/跳过打印日志的路径白名单（支持正则或精确/前缀匹配字符串）
   * @default ['/health', '/favicon.ico']
   */
  excludePaths?: (string | RegExp)[];

  /**
   * 需要在 Body / Query 中进行脱敏掩码处理的敏感字段列表
   * @default ['password', 'token', 'accessToken', 'refreshToken', 'secret']
   */
  sanitizedFields?: string[];
}

/**
 * 支持传入布尔值（开关）或具体的配置对象
 */
export type LoggerMiddlewareConfig = boolean | LoggerMiddlewareOptions;

/**
 * 默认配置常量
 */
const DEFAULT_LOGGER_OPTIONS: LoggerMiddlewareOptions = {
  logBody: false,
  slowThresholdMs: 1000,
  excludePaths: ["/health", "/favicon.ico"],
  sanitizedFields: ["password", "token", "accessToken", "refreshToken", "secret"],
};

/**
 * 全局 HTTP 请求日志中间件 (LoggerMiddleware)
 *
 * 核心功能：
 * 1. 记录 HTTP 请求方法、URL、Client IP、User-Agent 等元数据。
 * 2. 精准监听 Response 结束事件，统计接口响应耗时。
 * 3. 集成 AsyncLocalStorage (traceStore) 提取全局唯一的 Trace ID。
 * 4. 内置递归脱敏机制，防止敏感数据落盘。
 * 5. 根据响应状态码（2xx/4xx/5xx）及慢请求阈值触发不同级别的日志输出 (LOG/WARN/ERROR)。
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");
  private readonly logBody: boolean;
  private readonly slowThresholdMs: number;
  private readonly excludePaths: (string | RegExp)[];
  private readonly sanitizedFields: string[];

  constructor(options: LoggerMiddlewareOptions = DEFAULT_LOGGER_OPTIONS) {
    this.logBody = options.logBody ?? DEFAULT_LOGGER_OPTIONS.logBody!;
    this.slowThresholdMs = options.slowThresholdMs ?? DEFAULT_LOGGER_OPTIONS.slowThresholdMs!;
    this.excludePaths = options.excludePaths || DEFAULT_LOGGER_OPTIONS.excludePaths!;
    this.sanitizedFields = options.sanitizedFields || DEFAULT_LOGGER_OPTIONS.sanitizedFields!;
  }

  /**
   * 静态配置解析函数：用于 setupMiddleware 中转换 boolean | Options 配置参数
   */
  static resolveOptions(config?: LoggerMiddlewareConfig): LoggerMiddlewareOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_LOGGER_OPTIONS;
    return { ...DEFAULT_LOGGER_OPTIONS, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;

    // 1. 匹配跳过打印日志的路径白名单
    if (this.isExcluded(originalUrl)) {
      return next();
    }

    const startTimestamp = Date.now();
    const userAgent = req.get("user-agent") || "-";

    // 2. 监听 HTTP Response 的 finish 事件（当响应内容完全发送给客户端后触发）
    res.on("finish", () => {
      const { statusCode } = res;
      const durationMs = Date.now() - startTimestamp;

      // 从全链路 AsyncLocalStorage 存储中提取全局唯一的 Trace ID
      const traceId = traceStore.getStore() || "N/A";

      // 提取并脱敏 Query 及 Body 参数
      const sanitizedQuery = this.sanitize(req.query);
      const sanitizedBody = this.logBody ? this.sanitize(req.body) : undefined;

      // 构建统一格式的结构化日志消息
      const logMessage =
        `[${traceId}] ${method} ${originalUrl} ${statusCode} +${durationMs}ms - IP: ${ip} - UA: "${userAgent}"` +
        `${Object.keys(sanitizedQuery).length ? ` - Query: ${JSON.stringify(sanitizedQuery)}` : ""}` +
        `${sanitizedBody && Object.keys(sanitizedBody).length ? ` - Body: ${JSON.stringify(sanitizedBody)}` : ""}`;

      // 3. 根据响应状态码与执行耗时，动态匹配日志等级
      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage);
      } else if (durationMs >= this.slowThresholdMs) {
        this.logger.warn(`[SLOW_REQUEST] ${logMessage}`);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }

  /**
   * 校验路径是否符合 excludePaths 白名单规则
   */
  private isExcluded(path: string): boolean {
    return this.excludePaths.some((rule) => {
      if (typeof rule === "string") {
        return path === rule || path.startsWith(`${rule}/`);
      }
      return rule.test(path);
    });
  }

  /**
   * 对请求参数中的敏感字段进行深度递归掩码脱敏操作
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
