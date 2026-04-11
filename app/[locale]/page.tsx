"use client";

import { Plate, PlateContent } from "platejs/react";
import { useRichText } from "@/hooks/use-rich-text";
import { initialValue } from "./value";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("HomePage");
  const { editor } = useRichText({ value: initialValue });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">{t("title")}</h1>
      <p className="text-muted mb-8 text-lg">{t("description")}</p>

      <Modal>
        <Button variant="secondary">{t("title")}</Button>
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
    </div>
  );
}
