"use client";

import { Avatar, Button, Dropdown, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";

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
  return (
    <div className="flex w-full flex-row items-center justify-between">
      <div className="flex min-w-0 flex-row items-center gap-3">
        <Avatar>
          {authorAvatar ? <Avatar.Image alt={authorName} src={authorAvatar} /> : null}
          <Avatar.Fallback>{fallbackInitial}</Avatar.Fallback>
        </Avatar>

        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-medium">{authorName}</span>
          <span className="text-muted text-xs">{timeLabel}</span>
        </div>
      </div>

      {isAdmin && onDelete ? (
        <Dropdown>
          <Button
            size="sm"
            isIconOnly
            variant="ghost"
            aria-label="More options"
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
                textValue="Delete Moment"
                className="text-danger"
                onPress={onDelete}
              >
                <div className="flex flex-row items-center gap-2">
                  <Icon icon="gravity-ui:trash-bin" className="size-4" />
                  <span>Delete Moment</span>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      ) : (
        <Button size="sm" isIconOnly variant="ghost" aria-label="More options">
          <Icon icon="gravity-ui:ellipsis" className="size-4.5" />
        </Button>
      )}
    </div>
  );
};
