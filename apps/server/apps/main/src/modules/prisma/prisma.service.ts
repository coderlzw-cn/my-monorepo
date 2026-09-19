import { Injectable, Logger } from "@nestjs/common";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaMariaDb({
      host: "127.0.0.1", // your database host
      user: "root", // your database username
      password: "your_password", // your database password
      database: "your_database", // optional, your database name

      // 连接池及超时限制
      connectionLimit: 10,
      // 1. 设置 TCP 建立连接的超时时间 (3秒)
      connectTimeout: 3000,
      // 2. 设置从池中获取连接的等待超时时间 (3秒)
      acquireTimeout: 3000,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    super({ adapter });
  }
}
