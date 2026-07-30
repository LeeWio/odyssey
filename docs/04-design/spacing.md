# Spacing

## 定位

Spacing 用于建立界面的节奏、层级与空间关系。

在 Odyssey 中，留白不是用于填补剩余空间的装饰，而是设计系统的一部分。

项目不维护脱离 Tailwind 的独立间距体系。页面和组件应尽可能使用 Tailwind 提供的 Spacing Utilities，使间距能够由统一的主题配置驱动。

---

## 核心原则

### 间距属于主题

组件不应拥有独立的间距规则。

间距应来自项目统一配置，并通过 Tailwind Utility Classes 使用。

正确：

```tsx
<div className="flex gap-4">
  <Avatar />
  <UserInfo />
</div>
```

错误：

```tsx
<div style={{ gap: "17px" }}>
  <Avatar />
  <UserInfo />
</div>
```

当项目调整 Tailwind 的 Spacing Theme 时，使用标准间距工具的组件应当自动跟随变化。

这与颜色系统采用 HeroUI Semantic Colors 的原则一致：

> 组件表达空间关系，主题决定最终尺寸。

---

## 间距来源

项目中的常规间距应优先来自 Tailwind 的标准工具。

包括：

- `gap-*`
- `space-x-*`
- `space-y-*`
- `p-*`
- `px-*`
- `py-*`
- `pt-*`
- `pr-*`
- `pb-*`
- `pl-*`
- `m-*`
- `mx-*`
- `my-*`
- `mt-*`
- `mr-*`
- `mb-*`
- `ml-*`
- `inset-*`
- `scroll-m-*`
- `scroll-p-*`

示例：

```tsx
<section className="space-y-8">
  <header className="space-y-2">
    <h2>Latest articles</h2>
    <p>Thoughts, notes and experiments.</p>
  </header>

  <div className="grid gap-6">
    <ArticleCard />
    <ArticleCard />
  </div>
</section>
```

Tailwind 的数字间距工具由统一的 Spacing Scale 驱动，因此应优先使用标准数值，而不是 Arbitrary Values。

---

## 设计目标

Spacing System 应满足以下目标：

- 建立稳定且可预测的页面节奏。
- 使用空间表达内容关系与信息层级。
- 保持不同页面和组件之间的一致性。
- 让主题配置能够统一影响界面密度。
- 减少任意数值与局部补丁。
- 支持移动端、桌面端和未来内容模块的扩展。

---

## 空间关系

间距首先用于表达元素之间的关系。

通常：

- 间距越小，元素关系越紧密。
- 间距越大，内容层级越独立。
- 同组内容应保持较小间距。
- 不同 Section 之间应保持明显更大的间距。

例如：

```tsx
<article className="space-y-10">
  <header className="space-y-3">
    <h1>Article title</h1>

    <div className="flex items-center gap-2">
      <Author />
      <PublishDate />
    </div>
  </header>

  <ArticleContent />
</article>
```

在这个结构中：

- 作者与日期属于同一组，使用较小的 `gap-2`。
- 标题与元信息属于同一个 Header，使用 `space-y-3`。
- Header 与正文属于不同内容区域，使用更大的 `space-y-10`。

页面应尽量让用户仅通过空间关系，就能够理解内容结构。

---

## 间距层级

Spacing 分为以下五个层级。

### Element

单个组件内部的紧密元素关系。

适用于：

- Icon 与 Label。
- Avatar 与状态标记。
- Button 内的图标与文字。
- Badge 内部内容。

推荐范围：

```text
gap-1
gap-1.5
gap-2
```

示例：

```tsx
<Button className="gap-2">
  <Icon />
  <span>Publish</span>
</Button>
```

---

### Component

组件内部不同区域之间的间距。

适用于：

- Card 内部。
- Form Field。
- List Item。
- Popover Content。
- Comment Item。

推荐范围：

```text
gap-2
gap-3
gap-4
p-3
p-4
p-5
```

示例：

```tsx
<Card className="p-4">
  <CardContent className="space-y-3">
    <CardTitle />
    <CardDescription />
    <CardActions />
  </CardContent>
</Card>
```

---

### Group

一组相关组件之间的间距。

适用于：

- 表单字段组。
- 操作按钮组。
- 导航项目。
- 文章卡片组。
- Metadata Group。

推荐范围：

```text
gap-3
gap-4
gap-5
gap-6
```

示例：

```tsx
<form className="space-y-5">
  <TitleField />
  <SummaryField />
  <ContentField />
</form>
```

---

### Section

页面中相对独立的内容区域。

适用于：

- Hero。
- Article List。
- Music Section。
- Stock Section。
- Comments。
- Footer。

推荐范围：

```text
gap-8
gap-10
gap-12
gap-16
gap-20
```

示例：

```tsx
<main className="space-y-16">
  <HeroSection />
  <ArticleSection />
  <MusicSection />
  <StockSection />
</main>
```

Section 间距必须明显大于组件内部间距。

---

### Layout

页面整体布局中的结构间距。

适用于：

- Sidebar 与 Main Content。
- 多栏 Grid。
- 页面 Container。
- Header 与页面主体。
- 桌面端主要布局区域。

推荐范围：

```text
gap-6
gap-8
gap-10
gap-12
```

示例：

```tsx
<div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
  <ArticleSidebar />
  <ArticleContent />
  <ArticleOutline />
</div>
```

Layout 间距应由页面布局组件管理，而不是由子组件自行补偿。

---

## 页面节奏

页面内容应遵循以下空间结构：

```text
Page
└── Section
    └── Group
        └── Component
            └── Element
```

层级越高，使用的间距通常越大。

例如：

```tsx
<main className="space-y-16">
  <section className="space-y-8">
    <header className="space-y-3">
      <h2>Featured writing</h2>
      <p>Selected essays and notes.</p>
    </header>

    <div className="grid gap-6">
      <ArticleCard />
      <ArticleCard />
    </div>
  </section>
</main>
```

这段代码包含清晰的三级节奏：

```text
Section 与 Section：space-y-16
Section Header 与内容：space-y-8
标题与描述：space-y-3
Card 与 Card：gap-6
```

不要让所有层级使用相同间距。

---

## Padding 规范

Padding 用于定义组件或容器的内部空间。

常见场景：

```tsx
<Card className="p-4 md:p-6" />

<PopoverContent className="p-3" />

<section className="px-4 py-12 md:px-6 lg:py-16" />
```

规则：

- 同类型组件应保持一致的 Padding。
- 组件 Padding 应由组件自身管理。
- 页面横向 Padding 应由 Container 或 Layout 管理。
- 不要由子组件补偿父容器 Padding。
- 响应式 Padding 应保持连续，不应发生过大的突然变化。

正确：

```tsx
<main className="px-4 md:px-6 xl:px-8">
  <ArticlePage />
</main>
```

不推荐：

```tsx
<main className="px-[18px] md:px-[29px] xl:px-[43px]">
  <ArticlePage />
</main>
```

---

## Gap 优先

Flex 和 Grid 布局中，应优先使用 `gap-*`。

正确：

```tsx
<div className="flex items-center gap-3">
  <Avatar />
  <UserInfo />
  <Actions />
</div>
```

不推荐：

```tsx
<div className="flex items-center">
  <Avatar className="mr-3" />
  <UserInfo className="mr-3" />
  <Actions />
</div>
```

`gap` 更能表达父容器内部元素之间的统一关系，并且不需要处理第一个或最后一个元素的额外 Margin。

Tailwind 的 `gap-*`、`gap-x-*` 和 `gap-y-*` 使用统一的 Spacing Scale，应作为 Flex 和 Grid 的默认间距方案。

---

## `space-*` 使用规范

`space-y-*` 和 `space-x-*` 适合简单、稳定的线性内容。

适合：

```tsx
<div className="space-y-4">
  <Title />
  <Description />
  <Actions />
</div>
```

不适合：

- 子元素会动态排序。
- 子元素可能被 Fragment 包裹。
- 布局需要换行。
- 元素之间需要不同间距。
- 使用 Grid 的布局。

复杂布局优先使用：

```tsx
<div className="flex flex-col gap-4">
```

或：

```tsx
<div className="grid gap-4">
```

---

## Margin 使用规范

Margin 不是默认的布局工具。

优先级为：

```text
Gap
↓
Parent Padding
↓
Layout Structure
↓
Margin
```

Margin 适用于：

- 单个元素与外部环境之间的特殊关系。
- `mx-auto` 等明确的布局行为。
- 文章排版中由 Typography System 管理的内容节奏。
- 无法由父容器统一表达的边界场景。

不应使用 Margin 修补父布局。

不推荐：

```tsx
<Card className="mt-7 ml-3" />
```

推荐：

```tsx
<div className="grid gap-6">
  <Card />
  <Card />
</div>
```

---

## 响应式间距

间距可以根据视口变化，但必须保持明确的层级关系。

推荐：

```tsx
<section className="space-y-8 md:space-y-10 xl:space-y-12">
```

```tsx
<main className="px-4 md:px-6 2xl:px-8">
```

```tsx
<div className="grid gap-4 lg:gap-6 xl:gap-8">
```

规则：

- 移动端应更紧凑，但不能拥挤。
- 桌面端可以增加 Section 和 Layout 间距。
- Element 和 Component 级间距通常不需要大幅响应式变化。
- 不要为每个断点设置不同的任意值。
- 同一页面的响应式间距变化应保持一致。

不推荐：

```tsx
<section className="py-[37px] md:py-[53px] lg:py-[71px]">
```

推荐：

```tsx
<section className="py-10 md:py-14 lg:py-20">
```

---

## Tailwind 代码规范

### 优先使用标准 Scale

正确：

```tsx
<div className="gap-4 px-6 py-8" />
```

不推荐：

```tsx
<div className="gap-[18px] px-[23px] py-[31px]" />
```

Arbitrary Values 会绕过统一的主题节奏，应视为例外。

---

### 不直接写内联样式

不推荐：

```tsx
<div
  style={{
    padding: "24px",
    gap: "16px",
  }}
/>
```

推荐：

```tsx
<div className="gap-4 p-6" />
```

内联样式不会自然参与 Tailwind 的主题配置、响应式系统和代码审查规范。

---

### 不在 CSS Module 中重复定义常规间距

不推荐：

```css
.card {
  padding: 24px;
  gap: 16px;
}
```

推荐：

```tsx
<Card className="gap-4 p-6" />
```

CSS 文件应保留给 Tailwind 无法清晰表达的复杂样式，而不是重新实现 Tailwind 已支持的间距能力。

---

### 优先在父组件定义关系

不推荐：

```tsx
<>
  <Header className="mb-8" />
  <Content className="mb-8" />
  <Footer />
</>
```

推荐：

```tsx
<div className="space-y-8">
  <Header />
  <Content />
  <Footer />
</div>
```

子组件不应假设自己与外部元素之间的距离。

---

### 组件不拥有外部间距

基础组件可以定义内部 Padding，但不应默认定义外部 Margin。

错误：

```tsx
export function ArticleCard() {
  return <Card className="mb-6 p-4" />;
}
```

正确：

```tsx
export function ArticleCard() {
  return <Card className="p-4" />;
}
```

由使用方决定组件之间的关系：

```tsx
<div className="grid gap-6">
  <ArticleCard />
  <ArticleCard />
</div>
```

---

### 使用逻辑方向工具

在表达文字方向相关的间距时，优先使用逻辑方向：

```tsx
ms-*
me-*
ps-*
pe-*
```

而不是始终使用：

```tsx
ml-*
mr-*
pl-*
pr-*
```

这样能够更好地支持不同书写方向。

对于纯视觉布局，仍可以根据实际情况使用物理方向工具。

---

## Arbitrary Values 例外策略

原则上避免：

```tsx
gap-[18px]
mt-[13px]
px-[22px]
```

仅在以下情况允许使用 Arbitrary Values：

- 第三方内容具有固定尺寸要求。
- 需要匹配图片、Canvas 或媒体资源的实际尺寸。
- 需要处理浏览器或设备 Safe Area。
- 设计效果无法由现有 Scale 合理表达。
- 该数值已经提取为有明确语义的 CSS Variable。
- 例外已在组件注释、模块文档或 ADR 中说明。

更推荐：

```tsx
<div className="pt-[var(--header-height)]" />
```

而不是：

```tsx
<div className="pt-[73px]" />
```

前者表达语义，后者只是一个无法解释的数字。

---

## 主题配置

Spacing Scale 应在项目主题层统一配置，不应分散在业务组件中。

例如：

```css
@theme {
  --spacing: 0.25rem;
}
```

使用数字间距工具时：

```tsx
<div className="gap-4 p-6" />
```

这些值会基于统一的 `--spacing` 计算。

因此，未来调整项目的整体视觉密度时，应优先修改 Theme，而不是逐个修改页面和组件。

主题调整前必须评估：

- 基础组件尺寸。
- Header 与 Navigation。
- Form Controls。
- Card Padding。
- 页面 Container。
- Article Typography。
- 移动端触摸区域。
- HeroUI 组件与自定义布局之间的一致性。

不要为了某个单独页面修改全局 Spacing Scale。

---

## 与 HeroUI 的关系

HeroUI 是项目的组件基线，Tailwind 是项目间距实现的主要工具。

使用 HeroUI 组件时：

- 优先保留 HeroUI 默认的内部尺寸与状态行为。
- 通过 HeroUI 支持的 `className`、Slots 或组合方式扩展布局。
- 不要随意覆盖组件内部每一层 Padding。
- 页面级间距由外部 Layout 管理。
- 自定义组件应使用与 HeroUI 一致的 Tailwind Spacing Scale。

示例：

```tsx
<div className="flex gap-4">
  <Button>Cancel</Button>
  <Button color="primary">Publish</Button>
</div>
```

这里：

- Button 内部间距由 HeroUI 管理。
- Button 之间的关系由外部容器的 `gap-4` 管理。

这能够保持清晰的职责边界。

---

## 文章间距

文章内容的间距应由统一的 Typography 或 Prose 样式管理，不应在 Markdown 渲染结果中逐个添加 Margin。

应统一处理：

- 标题前后间距。
- 段落间距。
- 列表间距。
- 引用块间距。
- 图片间距。
- 代码块间距。
- 表格间距。

例如：

```tsx
<article className="prose prose-neutral dark:prose-invert">
  <MarkdownContent />
</article>
```

或者使用项目统一的 Article Content 样式。

不要在单篇文章中覆盖：

```tsx
<h2 className="mt-[43px] mb-[17px]">
```

文章排版应拥有稳定、可复用的阅读节奏。

---

## 密度

项目可以在未来支持不同的界面密度，但密度变化必须由系统统一控制。

可能的密度模式：

```text
Compact
Default
Comfortable
```

密度不应通过组件内部条件判断实现：

```tsx
className={compact ? "p-2" : "p-5"}
```

更合理的方式是：

- 由主题或上层 Context 控制。
- 由 Variant 统一定义。
- 由 HeroUI 组件尺寸系统控制。
- 由共享 Layout Primitive 处理。

当前项目默认使用舒适、留白充足的视觉密度，不建立独立的 Compact Mode。

---

## 禁止事项

以下做法不符合项目规范：

- 使用无语义的任意像素值。
- 在 JSX 中直接编写 `style={{ margin: ... }}`。
- 在 CSS Module 中重复实现 Tailwind 间距。
- 使用 Margin 修补错误的父布局。
- 让基础组件默认携带外部 Margin。
- 在同一层级混用大量不同间距。
- 为单个页面创建独立的 Spacing Scale。
- 通过空白 `div` 制造间距。
- 使用 `<br />` 调整布局。
- 使用绝对定位替代正常布局间距。
- 为每个响应式断点设置不同的任意值。
- 未说明原因就使用 `gap-[...]`、`p-[...]` 或 `m-[...]`。
- 随意覆盖 HeroUI 组件的内部间距。

---

## Review Checklist

提交页面或组件前，需要确认：

- [ ] 是否优先使用 Tailwind 标准 Spacing Scale？
- [ ] 是否避免了不必要的 Arbitrary Values？
- [ ] Flex 或 Grid 是否优先使用 `gap-*`？
- [ ] 外部间距是否由父布局管理？
- [ ] 组件是否只管理自己的内部 Padding？
- [ ] 是否避免使用 Margin 修补布局？
- [ ] 是否避免使用空元素制造留白？
- [ ] 同一层级的间距是否保持一致？
- [ ] 响应式间距变化是否自然？
- [ ] 是否能够跟随主题的 Spacing 配置变化？
- [ ] HeroUI 组件与自定义组件的密度是否一致？
- [ ] 文章内容是否由统一排版样式控制间距？

---

## 最终原则

项目中的间距应尽可能来自 Tailwind，而不是来自组件中的固定数字。

组件负责表达空间关系：

```tsx
gap - 4;
p - 6;
space - y - 8;
```

主题负责决定这些关系最终呈现出的实际尺寸。

> Components define relationships. Themes define dimensions.

即：

> 组件定义关系，主题定义尺寸。
