<div align="center">

# Odyssey

**A personal digital space for writing, experiments, and things worth keeping.**

[中文](./README.zh-CN.md) · [English](./README.md)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-private-lightgrey)](#license)

</div>

Odyssey is an evolving personal digital space. It started as a blog and brings writing, notes, images, music, research, market data, and personal tools into one coherent experience.

## Contents

- [Overview](#overview)
- [Capabilities](#capabilities)
- [Technology](#technology)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

Odyssey is built around three principles:

1. **Content first** — writing and long-term accumulation are the center of the product.
2. **One coherent experience** — different content types share the same design language and interaction rules.
3. **Designed to evolve** — features can grow independently while keeping a consistent identity.

This is a private personal product. Some pages, data, and integrations require a running backend service.

## Capabilities

- Articles, columns, archives, timelines, and focused reading
- Comments, guestbook, notifications, login, and OAuth2
- Tiptap rich-text editing with media, tables, math, and table-of-contents extensions
- Music playback and recently played items
- Market data cards, stock information, and personal dashboards
- Gallery, projects, links, about, and uses pages
- Constellation and universe visualizations with Three.js (procedural meshes)
- Admin views for content, users, roles, permissions, tags, and categories
- RSS, API proxying, internationalization, themes, and reduced-motion support

## Technology

| Layer           | Technology                                                |
| --------------- | --------------------------------------------------------- |
| Application     | Next.js 16 · App Router · React 19 · TypeScript           |
| UI              | HeroUI · HeroUI Pro · Tailwind CSS 4                      |
| State and data  | Redux Toolkit · RTK Query · Zod                           |
| Editor          | Tiptap 3                                                  |
| Motion and 3D   | Motion · GSAP · React Three Fiber · Three.js              |
| i18n and themes | next-intl · next-themes · custom theme variables          |
| Quality         | Vitest · Playwright · ESLint · Prettier · bundle analyzer |

## Getting started

### Prerequisites

- Node.js 24+
- Bun 1.3.14 (the package manager declared by this repository)
- A reachable backend API; local development defaults to `http://127.0.0.1:8080`

### Install and run

```bash
bun install --frozen-lockfile
bun run dev
```

Open <http://localhost:3000>. The development command scopes the HeroUI Pro themes before starting Next.js.

### Environment variables

Create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_API_BASE_URL=
API_URL=http://127.0.0.1:8080
OPENAPI_URL=http://localhost:8080/v3/api-docs
ENABLE_AUTH_TEST_ROUTE=1
ENABLE_RICH_TEXT_TEST_ROUTE=1
```

Do not commit secrets. Production normally uses the same-origin API; configure `NEXT_PUBLIC_API_BASE_URL` and `API_URL` when deploying services separately.

## Commands

| Command                   | Description                                 |
| ------------------------- | ------------------------------------------- |
| `bun run dev`             | Start the development server                |
| `bun run build`           | Create a production build                   |
| `bun run analyze`         | Production build with bundle analyzer       |
| `bun run assets:optimize` | Recompress large images under `public/`     |
| `bun run start`           | Start the production server                 |
| `bun run lint`            | Run ESLint                                  |
| `bun run typecheck`       | Run TypeScript checks                       |
| `bun run test:unit`       | Run Vitest unit tests                       |
| `bun run test:e2e`        | Run Playwright end-to-end tests             |
| `bun run preflight`       | Run formatting, lint, type, and unit checks |
| `bun run api:contract`    | Check the OpenAPI contract                  |
| `bun run api:coverage`    | Check OpenAPI coverage                      |
| `bun run api:generate`    | Generate the OpenAPI client                 |

Before opening a pull request:

```bash
bun run preflight
bun run test:e2e
```

## Project structure

```text
app/                 App Router routes, layouts, pages, and Route Handlers
components/          Reusable UI, product, and editor components
config/              Stable site and font configuration
features/            Cross-page product compositions
lib/api/             API infrastructure and error boundaries
lib/features/        Domain APIs, RTK Query, slices, types, and contracts
public/              Images, fonts, icons, and 3D models
scripts/             Theme, OpenAPI, and link-checking scripts
styles/              Global styles and theme variables
tests/               Playwright end-to-end tests
docs/                Product, design, architecture, development, and ADR docs
```

## Architecture

- `app/` owns route composition; complex business logic belongs in `components/` or `lib/features/`.
- Domain data and state live in feature modules; components access the backend through RTK Query hooks or explicit API boundaries.
- Business requests go through the API layer instead of being scattered across pages.
- Responses are validated or transformed at the boundary; caching, errors, and auth are handled centrally.
- Prefer composing HeroUI. Document why a custom primitive is needed before adding one.
- Interactive work must support keyboard use and respect `prefers-reduced-motion`.

Production uses Next.js standalone output and rewrites `/api/v1/*`, `/oauth2/*`, and `/login/oauth2/*` to the backend service.

## Deployment

The multi-stage [Dockerfile](./Dockerfile) produces a standalone image that runs as an unprivileged user:

```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=heroui_auth_token,src="$HOME/.heroui-auth-token" \
  -t odyssey .

docker run --rm -p 3000:3000 \
  -e API_URL=http://host.docker.internal:8080 \
  odyssey
```

`HEROUI_AUTH_TOKEN` is required for installing HeroUI Pro dependencies. Inject it through CI/CD or a Docker BuildKit secret.

## Documentation

- [Documentation index](./docs/README.md)
- [Project overview](./docs/01-introduction/overview.md)
- [Product map](./docs/01-introduction/product-map.md)
- [Architecture overview](./docs/05-architecture/architecture-overview.md)
- [API architecture](./docs/05-architecture/api-architecture.md)
- [Development conventions](./docs/06-development/conventions.md)
- [Design system](./docs/04-design/design-system.md)
- [Module documentation](./docs/07-modules/)
- [Architecture decisions](./docs/09-decisions/)

## Contributing

This is a private project. Read the [project rules](./docs/00-project-rules.md) and [development conventions](./docs/06-development/conventions.md) before making changes. Keep tests, API contracts, and documentation in sync.

## License

This repository does not currently declare an open-source license. Licensing information for fonts, images, icons, and other third-party assets is maintained with the relevant resource or its source documentation.
