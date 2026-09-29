import { EssayCard, type EssayCardPost } from "./essay-card";

export function EssayGrid({ posts }: { posts: EssayCardPost[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post.id ?? post.slug}>
          <EssayCard post={post} />
        </li>
      ))}
    </ul>
  );
}
