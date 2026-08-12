import { ColumnDetail } from "@/features/column";

export default async function ColumnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ColumnDetail slug={slug} />;
}
