import { INestApplication } from "@nestjs/common";
import { AllExceptionsFilter, AllExceptionsFilterConfig } from "../filters/all-exceptions.filter";
// import { DatabaseExceptionFilter, DatabaseExceptionFilterConfig } from "../filters/database-exception.filter";
import { HttpExceptionFilter, HttpExceptionFilterConfig } from "../filters/http-exception.filter";

/**
 * 异常过滤器组装配配置接口
 * 支持传入 `boolean`（开关）或具体的 `Options` 配置对象
 */
export interface FilterSetupOptions {
  /** 全局捕获业务 HTTP 异常过滤器配置（默认开启） */
  httpExceptions?: HttpExceptionFilterConfig;

  /** Prisma 数据库异常过滤器配置（默认开启） */
  // databaseExceptions?: DatabaseExceptionFilterConfig;

  /** 全局未捕获异常与兜底过滤器配置（默认开启） */
  allExceptions?: AllExceptionsFilterConfig;
}

/**
 * 模块化装配全局异常过滤器 (setupFilters)
 *
 * 核心功能：
 * 1. 优先挂载 `HttpExceptionFilter`，精细化处理业务主动抛出的 `HttpException` 及参数校验错误。
 * 2. 挂载 `DatabaseExceptionFilter`，将 Prisma 异常转成明确的 HTTP 状态，并盖过兜底过滤器。
 * 3. 兜底挂载 `AllExceptionsFilter`，捕获运行时未处理的 `Error` 与 500 级系统错误。
 * 4. 统一输出带链路 `traceId` 的结构化 JSON 错误响应。
 *
 * 注意：NestJS 过滤器执行顺序为“后进先出 (LIFO)”，故 `AllExceptionsFilter` 需最先注册，
 * `DatabaseExceptionFilter` 次之，`HttpExceptionFilter` 最后注册以便优先处理 `HttpException`。
 *
 * @param app NestJS 应用实例 (`INestApplication`)
 * @param options 异常过滤器的配置对象（默认开启）
 */
export function setupFilters(app: INestApplication, options: FilterSetupOptions = {}): void {
  const { httpExceptions = true, allExceptions = true } = options;

  // 1. 挂载兜底过滤器 (AllExceptionsFilter)
  const allOpts = AllExceptionsFilter.resolveOptions(allExceptions);
  if (allOpts) {
    app.useGlobalFilters(new AllExceptionsFilter(allOpts));
  }

  // 2. 挂载数据库异常过滤器 (DatabaseExceptionFilter)
  // 后于兜底过滤器注册，Prisma 异常会优先进入此 Filter
  // const databaseOpts = DatabaseExceptionFilter.resolveOptions(databaseExceptions);
  // if (databaseOpts) {
  //   app.useGlobalFilters(new DatabaseExceptionFilter(databaseOpts));
  // }

  // 3. 挂载已知 HTTP 异常过滤器 (HttpExceptionFilter)
  // 在 NestJS 中后注册的过滤器优先级更高，因此 HttpException 会优先进入此 Filter
  const httpOpts = HttpExceptionFilter.resolveOptions(httpExceptions);
  if (httpOpts) {
    app.useGlobalFilters(new HttpExceptionFilter(httpOpts));
  }
}
