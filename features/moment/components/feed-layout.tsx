"use client";

import { Segment } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { LayoutGroup, motion, useAnimate } from "motion/react";
import { startTransition, useEffect, useId, useOptimistic, type ReactNode } from "react";

import { pageEaseOut } from "@/lib/motion";
import { useQueryState } from "@/lib/hooks/use-query-state";
import { momentLayoutTransition, useMomentMotion } from "./feed-motion";

export function MomentFeedLayout({
  children,
  busy = false,
  toolbar,
}: {
  children?: ReactNode;
  busy?: boolean;
  toolbar?: ReactNode;
}) {
  const t = useTranslations("Moments");
  const { reduced } = useMomentMotion();
  const { searchParams, updateQuery } = useQueryState({ clientOnly: true });
  const savedViewMode = searchParams.get("view") === "grid" ? "grid" : "list";
  const [viewMode, setViewMode] = useOptimistic<"grid" | "list">(savedViewMode);
  const layoutId = useId();
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    const node = scope.current;
    if (!node) return;
    const controls = animate(
      node,
      { opacity: reduced || !busy ? 1 : 0.72 },
      { duration: reduced ? 0 : 0.12, ease: pageEaseOut }
    );
    return () => controls.stop();
  }, [animate, busy, reduced, scope]);

  return (
    <LayoutGroup id={layoutId} inherit={false}>
      <div className="group/moment-feed @container/moment-feed min-w-0" data-view={viewMode}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {toolbar}
          <div
            className="ml-auto hidden shrink-0 @min-[41rem]/moment-feed:block"
            data-slot="moment-feed-view"
          >
            <Segment
              aria-label={t("viewMode")}
              selectedKey={viewMode}
              size="sm"
              onSelectionChange={(key) => {
                if (key === "list" || key === "grid") {
                  startTransition(() => {
                    setViewMode(key);
                    updateQuery({ view: key }, { mode: "replace", hash: window.location.hash });
                  });
                }
              }}
            >
              <Segment.Item id="list">
                <Icon aria-hidden="true" icon="gravity-ui:list-ul" />
                {t("listView")}
              </Segment.Item>
              <Segment.Item id="grid">
                <Icon aria-hidden="true" icon="gravity-ui:rectangles-4" />
                {t("gridView")}
              </Segment.Item>
            </Segment>
          </div>
        </div>
        <motion.div
          ref={scope}
          initial={false}
          layout="position"
          layoutDependency={viewMode}
          transition={{ layout: reduced ? { duration: 0 } : momentLayoutTransition }}
          data-slot="moment-feed-body"
          aria-busy={busy}
        >
          {children}
        </motion.div>
      </div>
    </LayoutGroup>
  );
}
