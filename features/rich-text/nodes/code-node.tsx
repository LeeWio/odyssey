"use client";

import * as React from "react";

import type { PlateLeafProps } from "platejs/react";

import { PlateLeaf } from "platejs/react";

export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="code" className="chip gap-0 rounded-md">
      {props.children}
    </PlateLeaf>
  );
}
