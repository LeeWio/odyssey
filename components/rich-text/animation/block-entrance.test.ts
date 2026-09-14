import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { gsap } from "gsap";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectEntranceTargets, startBlockEntrance } from "./block-entrance";

class Observer {
  static latest: Observer;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(private callback: IntersectionObserverCallback) {
    Observer.latest = this;
  }
  enter(element: Element) {
    this.callback(
      [{ target: element, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

let editor: Editor;
let dispose: (() => void) | undefined;
function setup(content = "<p>First</p><p>Second</p>") {
  vi.stubGlobal("IntersectionObserver", Observer);
  const element = document.createElement("div");
  document.body.append(element);
  editor = new Editor({ element, extensions: [StarterKit], content, editable: false });
  return editor.view.dom;
}

afterEach(() => {
  dispose?.();
  dispose = undefined;
  editor?.destroy();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe("block entrance lifecycle", () => {
  it("restores authored styles and stops tweens even when the animated node is detached", () => {
    const root = setup();
    const block = root.firstElementChild as HTMLElement;
    block.style.cssText = "color: red; width: 60%; opacity: 0.8; transform: translateY(3px)";
    const document = editor.getJSON();
    dispose = startBlockEntrance(editor, { duration: 280, stagger: 45 });
    Observer.latest.enter(block);
    expect(gsap.getTweensOf(block).length).toBeGreaterThan(0);
    block.remove();
    dispose();
    expect(gsap.getTweensOf(block)).toHaveLength(0);
    expect(block.style.opacity).toBe("0.8");
    expect(block.style.transform).toBe("translateY(3px)");
    expect(block.style.width).toBe("60%");
    expect(block.style.color).toBe("red");
    expect(Observer.latest.disconnect).toHaveBeenCalled();
    expect(editor.getJSON()).toEqual(document);
  });

  it("does not re-hide an existing block after a document update, but observes new content", async () => {
    const root = setup();
    const first = root.firstElementChild as HTMLElement;
    dispose = startBlockEntrance(editor, { duration: 280, stagger: 45 });
    Observer.latest.enter(first);
    for (const tween of gsap.getTweensOf(first)) tween.progress(1);
    expect(first.style.opacity).toBe("");
    editor.commands.insertContentAt(editor.state.doc.content.size, "<p>New content</p>");
    await Promise.resolve();
    expect(root.firstElementChild).toBe(first);
    expect(first.style.opacity).toBe("");
    expect((root.lastElementChild as HTMLElement).style.opacity).toBe("0");
    expect(Observer.latest.observe.mock.calls.filter(([node]) => node === first)).toHaveLength(1);
  });

  it("finishes a pending block as soon as a link inside receives keyboard focus", () => {
    const root = setup('<p><a href="https://example.com">Link</a></p>');
    const block = root.firstElementChild as HTMLElement;
    dispose = startBlockEntrance(editor, { duration: 280, stagger: 45 });
    expect(block.style.opacity).toBe("0");
    root.querySelector("a")!.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(block.style.opacity).toBe("");
    expect(Observer.latest.unobserve).toHaveBeenCalledWith(block);
  });

  it("groups list items and quotations without selecting their descendants twice", () => {
    setup(
      "<p></p><ul><li><p>Outer</p><ul><li><p>Inner</p></li></ul></li></ul><blockquote><p>Quote</p></blockquote>"
    );
    expect(collectEntranceTargets(editor.view).map(({ element }) => element.tagName)).toEqual([
      "LI",
      "BLOCKQUOTE",
    ]);
  });
});
