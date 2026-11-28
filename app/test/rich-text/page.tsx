import { notFound } from "next/navigation";
import RichTextTestClient from "./rich-text-test-client";

export default async function RichTextTestPage({
  searchParams,
}: {
  searchParams: Promise<{
    table?: string;
    multiple?: string;
    typography?: string;
    outline?: string;
    modal?: string;
    postId?: string;
    preview?: string;
  }>;
}) {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_RICH_TEXT_TEST_ROUTE !== "1") {
    notFound();
  }

  const params = await searchParams;
  return (
    <RichTextTestClient
      table={params.table === "1"}
      multiple={params.multiple === "1"}
      typography={params.typography === "1"}
      outline={params.outline === "1"}
      modal={params.modal === "1"}
      highlightedCode={params.preview === "highlighted-code"}
      postId={
        params.postId === "new"
          ? "new"
          : params.postId && /^\d+$/.test(params.postId)
            ? params.postId
            : undefined
      }
    />
  );
}
