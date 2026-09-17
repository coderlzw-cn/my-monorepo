import { INestApplication, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * 自动化配置 Swagger 文档
 */
export async function setupSwagger(app: INestApplication): Promise<void> {
  const logger = new Logger("SwaggerSetup");
  const configService = app.get(ConfigService);

  // 线上生产环境安全防护：默认禁用 Swagger
  const isProd = configService.get<string>("NODE_ENV") === "production";
  const enableSwaggerInProd = configService.get<boolean>("ENABLE_SWAGGER", false);

  if (isProd && !enableSwaggerInProd) {
    logger.log("Swagger documentation is disabled in production environment.");
    return;
  }

  // 获取环境变量配置
  const appName = configService.get<string>("APP_NAME", "Enterprise API Platform");
  const appDesc = configService.get<string>("APP_DESC", "NestJS Enterprise API Documentation");
  const appVersion = configService.get<string>("APP_VERSION", "1.0.0");
  const swaggerPath = configService.get<string>("SWAGGER_PATH", "docs");

  // 构建 OpenAPI 契约
  const builder = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      `${appDesc}\n\n` +
        `**标准响应结构说明**:\n` +
        `- \`200/201\`: 请求处理成功，包含追踪号 \`traceId\`。\n` +
        `- \`400\`: 请求参数错误（通过 ValidationPipe 自动校验）。\n` +
        `- \`401/403\`: 未授权或权限不足。\n` +
        `- \`500\`: 服务器内部异常。`,
    )
    .setVersion(appVersion)
    // 配置 Bearer JWT 鉴权
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "请输入 JWT Access Token (无需手动拼 Bearer 前缀)",
        in: "header",
      },
      "JWT-auth", // 对应的 @ApiBearerAuth('JWT-auth') 标识符
    )
    // 配置 API Key 鉴权（供 Server-to-Server 或 Webhook 调用）
    .addApiKey(
      {
        type: "apiKey",
        name: "x-api-key",
        in: "header",
        description: "系统间调用的 API Key",
      },
      "API-Key-auth",
    );

  // 如果项目配置了统一路由前缀 (例如 /api/v1)，确保文档显示正常
  const globalPrefix = configService.get<string>("GLOBAL_PREFIX", "");
  if (globalPrefix) {
    builder.addServer(`/${globalPrefix.replace(/^\/+|\/+$/g, "")}`);
  } else {
    builder.addServer("/");
  }

  const config = builder.build();
  const document = SwaggerModule.createDocument(app, config);

  // 挂载 Swagger UI
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 页面刷新后保留 Token 登录状态
      displayRequestDuration: true, // 显示接口响应耗时 (ms)
      filter: true, // 开启接口筛选搜索框
      docExpansion: "none", // 默认折叠所有 tag，保持页面整洁
      defaultModelsExpandDepth: 1, // 展开 Model 结构的深度
      showCommonExtensions: true,
    },
    customSiteTitle: `${appName} - API Docs`,
  });

  logger.log(`Swagger Docs path: /${swaggerPath}`);
  logger.log(`Swagger JSON Schema path: /${swaggerPath}-json`);
}
