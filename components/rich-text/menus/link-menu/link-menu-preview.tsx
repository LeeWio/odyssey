import { Button, ButtonGroup, Tooltip, Typography } from "@heroui/react";
import {
  RichTextEditor,
  useRichTextEditor,
  useRichTextEditorState,
} from "@heroui-pro/react/rich-text-editor";
import { Icon } from "@iconify/react";

interface LinkMenuPreviewProps {
  onEdit: () => void;
}

function truncateStart(value: string, maxLength = 24): string {
  if (!value || value.length <= maxLength) return value;
  return `${value.substring(0, maxLength - 3)}...`;
}

export const LinkMenuPreview: React.FC<LinkMenuPreviewProps> = ({ onEdit }) => {
  const { editor } = useRichTextEditor();

  const linkAttributes = useRichTextEditorState((state) => state.editor.getAttributes("link"));

  if (!editor || !linkAttributes?.href) return null;

  const href = String(linkAttributes.href);

  return (
    <div className="flex flex-row items-center gap-0.5 p-1">
      <Tooltip delay={0}>
        <Button
          aria-label={`Edit link: ${href}`}
          className="text-muted max-w-3xl"
          size="sm"
          variant="ghost"
          onPress={onEdit}
        >
          <Typography className="font-normal" truncate>
            {truncateStart(href, 34)}
          </Typography>
        </Button>
        <Tooltip.Content>{href}</Tooltip.Content>
      </Tooltip>

      <RichTextEditor.ToolbarSeparator orientation="vertical" />

      <ButtonGroup size="sm" variant="ghost">
        <RichTextEditor.CommandButton
          size="sm"
          variant="ghost"
          isIconOnly
          aria-label="Open link in new tab"
          onCommand={() => {
            window.open(href, "_blank", "noopener,noreferrer");
          }}
          tooltip="Open in new tab"
        >
          <Icon icon="gravity-ui:arrow-up-right-from-square" aria-hidden="true" />
        </RichTextEditor.CommandButton>
        <RichTextEditor.CommandButton
          size="sm"
          isIconOnly
          variant="ghost"
          aria-label="Remove link"
          onCommand={(currentEditor) => {
            currentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
          }}
          tooltip="Remove link"
        >
          <Icon icon="gravity-ui:trash-bin" className="text-danger" aria-hidden="true" />
        </RichTextEditor.CommandButton>
      </ButtonGroup>
    </div>
  );
};
