import { INestApplication } from "@nestjs/common";
import { CustomValidationPipe, CustomValidationPipeConfig } from "../pipes/validation.pipe";

/**
 * 全局管道装配配置接口
 */
export interface PipeSetupOptions {
  /** 全局校验管道配置（默认开启） */
  validation?: CustomValidationPipeConfig;
}

/**
 * 模块化装配全局管道 (setupPipes)
 *
 * 核心功能：
 * 1. 挂载自定义 `CustomValidationPipe` 处理传入 Request Payload 的校验与隐式类型转换。
 * 2. 剥离恶意注入的非 DTO 声明属性，提升应用安全性。
 *
 * @param app NestJS 应用实例 (`INestApplication`)
 * @param options 管道装配配置项
 */
export function setupPipes(app: INestApplication, options: PipeSetupOptions = {}): void {
  const { validation = true } = options;

  const pipeOpts = CustomValidationPipe.resolveOptions(validation);
  if (pipeOpts) {
    app.useGlobalPipes(new CustomValidationPipe(pipeOpts));
  }
}
