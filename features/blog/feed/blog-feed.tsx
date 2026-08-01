"use client";

import {
  ArrowRight,
  Bell,
  Bookmark,
  Calendar,
  ChevronRight,
  CircleChevronLeft,
  CircleChevronRight,
  Magnifier,
  Moon,
  Person,
  Key as KeyIcon,
  Cloud,
} from "@gravity-ui/icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Description,
  Input,
  Label,
  ListBox,
  ScrollShadow,
  Separator,
  Surface,
  Tabs,
  Typography,
  cn,
} from "@heroui/react";

import { ChartTooltip, ItemCardGroup, PieChart, PressableFeedback } from "@heroui-pro/react";
const CHART_COLORS = ["var(--chart-4)", "var(--chart-3)", "var(--chart-2)", "var(--chart-1)"];
const browserData = [
  { name: "Chrome", value: 62 },
  { name: "Safari", value: 19 },
  { name: "Firefox", value: 10 },
  { name: "Edge", value: 9 },
];
const MotionWidget = motion.create(Widget);
const MotionTypography = motion.create(Typography);
const MotionCard = motion.create(Card);
import { Carousel, ItemCard, Segment, Widget } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
const CATEGORIES = [
  { id: "all", name: "All", icon: "lucide:layers" },
  { id: "design", name: "设计", icon: "lucide:palette" },
  { id: "dev", name: "编程", icon: "lucide:code" },
  { id: "travel", name: "旅行", icon: "lucide:map" },
  { id: "life", name: "生活", icon: "lucide:coffee" },
  { id: "photo", name: "摄影", icon: "lucide:camera" },
];
const SERIES = [
  {
    title: "Front1end",
    count: "12 stories",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
  },
  {
    title: "Syst2ems",
    count: "8 stories",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
  },
  {
    title: "A34I",
    count: "15 stories",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    title: "Des5ign",
    count: "10 stories",
    gradient: "from-orange-500/20 via-yellow-500/10 to-transparent",
  },
  {
    title: "Fron6tend",
    count: "12 stories",
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
  },
  {
    title: "Sys7tems",
    count: "8 stories",
    gradient: "from-blue-500/20 via-cyan-500/10 to-transparent",
  },
  {
    title: "AI",
    count: "15 stories",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
  },
  {
    title: "Design",
    count: "10 stories",
    gradient: "from-orange-500/20 via-yellow-500/10 to-transparent",
  },
];
const LATEST_ARTICLES = [
  {
    title: "深入理解 JavaScript 中的闭包",
    summary: "闭包是 JavaScript 中一个强大而又容易被误解的概念。本文通过实例带你彻底搞定它。",
    category: "编程",
    author: "某小北",
    date: "May 12, 2024",
    readTime: "15 min read",
    image: "/111.jpeg",
  },
  {
    title: "我日常使用的 10 个效率工具",
    summary: "工具是其于战胜之器。分享我在学习、工作和生活中常用的工具，希望能给你有所帮助。",
    category: "效率",
    author: "某小北",
    date: "May 18, 2024",
    readTime: "8 min read",
    image: "/222.png",
  },
  {
    title: "在瑞士徒步的那些难忘瞬间",
    summary: "徒步是最接近自然的方式之一。记录在瑞士徒步中的所见所感，风景真的太美了！",
    category: "旅行",
    author: "某小北",
    date: "May 16, 2024",
    readTime: "10 min read",
    image: "/333.png",
  },
  {
    title: "极简生活：少即是多",
    summary: "断舍离之后，我发现生活变得更加轻松和自由。分享我的极简生活实践与思考。",
    category: "生活",
    author: "某小北",
    date: "May 10, 2024",
    readTime: "6 min read",
    image: "/111.jpeg",
  },
];

const POPULAR_THIS_WEEK = [
  { id: "01", title: "深入理解 JavaScript 中的闭包", date: "May 12", image: "/111.jpeg" },
  { id: "02", title: "我日常使用的 10 个效率工具", date: "May 18", image: "/222.png" },
  { id: "03", title: "使用 TypeScript 优化 React 项目", date: "May 8", image: "/333.png" },
  { id: "04", title: "极简生活：少即是多", date: "May 10", image: "/111.jpeg" },
];

const POPULAR_TAGS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "前端",
  "编辑技巧",
  "工具推荐",
  "效率提升",
  "随笔",
  "旅行",
  "生活方式",
  "摄影",
  "设计",
  "阅读",
  "建筑",
];

const TRENDING_NOW = [
  { title: "如何优雅地编写可维护的前端代码", views: "342 views", image: "/111.jpeg" },
  { title: "深度解析 Promise 原理", views: "431 views", image: "/222.png" },
  { title: "从 0 到 1 搭建个人博客", views: "389 views", image: "/333.png" },
  { title: "我的 2024 年度书单", views: "275 views", image: "/111.jpeg" },
];

export default function BlogFeed() {
  return (
    <main className="min-h-screen">
      <ScrollShadow
        orientation="horizontal"
        className="mx-auto flex w-full overflow-x-auto px-6 lg:px-12"
        hideScrollBar
      >
        <Segment defaultSelectedKey="all" size="md" variant="ghost">
          {CATEGORIES.map((category) => (
            <Segment.Item key={category.id} id={category.id}>
              <Icon icon={category.icon} className="size-4" />
              {category.name}
            </Segment.Item>
          ))}
        </Segment>
      </ScrollShadow>

      <div className="mx-auto mt-12 grid w-full grid-cols-1 items-start gap-12 px-6 lg:grid-cols-12 lg:px-12 xl:gap-16">
        <div className="flex flex-col gap-8 lg:col-span-7 xl:col-span-6">
          <ItemCardGroup className="overflow-hidden">
            <ItemCardGroup.Header>
              <ItemCardGroup.Title>Lastesst articles</ItemCardGroup.Title>
              <ItemCardGroup.Description>
                Manage your account settings and preferences
              </ItemCardGroup.Description>
            </ItemCardGroup.Header>
            <ItemCard<"button">
              className="hover:bg-default/20 active:bg-default-hover/50 relative w-full cursor-pointer overflow-hidden transition-colors"
              render={(props) => <button type="button" {...props} />}
            >
              <PressableFeedback.Ripple />
              <ItemCard.Icon>
                <Person />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>Profile</ItemCard.Title>
                <ItemCard.Description>Update your personal information</ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <ChevronRight className="text-muted size-4" />
              </ItemCard.Action>
            </ItemCard>
            <ItemCard<"button">
              className="hover:bg-default/20 active:bg-default-hover/50 relative w-full cursor-pointer overflow-hidden transition-colors"
              render={(props) => <button type="button" {...props} />}
            >
              <PressableFeedback.Ripple />
              <ItemCard.Icon>
                <KeyIcon />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>Security</ItemCard.Title>
                <ItemCard.Description>Manage passwords and 2FA</ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <ChevronRight className="text-muted size-4" />
              </ItemCard.Action>
            </ItemCard>
            <ItemCard<"button">
              className="hover:bg-default/20 active:bg-default-hover/50 relative w-full cursor-pointer overflow-hidden transition-colors"
              render={(props) => <button type="button" {...props} />}
            >
              <PressableFeedback.Ripple />
              <ItemCard.Icon>
                <Cloud />
              </ItemCard.Icon>
              <ItemCard.Content>
                <ItemCard.Title>Cloud sync</ItemCard.Title>
                <ItemCard.Description>Sync data across your devices</ItemCard.Description>
              </ItemCard.Content>
              <ItemCard.Action>
                <ChevronRight className="text-muted size-4" />
              </ItemCard.Action>
            </ItemCard>
          </ItemCardGroup>

          <Button fullWidth variant="tertiary">
            Load more <Icon icon="lucide:chevron-down" className="ml-1" />
          </Button>
        </div>

        <div className="flex flex-col gap-12 lg:col-span-5 xl:col-span-3">
          <Carousel opts={{ loop: true }}>
            <Carousel.Content>
              {Array.from({ length: 5 }, (_, i) => (
                <Carousel.Item key={i}>
                  <div className="p-1">
                    <Card className="select-none">
                      <Card.Content className="flex aspect-square items-center justify-center">
                        <span className="text-4xl font-semibold tabular-nums">{i + 1}</span>
                      </Card.Content>
                    </Card>
                  </div>
                </Carousel.Item>
              ))}
            </Carousel.Content>
            <Carousel.Previous />
            <Carousel.Next />
          </Carousel>

          <div className="flex flex-col gap-8">
            <ItemCardGroup className="overflow-hidden" variant="transparent">
              <ItemCardGroup.Header>
                <ItemCardGroup.Title>Popular This Week</ItemCardGroup.Title>
              </ItemCardGroup.Header>
              <ItemCard>
                <ItemCard.Icon>
                  <Person />
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Profile</ItemCard.Title>
                  <ItemCard.Description>Update your personal information</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <ChevronRight className="text-muted size-4" />
                </ItemCard.Action>
              </ItemCard>
              <ItemCard>
                <ItemCard.Icon>
                  <KeyIcon />
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Security</ItemCard.Title>
                  <ItemCard.Description>Manage passwords and 2FA</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <ChevronRight className="text-muted size-4" />
                </ItemCard.Action>
              </ItemCard>
              <ItemCard>
                <ItemCard.Icon>
                  <KeyIcon />
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Security</ItemCard.Title>
                  <ItemCard.Description>Manage passwords and 2FA</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <ChevronRight className="text-muted size-4" />
                </ItemCard.Action>
              </ItemCard>
              <ItemCard>
                <ItemCard.Icon>
                  <KeyIcon />
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Security</ItemCard.Title>
                  <ItemCard.Description>Manage passwords and 2FA</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <ChevronRight className="text-muted size-4" />
                </ItemCard.Action>
              </ItemCard>
              <ItemCard>
                <ItemCard.Icon>
                  <KeyIcon />
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Security</ItemCard.Title>
                  <ItemCard.Description>Manage passwords and 2FA</ItemCard.Description>
                </ItemCard.Content>
                <ItemCard.Action>
                  <ChevronRight className="text-muted size-4" />
                </ItemCard.Action>
              </ItemCard>
            </ItemCardGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:col-span-12 xl:col-span-3 xl:grid-cols-1">
          <Widget className="w-full">
            <Widget.Header>
              <Widget.Title>Browser Usage</Widget.Title>
            </Widget.Header>
            <Widget.Content className="flex flex-col items-center gap-4">
              <PieChart height={200}>
                <PieChart.Pie
                  cx="50%"
                  cy="50%"
                  data={browserData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                >
                  {browserData.map((_, idx) => (
                    <PieChart.Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </PieChart.Pie>
                <PieChart.Tooltip
                  content={({ active, payload }) => {
                    const entry = payload?.[0];
                    if (!active || !entry) return null;
                    return (
                      <ChartTooltip>
                        <ChartTooltip.Item>
                          <ChartTooltip.Indicator color={entry.payload?.fill} />
                          <ChartTooltip.Label>{entry.name}</ChartTooltip.Label>
                          <ChartTooltip.Value>{entry.value}%</ChartTooltip.Value>
                        </ChartTooltip.Item>
                      </ChartTooltip>
                    );
                  }}
                />
              </PieChart>
              <Widget.Legend className="flex-wrap justify-center">
                {browserData.map((entry, idx) => (
                  <Widget.LegendItem
                    key={entry.name}
                    color={CHART_COLORS[idx % CHART_COLORS.length]!}
                  >
                    {entry.name}
                  </Widget.LegendItem>
                ))}
              </Widget.Legend>
            </Widget.Content>
          </Widget>

          <Surface className="shadow-surface flex h-full flex-col rounded-3xl">
            <ListBox aria-label="Users" selectionMode="multiple">
              <ListBox.Item id="1" textValue="Bob">
                <Avatar size="sm">
                  <Avatar.Image
                    alt="Bob"
                    src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg"
                  />
                  <Avatar.Fallback>B</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col">
                  <Label>Bob</Label>
                  <Description>bob@heroui.com</Description>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="2" textValue="Fred">
                <Avatar size="sm">
                  <Avatar.Image
                    alt="Fred"
                    src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg"
                  />
                  <Avatar.Fallback>F</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col">
                  <Label>Fred</Label>
                  <Description>fred@heroui.com</Description>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="3" textValue="Martha">
                <Avatar size="sm">
                  <Avatar.Image
                    alt="Martha"
                    src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg"
                  />
                  <Avatar.Fallback>M</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col">
                  <Label>Martha</Label>
                  <Description>martha@heroui.com</Description>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Surface>
        </div>
      </div>

      <MotionWidget
        initial={{
          opacity: 0,
          y: 24,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.2,
        }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="bg-transparent px-[clamp(1rem,3vw,3rem)]"
      >
        {/* Header */}

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.5,
                rotate: -45,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
                rotate: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Icon icon="gravity-ui:sparkles-fill" className="text-primary size-5" />
            </motion.div>

            <MotionTypography
              type="h3"
              initial={{
                opacity: 0,
                x: -10,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.1,
                duration: 0.5,
              }}
            >
              Constellations
            </MotionTypography>
          </div>

          <MotionTypography
            type="body-sm"
            color="muted"
            className="max-w-md"
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              delay: 0.2,
              duration: 0.5,
            }}
          >
            Small pieces that become a bigger picture.
          </MotionTypography>
        </div>

        {/* Carousel */}

        <Widget.Content className="mt-6 bg-transparent p-0">
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
          >
            <Carousel.Content>
              {SERIES.map((item, i) => (
                <Carousel.Item
                  key={item.title}
                  className="basis-[85%] pr-3 sm:basis-[45%] md:basis-[32%] lg:basis-[24%] xl:basis-[19%] 2xl:basis-[16%]"
                >
                  <MotionCard
                    initial={{
                      opacity: 0,
                      y: 24,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.3,
                    }}
                    transition={{
                      delay: i * 0.08,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="group bg-muted/20 relative overflow-hidden border-none"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-80`}
                    />

                    {/* star */}

                    <div className="bg-foreground/40 absolute top-5 right-5 size-1.5 rounded-full" />

                    <Card.Content className="relative flex aspect-[4/3] flex-col justify-between p-5">
                      <div>
                        <Typography className="text-muted-foreground text-xs">
                          {String(i + 1).padStart(2, "0")}
                        </Typography>

                        <Typography className="mt-8 text-xl font-semibold tracking-tight">
                          {item.title}
                        </Typography>
                      </div>

                      <Typography type="body-sm" color="muted">
                        {item.count}
                      </Typography>
                    </Card.Content>
                  </MotionCard>
                </Carousel.Item>
              ))}
            </Carousel.Content>

            <Carousel.Previous className="hidden sm:flex" />

            <Carousel.Next className="hidden sm:flex" />
          </Carousel>
        </Widget.Content>
      </MotionWidget>
    </main>
  );
}
