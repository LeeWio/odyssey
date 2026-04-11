# Odyssey

## Project Overview

This project is a Next.js web application built using the modern App Router architecture. It utilizes the latest features from React 19 and Next.js 16. The application incorporates a sophisticated rich-text editing experience powered by PlateJS and a sleek, interactive user interface built with HeroUI and Tailwind CSS.

**Key Technologies:**

- **Framework:** Next.js (v16.2) / React (v19.2)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **Component Library:** HeroUI (`@heroui/react`, `@heroui/styles`)
- **Rich Text Editor:** PlateJS (`platejs`, `@platejs/*`)
- **Animations:** Motion
- **Package Manager:** Bun (indicated by `bun.lock`)

## Directory Structure

- `app/`: Contains the Next.js App Router definitions (`page.tsx`, `layout.tsx`, etc.).
- `app/store/`: Contains Next.js App Router specific providers (e.g. Redux `StoreProvider`).
- `components/`: Houses reusable, shared UI components (e.g., `icons.tsx`).
- `features/rich-text/`: A domain-specific feature folder containing all logic, components, plugins, toolbars, and custom nodes necessary for the PlateJS rich-text editor integration.
- `hooks/`: Custom React hooks, notably `use-rich-text.ts` which encapsulates the editor's initialization and configuration.
- `store/`: Contains the Redux Toolkit root store configuration, typed hooks, and state slices (e.g., `auth/authSlice.ts`).
- `styles/`: Global CSS stylesheets (`globals.css`).
- `types/`: Global TypeScript definitions.
- `.heroui-docs/`: A local directory containing documentation, examples, and meta-information for the HeroUI components used in the project.

## Building and Running

The project uses Bun as the primary package manager. Run the following commands to interact with the project:

- **Development Server:** `bun run dev` (starts `next dev` on localhost:3000)
- **Production Build:** `bun run build` (compiles the Next.js application for production)
- **Start Production:** `bun run start` (serves the built application)
- **Linting:** `bun run lint` (runs ESLint)
- **Formatting:** `bun run format` (runs Prettier auto-formatting)
- **Check Formatting:** `bun run format:check` (verifies Prettier compliance)

## Development Conventions

- **UI Framework Integration:** The project heavily relies on HeroUI for modals, buttons, and other foundational UI pieces (e.g., `Modal`, `Button`, `ScrollShadow`). Ensure adherence to HeroUI's paradigms when building new interfaces.
- **Rich Text Architecture:** The PlateJS editor is abstracted behind the `useRichText` hook (in `hooks/use-rich-text.ts`). It loads its plugin ecosystem from `features/rich-text/plugins`. Any new editor capabilities (nodes, marks, toolbars) should be contained within the `features/rich-text/` folder structure.
- **Absolute Imports:** The project uses path aliases. Use `@/*` to import from the root of the project (e.g., `import { useRichText } from "@/hooks/use-rich-text";`).
- **Strict Mode:** TypeScript is configured strictly (`"strict": true` in `tsconfig.json`). Ensure type safety is maintained across new additions.
- **Formatting & Linting:** Code style is enforced through Prettier and ESLint. Use the provided scripts to maintain consistency.
ng:** Code style is enforced through Prettier and ESLint. Use the provided scripts to maintain consistency.
