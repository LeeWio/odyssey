// 18rem cards plus gap-4 define the shared home content density.
export const HOME_CONTENT_GRID =
  "grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4";

export const HOME_PREVIEW_GRID = `${HOME_CONTENT_GRID} @max-[37rem]/home-section:[&>:nth-child(n+4)]:hidden @min-[37rem]/home-section:@max-[56rem]/home-section:[&>:nth-child(n+5)]:hidden @min-[56rem]/home-section:@max-[75rem]/home-section:[&>:nth-child(n+7)]:hidden @min-[75rem]/home-section:@max-[94rem]/home-section:[&>:nth-child(n+9)]:hidden @min-[94rem]/home-section:@max-[113rem]/home-section:[&>:nth-child(n+11)]:hidden`;

export const HOME_CAROUSEL_SLIDE =
  "min-w-0 basis-full pl-4 @min-[37rem]/home-section:basis-1/2 @min-[56rem]/home-section:basis-1/3 @min-[75rem]/home-section:basis-1/4 @min-[94rem]/home-section:basis-1/5 @min-[113rem]/home-section:basis-1/6";
