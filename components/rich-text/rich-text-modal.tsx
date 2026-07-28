"use client";

import { Button, Modal, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { RichText } from "@/components/rich-text/rich-text";
import { RichTextForm } from "@/components/rich-text/rich-text-form";
import { MotionButton } from "@/components/ui";
import { closeRichText, selectRichTextState } from "@/lib/features";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  useCreatePostMutation,
  useGetAdminPostByIdQuery,
  useUpdatePostMutation,
  type PostRequest,
} from "@/lib/features/post/post-api";

export function RichTextModal() {
  const { isOpen, activeId } = useAppSelector(selectRichTextState);
  const dispatch = useAppDispatch();

  const [showForm, setShowForm] = useState(false);
  const editorRef = useRef<Editor | null>(null);

  // Reset showForm when modal opens or activeId changes
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowForm(false);
    }
  }, [isOpen, activeId]);

  // Form State
  const [postData, setPostData] = useState<Partial<PostRequest>>({
    status: "DRAFT",
    tagIds: [],
  });

  // API Mutations
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();

  const isPending = isCreating || isUpdating;

  // Fetch existing post data if activeId is a numeric string (existing ID)
  const isExistingPost = activeId && !isNaN(Number(activeId));
  const { data: existingPost, isLoading: isFetching } = useGetAdminPostByIdQuery(Number(activeId), {
    skip: !isExistingPost || !isOpen,
  });

  // Initialize form with existing post data
  useEffect(() => {
    if (!isOpen) return;

    if (existingPost) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPostData((prev) => {
        // Only update if critical fields changed to avoid cascading renders
        if (prev.title === existingPost.title && prev.slug === existingPost.slug) {
          return prev;
        }
        return {
          title: existingPost.title,
          slug: existingPost.slug,
          summary: existingPost.summary || "",
          status: existingPost.status,
          coverImage: existingPost.coverImage || "",
          isFeatured: existingPost.isFeatured,
          categoryId: existingPost.category?.id,
          tagIds: existingPost.tags?.map((t) => t.id) || [],
        };
      });
    } else if (activeId && !isExistingPost) {
      setPostData((prev) => {
        if (prev.title === "" && prev.slug === "") return prev;
        return {
          ...prev,
          title: "",
          slug: "",
          status: "DRAFT",
          tagIds: [],
        };
      });
    }
  }, [existingPost, activeId, isExistingPost, isOpen]);

  const handleClose = () => {
    dispatch(closeRichText());
    setShowForm(false);
  };

  const handleSave = async (statusOverride?: PostRequest["status"]) => {
    const content = editorRef.current?.getJSON();
    if (!content) return;

    const payload: PostRequest = {
      ...(postData as PostRequest),
      content: JSON.stringify(content),
      status: statusOverride || postData.status || "DRAFT",
    };

    try {
      if (isExistingPost) {
        await updatePost({ id: Number(activeId), body: payload }).unwrap();
      } else {
        await createPost(payload).unwrap();
      }
      handleClose();
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  return (
    <Modal key={activeId}>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleClose}>
        <Modal.Container size="cover">
          <Modal.Dialog className="relative flex h-full w-full flex-col overflow-hidden">
            {/* Toggle Button */}
            <MotionButton
              isIconOnly
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-50 overflow-hidden backdrop-blur-xl"
              aria-label={showForm ? "Back to editor" : "Open settings"}
              onPress={() => setShowForm((prev) => !prev)}
              whileHover={{
                scale: 1.06,
              }}
              whileTap={{
                scale: 0.92,
              }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 22,
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={showForm ? "back" : "settings"}
                  initial={{
                    opacity: 0,
                    scale: 0.4,
                    rotate: -45,
                    filter: "blur(8px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: 0,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.4,
                    rotate: 45,
                    filter: "blur(8px)",
                  }}
                  transition={{
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Icon
                    icon={showForm ? "gravity-ui:arrow-left" : "gravity-ui:sliders"}
                    className="size-4"
                  />
                </motion.div>
              </AnimatePresence>
            </MotionButton>

            <Modal.Body className="relative min-h-0 flex-1 overflow-hidden p-0">
              {isFetching ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {!showForm ? (
                    <motion.div
                      key="editor"
                      layout
                      className="h-full w-full"
                      initial={{
                        opacity: 0,
                        x: -40,
                        scale: 0.98,
                        filter: "blur(12px)",
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        x: 40,
                        scale: 0.98,
                        filter: "blur(12px)",
                      }}
                      transition={{
                        duration: 0.45,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <RichText
                        content={
                          existingPost?.content ? JSON.parse(existingPost.content) : undefined
                        }
                        onReady={(editor) => {
                          editorRef.current = editor;
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="settings"
                      layout
                      className="h-full w-full"
                      initial={{
                        opacity: 0,
                        x: 40,
                        scale: 0.98,
                        filter: "blur(12px)",
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        x: -40,
                        scale: 0.98,
                        filter: "blur(12px)",
                      }}
                      transition={{
                        duration: 0.45,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <RichTextForm data={postData} onChange={setPostData} />
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </Modal.Body>

            {/* Modal Footer with Actions */}
            <Modal.Footer className="border-border/50 bg-surface/50 border-t backdrop-blur-md">
              <div className="flex w-full items-center justify-between">
                <div className="text-muted flex items-center gap-2 text-sm">
                  {isExistingPost ? "Editing existing post" : "Creating new post"}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm" onPress={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => handleSave("DRAFT")}
                    isPending={isPending}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner color="current" size="sm" />}
                        Save Draft
                      </>
                    )}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => handleSave("PUBLISHED")}
                    isPending={isPending}
                    className="bg-accent text-accent-foreground"
                  >
                    {({ isPending }) => (
                      <>
                        {isPending && <Spinner color="current" size="sm" />}
                        {postData.status === "PUBLISHED" ? "Update" : "Publish"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
