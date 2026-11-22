"use client";

import { Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PageFrame } from "@/components/layout/page-frame";
import { MomentCard } from "@/features/moment/components/card";
import type { MomentResponse } from "@/lib/features/moment";

export function MomentDetailPage({ moment }: { moment: MomentResponse }) {
  const t = useTranslations("Moments");
  const [deleted, setDeleted] = useState(false);
  return (
    <PageFrame>
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-4">
        <Link href="/moments">
          <Icon aria-hidden="true" icon="gravity-ui:arrow-left" />
          {t("backToMoments")}
        </Link>
        {deleted ? (
          <p role="status">{t("deleted")}</p>
        ) : (
          <MomentCard moment={moment} mediaLayout="natural" onDeleted={() => setDeleted(true)} />
        )}
      </div>
    </PageFrame>
  );
}
