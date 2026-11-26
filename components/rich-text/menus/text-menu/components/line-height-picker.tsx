import { Label, ListBox, Select } from "@heroui/react";

const lineHeights = [
  { id: "default", label: "Default" },
  { id: "1", label: "Single" },
  { id: "1.15", label: "1.15" },
  { id: "1.25", label: "1.25" },
  { id: "1.5", label: "1.5" },
  { id: "1.8", label: "1.8" },
  { id: "2", label: "Double" },
  { id: "2.5", label: "2.5" },
  { id: "3", label: "3" },
];

export function LineHeightPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options =
    value && !lineHeights.some(({ id }) => id === value)
      ? [...lineHeights, { id: value, label: value }]
      : lineHeights;

  return (
    <Select
      className="col-span-2 grid grid-cols-subgrid items-center gap-y-0"
      fullWidth
      variant="secondary"
      value={value || "default"}
      onChange={(key) => {
        if (typeof key === "string") onChange(key === "default" ? "" : key);
      }}
    >
      <Label>Line height</Label>
      <Select.Trigger>
        <Select.Value className="tabular-nums" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(({ id, label }) => (
            <ListBox.Item key={id} id={id} textValue={label}>
              <Label className="tabular-nums">{label}</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
