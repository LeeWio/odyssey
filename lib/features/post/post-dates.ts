export function getPostPublishedAt(post: {
  createdAt?: string | null;
  publishedAt?: string | null;
}) {
  return post.publishedAt || post.createdAt || null;
}
