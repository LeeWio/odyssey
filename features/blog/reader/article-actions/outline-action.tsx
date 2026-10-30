"use client";

import { Button, Tooltip } from "@heroui/react";
import { Sheet } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  jumpToOutlineItem,
  useArticleOutlineRegistry,
} from "@/features/blog/reader/article/article-outline";
import { cn } from "@/lib/utils";

import { useReport, type Report } from "./use-engagement";

export function OutlineAction({ report }: { report: Report }) {
  const registry = useArticleOutlineRegistry();
  const hasOutline = useSyncExternalStore(
    registry?.subscribe ?? (() => () => undefined),
    () => Boolean(registry?.getSnapshot()),
    () => false
  );
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "right">("bottom");
  const activeItemRef = useRef<HTMLDivElement>(null);
  useReport("outline", isOpen, report);

  useEffect(() => {
    if (!isOpen) return;
    const query = window.matchMedia("(min-width: 48rem)");
    const update = () => setPlacement(query.matches ? "right" : "bottom");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [isOpen]);

  const items = isOpen ? (registry?.getSnapshot()?.items ?? []) : [];
  const label = registry?.getSnapshot()?.label ?? "";
  const activeId = items.find((item) => item.isActive)?.id ?? items[0]?.id ?? "";
  const activeIndex = Math.max(
    items.findIndex((item) => item.id === activeId),
    0
  );

  useEffect(() => {
    if (!isOpen) return;
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeId]);

  if (!hasOutline || !registry) return null;

  const jumpTo = (id: string) => {
    const item = registry.getSnapshot()?.items.find((entry) => entry.id === id);
    if (!item) return;
    jumpToOutlineItem(item);
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
      <Sheet isDetached isHandleOnly isOpen={isOpen} placement={placement} onOpenChange={setIsOpen}>
        <Sheet.Backdrop variant="blur">
          <Sheet.Content
            className={
              placement === "right"
                ? "w-[min(22rem,calc(100vw-1rem))]"
                : "mx-auto max-h-[min(70dvh,32rem)] w-[min(32rem,calc(100vw-1rem))]"
            }
          >
            <Sheet.Dialog
              className={placement === "bottom" ? "max-h-[min(70dvh,32rem)]" : undefined}
            >
              {placement === "bottom" ? <Sheet.Handle /> : null}
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>{label}</Sheet.Heading>
                <p className="text-muted text-xs tabular-nums">
                  {activeIndex + 1} / {items.length}
                </p>
              </Sheet.Header>
              <Sheet.Body className="px-2">
                <nav aria-label={label} className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const isActive = item.id === activeId;
                    return (
                      <Button
                        key={item.id}
                        aria-current={isActive ? "true" : undefined}
                        className="h-auto min-h-11 justify-start rounded-lg px-2 py-2"
                        fullWidth
                        variant="ghost"
                        onPress={() => jumpTo(item.id)}
                      >
                        <span
                          className="flex min-w-0 items-start gap-3 text-left"
                          ref={isActive ? activeItemRef : undefined}
                          style={{ marginInlineStart: `${(item.level - 1) * 0.75}rem` }}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1 h-4 w-0.5 shrink-0 rounded-full",
                              isActive ? "bg-accent" : "bg-separator"
                            )}
                          />
                          <span
                            className={cn(
                              "line-clamp-2 leading-5 font-normal",
                              isActive ? "text-foreground font-medium" : "text-muted"
                            )}
                          >
                            {item.textContent}
                          </span>
                        </span>
                      </Button>
                    );
                  })}
                </nav>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </>
  );
}
