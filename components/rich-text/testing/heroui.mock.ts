const NullComponent = () => null;

export const Button = NullComponent;
export const EmptyState = NullComponent;
export const ScrollShadow = NullComponent;
export const Surface = NullComponent;
export const SearchField = Object.assign(NullComponent, {
  Group: NullComponent,
  Input: NullComponent,
  SearchIcon: NullComponent,
});
export const Tooltip = Object.assign(NullComponent, { Content: NullComponent });
export const toast = {
  danger() {},
  warning() {},
};
