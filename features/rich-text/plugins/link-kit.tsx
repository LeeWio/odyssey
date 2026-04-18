"use client";
import { LinkPlugin } from "@platejs/link/react";
import { LinkElement } from "../nodes/link-node";
import { LinkFloatingToolbar } from "../components/plate-ui/link-toolbar";

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
