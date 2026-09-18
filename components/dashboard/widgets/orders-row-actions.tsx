"use client";

import { Icon } from "@iconify/react";

import { IconButton } from "../icon-button";

export interface OrdersRowActionsProps {
  orderId: string;
}

export function OrdersRowActions({ orderId }: OrdersRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-0.5" data-order-id={orderId}>
      <IconButton label="View order" size="sm" variant="tertiary">
        <Icon icon="gravity-ui:eye" className="size-4" />
      </IconButton>
      <IconButton label="Edit order" size="sm" variant="tertiary">
        <Icon icon="gravity-ui:pencil" className="size-4" />
      </IconButton>
      <IconButton label="Delete order" size="sm" variant="danger-soft">
        <Icon icon="gravity-ui:trash-bin" className="size-4" />
      </IconButton>
    </div>
  );
}
