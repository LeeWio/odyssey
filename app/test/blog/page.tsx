"use client";

import { Button, Modal } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import { RichText } from "@/components/rich-text/rich-text";
import { MotionButton } from "@/components/ui";
import { openRichText, selectRichTextState } from "@/lib/features";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

export default function BlogTestPage() {
  const { isOpen, activeId } = useAppSelector(selectRichTextState);

  const dispatch = useAppDispatch();

  const [showForm, setShowForm] = useState(false);

  const editorRef = useRef<Editor | null>(null);

  return (
    <>
      <Button
        onPress={() =>
          dispatch(
            openRichText({
              isReadOnly: false,
              activeId: "111",
            })
          )
        }
      >
        Open
      </Button>

      <Modal isOpen={isOpen} key={activeId}>
        <Modal.Backdrop>
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
                        onReady={(editor) => {
                          editorRef.current = editor;
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="settings"
                      layout
                      className="flex h-full w-full items-center justify-center p-12"
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
                      <div className="text-center text-lg font-semibold">Form Settings Area</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Modal.Body>

              {/* Animated Footer */}
              <AnimatePresence initial={false} mode="wait">
                {!showForm && (
                  <motion.div
                    key="footer"
                    layout
                    initial={{
                      opacity: 0,
                      y: 30,
                      filter: "blur(10px)",
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    exit={{
                      opacity: 0,
                      y: 30,
                      filter: "blur(10px)",
                    }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Modal.Footer>111</Modal.Footer>
                  </motion.div>
                )}
              </AnimatePresence>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
