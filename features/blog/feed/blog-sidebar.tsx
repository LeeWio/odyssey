"use client";

import { Bell, CircleChevronRight } from "@gravity-ui/icons";
import { Chip, Surface, Typography, cn } from "@heroui/react";
import { ItemCard } from "@heroui-pro/react";
import Link from "next/link";

import { NewsletterSubscribeForm } from "@/features/newsletter/newsletter-subscribe-form";

const CATEGORIES = [
  { id: 1, name: "Design", count: 12, color: "primary" },
  { id: 2, name: "Life", count: 8, color: "secondary" },
  { id: 3, name: "Tech", count: 10, color: "success" },
  { id: 4, name: "Productivity", count: 6, color: "warning" },
  { id: 5, name: "Notes", count: 7, color: "danger" },
  { id: 6, name: "Thoughts", count: 11, color: "accent" },
  { id: 7, name: "Tools", count: 15, color: "primary" },
];

const TAGS = [
  "Minimalism",
  "Next.js",
  "Vim",
  "CSS",
  "UI/UX",
  "Writing",
  "Motion",
  "Life",
  "React",
  "System",
  "Focus",
  "AI",
  "Inspiration",
  "Code",
  "Music",
];

const WEEKLY_HOT = [
  {
    id: "01",
    title: "The Power of Consistency",
    date: "Jul 18, 2026",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    id: "02",
    title: "Designing for Clarity",
    date: "Jul 21, 2026",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    id: "03",
    title: "A Week in My Life",
    date: "Jul 19, 2026",
    gradient: "from-purple-400 to-rose-500",
  },
  {
    id: "04",
    title: "Digital Minimalism",
    date: "Jul 15, 2026",
    gradient: "from-amber-400 to-orange-500",
  },
];

export function BlogSidebar() {
  return (
    <aside className="flex flex-col gap-8">
      {/* Categories Widget */}
      <Surface variant="secondary" className="rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Typography className="text-lg font-bold">Categories</Typography>
          <Link
            href="/categories"
            className="text-primary flex items-center gap-1 text-xs font-bold"
          >
            View all <CircleChevronRight className="size-3" />
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {CATEGORIES.map((cat) => (
            <ItemCard
              key={cat.id}
              variant="transparent"
              className="hover:bg-default-100 rounded-xl px-2 py-1 transition-colors"
            >
              <ItemCard.Icon className={cn("bg-opacity-10 size-8 rounded-full", `bg-${cat.color}`)}>
                <div className={cn("size-2 rounded-full", `bg-${cat.color}`)} />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title className="text-sm font-medium">{cat.name}</ItemCard.Title>
              </ItemCard.Content>
              <ItemCard.Action>
                <Typography className="text-default-400 font-mono text-xs tabular-nums">
                  {cat.count}
                </Typography>
              </ItemCard.Action>
            </ItemCard>
          ))}
        </div>
      </Surface>

      {/* Tags Widget */}
      <Surface variant="secondary" className="rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Typography className="text-lg font-bold">Tags</Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <Chip
              key={tag}
              size="sm"
              variant="soft"
              className="bg-background hover:bg-default-200 cursor-pointer font-medium transition-colors"
            >
              {tag}
            </Chip>
          ))}
        </div>
        <Link href="/tags" className="text-primary mt-6 block text-xs font-bold">
          View all tags →
        </Link>
      </Surface>

      {/* Newsletter Widget */}
      <Surface variant="secondary" className="relative overflow-hidden rounded-3xl p-6">
        <div className="bg-primary absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-white">
          <Bell className="size-4" />
        </div>
        <Typography className="mb-2 text-lg leading-tight font-bold">Newsletter</Typography>
        <Typography className="text-default-500 mb-6 text-xs leading-relaxed">
          Curated articles and thoughts in your inbox.
        </Typography>
        <NewsletterSubscribeForm />
        <Typography className="text-default-400 mt-4 text-center text-[10px]">
          No spam. Unsubscribe anytime.
        </Typography>
      </Surface>

      {/* Weekly Hot Widget */}
      <Surface variant="secondary" className="rounded-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Typography className="text-lg font-bold">本周热门</Typography>
        </div>
        <div className="flex flex-col gap-6">
          {WEEKLY_HOT.map((item) => (
            <div key={item.id} className="group flex cursor-pointer items-center gap-4">
              <div className="text-default-300 group-hover:text-primary font-mono text-xs font-bold transition-colors">
                {item.id}
              </div>
              <div
                className={cn(
                  "size-12 shrink-0 rounded-xl bg-gradient-to-br shadow-sm",
                  item.gradient
                )}
              />
              <div className="flex flex-col gap-1">
                <Typography className="group-hover:text-primary line-clamp-1 text-sm leading-snug font-bold transition-colors">
                  {item.title}
                </Typography>
                <Typography className="text-default-400 text-[10px] font-medium">
                  {item.date}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </aside>
  );
}
