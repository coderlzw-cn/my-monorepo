# Utils

统一的共享工具包：`@workspace/utils`。按运行环境分层组织源码：

- `browser`：仅可在浏览器环境使用的工具，可使用 DOM、Web API 和 `window`。
- `node`：仅可在 Node.js 环境使用的工具，可使用 Node.js 内置模块。
- `shared`：跨浏览器和 Node.js 的工具，不依赖任一平台专属 API。

新增工具应尽量保持纯函数、类型明确且便于单元测试。需要被多个环境复用的代码优先放入 `shared`。

```ts
import { getEnvStr } from "@workspace/utils/node/env";
import { formatDateTime } from "@workspace/utils/shared/date";
```
