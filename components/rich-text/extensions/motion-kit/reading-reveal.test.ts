import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectRevealTargets, MotionKit, REVEAL_GAP_MS } from "./reading-reveal";

class Observer {
  static instances: Observer[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(private callback: IntersectionObserverCallback) {
    Observer.instances.push(this);
  }
  enter() {
    this.callback([] as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

let editor: Editor;

function setup(content = "<p>First paragraph</p><p>Second paragraph</p>") {
  Observer.instances = [];
  vi.stubGlobal("IntersectionObserver", Observer);
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

function placeInView(root: HTMLElement) {
  for (const block of root.children) {
    Object.defineProperty(block, "getBoundingClientRect", {
      value: () => ({ top: 20, height: 24, bottom: 44, left: 0, right: 100, width: 100 }),
    });
  }
}

afterEach(() => {
  editor?.destroy();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("reading reveal", () => {
  it("collects reading units and skips empty paragraphs", () => {
    setup("<p></p><p>Visible</p><blockquote><p>Quoted</p></blockquote>");
    expect(collectRevealTargets(editor.view).map(({ pos }) => pos)).toEqual([2, 11]);
  });

  it("hides a paragraph until its turn, then reveals the next one after the gap", async () => {
    vi.useFakeTimers();
    const root = setup("<p>One</p><p>Two</p>");
    placeInView(root);
    editor.emit("create", { editor });

    const [first, second] = [...root.children] as HTMLElement[];
    expect(first?.classList.contains("reading-reveal-text")).toBe(true);
    expect(editor.getJSON().content?.[0]?.attrs).toBeUndefined();

    Observer.instances.at(-1)?.enter();
    expect(first?.classList.contains("reading-reveal-text")).toBe(true);
    expect(second?.classList.contains("reading-reveal-pending")).toBe(true);

    await vi.advanceTimersByTimeAsync(REVEAL_GAP_MS);
    expect(second?.classList.contains("reading-reveal-text")).toBe(true);
  });

  it("keeps revealing the next in-view paragraph after the first animation ends", async () => {
    vi.useFakeTimers();
    const root = setup("<p>One</p><p>Two</p><p>Three</p>");
    placeInView(root);
    editor.emit("create", { editor });
    const blocks = [...root.children] as HTMLElement[];
    blocks[0]?.dispatchEvent(new Event("animationend"));

    await vi.advanceTimersByTimeAsync(REVEAL_GAP_MS);
    expect(blocks[1]?.classList.contains("reading-reveal-text")).toBe(true);
    expect(blocks[2]?.classList.contains("reading-reveal-pending")).toBe(true);
  });

  it("does not reveal the editor while it is editable", () => {
    vi.useFakeTimers();
    const element = document.createElement("div");
    document.body.append(element);
    editor = new Editor({
      element,
      extensions: [StarterKit, MotionKit],
      content: "<p>Editable</p>",
      editable: true,
    });
    editor.emit("create", { editor });
    expect(element.querySelector(".reading-reveal-pending")).toBeNull();
  });
});
