"use client";

import { Button, Typography } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import { type PostCollectionResponse, useGetPostCollectionsQuery } from "@/lib/features/library";

import { CollectionFormDialog, DeleteCollectionDialog } from "./collection-management-dialogs";
import { CollectionContents } from "./collection-contents";
import { CollectionCard, EmptyLibrarySection, LibrarySkeleton } from "./library-cards";

export function CollectionsSection() {
  const [collectionForm, setCollectionForm] = useState<{
    collection: PostCollectionResponse | null;
  } | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionPendingDeletion, setCollectionPendingDeletion] =
    useState<PostCollectionResponse | null>(null);
  const collections = useGetPostCollectionsQuery();
  const selectedCollection = collections.data?.find(
    (collection) => collection.id === selectedCollectionId
  );

  return (
    <>
      <section aria-labelledby="collections-title" className="mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Typography id="collections-title" type="h2" weight="semibold">
              Collections
            </Typography>
            <Typography color="muted" type="body-sm" className="mt-1">
              Group the writing you want to keep together.
            </Typography>
          </div>
          <Button size="sm" onPress={() => setCollectionForm({ collection: null })}>
            <Icon icon="gravity-ui:circle-plus" aria-hidden="true" className="size-4" />
            New collection
          </Button>
        </div>

        {collections.isLoading ? (
          <LibrarySkeleton />
        ) : collections.isError ? (
          <EmptyLibrarySection
            title="Collections are unavailable"
            description="Try loading this page again in a moment."
          />
        ) : (collections.data?.length ?? 0) > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {collections.data?.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                isSelected={collection.id === selectedCollectionId}
                onDelete={setCollectionPendingDeletion}
                onEdit={(next) => setCollectionForm({ collection: next })}
                onSelect={setSelectedCollectionId}
              />
            ))}
          </div>
        ) : (
          <EmptyLibrarySection
            title="Start your first collection"
            description="Create a collection from an article to gather related reading in one place."
          />
        )}

        {selectedCollection ? (
          <div
            role="region"
            aria-label={`Articles in ${selectedCollection.name}`}
            className="border-default-200 mt-8 border-t pt-8"
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Typography type="h3" weight="semibold">
                  {selectedCollection.name}
                </Typography>
                {selectedCollection.description ? (
                  <Typography color="muted" type="body-sm" className="mt-1">
                    {selectedCollection.description}
                  </Typography>
                ) : null}
              </div>
              <Button size="sm" variant="ghost" onPress={() => setSelectedCollectionId(null)}>
                Close
              </Button>
            </div>

            <CollectionContents key={selectedCollection.id} collection={selectedCollection} />
          </div>
        ) : null}
      </section>

      {collectionForm ? (
        <CollectionFormDialog
          key={collectionForm.collection?.id ?? "new"}
          collection={collectionForm.collection}
          onClose={() => setCollectionForm(null)}
          onSaved={(collection) => {
            setSelectedCollectionId(collection.id);
            setCollectionForm(null);
          }}
        />
      ) : null}
      {collectionPendingDeletion ? (
        <DeleteCollectionDialog
          key={collectionPendingDeletion.id}
          collection={collectionPendingDeletion}
          onClose={() => setCollectionPendingDeletion(null)}
          onDeleted={(collectionId) => {
            setSelectedCollectionId((current) => (current === collectionId ? null : current));
            setCollectionPendingDeletion(null);
          }}
        />
      ) : null}
    </>
  );
}
