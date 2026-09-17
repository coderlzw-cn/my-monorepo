import { INestApplication } from "@nestjs/common";
import { LoggerMiddleware, LoggerMiddlewareOptions } from "../middleware/logger.middleware";
import { TraceIdMiddleware, TraceIdMiddlewareOptions } from "../middleware/trace-id.middleware";

// 2. 主 Option 类型，采用 boolean | ConfigObject
export interface MiddlewareSetupOptions {
  /** 链路追踪中间件，默认 true */
  traceId?: boolean | TraceIdMiddlewareOptions;
  /** 请求 HTTP 日志中间件，默认 true */
  logger?: boolean | LoggerMiddlewareOptions;
}

// 3. 辅助函数：解析 boolean | Options
function resolveOptions<T extends object>(option: boolean | T | undefined, defaultOptions: T): T | null {
  if (option === false) return null;
  if (option === true || option === undefined) return defaultOptions;
  return { ...defaultOptions, ...option };
}

// 4. 中间件工厂函数
export function setupMiddleware(app: INestApplication, options: MiddlewareSetupOptions = {}): void {
  const { traceId = true, logger = true } = options;

  // 1. 挂载 TraceId 中间件
  const traceIdConfig = resolveOptions<TraceIdMiddlewareOptions>(traceId, {
    headerName: "x-trace-id",
  });
  if (traceIdConfig) {
    const instance = new TraceIdMiddleware(traceIdConfig);
    app.use(instance.use.bind(instance));
  }

  // 2. 挂载 Logger 中间件
  const loggerConfig = resolveOptions<LoggerMiddlewareOptions>(logger, {
    logBody: false,
  });
  if (loggerConfig) {
    const instance = new LoggerMiddleware(loggerConfig);
    app.use(instance.use.bind(instance));
  }
}
