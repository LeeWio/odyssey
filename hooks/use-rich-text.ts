import { CreatePlateEditorOptions, usePlateEditor } from "platejs/react";
import { Plugins } from "@/features/rich-text/plugins";

export function useRichText(options?: Partial<CreatePlateEditorOptions>) {
  const editor = usePlateEditor({
    plugins: Plugins,
    /**
     * Editor read-only initial state. For dynamic read-only control, use the
     * `Plate.readOnly` prop instead.
     *
     * @default false
     */
    readOnly: options?.readOnly,
    /** Specifies the component for each plugin key. */
    /**
     * Specifies the maximum number of characters allowed in the editor. When the
     * limit is reached, further input will be prevented.
     */
    maxLength: options?.maxLength,
    /**
     * Select the editor after initialization.
     *
     * @default false
     *
     * - `true` | 'end': Select the end of the editor
     * - `false`: Do not select anything
     * - `'start'`: Select the start of the editor
     */
    autoSelect: true,
    value: options?.value,
    /**
     * When `true`, normalizes the initial `value` passed to the editor. This is
     * useful when adding normalization rules to already existing content or when
     * the initial value might not conform to the current schema.
     *
     * Note: Normalization may take time for large documents.
     *
     * @default false
     */
    shouldNormalizeEditor: false,
    /**
     * When `true`, skips the initial value, selection, and normalization logic.
     * Useful when the editor state is managed externally (e.g., with Yjs
     * collaboration) or when you want to manually control the initialization
     * process.
     *
     * @default false
     */
    skipInitialization: false,
  });

  return { editor };
}
