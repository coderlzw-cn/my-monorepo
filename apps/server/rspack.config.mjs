import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";

// 获取当前配置文件所在的绝对目录路径（ESM 环境替代 __dirname）
const configDir = path.dirname(fileURLToPath(import.meta.url));
// 判断当前是否为生产环境
const isProduction = process.env.NODE_ENV === "production";

/**
 * 判断模块请求路径是否需要直接打入 Bundle（打包到产物中）
 */
const bundleRequest = (request) =>
  request.startsWith(".") || // 相对路径
  path.isAbsolute(request) || // 绝对路径
  request.startsWith("@app/") || // 内部项目别名包
  request === "@app/common" || // 内部公共模块
  request.startsWith("@/") || // 常见路径别名
  request.startsWith("@workspace/") || // Monorepo 工作区别名包
  request.includes("@rspack/core/hot/poll"); // 热更新（HMR）轮询代码

/**
 * 健壮版 RunNodePlugin：
 * 1. 构建报错时强杀旧进程，彻底清理资源。
 * 2. 重新编译时先发送 SIGTERM 优雅退出；若超时未释放则使用 SIGKILL 强杀，解决 EADDRINUSE 端口占用。
 * 3. 不手动注册 HotModuleReplacementPlugin，避免与 devServer.hot 冲突报 Warning。
 */
function RunNodePlugin(filename = "main.js") {
  /** @type {import("node:child_process").ChildProcess | undefined} */
  let child;

  // 强杀进程辅助函数
  const killChildProcess = (force = false) => {
    if (child && !child.killed) {
      try {
        child.kill(force ? "SIGKILL" : "SIGTERM");
      } catch {
        // 忽略进程已被清理的异常
      }
      child = undefined;
    }
  };

  return {
    apply(compiler) {
      // 监听编译完成事件
      compiler.hooks.done.tap("RunNodePlugin", (stats) => {
        // 💡 修复点 1：构建存在错误时，强杀旧进程，避免卡在后台
        if (stats.hasErrors()) {
          killChildProcess(true);
          return;
        }

        // 💡 修复点 2：每次重新编译成功，先尝试优雅杀死旧进程
        killChildProcess(false);

        // 💡 修复点 3：延迟 100ms 拉起新进程，为操作系统释放网络端口（如 3000）提供缓冲时间
        setTimeout(() => {
          // 如果旧进程还卡着，直接 SIGKILL 强杀
          if (child && !child.killed) {
            killChildProcess(true);
          }

          child = spawn(process.execPath, [path.join(compiler.options.output.path ?? "", filename)], {
            stdio: "inherit", // 共享主进程的标准输入输出
          });

          // 监听子进程正常退出事件，及时释放引用
          child.on("exit", () => {
            child = undefined;
          });
        }, 100);
      });

      // 监听 Rspack 进程关闭事件（如 Ctrl+C 或 DevServer 退出）
      compiler.hooks.shutdown.tap("RunNodePlugin", () => {
        killChildProcess(true);
      });
    },
  };
}

export default defineConfig({
  context: configDir,
  target: "node",
  mode: isProduction ? "production" : "development",

  entry: {
    // 开发环境下引入 @rspack/core/hot/poll?100 实现基于轮询的 Node.js 端热更新
    main: isProduction ? "./apps/main/src/main.ts" : ["@rspack/core/hot/poll?100", "./apps/main/src/main.ts"],
  },

  output: {
    path: path.resolve(configDir, "dist"),
    filename: "main.js",
    clean: true,
  },

  resolve: {
    extensions: ["...", ".ts", ".tsx"],
    tsConfig: path.resolve(configDir, "tsconfig.json"),
    extensionAlias: {
      ".js": [".ts", ".js"],
      ".mjs": [".mts", ".mjs"],
    },
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "builtin:swc-loader",
          options: {
            detectSyntax: "auto",
            jsc: {
              parser: {
                syntax: "typescript",
                decorators: true,
              },
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
              },
            },
          },
        },
      },
    ],
  },

  externalsType: "commonjs",
  externals: [
    ({ request }, callback) => {
      if (!request || bundleRequest(request)) {
        callback();
        return;
      }
      callback(undefined, `commonjs ${request}`);
    },
  ],

  optimization: {
    minimizer: [
      new rspack.SwcJsMinimizerRspackPlugin({
        minimizerOptions: {
          compress: {
            keep_classnames: true,
            keep_fnames: true,
          },
          mangle: {
            keep_classnames: true,
            keep_fnames: true,
          },
        },
      }),
    ],
  },

  plugins: [
    // 💡 不再重复手动实例化 HotModuleReplacementPlugin，由 devServer.hot 自动注入
    !isProduction && new RunNodePlugin("main.js"),
  ].filter(Boolean),

  devServer: {
    hot: true,
    devMiddleware: {
      writeToDisk: true,
    },
  },
});
