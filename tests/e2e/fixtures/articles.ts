import type { JSONContent } from "@tiptap/core";
import { RICH_TEXT_DOCUMENT_FIXTURE } from "../../../components/rich-text/testing/rich-text-document.fixture";

const code = "const result = " + '"'.repeat(80) + ";";

export const mobileArticle = {
  id: 321,
  title: "Mobile reading article",
  slug: "mobile-reading",
  summary: "A compact article used for mobile reading regression coverage.",
  contentType: "JSON",
  content: JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2, id: "chapter-one", "data-toc-id": "chapter-one" },
        content: [{ type: "text", text: "Chapter one" }],
      },
      { type: "paragraph", content: [{ type: "text", text: "Opening paragraph." }] },
      {
        type: "codeBlock",
        attrs: { language: "typescript" },
        content: [{ type: "text", text: code }],
      },
      {
        type: "image",
        attrs: {
          src: "/favicon.svg",
          alt: "Reading detail",
          caption: "A reading detail",
          widthPercent: 100,
          alignment: "center",
        },
      },
    ],
  }),
  status: "PUBLISHED",
  isFeatured: false,
  views: 12,
  likesCount: 2,
  favoritesCount: 1,
  isLiked: false,
  isFavorited: false,
  authorName: "Odyssey",
  authorAvatar: "",
  category: null,
  series: null,
  seriesOrder: null,
  tags: [],
  publishedAt: "2026-09-20T00:00:00Z",
  createdAt: "2026-09-20T00:00:00Z",
  updatedAt: "2026-09-20T00:00:00Z",
  navigation: null,
};

export const collectionArticle = {
  id: 123,
  slug: "collection-test",
  title: "Collection test article",
  contentType: "JSON",
  content: JSON.stringify({
    type: "doc",
    content: Array.from({ length: 30 }, (_, i) => ({
      type: "paragraph",
      content: [{ type: "text", text: `Paragraph ${i + 1}. Notes for the reading collection.` }],
    })),
  }),
  status: "PUBLISHED",
  isFeatured: false,
  views: 0,
  likesCount: 0,
  favoritesCount: 0,
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: "2026-09-20T00:00:00Z",
  updatedAt: "2026-09-20T00:00:00Z",
};

export const readingListArticle = {
  id: 123,
  slug: "reading-loop",
  title: "Reading loop article",
  contentType: "JSON",
  content: JSON.stringify({
    type: "doc",
    content: Array.from({ length: 30 }, (_, index) => ({
      type: "paragraph",
      content: [
        { type: "text", text: `Paragraph ${index + 1}. A note for the later-reading action.` },
      ],
    })),
  }),
  status: "PUBLISHED",
  isFeatured: false,
  views: 0,
  likesCount: 0,
  favoritesCount: 0,
  isInReadingList: false,
  category: null,
  series: null,
  seriesOrder: null,
  createdAt: "2026-09-20T00:00:00Z",
  updatedAt: "2026-09-20T00:00:00Z",
};

export const designArticle = {
  id: 804,
  slug: "design-foundation",
  title: "A consistent space for reading and exploring",
  summary: "An article for checking the shared reading layout.",
  contentType: "JSON",
  content: JSON.stringify({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Reading rhythm" }] },
      ...Array.from({ length: 12 }, () => ({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Content comes first. Shared spacing and typography keep the reading experience predictable across screen sizes and themes.",
          },
        ],
      })),
    ],
  }),
  status: "PUBLISHED",
  isFeatured: true,
  views: 12,
  likesCount: 0,
  favoritesCount: 0,
  authorName: "Odyssey",
  category: null,
  series: null,
  seriesOrder: null,
  tags: [],
  publishedAt: "2026-10-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

const paragraphs = Array.from({ length: 80 }, (_, index) => ({
  type: "paragraph",
  content: [{ type: "text", text: `Paragraph ${index + 1}. Read once, reveal once.` }],
}));

export const resumeArticle = {
  ...designArticle,
  id: 805,
  slug: "resume-reading",
  title: "A guide to focused reading",
  content: JSON.stringify({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2, id: "chapter-one", "data-toc-id": "chapter-one" },
        content: [{ type: "text", text: "Chapter one" }],
      },
      ...paragraphs.slice(0, 25),
      {
        type: "heading",
        attrs: { level: 2, id: "chapter-two", "data-toc-id": "chapter-two" },
        content: [{ type: "text", text: "Chapter two" }],
      },
      ...paragraphs.slice(25, 50),
    ],
  }),
};

function entranceArticle(slug: string, content: JSONContent[]) {
  return {
    ...designArticle,
    id: 987654,
    slug,
    title: "Reader entrance regression",
    content: JSON.stringify({ type: "doc", content }),
    isFeatured: false,
  };
}

const nestedBlocks =
  RICH_TEXT_DOCUMENT_FIXTURE.content?.filter((node) =>
    ["bulletList", "taskList", "table", "columns", "details", "image"].includes(node.type ?? "")
  ) ?? [];

const fixtures = [
  mobileArticle,
  collectionArticle,
  readingListArticle,
  designArticle,
  resumeArticle,
  entranceArticle("entrance-regression", paragraphs),
  entranceArticle("entrance-nested", [...paragraphs, ...nestedBlocks, ...paragraphs]),
  entranceArticle("entrance-tall", [
    ...paragraphs,
    {
      type: "codeBlock",
      content: [{ type: "text", text: "A very long code block\n".repeat(1500) }],
    },
  ]),
  entranceArticle("entrance-copy", [
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [{ type: "text", text: "const answer = 42;" }],
    },
  ]),
];

export const articles = new Map(fixtures.map((fixture) => [fixture.slug, fixture]));
