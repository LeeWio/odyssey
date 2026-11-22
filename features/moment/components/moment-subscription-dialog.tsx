"use client";

import { Button, Modal } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import { EmailSubscriptionForm } from "@/features/newsletter/email-subscription-form";
import { useSubscribeToMomentsMutation } from "@/lib/features/moment/moment-subscription-api";

export function MomentSubscriptionDialog() {
  const t = useTranslations("MomentSubscription");
  const descriptionId = useId();
  const [subscribe] = useSubscribeToMomentsMutation();

  return (
    <Modal>
      <Button className="shrink-0" size="sm" variant="secondary">
        <Icon aria-hidden="true" icon="gravity-ui:envelope" />
        {t("title")}
      </Button>
      <Modal.Backdrop>
        <Modal.Container size="sm" scroll="inside">
          <Modal.Dialog aria-describedby={descriptionId}>
            <Modal.CloseTrigger aria-label={t("close")} />
            <Modal.Header>
              <Modal.Heading>{t("title")}</Modal.Heading>
              <p id={descriptionId} className="text-muted text-sm">
                {t("description")}
              </p>
            </Modal.Header>
            <Modal.Body>
              <EmailSubscriptionForm
                channel="MomentSubscription"
                subscribe={(email) => subscribe(email).unwrap()}
              />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
