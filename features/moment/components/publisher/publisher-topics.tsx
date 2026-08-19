"use client";

import { useState } from "react";
import { Button, Input, TextField } from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  MOMENT_TOPIC_LIMIT,
  MOMENT_TOPIC_SLUG_LIMIT,
  normalizeMomentTopicSlug,
} from "../../utils/topic-slug";

interface PublisherTopicsProps {
  topics: string[];
  onAddTopic: (topic: string) => void;
  onRemoveTopic: (topic: string) => void;
}

export const PublisherTopics = ({ topics, onAddTopic, onRemoveTopic }: PublisherTopicsProps) => {
  const [input, setInput] = useState("");
  const normalizedTopic = normalizeMomentTopicSlug(input);
  const canAdd =
    Boolean(normalizedTopic) &&
    topics.length < MOMENT_TOPIC_LIMIT &&
    !topics.includes(normalizedTopic);

  const addTopic = () => {
    if (!canAdd) return;
    onAddTopic(normalizedTopic);
    setInput("");
  };

  return (
    <div className="border-default-200 flex flex-wrap items-center gap-2 border-t pt-3">
      {topics.map((topic) => (
        <span
          key={topic}
          className="bg-accent/10 text-accent flex h-8 items-center gap-1 rounded-md px-2 text-sm"
        >
          <Icon icon="gravity-ui:hashtag" className="size-3.5" />
          <span>{topic}</span>
          <Button
            isIconOnly
            aria-label={`Remove topic ${topic}`}
            className="-mr-1 size-5 min-w-5"
            size="sm"
            variant="ghost"
            onPress={() => onRemoveTopic(topic)}
          >
            <Icon icon="gravity-ui:xmark" className="size-3" />
          </Button>
        </span>
      ))}

      {topics.length < MOMENT_TOPIC_LIMIT && (
        <div className="flex min-w-50 flex-1 items-center gap-1">
          <TextField
            aria-label="Add a topic"
            className="min-w-0 flex-1"
            name="moment-topic"
            variant="secondary"
          >
            <Input
              maxLength={MOMENT_TOPIC_SLUG_LIMIT + 1}
              placeholder="#Topic"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTopic();
                }
              }}
            />
          </TextField>
          <Button
            isIconOnly
            aria-label="Add topic"
            isDisabled={!canAdd}
            size="sm"
            variant="tertiary"
            onPress={addTopic}
          >
            <Icon icon="gravity-ui:plus" className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
