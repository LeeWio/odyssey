"use client";

import { useMemo, useState } from "react";
import { AlertDialog, Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { DropZone } from "@heroui-pro/react";

import { useAppSelector } from "@/lib/hooks";
import { selectCurrentUser, selectIsAuthenticated, selectUserEmail } from "@/lib/features/auth";
import { useGetCurrentUserQuery } from "@/lib/features/user/user-api";

import { useMomentPublish } from "../../hooks/use-moment-publish";
import { MOMENT_CHARACTER_LIMIT } from "../../utils/character-count";
import { MOMENT_IMAGE_ACCEPT } from "../../utils/media-limits";
import { PublisherHeader } from "./publisher-header";
import { PublisherEditor } from "./publisher-editor";
import { PublisherGallery } from "./publisher-gallery";
import { PublisherToolbar } from "./publisher-toolbar";

import type { MomentResponse } from "@/lib/features/moment";

interface MomentPublisherProps {
  initialMoment?: MomentResponse;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved?: (saved: MomentResponse) => void;
  protectUnsavedChanges?: boolean;
}

export const MomentPublisher = ({
  isOpen,
  onOpenChange,
  initialMoment,
  onSaved,
  protectUnsavedChanges = false,
}: MomentPublisherProps) => {
  const t = useTranslations("Moments");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const username = useAppSelector(selectCurrentUser);
  const email = useAppSelector(selectUserEmail);

  const { data: currentUser } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  });

  const userProfile = useMemo(() => {
    if (!isAuthenticated) return null;
    return {
      avatar: currentUser?.avatar,
      email,
      nickname: currentUser?.nickname,
      username: username,
    };
  }, [isAuthenticated, username, email, currentUser]);

  const {
    mediaItems,
    removeMedia,
    updateMediaAlt,
    retryMedia,
    hasIncompleteUploads,
    hasMissingAlt,
    submitBlockReason,
    editorValue,
    setEditorValue,
    charCount,
    setCharCount,
    isEmpty,
    setIsEmpty,
    topics,
    addTopic,
    removeTopic,
    visibility,
    setVisibility,
    isSubmitting,
    isDirty,
    hasSubmitError,
    handleSelectFiles,
    handleDrop,
    publishMoment,
    attachedStockSymbol,
    setAttachedStockSymbol,
  } = useMomentPublish(
    (saved) => {
      onSaved?.(saved);
      onOpenChange(false);
    },
    initialMoment,
    { revalidateLists: !onSaved }
  );

  const requestOpenChange = (open: boolean) => {
    if (!open && protectUnsavedChanges) {
      if (isSubmitting) return;
      if (isDirty) {
        setConfirmDiscard(true);
        return;
      }
    }
    onOpenChange(open);
  };

  const isSubmitDisabled =
    (isEmpty && mediaItems.length === 0 && !attachedStockSymbol) ||
    charCount > MOMENT_CHARACTER_LIMIT ||
    isSubmitting ||
    hasIncompleteUploads ||
    hasMissingAlt;

  return (
    <>
      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={requestOpenChange}
          isDismissable={!protectUnsavedChanges || !isSubmitting}
          isKeyboardDismissDisabled={protectUnsavedChanges && isSubmitting}
        >
          <Modal.Container size="lg">
            <Modal.Dialog aria-label={initialMoment ? t("editMoment") : "Moment Publisher"}>
              <DropZone className="w-full border-none bg-transparent p-0 shadow-none">
                <PublisherHeader
                  isEditing={!!initialMoment}
                  isDisabled={protectUnsavedChanges && isSubmitting}
                  visibility={visibility}
                  onVisibilityChange={(value) => {
                    if (value === "public" || value === "followers" || value === "private") {
                      setVisibility(value);
                    }
                  }}
                  user={userProfile}
                />

                <Modal.Body className="flex flex-col gap-2">
                  {hasSubmitError ? (
                    <p role="alert" className="text-danger text-sm">
                      {t("editFailed")}
                    </p>
                  ) : null}
                  <DropZone.Area
                    onDrop={handleDrop}
                    className="flex w-full flex-col gap-2 border-none bg-transparent p-0 outline-none"
                  >
                    <PublisherEditor
                      isEditing={!!initialMoment}
                      value={editorValue}
                      onValueChange={(val, details) => {
                        setEditorValue(val);
                        setCharCount(details.characterCount);
                        setIsEmpty(details.isEmpty);
                      }}
                      maxLength={MOMENT_CHARACTER_LIMIT}
                    />

                    <PublisherGallery
                      items={mediaItems}
                      highlightMissingAlt={hasMissingAlt}
                      onRemove={removeMedia}
                      onAltChange={updateMediaAlt}
                      onRetry={retryMedia}
                    />
                  </DropZone.Area>

                  <PublisherToolbar
                    charCount={charCount}
                    isSubmitting={isSubmitting}
                    isSubmitDisabled={isSubmitDisabled}
                    submitDisabledReason={submitBlockReason}
                    onPublish={publishMoment}
                    isEditing={!!initialMoment}
                    topics={topics}
                    onAddTopic={addTopic}
                    onRemoveTopic={removeTopic}
                    onAttachStock={setAttachedStockSymbol}
                    attachedStockSymbol={attachedStockSymbol}
                  />
                </Modal.Body>

                <DropZone.Input
                  accept={MOMENT_IMAGE_ACCEPT}
                  multiple
                  aria-label="Upload moment images"
                  onSelect={handleSelectFiles}
                />
              </DropZone>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      {protectUnsavedChanges ? (
        <AlertDialog>
          <AlertDialog.Backdrop isOpen={confirmDiscard} onOpenChange={setConfirmDiscard}>
            <AlertDialog.Container size="sm">
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Heading>{t("discardEditTitle")}</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>{t("discardEditDescription")}</AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button variant="secondary" onPress={() => setConfirmDiscard(false)} autoFocus>
                    {t("continueEditing")}
                  </Button>
                  <Button variant="danger" onPress={() => onOpenChange(false)}>
                    {t("discardChanges")}
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ) : null}
    </>
  );
};
