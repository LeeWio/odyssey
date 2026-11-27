import { getSchema } from "@tiptap/core";
import { createReadingSchema } from "../extensions/reading-schema";
import { getMediaValidationIssues, parseJSONContent } from "./document-normalizer";

const schema = getSchema(createReadingSchema());

export function getArticlePublicationProblems(content: string | undefined) {
  const document = parseJSONContent(content);
  if (!document) return ["invalid-document"];
  try {
    schema.nodeFromJSON(document).check();
  } catch {
    return ["invalid-document"];
  }
  return getMediaValidationIssues(document).map(({ code }) => code);
}
