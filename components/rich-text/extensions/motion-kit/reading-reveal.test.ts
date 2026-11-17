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
  Object.defineProperty(root, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ top: 20, height: 48, bottom: 68, left: 0, right: 100, width: 100 }),
  });
  for (const block of root.children) {
    Object.defineProperty(block, "getBoundingClientRect", {
      configurable: true,
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
    expect(Observer.instances.at(-1)?.observe).toHaveBeenCalled();
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
    expect(blocks[2]?.classList.contains("reading-reveal-text")).toBe(true);
  });

  it("marks a run of scrolled-past paragraphs done before the next rebuild", () => {
    vi.useFakeTimers();
    const root = setup("<p>One</p><p>Two</p><p>Three</p>");
    Object.defineProperty(root, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ top: 20, height: 72, bottom: 92, left: 0, right: 100, width: 100 }),
    });
    const blocks = [...root.children] as HTMLElement[];
    const rects = [
      { top: -80, height: 24, bottom: -56, left: 0, right: 100, width: 100 },
      { top: -40, height: 24, bottom: -16, left: 0, right: 100, width: 100 },
      { top: 20, height: 24, bottom: 44, left: 0, right: 100, width: 100 },
    ];
    blocks.forEach((block, index) => {
      Object.defineProperty(block, "getBoundingClientRect", {
        configurable: true,
        value: () => rects[index],
      });
    });
    editor.emit("create", { editor });

    expect(blocks[0]?.classList.contains("reading-reveal-pending")).toBe(false);
    expect(blocks[1]?.classList.contains("reading-reveal-pending")).toBe(false);
    expect(blocks[2]?.classList.contains("reading-reveal-text")).toBe(true);
    expect(Observer.instances.at(-1)?.observe).not.toHaveBeenCalled();
  });

  it("reveals content that was unmeasured while the editor was still detached", async () => {
    vi.useFakeTimers();
    const element = document.createElement("div");
    document.body.append(element);
    editor = new Editor({
      extensions: [StarterKit, MotionKit],
      content: "<p>One</p><p>Two</p>",
      editable: false,
    });

    expect(editor.view.dom.isConnected).toBe(false);
    expect(editor.view.dom.querySelector(".reading-reveal-pending")).toBeNull();

    for (const block of editor.view.dom.children) {
      Object.defineProperty(block, "getBoundingClientRect", {
        value: () => ({ top: 20, height: 24, bottom: 44, left: 0, right: 100, width: 100 }),
      });
    }
    Object.defineProperty(editor.view.dom, "getBoundingClientRect", {
      value: () => ({ top: 20, height: 48, bottom: 68, left: 0, right: 100, width: 100 }),
    });
    vi.stubGlobal("IntersectionObserver", Observer);
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    element.append(editor.view.dom);
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();

    const [first, second] = [...editor.view.dom.children] as HTMLElement[];
    expect(first?.classList.contains("reading-reveal-text")).toBe(true);
    expect(second?.classList.contains("reading-reveal-pending")).toBe(true);

    await vi.advanceTimersByTimeAsync(REVEAL_GAP_MS);
    expect(second?.classList.contains("reading-reveal-text")).toBe(true);
  });

  it("restarts a reveal that measured nothing while the article was hidden", async () => {
    vi.useFakeTimers();
    const rect = { top: 0, height: 0, bottom: 0, left: 0, right: 100, width: 100 };
    const proto = HTMLElement.prototype;
    const original = proto.getBoundingClientRect;
    proto.getBoundingClientRect = () => rect as DOMRect;
    const root = setup("<p>One</p><p>Two</p>");
    editor.emit("create", { editor });
    expect(root.querySelector(".reading-reveal-pending")).toBeNull();

    proto.getBoundingClientRect = function rectFor(this: HTMLElement) {
      if (this === root) {
        return { top: 20, height: 48, bottom: 68, left: 0, right: 100, width: 100 } as DOMRect;
      }
      return { top: 20, height: 24, bottom: 44, left: 0, right: 100, width: 100 } as DOMRect;
    };
    document.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(0);

    expect([...root.children].map((block) => (block as HTMLElement).className)).toEqual([
      "reading-reveal-text",
      "reading-reveal-text",
    ]);
    proto.getBoundingClientRect = original;
  });

  it("starts the replacement document at its first block", async () => {
    vi.useFakeTimers();
    const root = setup("<p>One</p><p>Two</p><p>Three</p>");
    placeInView(root);
    editor.emit("create", { editor });
    await vi.advanceTimersByTimeAsync(REVEAL_GAP_MS * 3);

    editor.commands.setContent("<p>Next</p><p>After</p>");
    placeInView(root);
    document.dispatchEvent(new Event("scroll"));
    await vi.advanceTimersByTimeAsync(0);

    const [first, second] = [...root.children] as HTMLElement[];
    expect(first?.textContent).toBe("Next");
    expect(first?.classList.contains("reading-reveal-text")).toBe(true);
    expect(second?.classList.contains("reading-reveal-pending")).toBe(true);
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
