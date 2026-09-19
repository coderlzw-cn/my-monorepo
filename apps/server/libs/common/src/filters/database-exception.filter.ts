// import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
// import { isProduction } from "@workspace/utils/node/env";
// import { Request, Response } from "express";
// import { getDatabaseErrorDetails, resolveDatabaseError } from "../../../../apps/main/src/database-error";
// import { traceStore } from "../middleware/trace-id.middleware";
// import { Prisma } from "../../../../apps/main/src/generated/prisma/client";
// /**
//  * DatabaseExceptionFilter 配置项接口
//  */
// export interface DatabaseExceptionFilterOptions {
//   /**
//    * 是否在日志中记录异常堆栈
//    * @default true
//    */
//   logStackTrace?: boolean;
// }

// /**
//  * 支持传入布尔值（开关）或配置对象
//  */
// export type DatabaseExceptionFilterConfig = boolean | DatabaseExceptionFilterOptions;

// const DEFAULT_DATABASE_FILTER_OPTIONS: DatabaseExceptionFilterOptions = {
//   logStackTrace: true,
// };

// const FALLBACK_MESSAGE = "数据库操作失败，请稍后重试";

// /**
//  * Prisma 数据库异常过滤器
//  *
//  * 只捕获 Prisma 客户端异常，文案与状态码交给 `resolveDatabaseError`。
//  * 诊断信息只写日志，不返回给客户端。
//  */
// @Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientUnknownRequestError, Prisma.PrismaClientRustPanicError, Prisma.PrismaClientInitializationError, Prisma.PrismaClientValidationError)
// export class DatabaseExceptionFilter implements ExceptionFilter {
//   private readonly logger = new Logger(DatabaseExceptionFilter.name);
//   private readonly logStackTrace: boolean;

//   constructor(options: DatabaseExceptionFilterOptions = DEFAULT_DATABASE_FILTER_OPTIONS) {
//     this.logStackTrace = options.logStackTrace ?? DEFAULT_DATABASE_FILTER_OPTIONS.logStackTrace!;
//   }

//   static resolveOptions(config?: DatabaseExceptionFilterConfig): DatabaseExceptionFilterOptions | null {
//     if (config === false) return null;
//     if (config === true || config === undefined) return DEFAULT_DATABASE_FILTER_OPTIONS;
//     return { ...DEFAULT_DATABASE_FILTER_OPTIONS, ...config };
//   }

//   catch(exception: unknown, host: ArgumentsHost): void {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();
//     const traceId = traceStore.getStore() || "N/A";

//     const resolved = resolveDatabaseError(exception);
//     const status = resolved?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
//     const message = resolved?.message ?? (isProduction || !(exception instanceof Error) ? FALLBACK_MESSAGE : exception.message);

//     const logMsg = `[${traceId}] ${request.method} ${request.originalUrl} - Status: ${status} - Message: ${message}${this.formatDetails(exception)}`;
//     if (status >= 500) {
//       this.logger.error(logMsg, this.logStackTrace && exception instanceof Error ? exception.stack : undefined);
//     } else {
//       this.logger.warn(logMsg);
//     }

//     response.status(status).json({
//       code: status,
//       message,
//       data: null,
//       error: null,
//       traceId,
//       timestamp: Date.now(),
//     });
//   }

//   private formatDetails(exception: unknown): string {
//     const details = getDatabaseErrorDetails(exception);
//     if (!details) return "";

//     const parts = [`code=${details.code}`];
//     if (details.modelName) parts.push(`model=${details.modelName}`);
//     if (details.constraintTargets.length > 0) parts.push(`target=${details.constraintTargets.join(",")}`);
//     if (details.originalCode) parts.push(`driver=${details.originalCode}`);
//     if (details.originalMessage) parts.push(`driverMessage=${details.originalMessage}`);
//     return ` - ${parts.join(" ")}`;
//   }
// }
