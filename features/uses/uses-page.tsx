"use client";

import { motion } from "motion/react";
import { Card, Chip, Typography } from "@heroui/react";
import { usesData } from "./uses-data";
import { Icon } from "@iconify/react";

export function UsesPage() {
  return (
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-4xl">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border-default-200 grid gap-8 border-b pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        >
          <div className="max-w-2xl">
            <div className="text-muted flex items-center gap-2 font-mono text-xs font-semibold uppercase">
              <Icon icon="gravity-ui:briefcase" aria-hidden="true" className="size-4" />
              Equipment & Tools
            </div>
            <Typography type="h1" weight="bold" className="mt-5 leading-[1.02] text-balance">
              What I use on a daily basis.
            </Typography>
            <Typography color="muted" type="body" className="mt-5 max-w-xl leading-7">
              A comprehensive list of the hardware, software, and tools I use to design, write code,
              and stay productive. This setup evolves over time, but these are the current staples.
            </Typography>
          </div>
          <Chip className="w-fit" size="sm" variant="soft">
            Updated 2026
          </Chip>
        </motion.header>

        <div className="mt-16 flex flex-col gap-16">
          {usesData.map((category, index) => (
            <motion.section
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
            >
              <div className="mb-8">
                <Typography type="h2" weight="bold" className="flex items-center gap-3">
                  {getCategoryIcon(category.name)}
                  {category.name}
                </Typography>
                {category.description && (
                  <Typography color="muted" type="body-sm" className="mt-2">
                    {category.description}
                  </Typography>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {category.items.map((item) => (
                  <Card key={item.name} variant="secondary" className="h-full p-6">
                    <div className="flex h-full flex-col gap-4">
                      <div>
                        <Typography type="h4" weight="semibold">
                          {item.name}
                        </Typography>
                        <Typography color="muted" type="body-sm" className="mt-2 leading-relaxed">
                          {item.description}
                        </Typography>
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-2 pt-4">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-muted/80 bg-default-100 rounded-md px-2 py-0.5 text-xs font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(name: string) {
  switch (name) {
    case "Workspace":
      return <Icon icon="gravity-ui:display" className="text-default-500 size-6" />;
    case "Coding":
      return <Icon icon="gravity-ui:terminal" className="text-default-500 size-6" />;
    case "Audio & Video":
      return <Icon icon="gravity-ui:headphones" className="text-default-500 size-6" />;
    default:
      return <Icon icon="gravity-ui:layout-cells-large" className="text-default-500 size-6" />;
  }
}
