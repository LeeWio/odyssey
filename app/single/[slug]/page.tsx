"use client";

import { use } from "react";
import { Surface } from "@heroui/react";
import { ArticleSidebar } from "./article-sidebar";

interface SinglePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function SinglePage({ params }: SinglePageProps) {
  const { slug } = use(params);

  return (
    <Surface
      variant="transparent"
      className="grid min-h-screen w-full grid-cols-1 gap-8 px-4 py-6 md:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)_280px] xl:gap-10 2xl:grid-cols-[320px_minmax(0,1fr)_320px] 2xl:px-12"
    >
      <ArticleSidebar slug={slug} />

      <article className="min-w-0">
        <header className="border-b border-neutral-800 pb-5">
          <div className="h-12 w-2/3 bg-neutral-900" />

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 rounded-full bg-neutral-800" />

              <div className="space-y-2">
                <div className="h-3 w-52 bg-neutral-800" />
                <div className="h-3 w-40 bg-neutral-900" />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-5 w-14 bg-neutral-900" />
              <div className="h-5 w-14 bg-neutral-900" />
              <div className="h-5 w-14 bg-neutral-900" />
            </div>
          </div>
        </header>

        <nav className="grid grid-cols-1 border-b border-neutral-800 sm:grid-cols-2">
          <div className="flex h-14 items-center border-neutral-800 sm:border-r">
            <div className="h-3 w-3/4 bg-neutral-900" />
          </div>

          <div className="flex h-14 items-center justify-end">
            <div className="h-3 w-2/3 bg-neutral-900" />
          </div>
        </nav>

        <section className="mt-8">
          <div className="aspect-video w-full bg-neutral-900" />
        </section>

        <section className="mx-auto max-w-[760px] py-12">
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-4 w-full bg-neutral-900" />
                <div className="h-4 w-full bg-neutral-900" />
                <div className="h-4 w-5/6 bg-neutral-900" />
              </div>
            ))}
          </div>

          <div className="my-12 h-px bg-neutral-800" />

          <div className="space-y-4">
            <div className="h-8 w-1/2 bg-neutral-900" />
            <div className="h-4 w-full bg-neutral-900" />
            <div className="h-4 w-4/5 bg-neutral-900" />
          </div>
        </section>

        <span className="sr-only">Current article: {slug}</span>
      </article>

      <aside className="hidden min-w-0 xl:block">
        <div className="sticky top-6 space-y-10">
          <section>
            <div className="mb-5 h-12 border-l-4 border-neutral-700 bg-neutral-900/30" />

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-3 w-24 shrink-0 bg-neutral-900" />
                  <div className="h-px min-w-0 flex-1 border-t border-dashed border-neutral-800" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5 h-12 border-l-4 border-neutral-700 bg-neutral-900/30" />

            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 2xl:grid-cols-[110px_minmax(0,1fr)]"
                >
                  <div className="aspect-[16/10] rounded-md bg-neutral-900" />

                  <div className="min-w-0 space-y-3">
                    <div className="h-3 w-full bg-neutral-800" />
                    <div className="h-3 w-3/4 bg-neutral-900" />

                    <div className="flex justify-between gap-3">
                      <div className="h-2 w-10 bg-neutral-900" />
                      <div className="h-2 w-16 bg-neutral-900" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </Surface>
  );
}
