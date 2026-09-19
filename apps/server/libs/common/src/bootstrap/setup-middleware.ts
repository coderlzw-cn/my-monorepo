import { INestApplication } from "@nestjs/common";
import { IpAccessControlMiddleware, IpAccessControlMiddlewareConfig } from "../middleware/ip-access-control.middleware";
import { LoggerMiddleware, LoggerMiddlewareOptions } from "../middleware/logger.middleware";
import { MaintenanceModeMiddleware, MaintenanceModeMiddlewareConfig } from "../middleware/maintenance-mode.middleware";
import { TraceIdMiddleware, TraceIdMiddlewareOptions } from "../middleware/trace-id.middleware";

// 2. 主 Option 类型，采用 boolean | ConfigObject
export interface MiddlewareSetupOptions {
  /** 链路追踪中间件，默认 true */
  traceId?: boolean | TraceIdMiddlewareOptions;
  /** IP 访问控制中间件，默认 false */
  ipAccessControl?: IpAccessControlMiddlewareConfig;
  /** 维护模式中间件，默认 false */
  maintenance?: MaintenanceModeMiddlewareConfig;
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
  const { traceId = true, ipAccessControl = false, maintenance = false, logger = true } = options;

  // 1. 挂载 TraceId 中间件
  const traceIdConfig = resolveOptions<TraceIdMiddlewareOptions>(traceId, {
    headerName: "x-trace-id",
  });
  if (traceIdConfig) {
    const instance = new TraceIdMiddleware(traceIdConfig);
    app.use(instance.use.bind(instance));
  }

  // 2. 挂载 IP 访问控制中间件（默认关闭，需在 TraceId 之后以便错误响应带上 traceId）
  const ipAccessControlConfig = IpAccessControlMiddleware.resolveOptions(ipAccessControl);
  if (ipAccessControlConfig) {
    const instance = new IpAccessControlMiddleware(ipAccessControlConfig);
    app.use(instance.use.bind(instance));
  }

  // 3. 挂载维护模式中间件（默认关闭）
  const maintenanceConfig = MaintenanceModeMiddleware.resolveOptions(maintenance);
  if (maintenanceConfig) {
    const instance = new MaintenanceModeMiddleware(maintenanceConfig);
    app.use(instance.use.bind(instance));
  }

  // 4. 挂载 Logger 中间件
  const loggerConfig = resolveOptions<LoggerMiddlewareOptions>(logger, {
    logBody: false,
  });
  if (loggerConfig) {
    const instance = new LoggerMiddleware(loggerConfig);
    app.use(instance.use.bind(instance));
  }
}
