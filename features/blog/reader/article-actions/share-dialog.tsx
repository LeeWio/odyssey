"use client";

import { Button, Card, Label, Modal, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

import type { Target } from "./target";

export function ShareDialog({
  article,
  isOpen,
  onOpenChange,
  url,
}: {
  article: Target;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  url: string;
}) {
  const t = useTranslations("Article");
  const title = article.title || t("essay");
  const message = `${title} ${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    } catch {
      toast.danger(t("linkCopyFailed"));
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} variant="blur" onOpenChange={onOpenChange}>
        <Modal.Container size="sm">
          <Modal.Dialog className="overflow-hidden sm:max-w-88">
            <Modal.CloseTrigger />
            <Modal.Body className="flex flex-col gap-5">
              <div className="flex flex-col gap-5 px-5 pb-5">
                <div className="flex flex-col gap-1 pr-6">
                  <Modal.Heading>{t("shareTitle")}</Modal.Heading>
                  <p className="text-muted text-sm leading-6">{t("shareDescription")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t("shareYourLink")}</p>
                  <div className="flex items-center gap-1 rounded-full border py-1 pr-1 pl-3">
                    <p className="min-w-0 flex-1 truncate text-sm">{url}</p>
                    <Button
                      isIconOnly
                      aria-label={t("copyLink")}
                      size="sm"
                      variant="ghost"
                      onPress={() => void copy()}
                    >
                      <Icon icon="gravity-ui:copy" />
                    </Button>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer className="border-default-200 bg-default-50 flex flex-col items-start gap-3 border-t px-5 py-4">
              <Label className="text-muted text-xs tracking-wide">{t("shareTo")}</Label>
              <div className="flex w-full items-start justify-between">
                <a
                  aria-label={t("shareEmail")}
                  className="group flex w-14 flex-col items-center gap-2"
                  href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
                >
                  <span className="border-default-200 bg-background flex size-11 items-center justify-center rounded-full border text-[#0A84FF] shadow-[0_1px_1px_rgb(0_0_0/0.04),0_8px_16px_-12px_rgb(0_0_0/0.45)] transition duration-200 ease-out group-hover:-translate-y-0.5">
                    <Icon aria-hidden="true" className="size-5" icon="gravity-ui:envelope" />
                  </span>
                  <span className="text-muted text-center text-xs">{t("shareEmail")}</span>
                </a>
                <a
                  aria-label={t("shareMessage")}
                  className="group flex w-14 flex-col items-center gap-2"
                  href={`sms:?&body=${encodeURIComponent(message)}`}
                >
                  <span className="border-default-200 bg-background flex size-11 items-center justify-center rounded-full border text-[#248A3D] shadow-[0_1px_1px_rgb(0_0_0/0.04),0_8px_16px_-12px_rgb(0_0_0/0.45)] transition duration-200 ease-out group-hover:-translate-y-0.5"></span>
                  <span className="text-muted text-center text-xs">{t("shareMessage")}</span>
                </a>
                <Card className="gap-2">
                  <Icon
                    aria-hidden="true"
                    className="aspect-square size-16 rounded-2xl"
                    icon="gravity-ui:comment"
                  />
                  <Card.Footer className="flex gap-2">
                    <span className="text-xs">Martha</span>
                  </Card.Footer>
                </Card>
                <a
                  aria-label={t("shareLinkedIn")}
                  className="group flex w-14 flex-col items-center gap-2"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="border-default-200 bg-background flex size-11 items-center justify-center rounded-full border text-[#0A66C2] shadow-[0_1px_1px_rgb(0_0_0/0.04),0_8px_16px_-12px_rgb(0_0_0/0.45)] transition duration-200 ease-out group-hover:-translate-y-0.5">
                    <Icon aria-hidden="true" className="size-5" icon="simple-icons:linkedin" />
                  </span>
                  <span className="text-muted text-center text-xs">{t("shareLinkedIn")}</span>
                </a>
                <a
                  aria-label={t("shareX")}
                  className="group flex w-14 flex-col items-center gap-2"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="border-default-200 bg-background text-foreground flex size-11 items-center justify-center rounded-full border shadow-[0_1px_1px_rgb(0_0_0/0.04),0_8px_16px_-12px_rgb(0_0_0/0.45)] transition duration-200 ease-out group-hover:-translate-y-0.5">
                    <Icon aria-hidden="true" className="size-4" icon="simple-icons:x" />
                  </span>
                  <span className="text-muted text-center text-xs">{t("shareX")}</span>
                </a>
                <a
                  aria-label={t("shareWhatsApp")}
                  className="group flex w-14 flex-col items-center gap-2"
                  href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="border-default-200 bg-background flex size-11 items-center justify-center rounded-full border text-[#128C7E] shadow-[0_1px_1px_rgb(0_0_0/0.04),0_8px_16px_-12px_rgb(0_0_0/0.45)] transition duration-200 ease-out group-hover:-translate-y-0.5">
                    <Icon aria-hidden="true" className="size-5" icon="simple-icons:whatsapp" />
                  </span>
                  <span className="text-muted text-center text-xs">{t("shareWhatsApp")}</span>
                </a>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
