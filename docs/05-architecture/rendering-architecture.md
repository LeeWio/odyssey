# 渲染架构

## 定位

渲染架构定义 Odyssey 如何在 Next.js App Router 中使用 Server Components、Client Components、layout、providers 和 route handlers。目标是在保证交互丰富度的同时，控制客户端 bundle、避免 hydration 问题，并保持首屏稳定。

## 渲染模型

Next.js App Router 默认使用 Server Components。只有满足以下条件才应声明 `"use client"`：

- 使用 React state 或 effect。
- 使用浏览器 API。
- 使用事件处理。
- 使用动画 hook。
- 使用 Redux hook、RTK Query hook 或 theme hook。
- 使用需要客户端上下文的 UI 组件。

## 根布局

`app/layout.tsx` 是服务端入口，负责：

- 定义 metadata 和 viewport。
- 读取请求 headers。
- 解析 `accept-language`。
- 读取 Cookie 中的主题状态。
- 设置 html `lang`、`dir`、主题 data attributes 和 class。
- 注入主题初始化脚本。
- 挂载全局 providers、navbar、global control、footer。

根布局不应包含业务页面逻辑，也不应直接发起业务数据请求。

## Providers

`app/providers.tsx` 是客户端 provider 边界，负责：

- HeroUI I18nProvider。
- NextIntlClientProvider。
- Redux Provider。
- NextThemesProvider。
- ThemeRootSync。
- RTK Query listener setup。

所有依赖客户端上下文的全局能力都应在此边界下运行。不要在多个页面重复创建 store 或 theme provider。

## Server Component 使用规则

适合 Server Component：

- 静态布局。
- metadata。
- 读取 headers、cookies。
- 无交互页面壳。
- 轻量参数解析。

不适合 Server Component：

- 使用 Redux hook。
- 使用 RTK Query generated hook。
- 使用 motion hook。
- 访问 window、document、localStorage。
- 处理用户事件。

## Client Component 使用规则

适合 Client Component：

- 首页复杂动效。
- 文章列表交互。
- 评论输入和回复。
- 富文本编辑器。
- dashboard 管理界面。
- 主题切换。
- 命令面板。

约束：

- Client Component 应尽可能下沉到需要交互的最小范围。
- 不要因为一个按钮让整个页面变成客户端组件。
- 大型客户端模块应保持清晰边界，避免污染根布局。

## Hydration 策略

主题和语言是最容易造成 hydration 不一致的部分。

当前策略：

- 服务端根据 Cookie 写入初始主题。
- `beforeInteractive` 脚本尽早同步主题 class 和 data attributes。
- `suppressHydrationWarning` 用于 html 上可预期的主题差异。
- 客户端 `ThemeRootSync` 统一最终状态。

新增首屏相关逻辑时必须评估 hydration 风险。

## 数据渲染策略

当前业务数据主要在客户端通过 RTK Query 获取。这适合 dashboard、评论、编辑器和需要鉴权状态的交互模块。

对于未来可公开缓存的内容详情，可以评估 Server Component 数据获取，但必须同时解决：

- API 鉴权边界。
- 缓存失效。
- schema 校验。
- 与客户端 RTK Query cache 的一致性。
- 错误边界。

未完成上述设计前，不要随意混用两套数据获取策略。

## Route Handler 渲染边界

route handler 不参与 UI 渲染，但属于 Next.js 服务端运行时能力。它适合处理：

- 外部 API 代理。
- 重定向。
- JSON 数据接口。
- Node.js 文件操作。

route handler 返回的数据必须由客户端组件明确消费，不应和页面渲染逻辑混在一起。

## 动画与渲染

动画组件通常是 Client Component。

规则：

- 首屏关键文本和布局不应依赖动画完成后才可见。
- 动画应使用 transform 和 opacity 优先。
- 滚动动画应避免强制同步布局。
- 背景动画不得阻塞内容交互。
- 必须考虑 reduced motion。

## 性能约束

- 避免不必要的 `"use client"` 上移。
- 避免在根 provider 中引入重型模块。
- 编辑器、复杂 dashboard 和实验模块应按路由或组件自然拆包。
- 图片域名必须在 Next config 中显式允许。
- 第三方视觉库应评估 bundle 成本。

## 新页面渲染检查清单

- 页面是否真的需要客户端渲染？
- 哪些部分可以保持 Server Component？
- 数据是在服务端还是客户端获取？
- 是否会引入 hydration 差异？
- 是否需要 loading、error 和 empty 状态？
- 是否影响根 layout？
- 是否引入重型依赖到公共 bundle？
