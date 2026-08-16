import { notFound } from "next/navigation";
import RichTextTestClient from "./rich-text-test-client";

export default function RichTextTestPage() {
  if (process.env.ENABLE_RICH_TEXT_TEST_ROUTE !== "1") notFound();

  return <RichTextTestClient />;
}
