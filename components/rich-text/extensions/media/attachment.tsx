import { ReactNodeViewRenderer } from "@tiptap/react";

import { AttachmentSchema } from "./attachment-schema";
import { MediaNodeView } from "./media-node-view";

export const Attachment = AttachmentSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MediaNodeView);
  },
});
