"use client";

import { Segment } from "@heroui-pro/react";
import { Card, Chip, Link, Typography, buttonVariants, typographyVariants } from "@heroui/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useState, type CSSProperties } from "react";

import { useReducedMotionPreference } from "@/hooks/use-reduced-motion-preference";
import type { JournalReadingPick } from "@/lib/features/post/server";

type PickId = JournalReadingPick["id"];

const covers = {
  series: {
    origin: "84% -24%",
    glow: "70 225 174",
    line: "161 240 213",
    start: "#163b34",
    end: "#0d1819",
  },
  diagrams: {
    origin: "72% -32%",
    glow: "101 145 251",
    line: "176 201 255",
    start: "#22365e",
    end: "#121926",
  },
  essays: {
    origin: "92% -18%",
    glow: "237 143 97",
    line: "252 196 157",
    start: "#533527",
    end: "#241b1c",
  },
} satisfies Record<
  PickId,
  { origin: string; glow: string; line: string; start: string; end: string }
>;

const MotionContent = motion.create(Card.Content);
const MotionFooter = motion.create(Card.Footer);
const supportingText = typographyVariants({ type: "body-sm", color: "muted" }).base();

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// The supplied GradualBlur stacks gradient masks and adds blur radii in quadrature.
const blurLayerCount = 7;
const blurLevel = (t: number) => (14.4 * (2 ** (4 * smoothstep(t)) - 1)) / 15;
const blurLayers = Array.from({ length: blurLayerCount }, (_, index): CSSProperties => {
  const start = index / blurLayerCount;
  const end = (index + 1) / blurLayerCount;
  const radius = Math.sqrt(blurLevel(end) ** 2 - blurLevel(start) ** 2);
  const filter = `blur(${radius.toFixed(3)}px)`;
  const mask = `linear-gradient(to bottom, transparent ${(start * 100).toFixed(2)}%, #000 ${(end * 100).toFixed(2)}%)`;
  return {
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    maskImage: mask,
    WebkitMaskImage: mask,
  };
});
const tintStops = Array.from({ length: 9 }, (_, step) => {
  const t = smoothstep(step / 8);
  return `rgb(0 0 0 / ${(t ** 3 * (t * (t * 6 - 15) + 10)).toFixed(3)}) ${step * 12.5}%`;
}).join(", ");
const tintMask = `linear-gradient(to bottom, ${tintStops})`;

function ReadingCover({
  picks,
  current,
  previous,
  reduced,
}: {
  picks: JournalReadingPick[];
  current: PickId;
  previous?: PickId;
  reduced: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [border-radius:inherit]"
    >
      <div className="absolute inset-0 [clip-path:inset(0)]">
        {picks.map(({ id }) => {
          const isCurrent = id === current;
          const isVisible = isCurrent || (!reduced && id === previous);
          const { origin, glow, line, start, end } = covers[id];

          return (
            <motion.div
              key={id}
              className={`absolute inset-0 ${isCurrent ? "z-10" : ""}`}
              style={{
                backgroundImage: [
                  `linear-gradient(180deg, transparent 18%, ${end} 93%)`,
                  `repeating-radial-gradient(ellipse at ${origin}, transparent 0 21px, rgb(${line} / 0.18) 22px, transparent 23px 28px)`,
                  `radial-gradient(ellipse at ${origin}, rgb(${glow} / 0.60), transparent 69%)`,
                  `linear-gradient(145deg, ${start}, ${end})`,
                ].join(", "),
              }}
              initial={false}
              animate={{ opacity: isVisible ? 1 : 0, visibility: isVisible ? "visible" : "hidden" }}
              transition={{ duration: isCurrent && !reduced ? 0.28 : 0, ease: "easeOut" }}
            />
          );
        })}
        <div className="absolute inset-x-0 bottom-0 z-20 h-[65%]">
          {blurLayers.map((style, index) => (
            <div key={index} className="absolute inset-0" style={style} />
          ))}
          <div
            className="absolute inset-0 bg-[#080b0f]/32"
            style={{ maskImage: tintMask, WebkitMaskImage: tintMask }}
          />
        </div>
      </div>
    </div>
  );
}

function ReadingPane({
  paneId,
  pick,
  selected,
  outgoing,
  direction,
  reduced,
}: {
  paneId: string;
  pick: JournalReadingPick;
  selected: boolean;
  outgoing: boolean;
  direction: number;
  reduced: boolean;
}) {
  const t = useTranslations("Journal.readingPicks");
  const { id, amount, leadHref, moreHref } = pick;
  const pose = {
    x: selected ? 0 : direction * 14,
    opacity: selected ? 1 : 0,
    visibility: selected || (outgoing && !reduced) ? ("visible" as const) : ("hidden" as const),
    transitionEnd: { visibility: selected ? ("visible" as const) : ("hidden" as const) },
  };
  const transition = {
    duration: reduced ? 0 : selected ? 0.24 : outgoing ? 0.13 : 0,
    ease: [0.22, 1, 0.36, 1] as const,
  };
  const headingId = `${paneId}-heading`;

  return (
    <section
      id={paneId}
      aria-labelledby={headingId}
      aria-hidden={!selected}
      inert={!selected}
      className={`col-start-1 row-span-2 row-start-1 grid min-w-0 grid-rows-subgrid ${selected ? "z-10" : "pointer-events-none"}`}
    >
      <MotionContent
        className="row-start-1 flex min-h-30 min-w-0 flex-col items-start justify-end gap-2"
        initial={false}
        animate={pose}
        transition={transition}
      >
        {amount != null && amount > 0 ? (
          <Chip size="sm" variant="soft">
            {t(id === "series" ? "chapters" : "minutes", { count: amount })}
          </Chip>
        ) : null}
        <Typography id={headingId} type="h3" className="wrap-anywhere">
          {t(`${id}.title`)}
        </Typography>
        <Card.Description>{t(`${id}.summary`)}</Card.Description>
      </MotionContent>
      <MotionFooter
        className="row-start-2 flex min-w-0 flex-wrap items-center justify-between gap-2"
        initial={false}
        animate={pose}
        transition={transition}
      >
        <Link
          href={leadHref}
          className={buttonVariants({ variant: "tertiary", className: "text-default-foreground" })}
        >
          {t(`${id}.read`)}
        </Link>
        {moreHref ? (
          <Link href={moreHref}>
            <span className={supportingText}>{t(`${id}.more`)}</span>
            <Link.Icon aria-hidden="true" />
          </Link>
        ) : null}
      </MotionFooter>
    </section>
  );
}

export function JournalReadingCard({ picks }: { picks: JournalReadingPick[] }) {
  const t = useTranslations("Journal.readingPicks");
  const baseId = useId();
  const reduced = useReducedMotionPreference();
  const [selection, setSelection] = useState<{ current?: PickId; previous?: PickId }>({});
  const first = picks[0];
  if (!first) return null;

  const current = picks.find(({ id }) => id === selection.current)?.id ?? first.id;
  const currentIndex = picks.findIndex(({ id }) => id === current);
  const headingId = `${baseId}-heading`;

  return (
    <Card
      aria-labelledby={headingId}
      data-testid="journal-reading-picks"
      data-theme="dark"
      className="relative isolate w-full max-w-md min-w-0"
    >
      <ReadingCover
        picks={picks}
        current={current}
        previous={selection.previous}
        reduced={reduced}
      />
      <Card.Header className="relative z-30 flex-row flex-wrap items-center justify-between gap-3">
        <p id={headingId} className={supportingText}>
          {t("title")}
        </p>
        {picks.length > 1 ? (
          <Segment
            size="sm"
            aria-labelledby={headingId}
            selectedKey={current}
            onSelectionChange={(key) => {
              const next = picks.find(({ id }) => id === key);
              if (next && next.id !== current)
                setSelection({ current: next.id, previous: current });
            }}
          >
            {picks.map(({ id }) => (
              <Segment.Item key={id} id={id} aria-controls={`${baseId}-${id}`}>
                {t(`${id}.label`)}
              </Segment.Item>
            ))}
          </Segment>
        ) : null}
      </Card.Header>
      {/* Shared rows reserve the height of the largest pane without moving the footer on selection. */}
      <div className="relative z-30 mt-auto grid min-w-0 grid-cols-1 grid-rows-[auto_auto] gap-y-4">
        {picks.map((pick, index) => (
          <ReadingPane
            key={pick.id}
            paneId={`${baseId}-${pick.id}`}
            pick={pick}
            selected={pick.id === current}
            outgoing={pick.id === selection.previous}
            direction={Math.sign(index - currentIndex)}
            reduced={reduced}
          />
        ))}
      </div>
    </Card>
  );
}
