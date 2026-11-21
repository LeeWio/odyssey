"use client";

import { Globe } from "@gravity-ui/icons";
import { Button, Dropdown, Label, Tooltip } from "@heroui/react";
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
      <Tooltip>
        <Button aria-label={t("switchLanguage")} isIconOnly variant="ghost">
          <Globe aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>{t("switchLanguage")}</Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover>
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
