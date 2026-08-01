"use client";

import { ArrowRight } from "@gravity-ui/icons";
import { Avatar, Button, Typography } from "@heroui/react";
import { Carousel } from "@heroui-pro/react";
import { motion } from "motion/react";
import Link from "next/link";

const FEATURED_ITEMS = [
  {
    category: "FEATURED",
    title: "构建一个如家般的博客",
    description: "从功能到设计，我是如何打造一个安静、快速且完全属于自己的个人空间的。",
    author: {
      name: "Liwei",
      date: "Jul 24, 2026",
      readTime: "8 min read",
      avatar: "/IMG_2232.JPG",
    },
    href: "/single/building-a-home-like-blog",
    gradient: "from-indigo-500/20 via-purple-500/20 to-blue-500/20",
  },
  // Add more mock items if needed for carousel
  {
    category: "DESIGN",
    title: "极简主义者的设计哲学",
    description: "在信息过载的时代，如何通过减法寻找产品的核心价值与美感。",
    author: {
      name: "Odysseus",
      date: "Aug 01, 2026",
      readTime: "12 min read",
      avatar: "/IMG_2260.JPG",
    },
    href: "/single/minimalist-design-philosophy",
    gradient: "from-amber-500/20 via-orange-500/20 to-rose-500/20",
  },
];

export function BlogHero() {
  return (
    <section className="w-full">
      <Carousel opts={{ loop: true }} className="w-full">
        <Carousel.Content>
          {FEATURED_ITEMS.map((item, index) => (
            <Carousel.Item key={index}>
              <div className="p-1">
                <div
                  className={`relative flex min-h-[400px] w-full flex-col justify-center overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${item.gradient} p-8 md:p-12 lg:p-16`}
                >
                  {/* Decorative Background Elements */}
                  <div className="absolute top-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-blue-500/20 blur-[120px]" />
                  <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-purple-500/20 blur-[100px]" />

                  <div className="relative z-10 flex flex-col items-start gap-6">
                    <Typography className="text-primary font-mono text-xs font-bold tracking-[0.2em] uppercase">
                      {item.category}
                    </Typography>

                    <Typography className="text-foreground max-w-2xl text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl">
                      {item.title}
                    </Typography>

                    <Typography className="text-default-500 max-w-lg text-lg leading-relaxed">
                      {item.description}
                    </Typography>

                    <div className="mt-4 flex items-center gap-4">
                      <Avatar size="md" className="ring-background ring-2">
                        <Avatar.Image src={item.author.avatar} alt={item.author.name} />
                        <Avatar.Fallback>{item.author.name[0]}</Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Typography className="text-sm font-bold">{item.author.name}</Typography>
                        <div className="text-default-400 flex items-center gap-2 text-xs">
                          <span>{item.author.date}</span>
                          <span>•</span>
                          <span>{item.author.readTime}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="bg-foreground text-background mt-6 h-14 rounded-full px-8 font-bold transition-transform active:scale-95"
                      onPress={() => (window.location.href = item.href)}
                    >
                      Read Article
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>

                  {/* Carousel Controls Overlay (Dots & Arrows) */}
                  {/* The carousel arrows will be handled by Carousel.Previous/Next in the main container */}
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel.Content>

        <div className="absolute right-12 bottom-12 z-20 flex items-center gap-4">
          <Carousel.Dots
            className="gap-2"
            renderDot={({ isSelected }) => (
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${isSelected ? "bg-primary w-6" : "bg-default-300 w-1.5"}`}
              />
            )}
          />
        </div>

        <div className="absolute top-1/2 right-12 z-20 hidden -translate-y-1/2 transform flex-col gap-2 lg:flex">
          {/* Note: Standard Carousel.Next/Previous are usually positioned at edges. 
                 The image shows them near the bottom right or center right. 
                 We'll use custom positioning for them.
             */}
        </div>

        <div className="absolute right-8 bottom-8 flex gap-2">
          <Carousel.Previous className="static translate-y-0 shadow-xl" />
          <Carousel.Next className="static translate-y-0 shadow-xl" />
        </div>
      </Carousel>
    </section>
  );
}
