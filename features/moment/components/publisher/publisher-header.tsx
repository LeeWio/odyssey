"use client";

import { Button, Dropdown, Label, Description, Modal, Tooltip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { UserAvatar } from "@/components/user-avatar";

interface PublisherHeaderProps {
  isEditing?: boolean;
  onClose?: () => void;
  isDisabled?: boolean;
  visibility: string;
  onVisibilityChange: (value: string) => void;
  user: {
    avatar?: string | null;
    email?: string | null;
    nickname?: string | null;
    username?: string | null;
  } | null;
}

export const PublisherHeader = ({
  isEditing = false,
  onClose,
  isDisabled = false,
  visibility,
  onVisibilityChange,
  user,
}: PublisherHeaderProps) => {
  const t = useTranslations("Moments");
  const displayName = user?.nickname || user?.username || "wei.li";

  const getVisibilityIcon = (value: string) => {
    if (value === "private") return "gravity-ui:lock";
    if (value === "followers") return "gravity-ui:persons";
    return "gravity-ui:globe";
  };

  return (
    <Modal.Header className="flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 flex-row items-center gap-3">
        <UserAvatar name={displayName} avatar={user?.avatar} email={user?.email} />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">{displayName}</span>
          <span className="text-muted text-xs">
            {isEditing ? t("editMoment") : "Share a moment..."}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Dropdown>
          <Button
            size="sm"
            aria-label={t("visibilityLabel")}
            variant="outline"
            isDisabled={isDisabled}
          >
            <Icon icon={getVisibilityIcon(visibility)} className="size-4" />
            <span>{t(`visibility.${visibility as "public" | "followers" | "private"}`)}</span>
            <Icon icon="gravity-ui:chevron-down" className="text-muted size-4" />
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu
              selectionMode="single"
              selectedKeys={new Set([visibility])}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) onVisibilityChange(selected);
              }}
            >
              <Dropdown.Item id="public" textValue={t("visibility.public")}>
                <Icon icon="gravity-ui:globe" className="size-4" aria-hidden="true" />
                <Label>{t("visibility.public")}</Label>
                <Description>{t("visibilityDescription.public")}</Description>
              </Dropdown.Item>
              <Dropdown.Item id="followers" textValue={t("visibility.followers")}>
                <Icon icon="gravity-ui:persons" className="size-4" aria-hidden="true" />
                <Label>{t("visibility.followers")}</Label>
                <Description>{t("visibilityDescription.followers")}</Description>
              </Dropdown.Item>
              <Dropdown.Item id="private" textValue={t("visibility.private")}>
                <Icon icon="gravity-ui:lock" className="size-4" aria-hidden="true" />
                <Label>{t("visibility.private")}</Label>
                <Description>{t("visibilityDescription.private")}</Description>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        {onClose ? (
          <Tooltip>
            <Button
              size="sm"
              isIconOnly
              variant="ghost"
              aria-label={t("closeEditor")}
              onPress={onClose}
              isDisabled={isDisabled}
            >
              <Icon icon="lucide:x" className="size-4" aria-hidden="true" />
            </Button>
            <Tooltip.Content>{t("closeEditor")}</Tooltip.Content>
          </Tooltip>
        ) : null}
      </div>
    </Modal.Header>
  );
};
