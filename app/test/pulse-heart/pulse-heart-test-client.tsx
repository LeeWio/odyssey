"use client";

import { Segment } from "@heroui-pro/react";
import { Button, Label, ListBox, Select, Slider, Switch, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

import {
  ReactionButton,
  type ReactionIcon,
  type ReactionColor,
  type ReactionButtonProps,
  type ReactionVariant,
} from "@/components/ui/reaction-button";

const ICONS = [
  { id: "heart", label: "爱心", icon: "gravity-ui:heart" },
  { id: "star", label: "星星", icon: "gravity-ui:star" },
  { id: "thumb", label: "点赞", icon: "gravity-ui:thumbs-up" },
] as const;

const COLORS = [
  { label: "Accent", value: "accent", swatch: "bg-accent text-accent-foreground" },
  { label: "Success", value: "success", swatch: "bg-success text-success-foreground" },
  { label: "Warning", value: "warning", swatch: "bg-warning text-warning-foreground" },
  { label: "Danger", value: "danger", swatch: "bg-danger text-danger-foreground" },
] as const;

const ICON_COLORS = [
  ...COLORS,
  { label: "Foreground", value: "foreground", swatch: "bg-foreground text-background" },
  { label: "Muted", value: "muted", swatch: "bg-muted text-background" },
  {
    label: "Inherit",
    value: "inherit",
    swatch: "border border-dashed border-current text-foreground",
  },
] as const;

const VARIANTS = [
  "ghost",
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "danger",
  "danger-soft",
] as const satisfies readonly ReactionVariant[];

const EXAMPLES = [
  { id: "default", title: "默认", icon: "heart", count: 128, label: "默认爱心" },
  {
    id: "star",
    title: "星星",
    icon: "star",
    selectedColor: "warning",
    selectedVariant: "tertiary",
    count: 99,
    label: "星星示例",
  },
  {
    id: "thumb",
    title: "点赞",
    icon: "thumb",
    selectedColor: "accent",
    selectedVariant: "primary",
    count: 999,
    label: "点赞示例",
  },
  {
    id: "liked",
    title: "已点赞",
    icon: "heart",
    count: 129,
    initialSelected: true,
    selectedVariant: "danger-soft",
    label: "已点赞示例",
  },
  {
    id: "icon-only",
    title: "仅图标",
    icon: "heart",
    selectedVariant: "danger",
    showCount: false,
    label: "仅图标示例",
  },
  {
    id: "disabled",
    title: "已禁用",
    icon: "heart",
    count: 128,
    isDisabled: true,
    label: "禁用示例",
  },
] as const;

function VariantSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ReactionVariant;
  onChange: (value: ReactionVariant) => void;
}) {
  return (
    <Select
      fullWidth
      value={value}
      onChange={(key) => {
        const next = VARIANTS.find((variant) => variant === key);
        if (next) onChange(next);
      }}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {VARIANTS.map((variant) => (
            <ListBox.Item key={variant} id={variant} textValue={variant}>
              {variant}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function ColorSetting<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { label: string; value: T; swatch: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">{label}</h2>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((item) => (
          <Tooltip key={item.value} delay={300}>
            <Button
              isIconOnly
              size="sm"
              variant="tertiary"
              aria-label={item.label}
              aria-pressed={value === item.value}
              onPress={() => onChange(item.value)}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full ${item.swatch}`}
              >
                {value === item.value ? (
                  <Icon icon="gravity-ui:check" className="size-3" aria-hidden="true" />
                ) : null}
              </span>
            </Button>
            <Tooltip.Content>{item.label}</Tooltip.Content>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function SettingSwitch({
  label,
  selected,
  onChange,
}: {
  label: string;
  selected: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch isSelected={selected} onChange={onChange} size="sm">
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Content>
        <Label>{label}</Label>
      </Switch.Content>
    </Switch>
  );
}

function ReactionExample({
  initialSelected = false,
  count = 0,
  ...props
}: Omit<ReactionButtonProps, "selected" | "onSelectedChange"> & { initialSelected?: boolean }) {
  const [reaction, setReaction] = useState({ selected: initialSelected, count });
  return (
    <ReactionButton
      {...props}
      {...reaction}
      onSelectedChange={(selected) => {
        setReaction((previous) => ({
          selected,
          count: Math.max(0, previous.count + (selected ? 1 : -1)),
        }));
        return true;
      }}
    />
  );
}

export default function PulseHeartTestClient() {
  const [icon, setIcon] = useState<ReactionIcon>("heart");
  const [likedColor, setLikedColor] = useState<ReactionColor>("danger");
  const [idleColor, setIdleColor] = useState<ReactionColor>("muted");
  const [idleVariant, setIdleVariant] = useState<ReactionVariant>("ghost");
  const [likedVariant, setLikedVariant] = useState<ReactionVariant>("danger-soft");
  const [size, setSize] = useState<NonNullable<ReactionButtonProps["size"]>>("md");
  const [duration, setDuration] = useState(560);
  const [showCount, setShowCount] = useState(true);
  const [idleOutline, setIdleOutline] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [reaction, setReaction] = useState({ liked: false, count: 128 });
  const [revision, setRevision] = useState(0);

  const reset = () => {
    setIcon("heart");
    setLikedColor("danger");
    setIdleColor("muted");
    setIdleVariant("ghost");
    setLikedVariant("danger-soft");
    setSize("md");
    setDuration(560);
    setShowCount(true);
    setIdleOutline(true);
    setDisabled(false);
    setReaction({ liked: false, count: 128 });
    setRevision((value) => value + 1);
  };

  return (
    <main
      id="main-content"
      className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
    >
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted mb-2 text-sm">组件实验室 / 01</p>
          <h1 className="text-3xl font-semibold">Pulse Heart</h1>
        </div>
        <Tooltip delay={300}>
          <Button isIconOnly aria-label="重置全部" variant="tertiary" onPress={reset}>
            <Icon icon="gravity-ui:arrow-rotate-left" aria-hidden="true" className="size-4" />
          </Button>
          <Tooltip.Content>重置全部</Tooltip.Content>
        </Tooltip>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
        <section
          aria-labelledby="preview-heading"
          className="bg-surface-secondary text-foreground flex min-h-80 min-w-0 flex-col p-6 sm:min-h-96 sm:p-8 lg:sticky lg:top-8 lg:self-start"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="preview-heading" className="text-muted text-sm font-medium">
              实时预览
            </h2>
            <span className="text-muted font-mono text-xs">{icon}</span>
          </div>
          <div
            data-testid="pulse-preview"
            className="flex min-h-56 flex-1 items-center justify-center py-12"
          >
            <ReactionButton
              key={revision}
              icon={icon}
              selected={reaction.liked}
              count={reaction.count}
              onSelectedChange={(liked) => {
                setReaction((previous) => ({ liked, count: previous.count + (liked ? 1 : -1) }));
                return true;
              }}
              selectedColor={likedColor}
              idleColor={idleColor}
              idleVariant={idleVariant}
              selectedVariant={likedVariant}
              size={size}
              duration={duration}
              showCount={showCount}
              idleOutline={idleOutline}
              isDisabled={disabled}
              label="预览点赞"
            />
          </div>
          <div className="border-separator text-muted flex items-center justify-between gap-4 border-t pt-5 text-xs">
            <span role="status" aria-live="polite" aria-atomic="true">
              {disabled ? "已禁用" : reaction.liked ? "已点赞" : "未点赞"} · {reaction.count}
            </span>
            <span className="font-mono tabular-nums">
              {size} / {duration}ms
            </span>
          </div>
        </section>

        <aside
          aria-label="预览设置"
          className="grid min-w-0 content-start gap-7 sm:grid-cols-2 lg:grid-cols-1"
        >
          <div className="space-y-3">
            <h2 className="text-sm font-medium">图标</h2>
            <Segment
              aria-label="图标"
              selectedKey={icon}
              onSelectionChange={(key) => {
                if (key === "heart" || key === "star" || key === "thumb") setIcon(key);
              }}
            >
              {ICONS.map((item) => (
                <Segment.Item key={item.id} id={item.id}>
                  <Icon icon={item.icon} className="size-4" aria-hidden="true" />
                  {item.label}
                </Segment.Item>
              ))}
            </Segment>
          </div>

          <ColorSetting
            label="选中颜色"
            value={likedColor}
            options={ICON_COLORS}
            onChange={setLikedColor}
          />
          <ColorSetting
            label="未选中颜色"
            value={idleColor}
            options={ICON_COLORS}
            onChange={setIdleColor}
          />
          <VariantSetting label="未点赞外观" value={idleVariant} onChange={setIdleVariant} />
          <VariantSetting label="已点赞外观" value={likedVariant} onChange={setLikedVariant} />

          <div className="space-y-3">
            <h2 className="text-sm font-medium">按钮尺寸</h2>
            <Segment
              aria-label="按钮尺寸"
              selectedKey={size}
              onSelectionChange={(key) => {
                if (key === "sm" || key === "md" || key === "lg") setSize(key);
              }}
            >
              {(["sm", "md", "lg"] as const).map((value) => (
                <Segment.Item key={value} id={value}>
                  {value}
                </Segment.Item>
              ))}
            </Segment>
          </div>

          <Slider
            value={duration}
            minValue={160}
            maxValue={1000}
            step={20}
            onChange={(value) => setDuration(Array.isArray(value) ? value[0] : value)}
          >
            <Label>动画时长 (ms)</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>

          <div className="flex flex-col gap-4">
            <SettingSwitch label="显示计数" selected={showCount} onChange={setShowCount} />
            <SettingSwitch label="未选中时空心" selected={idleOutline} onChange={setIdleOutline} />
            <SettingSwitch label="禁用交互" selected={disabled} onChange={setDisabled} />
          </div>
        </aside>
      </div>

      <section aria-labelledby="sizes-heading" className="border-separator mt-10 border-t pt-6">
        <h2 id="sizes-heading" className="mb-5 text-sm font-medium">
          尺寸对比
        </h2>
        <div key={revision} className="grid grid-cols-3 gap-2 sm:gap-6">
          {(["sm", "md", "lg"] as const).map((size) => (
            <div
              key={size}
              data-testid={`size-${size}`}
              className="flex min-w-0 flex-col items-center gap-4"
            >
              <div className="flex h-20 w-full items-center justify-center">
                <ReactionExample
                  initialSelected
                  count={128}
                  size={size}
                  label={`${size} 尺寸示例`}
                />
              </div>
              <h3 className="text-muted text-xs">{size}</h3>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="examples-heading" className="border-separator mt-8 border-t pt-6">
        <h2 id="examples-heading" className="mb-5 text-sm font-medium">
          状态与变体
        </h2>
        <div
          key={revision}
          className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6"
        >
          {EXAMPLES.map(({ id, title, ...props }) => (
            <div
              key={id}
              data-testid={`example-${id}`}
              className="flex min-w-0 flex-col items-center gap-4"
            >
              <div className="flex h-20 w-full items-center justify-center">
                <ReactionExample {...props} size="sm" />
              </div>
              <h3 className="text-muted text-xs">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="variants-heading" className="border-separator mt-8 border-t pt-6">
        <h2 id="variants-heading" className="mb-5 text-sm font-medium">
          选中外观
        </h2>
        <div
          key={revision}
          className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-7"
        >
          {VARIANTS.map((variant) => (
            <div
              key={variant}
              data-testid={`variant-${variant}`}
              className="flex min-w-0 flex-col items-center gap-4"
            >
              <div className="flex h-20 w-full items-center justify-center">
                <ReactionExample
                  initialSelected
                  count={128}
                  selectedVariant={variant}
                  size="sm"
                  label={`${variant} 示例`}
                />
              </div>
              <h3 className="text-muted text-xs">{variant}</h3>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
