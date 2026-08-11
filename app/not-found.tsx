import { RouteLinkButton, RouteState } from "@/components/system/route-state";

export default function NotFound() {
  return (
    <RouteState
      kind="not-found"
      title="This page isn't here."
      description="The address may have changed, or the page may no longer be available."
      actions={
        <>
          <RouteLinkButton href="/">Back home</RouteLinkButton>
          <RouteLinkButton href="/blog" variant="secondary">
            Browse Chronicle
          </RouteLinkButton>
        </>
      }
    />
  );
}
