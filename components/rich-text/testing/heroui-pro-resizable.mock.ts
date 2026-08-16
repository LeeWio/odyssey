const NullComponent = () => null;

export const Resizable = {
  Handle: NullComponent,
  Panel: NullComponent,
};

export type Layout = { defaultSize: number; id: string; minSize?: number };
