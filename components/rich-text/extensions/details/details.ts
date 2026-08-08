import { Extension } from "@tiptap/core";
import {
  Details as TiptapDetails,
  DetailsContent as TiptapDetailsContent,
  DetailsSummary as TiptapDetailsSummary,
  type DetailsRenderToggleButtonOptions,
} from "@tiptap/extension-details";
import { Plugin, PluginKey, Selection, TextSelection } from "@tiptap/pm/state";

const DETAILS_CONTENT_SELECTOR = ':scope > [data-type="detailsContent"]';
const DETAILS_TOGGLE_EVENT = "toggleDetailsContent";
const DETAILS_ANIMATION_DURATION = 180;
let detailsContentId = 0;

function createIndicatorIcon() {
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  const path = document.createElementNS(namespace, "path");

  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("class", "size-4");
  icon.setAttribute("fill", "none");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.dataset.detailsIndicatorIcon = "true";

  path.setAttribute("d", "M3.75 6 8 10.25 12.25 6");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.5");
  icon.append(path);

  return icon;
}

function animateDetailsContent(panel: HTMLElement, isOpen: boolean) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const activeAnimations = panel.getAnimations();
  const currentHeight = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  const currentOpacity = panel.hidden
    ? 0
    : activeAnimations.length > 0
      ? Number.parseFloat(getComputedStyle(panel).opacity)
      : isOpen
        ? 0
        : 1;

  activeAnimations.forEach((animation) => animation.cancel());
  panel.hidden = false;
  panel.setAttribute("aria-hidden", String(!isOpen));

  if (prefersReducedMotion) {
    panel.hidden = !isOpen;

    return;
  }

  const targetHeight = isOpen ? panel.scrollHeight : 0;
  const targetOpacity = isOpen ? 1 : 0;
  const animation = panel.animate(
    [
      { height: `${currentHeight}px`, opacity: currentOpacity },
      { height: `${targetHeight}px`, opacity: targetOpacity },
    ],
    {
      duration: DETAILS_ANIMATION_DURATION,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      fill: "both",
    }
  );

  void animation.finished
    .then(() => {
      const remainsOpen = panel.dataset.expanded === "true";

      panel.hidden = !remainsOpen;
      animation.cancel();
    })
    .catch(() => {
      // Reversing the disclosure cancels the previous animation intentionally.
    });
}

function installAnimationAdapter(panel: HTMLElement) {
  if (panel.dataset.detailsAnimationReady === "true") return;

  panel.dataset.detailsAnimationReady = "true";
  panel.addEventListener(
    DETAILS_TOGGLE_EVENT,
    (event) => {
      event.stopImmediatePropagation();
      animateDetailsContent(panel, panel.dataset.expanded === "true");
    },
    { capture: true }
  );
}

function renderToggleButton({ element, isOpen, node }: DetailsRenderToggleButtonOptions) {
  const summary = node.firstChild?.textContent.trim() || "details";

  element.className =
    "accordion__indicator absolute start-3 top-2.5 z-10 grid size-8 place-items-center rounded-full outline-none transition-[background-color,color,transform] duration-150 ease-out hover:bg-default/80 active:scale-[0.96] focus-visible:status-focused";
  element.dataset.expanded = String(isOpen);
  element.dataset.slot = "accordion-indicator";
  element.setAttribute("aria-expanded", String(isOpen));
  element.setAttribute("aria-label", `${isOpen ? "Collapse" : "Expand"} ${summary}`);

  if (!element.querySelector("[data-details-indicator-icon]")) {
    element.append(createIndicatorIcon());
  }

  const syncPanel = () => {
    const contentDOM = element.nextElementSibling;
    const panel = contentDOM?.querySelector<HTMLElement>(DETAILS_CONTENT_SELECTOR);

    if (!panel) return;

    panel.classList.add("accordion__panel");
    panel.dataset.expanded = String(isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));

    if (!panel.id) {
      detailsContentId += 1;
      panel.id = `odyssey-details-content-${detailsContentId}`;
    }

    element.setAttribute("aria-controls", panel.id);
    installAnimationAdapter(panel);
  };

  syncPanel();
  queueMicrotask(syncPanel);
}

export const Details = TiptapDetails.extend({
  // Tiptap checks `offsetParent` to decide whether DetailsContent is visible.
  // Elements rendered inside HeroUI's modal top layer have no offsetParent even
  // while visible, so use the persisted `open` attribute as the source of truth.
  addProseMirrorPlugins() {
    return [];
  },

  addKeyboardShortcuts() {
    const parentShortcuts = this.parent?.() ?? {};

    const moveToContent = () => {
      const { state, view } = this.editor;
      const { $head } = state.selection;

      if ($head.parent.type !== state.schema.nodes.detailsSummary) return false;

      const detailsNode = $head.node(-1);

      if (detailsNode.type !== state.schema.nodes.details || detailsNode.attrs.open !== true) {
        return false;
      }

      const contentStart = $head.after() + 1;
      const selection = Selection.near(state.doc.resolve(contentStart), 1);

      view.dispatch(state.tr.setSelection(selection).scrollIntoView());

      return true;
    };

    return {
      ...parentShortcuts,
      Enter: (props) => moveToContent() || parentShortcuts.Enter?.(props) || false,
      ArrowDown: (props) => moveToContent() || parentShortcuts.ArrowDown?.(props) || false,
      ArrowRight: (props) => {
        const { $head } = this.editor.state.selection;
        const isAtSummaryEnd =
          $head.parent.type === this.editor.state.schema.nodes.detailsSummary &&
          $head.parentOffset === $head.parent.content.size;

        return (isAtSummaryEnd && moveToContent()) || parentShortcuts.ArrowRight?.(props) || false;
      },
    };
  },
}).configure({
  persist: true,
  openClassName: "is-open",
  HTMLAttributes: {
    class:
      "accordion accordion__item odyssey-details my-4 overflow-hidden rounded-2xl bg-surface-secondary/70 ring-1 ring-foreground/8",
    "data-hide-separator": "true",
  },
  renderToggleButton,
});

export const DetailsSummary = TiptapDetailsSummary.configure({
  HTMLAttributes: {
    class:
      "accordion__heading relative min-w-0 cursor-text items-center py-3.5 ps-12 pe-4 text-base font-medium outline-none",
    "data-slot": "accordion-trigger",
  },
});

export const DetailsContent = TiptapDetailsContent.configure({
  HTMLAttributes: {
    class:
      "accordion__body accordion__body-inner relative border-t border-separator/60 py-3 ps-12 pe-4 leading-6",
    "data-slot": "accordion-panel",
  },
});

const DetailsSelectionGuard = Extension.create({
  name: "detailsSelectionGuard",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("detailsSelectionGuard"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.selectionSet)) return null;

          const { $from } = newState.selection;

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            if ($from.node(depth).type.name !== "detailsContent") continue;

            const detailsDepth = depth - 1;
            const detailsNode = $from.node(detailsDepth);

            if (detailsNode.type.name !== "details" || detailsNode.attrs.open !== false)
              return null;

            const summaryNode = detailsNode.firstChild;

            if (!summaryNode || summaryNode.type.name !== "detailsSummary") return null;

            const detailsPosition = $from.before(detailsDepth);
            const summaryEnd = detailsPosition + summaryNode.nodeSize;

            return newState.tr.setSelection(TextSelection.create(newState.doc, summaryEnd));
          }

          return null;
        },
      }),
    ];
  },
});

export const DetailsKit = [Details, DetailsSummary, DetailsContent, DetailsSelectionGuard];
