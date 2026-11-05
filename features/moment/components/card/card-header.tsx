"use client";

import { Avatar, Button, Dropdown, Label, Spinner, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { momentLayoutTransition, useMomentMotion } from "../feed-motion";

interface CardHeaderProps {
  authorName: string;
  authorAvatar: string | null;
  fallbackInitial: string;
  timeLabel: string;
  isAdmin: boolean;
  isDeleting: boolean;
  onDelete?: () => void;
}

export const CardHeader = ({
  authorName,
  authorAvatar,
  fallbackInitial,
  timeLabel,
  isAdmin,
  isDeleting,
  onDelete,
}: CardHeaderProps) => {
  const t = useTranslations("Moments");
  const { enabled, reduced } = useMomentMotion();

  return (
    <motion.div
      className="flex w-full flex-row items-center justify-between"
      layout={enabled ? "position" : undefined}
      transition={{ layout: reduced ? { duration: 0 } : momentLayoutTransition }}
    >
      <div className="flex min-w-0 flex-row items-center gap-2">
        <Avatar>
          {authorAvatar ? <Avatar.Image alt={authorName} src={authorAvatar} /> : null}
          <Avatar.Fallback>{fallbackInitial}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col">
          <Typography className="leading-none" weight="bold" truncate align="start" type="body">
            {authorName}
          </Typography>
          <Typography truncate align="start" type="body-xs" color="muted">
            {timeLabel}
          </Typography>
        </div>
      </div>

      {isAdmin && onDelete ? (
        <Dropdown>
          <Button
            size="sm"
            isIconOnly
            variant="ghost"
            aria-label={t("moreOptions")}
            isDisabled={isDeleting}
          >
            {isDeleting ? (
              <Spinner size="sm" color="current" />
            ) : (
              <Icon icon="gravity-ui:ellipsis" className="size-4.5" />
            )}
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item
                id="delete"
                textValue={t("deleteMoment")}
                variant="danger"
                onPress={onDelete}
              >
                <Icon icon="gravity-ui:trash-bin" className="text-danger size-4" />
                <Label>{t("deleteMoment")}</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : (
        <Button size="sm" isIconOnly variant="ghost" aria-label={t("moreOptions")}>
          <Icon icon="gravity-ui:ellipsis" className="size-4.5" />
        </Button>
      )}
    </motion.div>
  );
};
