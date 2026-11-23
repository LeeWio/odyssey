"use client";

import { Link, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { PageFrame } from "@/components/layout/page-frame";
import type { MomentResponse } from "@/lib/features/moment";
import { MomentCard } from "../components/card";

export function MomentEntry({ moment }: { moment: MomentResponse }) {
  const t = useTranslations("Moments");
  const router = useRouter();

  return (
    <PageFrame className="bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col items-start gap-2">
          <Link className="text-sm no-underline" href="/moments">
            {t("backToMoments")}
          </Link>
          <Typography type="h1" weight="semibold">
            {t("entryTitle")}
          </Typography>
        </header>
        <article id={`moment-${moment.id}`}>
          <MomentCard
            moment={moment}
            mediaLayout="natural"
            onDeleted={() => router.replace("/moments")}
          />
        </article>
      </div>
    </PageFrame>
  );
}
