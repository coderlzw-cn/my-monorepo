import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { ROUTES } from "@/constants/routes";
import { SYSTEM_ROLES } from "@workspace/common/constants/enum.constants";
import type { TokensVo } from "@/services/generated/models/tokensVo";
import type { AuthProfileVo } from "@/services/generated/models/authProfileVo";
import { queryClient } from "@/services/queryClient";
import { getAuthGetInitializationStatusQueryKey } from "@/services/generated/auth/auth";
import { getProfileGetProfileQueryKey } from "@/services/generated/profile/profile";
import { getSessionFindAllQueryKey } from "@/services/generated/session/session";
/** persist 的 localStorage/sessionStorage key */
const STORAGE_KEY = "auth-tokens";
/** 记住我标记的 localStorage key */
const REMEMBER_KEY = "auth-remember";

interface AuthState {
  /** 登录后签发的令牌，null 表示未登录 */
  tokens: TokensVo | null;
  /** 当前用户资料；登录守卫校验成功后写入，不持久化。 */
  profile: AuthProfileVo | null;
  // 是否记住我
  remember: boolean;
  /** 当前会话是否为游客只读模式，用于前端反馈；最终权限仍由服务端校验。 */
  isReadOnly: boolean;
  setTokens: (tokens: TokensVo, isReadOnly?: boolean) => void;
  setRememberMe: (value: boolean) => void;
  setProfile: (profile: AuthProfileVo | null) => void;
  /** 退出登录 / 令牌失效时清除 */
  clearTokens: () => void;
}

/** 仅供 Vite HMR 暂存 store；页面刷新后该数据会被清空。 */
interface AuthStoreHotData {
  authStore?: UseBoundStore<StoreApi<AuthState>>;
}

const hotData: AuthStoreHotData | undefined = import.meta.hot?.data;

/**
 * 认证状态（zustand + devtools + subscribeWithSelector + persist）
 *
 * - 勾选"记住我"→ 令牌存 localStorage，跨会话保持登录态；
 *   未勾选 → 存 sessionStorage，关闭浏览器登录态即失效
 * - 非组件环境（如 axios 拦截器）通过 useAuthStore.getState() 读取
 * - 开发环境可在 Redux DevTools 中查看状态变化（instance 名为 AuthStore）
 * - subscribeWithSelector 支持精确订阅单个字段：
 *   useAuthStore.subscribe(state => state.tokens, (tokens, prev) => ...)
 */
const createAuthStore = () =>
  create<AuthState>()(
    devtools(
      subscribeWithSelector(
        persist(
          (set, get) => ({
            tokens: null,
            profile: null,
            isReadOnly: false,
            remember: false,
            // set 的第三个参数是 devtools 里显示的 action 名称
            setTokens: (tokens, isReadOnly = get().isReadOnly) => set({ isReadOnly, tokens }, undefined, "auth/setTokens"),
            setProfile: (profile) => set({ isReadOnly: profile?.systemRole.key === SYSTEM_ROLES.GUEST.key, profile }, undefined, "auth/setProfile"),
            clearTokens: () => set({ isReadOnly: false, profile: null, tokens: null }, undefined, "auth/clearTokens"),
            setRememberMe: (value) => set({ remember: value }, undefined, "auth/setRememberMe"),
          }),
          {
            name: STORAGE_KEY,
            // 只持久化 tokens，避免以后新增的临时字段被误存进 localStorage
            partialize: (state) => ({ isReadOnly: state.isReadOnly, tokens: state.tokens }),
            // 工厂函数在每次读写时都会执行，所以能根据"记住我"标记实时切换存储位置
            storage: createJSONStorage(() => (localStorage.getItem(REMEMBER_KEY) === "1" ? localStorage : sessionStorage)),
          },
        ),
      ),
      { name: "AuthStore", enabled: import.meta.env.DEV },
    ),
  );

// HMR 会重新执行本模块；复用同一实例可保留未持久化的 profile 状态。
export const useAuthStore = hotData?.authStore ?? createAuthStore();

// 登录态被清除时（退出登录、token 失效），路由自动跳转到登录页并清理认证缓存。
let previousTokens = useAuthStore.getState().tokens;
const unsubscribeTokenListener = useAuthStore.subscribe((state) => {
  const tokens = state.tokens;

  if (previousTokens && !tokens) {
    // 不静态导入 router：router -> guards -> auth.store 已依赖本模块，
    // 静态反向依赖会在 HMR 时产生两个不同的 store 实例。
    void import("@/router").then(({ default: router }) => {
      router.navigate(ROUTES.LOGIN, { replace: true });
      queryClient.removeQueries({ queryKey: getAuthGetInitializationStatusQueryKey() });
      queryClient.removeQueries({ queryKey: getProfileGetProfileQueryKey() });
      queryClient.removeQueries({ queryKey: getSessionFindAllQueryKey() });
    });
  }

  previousTokens = tokens;
});

if (import.meta.hot) {
  import.meta.hot.dispose((data) => {
    // 下一次模块执行会重新注册监听，先清理当前闭包避免重复处理登出。
    unsubscribeTokenListener();
    data.authStore = useAuthStore;
  });
}
