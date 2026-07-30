# 依赖规则

## 目标

依赖规则用于防止项目在持续扩展中形成循环依赖、隐式耦合和不可维护的跨层调用。每个模块必须清楚自己可以依赖什么、不能依赖什么。

## 总原则

依赖只能从外层流向内层、从具体流向抽象、从页面组合流向领域能力。领域能力不应反向依赖页面或视觉实现。

```text
app
  -> components
    -> lib/features
      -> lib/features/api
        -> types / utils

components
  -> components/ui
  -> config
  -> hooks
```

## 允许依赖

- `app/*` 可以依赖 `components/*`、`lib/*`、`config/*`。
- 页面组合组件可以依赖 feature UI、feature hooks 和共享 UI。
- feature UI 可以依赖对应 feature API hook。
- feature API 可以依赖 `baseApi`、`types`、Zod 和必要的相邻基础 schema。
- Redux store 可以组合 slices 和 `baseApi`。
- middleware 可以依赖 action、selector 和主题工具。
- `components/ui` 可以依赖 HeroUI、motion 和通用工具。

## 禁止依赖

- `lib/features/*` 禁止依赖 `app/*`。
- `lib/features/*` 禁止依赖 `components/*`。
- `components/ui` 禁止依赖具体业务 feature。
- route handler 禁止依赖客户端组件。
- shared utils 禁止依赖业务 API。
- feature 之间禁止通过内部文件互相修改状态。
- 不允许为了方便从深层路径导入另一个模块的私有实现。

## Feature 公开面

每个 feature 应通过 `index.ts` 暴露稳定 API。外部模块优先从 feature 入口导入，而不是直接导入内部文件。

推荐：

```ts
import { useGetPostsQuery } from "@/lib/features/post";
```

谨慎：

```ts
import { useGetPostsQuery } from "@/lib/features/post/post-api";
```

禁止：

```ts
import { SomeInternalHelper } from "@/lib/features/post/internal/helper";
```

如果 feature 入口未导出所需能力，应先判断该能力是否真的应该公开。

## 组件依赖规则

组件分为三类：

- 通用 UI：`components/ui`
- 业务组件：`components/<feature>`
- 页面组合组件：靠近具体产品表面的模块组件

规则：

- 通用 UI 不知道业务。
- 业务组件知道自己的业务 feature。
- 页面组合组件可以编排多个业务组件。
- 不要让低层组件导入高层组件。
- 不要用全局组件目录隐藏单页一次性实现。

## 状态依赖规则

- 组件通过 generated hooks 使用 RTK Query。
- 组件通过 typed hooks 使用 Redux。
- 不直接从 store 文件中读取 state。
- 不在非 React 业务工具中直接访问 Redux store。
- middleware 可以监听 action，但不应包含复杂业务编排。

## 样式依赖规则

- HeroUI 是组件语义和交互基线。
- Tailwind class 用于布局、间距、响应式和局部视觉表达。
- CSS 变量用于主题和跨组件视觉 token。
- 不允许模块私自定义与全局主题冲突的颜色系统。
- 自定义 primitive 必须保持 HeroUI 的可访问性和主题能力。

## 动画依赖规则

- 组件级动画优先使用 `motion/react`。
- 复杂时间线、滚动驱动、SVG 绘制或高性能序列动画可引入 GSAP。
- 动画工具选择必须由交互需求决定，而不是个人偏好。
- 动画组件不得阻塞核心内容渲染。
- 必须尊重 reduced motion。

## 外部依赖规则

新增依赖前必须回答：

- 是否已有依赖可以满足？
- 是否会扩大客户端 bundle？
- 是否影响 SSR 或 RSC？
- 是否与 HeroUI、React 19、Next.js 兼容？
- 是否需要服务端能力或浏览器特定能力？
- 是否会引入新的状态模型或样式体系？

新增 UI 框架、状态库、动画库、编辑器或数据请求库必须通过 ADR 记录。

## 循环依赖处理

一旦出现循环依赖，优先按以下顺序处理：

- 抽出共享类型到 `types/` 或 feature 入口。
- 抽出纯函数到 `lib/` 中更低层位置。
- 通过参数注入替代直接导入。
- 将跨模块编排上移到页面组合层。
- 拆分 feature 边界。

不要通过动态导入掩盖架构循环，除非目标确实是性能拆包而不是逃避依赖问题。

## 代码审查检查项

- 依赖方向是否正确？
- 是否有组件直接访问业务后端？
- 是否有 feature 导入页面或组件？
- 是否有通用组件依赖业务类型？
- 是否新增了不必要的全局状态？
- 是否引入了新的视觉或动画体系？
- 是否可以通过 feature 入口暴露稳定能力？
