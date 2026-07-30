# 集成架构

## 定位

集成架构描述 Odyssey 如何与框架能力、UI 系统、后端服务、第三方服务、浏览器存储和构建部署环境协作。集成的目标是让外部变化被限制在清晰边界内，而不是扩散到页面和组件。

## 集成对象

当前主要集成对象包括：

- Next.js App Router
- HeroUI / HeroUI Pro
- Redux Toolkit / RTK Query
- next-intl
- next-themes
- Tiptap
- motion/react
- GSAP
- 后端 REST API
- 第三方音乐 API
- 浏览器 LocalStorage / Cookie
- Tailwind CSS / CSS variables

## Next.js 集成

Next.js 提供：

- App Router 路由。
- Server Component 默认渲染模型。
- Client Component 交互边界。
- route handler。
- rewrites。
- standalone 输出。

规则：

- 只有需要浏览器 API、状态、事件或动画的组件才使用 `"use client"`。
- 服务端 layout 负责读取 headers、Cookie 和注入初始 HTML 属性。
- route handler 只处理服务端边界问题，不承载核心业务后端。
- rewrites 用于隔离 API 部署地址。

## UI 系统集成

HeroUI 是项目 UI 基线。集成方式：

- `@heroui/react` 提供基础组件、Toast、I18nProvider。
- `@heroui-pro/react` 提供高级组件和产品化布局能力。
- Tailwind class 作为布局和局部样式补充。
- 自定义组件应保留 HeroUI 的语义、可访问性和主题能力。

禁止：

- 未记录原因引入第二套 UI 框架。
- 为 HeroUI 已覆盖的交互重新实现 primitive。
- 在模块内定义与全局主题冲突的设计 token。

## 状态系统集成

Redux Toolkit 提供全局状态模型，RTK Query 提供服务端状态缓存。

集成方式：

- `makeStore` 为客户端 Provider 创建 store。
- `combineSlices` 组合 auth、locale、ui 和 baseApi。
- `baseApi.middleware` 处理请求缓存与订阅。
- listener middleware 处理持久化副作用。
- typed hooks 隔离组件与 store 类型细节。

规则：

- 服务端数据优先使用 RTK Query。
- UI 状态才进入 ui slice。
- 持久化副作用不写在普通组件中。

## 国际化集成

`next-intl` 与 HeroUI I18nProvider 共同处理语言环境。

当前流程：

- layout 从 `accept-language` 解析语言。
- `getMessages` 获取消息。
- `NextIntlClientProvider` 向客户端提供翻译上下文。
- HeroUI `I18nProvider` 接收 locale。
- html `dir` 根据语言判断 RTL/LTR。

后续如果引入显式语言路由，应同步更新路由结构、middleware 和文档。

## 主题集成

主题系统由多个部分协作：

- `next-themes` 管理 light/dark/system。
- Redux UI slice 管理主题变体。
- Cookie 支持服务端初始渲染。
- LocalStorage 支持客户端偏好恢复。
- `theme-init-script` 降低首屏闪烁。
- html data attributes 暴露主题状态给 CSS。

主题集成要求：

- 新主题变量必须兼容 light/dark。
- 新组件应使用语义 token，不直接绑定固定颜色。
- 切换主题不得造成布局跳动。

## 编辑器集成

Tiptap 是富文本编辑器核心。

集成边界：

- 编辑器扩展集中在 `components/rich-text/extensions`。
- 编辑器 hook 管理 setup、autosave、publish。
- 发布前通过 normalizer 和 extractor 处理内容。
- API 层只接收标准化后的文章请求。

不要让普通展示组件依赖 Tiptap 编辑器实例。

## 动画集成

默认动画集成使用 `motion/react`。

适用场景：

- 组件进入/退出。
- hover/tap 反馈。
- 页面局部动效。
- 滚动进度和简单 transform。

GSAP 适用场景：

- 复杂时间线。
- 高度编排的滚动动画。
- SVG 或 canvas 级动画。
- 需要 GSAP 插件能力的场景。

引入 GSAP 动画时必须保持清理逻辑、响应式和 reduced motion 策略。

## 外部服务集成

第三方音乐 API 通过 route handler 隔离。

原则：

- 不在客户端直接暴露第三方服务细节。
- 服务端处理参数转换、协议升级、状态映射。
- 第三方失败不应影响整个站点。
- 外部 API 的不可用性必须被视为常态。

## 后端服务集成

业务后端通过 `/api/v1` 路径接入。

规则：

- 前端不关心后端部署主机。
- 开发和生产目标由环境变量与 rewrite 控制。
- 所有业务接口进入 feature API。
- 鉴权 header 由 `baseApi` 注入。

## 集成变更流程

新增或替换集成前必须完成：

- 明确问题是否不能由现有集成解决。
- 评估 SSR、RSC、bundle 和可访问性影响。
- 定义失败与降级策略。
- 明确所有权和维护成本。
- 如影响架构基线，新增 ADR。
