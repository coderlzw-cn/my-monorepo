import { HttpStatus, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { traceStore } from "./trace-id.middleware";

/**
 * MaintenanceModeMiddleware 配置项接口
 */
export interface MaintenanceModeMiddlewareOptions {
  /**
   * 是否开启维护模式
   * @default false
   */
  enabled?: boolean;

  /**
   * 维护模式放行路径，支持前缀匹配
   * @default ['/health', '/swagger']
   */
  allowPaths?: string[];

  /**
   * 返回给客户端的提示文案
   * @default '系统维护中，请稍后再试'
   */
  message?: string;
}

/**
 * 支持传入布尔值（开关）或具体的配置对象。
 * 默认关闭。
 */
export type MaintenanceModeMiddlewareConfig = boolean | MaintenanceModeMiddlewareOptions;

const DEFAULT_MAINTENANCE_MODE_OPTIONS: MaintenanceModeMiddlewareOptions = {
  enabled: false,
  allowPaths: ["/health", "/swagger"],
  message: "系统维护中，请稍后再试",
};

/**
 * 维护模式中间件
 *
 * 核心功能：
 * 1. 系统升级、数据迁移或临时停服时，统一返回 503。
 * 2. 默认放行 `/health` 和 `/swagger`，避免健康检查和文档不可访问。
 * 3. 通过 `traceStore` 透传 Trace ID，错误体与 HttpExceptionFilter 对齐。
 */
@Injectable()
export class MaintenanceModeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MaintenanceModeMiddleware.name);
  private readonly enabled: boolean;
  private readonly allowPaths: string[];
  private readonly message: string;

  constructor(options: MaintenanceModeMiddlewareOptions = DEFAULT_MAINTENANCE_MODE_OPTIONS) {
    this.enabled = options.enabled ?? DEFAULT_MAINTENANCE_MODE_OPTIONS.enabled!;
    this.allowPaths = options.allowPaths ?? DEFAULT_MAINTENANCE_MODE_OPTIONS.allowPaths!;
    this.message = options.message ?? DEFAULT_MAINTENANCE_MODE_OPTIONS.message!;
  }

  /**
   * 静态配置解析函数：用于 setupMiddleware 中转换 boolean | Options 配置参数。
   * `undefined` / `false` 不挂载；`true` 表示开启维护模式。
   */
  static resolveOptions(config?: MaintenanceModeMiddlewareConfig): MaintenanceModeMiddlewareOptions | null {
    if (config === false || config === undefined) return null;
    if (config === true) return { ...DEFAULT_MAINTENANCE_MODE_OPTIONS, enabled: true };
    return { ...DEFAULT_MAINTENANCE_MODE_OPTIONS, enabled: true, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.enabled || this.allowPaths.some((path) => req.originalUrl.startsWith(path))) {
      next();
      return;
    }

    const traceId = traceStore.getStore() || "N/A";

    this.logger.warn(`[${traceId}] ${req.method} ${req.originalUrl} ${HttpStatus.SERVICE_UNAVAILABLE} - Message: ${this.message}`);

    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: this.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      ...(traceId !== "N/A" && { traceId }),
    });
  }
}
