"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, Chip, Typography, type Selection } from "@heroui/react";
import { FileTree } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

const easeOut = [0.22, 1, 0.36, 1] as const;

// Types for workspace representation
type FileMetadata = {
  id: string;
  name: string;
  purpose: string;
  stack: string[];
  exports: string[];
  fact: string;
};

// Seed metadata database for the preview panel
const WORKSPACE_METADATA: Record<string, FileMetadata> = {
  "app-layout": {
    id: "app-layout",
    name: "app/layout.tsx",
    purpose:
      "The root Next.js 16 layout providing providers, global meta headers, and body direction tags.",
    stack: ["Next.js 16", "Providers", "React Aria"],
    exports: ["RootLayout", "metadata"],
    fact: "Serves as the high-performance entryway, injecting theme-init scripts before hydration to prevent layout flashes.",
  },
  "app-const": {
    id: "app-const",
    name: "app/(main)/constellations/page.tsx",
    purpose:
      "Client router page dynamically importing and rendering the R3F 3D spatial orbit view with ssr: false.",
    stack: ["Dynamic Import", "SSR Optimization", "Next.js Route"],
    exports: ["ConstellationsPage"],
    fact: "Renders a pulse indicator loading fallback while the massive Saturn, Earth, and Sun GLB models stream into the canvas.",
  },
  "uses-page": {
    id: "uses-page",
    name: "features/uses/uses-page.tsx",
    purpose: "Exposes physical hardware rigs, modular synthesizers, and desktop layouts.",
    stack: ["HeroUI Card", "motion/react", "Responsive Grid"],
    exports: ["UsesPage"],
    fact: "Features custom layout boundaries that render on-scroll fades, giving an editorial look to technical desk staples.",
  },
  "copilot-page": {
    id: "copilot-page",
    name: "features/copilot/copilot-page.tsx",
    purpose:
      "An interactive AI chat space built with specialized Pro AI components to answer questions about Odyssey.",
    stack: ["ChatConversation", "PromptInput", "TextShimmer", "Markdown"],
    exports: ["CopilotPage"],
    fact: "Simulates stream rendering on responses, showcasing specialized fluid gradients while formulating markdown text blocks.",
  },
  "roadmap-page": {
    id: "roadmap-page",
    name: "features/roadmap/roadmap-page.tsx",
    purpose:
      "Chronologically displays released versions, active rollouts, and future AR spatial galleries.",
    stack: ["HeroUI Pro Timeline", "TrendChip", "Lucide Icons"],
    exports: ["RoadmapPage"],
    fact: "Leverages the trend-chip to visual performance changes MoM, integrating color indicator statuses.",
  },
  "const-universe": {
    id: "const-universe",
    name: "components/constellation/universe.tsx",
    purpose:
      "The main R3F assembly housing rotating galaxies, connections, dust columns, and camera directors.",
    stack: ["React Three Fiber", "drei", "postprocessing", "gsap"],
    exports: ["UniverseView", "CameraController", "UniverseContent"],
    fact: "Calculates global relative planetary positions and parents satellites in world space, preventing double-offsetting.",
  },
  "comp-navbar": {
    id: "comp-navbar",
    name: "components/navbar.tsx",
    purpose:
      "Advanced mega-menu header navigation with keyboard traps, blur reveals, and responsive mobile drawers.",
    stack: ["TailwindCSS", "Framer Motion", "React Aria Components"],
    exports: ["Navbar"],
    fact: "Controls complex state triggers to unroll multi-column directories on hover while maintaining strict keyboard focus loops.",
  },
  "rules-doc": {
    id: "rules-doc",
    name: "docs/00-project-rules.md",
    purpose:
      "Mandatory workspace specifications governing HeroUI Baselines, motion standards, and git guidelines.",
    stack: ["Markdown", "Workspace Guidelines"],
    exports: ["Project Guidelines"],
    fact: "Specifies strict boundaries: prioritize composition, do not stage without user approval, and never suppress linter warnings.",
  },
  "pkg-json": {
    id: "pkg-json",
    name: "package.json",
    purpose:
      "Root configuration detailing compile dependencies, engines, scripts, and Turbopack options.",
    stack: ["Bun Package Manager", "Next.js", "HeroUI Pro"],
    exports: ["Dependencies config"],
    fact: "Includes scoped theme-sync prebuild hooks to parse scoped theme classes before bundler execution.",
  },
};

const folderIcon = ({ isExpanded }: { isExpanded: boolean }) =>
  isExpanded ? (
    <Icon icon="gravity-ui:folder-open" className="text-accent size-4" />
  ) : (
    <Icon icon="gravity-ui:folder" className="text-accent/80 size-4" />
  );

export function ExplorerPage() {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(["app-layout"]));

  // Resolve the selected file details from set selection
  const activeFile = useMemo(() => {
    if (selectedKeys === "all") return null;
    const key = [...selectedKeys][0]?.toString();
    return key ? WORKSPACE_METADATA[key] || null : null;
  }, [selectedKeys]);

  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="border-default-200/50 mb-12 flex flex-col items-center border-b pb-8 text-center"
        >
          <Chip color="accent" size="sm" variant="soft" className="gap-1.5 pl-2">
            <Icon icon="gravity-ui:grip-horizontal" className="text-accent size-3" />
            Repository Explorer
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Odyssey Codebase Map
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            Interactively browse the directory tree of Odyssey. Select any file node to inspect its
            architectural purpose and technical composition.
          </Typography>
        </motion.header>

        {/* Split Explorer Pane */}
        <div className="mt-10 grid items-start gap-6 md:grid-cols-12">
          {/* Left Panel: The File Tree */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/20 h-[460px] overflow-y-auto rounded-2xl border p-5 shadow-sm md:col-span-5"
          >
            <div className="mb-4">
              <span className="text-muted/60 font-mono text-xs font-bold tracking-wider uppercase">
                WORKSPACE
              </span>
            </div>

            <FileTree
              aria-label="Repository File Tree"
              size="sm"
              showGuideLines="hover"
              selectedKeys={selectedKeys}
              selectionMode="single"
              onSelectionChange={setSelectedKeys}
              defaultExpandedKeys={["app", "app-main", "features", "components", "const", "docs"]}
              className="text-foreground"
            >
              <FileTree.Item icon={folderIcon} id="app" textValue="app" title="app">
                <FileTree.Item
                  icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                  id="app-layout"
                  textValue="layout.tsx"
                  title="layout.tsx"
                />
                <FileTree.Item icon={folderIcon} id="app-main" textValue="(main)" title="(main)">
                  <FileTree.Item
                    icon={folderIcon}
                    id="const"
                    textValue="constellations"
                    title="constellations"
                  >
                    <FileTree.Item
                      icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                      id="app-const"
                      textValue="page.tsx"
                      title="page.tsx"
                    />
                  </FileTree.Item>
                </FileTree.Item>
              </FileTree.Item>

              <FileTree.Item icon={folderIcon} id="features" textValue="features" title="features">
                <FileTree.Item icon={folderIcon} id="uses" textValue="uses" title="uses">
                  <FileTree.Item
                    icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                    id="uses-page"
                    textValue="uses-page.tsx"
                    title="uses-page.tsx"
                  />
                </FileTree.Item>
                <FileTree.Item icon={folderIcon} id="copilot" textValue="copilot" title="copilot">
                  <FileTree.Item
                    icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                    id="copilot-page"
                    textValue="copilot-page.tsx"
                    title="copilot-page.tsx"
                  />
                </FileTree.Item>
                <FileTree.Item icon={folderIcon} id="roadmap" textValue="roadmap" title="roadmap">
                  <FileTree.Item
                    icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                    id="roadmap-page"
                    textValue="roadmap-page.tsx"
                    title="roadmap-page.tsx"
                  />
                </FileTree.Item>
              </FileTree.Item>

              <FileTree.Item
                icon={folderIcon}
                id="components"
                textValue="components"
                title="components"
              >
                <FileTree.Item
                  icon={folderIcon}
                  id="const-comp"
                  textValue="constellation"
                  title="constellation"
                >
                  <FileTree.Item
                    icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                    id="const-universe"
                    textValue="universe.tsx"
                    title="universe.tsx"
                  />
                </FileTree.Item>
                <FileTree.Item
                  icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                  id="comp-navbar"
                  textValue="navbar.tsx"
                  title="navbar.tsx"
                />
              </FileTree.Item>

              <FileTree.Item icon={folderIcon} id="docs" textValue="docs" title="docs">
                <FileTree.Item
                  icon={<Icon icon="gravity-ui:file-text" className="text-default-500 size-4" />}
                  id="doc-rules"
                  textValue="00-project-rules.md"
                  title="00-project-rules.md"
                />
              </FileTree.Item>

              <FileTree.Item
                icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                id="pkg-json"
                textValue="package.json"
                title="package.json"
              />
            </FileTree>
          </Card>

          {/* Right Panel: File Metadata Preview Inspector */}
          <Card
            variant="secondary"
            className="border-default-200/50 bg-surface-secondary/10 min-h-[460px] rounded-2xl border p-6 shadow-sm md:col-span-7"
          >
            <div className="flex h-full flex-col justify-between">
              {activeFile ? (
                <div className="flex flex-col gap-6">
                  {/* Title & Badge */}
                  <div>
                    <div className="text-muted/60 mb-2 flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase">
                      <Icon icon="gravity-ui:file-code" className="text-accent size-3.5" />
                      FILE PREVIEW
                    </div>
                    <Typography type="h3" weight="bold" className="text-foreground tracking-tight">
                      {activeFile.name}
                    </Typography>
                  </div>

                  {/* Description Box */}
                  <div>
                    <Typography
                      color="muted"
                      type="body-sm"
                      className="text-muted/60 mb-1.5 text-[10px] font-semibold tracking-wider uppercase"
                    >
                      Core Purpose
                    </Typography>
                    <Typography
                      color="muted"
                      type="body"
                      className="text-foreground/80 text-sm leading-relaxed"
                    >
                      {activeFile.purpose}
                    </Typography>
                  </div>

                  {/* Technical Stack Pills */}
                  <div>
                    <Typography
                      color="muted"
                      type="body-sm"
                      className="text-muted/60 mb-2 text-[10px] font-semibold tracking-wider uppercase"
                    >
                      Technical Stack
                    </Typography>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFile.stack.map((s) => (
                        <span
                          key={s}
                          className="bg-default-100 text-foreground rounded-md px-2 py-0.5 text-[10px] font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Main Symbols Exports */}
                  <div>
                    <Typography
                      color="muted"
                      type="body-sm"
                      className="text-muted/60 mb-2 text-[10px] font-semibold tracking-wider uppercase"
                    >
                      Exports & Constants
                    </Typography>
                    <div className="border-default-100/50 flex flex-wrap items-center gap-2 rounded-xl border bg-black/40 p-3 font-mono text-xs text-cyan-400">
                      <Icon icon="gravity-ui:cpu" className="size-3 shrink-0 text-cyan-500" />
                      {activeFile.exports.map((exp, idx) => (
                        <span key={exp}>
                          {exp}
                          {idx < activeFile.exports.length - 1 && (
                            <span className="text-muted/40 ml-2">|</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cool Workspace fact */}
                  <div className="border-default-100 bg-accent/5 -mx-6 mt-2 -mb-6 rounded-b-2xl border-t border-dashed px-6 pt-5 pb-6">
                    <Typography
                      color="muted"
                      type="body-sm"
                      className="text-accent mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase"
                    >
                      <Icon icon="gravity-ui:compass" className="size-3.5" />
                      Did you know?
                    </Typography>
                    <Typography color="muted" type="body-sm" className="leading-relaxed italic">
                      {activeFile.fact}
                    </Typography>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <Icon
                    icon="gravity-ui:database"
                    className="text-default-300 mb-4 size-10 animate-pulse"
                  />
                  <Typography type="h4" weight="bold">
                    No Node Selected
                  </Typography>
                  <Typography color="muted" type="body-sm" className="mt-2 max-w-xs">
                    Choose any directory folder or file on the left file explorer tree to analyze
                    its structural details.
                  </Typography>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
