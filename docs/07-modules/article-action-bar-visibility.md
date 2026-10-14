# Article Action Bar 可见性设计与开发规范

本文定义文章阅读页 Action Bar 的产品行为、状态模型、实现边界和验收标准。
适用于 `features/blog/reader/article-actions/` 下的
`ArticleActionBar` 与 `useArticleActionVisibility`。

## 1. 目标

Action Bar 同时承担两类任务：

- 阅读时尽量不占用正文空间。
- 用户准备操作时，能在可预测的位置快速找到收藏、评论、分享和回到顶部等入口。

因此，可见性不能只由 `scrollY > 150` 这类单一条件决定，而应由以下上下文共同决定：

1. 页面位置：顶部、正文阅读区、文章结尾/推荐区。
2. 滚动方向：向上、向下、静止。
3. 方向累计距离：避免每个滚动事件都触发动画。
4. 操作状态：菜单、Sheet、Dialog、原生分享或异步请求是否仍在进行。
5. 键盘焦点：焦点是否仍在 Action Bar 内。
6. 动效偏好：是否启用 `prefers-reduced-motion`。

## 2. 当前实现审计

当前实现已经具备几个正确基础：

- 使用 passive `scroll` listener，并通过 `requestAnimationFrame` 合并采样。
- 通过 `isEngaged` 让评论 Sheet、集合菜单和创建集合 Dialog 打开时保持显示。
- 向上滚动时立即显示。
- 已有独立的纯函数和单元测试，适合继续扩展为状态机。

当前需要调整的行为：

- `ARTICLE_ACTION_SETTLE_MS = 700` 当前会在向下阅读停止后自动显示 Action Bar。这个机制不应被完全删除，否则用户在静止阅读时没有明显的点赞、收藏和分享入口；更合适的做法是把它收敛为受保护的“空闲恢复”，只显示紧凑形态，并由文章结尾、交互锁定和最小显示时长等规则约束。
- `scrollY <= ARTICLE_ACTION_REVEAL_OFFSET` 目前直接隐藏 Action Bar，与顶部应恢复初始状态的设计目标相反。
- 只比较相邻采样点，无法表达“累计向下/向上超过阈值”，容易因为触控板微小反向抖动频繁切换。
- 没有文章结尾哨兵，无法可靠避让正文末尾、评论区或推荐区。
- `isEngaged` 只覆盖部分打开状态，没有明确包含焦点保持、异步提交和分享进行中。
- Hook 只接收 `isEngaged`，没有接收文章根节点、文章结尾和 Action Bar 尺寸，页面位置判断只能依赖全局滚动距离。

## 3. 推荐的产品行为

### 3.1 顶部区域：显示初始状态

页面初次进入、回到文章顶部，或顶部哨兵位于顶部区域时：

- Action Bar 显示。
- 清除所有隐藏/显示待处理计数器和计时器。
- 如果产品有“完整操作入口”和“紧凑工具栏”两种形态，顶部使用完整形态；正文中使用紧凑形态。
- 如果当前只有一个固定的紧凑 Action Bar，则至少保证顶部可见，不要在顶部强制隐藏。

顶部判断应优先使用文章顶部哨兵或文章容器位置，而不是永久写死 `window.scrollY`。这样可以适应导航高度、字体加载、动态内容和不同页面壳层。

建议默认值：

- `topZone = 0..128px`，以文章起始位置或页面滚动位置为基准。
- 现有 `160px` 可以保留为第一版调参值，但应作为命名配置，不应散落在 Hook 内。

### 3.2 正文向下阅读：超过阈值后隐藏

当用户处于正文阅读区并持续向下滚动：

- 方向累计距离达到阈值后隐藏。
- 阈值以内不改变可见性。
- 滚动停止后可以进入“空闲恢复”，但必须等待完整的 settle 窗口，且只恢复紧凑 Action Bar。
- 已隐藏时继续向下滚动不重复触发动画。

建议默认值：

| 参数           |                        移动端 |  桌面端 | 说明                   |
| -------------- | ----------------------------: | ------: | ---------------------- |
| `hideDistance` |                        `64px` |  `88px` | 向下累计距离达到后隐藏 |
| `showDistance` |                        `40px` |  `56px` | 向上累计距离达到后显示 |
| `topZone`      |                       `128px` | `128px` | 顶部恢复初始状态       |
| `endSafety`    | `max(24px, barHeight + 16px)` |    同左 | 文章结尾避让距离       |

显示阈值应小于隐藏阈值，形成滞回区间。这样用户轻微向上修正滚动位置时不会让 Action Bar 立刻来回闪烁。

### 3.3 静止阅读：受保护的空闲恢复

完全隐藏 Action Bar 会降低操作的可发现性，因此推荐保留静止恢复，但不要把它当作普通滚动方向切换：

- 向下累计超过 `hideDistance` 后隐藏，并从最后一次滚动事件开始等待 `settleMs`。
- 在 `settleMs` 内继续滚动，取消当前恢复计时器并从最后一次滚动事件重新计时。
- 到达 `settleMs` 且不在文章结尾安全区时，显示**紧凑 Action Bar**。
- 空闲恢复只在一次连续向下滚动手势结束后触发一次；用户再次向下累计超过阈值后才允许下一次恢复。
- 空闲恢复后的 Action Bar 至少保持 `minVisibleMs`，避免刚显示就因微小滚动立即闪退；超过最小显示时间后，仍需累计达到 `hideDistance` 才隐藏。
- 如果用户处于 `near-end`，不触发空闲恢复，避免覆盖正文末尾、评论区或推荐区。

建议默认值：

| 参数           |   建议值 | 说明                       |
| -------------- | -------: | -------------------------- |
| `settleMs`     |  `700ms` | 从最后一次滚动事件开始计算 |
| `minVisibleMs` | `1200ms` | 空闲恢复后最短显示时间     |

这样用户不需要记住“向上滚动才能操作”，同时不会在每一个滚动采样点重复播放显隐动画。静止恢复展示的是紧凑工具栏，不应恢复顶部区域的完整标题、作者或额外信息。

### 3.4 正文向上回看：超过阈值后显示

当用户在正文阅读区向上累计滚动超过 `showDistance`：

- 立即显示紧凑 Action Bar。
- 取消任何待执行的隐藏动作。
- 之后的小幅向下修正不会立即隐藏，必须重新累计达到 `hideDistance`。

“向上显示”是用户寻找收藏、评论、分享等操作的可靠意图信号，不应等待滚动停止计时器。

### 3.5 接近文章结尾：优先保护内容

文章正文结束、评论区或推荐区即将进入 Action Bar 覆盖范围时：

- 默认隐藏固定 Action Bar，避免遮挡正文末尾和推荐内容。
- 不触发空闲恢复；只有向上滚动达到 `showDistance`、回到顶部或进入交互锁定时才重新显示。
- 用户向上滚动达到 `showDistance` 后可以重新显示。
- 如果用户已经打开菜单、Sheet 或 Dialog，则由交互锁定规则接管，继续保持显示。

不要只使用 `scrollHeight - innerHeight` 推断文章结尾。页面底部通常包含评论、推荐、页脚等非正文内容，必须在文章正文结束处放置独立哨兵：

```tsx
<article ref={articleRef} data-reading-content>
  <ArticleBodyReader ... />
  <div ref={articleEndRef} data-article-end aria-hidden="true" />
</article>
```

`nearEnd` 可以由以下条件计算：

```text
articleEndRect.top - viewportHeight <= actionBarHeight + endSafety
```

Action Bar 高度应通过 `ResizeObserver` 或测量 ref 获取；不要假设移动端和桌面端高度相同。

### 3.6 正在操作：保持显示并暂停自动逻辑

以下任一条件成立时，Action Bar 必须保持显示：

- 评论 Sheet 打开。
- 集合 Popover 打开。
- 创建集合 Dialog 打开或正在提交。
- 分享 Popover 打开，或 Web Share Promise 尚未结束。
- 收藏、阅读列表、集合等异步 mutation 尚未结束。
- 键盘焦点位于 Action Bar 或其弹层内。

交互锁定期间：

- 不累计滚动方向距离。
- 不启动隐藏计时器，也不启动空闲恢复计时器。
- 不因为到达文章结尾而隐藏。
- 关闭弹层或完成操作后，应立即根据“当前页面位置”重新求值，不应重放打开前积累的旧滚动方向。

最后一点很重要：关闭菜单时如果页面已经处于正文向下阅读区，Action Bar 可以立即隐藏；如果页面在顶部、向上回看或仍处于焦点中，则应保持显示。

## 4. 状态模型

建议把 Hook 的输出从单一 `isOpen` 扩展为“位置 + 可见性 + 锁定”的有限状态模型。

### 4.1 位置状态

```ts
type ArticleActionZone = "top" | "reading" | "near-end";
```

### 4.2 滚动方向

```ts
type ArticleActionDirection = "up" | "down" | "idle";
```

方向应由累计距离计算，而不是由单个事件的正负直接决定：

```text
向下采样：downDistance += delta
向上采样：upDistance += abs(delta)
方向反转：清零另一方向累计值
```

### 4.3 可见性状态

```ts
type ArticleActionVisibility = "visible" | "hidden";
```

建议 Hook 返回：

```ts
interface ArticleActionVisibilityState {
  isOpen: boolean;
  zone: ArticleActionZone;
  direction: ArticleActionDirection;
  progress: number;
  isInteractionLocked: boolean;
}
```

如果后续要支持顶部完整形态，再额外返回：

```ts
type ArticleActionPresentation = "full" | "compact";
```

不要让 `isOpen` 同时承担“是否渲染”和“是完整还是紧凑”两个语义。

## 5. 决策优先级

每一次滚动采样或上下文变化，都按以下顺序决策：

1. **交互锁定**：打开菜单、弹层、异步操作或焦点在 Action Bar 内，强制显示。
2. **顶部区域**：强制显示，清空方向累计值。
3. **文章结尾保护**：进入 `near-end` 时隐藏并禁止空闲恢复，除非第 1 条成立。
4. **向上累计超过阈值**：显示并清除隐藏待处理状态。
5. **向下累计超过阈值**：隐藏，并从最后一次滚动事件开始等待空闲恢复。
6. **空闲恢复窗口完成**：显示紧凑 Action Bar，并进入最小显示时间保护。
7. **未达到阈值或仍在等待**：保持当前可见性，不改变状态。

这组优先级保证了“用户正在操作”高于“避免遮挡内容”，而“避免遮挡内容”高于普通方向提示。

## 6. Hook 接口建议

推荐把 `useArticleActionVisibility(isEngaged)` 改为接收结构化参数：

```ts
interface UseArticleActionVisibilityOptions {
  articleRef: RefObject<HTMLElement | null>;
  articleEndRef: RefObject<HTMLElement | null>;
  actionBarRef: RefObject<HTMLElement | null>;
  isEngaged: boolean;
  isFocusWithin?: boolean;
  topOffset?: number;
  hideDistance?: number;
  showDistance?: number;
  endSafety?: number;
}
```

可以保留一个兼容重载，但业务组件最终应显式提供 ref 和操作状态。这样 Hook 不会依赖全局选择器，也不会把某个页面的布局常量隐藏在实现中。

实现约束：

- 使用一个 passive `scroll` listener。
- 使用一个 `requestAnimationFrame` 合并滚动采样。
- `scrollY` 从 `document.scrollingElement` 读取。
- 仅在 `isOpen`、`zone`、`direction` 或整数百分比发生变化时更新 React state。
- 使用 `ResizeObserver` 重新计算 Action Bar 高度。
- 文章结尾哨兵使用 `IntersectionObserver` 或 `getBoundingClientRect`，但最终结果必须统一进入同一个决策函数。
- 组件卸载时取消 frame、observer 和所有 timer。
- 不在 scroll handler 中调用 `getBoundingClientRect` 多次；每帧读取一次布局数据，再统一计算。

## 7. 动画与无障碍

Action Bar 的显隐只应动画 `transform` 和 `opacity`，不能动画 `height`、`margin` 或会改变正文布局的属性。

推荐行为：

- 显示：`160ms..220ms`，轻微向上/向内移动，ease-out。
- 隐藏：`120ms..180ms`，更快移出阅读路径。
- 动画可被新的滚动方向或用户操作立即中断。
- `prefers-reduced-motion: reduce` 下使用即时切换或极短淡入淡出，不使用位移。

Action Bar 隐藏时仍应保留可访问的语义策略：

- 不把仍有焦点的控件从 DOM 中移除。
- 如果焦点进入 Action Bar，立即显示并锁定。
- 所有 icon-only 按钮必须有稳定的 `aria-label`。
- Tooltip 不能作为唯一的操作名称。
- 弹层关闭后焦点回到触发按钮，关闭过程不能导致 Action Bar 消失后焦点丢失。

## 8. 测试计划

### 8.1 纯函数单元测试

至少覆盖以下决策表：

| 场景                        | 期望             |
| --------------------------- | ---------------- |
| 初始位于顶部                | 显示、`zone=top` |
| 向下 20px                   | 保持原状态       |
| 向下累计达到 `hideDistance` | 隐藏             |
| 隐藏后静止                  | 继续隐藏         |
| 向上 20px                   | 保持原状态       |
| 向上累计达到 `showDistance` | 显示             |
| 进入文章结尾安全区          | 隐藏             |
| 文章结尾安全区 + 菜单打开   | 显示并锁定       |
| 菜单关闭且仍在结尾安全区    | 重新求值并隐藏   |
| 菜单关闭且页面在顶部        | 显示             |
| 焦点在 Action Bar 内        | 显示并锁定       |
| `maxScroll <= 0` 的短文章   | 显示且进度为 `0` |

### 8.2 Hook/组件测试

- fake `requestAnimationFrame` 验证一个 frame 内只采样一次。
- fake timers 验证不会存在“滚动停止后自动显示”的旧行为。
- mock `IntersectionObserver` 验证文章结尾哨兵切换。
- 验证交互锁定时累计距离不会增长。
- 验证锁定结束后使用当前 scroll position，而不是旧方向历史。
- 验证 resize 后 `actionBarHeight` 和 `nearEnd` 重新计算。

### 8.3 E2E 验收

至少在 `390px`、`820px`、`1440px` 三种宽度验证：

- 初始顶部可见。
- 向下超过阈值后隐藏，正文不被遮挡。
- 停止滚动不会自动重新显示。
- 向上超过阈值后显示。
- 返回顶部后恢复初始状态。
- 文章末尾和推荐区不被覆盖。
- 打开评论、集合菜单、创建集合 Dialog 时持续可见。
- 键盘 Tab 进入 Action Bar 后不会消失。
- `prefers-reduced-motion` 下无明显位移动画。
- 短文章、动态加载内容、窗口 resize 不会产生错误隐藏或布局抖动。

## 9. 推荐实施顺序

1. 把纯函数从“单次 scroll intent”扩展为带 zone、累计距离和锁定优先级的决策函数。
2. 将 700ms 恢复改为从最后一次滚动事件开始计算的空闲恢复，并增加 `minVisibleMs` 保护。
3. 在文章正文结束处添加 `articleEndRef` 哨兵，并在 Action Bar 上添加可测量 ref。
4. 将焦点、异步请求和分享进行中的状态并入 `isInteractionLocked`。
5. 把顶部显示、正文隐藏、空闲恢复、结尾避让接入同一状态机。
6. 先补纯函数和 Hook 测试，再补移动端、桌面端和 reduced-motion E2E。
7. 根据真实阅读数据微调阈值；首版不要同时改变按钮顺序、视觉样式和定位方式，以便区分行为回归与视觉回归。

## 10. 验收标准

该功能只有同时满足以下条件才算完成：

- 向下阅读时不会在滚动尚未稳定前反复触发动画；停止约 `700ms` 后可恢复紧凑 Action Bar，以保留点赞、收藏和分享的可发现性。
- 用户向上回看达到阈值后，Action Bar 能稳定显示。
- 回到顶部始终恢复初始可见状态。
- 菜单、弹层、异步操作和键盘焦点期间不会消失。
- 文章末尾和推荐区不会被固定 Action Bar 覆盖。
- 方向反转不会导致每几像素一次的闪烁。
- 动态内容、resize、短文章和 reduced-motion 都有明确且可测试的行为。
- 逻辑集中在 `useArticleActionVisibility` 及其纯函数中，`ArticleActionBar` 只负责组合业务操作和传递状态。
