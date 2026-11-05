"use client";

import { Segment } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { LayoutGroup, motion, useAnimate } from "motion/react";
import { useEffect, useId, type ReactNode } from "react";

import { pageEaseOut } from "@/lib/motion";
import { momentLayoutTransition, useMomentMotion } from "./feed-motion";

export function MomentFeedLayout({
  children,
  busy = false,
}: {
  children?: ReactNode;
  busy?: boolean;
}) {
  const t = useTranslations("Moments");
  const { reduced } = useMomentMotion();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view") === "grid" ? "grid" : "list";
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
        <div className="mb-5 flex justify-end" data-slot="moment-feed-view">
          <Segment
            aria-label={t("viewMode")}
            selectedKey={viewMode}
            size="sm"
            onSelectionChange={(key) => {
              if (key === "list" || key === "grid") {
                const url = new URL(window.location.href);
                url.searchParams.set("view", key);
                window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
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
