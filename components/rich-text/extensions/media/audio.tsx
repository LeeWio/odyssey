import { ReactNodeViewRenderer } from "@tiptap/react";

import { AudioSchema } from "./audio-schema";
import { MediaNodeView } from "./media-node-view";

export const Audio = AudioSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
});
