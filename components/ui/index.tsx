"use client";

import { Button, Separator, Typography } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import { motion } from "motion/react";

export const MotionTypography = motion.create(Typography);
export const MotionButton = motion.create(Button);
export const MotionSeparator = motion.create(Separator);
export const MotionRichTextEditor = motion.create(RichTextEditor);
