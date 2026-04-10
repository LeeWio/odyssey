"use client";

import type { Value } from "platejs";
import { Plate, PlateContent } from "platejs/react";
import { useRichText } from "@/hooks/use-rich-text";

import { initialValue } from "./value";

import { Button, Modal, ScrollShadow } from "@heroui/react";

export default function Home() {
  const { editor } = useRichText({ value: initialValue });

  if (!editor) {
    return null;
  }

  return (
    <Modal>
      <Button variant="secondary">Open Modal</Button>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="cover">
          <Modal.Dialog>
            <Modal.Body>
              <Plate editor={editor}>
                <PlateContent
                  className="scroll-smooth outline-none"
                  placeholder="Type your amazing content here..."
                />
              </Plate>
            </Modal.Body>
            <Modal.Footer></Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
