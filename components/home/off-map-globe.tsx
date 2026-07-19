"use client";

import { Avatar } from "@heroui/react";
import { Map } from "@heroui-pro/react";

const demoMapStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
};

const AVATAR_BASE_URL = "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars";

const visitors = [
  {
    avatar: `${AVATAR_BASE_URL}/blue.jpg`,
    city: "London",
    fallback: "LN",
    latitude: 51.5072,
    longitude: -0.1276,
    name: "Visitor from London",
  },
  {
    avatar: `${AVATAR_BASE_URL}/red.jpg`,
    city: "Paris",
    fallback: "PA",
    latitude: 48.8566,
    longitude: 2.3522,
    name: "Visitor from Paris",
  },
  {
    avatar: `${AVATAR_BASE_URL}/purple.jpg`,
    city: "Berlin",
    fallback: "BE",
    latitude: 52.52,
    longitude: 13.405,
    name: "Visitor from Berlin",
  },
  {
    avatar: `${AVATAR_BASE_URL}/green.jpg`,
    city: "Madrid",
    fallback: "MA",
    latitude: 40.4168,
    longitude: -3.7038,
    name: "Visitor from Madrid",
  },
  {
    avatar: `${AVATAR_BASE_URL}/orange.jpg`,
    city: "Rome",
    fallback: "RO",
    latitude: 41.9028,
    longitude: 12.4964,
    name: "Visitor from Rome",
  },
  {
    avatar: `${AVATAR_BASE_URL}/white.jpg`,
    city: "Kyiv",
    fallback: "KY",
    latitude: 50.4501,
    longitude: 30.5234,
    name: "Visitor from Kyiv",
  },
  {
    avatar: `${AVATAR_BASE_URL}/blue-light.jpg`,
    city: "Cairo",
    fallback: "CA",
    latitude: 30.0444,
    longitude: 31.2357,
    name: "Visitor from Cairo",
  },
  {
    avatar: `${AVATAR_BASE_URL}/red.jpg`,
    city: "Istanbul",
    fallback: "IS",
    latitude: 41.0082,
    longitude: 28.9784,
    name: "Visitor from Istanbul",
  },
  {
    avatar: `${AVATAR_BASE_URL}/purple.jpg`,
    city: "Dubai",
    fallback: "DU",
    latitude: 25.2048,
    longitude: 55.2708,
    name: "Visitor from Dubai",
  },
  {
    avatar: `${AVATAR_BASE_URL}/green.jpg`,
    city: "Riyadh",
    fallback: "RI",
    latitude: 24.7136,
    longitude: 46.6753,
    name: "Visitor from Riyadh",
  },
  {
    avatar: `${AVATAR_BASE_URL}/blue.jpg`,
    city: "New York",
    fallback: "NY",
    latitude: 40.7128,
    longitude: -74.006,
    name: "Visitor from New York",
  },
  {
    avatar: `${AVATAR_BASE_URL}/orange.jpg`,
    city: "San Francisco",
    fallback: "SF",
    latitude: 37.7749,
    longitude: -122.4194,
    name: "Visitor from San Francisco",
  },
  {
    avatar: `${AVATAR_BASE_URL}/green.jpg`,
    city: "Mexico City",
    fallback: "MX",
    latitude: 19.4326,
    longitude: -99.1332,
    name: "Visitor from Mexico City",
  },
  {
    avatar: `${AVATAR_BASE_URL}/purple.jpg`,
    city: "Bogota",
    fallback: "BO",
    latitude: 4.711,
    longitude: -74.0721,
    name: "Visitor from Bogota",
  },
  {
    avatar: `${AVATAR_BASE_URL}/red.jpg`,
    city: "Sao Paulo",
    fallback: "SP",
    latitude: -23.5558,
    longitude: -46.6396,
    name: "Visitor from Sao Paulo",
  },
  {
    avatar: `${AVATAR_BASE_URL}/white.jpg`,
    city: "Buenos Aires",
    fallback: "BA",
    latitude: -34.6037,
    longitude: -58.3816,
    name: "Visitor from Buenos Aires",
  },
];

const groupedVisitors = [
  { count: 5, latitude: 53.3498, longitude: -6.2603 },
  { count: 3, latitude: 38.7223, longitude: -9.1393 },
  { count: 4, latitude: 43.6532, longitude: -79.3832 },
];

type OffMapGlobeProps = {
  variant?: "card" | "panel";
};

export function OffMapGlobe({ variant = "card" }: OffMapGlobeProps) {
  const isPanel = variant === "panel";

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className={
          isPanel
            ? "absolute top-1/2 right-[2%] size-[min(58vw,38rem)] -translate-y-1/2 overflow-hidden rounded-full border border-[#67516e]/25 bg-[#ddd7df] shadow-[0_28px_72px_rgba(64,45,70,.2)]"
            : "absolute -right-12 -bottom-16 size-64 overflow-hidden rounded-full border border-[#67516e]/25 bg-[#ddd7df] shadow-[0_16px_38px_rgba(64,45,70,.18)]"
        }
      >
        <Map
          aria-label="Places and people around the world"
          center={[18, 34]}
          projection={{ type: "globe" }}
          styles={demoMapStyles}
          zoom={isPanel ? 1.35 : 0.65}
        >
          {visitors.map((visitor) => (
            <Map.Marker
              key={visitor.city}
              latitude={visitor.latitude}
              longitude={visitor.longitude}
            >
              <Map.MarkerContent>
                <Avatar className="ring-2 ring-white" size="sm">
                  <Avatar.Image alt={visitor.name} src={visitor.avatar} />
                  <Avatar.Fallback>{visitor.fallback}</Avatar.Fallback>
                </Avatar>
              </Map.MarkerContent>
              <Map.MarkerTooltip>
                <span className="font-medium">{visitor.city}</span>
                <span className="text-background/70 ml-1">Active now</span>
              </Map.MarkerTooltip>
            </Map.Marker>
          ))}

          {groupedVisitors.map((group) => (
            <Map.Marker
              key={`${group.latitude}-${group.longitude}`}
              latitude={group.latitude}
              longitude={group.longitude}
            >
              <Map.MarkerContent>
                <span className="flex size-6 items-center justify-center rounded-full bg-[#8b5cf6] text-xs font-medium text-white ring-2 ring-white">
                  {group.count}
                </span>
              </Map.MarkerContent>
              <Map.MarkerTooltip>
                <span className="font-medium">{group.count} visitors</span>
              </Map.MarkerTooltip>
            </Map.Marker>
          ))}
        </Map>
      </div>

      <div
        className={`bg-foreground text-background absolute z-10 flex items-center gap-2 rounded-full font-medium shadow-lg ${
          isPanel
            ? "right-[8%] bottom-[8%] px-4 py-2 text-xs"
            : "right-2 bottom-2 px-2.5 py-1 text-[10px]"
        }`}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-[#22c55e]" />
        </span>
        28 visitors online
      </div>
    </div>
  );
}
