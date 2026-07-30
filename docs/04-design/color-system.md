# Color System

## 定位

本项目**不维护自己的颜色系统**。

所有颜色均建立在 **HeroUI 的 Semantic Color System** 之上，由 HeroUI 提供颜色语义、主题切换和状态派生能力。

颜色不是视觉资源，而是一种语义。

---

## 设计目标

颜色系统应满足以下目标：

- 保持整个产品一致的视觉语言。
- 自动适配 Light / Dark Theme。
- 避免硬编码颜色。
- 避免组件维护独立配色。
- 保持所有状态颜色的一致性。
- 降低主题切换成本。

---

## 核心原则

### 使用语义，而不是颜色

组件应该表达**用途**，而不是表达**颜色**。

正确：

```tsx
bg - background;
text - foreground;

bg - accent;
text - accent - foreground;

bg - success;
bg - danger;
```

错误：

```tsx
bg - blue - 500;
text - red - 600;
bg - green - 400;
```

颜色名称描述的是视觉。

语义名称描述的是用途。

我们始终使用语义。

---

### 永远不要使用硬编码颜色

禁止：

```css
color: #3b82f6;
background: rgb(0, 111, 238);
border: hsl(...);
```

也禁止：

```tsx
className = "bg-blue-500";
```

除非明确属于品牌资源（如 Logo、插画、图片），否则不应直接使用固定颜色。

---

### Theme 应该自动工作

项目最大的优势之一，就是**几乎所有颜色都会随着主题自动变化**。

例如：

```tsx
<Button color="primary" />

<div className="bg-background text-foreground">
```

无需判断：

```tsx
if (theme === "dark") ...
```

也无需维护两套颜色。

HeroUI 会根据当前主题自动提供对应的颜色值及其 Hover、Foreground、Soft 等衍生状态。

这也是本项目坚持使用 HeroUI Semantic Colors 的原因。

---

## HeroUI 是唯一颜色来源

项目中的颜色应全部来自 HeroUI。

包括：

- Background
- Foreground
- Surface
- Accent
- Default
- Success
- Warning
- Danger
- Separator
- Border
- Overlay
- Backdrop
- Field

除非有特殊说明，不新增自己的颜色 Token。

---

## 状态颜色

状态颜色应交由 HeroUI 自动管理。

例如：

```tsx
bg - accent;
bg - accent - hover;

bg - success;
bg - success - hover;

text - accent - foreground;
```

不要自行计算：

- Hover
- Active
- Focus
- Disabled

也不要人为调整透明度来模拟状态颜色。

统一使用 HeroUI 已提供的语义颜色。

---

## 自定义颜色

原则上**不新增颜色**。

只有以下情况允许新增：

- 品牌主色。
- 第三方平台品牌色（GitHub、Google 等）。
- 数据可视化配色。
- 插画或营销内容。

新增颜色必须：

- 同时提供 Light 与 Dark Theme。
- 保持语义命名。
- 完整接入 HeroUI Theme。

不能仅添加一个 Hex Color 后直接使用。

---

## 禁止事项

以下做法不符合项目规范：

- 使用 Hex Color。
- 使用 `rgb()`、`hsl()` 等硬编码颜色。
- 使用 Tailwind 原始颜色（如 `blue-500`、`red-600`）。
- 在组件内维护 Light / Dark 两套颜色。
- 为 Hover 手动调整透明度。
- 为每个组件创建独立颜色变量。
- 使用颜色表达组件类型，而不是表达语义。

---

## 最终原则

颜色属于设计系统，而不是组件。

组件只负责表达语义：

- Background
- Foreground
- Accent
- Success
- Warning
- Danger

至于它们最终显示成什么颜色，应完全交给 HeroUI Theme 决定。

这样，当主题发生变化时，整个网站都会自然地完成颜色迁移，而无需修改任何业务代码。

Components don't own colors. Themes do.
