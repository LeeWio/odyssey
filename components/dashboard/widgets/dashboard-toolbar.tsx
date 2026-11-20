"use client";

import { ArrowsRotateLeft, Calendar, ChevronDown } from "@gravity-ui/icons";
import { Button, ButtonGroup, Dropdown, Label, Tabs } from "@heroui/react";
import { useTranslations } from "next-intl";
import { baseApi } from "@/lib/api";
import { useAppDispatch } from "@/lib/hooks";

import { useSheetPortal } from "../use-sheet-portal";
import { IconButton } from "../icon-button";

export function DashboardToolbar() {
  const portalContainer = useSheetPortal();
  const t = useTranslations("Dashboard");
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Tabs defaultSelectedKey="overview">
        <Tabs.ListContainer>
          <Tabs.List aria-label={t("overview.tabs")}>
            <Tabs.Tab id="overview">
              {t("common.overview")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="sales">
              {t("common.sales")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="expenses">
              {t("common.expenses")}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton
          label={t("common.refresh")}
          size="sm"
          variant="tertiary"
          onPress={() => dispatch(baseApi.util.invalidateTags(["Dashboard"]))}
        >
          <ArrowsRotateLeft className="size-4" />
        </IconButton>
        <ButtonGroup size="sm" variant="tertiary">
          <Button>
            <Calendar className="size-4" />
            Monthly
          </Button>
          <Dropdown>
            <Button isIconOnly aria-label={t("common.changePeriod")} size="sm" variant="tertiary">
              <ChevronDown className="size-4" />
            </Button>
            <Dropdown.Popover
              UNSTABLE_portalContainer={portalContainer || undefined}
              placement="bottom end"
            >
              <Dropdown.Menu>
                <Dropdown.Item id="daily" textValue={t("common.daily")}>
                  <Label>{t("common.daily")}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="weekly" textValue={t("common.weekly")}>
                  <Label>{t("common.weekly")}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="monthly" textValue={t("common.monthly")}>
                  <Label>{t("common.monthly")}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="yearly" textValue={t("common.yearly")}>
                  <Label>{t("common.yearly")}</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </ButtonGroup>
        <Button size="sm">{t("common.download")}</Button>
      </div>
    </div>
  );
}
