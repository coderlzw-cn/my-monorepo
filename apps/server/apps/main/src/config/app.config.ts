import { registerAs } from "@nestjs/config";
import { getEnvNum, getEnvStr } from "@workspace/utils/node/env";
export const appConfig = registerAs("app", () => ({
  host: getEnvStr("MAIN_HOST", "127.0.0.1"),
  port: getEnvNum("MAIN_PORT", 3000),
  apiPrefix: "api",
  env: getEnvStr("NODE_ENV", "development"),
}));
