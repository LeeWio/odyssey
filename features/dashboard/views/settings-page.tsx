"use client";

import type { FormEvent } from "react";

import { Button, Input, Label, Spinner, Switch, TextField } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { useState } from "react";

import { useGetAllConfigsQuery, useUpdateConfigMutation } from "@/lib/features/openapi/openapi-api";

type ConfigRecord = {
  id?: number;
  configKey?: string;
  configValue?: string;
  configName?: string;
  description?: string;
  isPublic?: boolean;
};

type EditableConfig = ConfigRecord &
  Required<Pick<ConfigRecord, "id" | "configKey" | "configName">>;

function isEditableConfig(config: ConfigRecord): config is EditableConfig {
  return Boolean(config.id && config.configKey && config.configName);
}

export function SettingsPage() {
  const { data, isError, isLoading, refetch } = useGetAllConfigsQuery();
  const configs = (Array.isArray(data) ? data : []) as ConfigRecord[];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 pt-4 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-lg font-semibold">System config</h1>
        <p className="text-muted text-sm">
          Keys stored by the admin config API. Each row saves on its own.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>Config is unavailable</EmptyState.Title>
            <EmptyState.Description>The admin config list did not load.</EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => refetch()} variant="secondary">
              Try again
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : configs.length === 0 ? (
        <EmptyState>
          <EmptyState.Header>
            <EmptyState.Title>No config keys yet</EmptyState.Title>
            <EmptyState.Description>
              The admin API returned an empty list. New keys are created from the API.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {configs.filter(isEditableConfig).map((config) => (
            <li key={config.id}>
              <ConfigRow config={config} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ConfigRow({ config }: { config: EditableConfig }) {
  const [value, setValue] = useState(config.configValue ?? "");
  const [isPublic, setIsPublic] = useState(Boolean(config.isPublic));
  const [updateConfig, { isLoading }] = useUpdateConfigMutation();
  const dirty = value !== (config.configValue ?? "") || isPublic !== Boolean(config.isPublic);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!dirty || isLoading) return;
    void updateConfig({
      id: config.id,
      body: {
        configKey: config.configKey,
        configName: config.configName,
        configValue: value,
        description: config.description,
        isPublic,
      },
    });
  };

  return (
    <form className="border-separator flex flex-col gap-3 border-b pb-4" onSubmit={save}>
      <div className="flex flex-col gap-1">
        <span className="text-foreground text-sm font-medium">{config.configName}</span>
        <span className="text-muted font-mono text-xs">{config.configKey}</span>
        {config.description ? <p className="text-muted text-xs">{config.description}</p> : null}
      </div>
      <TextField name={config.configKey} value={value} onChange={setValue}>
        <Label className="sr-only">{config.configName}</Label>
        <Input fullWidth />
      </TextField>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            aria-label={`Show ${config.configKey} on the public config API`}
            isSelected={isPublic}
            onChange={setIsPublic}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
          <span className="text-muted text-xs">Public config API</span>
        </div>
        <Button isDisabled={!dirty} isPending={isLoading} type="submit" variant="secondary">
          Save
        </Button>
      </div>
    </form>
  );
}
