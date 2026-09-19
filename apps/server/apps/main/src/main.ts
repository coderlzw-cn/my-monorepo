declare const module: {
  hot?: {
    accept: () => void;
    dispose: (callback: () => void) => void;
    addStatusHandler: (callback: (status: string) => void) => void;
  };
};
import { NestApplication, NestFactory } from "@nestjs/core";

import { setupFilters, setupInterceptors, setupMiddleware, setupPipes, setupPrefix, setupSwagger } from "@app/common/bootstrap";
import { AppModule } from "./app.module";
import { Logger, VersioningType } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { appConfig } from "./config/app.config";

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule, {
    cors: true,
  });

  // 从 IoC 容器中注入已解析的强类型配置对象
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  // 1. 设置 API 前缀
  setupPrefix(app, config.apiPrefix);

  setupMiddleware(app);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // 2. 装配校验管道
  setupPipes(app, {
    validation: {
      transform: true, // <--- 关键配置：开启自动类型转换与 Class 实例化
      transformOptions: {
        enableImplicitConversion: true, // 可选：允许隐式类型转换（例如把 Query 中的字符串 "1" 自动转为数字 1）
      },
    },
  });

  // // 3. 装配拦截器（可按需开启）
  setupInterceptors(app, {
    // transform: true,
    logging: true,
    timeout: false,
  });

  // 4. 装配全局异常过滤器
  setupFilters(app);

  await setupSwagger(app);

  await app.listen(config.port, config.host);

  Logger.log(`Application is running on: ${await app.getUrl()}`, "Bootstrap");

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(async () => {
      await app.close();
    });

    // 💡 当深层中间件或全局配置导致 HMR 冒泡失败/中断 (abort) 时，强制退出进程触发重载
    module.hot.addStatusHandler((status) => {
      if (status === "abort" || status === "fail") {
        process.exit(0);
      }
    });
  }
}

void bootstrap();
