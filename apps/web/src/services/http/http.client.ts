import { useAuthStore } from "@/stores/auth.store";
import { create } from "axios";

const http = create({ timeout: 30_000 });

/**
 * 请求拦截器。
 */
http.interceptors.request.use((config) => {
  const tokens = useAuthStore.getState().tokens;
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

/**
 * 响应拦截器。
 */
http.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // 401、Token 刷新、统一错误提示等逻辑放这里。

    return Promise.reject(error);
  },
);

export default http;
