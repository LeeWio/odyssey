"use client";

import { Button, Chip, Separator, Typography } from "@heroui/react";
import { ItemCard, KPI, RichTextEditor } from "@heroui-pro/react";
import { motion } from "motion/react";

export const MotionTypography = motion.create(Typography);
export const MotionItemCard = motion.create(ItemCard);
export const MotionChip = motion.create(Chip);
export const MotionButton = motion.create(Button);
export const MotionSeparator = motion.create(Separator);
export const MotionRichTextEditor = motion.create(RichTextEditor);
export const MotionKPI = motion.create(KPI);
