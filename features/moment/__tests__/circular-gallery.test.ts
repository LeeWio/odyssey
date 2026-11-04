import { act, createElement, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import CircularGallery from "@/components/ui/circular-gallery";

vi.mock("@heroui/react", () => {
  const Container = ({ children }: { children: React.ReactNode }) =>
    createElement("div", null, children);
  return {
    Modal: Object.assign(Container, {
      Backdrop: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
        isOpen ? createPortal(children, document.body) : null,
      Container,
      Dialog: ({ children }: { children: React.ReactNode }) =>
        createElement("section", { role: "dialog" }, children),
    }),
  };
});

class GalleryImage {
  static instances: GalleryImage[] = [];
  crossOrigin: string | null = null;
  decoding = "";
  src = "";
  naturalWidth = 640;
  naturalHeight = 480;
  onload?: () => void;

  constructor() {
    GalleryImage.instances.push(this);
  }
}

let root: Root;
let container: HTMLDivElement;
let uploadTexture: ReturnType<typeof vi.fn>;
let loseContext: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  GalleryImage.instances = [];
  vi.stubGlobal("Image", GalleryImage);
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1)
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    }
  );
  uploadTexture = vi.fn();
  loseContext = vi.fn();
  const methods = new Map<string, unknown>([
    ["getShaderParameter", vi.fn(() => true)],
    [
      "getProgramParameter",
      vi.fn((_program, parameter) => (parameter === "ACTIVE_UNIFORMS" ? 0 : true)),
    ],
    ["getExtension", vi.fn((name) => (name === "WEBGL_lose_context" ? { loseContext } : null))],
    ["texImage2D", uploadTexture],
  ]);
  const gl = new Proxy(
    {},
    {
      get: (_target, name: string) => {
        if (/^[A-Z_0-9]+$/.test(name)) return name;
        if (!methods.has(name))
          methods.set(
            name,
            vi.fn(() => (name.startsWith("create") ? {} : undefined))
          );
        return methods.get(name);
      },
    }
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((kind: string) =>
    kind === "webgl2" ? gl : null) as typeof HTMLCanvasElement.prototype.getContext);
  container = document.createElement("div");
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function render(urls: string[], strict = false, expandOnOpen = false) {
  const gallery = createElement(CircularGallery, {
    items: urls.map((image) => ({ image })),
    font: "14px system-ui",
    expandOnOpen,
  });
  await act(async () => root.render(strict ? createElement(StrictMode, null, gallery) : gallery));
}

it("does not force CORS mode for relative or absolute same-origin uploads", async () => {
  await render([
    "/api/v1/public/files/photo.png",
    "http://localhost/api/v1/public/files/other.png",
  ]);
  expect(GalleryImage.instances.map((image) => image.crossOrigin)).toEqual([null, null]);
});

it("still requests CORS permission for genuinely cross-origin textures", async () => {
  await render(["https://images.example.com/photo.jpg"]);
  expect(GalleryImage.instances[0].crossOrigin).toBe("anonymous");
});

it("survives Strict Mode effect replay without losing the canvas or uploading stale images", async () => {
  await render(["/one.jpg", "/two.jpg", "/three.jpg", "/four.jpg"], true);
  expect(GalleryImage.instances).toHaveLength(8);
  expect(loseContext).not.toHaveBeenCalled();
  const initialUploads = uploadTexture.mock.calls.length;
  await act(async () => GalleryImage.instances.slice(0, 4).forEach((image) => image.onload?.()));
  expect(uploadTexture).toHaveBeenCalledTimes(initialUploads);
  await act(async () => GalleryImage.instances.slice(4).forEach((image) => image.onload?.()));
  expect(uploadTexture).toHaveBeenCalledTimes(initialUploads + 4);
  expect(container.querySelectorAll("canvas")).toHaveLength(1);
});

it("expands and restores the same canvas without recreating textures or the gallery engine", async () => {
  document.body.appendChild(container);
  await render(["/one.jpg", "/two.jpg", "/three.jpg", "/four.jpg"], true, true);
  const canvas = container.querySelector("canvas");
  expect(canvas).not.toBeNull();
  const imageCount = GalleryImage.instances.length;

  await act(async () => {
    container.querySelector<HTMLButtonElement>("[data-gallery-list] button")!.click();
  });
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog?.querySelector("canvas")).toBe(canvas);
  expect(container.querySelector("canvas")).toBeNull();
  expect(GalleryImage.instances).toHaveLength(imageCount);
  expect(loseContext).not.toHaveBeenCalled();

  await act(async () => {
    dialog!.querySelector<HTMLButtonElement>("[data-gallery-close]")!.click();
  });
  expect(container.querySelector("canvas")).toBe(canvas);
  expect(GalleryImage.instances).toHaveLength(imageCount);
  expect(loseContext).not.toHaveBeenCalled();
});

it("can unmount an expanded gallery without leaving its canvas or dialog in the document", async () => {
  document.body.appendChild(container);
  await render(["/one.jpg", "/two.jpg", "/three.jpg", "/four.jpg"], false, true);
  await act(async () => {
    container.querySelector<HTMLButtonElement>("[data-gallery-list] button")!.click();
  });
  expect(document.querySelector('[role="dialog"] canvas')).not.toBeNull();
  await act(async () => root.render(null));
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.querySelector("canvas")).toBeNull();
});
