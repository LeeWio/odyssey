const NullComponent = () => null;

export const DropZone = Object.assign(NullComponent, {
  Area: NullComponent,
  Description: NullComponent,
  FileFormatIcon: NullComponent,
  FileInfo: NullComponent,
  FileItem: NullComponent,
  FileList: NullComponent,
  FileMeta: NullComponent,
  FileName: NullComponent,
  FileProgress: NullComponent,
  FileProgressFill: NullComponent,
  FileProgressTrack: NullComponent,
  FileRemoveTrigger: NullComponent,
  FileRetryTrigger: NullComponent,
  Icon: NullComponent,
  Input: NullComponent,
  Label: NullComponent,
  Trigger: NullComponent,
});

export const EmojiPicker = Object.assign(NullComponent, {
  Content: NullComponent,
  Footer: NullComponent,
  Grid: NullComponent,
  Item: NullComponent,
  SkinToneContent: NullComponent,
  SkinToneOption: NullComponent,
  SkinTonePicker: NullComponent,
  SkinToneTrigger: NullComponent,
});

export const EMOJI_CATEGORIES: never[] = [];
export const EMOJI_SKIN_TONES: never[] = [];

export function useRichTextEditor() {
  return { editor: null };
}
