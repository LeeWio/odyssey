"use client";

import { pageEaseOut } from "@/lib/motion";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Card, Chip, Typography, type Selection } from "@heroui/react";
import { FileTree } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { PageFrame } from "@/components/layout/page-frame";

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
  "app-single": {
    id: "app-single",
    name: "app/(main)/single/blog-index.tsx",
    purpose: "东鳞西爪的列表。第一篇横跨屏幕，其余是竖卡。",
    stack: ["HeroUI", "文章卡片"],
    exports: ["BlogIndex"],
    fact: "博客在 /single，不在 /chronicle。",
  },
  "uses-page": {
    id: "uses-page",
    name: "features/uses/uses-page.tsx",
    purpose: "桌上这些。还在用的硬件和软件，按分类铺开。",
    stack: ["HeroUI Card"],
    exports: ["UsesPage"],
    fact: "清单来自 uses-data，这一页没有新编设备。",
  },
  "gallery-page": {
    id: "gallery-page",
    name: "features/gallery/gallery-page.tsx",
    purpose: "路上的光。当前这张照片占左边，地点和胶片在右边。",
    stack: ["HeroUI Card", "next/image"],
    exports: ["GalleryPage"],
    fact: "照片是仓库里现有的几张。",
  },
  "footprints-page": {
    id: "footprints-page",
    name: "features/footprints/footprints-page.tsx",
    purpose: "落过脚的地方。地图铺满，选中的地方叠在右上角。",
    stack: ["地图", "HeroUI"],
    exports: ["FootprintsPage"],
    fact: "地点从湖北老家出去：陕西、广州、深圳、重庆、安徽、河南。",
  },
  "const-universe": {
    id: "const-universe",
    name: "components/constellation/universe.tsx",
    purpose:
      "The main R3F assembly housing rotating galaxies, connections, dust columns, and camera directors.",
    stack: ["React Three Fiber", "drei"],
    exports: ["UniverseView", "CameraController", "UniverseContent"],
    fact: "Calculates global relative planetary positions and parents satellites in world space, preventing double-offsetting.",
  },
  "comp-navbar": {
    id: "comp-navbar",
    name: "components/navbar/navbar.tsx",
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
    <PageFrame className="bg-background">
      <div className="flex w-full flex-col gap-10">
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: pageEaseOut }}
          className="max-w-xl"
        >
          <Chip color="accent" size="sm" variant="soft">
            样例，不是仓库镜像
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
          >
            这几页在哪
          </Typography>
          <Typography color="muted" type="body" className="mt-4 leading-7">
            点一个文件，看它负责哪一块。树是挑出来的，不是整份代码。
          </Typography>
        </motion.header>

        {/* Split Explorer Pane */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          {/* Left Panel: The File Tree */}
          <Card variant="secondary" className="h-[70vh] min-h-[28rem] overflow-y-auto p-5">
            <FileTree
              aria-label="Repository File Tree"
              size="sm"
              showGuideLines="hover"
              selectedKeys={selectedKeys}
              selectionMode="single"
              onSelectionChange={setSelectedKeys}
              defaultExpandedKeys={["app", "app-main", "features", "components", "single", "docs"]}
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
                  <FileTree.Item icon={folderIcon} id="single" textValue="single" title="single">
                    <FileTree.Item
                      icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                      id="app-single"
                      textValue="blog-index.tsx"
                      title="blog-index.tsx"
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
                <FileTree.Item icon={folderIcon} id="gallery" textValue="gallery" title="gallery">
                  <FileTree.Item
                    icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                    id="gallery-page"
                    textValue="gallery-page.tsx"
                    title="gallery-page.tsx"
                  />
                </FileTree.Item>
                <FileTree.Item
                  icon={folderIcon}
                  id="footprints"
                  textValue="footprints"
                  title="footprints"
                >
                  <FileTree.Item
                    icon={<Icon icon="gravity-ui:code" className="text-default-500 size-4" />}
                    id="footprints-page"
                    textValue="footprints-page.tsx"
                    title="footprints-page.tsx"
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
          <Card variant="secondary" className="min-h-[70vh] p-6 md:p-8">
            <div className="flex h-full flex-col justify-between">
              {activeFile ? (
                <div className="flex flex-col gap-6">
                  {/* Title & Badge */}
                  <div>
                    <div className="text-muted/60 mb-2 flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider uppercase">
                      <Icon icon="gravity-ui:file-code" className="text-accent size-3.5" />
                      这个文件
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
                      负责什么
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
                      用到什么
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
                      导出
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
    </PageFrame>
  );
}
