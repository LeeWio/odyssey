import { notFound } from "next/navigation";
import RichTextTestClient from "./rich-text-test-client";

export default async function RichTextTestPage({
  searchParams,
}: {
  searchParams: Promise<{ typography?: string; outline?: string }>;
}) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_RICH_TEXT_TEST_ROUTE !== "1") {
    notFound();
  }

  const params = await searchParams;
  return (
    <RichTextTestClient typography={params.typography === "1"} outline={params.outline === "1"} />
  );
}
