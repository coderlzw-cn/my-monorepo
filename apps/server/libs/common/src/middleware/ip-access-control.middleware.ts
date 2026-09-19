import { HttpStatus, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { extractClientIp, normalizeIp } from "@workspace/utils/shared/ip";
import { traceStore } from "./trace-id.middleware";

/**
 * IpAccessControlMiddleware 配置项接口
 */
export interface IpAccessControlMiddlewareOptions {
  /**
   * 允许访问的 IP 列表，支持精确匹配。
   * 未配置时，非黑名单 IP 默认放行。
   */
  allowList?: string[];

  /**
   * 禁止访问的 IP 列表，支持精确匹配，优先级高于 allowList
   */
  blockList?: string[];

  /**
   * 访问控制生效路径，支持前缀匹配
   * @default ['/']
   */
  paths?: string[];

  /**
   * 访问控制不生效路径，支持前缀匹配
   * @default []
   */
  excludePaths?: string[];
}

/**
 * 支持传入布尔值（开关）或具体的配置对象。
 * 默认关闭，避免反向代理或本地环境下误拦截。
 */
export type IpAccessControlMiddlewareConfig = boolean | IpAccessControlMiddlewareOptions;

const DEFAULT_IP_ACCESS_CONTROL_OPTIONS: IpAccessControlMiddlewareOptions = {
  allowList: [],
  blockList: [],
  paths: ["/"],
  excludePaths: [],
};

/**
 * IP 访问控制中间件
 *
 * 核心功能：
 * 1. 按客户端 IP 拦截访问，适合内部管理接口、Webhook 等场景。
 * 2. 黑名单优先级高于白名单，命中黑名单直接拒绝。
 * 3. 配置白名单时，只有白名单 IP 可以访问；不配置白名单时，非黑名单 IP 默认放行。
 * 4. 通过 `extractClientIp` 读取 `x-forwarded-for`、`x-real-ip` 与 socket remoteAddress。
 */
@Injectable()
export class IpAccessControlMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IpAccessControlMiddleware.name);
  private readonly allowSet: Set<string>;
  private readonly blockSet: Set<string>;
  private readonly paths: string[];
  private readonly excludePaths: string[];

  constructor(options: IpAccessControlMiddlewareOptions = DEFAULT_IP_ACCESS_CONTROL_OPTIONS) {
    this.allowSet = this.toIpSet(options.allowList ?? DEFAULT_IP_ACCESS_CONTROL_OPTIONS.allowList);
    this.blockSet = this.toIpSet(options.blockList ?? DEFAULT_IP_ACCESS_CONTROL_OPTIONS.blockList);
    this.paths = options.paths ?? DEFAULT_IP_ACCESS_CONTROL_OPTIONS.paths!;
    this.excludePaths = options.excludePaths ?? DEFAULT_IP_ACCESS_CONTROL_OPTIONS.excludePaths!;
  }

  /**
   * 静态配置解析函数：用于 setupMiddleware 中转换 boolean | Options 配置参数。
   * `undefined` / `false` 不挂载。
   */
  static resolveOptions(config?: IpAccessControlMiddlewareConfig): IpAccessControlMiddlewareOptions | null {
    if (config === false || config === undefined) return null;
    if (config === true) return DEFAULT_IP_ACCESS_CONTROL_OPTIONS;
    return { ...DEFAULT_IP_ACCESS_CONTROL_OPTIONS, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const url = req.originalUrl;
    const enabledForPath = this.paths.some((path) => url.startsWith(path));
    const excluded = this.excludePaths.some((path) => url.startsWith(path));

    if (!enabledForPath || excluded) {
      next();
      return;
    }

    const ip = extractClientIp(req.headers, req.socket.remoteAddress) ?? "";

    if (this.blockSet.has(ip)) {
      this.deny(req, res, "当前 IP 已被禁止访问");
      return;
    }

    if (this.allowSet.size === 0 || this.allowSet.has(ip)) {
      next();
      return;
    }

    this.deny(req, res, "当前 IP 不允许访问");
  }

  private toIpSet(list: string[] | undefined): Set<string> {
    const set = new Set<string>();

    for (const item of list ?? []) {
      const trimmed = item.trim();
      if (!trimmed) continue;

      set.add(trimmed);
      const normalized = normalizeIp(trimmed);
      if (normalized) {
        set.add(normalized);
      }
    }

    return set;
  }

  private deny(req: Request, res: Response, message: string): void {
    const traceId = traceStore.getStore() || "N/A";

    this.logger.warn(`[${traceId}] ${req.method} ${req.originalUrl} ${HttpStatus.FORBIDDEN} - Message: ${message}`);

    res.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      ...(traceId !== "N/A" && { traceId }),
    });
  }
}
