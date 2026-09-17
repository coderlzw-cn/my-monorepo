import { SetMetadata } from "@nestjs/common";

export const TIMEOUT_METADATA_KEY = "custom_request_timeout";

/**
 * 设置指定 Handler / Controller 的请求超时时间（单位：毫秒）
 * @param timeoutMs 超时毫秒数
 *
 * @example
 * \@SetTimeout(30000)
 * \@Post('upload')
 * uploadFile() {}
 */
export const SetTimeout = (timeoutMs: number) => SetMetadata(TIMEOUT_METADATA_KEY, timeoutMs);
