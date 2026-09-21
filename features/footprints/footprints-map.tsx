"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { Map } from "@heroui-pro/react/map";
import { useState } from "react";

import { getFootprintArcs, getFootprintsMapView, type Footprint } from "./footprints-data";
import { footprintMapStyles, footprintMapWorkerUrl } from "./map-styles";

export type FootprintsMapProps = {
  footprints: readonly Footprint[];
  selectedId?: string | null;
  onSelect?: (footprint: Footprint) => void;
  onClearSelection?: () => void;
  compact?: boolean;
};

export function FootprintsMap({
  footprints,
  selectedId,
  onSelect,
  onClearSelection,
  compact = false,
}: FootprintsMapProps) {
  const [hoveredArcId, setHoveredArcId] = useState<string | null>(null);
  const selectedFootprint = compact
    ? null
    : (footprints.find((footprint) => footprint.id === selectedId) ?? null);
  const arcs = getFootprintArcs(footprints);
  const selectedArc = arcs.find((arc) => arc.id === hoveredArcId);
  const mapView = getFootprintsMapView(footprints);

  return (
    <div
      data-testid="footprints-map-frame"
      className={`relative w-full overflow-hidden ${compact ? "h-[clamp(28rem,60svh,44rem)]" : "h-[min(70vh,42rem)] min-h-[32rem] rounded-3xl"}`}
    >
      <Map
        aria-label="Personal travel footprints map"
        center={mapView.center}
        projection={{ type: "globe" }}
        styles={footprintMapStyles}
        workerUrl={footprintMapWorkerUrl}
        zoom={mapView.zoom}
      >
        <Map.Arc
          curvature={0.34}
          data={arcs}
          hoverPaint={{ "line-opacity": 1, "line-width": 5 }}
          paint={{
            "line-color": ["get", "color"],
            "line-opacity": 0.74,
            "line-width": ["get", "width"],
          }}
          onHover={
            compact
              ? undefined
              : (event) => setHoveredArcId(event?.arc.id ? String(event.arc.id) : null)
          }
          onClick={
            compact
              ? undefined
              : (event) => {
                  const destination = footprints.find(
                    (footprint) => footprint.id === event.arc.toId
                  );
                  if (destination) onSelect?.(destination);
                }
          }
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
                <Map.MarkerDot color={compact ? "#4285f4" : isSelected ? "#f59e0b" : "#4285f4"} />
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
            onClose={onClearSelection}
          >
            <div className="w-56 space-y-2 pr-4 text-xs">
              <p className="font-medium">{selectedFootprint.place}</p>
              <p className="text-muted">
                {selectedFootprint.year} · {selectedFootprint.country}
              </p>
              <p className="text-muted leading-5">{selectedFootprint.memory}</p>
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
            <Card.Title className="text-sm">Footprints</Card.Title>
            <Card.Description>Places kept on the map</Card.Description>
          </Card.Header>
          <Card.Content className="gap-3">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <span>
                <strong className="text-foreground block text-base">{footprints.length}</strong>
                Places
              </span>
              <span>
                <strong className="text-foreground block text-base">{arcs.length}</strong>
                Paths
              </span>
              <span>
                <strong className="text-foreground block text-base">
                  {footprints.length ? Math.max(...footprints.map((item) => item.year)) : "—"}
                </strong>
                Latest
              </span>
            </div>
            {selectedArc ? (
              <div className="border-default-200 flex items-center gap-2 border-t pt-3 text-xs">
                <span
                  className="h-0.5 w-4 rounded-full"
                  style={{ backgroundColor: selectedArc.color }}
                />
                <Typography color="muted" type="body-xs" className="truncate">
                  {selectedArc.route}
                </Typography>
              </div>
            ) : (
              <Chip size="sm" variant="soft" className="w-fit">
                Hover a path to trace the route
              </Chip>
            )}
          </Card.Content>
        </Card>
      ) : null}
    </div>
  );
}
