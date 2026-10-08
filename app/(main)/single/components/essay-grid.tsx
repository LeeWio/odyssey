import { EssayCard, type EssayCardPost } from "./essay-card";
import { ESSAY_GRID } from "./grid-classes";

export function EssayGrid({ posts }: { posts: EssayCardPost[] }) {
  return (
    <ul className={ESSAY_GRID} data-testid="essay-grid">
      {posts.map((post) => (
        <li key={post.id ?? post.slug} className="min-w-0">
          <EssayCard post={post} />
        </li>
      ))}
    </ul>
  );
}
