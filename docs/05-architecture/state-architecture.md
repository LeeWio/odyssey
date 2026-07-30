# 状态架构

## 定位

状态架构定义哪些数据应该放在 Redux、RTK Query、组件局部状态、URL、Cookie 或 LocalStorage 中。核心原则是：状态必须有明确所有权，不能因为访问方便就全局化。

## 状态分类

- 服务端状态：来自后端或外部服务的数据。
- 应用状态：跨页面、跨模块共享的 UI 或会话状态。
- 表单状态：用户正在输入但尚未提交的数据。
- 派生状态：可由已有数据计算得到的值。
- 持久化状态：刷新后需要恢复的偏好或会话信息。
- 路由状态：应由 URL 表达的筛选、定位和导航信息。

## 状态存放规则

| 类型            | 存放位置                         | 示例                             |
| --------------- | -------------------------------- | -------------------------------- |
| 服务端列表/详情 | RTK Query cache                  | 文章、评论、用户、标签           |
| 鉴权会话        | auth slice + LocalStorage        | token、username、roles           |
| 全局 UI         | ui slice                         | dashboard、sheet、rich text 弹层 |
| 主题偏好        | ui slice + Cookie + LocalStorage | theme variant、mode              |
| 语言偏好        | locale slice + LocalStorage      | locale                           |
| 表单输入        | 组件局部 state                   | 发布设置、评论输入               |
| 编辑器文档      | Tiptap editor state              | JSONContent                      |
| 页面定位        | URL / route params               | slug、分页、筛选                 |

## Redux Store

位置：`lib/store.ts`

store 当前组合：

- `localeSlice`
- `authSlice`
- `uiSlice`
- `baseApi`

middleware 当前包含：

- RTK Query middleware
- persistence listener middleware

`makeStore` 每次创建独立 store 实例，避免 SSR 场景下跨请求状态污染。

## RTK Query

RTK Query 是服务端状态的默认方案。

适用：

- 列表查询。
- 详情查询。
- 创建、更新、删除。
- 自动缓存。
- 请求状态。
- 缓存失效。

不适用：

- 纯 UI 开关。
- 临时表单输入。
- 动画中间状态。
- 本地编辑器光标状态。

## Auth State

auth slice 管理：

- access token。
- username。
- email。
- roles。
- permissions。
- 登录状态。
- 登录/注册弹层开关。

规则：

- token 只作为请求凭证来源。
- 角色和权限只用于 UI 展示和入口控制。
- 401 必须清空 credentials。
- 不在 auth slice 保存用户业务列表或 profile 详情缓存。

## UI State

ui slice 管理：

- sheet 是否打开。
- theme variant。
- dashboard 是否打开。
- rich text 是否打开。
- rich text active id。
- rich text initial value。
- rich text read-only 状态。

规则：

- 只放跨模块或全局交互状态。
- 局部 tab、hover、accordion 不进入 ui slice。
- 富文本 active id 可持久化，用于恢复编辑上下文。

## Locale State

locale slice 表达用户语言偏好。当前 layout 仍从请求头推导初始语言，客户端 provider 接收该语言和消息。

后续若引入语言路由，应重新定义 locale state、URL 和 middleware 的权责。

## 持久化策略

持久化由 `lib/middleware/persistence.ts` 和主题同步逻辑处理。

持久化内容：

- auth。
- theme variant。
- legacy theme key。
- locale。
- rich text draft id。

原则：

- 持久化是副作用，必须集中处理。
- 读取持久化状态必须兼容 SSR。
- 解析失败要降级，不阻塞应用启动。
- 敏感信息不应长期扩展存入 LocalStorage。

## 组件局部状态

适合局部 state：

- 输入框值。
- 发布设置面板开关。
- 临时选中项。
- hover/press 反馈。
- 非跨页面临时筛选。

组件局部状态提升为全局状态前必须证明：

- 多个远距离组件需要共享。
- 刷新后需要恢复。
- URL 无法表达。
- props 传递会造成明显结构问题。

## 派生状态

派生状态不应重复存储。

示例：

- 是否已登录可由 token 或 `isAuthenticated` 表达，但必须保持一致。
- 主题名称可由 variant 和 resolved mode 计算。
- 文章摘要可由内容提取，但发布后应作为后端字段保存。

如果派生值计算昂贵，可以在明确性能问题后再缓存。

## 状态反模式

禁止：

- 把 API 列表复制到 Redux slice。
- 把组件临时输入放入全局 store。
- 在多个地方持久化同一个 key。
- 用 LocalStorage 做模块通信。
- mutation 成功后手动同步多个 state 副本。
- 在组件中直接操作 RTK Query 内部 cache，除非有明确 optimistic update 需求。

## 新状态评审问题

- 状态所有者是谁？
- 状态生命周期多长？
- 是否来自服务端？
- 是否需要跨页面共享？
- 是否需要刷新后恢复？
- 是否能由 URL 表达？
- 是否能由已有状态派生？
- 失败或过期时如何恢复？
