import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicLifeListItem } from "@/lib/features/life-list/public-life-list";

import { LifeListDetailClient } from "./life-list-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1) return { title: "Before I Die" };
  const item = await getPublicLifeListItem(parsed);
  return {
    title: item ? `${item.title} · Before I Die` : "Before I Die",
    description: item?.description ?? undefined,
  };
}

export default async function LifeListDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const parsed = Number(number);
  if (!Number.isInteger(parsed) || parsed < 1) notFound();
  const item = await getPublicLifeListItem(parsed);
  return <LifeListDetailClient number={parsed} initialItem={item} />;
}
