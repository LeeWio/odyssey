"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import albumImage from "@/public/ChatGPT Image Jul 15, 2026, 11_56_34 PM.png";
import mountainImage from "@/public/ChatGPT Image Jul 15, 2026, 11_55_41 PM.png";
import { OffMapGlobe } from "@/components/home/off-map-globe";

type EditorialPanelProps = {
  reducedMotion: boolean;
};

const displayFont = { fontFamily: "var(--font-display)" } as const;
const monoFont = { fontFamily: "var(--font-mono)" } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;

const paperTexture = {
  backgroundImage:
    "radial-gradient(circle at 14% 24%, rgba(62,48,31,.045) 0 1px, transparent 1.4px), radial-gradient(circle at 76% 68%, rgba(62,48,31,.035) 0 1px, transparent 1.3px), linear-gradient(110deg, rgba(255,255,255,.38), transparent 42%, rgba(71,55,36,.04))",
  backgroundSize: "19px 19px, 27px 27px, 100% 100%",
} as const;

const reveal = (reducedMotion: boolean, delay = 0, distance = 24) => ({
  initial: reducedMotion ? false : { opacity: 0, y: distance },
  whileInView: reducedMotion ? undefined : { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.35 },
  transition: { duration: 0.72, delay, ease: easeOut },
});

const chronicleEntries = [
  {
    date: "07.12",
    title: "Symbiosis: The Resilience of Outposts",
    meta: "Systems · 5 min",
  },
  {
    date: "06.28",
    title: "A quieter kind of interface",
    meta: "Notes · 4 min",
  },
  {
    date: "06.11",
    title: "What the build remembers",
    meta: "Engineering · 7 min",
  },
] as const;

export function ChroniclePanel({ reducedMotion }: EditorialPanelProps) {
  return (
    <section
      id="chronicle"
      aria-labelledby="chronicle-title"
      className="relative min-h-[100dvh] w-screen shrink-0 overflow-y-auto bg-[#e9e4d9] pt-16 text-[#20211e] lg:h-full lg:min-h-0 lg:overflow-hidden"
      style={paperTexture}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-16 h-px bg-black/10"
      />

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-[1600px] gap-10 px-6 py-10 sm:px-10 lg:h-[calc(100%-4rem)] lg:min-h-0 lg:grid-cols-[0.85fr_1.05fr_1.2fr] lg:items-center lg:gap-14 lg:px-16 lg:py-8 xl:px-20">
        <motion.header {...reveal(reducedMotion, 0.04)} className="self-center">
          <p className="text-[11px] text-[#a2431b]" style={monoFont}>
            Chronicle
          </p>
          <h2
            id="chronicle-title"
            className="mt-5 max-w-[8ch] text-[clamp(3.6rem,5.7vw,6.7rem)] leading-[0.88] tracking-[-0.055em]"
            style={displayFont}
          >
            Follow the thread.
          </h2>
          <p className="mt-7 max-w-sm text-[15px] leading-7 text-[#55564f]">
            Essays, field notes, and decisions connected by the questions that kept returning.
          </p>
          <Link
            href="/test/blog"
            className="mt-8 inline-flex items-center gap-2 border-b border-[#20211e]/55 pb-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a2431b]"
          >
            Read the chronicle
            <Icon aria-hidden="true" icon="ph:arrow-up-right" className="size-4" />
          </Link>
        </motion.header>

        <motion.div
          {...reveal(reducedMotion, 0.12)}
          className="relative border-l border-[#383831]/22 pl-7 lg:pl-9"
        >
          {chronicleEntries.map((entry, index) => (
            <Link
              key={entry.title}
              href="/test/blog"
              className="group relative block py-6 first:pt-1 last:pb-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a2431b]"
            >
              <span
                aria-hidden="true"
                className={`absolute top-[1.9rem] -left-[2.05rem] size-2.5 rounded-full border-2 border-[#e9e4d9] lg:-left-[2.58rem] ${
                  index === 0 ? "bg-[#a2431b]" : "bg-[#7d7b72]"
                }`}
              />
              <span className="text-[10px] text-[#77766f]" style={monoFont}>
                {entry.date}
              </span>
              <h3
                className="mt-2 max-w-[22rem] text-[clamp(1.35rem,2vw,2.1rem)] leading-[1.08] tracking-[-0.025em] group-hover:text-[#a2431b]"
                style={displayFont}
              >
                {entry.title}
              </h3>
              <span className="mt-3 block text-xs text-[#686861]">{entry.meta}</span>
            </Link>
          ))}
        </motion.div>

        <motion.div {...reveal(reducedMotion, 0.2, 30)} className="relative min-h-[32rem]">
          <figure className="absolute top-[4%] right-[2%] left-[4%] aspect-[1.28] rotate-[2deg] border-[10px] border-[#f3eee4] bg-[#c8c0b2] shadow-[0_24px_50px_rgba(57,43,28,.22)]">
            <Image
              fill
              priority={false}
              alt="A monumental dark stone outpost beneath a stormy sky"
              className="object-cover contrast-[.92] saturate-[.65]"
              sizes="(max-width: 1023px) 90vw, 34vw"
              src="/IMG_2232.JPG"
            />
          </figure>
          <aside
            className="absolute right-[3%] bottom-[4%] w-[68%] -rotate-[2deg] bg-[#f4efe5] px-7 py-6 drop-shadow-[0_18px_24px_rgba(55,43,30,.2)]"
            style={{
              clipPath:
                "polygon(0 2%, 9% 0, 20% 2%, 33% 0, 48% 2%, 61% 0, 76% 2%, 89% 0, 100% 2%, 99% 97%, 84% 99%, 67% 97%, 51% 100%, 34% 97%, 16% 99%, 0 96%)",
            }}
          >
            <p className="text-[10px] tracking-[0.12em] text-[#a2431b]" style={monoFont}>
              Margin note
            </p>
            <p
              className="mt-4 text-[clamp(1.35rem,2.2vw,2.2rem)] leading-[1.08] italic"
              style={displayFont}
            >
              Resilience is usually a relationship, not a material.
            </p>
          </aside>
        </motion.div>
      </div>
    </section>
  );
}

export function NotebookPanel({ reducedMotion }: EditorialPanelProps) {
  return (
    <section
      id="daily"
      aria-labelledby="notebook-title"
      className="relative min-h-[100dvh] w-screen shrink-0 overflow-y-auto bg-[#dcd5c7] pt-16 text-[#20211e] lg:h-full lg:min-h-0 lg:overflow-hidden"
      style={paperTexture}
    >
      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-[1600px] gap-8 px-6 py-10 sm:px-10 lg:h-[calc(100%-4rem)] lg:min-h-0 lg:grid-cols-[0.7fr_1.7fr] lg:items-center lg:gap-12 lg:px-16 lg:py-8 xl:px-20">
        <motion.header {...reveal(reducedMotion, 0.04)}>
          <p className="text-[11px] text-[#315d88]" style={monoFont}>
            Open notebook
          </p>
          <h2
            id="notebook-title"
            className="mt-5 max-w-[7ch] text-[clamp(3.5rem,5.5vw,6.4rem)] leading-[0.89] tracking-[-0.055em]"
            style={displayFont}
          >
            The hours leave marks.
          </h2>
          <p className="mt-7 max-w-sm text-[15px] leading-7 text-[#55564f]">
            Listening, markets, movement, and code—kept as working notes rather than polished
            outcomes.
          </p>
          <Link
            href="/test/oracle"
            className="mt-8 inline-flex items-center gap-2 border-b border-[#20211e]/55 pb-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315d88]"
          >
            Open the daily oracle
            <Icon aria-hidden="true" icon="ph:arrow-up-right" className="size-4" />
          </Link>
        </motion.header>

        <motion.div
          {...reveal(reducedMotion, 0.13, 32)}
          className="relative grid min-h-[38rem] grid-cols-1 overflow-hidden shadow-[0_30px_70px_rgba(63,48,31,.2)] md:grid-cols-2"
        >
          <article className="relative bg-[#f1ecdf] px-7 py-7 md:border-r md:border-[#5c574d]/14 lg:px-9 lg:py-8">
            <span
              aria-hidden="true"
              className="absolute inset-0 [background-image:repeating-linear-gradient(0deg,transparent_0_27px,rgba(58,74,82,.09)_27px_28px)] opacity-45"
            />
            <div className="relative">
              <p className="text-[10px] text-[#77746d]" style={monoFont}>
                Wednesday / 07.16
              </p>
              <div className="mt-7 grid grid-cols-[7rem_1fr] gap-5">
                <figure className="relative aspect-square overflow-hidden bg-[#172a40] shadow-[0_12px_24px_rgba(33,39,48,.22)]">
                  <Image
                    fill
                    alt="Deep-blue re:member album artwork"
                    className="object-cover"
                    placeholder="blur"
                    sizes="112px"
                    src={albumImage}
                  />
                </figure>
                <div>
                  <p className="text-xs text-[#315d88]" style={monoFont}>
                    Listening
                  </p>
                  <h3 className="mt-2 text-2xl leading-none" style={displayFont}>
                    re:member
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#66645d]">Ólafur Arnalds · 46 min</p>
                  <Link
                    href="/test/music"
                    className="mt-4 inline-flex items-center gap-1 text-xs text-[#315d88] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#315d88]"
                  >
                    Enter listening room
                    <Icon aria-hidden="true" icon="ph:arrow-right" className="size-3" />
                  </Link>
                </div>
              </div>

              <div className="mt-10 border-t border-[#514e47]/24 pt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[#315d88]" style={monoFont}>
                      Market note
                    </p>
                    <h3 className="mt-2 text-2xl" style={displayFont}>
                      Patience is a position.
                    </h3>
                  </div>
                  <p className="text-right font-mono text-xl font-semibold text-[#315d88] tabular-nums">
                    193.42
                    <span className="block text-[10px] font-normal">AAPL · +0.67%</span>
                  </p>
                </div>
                <p className="mt-4 max-w-md text-sm leading-6 text-[#5e5c55]">
                  No new action. The useful work was deciding not to move.
                </p>
              </div>
            </div>
          </article>

          <article className="relative bg-[#ece5d8] px-7 py-7 lg:px-9 lg:py-8">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 hidden w-8 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(62,48,31,.12),transparent)] md:block"
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-[#a2431b]" style={monoFont}>
                    Movement
                  </p>
                  <h3 className="mt-2 text-3xl leading-none" style={displayFont}>
                    Five steady days.
                  </h3>
                </div>
                <p className="font-mono text-4xl text-[#a2431b] tabular-nums">05</p>
              </div>
              <div
                className="mt-6 grid grid-cols-7 gap-2"
                aria-label="Five of seven movement days completed"
              >
                {[true, true, true, true, true, false, false].map((done, index) => (
                  <span
                    key={index}
                    className={`grid aspect-square place-items-center rounded-full text-[10px] ${
                      done ? "bg-[#a2431b] text-white" : "border border-[#5e5a51]/25 text-[#77746d]"
                    }`}
                  >
                    {"MTWTFSS"[index]}
                  </span>
                ))}
              </div>

              <div className="mt-9 bg-[#161a1b] p-5 text-[#d9ddd9] shadow-[0_16px_28px_rgba(29,28,25,.2)]">
                <div
                  className="flex items-center justify-between text-[10px] text-white/50"
                  style={monoFont}
                >
                  <span>BUILD LOG</span>
                  <span>00:42ms</span>
                </div>
                <pre className="mt-5 overflow-hidden font-mono text-[11px] leading-5 text-[#aab2ad]">
                  <code>{`function stay() {\n  observe();\n  make();\n  question();\n  return again;\n}`}</code>
                </pre>
                <p className="mt-5 text-xs text-[#d6a26f]">✓ compile successful · 165 modules</p>
              </div>

              <p
                className="mt-7 max-w-md text-[1.35rem] leading-[1.12] text-[#555149] italic"
                style={displayFont}
              >
                Keep the rough edges long enough to learn what they are for.
              </p>
            </div>
          </article>
        </motion.div>
      </div>
    </section>
  );
}

const placeEntries = [
  ["Iceland", "64°08′ N", "Weather as architecture"],
  ["Leyndell", "2024", "A city remembered through play"],
  ["Flying Isles", "2025", "Distance without departure"],
] as const;

export function TraveloguePanel({ reducedMotion }: EditorialPanelProps) {
  return (
    <section
      id="travelogue"
      aria-labelledby="travelogue-title"
      className="relative min-h-[100dvh] w-screen shrink-0 overflow-y-auto bg-[#e7e1d5] pt-16 text-[#20211e] lg:h-full lg:min-h-0 lg:overflow-hidden"
      style={paperTexture}
    >
      <div className="relative mx-auto min-h-[calc(100dvh-4rem)] w-full max-w-[1600px] px-6 py-10 sm:px-10 lg:h-[calc(100%-4rem)] lg:min-h-0 lg:px-16 lg:py-8 xl:px-20">
        <motion.header
          {...reveal(reducedMotion, 0.04)}
          className="relative z-20 max-w-[34rem] lg:pt-[7vh] [@media(min-width:1024px)_and_(max-height:800px)]:pt-[2vh]"
        >
          <p className="text-[11px] text-[#67516e]" style={monoFont}>
            Go off-map
          </p>
          <h2
            id="travelogue-title"
            className="mt-5 max-w-[8ch] text-[clamp(3.7rem,5.8vw,6.8rem)] leading-[0.88] tracking-[-0.055em] [@media(min-width:1024px)_and_(max-height:800px)]:mt-3 [@media(min-width:1024px)_and_(max-height:800px)]:text-[clamp(3.5rem,5.2vw,4.8rem)]"
            style={displayFont}
          >
            Some places keep moving.
          </h2>
          <p className="mt-7 max-w-sm text-[15px] leading-7 text-[#55564f] [@media(min-width:1024px)_and_(max-height:800px)]:mt-4 [@media(min-width:1024px)_and_(max-height:800px)]:leading-6">
            Physical journeys, imagined worlds, and coordinates that changed how distance feels.
          </p>
        </motion.header>

        <motion.div
          {...reveal(reducedMotion, 0.12, 30)}
          className="absolute inset-y-0 right-0 left-[28%] hidden lg:block"
        >
          <OffMapGlobe variant="panel" />
        </motion.div>

        <motion.figure
          {...reveal(reducedMotion, 0.18, 34)}
          className="relative z-20 mt-10 aspect-[1.45] w-[78%] rotate-[-3deg] border-[9px] border-[#f1ece2] shadow-[0_18px_38px_rgba(59,45,31,.2)] sm:w-[62%] lg:absolute lg:right-[5%] lg:bottom-[7%] lg:mt-0 lg:w-[27%]"
        >
          <Image
            fill
            alt="Two riders crossing bright floating islands on dragons"
            className="object-cover saturate-[.78]"
            sizes="(max-width: 1023px) 65vw, 27vw"
            src="/IMG_4954.JPG"
          />
        </motion.figure>

        <motion.figure
          {...reveal(reducedMotion, 0.22, 28)}
          className="relative z-10 -mt-5 ml-auto aspect-[1.35] w-[72%] rotate-[4deg] border-[9px] border-[#eee8dd] shadow-[0_18px_38px_rgba(59,45,31,.18)] sm:w-[55%] lg:absolute lg:right-[29%] lg:bottom-[4%] lg:mt-0 lg:w-[24%]"
        >
          <Image
            fill
            alt="Clouds rolling over dark mountains beside still water"
            className="object-cover saturate-[.7]"
            placeholder="blur"
            sizes="(max-width: 1023px) 60vw, 24vw"
            src={mountainImage}
          />
        </motion.figure>

        <motion.div
          {...reveal(reducedMotion, 0.16)}
          className="relative z-20 mt-14 max-w-md lg:absolute lg:bottom-[7%] lg:left-20 lg:mt-0 xl:left-24 [@media(min-width:1024px)_and_(max-height:800px)]:bottom-[4%] [@media(min-width:1024px)_and_(max-height:800px)]:max-w-[22rem]"
        >
          {placeEntries.map(([place, when, note]) => (
            <div
              key={place}
              className="grid grid-cols-[5rem_1fr] gap-5 border-t border-[#494840]/20 py-3.5 last:border-b [@media(min-width:1024px)_and_(max-height:800px)]:py-2.5"
            >
              <span className="text-[10px] text-[#67516e]" style={monoFont}>
                {when}
              </span>
              <div>
                <h3 className="text-lg leading-none" style={displayFont}>
                  {place}
                </h3>
                <p className="mt-1 text-xs text-[#68665f]">{note}</p>
              </div>
            </div>
          ))}
          <Link
            href="/test/portfolio"
            className="mt-6 inline-flex items-center gap-2 border-b border-[#20211e]/55 pb-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#67516e] [@media(min-width:1024px)_and_(max-height:800px)]:mt-4"
          >
            Open the field archive
            <Icon aria-hidden="true" icon="ph:arrow-up-right" className="size-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

const archiveItems = [
  {
    href: "/test/blog",
    label: "Read",
    title: "Chronicle",
    copy: "Essays and notes with enough time to become useful.",
    image: "/IMG_2232.JPG",
    alt: "A monumental stone city under a stormy sky",
  },
  {
    href: "/test/music",
    label: "Listen",
    title: "Listening room",
    copy: "Albums and ambient loops kept close to the work.",
    image: albumImage,
    alt: "Deep-blue re:member album artwork",
  },
  {
    href: "/test/portfolio",
    label: "Wander",
    title: "Field archive",
    copy: "Real and imagined places collected without hierarchy.",
    image: mountainImage,
    alt: "Dark mountains disappearing into low cloud",
  },
] as const;

export function ArchiveSection({ reducedMotion }: EditorialPanelProps) {
  return (
    <section
      id="archive"
      aria-labelledby="archive-title"
      className="relative bg-[#eee9df] px-6 py-24 text-[#20211e] sm:px-10 lg:px-16 lg:py-32 xl:px-20"
      style={paperTexture}
    >
      <div className="mx-auto max-w-[1480px]">
        <motion.div
          {...reveal(reducedMotion, 0)}
          className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end"
        >
          <h2
            id="archive-title"
            className="max-w-[9ch] text-[clamp(4rem,7.5vw,8.5rem)] leading-[0.86] tracking-[-0.06em]"
            style={displayFont}
          >
            Nothing here is finished.
          </h2>
          <p className="max-w-md pb-2 text-base leading-7 text-[#5b5a54] lg:justify-self-end">
            The archive is a working memory: revised, rearranged, and occasionally contradicted by
            what comes next.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.35fr_.65fr] lg:grid-rows-[22rem_22rem]">
          {archiveItems.map((item, index) => (
            <motion.div
              key={item.title}
              {...reveal(reducedMotion, 0.08 + index * 0.07, 30)}
              className={index === 0 ? "lg:row-span-2" : ""}
            >
              <Link
                href={item.href}
                className="group relative block h-full min-h-[20rem] overflow-hidden bg-[#242521] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a2431b] lg:min-h-full"
              >
                <Image
                  fill
                  alt={item.alt}
                  className="object-cover opacity-80 transition duration-700 group-hover:scale-[1.025] group-hover:opacity-92"
                  placeholder={typeof item.image === "string" ? "empty" : "blur"}
                  sizes={
                    index === 0
                      ? "(max-width: 1023px) 100vw, 58vw"
                      : "(max-width: 1023px) 100vw, 34vw"
                  }
                  src={item.image}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent"
                />
                <span className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <span className="text-[10px] text-white/65" style={monoFont}>
                    {item.label}
                  </span>
                  <span className="mt-2 flex items-end justify-between gap-5">
                    <span>
                      <span
                        className="block text-[clamp(2rem,4vw,4.5rem)] leading-none tracking-[-0.04em]"
                        style={displayFont}
                      >
                        {item.title}
                      </span>
                      <span className="mt-3 block max-w-md text-sm leading-6 text-white/70">
                        {item.copy}
                      </span>
                    </span>
                    <Icon
                      aria-hidden="true"
                      icon="ph:arrow-up-right"
                      className="size-6 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
