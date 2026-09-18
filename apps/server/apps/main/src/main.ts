declare const module: { hot?: { accept: () => void; dispose: (callback: () => void) => void } };

import { NestApplication, NestFactory } from "@nestjs/core";

import { setupSwagger } from "@app/common/bootstrap";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule, {
    cors: true,
  });

  // 1. 设置 API 前缀
  // setupPrefix(app, "api/v1");

  // // 2. 装配校验管道
  // setupPipes(app);

  // // 3. 装配拦截器（可按需开启）
  // setupInterceptors(app, {
  //   transform: true,
  //   logging: true,
  //   timeout: true,
  // });

  // 4. 装配全局异常过滤器
  // setupFilters(app);

  await setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);

  Logger.log(`Application is running on: ${await app.getUrl()}`, "Bootstrap");

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => {
      void app.close();
    });
  }
}

void bootstrap();
