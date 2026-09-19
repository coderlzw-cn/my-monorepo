import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "./config/app.config";
import { PrismaModule } from "./modules/prisma/prisma.module";

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [".env", ".env.development", ".env.production"],
    }),
  ],
})
export class AppModule {}
