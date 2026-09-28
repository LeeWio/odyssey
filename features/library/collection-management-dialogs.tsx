"use client";

import {
  AlertDialog,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
} from "@heroui/react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  type PostCollectionResponse,
  useCreatePostCollectionMutation,
  useDeletePostCollectionMutation,
  useUpdatePostCollectionMutation,
} from "@/lib/features/library";
import { useTranslations } from "next-intl";

/** Mount a fresh form for each explicit create/edit action. */
export function CollectionFormDialog({
  collection,
  onClose,
  onSaved,
}: {
  collection: PostCollectionResponse | null;
  onClose: () => void;
  onSaved: (collection: PostCollectionResponse) => void;
}) {
  const t = useTranslations("Library");
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  const [createCollection] = useCreatePostCollectionMutation();
  const [updateCollection] = useUpdatePostCollectionMutation();

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!active.current || pending.current || !name.trim()) return;
    pending.current = true;
    setIsPending(true);
    setError(null);
    const body = { name: name.trim(), description: description.trim() || undefined };
    try {
      const saved = collection
        ? await updateCollection({ collectionId: collection.id, body }).unwrap()
        : await createCollection(body).unwrap();
      if (active.current) onSaved(saved);
    } catch {
      if (active.current) {
        setError(t("saveFailed"));
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
            <Form onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>
                  {collection ? t("editCollection") : t("createCollection")}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4 py-4">
                <TextField
                  isRequired
                  isReadOnly={isPending}
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
                  isReadOnly={isPending}
                  name="collection-description"
                  value={description}
                  onChange={setDescription}
                >
                  <Label>{t("descriptionLabel")}</Label>
                  <TextArea maxLength={300} placeholder={t("descriptionPlaceholder")} rows={3} />
                </TextField>
                {error ? (
                  <p role="alert" className="text-danger text-sm">
                    {error}
                  </p>
                ) : null}
                {isPending ? (
                  <p role="status" className="text-muted text-sm">
                    {t("savingCollection")}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button isDisabled={isPending} slot="close" size="sm" variant="tertiary">
                  {t("cancel")}
                </Button>
                <Button isPending={isPending} isDisabled={isPending} size="sm" type="submit">
                  {collection ? t("saveChanges") : t("createCollection")}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function DeleteCollectionDialog({
  collection,
  onClose,
  onDeleted,
}: {
  collection: PostCollectionResponse;
  onClose: () => void;
  onDeleted: (collectionId: number) => void;
}) {
  const t = useTranslations("Library");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  const [deleteCollection] = useDeletePostCollectionMutation();

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const handleDelete = async () => {
    if (!active.current || pending.current) return;
    pending.current = true;
    setIsPending(true);
    setError(null);
    try {
      await deleteCollection(collection.id).unwrap();
      if (active.current) onDeleted(collection.id);
    } catch {
      if (active.current) setError(t("deleteFailed"));
    } finally {
      pending.current = false;
      if (active.current) setIsPending(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen
        isDismissable={false}
        isKeyboardDismissDisabled={isPending}
        onOpenChange={(open) => {
          if (!open && !pending.current) onClose();
        }}
        variant="blur"
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.CloseTrigger isDisabled={isPending} />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>{t("deleteTitle")}</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm">{t("deleteHint", { name: collection.name })}</p>
              {error ? (
                <p role="alert" className="text-danger mt-3 text-sm">
                  {error}
                </p>
              ) : null}
              {isPending ? (
                <p role="status" className="text-muted mt-3 text-sm">
                  {t("deletingCollection")}
                </p>
              ) : null}
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button isDisabled={isPending} slot="close" size="sm" variant="tertiary">
                {t("cancel")}
              </Button>
              <Button
                isDisabled={isPending}
                isPending={isPending}
                size="sm"
                variant="danger"
                onPress={handleDelete}
              >
                {t("deleteCollection")}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
