import { ReactNodeViewRenderer } from "@tiptap/react";

import { ImageUploadSchema } from "./image-upload-schema";
import { ImageUploadView } from "./view/ImageUploadView";

export const ImageUpload = ImageUploadSchema.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageUploadView);
  },
});

export default ImageUpload;
