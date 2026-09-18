"use client";

import { Icon } from "@iconify/react";

import { IconButton } from "../icon-button";

export interface RowActionsProps {
  employeeId: string;
}

export function RowActions({ employeeId }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5" data-employee-id={employeeId}>
      <IconButton label="View" size="sm" variant="tertiary">
        <Icon icon="gravity-ui:eye" className="size-4" />
      </IconButton>
      <IconButton label="Edit" size="sm" variant="tertiary">
        <Icon icon="gravity-ui:pencil" className="size-4" />
      </IconButton>
      <IconButton label="Delete" size="sm" variant="danger-soft">
        <Icon icon="gravity-ui:trash-bin" className="size-4" />
      </IconButton>
    </div>
  );
}
