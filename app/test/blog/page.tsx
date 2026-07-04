"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, SearchField, Chip, Spinner, Avatar, Typography } from "@heroui/react";
import { DataGrid, type DataGridColumn, type DataGridSortDescriptor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

import { useGetPublicPostsQuery, type PostResponse } from "@/lib/features/post/post-api";

// High-fidelity fallback blog list for offline / empty database testing
const MOCK_POSTS: PostResponse[] = [
  {
    id: 1,
    title: "HeroUI Pro & The Shattered Epic of Minimalist Interfaces",
    slug: "1",
    summary:
      "Exploring how achromatic dark tones, gold accents, and fluid layouts of the HeroUI design system evoke narrative depth and visual tension.",
    coverImage: "/er-hero.png",
    status: "PUBLISHED",
    isFeatured: true,
    views: 1245,
    likesCount: 342,
    favoritesCount: 120,
    isLiked: false,
    isFavorited: false,
    authorName: "Odysseus",
    category: {
      id: 1,
      name: "Aesthetics",
      slug: "aesthetics",
      description: "",
      icon: null,
      createdAt: "2026-07-04T12:00:00.000Z",
    },
    series: null,
    seriesOrder: null,
    tags: [
      { id: 1, name: "Design", slug: "design", createdAt: "2026-07-04T12:00:00.000Z" },
      { id: 2, name: "HeroUI", slug: "heroui", createdAt: "2026-07-04T12:00:00.000Z" },
    ],
    createdAt: "2026-07-04T12:00:00.000Z",
    updatedAt: "2026-07-04T12:00:00.000Z",
    content: `
      <h2>The Philosophy of Achromatic Spaces</h2>
      <p>In modern web development, interfaces are no longer merely flat functional layers; they are portals of narrative depth and branding coherence. To design in achromatic dark—using absolute blacks (#000000), deep zinc greys, and tactile slate outlines—is to invoke an architectural canvas. In this space, typography does not struggle for attention; it rests confidently inside structured containers.</p>
      <p>By relying heavily on deep neutral values, the layout sets a premium, cinematic tone. It feels less like a templated dashboard and more like a curated control cockpit. In this realm, space is the primary luxury. Generous padding, structured margins, and soft edge definitions establish a rhythm that encourages prolonged reading and interaction.</p>

      <h3>The Power of Gold Accents</h3>
      <p>When working within an achromatic spectrum, color becomes an intentional event. Rather than painting components with broad primary strokes, we select single high-contrast highlight colors. Gold and deep amber are particularly elite accents. They reflect fire, luxury, and warning—introducing a brilliant tension against the surrounding absolute dark.</p>
      <p>In the Odyssey ledger, this translates to the soft-lit amber outline of a premium card, or the golden pulse of an active transaction. The accent never overwhelms the layout; it anchors the eye and establishes the primary interactive call-to-action.</p>

      <h2>The Fluidity of Liquid Islands</h2>
      <p>A static interface is a dead interface. Users judge modern web applications by how they respond to movement. Every hover, click, and panel slide must feel "alive." This is where the concept of Liquid Islands emerges—modular, floating layout sections that expand, collapse, and reflow organically based on interaction.</p>
      <p>Whether it is a floating navigation bar that docks seamlessly at the top, or a sidebar that scrolls in perfect optical sync with the reading viewport, layout components must act as physical sheets. They slide under or over neighboring layers with distinct shadows and depth variables, avoiding hard transitions and layout shifts.</p>

      <h3>Micro-interactions & Tactile Feedback</h3>
      <p>A true premium feel lives in the invisible details. When a user hovers over a category card, a 1px border highlights instantly, and the content scales downward by 1% with an active spring scale. This micro-interaction simulates the mechanical resistance of a physical button, turning a screen interaction into a satisfying, tactile click.</p>
      <blockquote>"Simplicity is not the lack of clutter, but the presence of absolute clarity." — Jony Ive</blockquote>
      <p>These principles are baked directly into the HeroUI Pro design language. By wrapping interactive elements inside soft-lit feedback loops, we encourage active discovery while satisfying the user's need for instant sensory validation.</p>

      <h2>The Inclusive Design Mandate</h2>
      <p>Aesthetic polish is meaningless if the interface is unusable. True design mastery requires incorporating accessibility at the molecular level, rather than retrofitting it as an afterthought. This is why our designs cater specifically to diverse ability profiles, such as Jordan (low-vision), Priya (non-native speaker), and Marcus (motor-impaired).</p>

      <h3>Designing for Every Persona</h3>
      <p>For keyboard-only users like Marcus, all interactive components must feature strict focus outlines with logical tab routing. For low-vision readers like Jordan, text-to-background contrast ratios must conform exactly to WCAG AAA standards, and layout containers must adapt cleanly to 200% zoom without truncation.</p>
      <p>By adhering to semantic HTML tags, explicit ARIA role mapping, and responsive horizontal ScrollShadows, we ensure that Odyssey remains an open, inspiring, and fully inclusive space for everyone.</p>
    `,
  },
  {
    id: 2,
    title: "The 12 Principles of Web Animation in React & Next.js",
    slug: "the-12-principles-of-animation",
    summary:
      "How to translate traditional Disney animation guidelines to React micro-interactions using Framer Motion and GSAP.",
    coverImage: "/zelda-hero.png",
    status: "PUBLISHED",
    isFeatured: false,
    views: 890,
    likesCount: 215,
    favoritesCount: 85,
    isLiked: false,
    isFavorited: false,
    authorName: "Aether",
    category: {
      id: 2,
      name: "Motion",
      slug: "motion",
      description: "",
      icon: null,
      createdAt: "2026-06-25T14:30:00.000Z",
    },
    series: null,
    seriesOrder: null,
    tags: [
      { id: 3, name: "GSAP", slug: "gsap", createdAt: "2026-06-25T14:30:00.000Z" },
      { id: 4, name: "Animation", slug: "animation", createdAt: "2026-06-25T14:30:00.000Z" },
    ],
    createdAt: "2026-06-25T14:30:00.000Z",
    updatedAt: "2026-06-25T14:30:00.000Z",
    content: `
      <h2>The Physics of Spring Curves</h2>
      <p>Traditional web animation often relies on rigid cubic-bezier curves. While linear interpolations serve some simple loading bars, they feel robotic and mechanical. Physical objects in the real world have mass, inertia, and friction—elements that are best simulated using spring physics.</p>
      <p>By defining spring constants (stiffness and damping), we allow interactive cards and dialog modals to bounce, overshoot, and settle organically. This establishes an immediate sense of tactile reality and delight.</p>

      <h3>GSAP Timelines & Orchestration</h3>
      <p>For complex interactive layouts, orchestrating multiple concurrent animations is notoriously difficult. GSAP (GreenSock Animation Platform) timelines solve this by allowing designers to chain tweens sequentially or overlap them with precise timing offsets.</p>
      <p>This allows choreographing staggered list enters, loading reveals, and modular dashboard reflows with absolute timing certainty, leading to a buttery-smooth 60fps experience.</p>
    `,
  },
  {
    id: 3,
    title: "Inclusive Personas & Accessibility Design Workflow",
    slug: "inclusive-personas-accessibility",
    summary:
      "Designing interfaces with strict compliance to WCAG AAA contrast scales, logical focus ring navigation, and screen reader announcements.",
    coverImage: "/lol-hero.png",
    status: "PUBLISHED",
    isFeatured: false,
    views: 620,
    likesCount: 145,
    favoritesCount: 50,
    isLiked: false,
    isFavorited: false,
    authorName: "Sentry",
    category: {
      id: 3,
      name: "Accessibility",
      slug: "accessibility",
      description: "",
      icon: null,
      createdAt: "2026-06-15T09:15:00.000Z",
    },
    series: null,
    seriesOrder: null,
    tags: [
      { id: 5, name: "WCAG", slug: "wcag", createdAt: "2026-06-15T09:15:00.000Z" },
      {
        id: 6,
        name: "Accessibility",
        slug: "accessibility",
        createdAt: "2026-06-15T09:15:00.000Z",
      },
    ],
    createdAt: "2026-06-15T09:15:00.000Z",
    updatedAt: "2026-06-15T09:15:00.000Z",
    content: `
      <h2>The WCAG Compliance Matrix</h2>
      <p>Aesthetic design is meaningless if the interface is unusable. True design mastery requires incorporating accessibility at the molecular level. This is why our designs conform strictly to WCAG 2.2 AA and AAA compliance scales, particularly focusing on text-to-background contrast ratios.</p>
      <p>By establishing high-contrast, scalable layouts, we ensure that low-vision readers can comfortably read essays, study charts, and interact with controls at any screen dimension.</p>
    `,
  },
];

export default function BlogTestPage() {
  const router = useRouter();

  // Search, Filter and Sorting States
  const [search, setSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<DataGridSortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Fetch live published posts from backend API via RTK Query
  const { data: postsData, isLoading } = useGetPublicPostsQuery({
    page: 0,
    size: 50,
  });

  const postsList = postsData?.list || [];
  const isMock = postsList.length === 0 && !isLoading;
  const posts = isMock ? MOCK_POSTS : postsList;

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // 1. Locally filter posts based on query input
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          (post.summary && post.summary.toLowerCase().includes(q)) ||
          (post.authorName && post.authorName.toLowerCase().includes(q)) ||
          (post.category && post.category.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [posts, search]);

  // 2. Locally sort posts based on active DataGrid sort descriptor
  const sortedPosts = useMemo(() => {
    if (!sortDescriptor.column) return filteredPosts;
    const col = sortDescriptor.column as keyof PostResponse;

    return [...filteredPosts].sort((a, b) => {
      const first = a[col];
      const second = b[col];

      let cmp = 0;
      if (typeof first === "number" && typeof second === "number") {
        cmp = first - second;
      } else {
        cmp = String(first ?? "").localeCompare(String(second ?? ""));
      }

      const direction = sortDescriptor.direction === "descending" ? -1 : 1;
      return cmp * direction;
    });
  }, [filteredPosts, sortDescriptor]);

  const columns = useMemo<DataGridColumn<PostResponse>[]>(
    () => [
      {
        accessorKey: "id",
        allowsSorting: true,
        cell: (item) => <span className="font-medium tabular-nums">{item.id}</span>,
        header: "ID",
        id: "id",
        isRowHeader: true,
        minWidth: 80,
      },
      {
        accessorKey: "title",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex max-w-[320px] flex-col py-1">
            <span className="truncate text-sm leading-snug font-semibold">{item.title}</span>
            <span className="text-muted mt-0.5 truncate text-xs">{item.summary}</span>
          </div>
        ),
        header: "Article Details",
        id: "title",
        minWidth: 320,
      },
      {
        accessorKey: "category",
        allowsSorting: false,
        cell: (item) =>
          item.category ? (
            <Chip size="sm" variant="soft" color="accent" className="font-semibold">
              {item.category.name}
            </Chip>
          ) : (
            <span className="text-muted text-xs">-</span>
          ),
        header: "Category",
        id: "category",
        minWidth: 120,
      },
      {
        accessorKey: "authorName",
        allowsSorting: true,
        cell: (item) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm" className="size-6">
              <Avatar.Fallback className="text-[9px] font-bold">
                {item.authorName ? item.authorName.slice(0, 2).toUpperCase() : "AN"}
              </Avatar.Fallback>
            </Avatar>
            <span className="text-sm font-medium">{item.authorName}</span>
          </div>
        ),
        header: "Author",
        id: "authorName",
        minWidth: 140,
      },
      {
        accessorKey: "views",
        allowsSorting: true,
        cell: (item) => (
          <span className="text-muted font-mono text-sm tabular-nums">{item.views}</span>
        ),
        header: "Views",
        id: "views",
        minWidth: 100,
      },
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="tertiary"
              className="gap-1 font-semibold text-amber-500"
              onPress={() => router.push(`/blog/${item.slug}`)}
            >
              <Icon icon="lucide:book-open" className="size-3.5" />
              Read Article
            </Button>
          </div>
        ),
        header: "Action",
        id: "actions",
        minWidth: 140,
      },
    ],
    [router]
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-2xl font-bold tracking-tight">Blog Playground</h1>
            {!isLoading && (
              <Chip size="sm" variant="soft">
                {posts.length} Articles
              </Chip>
            )}
          </div>
          <p className="text-muted mt-1 text-sm">
            Verify list rendering of posts published to the backend and test smooth transitions into
            the Reader View.
          </p>
        </div>

        {isMock && (
          <Chip color="warning" size="sm" variant="soft" className="h-8 px-3 font-bold select-none">
            <Icon icon="lucide:wifi-off" className="mr-1.5 inline-block size-4 animate-pulse" />
            Offline Mode Fallback active
          </Chip>
        )}
      </div>

      {/* Toolbar Search bar */}
      <div className="flex items-center justify-between gap-4">
        <Typography type="body-sm" color="muted" className="hidden sm:block">
          Select any article below to open its dedicated immersive reading canvas.
        </Typography>
        <SearchField
          className="w-full sm:w-[280px]"
          name="blog-search"
          onChange={handleSearchChange}
          value={search}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search articles..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Spinner size="md" />
          <span className="text-muted text-xs">Retrieving published entries...</span>
        </div>
      ) : (
        <div className="bg-surface border-border overflow-hidden rounded-2xl border">
          <DataGrid
            aria-label="Blog posts list"
            columns={columns}
            contentClassName="min-w-[800px]"
            data={sortedPosts}
            getRowId={(item) => item.id}
            isLoadingMore={isLoading}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          />
        </div>
      )}
    </div>
  );
}
