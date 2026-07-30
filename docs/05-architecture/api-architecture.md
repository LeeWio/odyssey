# API 架构

## 定位

API 架构负责隔离前端应用与后端服务、外部服务、本地数据源之间的变化。所有业务数据访问都应在明确的 API 边界内完成，组件只消费经过类型化和归一化的数据。

## 接入方式

项目当前存在三类 API 接入方式：

- RTK Query：主要业务后端接口。
- Next.js rewrites：将 `/api/v1/*` 转发到后端服务。
- Next.js route handlers：处理轻量代理、外部服务适配或局部演示数据。

## 统一业务 API 层

位置：`lib/features/api/base-api.ts`

`baseApi` 是所有业务 endpoint 的根。它负责：

- 使用 `NEXT_PUBLIC_API_BASE_URL` 作为客户端请求基础地址。
- 在请求前从 Redux auth state 中读取 access token。
- 自动注入 `Authorization: Bearer <token>`。
- 在 401 响应时清除本地鉴权状态。
- 提供统一 tagTypes，支撑缓存失效。
- 提供通用响应 schema 和分页 schema。
- 提供错误消息转换函数。

业务模块必须通过 `baseApi.injectEndpoints` 扩展接口，而不是创建多个互相独立的 API 实例。

## 后端代理

位置：`next.config.ts`

`/api/v1/:path*` 会被 rewrite 到后端服务：

- 开发环境默认目标：`http://127.0.0.1:8080`
- 生产容器默认目标：`http://api:8080`
- 可通过 `API_URL` 覆盖

该设计让浏览器侧代码保持稳定路径，同时允许部署层切换后端地址。

## 响应结构

业务后端的标准响应结构为：

```ts
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

分页响应结构为：

```ts
interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
```

前端 API 层必须在 `transformResponse` 中只向组件暴露业务数据本身，避免组件重复解包 `code/message/data`。

## 运行时校验

业务响应应使用 Zod schema 进行运行时校验。当前实践包括：

- `ApiResponseSchema<T>` 校验标准响应壳。
- `PageResultSchema<T>` 校验分页数据。
- feature 内定义领域 schema，例如文章、评论、分类、标签等。
- 对 nullable 字段设置合理默认值，降低组件空值分支。

新增接口时必须同步新增或复用 schema。只有当接口返回极不稳定且必须渐进接入时，才允许先使用更宽松 schema，并在文档或代码注释中说明原因。

## 缓存与失效

RTK Query tag 是业务缓存一致性的主要机制。

规则：

- 列表查询提供 `LIST` 或模块特定列表 tag。
- 详情查询提供实体 id tag。
- 创建操作失效列表 tag。
- 更新操作失效实体 id 和必要列表 tag。
- 删除操作失效实体 id、列表 tag 和受影响聚合 tag。
- 评论、文章等存在父子关系的数据，应使用业务维度 tag，例如 `POST_<id>`。

避免在 mutation 成功后手动刷新页面。优先依赖 tag invalidation 驱动数据更新。

## 错误处理

错误处理分为三层：

- API 层：将后端错误转换为稳定的错误消息。
- 组件层：根据 loading/error 状态展示空态、失败态或重试入口。
- 全局反馈层：对创建、更新、删除等操作显示 toast。

`transformError` 负责处理常见 HTTP 状态和 RTK Query 内部错误类型。组件不应重复硬编码 403、413、429、FETCH_ERROR 等错误文案，除非需要更具体的业务语义。

## Route Handler 规则

`app/*/route.ts` 适用于：

- 外部服务轻量代理。
- 服务端环境中才能执行的 Node.js 操作。
- 实验性或演示性轻量数据接口。
- 对浏览器隐藏第三方服务细节。

必须遵守：

- 校验请求参数。
- 明确返回 HTTP 状态码。
- 不泄露内部异常栈。
- 外部服务失败时提供可理解错误。
- 不把长期核心业务写入 route handler。

当前 `vae-song-stream` 属于外部音乐资源解析与轻量分享数据接口，应被视为局部模块适配层，而不是通用后端替代品。

## 安全边界

- access token 由 auth slice 管理，并通过请求头注入。
- 401 响应必须清除本地凭证。
- 组件不得自行拼接 Authorization header。
- 管理接口应由后端鉴权控制，前端只负责展示和入口约束。
- 不在客户端代码中写入私密后端密钥。

## 新 API 接入清单

新增接口时必须完成：

- 在对应 feature 目录定义 endpoint。
- 定义请求类型和响应 schema。
- 编写 `transformResponse`。
- 配置 `providesTags` 或 `invalidatesTags`。
- 复用统一错误转换。
- 在组件中只通过生成的 hook 使用接口。
- 必要时补充模块文档或 ADR。
