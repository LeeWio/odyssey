"use client";

import { Avatar, Button, Dropdown, Label, Description, Modal } from "@heroui/react";
import { Icon } from "@iconify/react";

interface PublisherHeaderProps {
  visibility: string;
  onVisibilityChange: (value: string) => void;
  user: {
    avatar?: string | null;
    nickname?: string | null;
    username?: string | null;
  } | null;
}

export const PublisherHeader = ({ visibility, onVisibilityChange, user }: PublisherHeaderProps) => {
  const displayName = user?.nickname || user?.username || "wei.li";
  const avatarUrl = user?.avatar || null;
  const fallbackInitial = (user?.username || displayName).charAt(0).toUpperCase();

  const getVisibilityIcon = (value: string) => {
    if (value === "private") return "gravity-ui:lock";
    if (value === "followers") return "gravity-ui:persons";
    return "gravity-ui:globe";
  };

  return (
    <Modal.Header className="flex flex-row items-center justify-between">
      <div className="flex flex-row items-center gap-3">
        <Avatar>
          {avatarUrl && <Avatar.Image alt={displayName} src={avatarUrl} />}
          <Avatar.Fallback>{fallbackInitial}</Avatar.Fallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-medium">{displayName}</span>
          <span className="text-muted text-xs">Share a moment...</span>
        </div>
      </div>

      <Dropdown>
        <Button size="sm" aria-label="Visibility" variant="outline">
          <Icon icon={getVisibilityIcon(visibility)} className="size-4" />
          <span className="capitalize">{visibility}</span>
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
            <Dropdown.Item id="public" textValue="Public">
              <Icon icon="gravity-ui:globe" className="size-4" />
              <div className="flex flex-col">
                <Label>Public</Label>
                <Description>Anyone can see this moment</Description>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="followers" textValue="Followers">
              <Icon icon="gravity-ui:persons" className="size-4" />
              <div className="flex flex-col">
                <Label>Followers</Label>
                <Description>Only your followers can see this moment</Description>
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="private" textValue="Private">
              <Icon icon="gravity-ui:lock" className="size-4" />
              <div className="flex flex-col">
                <Label>Private</Label>
                <Description>Only you can see this moment</Description>
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Modal.Header>
  );
};
