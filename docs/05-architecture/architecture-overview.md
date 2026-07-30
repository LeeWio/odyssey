# 架构总览

## 定位

Odyssey 是一个基于 Next.js App Router 的个人产品系统，当前形态包含首页体验、博客阅读、评论、音乐模块、股票/仪表盘模块、富文本发布工具和后台管理界面。它不是单一博客工程，而是一个会持续扩展为个人内容、数据与工具中枢的前端应用。

架构设计的核心目标是：在保持体验表达力的同时，让功能模块能够被独立演进、独立测试、独立接入后端能力，并避免页面级代码、业务状态和接口定义混杂。

## 技术基线

- 应用框架：Next.js App Router
- 运行模型：React Server Components 与 Client Components 混合使用
- UI 基线：HeroUI / HeroUI Pro
- 动画基线：`motion/react`，复杂滚动或时间线动画可按 ADR 引入 GSAP
- 状态管理：Redux Toolkit、RTK Query、Redux Listener Middleware
- 数据校验：Zod 运行时响应校验
- 国际化：`next-intl`
- 主题系统：`next-themes` + 自定义主题变量 + Cookie/LocalStorage 同步
- API 接入：`/api/v1/*` 通过 Next.js rewrites 转发到后端服务
- 构建输出：Next.js standalone

## 高层架构

```text
Browser
  |
  | HTML / RSC payload / client bundles
  v
Next.js App Router
  |
  | page/layout/route handlers
  v
Application Shell
  |
  | Providers: i18n, Redux, theme, toast
  v
Feature Modules
  |
  | components + hooks + RTK Query endpoints + slices
  v
API Boundary
  |
  | /api/v1 rewrite / route handlers / external APIs
  v
Backend Services / External Services / Local Data
```

## 架构原则

### 以路由组织产品表面

`app/` 目录只负责产品表面的入口、布局和路由级组合。页面不应沉淀复杂业务逻辑；一旦逻辑可复用或涉及业务规则，应下沉到 `components/`、`lib/features/` 或模块 hooks。

### 以 feature 组织业务能力

`lib/features/` 是业务数据接入和领域状态的主要边界。每个 feature 应拥有自己的 API 定义、类型、schema、缓存标签和必要的 slice。跨模块共享逻辑必须显式提升，不能通过页面之间互相导入实现复用。

### 以组件表达体验

`components/` 承载可复用 UI、模块组件、交互组件和编辑器组件。组件应优先组合 HeroUI，只有在 HeroUI 无法表达底层能力时才实现自定义 primitive。

### 以 API 层隔离后端变化

所有后端接口应通过 RTK Query endpoint 或 Next.js route handler 接入。组件不得直接散落 `fetch` 调用访问业务后端。接口响应必须通过 Zod schema 或明确的转换函数进行边界处理。

### 以持久化中间件管理本地副作用

LocalStorage、Cookie、主题同步、鉴权持久化等副作用应集中在 provider、主题工具或 middleware 中处理。业务组件不应直接复制持久化逻辑。

## 当前主要目录职责

- `app/`：路由、布局、服务端入口、route handlers
- `components/`：页面组件、业务组件、设计系统组合组件、编辑器组件
- `lib/features/`：RTK Query endpoints、Redux slices、领域类型和 API schema
- `lib/middleware/`：Redux listener middleware 与持久化逻辑
- `lib/theme.ts`、`lib/theme-init-script.ts`：主题解析、初始化和首屏防闪烁逻辑
- `config/`：站点配置、字体配置等稳定配置
- `data/`：本地演示或轻量持久化数据
- `types/`：跨模块共享的基础类型
- `docs/`：产品、设计、架构、开发和决策文档

## 关键运行链路

### 首屏加载

请求进入 `app/layout.tsx` 后，系统读取请求头和 Cookie，推导语言方向、主题模式和主题变体；随后注入主题初始化脚本，并在客户端通过 `Providers` 挂载国际化、Redux、主题和 Toast 能力。

### 数据请求

业务组件通过 feature API hook 发起请求；RTK Query 使用统一 `baseApi` 注入鉴权 header、处理 401、执行缓存和失效；响应进入组件前通过 schema 与 transform 归一化。

### 主题切换

用户主题选择写入 Redux UI slice，再由 listener middleware 同步到 LocalStorage 和 Cookie；首屏由服务端 Cookie 和内联脚本共同降低 hydration 前后的主题闪烁。

### 内容发布

富文本编辑器以 Tiptap JSON 作为编辑态内容，发布时执行内容标准化、标题/slug/摘要提取，并通过 post feature 的 mutation 创建或更新文章。

## 非目标

- 当前前端不直接承担核心业务数据库职责。
- 当前 route handler 只适合轻量代理、演示数据或外部服务适配，不应替代后端业务服务。
- 文档不把实验性模块描述为稳定平台能力，除非已有模块文档或 ADR 记录其边界。

## 演进方向

- 新模块必须先定义领域边界，再新增 UI。
- 新接口必须进入 feature API 层，并补充 schema、缓存标签和错误策略。
- 新全局状态必须证明无法由 URL、组件局部状态或 RTK Query cache 表达。
- 新 UI primitive 必须说明 HeroUI 无法满足需求的原因。
- 新外部服务接入必须记录失败策略、降级策略和数据所有权。
