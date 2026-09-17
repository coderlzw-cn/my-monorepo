import { INestApplication } from "@nestjs/common";
import { AllExceptionsFilter, AllExceptionsFilterConfig } from "../filters/all-exceptions.filter";

/**
 * 异常过滤器组装配配置接口
 * 支持传入 `boolean`（开关）或具体的 `Options` 配置对象
 */
export interface FilterSetupOptions {
  /** 全局捕获异常过滤器配置（默认开启） */
  allExceptions?: AllExceptionsFilterConfig;
}

/**
 * 模块化装配全局异常过滤器 (setupFilters)
 *
 * 核心功能：
 * 1. 统一兜底 HTTP 异常、Validation 校验错误以及系统运行时 Error。
 * 2. 格式化输出统一错误响应结构（含 code, message, error, traceId, timestamp）。
 *
 * @param app NestJS 应用实例 (`INestApplication`)
 * @param options 异常过滤器的配置对象（默认开启）
 */
export function setupFilters(app: INestApplication, options: FilterSetupOptions = {}): void {
  const { allExceptions = true } = options;

  // 装配全局未捕获异常与 HTTP 错误过滤器
  const filterOpts = AllExceptionsFilter.resolveOptions(allExceptions);
  if (filterOpts) {
    app.useGlobalFilters(new AllExceptionsFilter(filterOpts));
  }
}
