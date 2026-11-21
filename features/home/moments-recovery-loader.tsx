"use client";

import dynamic from "next/dynamic";

export const MomentsRecovery = dynamic(
  () => import("./moments-showcase-recovery").then((module) => module.MomentsShowcaseRecovery),
  { ssr: false }
);
