"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { Map, useMap } from "@heroui-pro/react/map";
import type { DataDrivenPropertyValueSpecification, MapLayerMouseEvent } from "maplibre-gl";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { getFootprintMetaLabel, type Footprint } from "./footprints-data";
import { footprintMapStyles, footprintMapWorkerUrl } from "./map-styles";

const SOURCE_ID = "footprints-coverage-zones-source";
const FILL_LAYER_ID = "footprints-coverage-zones-fill";
const LINE_LAYER_ID = "footprints-coverage-zones-line";
const FOOTPRINT_BOUNDARIES_URL = "/data/footprints-boundaries.geojson";

const COVERAGE_COLORS: Record<string, { fill: string; stroke: string }> = {
  hubei: { fill: "#4285f4", stroke: "#2563eb" },
  shaanxi: { fill: "#a855f7", stroke: "#7e22ce" },
  guangzhou: { fill: "#22c55e", stroke: "#16a34a" },
  shenzhen: { fill: "#f97316", stroke: "#ea580c" },
  chongqing: { fill: "#06b6d4", stroke: "#0891b2" },
  anhui: { fill: "#eab308", stroke: "#ca8a04" },
  huizhou: { fill: "#ec4899", stroke: "#db2777" },
  henan: { fill: "#ef4444", stroke: "#dc2626" },
  hunan: { fill: "#6366f1", stroke: "#4f46e5" },
};

function getCoverageColor(id: string) {
  return COVERAGE_COLORS[id]?.fill ?? "#4285f4";
}

function getCoveragePaintExpression(
  property: "fill" | "stroke"
): DataDrivenPropertyValueSpecification<string> {
  return [
    "match",
    ["get", "id"],
    ...Object.entries(COVERAGE_COLORS).flatMap(([id, colors]) => [id, colors[property]]),
    property === "fill" ? "#4285f4" : "#2563eb",
  ] as unknown as DataDrivenPropertyValueSpecification<string>;
}

function getFirstSymbolLayer(map: NonNullable<ReturnType<typeof useMap>["map"]>) {
  return map.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
}

function FootprintCoverageZones({
  footprints,
  onSelect,
  interactive,
  selectedId,
}: {
  footprints: readonly Footprint[];
  onSelect?: (footprint: Footprint) => void;
  interactive: boolean;
  selectedId?: string | null;
}) {
  const { isLoaded, map } = useMap();

  useEffect(() => {
    if (!isLoaded || !map) return;

    const addLayers = () => {
      if (map.getSource(SOURCE_ID)) return;

      const beforeId = getFirstSymbolLayer(map);
      map.addSource(SOURCE_ID, { type: "geojson", data: FOOTPRINT_BOUNDARIES_URL });
      map.addLayer(
        {
          id: FILL_LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          filter: ["in", ["get", "id"], ["literal", footprints.map((item) => item.id)]],
          paint: {
            "fill-color": getCoveragePaintExpression("fill"),
            "fill-opacity": 0.16,
          },
        },
        beforeId
      );
      map.addLayer(
        {
          id: LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          filter: ["in", ["get", "id"], ["literal", footprints.map((item) => item.id)]],
          paint: {
            "line-color": getCoveragePaintExpression("stroke"),
            "line-opacity": 0.72,
            "line-width": 1.5,
          },
        },
        beforeId
      );
    };

    const handleClick = (event: MapLayerMouseEvent) => {
      const id = event.features?.[0]?.properties?.id;
      const footprint = footprints.find((item) => item.id === id);
      if (footprint) onSelect?.(footprint);
    };
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    if (map.isStyleLoaded()) {
      addLayers();
    } else {
      map.once("idle", addLayers);
    }

    if (interactive) {
      map.on("click", FILL_LAYER_ID, handleClick);
      map.on("mouseenter", FILL_LAYER_ID, handleMouseEnter);
      map.on("mouseleave", FILL_LAYER_ID, handleMouseLeave);
    }

    return () => {
      map.off("idle", addLayers);
      map.off("click", FILL_LAYER_ID, handleClick);
      map.off("mouseenter", FILL_LAYER_ID, handleMouseEnter);
      map.off("mouseleave", FILL_LAYER_ID, handleMouseLeave);
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      map.getCanvas().style.cursor = "";
    };
  }, [footprints, interactive, isLoaded, map, onSelect]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    if (!map.getLayer(FILL_LAYER_ID)) return;

    map.setPaintProperty(FILL_LAYER_ID, "fill-opacity", [
      "case",
      ["==", ["get", "id"], selectedId ?? ""],
      0.34,
      0.12,
    ]);
    map.setPaintProperty(LINE_LAYER_ID, "line-width", [
      "case",
      ["==", ["get", "id"], selectedId ?? ""],
      2.5,
      1.25,
    ]);
  }, [isLoaded, map, selectedId]);

  return null;
}

export type FootprintsMapProps = {
  footprints: readonly Footprint[];
  selectedId?: string | null;
  onSelect?: (footprint: Footprint) => void;
  /** Closes the map popup only; does not clear the selected memory. */
  onPopupClose?: () => void;
  compact?: boolean;
};

export function FootprintsMap({
  footprints,
  selectedId,
  onSelect,
  onPopupClose,
  compact = false,
}: FootprintsMapProps) {
  const t = useTranslations("Footprints");
  const selectedFootprint = compact
    ? null
    : (footprints.find((footprint) => footprint.id === selectedId) ?? null);

  return (
    <div
      data-testid="footprints-map-frame"
      className={`relative w-full overflow-hidden ${compact ? "h-[clamp(28rem,60svh,44rem)]" : "h-[72vh] min-h-[32rem] rounded-3xl"}`}
    >
      <Map
        aria-label={t("mapLabel")}
        center={[114, 28]} // China-wide view for the coverage zones.
        projection={{ type: "globe" }}
        styles={footprintMapStyles}
        workerUrl={footprintMapWorkerUrl}
        zoom={1.9}
      >
        <FootprintCoverageZones
          footprints={footprints}
          onSelect={compact ? undefined : onSelect}
          interactive={!compact}
          selectedId={selectedId}
        />

        {footprints.map((footprint) => {
          const isSelected = footprint.id === selectedId;

          return (
            <Map.Marker
              key={footprint.id}
              latitude={footprint.latitude}
              longitude={footprint.longitude}
              onClick={compact ? undefined : () => onSelect?.(footprint)}
            >
              <Map.MarkerContent>
                <Map.MarkerDot
                  color={
                    compact
                      ? getCoverageColor(footprint.id)
                      : isSelected
                        ? "#f59e0b"
                        : getCoverageColor(footprint.id)
                  }
                />
                <Map.MarkerLabel>{footprint.place}</Map.MarkerLabel>
              </Map.MarkerContent>
              <Map.MarkerTooltip>
                <span className="font-medium">{footprint.place}</span>
                <span className="text-background/70 ml-1">{footprint.year}</span>
              </Map.MarkerTooltip>
            </Map.Marker>
          );
        })}

        {selectedFootprint ? (
          <Map.Popup
            closeButton
            closeOnClick={false}
            focusAfterOpen={false}
            latitude={selectedFootprint.latitude}
            longitude={selectedFootprint.longitude}
            offset={18}
            onClose={onPopupClose}
          >
            <div className="flex w-56 flex-col gap-2 pr-4">
              <Chip size="sm" variant="soft" className="w-fit">
                {getFootprintMetaLabel(selectedFootprint)}
              </Chip>
              <Typography weight="semibold" className="text-sm leading-5 text-balance">
                {selectedFootprint.title}
              </Typography>
              <Typography color="muted" type="body-xs">
                {selectedFootprint.place}
              </Typography>
              <Typography color="muted" type="body-xs" className="leading-5">
                {selectedFootprint.memory}
              </Typography>
            </div>
          </Map.Popup>
        ) : null}

        <Map.Controls>
          <Map.ZoomControl />
          <Map.CompassControl />
          {!compact ? <Map.FullscreenControl /> : null}
        </Map.Controls>
      </Map>

      {!compact ? (
        <Card className="bg-overlay shadow-overlay absolute top-3 left-3 z-10 w-[260px] gap-3 p-4">
          <Card.Header>
            <Card.Title className="text-sm">{t("mapTitle")}</Card.Title>
            <Card.Description>{t("mapDescription")}</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <span>
                <strong className="text-foreground block text-base">{footprints.length}</strong>
                {t("places")}
              </span>
              <span>
                <strong className="text-foreground block text-base">{footprints.length}</strong>
                {t("zones")}
              </span>
              <span>
                <strong className="text-foreground block text-base">
                  {footprints.length ? Math.max(...footprints.map((item) => item.year)) : "-"}
                </strong>
                {t("latest")}
              </span>
            </div>
            <Chip size="sm" variant="soft" className="w-fit">
              {t("coverageHint")}
            </Chip>
          </Card.Content>
        </Card>
      ) : null}
    </div>
  );
}
