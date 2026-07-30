# 数据流

## 目标

数据流文档说明数据如何在路由、组件、状态管理、缓存、持久化和后端之间流动。统一数据流可以减少重复请求、状态漂移和组件间隐式耦合。

## 数据来源

Odyssey 当前主要数据来源包括：

- 后端业务 API：文章、评论、用户、角色、权限、分类、标签、项目、作品集等。
- Route Handler：音乐流解析、分享列表等局部接口。
- 本地持久化：鉴权、主题、语言、富文本草稿 id。
- 静态配置：站点信息、字体、导航、演示 dashboard 数据。
- 组件局部状态：表单输入、临时展开状态、动画状态。

## 标准读取链路

```text
Component
  -> generated RTK Query hook
  -> feature endpoint
  -> baseApi
  -> backend / rewrite
  -> response schema
  -> transformResponse
  -> RTK Query cache
  -> Component render
```

组件只消费最终业务数据，不直接依赖后端响应壳。

## 标准写入链路

```text
User action
  -> component handler
  -> feature mutation hook
  -> baseApi
  -> backend
  -> transformError / transformResponse
  -> invalidatesTags
  -> affected queries refetch
  -> UI feedback
```

写操作不应通过手动刷新页面完成一致性修复。优先使用 tag invalidation。

## 全局状态流

全局状态由 Redux store 管理，当前包含：

- `auth`：token、用户信息、角色、权限、登录/注册弹层状态。
- `locale`：语言状态。
- `ui`：主题变体、sheet、dashboard、富文本弹层和 active id。
- `api`：RTK Query 缓存、请求状态和订阅。

规则：

- 服务端数据优先放入 RTK Query cache。
- 跨页面 UI 状态可放入 `ui-slice`。
- 用户凭证放入 `auth-slice`。
- 临时表单输入优先放组件局部 state。
- 不要为单个组件的 hover、展开、tab 临时状态引入 Redux。

## 持久化流

本地持久化由 listener middleware 和主题同步逻辑处理。

```text
Redux action
  -> listener middleware
  -> LocalStorage / Cookie
  -> next page load
  -> loadPersistedState / getInitialThemeState
  -> Provider hydration
```

当前持久化内容包括：

- `odyssey_auth`
- 主题变体与兼容 key
- 主题模式和 resolved mode
- `odyssey_locale`
- `odyssey_draft_id`

组件不得重复实现这些持久化逻辑。

## 主题数据流

主题状态由服务端 Cookie、内联初始化脚本、`next-themes` 和 Redux UI slice 协同完成：

- 服务端 layout 读取 Cookie，写入 html data attributes。
- `theme-init` 脚本在交互前设置初始主题。
- `NextThemesProvider` 管理 light/dark/system。
- `ThemeRootSync` 同步主题变体、模式、resolved mode、class 和 color-scheme。
- listener middleware 写入持久化存储。

目标是降低首屏闪烁，并让主题状态在服务端渲染和客户端交互之间保持一致。

## 鉴权数据流

```text
Login success
  -> setCredentials
  -> auth state
  -> persistence middleware
  -> localStorage
  -> baseApi prepareHeaders
  -> Authorization header
```

401 响应：

```text
backend returns 401
  -> baseApi interceptor
  -> removeCredentials
  -> persistence middleware clears local auth
```

前端只负责凭证携带和 UI 状态，权限最终判定必须由后端完成。

## 编辑器数据流

```text
Open editor
  -> ui.richText activeId / initialValue
  -> Tiptap editor state
  -> autosave / local draft identity
  -> publish settings
  -> normalize JSONContent
  -> createPost / updatePost mutation
```

编辑器组件应保持编辑态与发布态分离。发布前必须执行内容标准化和元数据校验。

## 外部服务数据流

外部音乐服务通过 route handler 适配：

```text
Client request
  -> app route handler
  -> external music API
  -> response validation / URL rewrite
  -> redirect or JSON error
```

外部服务不稳定时，route handler 必须返回明确状态码，组件应提供失败态或降级体验。

## 数据流反模式

禁止：

- 组件中散落业务 `fetch`。
- 多个组件分别维护同一份服务端数据副本。
- 使用 Redux 保存可由 RTK Query 维护的列表数据。
- 在 UI 层解析后端响应壳。
- mutation 后强制整页 reload。
- 在组件中直接读写鉴权或主题持久化 key。

## 新数据流评审问题

新增数据链路前必须确认：

- 数据源是谁？
- 数据所有权在哪里？
- 是否需要缓存？
- 是否需要持久化？
- 是否需要跨页面共享？
- 失败时如何展示？
- 数据是否需要运行时校验？
- 写入后哪些查询需要失效？
