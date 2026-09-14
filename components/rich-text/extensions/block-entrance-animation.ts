import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { gsap } from "gsap";

export interface BlockEntranceAnimationOptions {
  enabled: boolean;
  stagger: number;
  duration: number;
}

export const BlockEntranceAnimation = Extension.create<BlockEntranceAnimationOptions>({
  name: "blockEntranceAnimation",
  addOptions: () => ({ enabled: true, stagger: 45, duration: 280 }),
  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];
    const { stagger, duration } = this.options;
    return [
      new Plugin({
        view: (view) => {
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return {};
          const root = view.dom.closest<HTMLElement>("[data-slot='rich-text-editor-content']");
          const animated = new WeakSet<HTMLElement>();
          const observed = new WeakSet<HTMLElement>();
          const blocks = () =>
            Array.from(view.dom.children).filter(
              (node): node is HTMLElement => node instanceof HTMLElement
            );
          const io = new IntersectionObserver(
            (entries) => {
              const ordered = entries
                .filter((entry) => entry.isIntersecting)
                .sort(
                  (a, b) =>
                    blocks().indexOf(a.target as HTMLElement) -
                    blocks().indexOf(b.target as HTMLElement)
                );
              ordered.forEach((entry, index) => {
                const block = entry.target as HTMLElement;
                if (animated.has(block)) return;
                animated.add(block);
                gsap.fromTo(
                  block,
                  { autoAlpha: 0, y: 8 },
                  {
                    autoAlpha: 1,
                    y: 0,
                    delay: (index * stagger) / 1000,
                    duration: duration / 1000,
                    ease: "power2.out",
                    clearProps: "transform",
                  }
                );
                io.unobserve(block);
              });
            },
            { root, threshold: 0.05 }
          );
          const observeNewBlocks = () =>
            blocks().forEach((block) => {
              if (observed.has(block) || animated.has(block)) return;
              observed.add(block);
              gsap.set(block, { autoAlpha: 0, y: 8 });
              io.observe(block);
            });
          observeNewBlocks();
          const mo = new MutationObserver(observeNewBlocks);
          mo.observe(view.dom, { childList: true });
          return {
            destroy: () => {
              mo.disconnect();
              io.disconnect();
              blocks().forEach((block) => {
                gsap.killTweensOf(block);
                gsap.set(block, { clearProps: "opacity,visibility,transform" });
              });
            },
          };
        },
      }),
    ];
  },
});
