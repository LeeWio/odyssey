import { notFound } from "next/navigation";

import ArticleCardTestClient from "./article-card-test-client";

export default function ArticleCardTestPage() {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.ENABLE_ARTICLE_CARD_TEST_ROUTE !== "1"
  ) {
    notFound();
  }

  return <ArticleCardTestClient />;
}
