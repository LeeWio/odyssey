import { getSchema } from "@tiptap/core";
import type { PostRequest } from "@/lib/features/post";
import { createReadingSchema } from "../extensions/reading-schema";
import { getMediaValidationIssues, parseJSONContent } from "./document-normalizer";

const schema = getSchema(createReadingSchema());

export function getArticlePublicationProblems(
  data: Pick<Partial<PostRequest>, "content" | "translations">
) {
  const documents = [
    { locale: "zh", content: data.content },
    ...Object.entries(data.translations ?? {})
      .filter(([locale, translation]) => locale !== "zh" && translation.content?.trim())
      .map(([locale, translation]) => ({ locale, content: translation.content })),
  ];

  return documents.flatMap(({ locale, content }) => {
    const document = parseJSONContent(content);
    if (!document) return [{ locale, code: "invalid-document" }];
    try {
      schema.nodeFromJSON(document).check();
    } catch {
      return [{ locale, code: "invalid-document" }];
    }
    return getMediaValidationIssues(document).map(({ code }) => ({ locale, code }));
  });
}
