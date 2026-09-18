// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

const bundleRequest = (request) =>
  request.startsWith(".") ||
  path.isAbsolute(request) ||
  request.startsWith("@app/") ||
  request === "@app/common" ||
  request.startsWith("@/") ||
  request.startsWith("@workspace/") ||
  request.includes("@rspack/core/hot/poll");

function RunNodePlugin(filename = "main.js") {
  /** @type {import("node:child_process").ChildProcess | undefined} */
  let child;
  let started = false;

  return {
    apply(compiler) {
      compiler.hooks.done.tap("RunNodePlugin", (stats) => {
        if (started || stats.hasErrors()) {
          return;
        }

        started = true;
        child = spawn(process.execPath, [path.join(compiler.options.output.path ?? "", filename)], {
          stdio: "inherit",
        });
      });

      compiler.hooks.shutdown.tap("RunNodePlugin", () => {
        child?.kill("SIGTERM");
      });
    },
  };
}

export default defineConfig({
  context: configDir,
  target: "node",
  mode: isProduction ? "production" : "development",
  entry: {
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
  plugins: [!isProduction && new RunNodePlugin("main.js")].filter(Boolean),
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
  },
});
