import { INestApplication } from "@nestjs/common";

export function setupPrefix(app: INestApplication, prefix = "api/v1"): void {
  if (prefix) {
    app.setGlobalPrefix(prefix);
  }
}
