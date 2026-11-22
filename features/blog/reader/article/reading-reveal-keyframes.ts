const CUBIC_OUT = "cubic-bezier(0.333333, 1, 0.666667, 1)";
const TRAVEL_SEGMENTS = 32;
const travelSamples = Array.from({ length: TRAVEL_SEGMENTS + 1 }, (_, index) => {
  const progress = index / TRAVEL_SEGMENTS;
  return Number((1 - (1 - progress) ** 4).toFixed(5));
});
const QUARTIC_OUT = `linear(${travelSamples.join(", ")})`;

const TEXT = { duration: 680, fade: 340, focus: 390, blur: 7, y: 16, scale: 1 };
const IMAGE = { duration: 820, fade: 460, focus: 500, blur: 6, y: 8, scale: 1.025 };
const TALL: { duration: number; keyframes: Keyframe[] } = {
  duration: 280,
  keyframes: [{ opacity: 0.65, easing: CUBIC_OUT }, { opacity: 1 }],
};

function reveal({ duration, fade, focus, blur, y, scale }: typeof TEXT, linearEasing: boolean) {
  const transformAt = (progress: number) =>
    `translate3d(0, ${y * (1 - progress)}px, 0) scale(${scale + (1 - scale) * progress})`;

  // Both representations sample the same quartic travel curve.
  const travel: Keyframe[] = linearEasing
    ? [{ offset: 0, easing: QUARTIC_OUT, transform: transformAt(0) }]
    : travelSamples.slice(0, -1).map((sample, index) => ({
        offset: index / TRAVEL_SEGMENTS,
        transform: transformAt(sample),
      }));

  // Each property has its own offsets and easing within one browser animation.
  const keyframes: Keyframe[] = [
    { offset: 0, easing: CUBIC_OUT, opacity: 0, filter: `blur(${blur}px)` },
    { offset: fade / duration, opacity: 1 },
    { offset: focus / duration, filter: "blur(0px)" },
    ...travel,
    { offset: 1, opacity: 1, filter: "blur(0px)", transform: transformAt(1) },
  ];
  keyframes.sort((first, second) => first.offset! - second.offset!);
  return { duration, keyframes };
}

export function readingRevealProfiles() {
  const linearEasing = CSS.supports("animation-timing-function", QUARTIC_OUT);
  return { text: reveal(TEXT, linearEasing), image: reveal(IMAGE, linearEasing), tall: TALL };
}
