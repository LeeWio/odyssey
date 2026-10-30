"use client";

import { Button, ListBox, Sheet, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useScrollIntoView } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";

import {
  ARTICLE_OUTLINE_TOP_OFFSET,
  readingScrollOffset,
} from "@/components/rich-text/extensions/table-of-contents";
import {
  currentHeadingId,
  headingElement,
  useArticleOutline,
  writeHeadingHash,
} from "@/features/blog/reader/article/article-outline";
import { cn } from "@/lib/utils";

import { useReport, type Report } from "./use-engagement";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function headingClass(level: number) {
  if (level <= 1) return "text-foreground font-medium";
  if (level === 2) return "text-foreground font-normal";
  return "text-muted text-sm font-normal";
}

export function OutlineAction({ report }: { report: Report }) {
  const outline = useArticleOutline();
  const [isOpen, setIsOpen] = useState(false);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLElement>({
    duration: 700,
    easing: easeOutCubic,
    offset: ARTICLE_OUTLINE_TOP_OFFSET,
  });
  useReport("outline", isOpen, report);

  const items = outline?.items ?? [];
  const label = outline?.label ?? "";
  const activeId = isOpen ? currentHeadingId(items) : "";

  useEffect(() => {
    if (!isOpen) return;
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeId]);

  if (!outline) return null;

  const jumpTo = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    const heading = item ? headingElement(item) : null;
    if (!item || !heading) return;
    writeHeadingHash(item);
    const anchor = document.createElement("div");
    anchor.style.position = "absolute";
    anchor.style.top = `${heading.getBoundingClientRect().top + readingScrollOffset()}px`;
    document.body.append(anchor);
    targetRef.current = anchor;
    scrollIntoView({ alignment: "start" });
    anchor.remove();
    setIsOpen(false);
  };

  return (
    <>
      <Tooltip delay={100}>
        <Button
          isIconOnly
          aria-expanded={isOpen}
          aria-label={label}
          size="sm"
          variant="ghost"
          onPress={() => setIsOpen(true)}
        >
          <Icon aria-hidden="true" className="size-4" icon="gravity-ui:list-ul" />
        </Button>
        <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip>
      <Sheet isDetached isOpen={isOpen} placement="bottom" onOpenChange={setIsOpen}>
        <Sheet.Backdrop isExiting variant="blur">
          <Sheet.Content className="mx-auto max-h-[min(70dvh,32rem)] w-[min(32rem,calc(100vw-1rem))]">
            <Sheet.Dialog className="max-h-[min(70dvh,32rem)]">
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading className="text-muted text-xs font-medium tracking-wide uppercase">
                  {label}
                </Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body className="px-2">
                <ListBox
                  aria-label={label}
                  className="p-0"
                  selectedKeys={activeId ? [activeId] : []}
                  selectionMode="single"
                >
                  {items.map((item) => {
                    const isActive = item.id === activeId;
                    return (
                      <ListBox.Item
                        key={item.id}
                        className="data-[selected=true]:bg-default min-h-11"
                        id={item.id}
                        textValue={item.textContent}
                        onPress={() => jumpTo(item.id)}
                      >
                        <span
                          className={cn(
                            "line-clamp-2 min-w-0 text-left leading-5",
                            headingClass(item.level)
                          )}
                          ref={isActive ? activeItemRef : undefined}
                          style={{ marginInlineStart: `${(item.level - 1) * 1}rem` }}
                        >
                          {item.textContent}
                        </span>
                      </ListBox.Item>
                    );
                  })}
                </ListBox>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </>
  );
}
