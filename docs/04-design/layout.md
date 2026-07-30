# Layout

## 定位

Layout 用于定义页面内容如何组织、对齐和响应不同视口。

在 Odyssey 中，布局不是单个页面的临时实现，而是产品结构的一部分。

所有页面都应建立在统一的 Container、Grid、Column 和 Responsive System 之上，使新增模块能够自然融入现有产品，而不是重新设计一套页面结构。

---

## 核心原则

### 布局表达内容关系

布局的首要职责，是表达内容之间的关系。

例如：

- 主内容应拥有最高视觉优先级。
- 导航和辅助信息不应与正文竞争。
- 相关内容应在空间上保持接近。
- 次要内容应通过位置、宽度和层级自然弱化。
- 操作区域应靠近它所影响的内容。

页面结构应帮助用户理解内容，而不是仅仅填满屏幕。

---

### 页面拥有布局，组件拥有内容

页面或 Layout Component 负责决定：

- 列数。
- 列宽。
- 区域顺序。
- 响应式变化。
- 页面间距。
- Container 宽度。

业务组件只负责自身内容和内部结构。

错误：

```tsx
export function ArticleSidebar() {
  return <aside className="w-[280px] xl:col-start-1">...</aside>;
}
```

正确：

```tsx
export function ArticleSidebar() {
  return <aside>...</aside>;
}
```

由页面决定其位置：

```tsx
<div className="grid xl:grid-cols-[280px_minmax(0,1fr)_280px]">
  <ArticleSidebar />
  <ArticleContent />
  <ArticleOutline />
</div>
```

子组件不应知道自己位于左栏、右栏或第几列。

---

### 使用布局系统，而不是位置补丁

布局应优先使用：

- CSS Grid。
- Flexbox。
- Container。
- Gap。
- Alignment。
- Responsive Utilities。

避免使用：

- 任意 Margin 补偿。
- Absolute Positioning。
- Transform 位移。
- 空白元素。
- 固定坐标。

正确：

```tsx
<div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
  <Sidebar />
  <MainContent />
</div>
```

不推荐：

```tsx
<Sidebar className="absolute left-8 top-24" />
<MainContent className="ml-[320px]" />
```

绝对定位只应用于脱离正常文档流的视觉元素，而不是常规页面结构。

---

## 技术基线

项目布局主要由 Tailwind CSS 实现。

HeroUI 负责：

- 组件结构。
- 交互状态。
- 语义。
- 无障碍能力。
- 主题行为。

Tailwind 负责：

- Container。
- Grid。
- Flex。
- Gap。
- Alignment。
- Responsive Layout。
- Positioning。
- Width 与 Height Constraints。

两者职责应保持清晰。

例如：

```tsx
<div className="grid gap-6 lg:grid-cols-2">
  <Card />
  <Card />
</div>
```

Card 的内部行为由 HeroUI 管理，Card 之间的布局关系由 Tailwind 管理。

---

## 页面结构

页面应尽量遵循以下层级：

```text
App Shell
└── Page
    └── Page Container
        └── Page Header
        └── Main Layout
            └── Section
                └── Content Group
                    └── Component
```

每一层只管理自己的职责。

### App Shell

负责全局结构：

- Header。
- Navigation。
- Footer。
- Global Overlay。
- Command Menu。
- 全局背景。
- 页面最小高度。

### Page

负责页面语义和页面级状态。

例如：

- 首页。
- 文章列表页。
- 文章详情页。
- 编辑器页面。
- 用户页面。

### Page Container

负责：

- 最大宽度。
- 水平内边距。
- 页面居中。
- 响应式边界。

### Main Layout

负责：

- 单栏、双栏或三栏结构。
- Sidebar。
- Main Content。
- Secondary Content。
- 列间距。
- 响应式折叠顺序。

### Section

负责页面中的内容区域。

例如：

- Hero。
- Featured Articles。
- Music。
- Stock。
- Comments。
- Related Content。

Section 不应自行决定整个页面的最大宽度。

---

## Container System

所有常规页面都应使用统一的 Page Container。

推荐基础结构：

```tsx
<div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 xl:px-8">{children}</div>
```

Container 负责：

- 页面居中。
- 保持统一的左右边距。
- 限制超宽屏上的内容扩张。
- 为不同页面提供一致的布局边界。

---

### Container 不等于内容宽度

Page Container 定义页面可使用的最大空间，但不同内容可以有不同的阅读宽度。

例如：

```tsx
<div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 xl:px-8">
  <article className="mx-auto max-w-3xl">
    <ArticleContent />
  </article>
</div>
```

这里：

- `max-w-screen-2xl` 管理页面边界。
- `max-w-3xl` 管理文章阅读宽度。

不要为了缩窄正文而缩窄整个页面 Container。

---

### 全宽区域

背景、装饰和沉浸式模块可以突破内容 Container，但其核心内容仍应与页面网格对齐。

推荐：

```tsx
<section className="bg-default-100 w-full">
  <div className="mx-auto max-w-screen-2xl px-4 py-16 md:px-6 xl:px-8">
    <SectionContent />
  </div>
</section>
```

背景全宽，内容保持统一对齐。

---

## Grid System

复杂页面优先使用 CSS Grid。

适用于：

- 多栏页面。
- 卡片列表。
- Dashboard。
- Article Layout。
- Sidebar Layout。
- 非对称布局。

示例：

```tsx
<div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
  <Sidebar />
  <Main />
</div>
```

三栏文章页面：

```tsx
<div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px] 2xl:grid-cols-[320px_minmax(0,1fr)_320px]">
  <ArticleSidebar />
  <ArticleContent />
  <ArticleOutline />
</div>
```

主内容列必须使用：

```text
minmax(0, 1fr)
```

这可以避免长文本、代码块或媒体内容撑破 Grid。

---

## Flex System

Flexbox 适用于单一方向上的排列与对齐。

适用：

- Navigation。
- Button Group。
- Metadata。
- Toolbar。
- Header Actions。
- Avatar 与用户信息。
- 单行或单列内容。

示例：

```tsx
<header className="flex items-center justify-between gap-4">
  <Brand />
  <Navigation />
  <Actions />
</header>
```

当布局需要明确的二维列关系时，应使用 Grid，而不是通过多个 Flex 容器模拟 Grid。

---

## Column System

项目页面主要使用以下布局类型。

### Single Column

适用于：

- 登录。
- 设置。
- 编辑流程。
- 简单表单。
- 独立阅读页面。

```tsx
<main className="mx-auto w-full max-w-3xl">
  <Content />
</main>
```

---

### Main + Sidebar

适用于：

- 文章列表。
- 搜索。
- 分类页。
- 用户页面。
- 带辅助导航的内容页。

```tsx
<div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
  <Sidebar />
  <MainContent />
</div>
```

主内容始终拥有更高优先级。

---

### Main + Secondary Panel

适用于：

- 内容加目录。
- 内容加相关信息。
- 编辑器加属性面板。
- 主列表加筛选结果。

```tsx
<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
  <MainContent />
  <SecondaryPanel />
</div>
```

Secondary Panel 不应占据过多页面宽度。

---

### Three Column

适用于文章详情等信息层级明确的页面。

```text
Navigation / Context
Main Content
Outline / Secondary Information
```

示例：

```tsx
<div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px] 2xl:grid-cols-[320px_minmax(0,1fr)_320px]">
  <ArticleSidebar />
  <ArticleContent />
  <ArticleOutline />
</div>
```

三栏不是默认布局，只在左右辅助内容都具有持续价值时使用。

---

## 主内容优先级

主内容应始终获得最稳定的空间。

布局时应优先保证：

1. 主内容完整显示。
2. 核心操作可访问。
3. 正文保持合理阅读宽度。
4. 辅助内容在空间不足时折叠或移动。
5. 装饰内容最后被移除。

不要为了保留 Sidebar 而压缩主内容至不可阅读。

---

## 响应式策略

响应式布局不是缩小桌面版，而是重新组织信息优先级。

设计顺序应为：

```text
Mobile
↓
Tablet
↓
Desktop
↓
Wide Screen
```

每个断点都应回答：

- 哪些内容必须保留？
- 哪些内容可以折叠？
- 哪些内容应该重新排序？
- 哪些操作应该改变呈现方式？
- 主内容是否仍然可读？

---

### Mobile

移动端默认使用单栏。

优先保留：

- 页面标题。
- 主内容。
- 核心操作。
- 必要导航。

辅助内容可以：

- 移动到正文之后。
- 收入 Sheet。
- 收入 Popover。
- 收入 Action Bar。
- 隐藏非必要装饰。

示例：

```tsx
<div className="grid grid-cols-1">
  <MainContent />
</div>
```

移动端不应直接保留桌面端三栏结构。

---

### Tablet

平板设备可以使用：

- 单栏宽内容。
- 主内容加窄 Sidebar。
- 可折叠辅助面板。

示例：

```tsx
<div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
```

---

### Desktop

桌面端可以呈现完整页面结构。

例如：

- Main + Sidebar。
- Three Column。
- Sticky Panel。
- Expanded Navigation。

桌面布局仍需要限制正文宽度，不能因为屏幕更宽而无限拉长文章行宽。

---

### Wide Screen

超宽屏的目标不是让内容无限扩张，而是增加呼吸空间。

应优先：

- 增加页面边距。
- 增加列间距。
- 调整辅助栏宽度。
- 保持主内容阅读宽度稳定。

不应：

- 无限增加文章宽度。
- 拉伸卡片内容。
- 让导航与正文相距过远。
- 仅为了填满屏幕而新增内容。

---

## Responsive Code Standards

推荐：

```tsx
<div
  className="
    grid
    grid-cols-1
    gap-6
    lg:grid-cols-[240px_minmax(0,1fr)]
    lg:gap-8
    xl:grid-cols-[280px_minmax(0,1fr)_280px]
  "
>
```

不推荐：

```tsx
<div
  className="
    grid
    grid-cols-[173px_1fr]
    gap-[19px]
    min-[1137px]:grid-cols-[283px_743px_271px]
  "
>
```

应优先使用项目已有的 Tailwind Breakpoints 和 Spacing Scale。

任意断点和任意列宽都应视为例外。

---

## Breakpoint 原则

项目使用 Tailwind 提供的响应式 Breakpoints。

常规布局优先使用：

```text
sm
md
lg
xl
2xl
```

禁止为单个组件大量创建：

```text
min-[927px]
max-[1183px]
min-[1367px]
```

允许使用任意断点的情况：

- 组件在特定宽度发生真实布局破坏。
- 第三方内容具有固定宽度要求。
- 特殊设备需要明确兼容。
- 已记录在模块文档或 ADR 中。

断点应根据内容是否适配决定，而不是根据某个具体设备型号决定。

---

## Width 规范

宽度应优先使用：

- `w-full`
- `min-w-0`
- `max-w-*`
- Grid Track
- Flex Basis
- `minmax()`

避免固定宽度：

```tsx
<div className="w-[742px]">
```

推荐：

```tsx
<div className="w-full max-w-3xl">
```

固定宽度只适用于：

- Icon。
- Avatar。
- 明确尺寸的媒体资源。
- Sidebar 等设计系统中稳定的辅助区域。
- 与硬件或第三方内容绑定的固定区域。

---

## Height 规范

页面不应依赖固定高度容纳动态内容。

不推荐：

```tsx
<section className="h-[640px]">
```

推荐：

```tsx
<section className="min-h-[640px]">
```

或者：

```tsx
<section className="min-h-screen">
```

规则：

- 内容区域优先使用自然高度。
- 视口级页面可以使用 `min-h-screen` 或动态视口单位。
- Modal、Sheet 和 Scroll Area 可以使用受控高度。
- 不要通过固定高度裁切正文。

---

## Viewport Height

移动浏览器中应谨慎使用 `100vh`。

视情况优先使用：

```tsx
min - h - dvh;
h - dvh;
max - h - dvh;
```

示例：

```tsx
<main className="min-h-dvh">
```

需要兼容固定 Header 时，应通过明确的 Layout Variable 计算，而不是在多个组件中重复写死高度。

例如：

```css
:root {
  --app-header-height: 4rem;
}
```

```tsx
<main className="min-h-[calc(100dvh-var(--app-header-height))]">
```

---

## Sticky Layout

Sticky 适用于需要在滚动中持续提供上下文的内容。

例如：

- Article Sidebar。
- Table of Contents。
- Filter Panel。
- Action Bar。
- Editor Toolbar。

推荐：

```tsx
<aside className="sticky top-24 self-start">
  <ArticleOutline />
</aside>
```

使用 Sticky 前必须确认：

- 父容器没有错误的 `overflow`。
- 内容高度不会超过视口。
- 移动端有合理降级。
- Sticky 内容不会遮挡核心内容。
- `top` 值来自统一 Header 或 Layout Token。

不要在多个组件中分别写不同的 `top-[...]`。

---

## Overflow

Overflow 应由真正拥有滚动区域的容器管理。

常见场景：

```tsx
<div className="overflow-x-auto">
  <Table />
</div>
```

```tsx
<aside className="max-h-[calc(100dvh-var(--header-height))] overflow-y-auto">
```

规则：

- 页面默认由浏览器主滚动容器滚动。
- 不应为普通 Section 创建嵌套滚动。
- 横向内容必须提供清晰的 Overflow 处理。
- Modal 和 Sheet 可以拥有独立滚动区域。
- 使用 `min-w-0` 防止 Flex 或 Grid 子项溢出。

---

## Safe Area

移动端固定在屏幕边缘的内容应支持 Safe Area。

例如：

```tsx
<div className="pb-[max(1rem,env(safe-area-inset-bottom))]">
```

适用于：

- Bottom Action Bar。
- Bottom Navigation。
- Fullscreen Sheet。
- Mobile Player。
- 固定操作区域。

Safe Area 属于允许使用 Arbitrary Value 的场景，因为其值具有明确语义。

---

## Z-Index

Z-Index 应表达层级，而不是解决局部遮挡问题。

建议层级：

```text
Base Content
Sticky Content
Navigation
Popover
Dropdown
Sheet
Modal
Toast
Critical Overlay
```

项目应尽量使用 HeroUI Overlay Component 已有的层级管理。

禁止：

```tsx
className = "z-[999999]";
```

如果普通组件需要极高的 Z-Index，通常意味着页面结构或 Portal 使用方式存在问题。

---

## Overlay Layout

Modal、Popover、Dropdown、Sheet 等 Overlay 应优先使用 HeroUI。

Overlay 应：

- 通过 Portal 渲染。
- 正确管理焦点。
- 正确处理页面滚动。
- 支持键盘关闭。
- 保持主题和语义。
- 避免被页面容器的 Overflow 裁切。

页面 Layout 不应自行重新实现 Overlay 系统。

---

## Full-Bleed Content

图片、代码块或媒体内容有时需要突破正文宽度。

应通过明确的 Full-Bleed Pattern 实现，而不是临时负 Margin。

示例结构：

```tsx
<article className="mx-auto max-w-3xl">
  <ArticleText />

  <div className="relative left-1/2 w-screen max-w-6xl -translate-x-1/2">
    <MediaContent />
  </div>

  <ArticleText />
</article>
```

如果该模式频繁使用，应封装为统一的 Layout Primitive。

不要在文章内容中反复编写不同的负 Margin。

---

## Layout Primitives

可以建立少量通用布局组件：

```text
components/
└── layout/
    ├── page-container.tsx
    ├── page-header.tsx
    ├── content-grid.tsx
    ├── section.tsx
    ├── stack.tsx
    ├── cluster.tsx
    └── full-bleed.tsx
```

### `PageContainer`

负责页面最大宽度和水平 Padding。

```tsx
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}
```

---

### `Section`

负责页面 Section 的纵向节奏。

```tsx
<Section>
  <SectionHeader />
  <SectionContent />
</Section>
```

---

### `Stack`

负责纵向内容间距。

```tsx
<Stack gap="lg">
  <Heading />
  <Description />
  <Actions />
</Stack>
```

只在能够减少重复并保持 API 简单时封装。

不要为了包装 Tailwind 而创建大量无实际价值的 Layout Component。

---

### `Cluster`

负责横向排列和自动换行。

适用于：

- Tags。
- Actions。
- Metadata。
- Filters。

```tsx
<Cluster>
  <Chip />
  <Chip />
  <Chip />
</Cluster>
```

---

## 代码规范

### 父容器定义布局

正确：

```tsx
<div className="grid gap-6 md:grid-cols-2">
  <ArticleCard />
  <ArticleCard />
</div>
```

错误：

```tsx
<ArticleCard className="w-1/2 pr-3" />
<ArticleCard className="w-1/2 pl-3" />
```

---

### 使用 `gap` 管理兄弟元素

正确：

```tsx
<div className="flex gap-4">
```

不推荐：

```tsx
<div className="flex">
  <Item className="mr-4" />
  <Item />
</div>
```

---

### 使用 `min-w-0`

Grid 或 Flex 中可能出现长文本时，应为可伸缩内容添加：

```tsx
<div className="min-w-0">
  <LongContent />
</div>
```

这可以避免：

- 标题撑破布局。
- Code Block 扩张页面。
- URL 导致横向滚动。
- Flex Item 无法收缩。

---

### 避免任意列宽

不推荐：

```tsx
grid-cols-[267px_813px_291px]
```

推荐：

```tsx
grid-cols-[280px_minmax(0,1fr)_280px]
```

列宽应来自稳定的布局角色，而不是某张设计稿的精确测量值。

---

### 避免重复 Container

错误：

```tsx
<PageContainer>
  <Section>
    <PageContainer>
      <Content />
    </PageContainer>
  </Section>
</PageContainer>
```

嵌套 Container 会导致对齐线不一致和水平 Padding 重复。

Page Container 通常只应存在于页面顶层。

---

### 不在组件中读取视口宽度决定布局

不推荐：

```tsx
const isDesktop = window.innerWidth > 1280;
```

推荐使用：

- Tailwind Responsive Utilities。
- CSS Container Queries。
- HeroUI Responsive Behavior。
- 必要时使用经过封装的 Media Query Hook。

能够由 CSS 完成的布局，不应交给 React State。

---

## Container Queries

当组件的布局取决于自身可用空间，而不是整个视口时，可以使用 Container Queries。

适用于：

- 可复用 Card。
- Dashboard Widget。
- Sidebar Module。
- Editor Panel。
- 嵌套内容区域。

原则：

- 页面级结构使用 Viewport Breakpoints。
- 组件级结构优先使用 Container Queries。
- 不要让可复用组件假设自己始终处于某个页面宽度。

---

## Layout 与动画

布局变化优先保持空间连续性。

适用于动画的布局变化：

- Sidebar 展开。
- Card 扩展。
- Segment 切换。
- Comment Panel 展开。
- Shared Layout。

推荐使用 Motion Layout，而不是手动计算坐标。

动画不应：

- 破坏正常文档流。
- 在结束后留下 Transform 偏移。
- 造成布局闪烁。
- 阻塞用户滚动。
- 同时由 CSS 和 Motion 控制同一位置属性。

布局的最终状态必须由 CSS 决定，动画只负责状态之间的过渡。

---

## Layout 与无障碍

视觉布局改变时，语义与阅读顺序必须保持合理。

注意：

- 不要依赖 CSS `order` 创建与 DOM 完全不同的阅读顺序。
- 键盘焦点顺序应符合视觉顺序。
- Sidebar 折叠后不能留下不可见的可聚焦元素。
- 移动端将内容移入 Sheet 时，应正确管理焦点。
- Sticky 内容不能遮挡焦点元素。
- Zoom 后页面仍应可使用。

DOM 顺序应优先服务于内容逻辑和无障碍，而不是仅服务于桌面视觉布局。

---

## 例外策略

以下情况允许使用特殊布局值：

- 第三方媒体或嵌入内容具有固定尺寸。
- 需要支持 Safe Area。
- 需要减去固定 Header 或 Toolbar 高度。
- 特定组件存在真实的布局断点。
- 复杂视觉展示无法由通用 Grid 表达。
- 例外已记录在模块文档或 ADR 中。

例外值应优先使用 CSS Variable 表达语义：

```tsx
className = "top-[var(--app-header-height)]";
```

而不是：

```tsx
className = "top-[73px]";
```

---

## 禁止事项

以下做法不符合项目规范：

- 使用固定坐标构建常规页面。
- 使用 Transform 修补布局位置。
- 使用大量任意宽度和任意断点。
- 通过空白元素制造页面结构。
- 让子组件决定自身所在列。
- 在组件中硬编码页面级宽度。
- 使用 Margin 补偿错误的父布局。
- 通过 React State 处理可以由 CSS 完成的响应式布局。
- 在移动端直接压缩桌面三栏布局。
- 为普通页面创建多个嵌套滚动区域。
- 使用固定高度容纳动态正文。
- 无限扩张超宽屏内容。
- 使用极高 Z-Index 掩盖层级问题。
- 使用视觉顺序破坏 DOM 阅读顺序。
- 在多个模块中重复实现 Container。
- 绕过 HeroUI 自行实现 Modal、Sheet 或 Popover 布局。

---

## Review Checklist

提交页面或布局变更前，需要确认：

- [ ] 页面是否使用统一的 Container？
- [ ] 主内容是否拥有最高空间优先级？
- [ ] Grid 或 Flex 的选择是否合理？
- [ ] 是否使用 `gap` 管理兄弟元素？
- [ ] 子组件是否避免承担页面级布局职责？
- [ ] 可伸缩列是否使用 `minmax(0, 1fr)`？
- [ ] Flex 或 Grid 子项是否在需要时使用 `min-w-0`？
- [ ] 是否避免不必要的固定宽度和高度？
- [ ] 是否避免任意断点和任意列宽？
- [ ] 移动端是否重新组织了信息，而不是只缩小桌面版？
- [ ] 正文宽度是否保持可读？
- [ ] 超宽屏是否限制了内容扩张？
- [ ] Sticky 内容是否有合理的视口和 Overflow 行为？
- [ ] Overlay 是否优先使用 HeroUI？
- [ ] DOM 顺序是否符合阅读和键盘操作顺序？
- [ ] 布局是否支持 Zoom 和 Reduced Motion？
- [ ] 布局变化是否能够由主题和共享 Token 统一调整？

---

## 最终原则

Layout 定义结构，组件承载内容。

页面负责决定：

- 内容放在哪里。
- 内容占据多少空间。
- 不同区域之间是什么关系。
- 在不同设备上如何重新组织。

组件不应通过固定尺寸和位置控制自己所处的页面环境。

> Pages own structure. Components own content.

即：

> 页面拥有结构，组件拥有内容。
