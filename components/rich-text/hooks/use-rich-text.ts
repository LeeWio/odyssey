import { useEditor } from "@tiptap/react";
import { ExtensionKit } from "../extensions/extension-kit";

export function useRichText() {
  const editor = useEditor({
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: {
            level: 2,
          },
          content: [
            {
              type: "text",
              text: "Controlled JSON value",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "This demo keeps the editor document in React state. The buttons above replace the ",
            },
            {
              type: "text",
              marks: [
                {
                  type: "code",
                },
              ],
              text: "value",
            },
            {
              type: "text",
              text: " prop, and the JSON preview below updates after every edit.",
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Edit this paragraph and watch the JSON mirror change.",
                    },
                  ],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "The footer reads ",
                    },
                    {
                      type: "text",
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "character",
                    },
                    {
                      type: "text",
                      text: " and ",
                    },
                    {
                      type: "text",
                      marks: [
                        {
                          type: "italic",
                        },
                      ],
                      text: "word",
                    },
                    {
                      type: "text",
                      text: " counts from Tiptap storage.",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Controlled mode should feel editable, not fragile: external updates only replace content when the incoming JSON differs.",
                },
              ],
            },
          ],
        },
        {
          type: "paragraph",
        },
      ],
    },
    /**
     * Whether to render the editor on the first render.
     * If client-side rendering, set this to `true`.
     * If server-side rendering, set this to `false`.
     * @default true
     */
    immediatelyRender: true,
    /**
     * Whether to re-render the editor on each transaction.
     * This is legacy behavior that will be removed in future versions.
     * @default false
     */
    shouldRerenderOnTransaction: false,
    /**
     * The extensions to use
     */
    extensions: [...ExtensionKit],
    /**
     * The editor's props
     */
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
      },
    },
  });

  return editor;
}
