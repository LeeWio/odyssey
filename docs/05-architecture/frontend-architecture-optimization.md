# 前端架构优化路线

## 优化目标

Odyssey 当前已经具备清晰的 Next.js、HeroUI、Redux Toolkit、RTK Query 和 Zod 技术基线，但历史演进形成了两套并行的前端组织方式：

- 客户端业务请求走 `lib/api/base-api.ts` 和 RTK Query。
- RSC 首屏请求在各个 `lib/features/*/public-*.ts` 中重复实现 API 地址、请求头、超时、缓存和响应校验。
- UI 组合同时分布在 `features/*` 与 `components/*`，模块所有权不总是由目录直接表达。
- `ui-slice` 集中了多个生命周期不同的 UI 状态，随着模块增加会继续变成全局杂物层。

本轮不增加兼容层，而是从边界开始直接统一实现。目标不是把所有文件机械移动，而是让新的代码只有一种正确写法，再按业务收益逐步迁移旧模块。

## 目标分层

```text
app/
  route entry and server composition
features/<domain>/
  user-facing domain UI and local interaction state
lib/features/<domain>/
  domain contracts, server/client data access and cache policy
lib/api/
  transport, authentication, locale, validation and error normalization
components/ui/
  HeroUI-based shared presentation primitives
```

依赖方向固定为：

```text
app -> features -> lib/features -> lib/api
app/components/features -> components/ui
```

数据层不得依赖页面或 UI；页面不得自行拼接后端地址；组件不得解析后端响应壳。

## 已落地：统一服务端数据边界

`lib/api/server-client.ts` 统一处理 RSC 请求的：

- API origin 和本地开发回退地址。
- `x-odyssey-prefetch`、`Accept-Language` 请求头。
- 超时、HTTP 状态和网络异常的降级结果。
- Next.js `cache`、`revalidate`、tag 配置。
- API envelope、Zod schema 和后端翻译字段归一化。

公共文章、Journal、Moments 和 Life List 首屏请求都通过这个边界访问后端。领域文件只保留 URL、schema 和缓存策略，不再复制 transport 细节。

## 后续迁移顺序

### P1：状态边界收敛

- 已将 `ui-slice` 拆为 `shell-slice` 与 `overlay-slice`；下一步继续迁移领域级 URL 状态。
- 能由 URL 表达的筛选、分页、工作区、弹层全部移出 Redux。
- 仅保留跨页面共享且没有路由语义的 UI 状态。

页面 query 更新统一通过 `lib/hooks/use-query-state.ts`，目前覆盖 Library、Chronicle、Footprints、Notifications、Blog Feed、Dashboard 和分页归一化；它负责保留无关参数、统一空值删除和 replace/push 行为。

### P2：领域模块归属收敛

- 将仍位于 `components/*` 的完整业务模块按用户能力迁入 `features/<domain>`。
- `components/*` 只保留跨领域组合组件、HeroUI 适配和编辑器基础设施。
- 通过领域 barrel 暴露公共 API，禁止页面依赖领域私有文件。

### P3：Provider 与副作用收敛

- 将主题、媒体、Toast、Redux 和 i18n Provider 拆成职责明确的 runtime provider。
- 应用入口不再修改全局 `console.error`；开发警告必须在具体依赖或组件边界处理。
- 统一持久化副作用的初始化、hydration 和失效策略。

### P4：契约与可观测性

- 统一客户端与 RSC 的错误模型、traceId 和用户可见错误映射。
- 将分页、排序、筛选参数定义为领域查询对象，避免字符串散落在页面。
- 在架构边界上增加静态依赖检查和构建产物体积检查。

## 新代码准入规则

1. Server Component 首屏数据使用 `fetchServerApiJson`；客户端交互数据使用 RTK Query。
2. 所有后端 JSON 在 API 边界完成 schema 校验和 locale 归一化。
3. 页面只做路由参数解析和组合，不持有领域请求实现。
4. 业务 UI 优先使用 HeroUI 组件组合；不为 HeroUI 组件擅自添加视觉 chrome。
5. 新增 Redux 状态必须说明为什么 URL、RTK Query cache 或组件局部 state 不能表达。
6. 新模块先建立领域目录和公共 barrel，再接入路由，避免继续扩大跨目录深层依赖。
