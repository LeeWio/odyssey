import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectRevealTargets, MotionKit } from "./reading-reveal";

let frames: FrameRequestCallback[] = [];

beforeEach(() => {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => undefined);
});

function runFrame() {
  const callback = frames.shift();
  callback?.(performance.now());
}

let editor: Editor;

function setup(content = "<p>First paragraph</p><p>Second paragraph</p>") {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const element = document.createElement("div");
  document.body.append(element);
  editor = new Editor({
    element,
    extensions: [StarterKit, MotionKit],
    content,
    editable: false,
  });
  return editor.view.dom;
}

afterEach(() => {
  editor?.destroy();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("reading reveal", () => {
  it("collects reading units and skips empty paragraphs", () => {
    setup("<p></p><p>Visible</p><blockquote><p>Quoted</p></blockquote>");
    expect(collectRevealTargets(editor.view).map(({ element }) => element.tagName)).toEqual([
      "P",
      "BLOCKQUOTE",
    ]);
  });

  it("keeps a block visible until it enters the zone, then marks it played", () => {
    const root = setup();
    const first = root.firstElementChild as HTMLElement;
    const rect = { top: 2000, height: 24, bottom: 2024, left: 0, right: 100, width: 100 };
    for (const block of root.children) {
      Object.defineProperty(block, "getBoundingClientRect", { value: () => rect });
    }
    runFrame();
    expect(first.classList.contains("reading-reveal-pending")).toBe(true);
    expect(first.className).not.toContain("reading-reveal-text");

    rect.top = 40;
    rect.bottom = 64;
    runFrame();
    expect(first.classList.contains("reading-reveal-text")).toBe(true);
    expect(editor.getJSON().content?.[0]?.attrs).toBeUndefined();
  });

  it("starts watching after the editor flips from editable to read-only", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const element = document.createElement("div");
    document.body.append(element);
    editor = new Editor({
      element,
      extensions: [StarterKit, MotionKit],
      content: "<p>Readable</p>",
      editable: true,
    });
    editor.setEditable(false);
    const block = editor.view.dom.firstElementChild as HTMLElement;
    Object.defineProperty(block, "getBoundingClientRect", {
      value: () => ({ top: 20, height: 24, bottom: 44, left: 0, right: 100, width: 100 }),
    });
    runFrame();
    expect(block.classList.contains("reading-reveal-text")).toBe(true);
  });

  it("starts the next paragraph only after the gap, in document order", () => {
    vi.spyOn(performance, "now").mockReturnValue(0);
    const root = setup("<p>One</p><p>Two</p><p>Three</p>");
    const blocks = [...root.children] as HTMLElement[];
    for (const block of blocks) {
      Object.defineProperty(block, "getBoundingClientRect", {
        value: () => ({ top: 20, height: 24, bottom: 44, left: 0, right: 100, width: 100 }),
      });
    }
    runFrame();
    expect(blocks.map((block) => block.classList.contains("reading-reveal-text"))).toEqual([
      true,
      false,
      false,
    ]);

    vi.spyOn(performance, "now").mockReturnValue(120);
    runFrame();
    expect(blocks[1]?.classList.contains("reading-reveal-text")).toBe(true);
    expect(blocks[2]?.classList.contains("reading-reveal-text")).toBe(false);
    expect(blocks[2]?.classList.contains("reading-reveal-pending")).toBe(true);
  });
});
