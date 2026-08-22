"use client";
import { CodeBlock } from "@heroui-pro/react/code-block";

export default function BuildingPage() {
  const code = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}
console.log(greet("HeroUI"));`;
  return (
    <div className="w-[480px]">
      <CodeBlock>
        <CodeBlock.Header>
          <span className="text-muted text-xs uppercase">typescript</span>
          <CodeBlock.CopyButton code={code} />
        </CodeBlock.Header>
        <CodeBlock.Code code={code} language="typescript" />
      </CodeBlock>
    </div>
  );
}
