import { Button, ButtonGroup, Tooltip } from "@heroui/react";
import { RichTextEditor, useRichTextEditor, useRichTextEditorState } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { Link as LinkExtension } from "@/components/rich-text/extensions";

interface LinkMenuPreviewProps {
  onEdit: () => void;
}

export const LinkMenuPreview: React.FC<LinkMenuPreviewProps> = ({ onEdit }) => {
  const { editor } = useRichTextEditor();

  const linkAttributes = useRichTextEditorState((state) =>
    state.editor.getAttributes(LinkExtension.name)
  );

  const truncateStart = (str: string, maxLen: number = 24): string => {
    if (!str || str.length <= maxLen) return str;
    return `${str.substring(0, maxLen - 3)}...`;
  };

  if (!editor || !linkAttributes?.href) return null;

  return (
    <div className="flex flex-row p-1">
      <Tooltip delay={0}>
        <Button variant="ghost" size="sm" className="text-muted max-w-3xl" onPress={onEdit}>
          {truncateStart(linkAttributes?.href, 34)}
        </Button>
        <Tooltip.Content>{linkAttributes?.href}</Tooltip.Content>
      </Tooltip>

      <RichTextEditor.ToolbarSeparator orientation="vertical" />

      <ButtonGroup size="sm" variant="ghost">
        <RichTextEditor.CommandButton
          size="sm"
          variant="ghost"
          isIconOnly
          onCommand={() => {
            const href = linkAttributes?.href;
            if (href) {
              window.open(href, "_blank", "noopener,noreferrer");
            }
          }}
          tooltip="Open in new tab"
        >
          <Icon icon="gravity-ui:arrow-up-right-from-square" aria-hidden="true" />
        </RichTextEditor.CommandButton>
        <RichTextEditor.CommandButton
          size="sm"
          isIconOnly
          variant="ghost"
          onCommand={(editor) => {
            editor.chain().focus().extendMarkRange(LinkExtension.name).unsetLink().run();
          }}
          tooltip="Remove link"
        >
          <Icon icon="gravity-ui:trash-bin" className="text-danger" aria-hidden="true" />
        </RichTextEditor.CommandButton>
      </ButtonGroup>
    </div>
  );
};
