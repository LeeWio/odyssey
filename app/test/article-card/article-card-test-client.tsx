"use client";

import { Avatar, Button, Card, Chip, Dropdown, Label, Popover } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { ColumnArticleStack } from "@/features/column/column-article-stack";
import type { ColumnPost } from "@/lib/features/column";
import { ArticleCover } from "@/components/card/article-cover";
import {
  ShaderBackground,
  type ShaderBackgroundVariant,
} from "@/components/background/shader-background";

const SHADER_VARIANTS: { id: ShaderBackgroundVariant; label: string }[] = [
  { id: "static-mesh-gradient", label: "Mesh" },
  { id: "static-radial-gradient", label: "Radial" },
  { id: "dot-grid", label: "Dot Grid" },
];

const STACK_DEMO: ColumnPost[] = [
  {
    id: 1,
    title: "Yarn Sourcing for Bangladeshi Mills",
    slug: "yarn-sourcing",
    coverImage: "",
    summary: "",
    authorName: "Nasimul Huda",
    views: 234,
    likesCount: 147,
    publishedAt: "2024-06-10",
  },
  {
    id: 2,
    title: "Looms, Light, and the Color of Cotton",
    slug: "looms-light",
    coverImage: "",
    summary: "",
    authorName: "Amina Rahman",
    views: 891,
    likesCount: 64,
    publishedAt: "2024-05-28",
  },
  {
    id: 3,
    title: "Natural Dye Notes from the River Belt",
    slug: "river-dye",
    coverImage: "",
    summary: "",
    authorName: "Farid Khan",
    views: 412,
    likesCount: 38,
    publishedAt: "2024-04-12",
  },
];

function ArticleShader({ variant }: { variant: ShaderBackgroundVariant }) {
  if (variant === "static-radial-gradient") {
    return (
      <ShaderBackground
        aria-hidden="true"
        className="absolute inset-0"
        colorBack="#152c2b"
        colors={["#247b73", "#b7d8c8", "#e4a978"]}
        distortion={0.18}
        distortionFreq={7}
        falloff={0.2}
        focalAngle={2.2}
        focalDistance={0.68}
        frame={0}
        mixing={0.62}
        radius={0.95}
        variant="static-radial-gradient"
      />
    );
  }

  if (variant === "dot-grid") {
    return (
      <ShaderBackground
        aria-hidden="true"
        className="absolute inset-0"
        colorBack="#18383a"
        colorFill="#c7d9b8"
        colorStroke="#d9a16f"
        gapX={34}
        gapY={34}
        opacityRange={0.12}
        shape="circle"
        size={8}
        variant="dot-grid"
      />
    );
  }

  return (
    <ShaderBackground
      aria-hidden="true"
      className="absolute inset-0"
      colors={["#1f5755", "#76a99c", "#d6a27c", "#203b46"]}
      grainOverlay={0.12}
      mixing={0.62}
      positions={3}
      rotation={214}
      speed={0}
      variant="static-mesh-gradient"
      waveX={0.75}
      waveXShift={0.3}
      waveY={0.82}
      waveYShift={0.6}
    />
  );
}

function ArticleAuthorPopover() {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <Popover>
      <Popover.Trigger aria-label="View Sarah Johnson's profile">
        <div className="flex min-h-11 items-center gap-2">
          <Avatar size="sm">
            <Avatar.Image
              alt="Sarah Johnson"
              src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
            />
            <Avatar.Fallback>SJ</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col text-start leading-tight">
            <span className="text-sm font-medium">Sarah Johnson</span>
            <time className="text-muted text-xs" dateTime="2026-09-18">
              Sep 18, 2026
            </time>
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content className="w-80 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog>
          <Popover.Heading>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="md">
                  <Avatar.Image
                    alt="Sarah Johnson"
                    src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
                  />
                  <Avatar.Fallback>SJ</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold">Sarah Johnson</p>
                  <p className="text-muted text-sm">@sarahj</p>
                </div>
              </div>
              <Button
                className="shrink-0 rounded-full"
                size="sm"
                variant={isFollowing ? "tertiary" : "primary"}
                onPress={() => setIsFollowing((following) => !following)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </Popover.Heading>
          <p className="text-muted mt-3 text-sm leading-5">
            Product designer and writer exploring thoughtful digital experiences.
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <p>
              <span className="font-semibold">892</span>
              <span className="text-muted ms-1">Following</span>
            </p>
            <p>
              <span className="font-semibold">12.5K</span>
              <span className="text-muted ms-1">Followers</span>
            </p>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function ArticleArrow() {
  return <Icon aria-hidden="true" className="size-4" icon="lucide:arrow-up-right" />;
}

function ScienceArticleCover() {
  return <ArticleCover seed="science-article" />;
}

function ScienceArticleAuthor() {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <Popover>
      <Popover.Trigger aria-label="View Samantha Smith's profile">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <Avatar.Image
              alt="Sarah Johnson"
              src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
            />
            <Avatar.Fallback>SJ</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium">Sarah Johnson</p>
            <time className="text-muted text-xs" dateTime="2024-03-11">
              March 11, 2024
            </time>
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content className="w-80 max-w-[calc(100vw-2rem)]">
        <Popover.Dialog>
          <Popover.Heading>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="md">
                  <Avatar.Image
                    alt="Sarah Johnson"
                    src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
                  />
                  <Avatar.Fallback>SJ</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-semibold">Sarah Johnson</p>
                  <p className="text-muted text-sm">March 11, 2024</p>
                </div>
              </div>
              <Button
                className="shrink-0 rounded-full"
                size="sm"
                variant={isFollowing ? "tertiary" : "primary"}
                onPress={() => setIsFollowing((following) => !following)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </Popover.Heading>
          <p className="text-muted mt-3 text-sm leading-5">
            Product designer and creative director. Building beautiful experiences that matter.
          </p>
          <div className="mt-3 flex gap-4 text-sm">
            <p>
              <span className="font-semibold">892</span>
              <span className="text-muted ms-1">Following</span>
            </p>
            <p>
              <span className="font-semibold">12.5K</span>
              <span className="text-muted ms-1">Followers</span>
            </p>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function ScienceArticleCard() {
  const [isShared, setIsShared] = useState(false);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText("/articles/exploring-the-mysteries-of-the-universe");
    } catch {
      // Clipboard access is unavailable in some preview environments.
    }
    setIsShared(true);
    window.setTimeout(() => setIsShared(false), 1800);
  }

  return (
    <Card
      aria-label="Exploring the Mysteries of the Universe article"
      className="w-full max-w-xl overflow-hidden shadow-sm md:flex-row md:items-stretch"
      role="article"
    >
      <div className="relative isolate min-h-56 w-full shrink-0 overflow-hidden rounded-2xl sm:min-h-64 md:min-h-0 md:w-48 lg:w-52">
        <ScienceArticleCover />
        <Chip className="absolute top-3 left-3" size="sm">
          #science
        </Chip>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <Card.Header className="gap-1">
          <Card.Title className="text-foreground max-w-xl pe-8 text-xl leading-tight font-bold text-pretty sm:text-2xl">
            Become an ACME Creator!
          </Card.Title>
          <Card.Description className="text-muted line-clamp-2 max-w-xl text-sm leading-5">
            Visit the Acme Creator Hub to sign up today and start earning credits from your fans and
            followers.
          </Card.Description>
        </Card.Header>

        <Card.Footer className="mt-auto flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ScienceArticleAuthor />

          <div className="flex shrink-0 items-center gap-2">
            <Button
              aria-label={isShared ? "Article link copied" : "Share article"}
              isIconOnly
              size="sm"
              onPress={handleShare}
            >
              <Icon
                aria-hidden="true"
                className="size-4"
                icon={isShared ? "lucide:check" : "lucide:send"}
              />
            </Button>
            <Dropdown>
              <Button aria-label="More article actions" isIconOnly size="sm" variant="outline">
                <Icon aria-hidden="true" className="size-4" icon="lucide:ellipsis" />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "copy-link") {
                      void handleShare();
                    }
                  }}
                >
                  <Dropdown.Item id="save-article" textValue="Save for later">
                    <Icon aria-hidden="true" className="text-muted size-4" icon="lucide:bookmark" />
                    <Label>Save for later</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="copy-link" textValue="Copy article link">
                    <Icon aria-hidden="true" className="text-muted size-4" icon="lucide:link" />
                    <Label>Copy article link</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </Card.Footer>
      </div>
    </Card>
  );
}

function CompactArticleCard({ variant }: { variant: ShaderBackgroundVariant }) {
  return (
    <Card className="w-full overflow-hidden p-3" role="article">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative isolate aspect-[1.35/1] w-full shrink-0 overflow-hidden rounded-xl sm:size-28">
          <ArticleShader variant={variant} />
          <Chip className="absolute top-2 left-2" size="sm" variant="soft">
            Design
          </Chip>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Card.Header className="gap-1 p-0">
            <Card.Title className="line-clamp-2 text-base leading-5 font-semibold">
              Interfaces That Leave Room for Thought
            </Card.Title>
            <Card.Description className="text-muted text-xs leading-5">
              Sarah Johnson · Sep 18, 2026
            </Card.Description>
          </Card.Header>
          <Card.Footer className="flex items-center justify-between gap-3 p-0">
            <span className="text-muted text-xs">8 min read · 2.4K views</span>
            <span className="text-accent bg-accent/10 flex size-8 items-center justify-center rounded-full">
              <ArticleArrow />
            </span>
          </Card.Footer>
        </div>
      </div>
    </Card>
  );
}

function EditorialArticleCard() {
  return (
    <Card className="w-full overflow-hidden p-3" role="article">
      <div className="relative isolate aspect-[1.8/1] w-full overflow-hidden rounded-xl">
        <ArticleShader variant="static-mesh-gradient" />
        <Chip className="absolute top-3 left-3" size="sm" variant="soft">
          Design & Technology
        </Chip>
      </div>
      <Card.Header className="gap-3 px-1 pt-5">
        <div className="text-muted flex items-center justify-between text-xs">
          <time dateTime="2026-09-18">September 18, 2026</time>
          <span>8 min read</span>
        </div>
        <Card.Title className="text-xl leading-6 font-semibold text-balance">
          Interfaces That Leave Room for Thought
        </Card.Title>
        <Card.Description className="line-clamp-2 text-sm leading-5">
          A quieter approach to digital spaces, where purposeful motion protects attention.
        </Card.Description>
      </Card.Header>
      <Card.Content className="px-1 pt-1">
        <div className="text-muted flex flex-wrap gap-x-2 text-xs">
          <span>Interaction Design</span>
          <span aria-hidden="true">·</span>
          <span>Motion</span>
          <span aria-hidden="true">·</span>
          <span>+1</span>
        </div>
      </Card.Content>
      <Card.Footer className="border-separator mt-3 flex items-center justify-between border-t px-1 pt-3 pb-1">
        <ArticleAuthorPopover />
        <span className="text-accent bg-accent/10 flex size-9 items-center justify-center rounded-full">
          <ArticleArrow />
        </span>
      </Card.Footer>
    </Card>
  );
}

function DiscoveryArticleCard() {
  return (
    <Card className="w-full overflow-hidden p-0" role="article">
      <div className="relative isolate aspect-[1.55/1] w-full overflow-hidden">
        <ArticleShader variant="dot-grid" />
        <Chip className="absolute top-3 left-3" color="accent" size="sm" variant="soft">
          Field Notes
        </Chip>
      </div>
      <Card.Header className="gap-2 p-4">
        <Card.Title className="line-clamp-2 text-base leading-5 font-semibold">
          Designing for a Slower Internet
        </Card.Title>
        <Card.Description className="line-clamp-2 text-xs leading-5">
          Small choices that make a digital reading space feel calm, clear, and human.
        </Card.Description>
      </Card.Header>
      <Card.Footer className="border-separator flex items-center justify-between border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <Avatar.Image
              alt="Sarah Johnson"
              src="https://img.heroui.chat/image/avatar?w=400&h=400&u=1"
            />
            <Avatar.Fallback>SJ</Avatar.Fallback>
          </Avatar>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium">Sarah Johnson</span>
            <time className="text-muted text-[11px]" dateTime="2026-09-18">
              Sep 18, 2026
            </time>
          </div>
        </div>
        <span className="text-accent bg-accent/10 flex size-8 items-center justify-center rounded-full">
          <ArticleArrow />
        </span>
      </Card.Footer>
    </Card>
  );
}

export default function ArticleCardTestClient() {
  const [variant, setVariant] = useState<ShaderBackgroundVariant>("static-mesh-gradient");

  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="text-muted text-sm">Component Lab / Article Card</p>
          <h1 className="text-3xl leading-tight font-semibold">Shader Editorial</h1>
          <p className="text-muted max-w-2xl text-sm leading-6">
            A featured essay card using a shader as its cover, with the reading content kept on a
            clear surface below.
          </p>
        </header>

        <section aria-label="Shader variants" className="flex flex-wrap items-center gap-2">
          <span className="text-muted me-2 text-sm">Background</span>
          {SHADER_VARIANTS.map((item) => (
            <Button
              key={item.id}
              aria-pressed={variant === item.id}
              size="sm"
              variant={variant === item.id ? "primary" : "secondary"}
              onPress={() => setVariant(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </section>

        <section aria-label="Stacked article cards" className="flex flex-col items-start gap-3">
          <ColumnArticleStack posts={STACK_DEMO} title="Quiet Interfaces" />
        </section>

        <section aria-label="Science article card" className="flex w-full justify-center">
          <ScienceArticleCard />
        </section>

        <section aria-label="Article card variations" className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="text-muted text-xs font-medium">01 / Compact horizontal</p>
            <CompactArticleCard variant={variant} />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-muted text-xs font-medium">02 / Editorial feature</p>
            <EditorialArticleCard />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-muted text-xs font-medium">03 / Discovery tile</p>
            <DiscoveryArticleCard />
          </div>
        </section>
      </div>
    </main>
  );
}
