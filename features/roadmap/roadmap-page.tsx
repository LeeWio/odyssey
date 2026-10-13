"use client";

import { pageEaseOut } from "@/lib/motion";

import { motion } from "motion/react";
import { Card, Chip, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageFrame } from "@/components/layout/page-frame";

const roadmapEvents = [
  {
    title: "东鳞西爪",
    tag: "在用",
    tagColor: "accent" as const,
    icon: "gravity-ui:file-text",
    description: "文章、专栏、归档，从 /single 读起。",
  },
  {
    title: "路上的光",
    tag: "在用",
    tagColor: "accent" as const,
    icon: "gravity-ui:picture",
    description: "图库和落过脚的地方，地图上还能点。",
  },
  {
    title: "桌上这些",
    tag: "在用",
    tagColor: "accent" as const,
    icon: "gravity-ui:layers",
    description: "还在用的硬件和软件，以及已经交出去的项目。",
  },
  {
    title: "还没看的",
    tag: "在用",
    tagColor: "accent" as const,
    icon: "gravity-ui:bell",
    description: "通知、留言墙、书架上还想再翻的。",
  },
] as const;

export function RoadmapPage() {
  return (
    <PageFrame className="bg-background">
      <div className="flex w-full flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: pageEaseOut }}
          className="max-w-xl"
        >
          <Chip color="accent" size="sm" variant="soft">
            正在用的
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
          >
            已经摆上桌的
          </Typography>
          <Typography color="muted" type="body" className="mt-4 leading-7">
            现在能打开的几块。没有日期，也没有还没做的。
          </Typography>
        </motion.header>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
          {roadmapEvents.map((event) => (
            <Card key={event.title} className="h-full" variant="secondary">
              <Card.Header className="gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Icon aria-hidden="true" className="text-accent size-4" icon={event.icon} />
                  <Chip color={event.tagColor} size="sm" variant="soft">
                    {event.tag}
                  </Chip>
                </div>
                <Card.Title className="text-xl">{event.title}</Card.Title>
                <Card.Description className="leading-6">{event.description}</Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}
