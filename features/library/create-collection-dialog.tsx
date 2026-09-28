"use client";

import { Button, FieldError, Form, Input, Label, Modal, TextField } from "@heroui/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  type PostCollectionResponse,
  useAddPostToCollectionMutation,
  useCreatePostCollectionMutation,
} from "@/lib/features/library";
import { useTranslations } from "next-intl";

/** Mount a fresh dialog for each article and each explicit create action. */
export function CreateCollectionDialog({
  postId,
  onClose,
}: {
  postId: number;
  onClose: () => void;
}) {
  const t = useTranslations("Library");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdCollection, setCreatedCollection] = useState<PostCollectionResponse | null>(null);
  const created = useRef<PostCollectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  const [createCollection] = useCreatePostCollectionMutation();
  const [addPost] = useAddPostToCollectionMutation();

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active.current || pending.current || (!created.current && !name.trim())) return;
    pending.current = true;
    setIsPending(true);
    setError(null);
    let collection = created.current;
    try {
      if (!collection) {
        collection = await createCollection({
          name: name.trim(),
          description: description.trim() || undefined,
        }).unwrap();
        // Leaving the article must not start a second request or close a later dialog.
        if (!active.current) return;
        created.current = collection;
        setCreatedCollection(collection);
      }
      await addPost({ collectionId: collection.id, postId }).unwrap();
      if (active.current) onClose();
    } catch {
      if (active.current) {
        setError(collection ? t("saveRetry", { name: collection.name }) : t("createFailed"));
      }
    } finally {
      pending.current = false;
      if (active.current) setIsPending(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen
        isDismissable={!isPending}
        isKeyboardDismissDisabled={isPending}
        onOpenChange={(open) => {
          if (!open && !pending.current) onClose();
        }}
        variant="blur"
      >
        <Modal.Container size="sm">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger isDisabled={isPending} />
            <Form aria-label={t("createAndSaveLabel")} onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>{t("createCollection")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4 py-4">
                <p className="text-muted text-sm">{t("saveToNew")}</p>
                <TextField
                  isRequired
                  isReadOnly={isPending || !!createdCollection}
                  name="collection-name"
                  value={name}
                  onChange={setName}
                  validate={(value) => (value.trim() ? null : t("nameRequired"))}
                >
                  <Label>{t("name")}</Label>
                  <Input autoFocus maxLength={80} placeholder={t("namePlaceholder")} />
                  <FieldError />
                </TextField>
                <TextField
                  isReadOnly={isPending || !!createdCollection}
                  name="collection-description"
                  value={description}
                  onChange={setDescription}
                >
                  <Label>{t("descriptionLabel")}</Label>
                  <Input maxLength={300} placeholder={t("descriptionPlaceholder")} />
                </TextField>
                {error ? (
                  <p role="alert" className="text-danger text-sm">
                    {error}
                  </p>
                ) : null}
                {isPending ? (
                  <p role="status" className="text-muted text-sm">
                    {createdCollection ? t("savingArticle") : t("creatingCollection")}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button isDisabled={isPending} slot="close" size="sm" variant="tertiary">
                  {createdCollection ? t("close") : t("cancel")}
                </Button>
                <Button isPending={isPending} size="sm" type="submit">
                  {createdCollection
                    ? isPending
                      ? t("savingArticle")
                      : t("retrySaving")
                    : t("createAndSave")}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
