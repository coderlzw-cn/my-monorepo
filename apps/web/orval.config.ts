import { defineConfig } from "orval";

/**
 * OpenAPI 文档地址可在执行 Orval 时通过 ORVAL_API_URL 覆盖。
 * 默认值指向未来的本地后端，暂无服务时不会在 Web 构建中自动请求。
 */
const openApiUrl = process.env.ORVAL_API_URL ?? "http://127.0.0.1:3000/swagger-json";

export default defineConfig({
  api: {
    input: { target: openApiUrl },
    output: {
      /** 按 OpenAPI tag 拆分文件，避免单一生成文件持续膨胀。 */
      mode: "tags-split",
      target: "./src/services/generated/endpoints.ts",
      schemas: "./src/services/generated/models",
      client: "react-query",
      httpClient: "axios",
      clean: true,
      /**
       * 所有生成的请求统一通过项目 Axios 实例发送。
       */
      override: { mutator: { path: "./src/services/http/orval-request.ts", name: "orvalRequest" } },
    },
  },
});
