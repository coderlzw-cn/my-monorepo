import { NestApplication, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule, {
    cors: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
