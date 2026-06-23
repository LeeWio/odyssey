import { Extension, type CommandProps } from "@tiptap/core";

export interface IndentOptions {
  types: string[];
  minLevel: number;
  maxLevel: number;
  step: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minLevel: 0,
      maxLevel: 10,
      step: 24, // 24px per level
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const padding = parseInt(element.style.paddingLeft, 10) || 0;
              return Math.min(
                Math.max(Math.round(padding / this.options.step), this.options.minLevel),
                this.options.maxLevel
              );
            },
            renderHTML: (attributes) => {
              if (!attributes.indent || attributes.indent <= 0) return {};
              return {
                style: `padding-left: ${attributes.indent * this.options.step}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, commands }: CommandProps) => {
          return this.options.types.some((type) => {
            if (!editor.isActive(type)) return false;
            const currentIndent = editor.getAttributes(type).indent || 0;
            if (currentIndent >= this.options.maxLevel) return false;
            return commands.updateAttributes(type, { indent: currentIndent + 1 });
          });
        },
      outdent:
        () =>
        ({ editor, commands }: CommandProps) => {
          return this.options.types.some((type) => {
            if (!editor.isActive(type)) return false;
            const currentIndent = editor.getAttributes(type).indent || 0;
            if (currentIndent <= this.options.minLevel) return false;
            return commands.updateAttributes(type, { indent: currentIndent - 1 });
          });
        },
    };
  },
});

export default Indent;
