import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { traceStore } from "../middleware/trace-id.middleware";

/**
 * 企业级统一响应结构接口
 */
export interface ApiResponse<T = unknown> {
  /** 业务状态码，通常 0 表示成功 */
  code: number;
  /** 响应提示信息 */
  message: string;
  /** 核心业务响应数据 */
  data: T;
  /** 全链路追踪 Trace ID */
  traceId: string;
  /** 服务器响应时间戳（单位：毫秒） */
  timestamp: number;
}

/**
 * TransformInterceptor 配置项接口
 */
export interface TransformInterceptorOptions {
  /**
   * 默认成功业务状态码
   * @default 0
   */
  successCode?: number;

  /**
   * 默认成功提示信息
   * @default 'Success'
   */
  successMessage?: string;

  /**
   * 需要跳过包装的 Response Content-Type 列表（如文件下载、流传输等）
   * @default ['application/octet-stream', 'image/', 'text/event-stream']
   */
  ignoreContentTypes?: string[];
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type TransformInterceptorConfig = boolean | TransformInterceptorOptions;

/**
 * 默认配置常量
 */
const DEFAULT_TRANSFORM_OPTIONS: TransformInterceptorOptions = {
  successCode: 0,
  successMessage: "Success",
  ignoreContentTypes: ["application/octet-stream", "image/", "text/event-stream"],
};

/**
 * 全局统一响应格式化拦截器 (TransformInterceptor)
 *
 * 核心功能：
 * 1. 拦截 Controller 返回数据，统一包装为 `ApiResponse<T>` 标准 JSON 格式。
 * 2. 从 AsyncLocalStorage (`traceStore`) 自动注入当前请求的全链路 Trace ID。
 * 3. 智能判断并跳过已经具备标准结构的响应、Buffer、Stream 流及指定 Content-Type 的文件下载接口。
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | T> {
  private readonly successCode: number;
  private readonly successMessage: string;
  private readonly ignoreContentTypes: string[];

  constructor(options: TransformInterceptorOptions = DEFAULT_TRANSFORM_OPTIONS) {
    this.successCode = options.successCode ?? DEFAULT_TRANSFORM_OPTIONS.successCode!;
    this.successMessage = options.successMessage || DEFAULT_TRANSFORM_OPTIONS.successMessage!;
    this.ignoreContentTypes = options.ignoreContentTypes || DEFAULT_TRANSFORM_OPTIONS.ignoreContentTypes!;
  }

  /**
   * 静态配置解析函数：用于 setupInterceptors 中处理 boolean | Options 配置项
   */
  static resolveOptions(config?: TransformInterceptorConfig): TransformInterceptorOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_TRANSFORM_OPTIONS;
    return { ...DEFAULT_TRANSFORM_OPTIONS, ...config };
  }

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | T> {
    // 非 HTTP 请求（如 RPC、WebSocket）跳过响应包装
    if (context.getType() !== "http") {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();

    return next.handle().pipe(
      map((data) => {
        // 1. 如果响应已经被写入/结束（例如在 Handler 中手写了 res.send/res.download），跳过包装
        if (response.headersSent) {
          return data;
        }

        // 2. 判断 Response Content-Type 是否在忽略白名单中（如文件下载、SSE 实时流）
        const contentType = (response.getHeader("content-type") as string) || "";
        if (contentType && this.ignoreContentTypes.some((type) => contentType.includes(type))) {
          return data;
        }

        // 3. 特殊数据类型跳过包装：Buffer 或 Stream 实例
        if (Buffer.isBuffer(data) || (data && typeof (data as unknown as { pipe: unknown }).pipe === "function")) {
          return data;
        }

        // 4. 如果已经符合 ApiResponse 结构（包含 code/data/traceId），避免二次包装
        if (data && typeof data === "object" && "code" in data && "data" in data && "traceId" in data) {
          return data;
        }

        // 5. 从 AsyncLocalStorage 隐式获取当前请求的 Trace ID
        const traceId = traceStore.getStore() || "N/A";

        // 6. 构造标准 API 响应对象
        return {
          code: this.successCode,
          message: this.successMessage,
          data: data ?? null,
          traceId,
          timestamp: Date.now(),
        } as ApiResponse<T>;
      }),
    );
  }
}
