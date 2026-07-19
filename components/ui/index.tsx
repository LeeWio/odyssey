"use client";

import { motion } from "motion/react";
import { Typography, Button, Separator } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";

export const MotionTypography = motion.create(Typography);
export const MotionButton = motion.create(Button);
export const MotionSeparator = motion.create(Separator);
export const MotionRichTextEditor = motion.create(RichTextEditor);
