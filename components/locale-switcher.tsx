"use client";

import { Dropdown, Label } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { LOCALE_COOKIE_NAME, locales, type AppLocale } from "@/i18n/config";
import { baseApi } from "@/lib/api";
import { setLocale as setLocaleState } from "@/lib/features/locale";
import { useAppDispatch } from "@/lib/hooks";

export function LocaleSwitcher() {
  const currentLocale = useLocale() as AppLocale;
  const t = useTranslations("Nav");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === currentLocale) return;
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = nextLocale;
    dispatch(setLocaleState(nextLocale));
    dispatch(baseApi.util.resetApiState());
    router.refresh();
  };

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label={t("switchLanguage")}>
        <Icon aria-hidden="true" icon="lucide:languages" className="size-4" />
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-44">
        <Dropdown.Menu
          aria-label={t("language")}
          selectedKeys={new Set([currentLocale])}
          selectionMode="single"
          onAction={(key) => changeLocale(String(key) as AppLocale)}
        >
          {locales.map((locale) => (
            <Dropdown.Item
              key={locale}
              id={locale}
              textValue={locale === "en" ? t("languageEnglish") : t("languageChinese")}
            >
              <Label>{locale === "en" ? t("languageEnglish") : t("languageChinese")}</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
