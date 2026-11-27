export function getCodeLineCount(code: string) {
  return code.split(/\r\n|\r|\n/).length;
}

export function CodeLineNumbers({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      data-code-line-numbers=""
      className="text-muted block text-end whitespace-pre tabular-nums select-none"
    >
      {Array.from({ length: count }, (_, index) => index + 1).join("\n")}
    </span>
  );
}
