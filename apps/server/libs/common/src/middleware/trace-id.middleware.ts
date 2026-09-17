import { Injectable, NestMiddleware } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

/**
 * AsyncLocalStorage 全局追踪上下文实例：
 * 用于在当前 HTTP 请求的异步调用链中隐式传递 Trace ID。
 * 后续可以在 Service、Repository、Interceptor 或 Custom Logger 中直接调用 `traceStore.getStore()` 获取 Trace ID。
 */
export const traceStore = new AsyncLocalStorage<string>();

/**
 * TraceIdMiddleware 配置项接口
 */
export interface TraceIdMiddlewareOptions {
  /**
   * 用于在 Request/Response Header 中传输 Trace ID 的 Header 字段名
   * @default 'x-trace-id'
   */
  headerName?: string;

  /**
   * 是否自动将 Trace ID 追加至 `Access-Control-Expose-Headers`，
   * 以确保前端/客户端在跨域 (CORS) 请求时能够读取到该 Header
   * @default true
   */
  exposeInCors?: boolean;

  /**
   * 自定义 Trace ID 生成算法。若未提供，默认采用 Node.js 原生 `crypto.randomUUID()`
   */
  generateId?: () => string;
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type TraceIdConfig = boolean | TraceIdMiddlewareOptions;

/**
 * 默认配置常量
 */
const DEFAULT_TRACE_ID_OPTIONS: TraceIdMiddlewareOptions = {
  headerName: "x-trace-id",
  exposeInCors: true,
};

/**
 * 企业级全链路追踪中间件 (TraceIdMiddleware)
 *
 * 核心功能：
 * 1. 提取或生成唯一 Request Trace ID（优先使用网关或上游服务透传的 Header）。
 * 2. 修正并写回 Request Headers 与 Response Headers。
 * 3. 自动配置 CORS 暴露 Header，支持前端接收 Trace ID。
 * 4. 基于 `AsyncLocalStorage` 创建异步上下文隔离生命周期，为日志与异常过滤器提供 Trace ID 检索支撑。
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  private readonly headerName: string;
  private readonly exposeInCors: boolean;
  private readonly generateId: () => string;

  constructor(options: TraceIdMiddlewareOptions = DEFAULT_TRACE_ID_OPTIONS) {
    this.headerName = (options.headerName || DEFAULT_TRACE_ID_OPTIONS.headerName)!.toLowerCase();
    this.exposeInCors = options.exposeInCors ?? DEFAULT_TRACE_ID_OPTIONS.exposeInCors!;
    this.generateId = options.generateId || randomUUID;
  }

  /**
   * 静态配置解析函数：用于 setupMiddleware 中转换 boolean | Options 配置参数
   */
  static resolveOptions(config?: TraceIdConfig): TraceIdMiddlewareOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_TRACE_ID_OPTIONS;
    return { ...DEFAULT_TRACE_ID_OPTIONS, ...config };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // 1. 优先提取请求头中的现有 Trace ID（支持微服务/网关层透传），不存在则生成新 UUID
    const incomingTraceId = req.headers[this.headerName];
    const traceId = (Array.isArray(incomingTraceId) ? incomingTraceId[0] : incomingTraceId) || this.generateId();

    // 2. 统一回写至 Request Headers，保证下游 Controller/Interceptor 能准确读取
    req.headers[this.headerName] = traceId;

    // 3. 将 Trace ID 写入 Response Headers
    res.setHeader(this.headerName, traceId);

    // 4. 处理 CORS 响应头暴露逻辑
    if (this.exposeInCors) {
      const existingExpose = res.getHeader("Access-Control-Expose-Headers");
      if (!existingExpose) {
        res.setHeader("Access-Control-Expose-Headers", this.headerName);
      } else {
        const exposeArray = Array.isArray(existingExpose)
          ? existingExpose
          : String(existingExpose)
              .split(",")
              .map((h) => h.trim());

        if (!exposeArray.includes(this.headerName)) {
          exposeArray.push(this.headerName);
          res.setHeader("Access-Control-Expose-Headers", exposeArray.join(", "));
        }
      }
    }

    // 5. 开启 AsyncLocalStorage 上下文并执行 next()，确保整个请求生命周期都能隐式访问 traceId
    traceStore.run(traceId, () => {
      next();
    });
  }
}
