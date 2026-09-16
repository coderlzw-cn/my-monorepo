# UI

基于 shadcn/ui 的共享 React 组件包，供 monorepo 内的应用统一复用。

## 使用方式

```tsx
import { Button } from "@workspace/ui/components/button";
```

全局主题样式由应用入口引入：

```ts
import "@workspace/ui/globals.css";
```

新增组件时在仓库根目录执行：

```bash
pnpm --filter @workspace/ui exec shadcn add dialog -y
# 或
pnpm dlx shadcn@latest add button -c packages/ui
```
