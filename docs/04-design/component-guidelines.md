# Component Guidelines

## 定位

Component Guidelines 用于定义组件的设计、实现、组合与维护方式。

在 Odyssey 中，组件不是孤立的视觉模块，而是产品设计系统、交互行为和工程架构的共同载体。

所有组件都应建立在统一的设计语言之上，并保持：

- 一致的视觉表现。
- 清晰的职责边界。
- 可预测的交互行为。
- 完整的无障碍能力。
- 稳定且可扩展的 API。
- 对主题变化的自然适配。

---

## 核心原则

### HeroUI 优先

HeroUI 是项目唯一的基础组件系统。

实现界面前，应按以下顺序判断：

```text
HeroUI Component
↓
HeroUI Component Composition
↓
HeroUI Primitive + Project Logic
↓
Custom Component
```

优先直接使用 HeroUI：

```tsx
import { Button } from "@heroui/react";

<Button color="primary">Publish</Button>;
```

不要在已有组件能够满足需求时重新实现：

```tsx
<button className="...">Publish</button>
```

HeroUI 已经提供的能力不应被重复建设，包括：

- Keyboard Interaction。
- Focus Management。
- Press Behavior。
- Disabled State。
- ARIA Semantics。
- Overlay Behavior。
- Theme Integration。
- Interaction States。

---

### 组合优于重写

当单个 HeroUI 组件无法直接满足需求时，应优先通过组合建立更高层组件。

正确：

```tsx
function DeleteArticleButton() {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button isIconOnly color="danger" aria-label="Delete article">
          <TrashIcon />
        </Button>
      </Tooltip.Trigger>

      <Tooltip.Content>Delete article</Tooltip.Content>
    </Tooltip>
  );
}
```

不推荐：

```tsx
function DeleteArticleButton() {
  return (
    <div role="button" tabIndex={0} className="..." onClick={handleDelete}>
      <TrashIcon />
    </div>
  );
}
```

组合应保留基础组件原有的行为与语义。

---

### 组件表达语义

组件名称和 API 应描述用途，而不是视觉结果。

推荐：

```tsx
<PublishButton />
<ArticleMetadata />
<CommentComposer />
<StockPositionCard />
```

不推荐：

```tsx
<BlueButton />
<GrayBox />
<LeftPanel />
<LargeText />
```

视觉样式可能随着主题和设计系统变化。

产品语义通常更加稳定。

---

### 组件不拥有主题

组件应使用 HeroUI Semantic Colors 和 Tailwind Theme Utilities。

正确：

```tsx
<div className="bg-surface text-foreground">
```

不推荐：

```tsx
<div className="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
```

组件负责表达：

- Surface。
- Foreground。
- Accent。
- Success。
- Warning。
- Danger。

主题负责决定这些语义最终呈现出的颜色。

同样地，组件应使用统一的：

- Spacing Scale。
- Radius。
- Typography。
- Shadow。
- Motion Token。
- Breakpoint。

不要在组件内部建立独立的视觉系统。

---

## 组件分类

项目组件分为以下四类。

### Primitive

设计系统提供的基础组件。

主要来自 HeroUI，例如：

```text
Button
Input
Card
Chip
Avatar
Tooltip
Popover
Modal
Sheet
Tabs
ListBox
Dropdown
```

Primitive 不应在业务代码中被重新实现。

---

### Composite

由多个 Primitive 组合而成的通用组件。

例如：

```text
SearchField
IconButton
UserMenu
EmptyState
ConfirmDialog
FormField
ArticleCard
CommentItem
```

Composite 可以包含少量产品语义，但仍具有较强的复用价值。

---

### Feature Component

服务于某个明确业务模块的组件。

例如：

```text
ArticleActionBar
CommentComposer
MusicMiniWidget
StockTransactionCard
ArticleOutline
EditorToolbar
```

Feature Component 可以依赖：

- 业务类型。
- Feature State。
- Feature Hook。
- Feature Action。

但不应直接承担页面级布局职责。

---

### Page Component

服务于具体页面结构的组件。

例如：

```text
ArticlePage
EditorPage
ProfilePage
HomePage
```

Page Component 负责：

- 页面区域组合。
- 页面级数据连接。
- 页面状态。
- 页面 Layout。
- Feature Component 排列。

Page Component 通常不作为通用组件复用。

---

## 组件职责

一个组件应拥有清晰且有限的职责。

组件可以负责：

- 自身内容。
- 自身内部布局。
- 自身交互状态。
- 自身无障碍语义。
- 自身视觉 Variant。
- 与自身行为直接相关的事件。

组件不应负责：

- 页面级列宽。
- 外部 Margin。
- 整个页面的数据加载。
- 无关模块的状态。
- 全局导航。
- 不属于自身的 Overlay。
- 根据视口宽度控制页面结构。

---

### 内部布局与外部布局

组件负责内部布局。

使用方负责组件之间的关系。

正确：

```tsx
function ArticleCard() {
  return (
    <Card className="p-5">
      <Card.Content className="space-y-3">
        <ArticleTitle />
        <ArticleSummary />
      </Card.Content>
    </Card>
  );
}
```

由父组件管理外部关系：

```tsx
<div className="grid gap-6 md:grid-cols-2">
  <ArticleCard />
  <ArticleCard />
</div>
```

错误：

```tsx
function ArticleCard() {
  return <Card className="mb-6 w-1/2 p-5" />;
}
```

基础组件不应默认携带外部 Margin 或页面级宽度。

---

## Component API

组件 API 应保持：

- 明确。
- 可预测。
- 类型安全。
- 语义化。
- 尽可能小。

---

### 优先使用标准 Props

应优先复用 React 和 HeroUI 已有的 Props 命名。

推荐：

```text
children
className
isDisabled
isLoading
isSelected
isOpen
defaultOpen
onOpenChange
onPress
onSelectionChange
aria-label
```

不推荐重新命名为：

```text
disabledState
loadingStatus
opened
setOpened
handleClick
selectedValueChanged
```

相同概念应在项目中保持相同命名。

---

### Boolean Props

Boolean Props 应使用能够自然读成状态的名称。

推荐：

```tsx
<Button isLoading />
<CommentItem isEditing />
<ArticleCard isFeatured />
```

不推荐：

```tsx
<Button loading />
<CommentItem edit />
<ArticleCard featuredMode />
```

一般使用：

```text
is*
has*
can*
should*
```

例如：

```text
isActive
isDisabled
hasError
canDelete
shouldCollapse
```

---

### Event Props

事件 Props 使用 `on*`。

```tsx
interface CommentComposerProps {
  onSubmit?: (content: string) => void;
  onCancel?: () => void;
}
```

不要使用：

```text
submitHandler
handleSubmitProp
whenSubmit
```

组件内部处理函数可以使用：

```text
handleSubmit
handleCancel
handleOpenChange
```

Props 与内部函数应保持区分。

---

### Controlled 与 Uncontrolled

交互组件应尽可能支持可控或非可控模式。

推荐模式：

```tsx
interface PanelProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}
```

可控：

```tsx
<Panel isOpen={isOpen} onOpenChange={setIsOpen} />
```

非可控：

```tsx
<Panel defaultOpen />
```

不要同时维护两个互相冲突的状态来源。

---

### 避免相互冲突的 Props

不推荐：

```tsx
<Button primary secondary danger />
```

推荐：

```tsx
<Button color="primary" />
```

不推荐：

```tsx
<Card compact comfortable spacious />
```

推荐：

```tsx
<Card density="compact" />
```

当多个状态互斥时，应使用单个枚举型 Prop。

---

### 避免配置对象膨胀

不推荐：

```tsx
<ArticleCard
  config={{
    title: {
      size: "large",
      weight: "bold",
      color: "primary",
    },
    image: {
      position: "left",
      ratio: "16:9",
    },
    footer: {
      align: "right",
    },
  }}
/>
```

推荐通过组合表达：

```tsx
<ArticleCard>
  <ArticleCard.Media />
  <ArticleCard.Content>
    <ArticleCard.Title />
    <ArticleCard.Summary />
  </ArticleCard.Content>
  <ArticleCard.Footer />
</ArticleCard>
```

复杂组件优先使用 Composition，而不是不断增加配置 Props。

---

## Variants

Variant 用于表达组件中稳定、有限且有语义的视觉变化。

适合定义为 Variant 的属性：

- `size`
- `color`
- `variant`
- `radius`
- `orientation`
- `placement`
- `density`

示例：

```tsx
<Button size="md" color="primary" variant="solid">
  Publish
</Button>
```

---

### Variant 必须有限

Variant 应是明确的封闭集合。

推荐：

```tsx
type ArticleCardVariant = "default" | "featured" | "compact";
```

不推荐：

```tsx
type ArticleCardVariant = string;
```

任意字符串会使组件失去设计系统约束。

---

### Variant 应表达真实差异

不要为轻微样式差异创建 Variant。

不推荐：

```text
default
defaultWithLessPadding
defaultWithSlightlyLargerTitle
defaultWithoutTopMargin
```

这些通常意味着：

- 组件职责不清。
- Layout 使用错误。
- 设计缺乏一致性。
- 应通过 Slots 或组合解决。

---

### 优先复用 HeroUI Variants

如果 HeroUI 已提供：

```text
size
variant
color
radius
```

应优先沿用其语义和命名。

不要在包装组件中重新定义一套不兼容的 Variant。

---

## Compound Components

当组件包含多个可组合区域时，优先使用 Compound Component。

例如：

```tsx
<ArticleCard>
  <ArticleCard.Media />
  <ArticleCard.Content>
    <ArticleCard.Title />
    <ArticleCard.Summary />
    <ArticleCard.Metadata />
  </ArticleCard.Content>
  <ArticleCard.Actions />
</ArticleCard>
```

适合 Compound Component 的场景：

- 组件内部区域可以省略。
- 区域顺序可能调整。
- 不同场景需要不同组合。
- 单个配置对象会变得复杂。
- 子区域具有独立语义。

---

### Compound Component 规则

Compound Component 应：

- 保持清晰的 DOM 结构。
- 通过 Context 共享必要状态。
- 避免隐藏关键行为。
- 允许合理调整内容顺序。
- 提供合理的默认样式。
- 保留每个区域的 `className`。

不要让 Compound Component 变成隐式魔法。

---

## Wrapper Components

不要为每个 HeroUI 组件创建无意义的 Wrapper。

不推荐：

```tsx
export function AppButton(props: ButtonProps) {
  return <Button {...props} />;
}
```

这类 Wrapper：

- 没有增加产品语义。
- 隐藏了原始组件来源。
- 增加维护成本。
- 延迟上游 API 更新。
- 形成不必要的抽象层。

允许创建 Wrapper 的情况：

- 固化项目级行为。
- 增加明确的产品语义。
- 组合多个基础组件。
- 统一重复出现的无障碍逻辑。
- 提供稳定且高频的交互模式。

例如：

```tsx
function IconButton({ label, children, ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Button isIconOnly aria-label={label} {...props}>
          {children}
        </Button>
      </Tooltip.Trigger>

      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
```

这个 Wrapper 同时统一了：

- Icon-only Button。
- Accessible Label。
- Tooltip。
- 项目交互模式。

因此具有真实价值。

---

## Styling

### 优先保留默认样式

HeroUI 组件应先使用默认样式。

只有当默认实现无法满足明确的产品需求时，才进行覆盖。

推荐：

```tsx
<Button color="primary">Publish</Button>
```

不要一开始就重写：

```tsx
<Button className="h-11 rounded-[15px] bg-purple-500 px-[19px] shadow-xl">Publish</Button>
```

默认样式已经承担：

- 视觉一致性。
- 交互状态。
- 主题适配。
- 尺寸关系。
- 无障碍状态反馈。

---

### 样式覆盖优先级

组件样式调整应遵循：

```text
HeroUI Props
↓
Composition
↓
className
↓
Variant Extension
↓
Custom Component
```

先判断能否通过组件已有 Props 完成：

```tsx
<Button size="lg" variant="secondary" color="primary" />
```

再考虑覆盖 `className`。

---

### 使用 `className`

局部样式扩展使用标准 `className`：

```tsx
<Card className="max-w-xl">
```

```tsx
<Button className="font-medium">
```

样式应尽量来自：

- HeroUI Semantic Colors。
- Tailwind Spacing Scale。
- Tailwind Typography Scale。
- 项目 Theme Token。

避免：

```tsx
<Card className="bg-[#151515] p-[19px] text-[#f4f4f4]">
```

---

### Slots

多区域组件应通过 HeroUI 提供的组成部分或 Slots 定制。

例如：

```tsx
<Alert>
  <Alert.Icon />
  <Alert.Content>
    <Alert.Title />
    <Alert.Description />
  </Alert.Content>
  <Alert.Close />
</Alert>
```

不要通过复杂选择器依赖 HeroUI 内部 DOM：

```css
.alert > div:nth-child(2) > span:first-child {
  ...
}
```

组件内部结构可能随着版本升级变化。

应依赖公开 API、Parts、Slots 或 Variant Functions。

---

### Variant Extension

当相同的样式变化在项目中稳定复用时，可以扩展 Variant。

适合：

- 项目级 Button Variant。
- 稳定的 Card Density。
- 固定的 Navigation Item 状态。
- 产品特有但长期存在的组件模式。

不适合：

- 单个页面的临时样式。
- 一次性的营销视觉。
- 仅改变一个 Margin。
- 无法解释的颜色覆盖。

扩展 Variant 必须保持 HeroUI 原有：

- Props。
- State。
- Accessibility。
- Type Safety。
- Theme Behavior。

---

### 不使用深层覆盖

禁止依赖：

- 深层 CSS Selector。
- DOM 顺序。
- `nth-child`。
- 内部自动生成属性。
- 非公开 Class Name。
- 大量 `!important`。

如果必须依赖组件内部实现细节，应重新评估：

- 是否有公开 Slot。
- 是否可以组合。
- 是否应该建立独立组件。
- 是否应提交为 HeroUI 上游需求。

---

## State

组件必须明确处理所有重要状态。

基础状态包括：

```text
Default
Hover
Pressed
Focus Visible
Disabled
Loading
Selected
Invalid
Read Only
```

根据组件类型，还可能包括：

```text
Empty
Error
Success
Pending
Expanded
Collapsed
Dragging
Uploading
```

---

### 不只设计 Default State

组件完成前，应确认：

```text
Default
Hover
Keyboard Focus
Pressed
Disabled
Loading
Error
Empty
Long Content
Mobile
Dark Theme
```

一个只在默认截图中正常的组件，不是完整组件。

---

### Loading

Loading 状态应：

- 防止重复提交。
- 保留必要上下文。
- 明确反馈正在发生的操作。
- 避免布局剧烈跳动。
- 保持可访问名称。

示例：

```tsx
<Button isLoading>Publish</Button>
```

不要仅通过透明度表示 Loading。

---

### Disabled

Disabled 状态不能仅通过颜色表达。

应同时：

- 禁止交互。
- 提供正确语义。
- 保持可识别的状态差异。
- 在必要时解释禁用原因。

不要使用：

```tsx
<div className="pointer-events-none opacity-50">
```

模拟真正的 Disabled Button。

---

### Empty State

列表或内容容器必须处理 Empty State。

Empty State 应说明：

- 当前发生了什么。
- 为什么没有内容。
- 用户下一步可以做什么。

例如：

```tsx
<EmptyState
  title="No comments yet"
  description="Start the conversation."
  action={<Button>Add comment</Button>}
/>
```

不要仅显示：

```text
No data
```

---

### Error State

Error State 应靠近错误发生的位置。

表单错误应与对应字段关联。

页面级错误应提供：

- 问题说明。
- 可恢复操作。
- 重试入口。
- 必要时的返回入口。

不要只使用 Toast 承载所有错误。

---

## Interaction

### 使用 `onPress`

HeroUI 交互组件应优先使用 `onPress`，保持键盘、鼠标、触摸和辅助技术之间的一致行为。

```tsx
<Button onPress={handlePublish}>Publish</Button>
```

不要在 HeroUI Button 上仅依赖：

```tsx
<Button onClick={handlePublish}>
```

除非具体 API 或集成场景明确要求。

---

### 不使用非交互元素模拟交互

禁止：

```tsx
<div onClick={handleOpen}>Open</div>
```

应根据语义使用：

```tsx
<Button onPress={handleOpen}>Open</Button>
```

或：

```tsx
<Link href="/article">Open article</Link>
```

视觉外观不能代替正确的 HTML 语义。

---

### Button 与 Link

使用 Button：

- 执行动作。
- 提交表单。
- 打开 Overlay。
- 切换状态。
- 删除内容。
- 播放或暂停。

使用 Link：

- 页面导航。
- 路由跳转。
- 打开资源。
- 跳转锚点。

不要用 Button 模拟页面跳转，也不要用 Link 执行业务操作。

---

### Icon-only Controls

所有 Icon-only Control 必须具有可访问名称。

正确：

```tsx
<Button isIconOnly aria-label="Close comments">
  <CloseIcon />
</Button>
```

图标含义不明确时，应同时提供 Tooltip。

---

### Hit Target

交互区域应足够大。

不要让视觉较小的图标同时拥有极小的点击区域。

推荐由 Button、Chip、Link 或其他正式交互组件提供 Hit Target，而不是直接监听图标点击。

---

## Forms

表单组件应优先使用 HeroUI Form Controls。

每个字段必须明确处理：

- Label。
- Description。
- Required。
- Invalid。
- Error Message。
- Disabled。
- Read Only。
- Loading。
- Auto Complete。

推荐：

```tsx
<TextField isRequired isInvalid={Boolean(error)}>
  <Label>Title</Label>
  <Input />
  <Description>Used as the article heading.</Description>
  <FieldError>{error}</FieldError>
</TextField>
```

不要使用 Placeholder 代替 Label。

---

### 表单状态归属

字段值可以由：

- 表单库。
- Feature Hook。
- Controlled State。

管理。

视觉组件不应直接包含：

- API Request。
- 数据持久化。
- 路由跳转。
- 全局状态更新。

推荐分离：

```text
CommentComposer
├── CommentComposerView
├── useCommentComposer
└── comment-service
```

但不要为了形式而过度拆分简单组件。

---

## Data 与 Presentation

组件应根据复杂度合理区分数据连接和视觉表现。

推荐：

```tsx
function ArticleCardContainer({ articleId }: Props) {
  const article = useArticle(articleId);

  return <ArticleCard article={article} />;
}
```

```tsx
function ArticleCard({ article }: ArticleCardProps) {
  return <Card>...</Card>;
}
```

这使视觉组件更容易：

- 测试。
- 复用。
- Storybook 展示。
- 处理不同数据来源。

但简单页面组件无需强制拆成 Container 和 Presentational Component。

---

## Responsive Behavior

组件应根据自己的可用空间适配，而不是假设固定页面环境。

优先使用：

- CSS。
- Tailwind Responsive Utilities。
- Container Queries。
- Flex Wrapping。
- Grid。
- Overflow Strategy。

避免：

```tsx
const isMobile = window.innerWidth < 768;
```

能由 CSS 完成的视觉布局，不应交给 React State。

---

### 响应式不是隐藏全部内容

组件在小尺寸下应重新组织内容优先级。

例如 Article Card：

```text
Desktop
├── Cover
├── Title
├── Summary
├── Metadata
└── Actions

Mobile
├── Title
├── Metadata
└── Essential Actions
```

次要内容可以折叠，但核心语义和操作必须保留。

---

## Content Resilience

组件必须能够处理真实内容。

需要验证：

- 长标题。
- 长单词。
- URL。
- 多语言。
- 空内容。
- 大数字。
- 多行文本。
- 缺失图片。
- 加载失败。
- 大量列表项。

推荐：

```tsx
<h3 className="line-clamp-2 break-words">{title}</h3>
```

但不要为了保持卡片高度而随意截断关键内容。

截断必须符合产品语义。

---

## Accessibility

无障碍能力是组件完成标准的一部分。

组件必须确认：

- 使用正确的 HTML 元素。
- 支持 Keyboard Interaction。
- Focus Visible 清晰可见。
- Focus Order 合理。
- Icon-only Control 有 Accessible Name。
- 状态变化可被辅助技术感知。
- 错误与字段正确关联。
- Overlay 正确管理焦点。
- Disabled State 使用真实语义。
- 动画支持 Reduced Motion。

使用 HeroUI 不代表无障碍工作自动完成。

HeroUI 提供基础行为，项目仍需正确提供：

- Label。
- Description。
- Heading Structure。
- Accessible Name。
- Content Order。
- Error Message。
- Product Context。

---

## Animation

组件动画应遵循项目 Motion Specification。

原则：

- 动画用于解释状态变化。
- 优先使用 HeroUI 默认动画。
- 简单状态使用 CSS。
- 状态驱动交互使用 Motion。
- 不要覆盖同一属性的多个动画系统。
- Reduced Motion 下必须降级。
- 动画结束后布局仍由 CSS 决定。

不要因为组件存在就添加入场动画。

---

## Performance

组件应避免不必要的运行时成本。

注意：

- 不要为纯视觉响应式创建 React State。
- 不要在 Render 中执行昂贵计算。
- 不要无条件加载大型 Feature Component。
- 长列表应考虑 Virtualization。
- 图片应明确尺寸。
- Overlay 内容可以按需挂载。
- 动画应优先使用 `transform` 和 `opacity`。
- Context 范围应尽可能小。
- 不要因通用组件状态导致整个页面重新渲染。

性能优化应建立在真实测量之上，不进行无依据的复杂优化。

---

## TypeScript

所有公开组件 Props 必须具有明确类型。

推荐：

```tsx
interface ArticleCardProps {
  article: ArticleSummary;
  variant?: "default" | "featured" | "compact";
  onPress?: () => void;
  className?: string;
}
```

避免：

```tsx
interface ArticleCardProps {
  data: any;
  variant: string;
  onAction: Function;
}
```

规则：

- 禁止公开 API 使用 `any`。
- 避免使用宽泛的 `object` 和 `Function`。
- Props 类型应靠近组件定义。
- 共享类型应放入 Feature 的 `types`。
- 优先继承基础组件 Props。
- 不要重复声明 HeroUI 已有类型。

---

### 继承基础 Props

包装 HeroUI 组件时，应保留合理的原始能力。

```tsx
interface IconButtonProps extends Omit<ButtonProps, "children" | "isIconOnly"> {
  label: string;
  icon: React.ReactNode;
}
```

不要无意义地暴露所有 Props。

也不要过度限制，导致使用方不得不绕过组件。

---

## `className`

通用组件通常应允许传入 `className`。

```tsx
interface ArticleCardProps {
  className?: string;
}
```

使用合并工具：

```tsx
<Card className={cn("p-5", className)}>
```

组件基础样式应优先，使用方可以进行合理扩展。

但如果使用方需要大量覆盖基础样式，通常说明：

- Variant 不足。
- 组件抽象错误。
- 应使用更底层 Primitive。
- 该场景不应复用当前组件。

---

## Refs

底层交互组件和通用组件应在必要时正确转发 Ref。

Ref 适用于：

- Focus。
- Measurement。
- Scroll。
- 与第三方库集成。
- Animation Target。
- Form Integration。

不要为了“未来可能需要”给所有组件增加复杂 Ref API。

---

## Component Structure

推荐目录：

```text
components/
├── ui/
│   ├── icon-button/
│   ├── empty-state/
│   └── confirm-dialog/
├── layout/
│   ├── page-container/
│   ├── section/
│   └── stack/
└── shared/
    ├── logo/
    └── user-avatar/
```

Feature Component 放在对应模块：

```text
features/
├── article/
│   └── components/
│       ├── article-card.tsx
│       ├── article-action-bar.tsx
│       └── article-outline.tsx
├── comment/
│   └── components/
│       ├── comment-item.tsx
│       └── comment-composer.tsx
└── music/
    └── components/
        └── music-mini-widget.tsx
```

规则：

- 通用组件放入 `components`。
- 业务组件放入对应 `feature`。
- 页面专用组件靠近页面。
- 不要把所有组件都放进一个全局目录。
- 不要过早提升为 Shared Component。

---

## Component File

简单组件可以使用单文件：

```text
article-card.tsx
```

复杂组件可以使用目录：

```text
article-card/
├── article-card.tsx
├── article-card.types.ts
├── article-card.test.tsx
├── article-card.stories.tsx
└── index.ts
```

不要为只有十几行的组件创建大量空文件。

文件结构应服务于维护，而不是追求形式统一。

---

## Naming

### Component

使用 PascalCase：

```text
ArticleCard
CommentComposer
MusicMiniWidget
```

### File

使用 kebab-case：

```text
article-card.tsx
comment-composer.tsx
music-mini-widget.tsx
```

### Props

使用：

```text
ArticleCardProps
CommentComposerProps
```

### Handler

组件内部：

```text
handleSubmit
handleDelete
handleOpenChange
```

组件 Props：

```text
onSubmit
onDelete
onOpenChange
```

---

## Abstraction

不要因为两处 JSX 看起来相似就立即抽象。

适合抽象的信号：

- 已在多个位置稳定重复。
- 具有明确的产品语义。
- 行为和状态保持一致。
- 修改时需要同步更新多处。
- 能够形成清晰且较小的 API。

不适合抽象的信号：

- 只出现一次。
- 仅样式相似，语义不同。
- 需要大量 Boolean Props。
- 使用方需要频繁覆盖内部实现。
- API 比原始 JSX 更难理解。

推荐遵循：

```text
Duplicate
↓
Observe
↓
Stabilize
↓
Abstract
```

不要遵循：

```text
Imagine
↓
Generalize
↓
Build framework
```

---

## Custom Component Policy

只有满足以下条件之一时，才应创建新的通用组件：

- HeroUI 没有对应组件。
- 多个 HeroUI Primitive 形成稳定模式。
- 项目存在明确且重复的产品语义。
- 需要统一复杂交互或无障碍行为。
- 已有实现无法通过 Composition 合理完成。

自定义组件必须：

- 使用 HeroUI Semantic Colors。
- 使用 Tailwind Theme Scale。
- 支持 Light 与 Dark Theme。
- 支持 Keyboard Interaction。
- 提供 Focus Visible。
- 支持 Disabled State。
- 支持必要的 Loading 和 Error State。
- 接受合理的 `className`。
- 提供完整 TypeScript 类型。
- 记录使用场景和限制。

---

## 禁止事项

以下做法不符合项目规范：

- 重写 HeroUI 已提供的基础组件。
- 为每个 HeroUI 组件创建无意义 Wrapper。
- 使用多个 UI Component Library。
- 使用 `div` 模拟 Button、Link 或 Input。
- 在组件中硬编码颜色。
- 在组件中硬编码大量任意尺寸。
- 基础组件默认携带外部 Margin。
- 让 Feature Component 决定页面级布局。
- 使用大量 Boolean Props 表达互斥状态。
- 使用配置对象代替合理 Composition。
- 依赖 HeroUI 的内部 DOM 结构。
- 使用深层 Selector 和大量 `!important`。
- 使用 Placeholder 代替 Form Label。
- 仅设计 Default State。
- 忽略 Loading、Empty、Error 和 Disabled State。
- 使用颜色作为唯一状态提示。
- 在组件中读取 `window.innerWidth` 控制视觉布局。
- 使用 `any` 定义公开 Props。
- 过早将 Feature Component 提升为 Shared Component。
- 为简单组件建立复杂抽象层。
- 创建与 HeroUI 不一致的新 Variant 命名体系。

---

## Review Checklist

提交组件前，需要确认：

### 基线

- [ ] 是否优先使用了 HeroUI？
- [ ] 是否避免重新实现已有 Primitive？
- [ ] 是否优先通过 Composition 解决问题？
- [ ] 自定义组件是否具有明确必要性？

### 职责

- [ ] 组件是否只有清晰、有限的职责？
- [ ] 是否只管理自身内部布局？
- [ ] 外部间距是否由父组件管理？
- [ ] 是否避免承担页面级 Layout？

### API

- [ ] Props 是否语义清晰？
- [ ] 是否复用了标准命名？
- [ ] Boolean Props 是否使用 `is*`、`has*` 或 `can*`？
- [ ] 互斥状态是否使用单个枚举 Prop？
- [ ] 是否避免配置对象膨胀？
- [ ] Controlled 与 Uncontrolled 行为是否明确？

### Styling

- [ ] 是否使用 HeroUI Semantic Colors？
- [ ] 是否使用 Tailwind Theme Scale？
- [ ] 是否优先保留 HeroUI 默认样式？
- [ ] 是否避免任意颜色和任意尺寸？
- [ ] 是否避免依赖内部 DOM？
- [ ] 样式变化是否应该成为 Variant？

### State

- [ ] 是否处理 Hover、Pressed 和 Focus Visible？
- [ ] 是否处理 Disabled？
- [ ] 是否处理 Loading？
- [ ] 是否处理 Empty 和 Error？
- [ ] 长内容和缺失内容是否正常？

### Interaction

- [ ] 是否使用正确的 Button 或 Link 语义？
- [ ] HeroUI 交互是否优先使用 `onPress`？
- [ ] Icon-only Control 是否具有 Accessible Name？
- [ ] 点击区域是否足够？
- [ ] 是否支持鼠标、键盘和触摸？

### Accessibility

- [ ] HTML 语义是否正确？
- [ ] Focus 顺序是否合理？
- [ ] Focus Visible 是否清晰？
- [ ] 表单字段是否具有 Label？
- [ ] 错误信息是否正确关联？
- [ ] Overlay 是否正确管理焦点？
- [ ] 动画是否支持 Reduced Motion？

### Engineering

- [ ] Props 是否具有完整 TypeScript 类型？
- [ ] 是否避免公开 API 使用 `any`？
- [ ] 文件位置是否符合组件层级？
- [ ] 是否进行了不必要的抽象？
- [ ] 是否能够跟随主题变化？
- [ ] 是否易于测试和维护？

---

## 最终原则

组件应建立在 HeroUI 之上，而不是与 HeroUI 并行发展。

基础组件提供行为与设计语言。

组合组件表达产品模式。

Feature Component 承载业务语义。

Page Component 组织页面结构。

> Use primitives. Compose patterns. Preserve behavior.

即：

> 使用基础组件，组合产品模式，保留原有行为。
