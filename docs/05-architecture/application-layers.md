# 应用分层

## 目标

应用分层用于明确代码职责，降低页面、组件、状态、接口之间的耦合。任何新增功能都应先判断自己属于哪一层，再决定文件位置、依赖方向和测试方式。

## 分层模型

```text
Route Layer
  -> Composition Layer
    -> Feature UI Layer
      -> Feature Data Layer
        -> API Boundary
          -> Backend / External Service

Shared Infrastructure
  -> theme, store, middleware, utils, config, types
```

## Route Layer

位置：`app/`

职责：

- 定义 URL 结构、layout、metadata 和 route handlers。
- 完成页面级组合，而不是沉淀业务规则。
- 区分 Server Component 和 Client Component 的边界。
- 执行路由参数解析、基础重定向和轻量入口校验。

约束：

- 页面文件不应直接维护复杂表单逻辑。
- 页面文件不应重复定义 API 请求。
- 页面文件不应实现可复用 UI primitive。
- route handler 不应承载长期核心业务逻辑，除非有 ADR 说明。

## Composition Layer

位置：`components/*` 中的页面组合组件，例如 blog、dashboard、home、music、rich-text 等目录。

职责：

- 将业务组件、UI 组件、数据 hooks 和交互状态组合为完整模块。
- 承接产品信息架构和交互流程。
- 管理模块内部的布局、空态、加载态和错误态。

约束：

- 不直接拼接后端 URL。
- 不绕过 feature API hook 访问业务接口。
- 不把跨模块通用逻辑隐藏在单个模块目录内。

## Feature UI Layer

位置：`components/<feature>/`

职责：

- 表达某一业务能力的可复用视图。
- 通过 props、feature hooks 或上下文接收数据。
- 处理局部交互，例如展开、选中、输入、筛选和弹层开关。

约束：

- 优先使用 HeroUI 组件组合。
- 组件 API 应稳定、显式、可预测。
- 只在必要时持有局部状态，避免复制服务端状态。

## Feature Data Layer

位置：`lib/features/<feature>/`

职责：

- 定义领域 API endpoints。
- 定义请求类型、响应类型和 Zod schema。
- 管理 RTK Query 缓存标签、失效策略和响应转换。
- 定义必须跨组件共享的领域状态 slice。

约束：

- 一个 feature 不应直接修改另一个 feature 的内部状态。
- 跨 feature 的行为应通过公共 action、公共 selector 或上层编排完成。
- API 响应必须在边界处归一化，组件不应承担后端兼容逻辑。

## API Boundary

位置：`lib/features/api/base-api.ts`、`next.config.ts` rewrites、`app/*/route.ts`

职责：

- 统一配置 API base URL、鉴权 header 和基础错误处理。
- 通过 `/api/v1/*` rewrite 隔离前端与后端部署地址。
- 为外部服务或特殊数据源提供轻量 route handler。

约束：

- 业务接口优先走 RTK Query。
- route handler 调用外部服务时必须处理参数校验、网络错误和返回状态。
- 不在组件内硬编码生产后端地址。

## Shared Infrastructure

位置：`lib/`、`config/`、`types/`、`hooks/`

职责：

- 应用级 store、middleware、主题、工具函数和共享类型。
- 与业务无关或跨业务复用的基础能力。
- App Provider、主题初始化、防闪烁、持久化同步。

约束：

- shared 层不能依赖具体页面。
- shared 层不能隐藏业务决策。
- 工具函数必须保持小而稳定，避免成为无边界的杂物层。

## 依赖方向

允许：

- `app` -> `components`
- `app` -> `lib`
- `components` -> `lib/features`
- `components` -> `components/ui`
- `lib/features/<feature>` -> `lib/features/api`
- `lib/features/<feature>` -> `types`

禁止：

- `lib/features` 依赖 `app`
- `lib/features` 依赖页面组件
- 通用组件依赖具体业务页面
- 组件绕过 API 层直接访问业务后端
- 多个 feature 通过互相导入内部文件形成循环依赖

## 新功能落位规则

- 新页面：先放入 `app/`，复杂 UI 立即下沉到 `components/<feature>/`。
- 新后端接口：放入 `lib/features/<feature>/<feature>-api.ts`。
- 新全局 UI 状态：放入 `ui-slice`，但必须证明是跨页面或跨模块状态。
- 新领域状态：放入对应 feature slice。
- 新通用视觉组件：放入 `components/ui/`，并遵循 HeroUI 组合优先原则。
- 新配置：放入 `config/`，避免散落在组件中。
