import { ReactNodeViewRenderer } from "@tiptap/react";

import { ImageSchema } from "./image-schema";
import { ImageView } from "./components/ImageView";

export const Image = ImageSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

export default Image;
