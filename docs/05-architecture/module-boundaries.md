# 模块边界

## 目标

模块边界用于说明 Odyssey 中各业务模块的职责、所有权和可依赖范围。清晰的边界可以避免一个功能在多个目录中被重复实现，也可以防止实验模块污染稳定核心。

## 模块分类

模块分为三类：

- 核心模块：构成产品长期价值，必须保持稳定。
- 支持模块：服务核心体验，可独立演进。
- 实验模块：验证想法或提供临时体验，必须限制影响范围。

## 当前模块地图

### Home

位置：`app/page.tsx`、`components/home`、`components/background`、`components/music`

职责：

- 承载产品入口和品牌体验。
- 展示个人 telemetry、内容入口和视觉叙事。
- 组合音乐、背景、动效和导航入口。

边界：

- 不承担文章业务规则。
- 不直接定义后端数据模型。
- 首页实验动效不得影响全局 layout 稳定性。

### Blog / Article

位置：`app/blog`、`app/single`、`components/blog`、`lib/features/post`

职责：

- 文章列表、详情、阅读体验。
- 文章查询、搜索、互动统计。
- 阅读进度、侧栏、媒体展示。

边界：

- 内容获取必须通过 post feature。
- 阅读组件不负责编辑器状态。
- 文章展示不直接管理分类、标签后台逻辑。

### Comment

位置：`components/comment`、`lib/features/comment`

职责：

- 文章评论和留言板交互。
- 评论树展示、输入、点赞、回复。
- 后台评论审核入口的数据能力。

边界：

- 评论状态由后端裁决。
- 评论组件不应直接修改文章缓存，必须通过 tag invalidation。
- 评论树归一化在 API 层完成。

### Rich Text Editor

位置：`components/rich-text`、`lib/features/post`、`lib/features/ui`

职责：

- 富文本编辑。
- 内容标准化、摘要提取、slug 生成。
- 发布设置与文章创建/更新。
- 编辑器弹层状态。

边界：

- 编辑器不直接控制文章阅读页。
- 展示组件不依赖编辑器实例。
- 编辑器状态和发布状态必须分离。

### Dashboard

位置：`components/dashboard`、`lib/features/dashboard` 及相关 admin features

职责：

- 后台管理信息架构。
- 用户、权限、角色、文章、评论、友链、标签等管理入口。
- 仪表盘数据展示和管理组件编排。

边界：

- Dashboard 只负责管理体验，不定义所有业务实体规则。
- 各业务实体的 API 仍归属对应 feature。
- 演示数据与真实后端数据必须明确区分。

### Auth

位置：`components/auth`、`lib/features/auth`

职责：

- 登录、注册弹层状态。
- token、用户、角色和权限的客户端状态。
- 请求鉴权 header 数据来源。

边界：

- 前端鉴权不是安全边界。
- 权限最终由后端校验。
- auth slice 不应包含业务实体数据。

### Theme / UI Shell

位置：`app/layout.tsx`、`app/providers.tsx`、`lib/theme*`、`lib/features/ui`

职责：

- 全局主题、语言、导航、footer、控制面板、弹层开关。
- 主题首屏初始化和持久化同步。

边界：

- UI shell 不持有业务列表数据。
- 主题系统不应被单个模块私自覆盖。

### Music

位置：`components/music`、`components/blog/music-mini-widget`、`app/vae-song-stream`

职责：

- 音乐展示、播放体验、外部音乐资源适配。
- 局部分享列表。

边界：

- 第三方音乐 API 不属于核心后端。
- 音乐 route handler 失败不应影响文章或首页核心渲染。
- 本地 data 写入只适合轻量或实验场景。

### Market / Stock

位置：`components/blog/stock-ledger`、`components/sheet-panel/widgets/stocks`、`lib/features/market`

职责：

- 股票或市场相关展示。
- 个人 telemetry 的数据表达。

边界：

- 不应与文章内容模型耦合。
- 市场数据来源和时效性必须在模块文档中说明。

## 跨模块通信

允许方式：

- URL 参数。
- props。
- 共享 feature API hook。
- Redux 中明确的全局 UI 状态。
- RTK Query tag invalidation。

禁止方式：

- 一个模块直接修改另一个模块的内部 state。
- 通过 localStorage 作为模块间实时通信机制。
- 从组件深层路径导入另一个模块私有 helper。
- 使用全局事件总线绕过 React 数据流。

## 新模块准入

新增模块前必须定义：

- 模块名称。
- 模块类型：核心、支持或实验。
- 用户价值。
- 数据来源。
- API 所属 feature。
- UI 所属目录。
- 是否需要后台管理。
- 是否需要持久化。
- 是否影响全局 shell。

若模块会影响路由结构、权限体系、设计系统或 API 基线，必须新增 ADR。
