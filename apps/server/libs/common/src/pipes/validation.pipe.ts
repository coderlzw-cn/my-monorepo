import { BadRequestException, Injectable, ValidationError, ValidationPipe as NestValidationPipe, ValidationPipeOptions as NestValidationPipeOptions } from "@nestjs/common";

/**
 * CustomValidationPipe 配置项接口
 */
export interface CustomValidationPipeOptions extends NestValidationPipeOptions {
  /**
   * 是否对 class-validator 抛出的错误信息进行扁平化提取
   * @default true
   */
  flattenErrors?: boolean;
}

/**
 * 支持传入布尔值（开关）或配置对象
 */
export type CustomValidationPipeConfig = boolean | CustomValidationPipeOptions;

/**
 * 默认企业级 ValidationPipe 配置常量
 */
const DEFAULT_VALIDATION_OPTIONS: CustomValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  disableErrorMessages: false,
  flattenErrors: true,
};

/**
 * 企业级校验管道 (CustomValidationPipe)
 *
 * 核心功能：
 * 1. 继承 NestJS 原生 ValidationPipe，保留类型转换 (transform) 与白名单过滤 (whitelist) 能力。
 * 2. 重写 exceptionFactory，递归提取深层嵌套字段的校验错误，并格式化为友好的字符串数组/映射表。
 */
@Injectable()
export class CustomValidationPipe extends NestValidationPipe {
  constructor(options: CustomValidationPipeOptions = DEFAULT_VALIDATION_OPTIONS) {
    super({
      ...options,
      exceptionFactory: (errors: ValidationError[]) => {
        if (options.flattenErrors) {
          const messages = CustomValidationPipe.formatErrors(errors);
          return new BadRequestException({
            message: messages.join("; "),
            errors: messages,
          });
        }

        if (options.exceptionFactory) {
          return options.exceptionFactory(errors);
        }

        return new BadRequestException(errors);
      },
    });
  }

  /**
   * 静态配置解析函数：用于 setupPipes 中处理 boolean | Options 配置项
   */
  static resolveOptions(config?: CustomValidationPipeConfig): CustomValidationPipeOptions | null {
    if (config === false) return null;
    if (config === true || config === undefined) return DEFAULT_VALIDATION_OPTIONS;
    return { ...DEFAULT_VALIDATION_OPTIONS, ...config };
  }

  /**
   * 递归格式化 class-validator 校验错误树
   */
  private static formatErrors(errors: ValidationError[], parentPath = ""): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      const propertyPath = parentPath ? `${parentPath}.${error.property}` : error.property;

      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.formatErrors(error.children, propertyPath));
      }
    }

    return messages;
  }
}
