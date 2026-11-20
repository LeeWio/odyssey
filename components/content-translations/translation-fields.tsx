"use client";

import { Chip, Input, Label, Tabs, TextArea, TextField, Typography } from "@heroui/react";
import { useTranslations } from "next-intl";

import { locales, type AppLocale } from "@/i18n/config";

export type TranslationFieldValue = string | undefined;
export type TranslationFieldValues = Record<string, TranslationFieldValue>;

export interface TranslationFieldDefinition {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}

export type TranslationValues = Partial<Record<AppLocale, TranslationFieldValues>>;

interface TranslationFieldsProps {
  fields: TranslationFieldDefinition[];
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
  onChange: (locale: AppLocale, field: string, value: string) => void;
  values: TranslationValues;
}

export function TranslationFields({
  fields,
  locale,
  onLocaleChange,
  onChange,
  values,
}: TranslationFieldsProps) {
  const t = useTranslations("ContentTranslations");
  const currentValues = values[locale] ?? {};

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography className="text-sm font-semibold">{t("title")}</Typography>
            <Typography className="text-muted text-xs">{t("description")}</Typography>
          </div>
          <Chip size="sm" variant="soft">
            {t(locale === "zh" ? "source" : "translation")}
          </Chip>
        </div>
        <Tabs
          aria-label={t("language")}
          className="w-full"
          selectedKey={locale}
          variant="secondary"
          onSelectionChange={(key) => onLocaleChange(String(key) as AppLocale)}
        >
          <Tabs.List>
            {locales.map((item) => (
              <Tabs.Tab key={item} id={item}>
                {t(`locale.${item}`)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      </div>

      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <TextField
            key={field.key}
            isRequired={field.required && locale === "zh"}
            name={`${locale}-${field.key}`}
            value={currentValues[field.key] ?? ""}
            variant="secondary"
            onChange={(value) => onChange(locale, field.key, value)}
          >
            <Label className="text-sm font-medium">{field.label}</Label>
            {field.multiline ? (
              <TextArea className="min-h-20" placeholder={field.placeholder} />
            ) : (
              <Input placeholder={field.placeholder} />
            )}
          </TextField>
        ))}
      </div>
    </div>
  );
}

export function compactTranslations(values: TranslationValues, requiredField?: string) {
  const result: Record<string, Record<string, string>> = {};

  for (const [locale, fields] of Object.entries(values)) {
    if (!fields) continue;
    const compactFields = Object.fromEntries(
      Object.entries(fields)
        .map(([key, value]) => [key, value?.trim() ?? ""])
        .filter(([, value]) => value.length > 0)
    );
    if (Object.keys(compactFields).length > 0 && (!requiredField || compactFields[requiredField])) {
      result[locale] = compactFields;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function translationValues(
  translations: Record<string, Record<string, string | undefined>> | undefined,
  fields: TranslationFieldDefinition[]
): TranslationValues {
  return Object.fromEntries(
    locales
      .filter((locale) => locale !== "zh")
      .map((locale) => [
        locale,
        Object.fromEntries(fields.map(({ key }) => [key, translations?.[locale]?.[key] ?? ""])),
      ])
  );
}
