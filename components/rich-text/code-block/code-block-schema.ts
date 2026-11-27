import { Node, type JSONContent } from "@tiptap/core";
import { readCodeBlockChrome } from "./code-block-chrome";
import { readCodeBlockFrame } from "./code-block-frame";
import { EMPTY_SNIPPET, readCodeSnippets } from "./code-snippets";

export const HIGHLIGHTED_CODE_BLOCK = "highlightedCodeBlock";
const BLOCK_ATTRIBUTE = "data-highlighted-code-block";
const CHROME_ATTRIBUTE = "data-chrome";
const FRAME_ATTRIBUTE = "data-frame";
const LINE_NUMBERS_ATTRIBUTE = "data-show-line-numbers";

// Numeric newlines keep a multiline snippet inside a single Markdown HTML block.
const escapeMarkup = (text: string) =>
  text.replace(
    /[&<>"\r\n]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "\r": "&#13;",
        "\n": "&#10;",
      })[character]!
  );

export const HighlightedCodeBlockSchema = Node.create({
  name: HIGHLIGHTED_CODE_BLOCK,
  group: "block",
  atom: true,

  addAttributes() {
    return {
      chrome: {
        default: "segment",
        rendered: false,
      },
      frame: {
        default: "inset",
        rendered: false,
        parseHTML: (element) => readCodeBlockFrame(element.getAttribute(FRAME_ATTRIBUTE)),
      },
      showLineNumbers: {
        default: true,
        rendered: false,
        parseHTML: (element) => element.getAttribute(LINE_NUMBERS_ATTRIBUTE) !== "false",
      },
      snippets: {
        default: [EMPTY_SNIPPET],
        rendered: false,
      },
    };
  },

  parseHTML: () => [
    {
      tag: `div[${BLOCK_ATTRIBUTE}]`,
      getAttrs: (element) => {
        const snippets = readCodeSnippets(
          Array.from(element.children).flatMap((pre) => {
            const code = pre.firstElementChild;
            return pre.tagName === "PRE" && code?.tagName === "CODE"
              ? [
                  {
                    name: pre.getAttribute("data-name"),
                    language: pre.getAttribute("data-language"),
                    code: code.textContent ?? "",
                  },
                ]
              : [];
          })
        );
        return {
          snippets,
          chrome: readCodeBlockChrome(element.getAttribute(CHROME_ATTRIBUTE), snippets.length),
        };
      },
    },
  ],

  renderHTML({ node }) {
    const snippets = readCodeSnippets(node.attrs.snippets);
    const chrome = readCodeBlockChrome(node.attrs.chrome, snippets.length);
    return [
      "div",
      {
        [BLOCK_ATTRIBUTE]: "",
        [CHROME_ATTRIBUTE]: chrome === "segment" ? null : chrome,
        [FRAME_ATTRIBUTE]: readCodeBlockFrame(node.attrs.frame) === "solid" ? "solid" : null,
        [LINE_NUMBERS_ATTRIBUTE]: node.attrs.showLineNumbers === false ? "false" : null,
      },
      ...snippets.map(
        ({ name, language, code }) =>
          ["pre", { "data-name": name ?? null, "data-language": language }, ["code", code]] as const
      ),
    ];
  },

  renderText: ({ node }) =>
    readCodeSnippets(node.attrs.snippets)
      .map(({ code }) => code)
      .join("\n\n"),

  renderMarkdown(node: JSONContent) {
    const snippets = readCodeSnippets(node.attrs?.snippets);
    const chrome = readCodeBlockChrome(node.attrs?.chrome, snippets.length);
    const chromeAttribute = chrome === "segment" ? "" : ` ${CHROME_ATTRIBUTE}="${chrome}"`;
    const frameAttribute =
      readCodeBlockFrame(node.attrs?.frame) === "solid" ? ` ${FRAME_ATTRIBUTE}="solid"` : "";
    const markup = snippets.map(({ name, language, code }) => {
      const nameAttribute = name ? ` data-name="${escapeMarkup(name)}"` : "";
      const languageAttribute = language ? ` data-language="${escapeMarkup(language)}"` : "";
      return `<pre${nameAttribute}${languageAttribute}><code>${escapeMarkup(code)}</code></pre>`;
    });
    const lineNumbers =
      node.attrs?.showLineNumbers === false ? ` ${LINE_NUMBERS_ATTRIBUTE}="false"` : "";
    return `<div ${BLOCK_ATTRIBUTE}=""${chromeAttribute}${frameAttribute}${lineNumbers}>${markup.join("")}</div>`;
  },
});
