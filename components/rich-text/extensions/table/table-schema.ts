import { type Attribute, getStyleProperty } from "@tiptap/core";
import { TableKit } from "@tiptap/extension-table";
import { parseColor } from "react-stately/Color";

/** The browser may serialize a hex swatch as rgb() when copying or exporting HTML. */
export function normalizeCellColor(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const color = parseColor(value);
    const hex = color.toString(color.getChannelValue("alpha") === 1 ? "hex" : "hexa");
    return /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(hex) ? hex.toLowerCase() : null;
  } catch {
    return null;
  }
}

function cellStyleAttribute(
  name: string,
  property: string,
  normalize: (value: unknown) => string | null
): Attribute {
  return {
    default: null,
    parseHTML: (element) => normalize(getStyleProperty(element, property)),
    renderHTML: (attributes) => {
      const value = normalize(attributes[name]);
      return value ? { style: `${property}: ${value}` } : {};
    },
  };
}

/** Choose the higher-contrast black or white after compositing the fill over its surface. */
function contrastingInk(background: string, surface: number) {
  const alpha = background.length === 9 ? parseInt(background.slice(7), 16) / 255 : 1;
  const [red, green, blue] = [1, 3, 5].map((index) => {
    const channel = parseInt(background.slice(index, index + 2), 16) / 255;
    const composite = channel * alpha + surface * (1 - alpha);
    return composite <= 0.04045 ? composite / 12.92 : ((composite + 0.055) / 1.055) ** 2.4;
  });
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? "black" : "white";
}

export const TableSchemaKit = TableKit.extend({
  addGlobalAttributes() {
    return [
      {
        types: ["tableCell", "tableHeader"],
        attributes: {
          cellTextColor: {
            default: null,
            parseHTML: (element) => normalizeCellColor(getStyleProperty(element, "color")),
            renderHTML: (attributes) => {
              const color = normalizeCellColor(attributes.cellTextColor);
              if (color) return { style: `color: ${color}` };
              const background = normalizeCellColor(attributes.cellBackgroundColor);
              if (!background) return {};
              // Keep automatic ink distinct from authored colors when the HTML is imported again.
              return {
                style: `color: light-dark(${contrastingInk(background, 1)}, ${contrastingInk(background, 0)})`,
              };
            },
          },
          cellBackgroundColor: cellStyleAttribute(
            "cellBackgroundColor",
            "background-color",
            normalizeCellColor
          ),
          verticalAlign: cellStyleAttribute("verticalAlign", "vertical-align", (value) =>
            value === "top" || value === "middle" || value === "bottom" ? value : null
          ),
        },
      },
    ];
  },
}).configure({
  table: { renderWrapper: true, cellMinWidth: 100 },
  tableHeader: { HTMLAttributes: { class: "text-left align-top" } },
  tableCell: { HTMLAttributes: { class: "align-top" } },
});
