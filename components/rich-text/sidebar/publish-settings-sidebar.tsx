"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Button,
  TextField,
  Label,
  Input,
  TextArea,
  Select,
  ListBox,
  Spinner,
  Form,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { PostStatus } from "@/lib/features/post/post-api";
import type { RichTextPublishResult } from "../hooks/use-rich-text-publish";
import { generateSlug } from "../utils/content-extractors";

interface PublishSettingsSidebarProps {
  publish: RichTextPublishResult;
}

const MotionForm = motion(Form);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1 as const,
    },
  },
};

const itemVariants = {
  hidden: { x: 12, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 350, damping: 25 },
  },
  exit: {
    x: 8,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const MotionButton = motion(Button);

export function PublishSettingsSidebar({ publish }: PublishSettingsSidebarProps) {
  const {
    showSettings,
    title,
    slug,
    categoryId,
    tagIds,
    summary,
    status,
    categories,
    tags,
    isPublishing,
    setCategoryId,
    setTagIds,
    setSummary,
    setStatus,
    setSlug,
    setIsSlugManuallyEdited,
    handleTitleChange,
    handlePublishSubmit,
  } = publish;

  return (
    <AnimatePresence>
      {showSettings && (
        <MotionForm
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 440, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-full shrink-0 flex-col overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            handlePublishSubmit();
          }}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-1 flex-col gap-6 overflow-y-auto"
          >
            {/* Title Field */}
            <motion.div
              variants={itemVariants}
              className="publish-form-field flex flex-col gap-1.5"
            >
              <TextField
                name="title"
                isRequired
                value={title}
                onChange={handleTitleChange}
                className="flex flex-col gap-1.5"
              >
                <Label className="text-sm font-medium">Title</Label>
                <Input fullWidth placeholder="Enter post title..." variant="secondary" />
              </TextField>
            </motion.div>

            {/* Slug Field */}
            <motion.div variants={itemVariants} className="publish-form-field">
              <TextField
                name="slug"
                isRequired
                value={slug}
                onChange={(val) => {
                  setSlug(generateSlug(val));
                  setIsSlugManuallyEdited(true);
                }}
              >
                <Label className="text-sm font-medium">Slug</Label>
                <Input fullWidth placeholder="e.g. my-first-post" variant="secondary" />
              </TextField>
            </motion.div>

            {/* Category Select */}
            <motion.div variants={itemVariants} className="publish-form-field flex w-full flex-col">
              <Select
                placeholder="Select a category"
                variant="secondary"
                value={categoryId}
                onChange={(key) => setCategoryId(key as string)}
                className="flex w-full flex-col"
              >
                <Label className="text-sm font-medium">Category</Label>
                <Select.Trigger className="mt-1">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {categories.map((c) => (
                      <ListBox.Item key={c.id} id={c.id.toString()} textValue={c.name}>
                        {c.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </motion.div>

            {/* Tags Multiple Select */}
            <motion.div
              variants={itemVariants}
              className="publish-form-field flex w-full flex-col gap-1.5"
            >
              <Select
                placeholder="Select tags"
                selectionMode="multiple"
                variant="secondary"
                value={tagIds}
                onChange={(keys) => setTagIds(keys as string[])}
                className="flex w-full flex-col gap-1.5"
              >
                <Label className="text-sm font-medium">Tags</Label>
                <Select.Trigger className="mt-1">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox selectionMode="multiple">
                    {tags.map((t) => (
                      <ListBox.Item key={t.id} id={t.id.toString()} textValue={t.name}>
                        {t.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </motion.div>

            {/* Summary Text Area */}
            <motion.div
              variants={itemVariants}
              className="publish-form-field flex flex-col gap-1.5"
            >
              <TextField name="summary" className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Summary</Label>
                <TextArea
                  fullWidth
                  className="mt-1 min-h-24 resize-y"
                  maxLength={240}
                  placeholder="Enter a brief summary..."
                  variant="secondary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </TextField>
            </motion.div>

            {/* Status Select */}
            <motion.div
              variants={itemVariants}
              className="publish-form-field flex w-full flex-col gap-1.5"
            >
              <Select
                placeholder="Select status"
                variant="secondary"
                value={status}
                onChange={(val) => setStatus(val as PostStatus)}
                className="flex w-full flex-col gap-1.5"
              >
                <Label className="text-sm font-medium">Status</Label>
                <Select.Trigger className="mt-1">
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="PUBLISHED" textValue="Published">
                      Published (Visible to everyone)
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    <ListBox.Item id="DRAFT" textValue="Draft">
                      Draft (Only administrators)
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </motion.div>

            {/* Submit Trigger Button */}
            <motion.div
              variants={itemVariants}
              className="publish-form-field bg-background/50 flex shrink-0 flex-col p-6 select-none"
            >
              <MotionButton
                type="submit"
                variant="primary"
                className="flex h-11 w-full items-center justify-center gap-2 font-bold shadow-md"
                isDisabled={isPublishing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isPublishing ? (
                  <>
                    <Spinner size="sm" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Publish</span>
                    <Icon icon="gravity-ui:paper-plane" className="size-4" aria-hidden="true" />
                  </>
                )}
              </MotionButton>
            </motion.div>
          </motion.div>
        </MotionForm>
      )}
    </AnimatePresence>
  );
}
