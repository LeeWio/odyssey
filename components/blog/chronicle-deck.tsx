"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, Chip, Button } from "@heroui/react";
import { Calendar, Person, ArrowRight } from "@gravity-ui/icons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FEATURED_POSTS = [
  {
    id: 1,
    title: "在 React 19 与 Next.js 16 的荒野上：一场架构漫游",
    category: "Engineering",
    summary:
      "记录作者在将整个数字底座重构并迁移至最新版 Next.js 16 和 React 19 时的底层阵痛、性能调优和个人史诗感悟。探索服务器组件（RSC）在无尽网络请求中的边界。",
    cover: "/zelda-landscape.jpg",
    date: "2026.06.18",
    author: "Odysseus",
    readTime: "12 min read",
  },
  {
    id: 2,
    title: "塞尔达传说：旷野美学与 Web 交互的心流契合",
    category: "Design",
    summary:
      "探讨任天堂《荒野之息》中基于“减法”的设计美学，如何启发我们在极其嘈杂的现代 Web 开发中重塑组件的微交互反馈，寻找不被打扰的、纯粹的用户心流体验。",
    cover: "/zelda-hero.png",
    date: "2026.06.12",
    author: "Odysseus",
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "艾尔登法环：暗黑哥特美学在数字 UI 层级中的投射",
    category: "Aesthetics",
    summary:
      "从交界地的破碎史诗中提炼空间深度，揭示在极暗背景色调（Achromatic Dark）下，如何利用冷金（Gold Accent）和层级微光传达高贵而寂静的界面张力与交互反馈。",
    cover: "/er-hero.png",
    date: "2026.06.05",
    author: "Odysseus",
    readTime: "15 min read",
  },
];

export function ChronicleDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".chronicle-card");
      if (cards.length === 0) return;

      // Pin the whole section
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=300%", // Scroll depth for scrubbing
          pin: true,
          scrub: 1, // Smooth scrolling catching up in 1s
          invalidateOnRefresh: true,
        },
      });

      // Initially set up back cards
      cards.forEach((card, index) => {
        if (index > 0) {
          gsap.set(card, {
            scale: 1 - index * 0.05,
            y: index * 24,
            zIndex: cards.length - index,
            opacity: 1 - index * 0.3,
          });
        } else {
          gsap.set(card, { zIndex: cards.length, opacity: 1 });
        }
      });

      // Build animation steps
      cards.forEach((card, index) => {
        if (index < cards.length - 1) {
          const nextCard = cards[index + 1];
          const farCards = cards.slice(index + 2);

          // Card [index] slides up and out
          tl.to(
            card,
            {
              y: -150,
              scale: 0.85,
              opacity: 0,
              rotation: index % 2 === 0 ? -6 : 6,
              duration: 1,
              ease: "power2.inOut",
            },
            index
          );

          // Card [index + 1] comes to front
          tl.to(
            nextCard,
            {
              scale: 1,
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "power2.inOut",
            },
            index
          );

          // Shift any card behind nextCard forward
          farCards.forEach((farCard, fIdx) => {
            const relativeIdx = fIdx + 1; // index relative to nextCard
            tl.to(
              farCard,
              {
                scale: 1 - relativeIdx * 0.05,
                y: relativeIdx * 24,
                opacity: 1 - relativeIdx * 0.3,
                duration: 1,
                ease: "power2.inOut",
              },
              index
            );
          });
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="bg-background relative flex h-screen w-full flex-col justify-center overflow-hidden px-6 lg:px-12"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 md:gap-12">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Chip
            color="accent"
            size="sm"
            variant="soft"
            className="font-semibold tracking-wider uppercase"
          >
            Chronicles of Journey
          </Chip>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            时光日志 · 堆叠折叠卡组
          </h2>
          <p className="text-muted max-w-2xl text-base leading-relaxed md:text-lg">
            向下滚动鼠标，体验时光卡牌由远及近的翻动效果。每一张卡片都是一段用代码与美学雕刻的奥德赛旅程。
          </p>
        </div>

        {/* Floating Stack Container */}
        <div ref={deckRef} className="relative mx-auto h-[450px] w-full max-w-4xl sm:h-[480px]">
          {FEATURED_POSTS.map((post, idx) => (
            <div
              key={post.id}
              className="chronicle-card absolute inset-0 h-full w-full origin-bottom"
            >
              <Card className="border-border bg-surface/80 grid h-full grid-cols-1 overflow-hidden border shadow-2xl backdrop-blur-xl md:grid-cols-12">
                {/* Left Side: Immersive Cover */}
                <div className="bg-muted relative h-48 w-full overflow-hidden md:col-span-5 md:h-full">
                  <img
                    src={post.cover}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-105"
                  />
                  <div className="from-background/90 absolute inset-0 bg-gradient-to-t via-transparent to-transparent md:bg-gradient-to-r md:from-transparent" />
                  <div className="absolute top-4 left-4">
                    <Chip
                      size="sm"
                      variant="soft"
                      className="bg-background/50 font-semibold uppercase shadow-md backdrop-blur-md"
                    >
                      {post.category}
                    </Chip>
                  </div>
                </div>

                {/* Right Side: Narrative Metadata */}
                <div className="flex flex-col justify-between p-6 text-left sm:p-10 md:col-span-7">
                  <div className="flex flex-col gap-4">
                    {/* Tiny stats */}
                    <div className="text-muted flex items-center gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1">
                        <Person className="size-3.5" />
                        {post.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {post.date}
                      </span>
                      <span>•</span>
                      <span className="text-accent">{post.readTime}</span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-foreground hover:text-primary cursor-pointer text-xl font-bold tracking-tight transition-colors sm:text-2xl">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted line-clamp-3 text-sm leading-relaxed sm:line-clamp-4 sm:text-base">
                      {post.summary}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="border-border/40 mt-4 flex items-center justify-between border-t pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent hover:text-accent-foreground group font-semibold"
                    >
                      深入阅读史篇
                      <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <span className="text-muted/40 font-mono text-xl font-extrabold select-none">
                      0{idx + 1}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
