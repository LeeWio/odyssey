<div align="center">

# Odyssey

**A personal digital space for writing, experiments, and things worth keeping.**

[中文](./README.zh-CN.md) · [English](./README.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-private-lightgrey)](#许可证)

</div>

Odyssey 是一个持续演进的个人数字空间。它从博客出发，将文章、短内容、图片、音乐、研究记录、市场数据和个人工具放在同一个有连续性的体验中。

## 内容

- [项目简介](#项目简介)
- [主要能力](#主要能力)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [常用命令](#常用命令)
- [项目结构](#项目结构)
- [架构约定](#架构约定)
- [部署](#部署)
- [文档](#文档)
- [贡献](#贡献)
- [许可证](#许可证)

## 项目简介

Odyssey 关注三件事：

1. **内容优先**：让文章和长期积累成为产品的中心。
2. **体验一致**：不同内容类型共享同一套设计语言、主题和交互原则。
3. **持续演进**：每个模块都能独立发展，同时保持整体身份一致。

这是一个私有的个人产品项目，部分页面、数据和外部服务依赖运行中的后端环境。

## 主要能力

- 文章、栏目、归档、时间线与沉浸式阅读
- 评论、留言板、通知、登录与 OAuth2
- Tiptap 富文本编辑器：图片、附件、音频、视频、表格、公式、目录等
- 音乐播放、最近播放与媒体展示
- 市场数据卡片、股票信息与个人仪表盘
- 图库、项目、链接、关于和使用记录
- 星座/宇宙可视化与 Three.js 3D 资源
- 后台内容、用户、角色、权限、标签和分类管理
- RSS、API 代理、国际化、主题切换与减少动效支持

## 技术栈

| 层级         | 技术                                            |
| ------------ | ----------------------------------------------- |
| 应用         | Next.js 16 · App Router · React 19 · TypeScript |
| UI           | HeroUI · HeroUI Pro · Tailwind CSS 4            |
| 状态与数据   | Redux Toolkit · RTK Query · Zod                 |
| 编辑器       | Tiptap 3                                        |
| 动画与 3D    | Motion · GSAP · React Three Fiber · Three.js    |
| 国际化与主题 | next-intl · next-themes · 自定义主题变量        |
| 质量保障     | Vitest · Playwright · ESLint · Prettier         |

## 快速开始

### 前置条件

- Node.js 24+
- Bun 1.3.14（仓库推荐的包管理器）
- 可访问的后端 API；本地默认地址为 `http://127.0.0.1:8080`

### 安装并运行

```bash
bun install --frozen-lockfile
bun run dev
```

打开 <http://localhost:3000>。开发命令会先生成 HeroUI Pro 主题作用域，再启动 Next.js。

### 环境变量

在项目根目录创建 `.env.local`：

```dotenv
# 浏览器端 API 地址；留空表示使用同源 /api/v1/*
NEXT_PUBLIC_API_BASE_URL=

# Next.js rewrite 转发目标
API_URL=http://127.0.0.1:8080

# OpenAPI 合约工具地址
OPENAPI_URL=http://localhost:8080/v3/api-docs

# 可选：启用本地测试页面
ENABLE_AUTH_TEST_ROUTE=1
ENABLE_RICH_TEXT_TEST_ROUTE=1
```

不要把密钥提交到仓库。生产部署通常使用同源 API；跨服务部署时再配置 `NEXT_PUBLIC_API_BASE_URL` 和 `API_URL`。

## 常用命令

| 命令                   | 说明                               |
| ---------------------- | ---------------------------------- |
| `bun run dev`          | 启动开发服务器                     |
| `bun run build`        | 生成生产构建                       |
| `bun run start`        | 启动生产服务器                     |
| `bun run lint`         | ESLint 检查                        |
| `bun run typecheck`    | TypeScript 检查                    |
| `bun run test:unit`    | Vitest 单元测试                    |
| `bun run test:e2e`     | Playwright 端到端测试              |
| `bun run preflight`    | Prettier、Lint、类型检查和单元测试 |
| `bun run api:contract` | OpenAPI 合约检查                   |
| `bun run api:coverage` | OpenAPI 覆盖率检查                 |
| `bun run api:generate` | 生成 OpenAPI 客户端                |

提交前建议运行：

```bash
bun run preflight
bun run test:e2e
```

## 项目结构

```text
app/                 App Router 路由、布局、页面和 Route Handlers
components/          可复用 UI、业务组件和编辑器组件
config/              站点和字体等稳定配置
features/            跨页面的产品功能组合
lib/api/             API 基础设施、错误处理和请求边界
lib/features/        领域 API、RTK Query、slice、类型和合约
public/              图片、字体、图标和 3D 模型
scripts/             主题生成、OpenAPI 和链接检查脚本
styles/              全局样式与主题变量
tests/               Playwright 端到端测试
docs/                产品、设计、架构、开发与决策文档
```

## 架构约定

- `app/` 只负责路由级组合；复杂业务逻辑下沉到 `components/` 或 `lib/features/`。
- 领域数据和状态进入对应 feature；组件通过 RTK Query hook 或明确的 API 边界访问后端。
- 后端请求统一经过 API 层，不在页面中散落业务 `fetch`。
- 接口响应在边界进行 schema 校验或转换；缓存、错误和鉴权由 API 基础设施统一处理。
- 优先组合 HeroUI；新增自定义 primitive 时，需要说明现有组件无法满足的原因。
- 交互需要支持键盘操作，并尊重 `prefers-reduced-motion`。

生产构建使用 Next.js standalone，并将 `/api/v1/*`、`/oauth2/*` 和 `/login/oauth2/*` rewrite 到后端服务。

## 部署

项目提供多阶段 [Dockerfile](./Dockerfile)，最终镜像以无特权用户运行：

```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=heroui_auth_token,src="$HOME/.heroui-auth-token" \
  -t odyssey .

docker run --rm -p 3000:3000 \
  -e API_URL=http://host.docker.internal:8080 \
  odyssey
```

`HEROUI_AUTH_TOKEN` 仅用于安装 HeroUI Pro 依赖，应通过 CI/CD secret 或 Docker BuildKit secret 注入。

## 文档

- [文档总览](./docs/README.md)
- [项目概述](./docs/01-introduction/overview.md)
- [产品地图](./docs/01-introduction/product-map.md)
- [架构总览](./docs/05-architecture/architecture-overview.md)
- [API 架构](./docs/05-architecture/api-architecture.md)
- [开发规范](./docs/06-development/conventions.md)
- [设计系统](./docs/04-design/design-system.md)
- [模块文档](./docs/07-modules/)
- [架构决策记录](./docs/09-decisions/)

## 贡献

这是一个私有项目。提交改动前，请阅读 [项目规则](./docs/00-project-rules.md) 和 [开发规范](./docs/06-development/conventions.md)，并确保相关测试、接口合约和文档同步更新。

## 许可证

仓库当前未声明开源许可证。字体、图片、图标和其他第三方资源的授权信息以各资源目录中的许可文件及来源说明为准。
