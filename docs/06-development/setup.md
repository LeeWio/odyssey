# 本地开发设置

## 环境要求

- Node.js 24（与 Docker 镜像一致）
- Bun 1.3.14（仓库在 `package.json` 中声明的包管理器）
- 可访问的 Odyssey 后端 API；本地默认地址为 `http://127.0.0.1:8080`
- 安装 HeroUI Pro 依赖所需的 `HEROUI_AUTH_TOKEN`

## 安装依赖

```bash
bun install --frozen-lockfile
```

## 配置环境变量

在项目根目录创建 `.env.local`：

```dotenv
NEXT_PUBLIC_API_BASE_URL=
API_URL=http://127.0.0.1:8080
```

开发测试页面可以额外启用：

```dotenv
ENABLE_AUTH_TEST_ROUTE=1
ENABLE_RICH_TEXT_TEST_ROUTE=1
```

不要提交 `.env.local` 或任何服务密钥。前端通过 Next.js rewrite 将 `/api/v1/*`、`/oauth2/*` 和 `/login/oauth2/*` 转发到 `API_URL`。

## 启动项目

```bash
bun run dev
```

打开 <http://localhost:3000>。启动脚本会先生成主题作用域文件。

## 质量检查

提交前运行：

```bash
bun run preflight
bun run test:e2e
bun run build
```

纯文档改动检查 Prettier 和链接即可。`lint` 使用 `--max-warnings 0`；针对任意媒体域名的原生图片使用逐处说明的规则例外。

## 后端依赖

后端为 Nexus，当前工作区位于相邻目录 `../nexus`。其 `pom.xml` 声明 Java 21 和 Spring Boot 4.1.0；后端仓库未提供 README，因此启动参数以其配置为准，而不是假定默认值可直接连接生产服务。

本地使用 JDK 21 和 Nexus 自带的 Maven Wrapper：

```bash
cd ../nexus
# 按下表在当前终端设置开发环境变量后运行
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

| 服务          | 开发配置                                                                          | 说明                   |
| ------------- | --------------------------------------------------------------------------------- | ---------------------- |
| MySQL         | `DEV_DB_HOST`、`DEV_DB_PORT`、`DEV_DB_NAME`、`DEV_DB_USERNAME`、`DEV_DB_PASSWORD` | 文章、用户等业务数据   |
| Redis         | `DEV_REDIS_HOST`、`DEV_REDIS_PORT`、`DEV_REDIS_PASSWORD`                          | 缓存等服务             |
| RabbitMQ      | `RABBITMQ_HOST`、`RABBITMQ_PORT`、`RABBITMQ_USERNAME`、`RABBITMQ_PASSWORD`        | 消息服务               |
| Elasticsearch | `ES_URIS`、`SEARCH_TYPE`                                                          | 搜索服务，取决于配置   |
| 邮件          | `DEV_MAIL_HOST`、`DEV_MAIL_PORT`、`DEV_MAIL_USERNAME`、`DEV_MAIL_PASSWORD`        | 注册和订阅等邮件流程   |
| OAuth         | `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` 或 Google 对应变量        | 第三方登录             |
| 回调与来源    | `OAUTH2_REDIRECT_URI`、`CORS_ALLOWED_ORIGINS`、`APP_BASE_URL`                     | 对齐本地前端来源和回调 |

Nexus 的 `docker-compose.yml` 还提供 MySQL、Redis、RabbitMQ、Elasticsearch、Mailpit 等服务定义。宿主机映射端口分别包含 MySQL 3307、Redis 6380、RabbitMQ 5672、Elasticsearch 9200 和 SMTP 1025。启动之前检查并设置数据库、消息服务和邮件配置；不要直接沿用其他环境的凭据。本次未启动这些基础设施，也未验证完整后端启动。

前端仓库不包含核心业务数据库和后端服务。要验证登录、评论、文章、文件上传、市场数据和后台管理，需要先启动兼容的 Odyssey API 服务，并确认：

- API 基础路径为 `/api/v1`
- OAuth2 回调地址指向当前前端的 `/oauth2/redirect`
- 文件上传和媒体 URL 可被浏览器访问
- 认证 Cookie 或 Bearer token 能够被本地开发域使用
- OpenAPI 地址可通过 `OPENAPI_URL` 访问

没有后端时，首页中的部分静态内容仍可渲染，但依赖 API 的功能会显示加载、空状态或错误状态。

## 目录边界

- `app/`：路由、布局、页面入口和 Route Handlers
- `features/<domain>/`：页面级产品模块和跨页面业务组合
- `lib/features/<domain>/`：领域 API、schema、RTK Query endpoint、slice 和类型
- `components/`：可复用 UI；通用 primitive 放在 `components/ui/`
- `config/`：稳定配置
- `docs/`：产品、设计、架构和开发文档

新增功能时，先确定领域归属，再选择页面组合、业务模块或 API 层。不要把后端请求直接写进页面，也不要在 `features/` 与 `lib/features/` 之间复制同一份领域逻辑。

## 验证后端连接

后端运行后，先验证直连和前端代理：

```bash
curl --fail --max-time 15 http://127.0.0.1:8080/v3/api-docs -o /tmp/nexus-openapi.json
curl --fail --max-time 15 'http://localhost:3000/api/v1/public/blog/posts?page=0&size=1'
OPENAPI_URL=http://127.0.0.1:8080/v3/api-docs bun run api:contract
```

OpenAPI 脚本由 Node 直接执行，不会自动加载 Next.js 的 `.env.local`；请像上例一样显式传入 `OPENAPI_URL`。合约检查只验证接口路径和方法等静态对齐情况，不能替代真实账号的登录、评论、文章发布、上传和权限验收。

- 直连失败：检查后端进程和监听端口。
- 直连成功、代理失败：检查 `API_URL`，重启开发服务器。
- 返回 401/403：检查登录身份与权限，不要把认证失败当作服务离线。
- 文件请求失败：检查 API 返回的 URL、存储配置及浏览器可达性。

生产环境 rewrite 目标在构建时写入产物；仅更改容器运行时的 `API_URL` 不能保证修改已构建的代理目标。修改目标后需要重新构建，并检查 `.next/routes-manifest.json`。

现有 `.github/workflows/ci.yml` 已执行格式、Lint、类型、单元测试、浏览器测试和构建；无需新建重复的 CI。

## 本次连接检查结果（2026-09-16）

`http://localhost:8080/v3/api-docs` 可访问，但当前运行实例的合约检查未通过：275 个前端操作中有 262 个匹配，13 个未匹配（前端操作数含重复路径）。缺失分布如下：

| 模块          | 未匹配的操作                                       |
| ------------- | -------------------------------------------------- |
| Dashboard     | 内容概览、编辑日历、内容工作流（3 个 GET）         |
| Kanban        | 清单项完成状态、编辑与删除（PATCH / PUT / DELETE） |
| Newsletter    | 概览、订阅者、发送批次、批次详情（4 个 GET）       |
| Notifications | 完成、重新打开、收藏（3 个 PATCH）                 |

相邻 Nexus 源码已有对应 Controller 映射，说明当前实例与本地源码可能存在版本差异；尚未确认运行实例的构建版本。应先核对后端版本、更新对应开发实例后重跑 `api:contract`，不能通过删除前端接口或放宽检查使结果“通过”。这些功能暂不应视为完成了前后端联调。

## 本次前端验证结果（2026-09-16）

- ESLint：零错误、零警告；新增数据层禁止反向导入 UI 的约束。
- TypeScript、生产构建及 40 个单元测试通过。
- 浏览器回归在独立生产构建上执行：20 项中 17 项通过，3 项失败。阅读器与认证测试全部通过；富文本失败包括两处过期的 `li.odyssey-task-item` 选择器，以及任务复选框点击被装饰层拦截。相关编辑器实现和原有测试本次未修改，仍需后续修复和验证。
- 当前开发服务曾出现页面交互未就绪导致全套浏览器用例失败的情况，不能将复用该服务的结果作为代码回归结论；复用测试服务器前应确认页面已经完成客户端初始化。
