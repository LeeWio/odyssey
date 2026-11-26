import { Label, ListBox, Select } from "@heroui/react";

const fontFamilies = [
  { label: "Default", value: "default" },
  { label: "Sans serif", value: "sans-serif" },
  { label: "Inter", value: "Inter" },
  { label: "Arial", value: "Arial" },
  { label: "Comic Sans MS", value: "Comic Sans MS, Comic Sans" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
  { label: "Monospace", value: "monospace" },
  { label: "Serif", value: "serif" },
];

export function FontFamilyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const current = fontFamilies.find((family) => family.value.toLowerCase() === value.toLowerCase());
  const options = value && !current ? [...fontFamilies, { label: value, value }] : fontFamilies;

  return (
    <Select
      className="col-span-2 grid grid-cols-subgrid items-center gap-y-0"
      fullWidth
      variant="secondary"
      value={current?.value ?? (value || "default")}
      onChange={(key) => {
        if (typeof key === "string") onChange(key === "default" ? "" : key);
      }}
    >
      <Label>Font family</Label>
      <Select.Trigger>
        <Select.Value className="truncate" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(({ label, value }) => (
            <ListBox.Item key={value} id={value} textValue={label}>
              <Label style={{ fontFamily: value === "default" ? undefined : value }}>{label}</Label>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
