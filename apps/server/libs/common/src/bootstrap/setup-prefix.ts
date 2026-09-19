import { INestApplication, RequestMethod } from "@nestjs/common";

export function setupPrefix(app: INestApplication, prefix = "api"): void {
  if (prefix) {
    app.setGlobalPrefix(prefix, {
      exclude: [
        { path: "health", method: RequestMethod.ALL },
        { path: "health/{*path}", method: RequestMethod.ALL },
      ],
    });
  }
}
