"use client";

import { Modal, type UseOverlayStateReturn } from "@heroui/react";
import { Plate, PlateContent } from "platejs/react";
import { useRichText } from "@/hooks/use-rich-text";
import { initialValue } from "@/app/[locale]/value";

export function QuickEditorModal({ state }: { state: UseOverlayStateReturn }) {
  const { editor } = useRichText({ value: initialValue });

  return (
    <Modal isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <Modal.Backdrop>
        <Modal.Container size="cover">
          <Modal.Dialog className="bg-background/45 backdrop-blur-2xl backdrop-saturate-[1.6]">
            <Modal.Header>
              {/* <Modal.Icon className="bg-default text-foreground">
              </Modal.Icon>
              <Modal.Heading>Welcome to HeroUI</Modal.Heading> */}
            </Modal.Header>
            <Modal.Body>
              <Plate editor={editor}>
                <PlateContent
                  autoFocusOnEditable
                  placeholder="Type your amazing content here..."
                  className="min-h-full w-full outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                />
              </Plate>
            </Modal.Body>
            <Modal.Footer>
              {/* <Button className="w-full " slot="close">
                Continue
              </Button> */}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
