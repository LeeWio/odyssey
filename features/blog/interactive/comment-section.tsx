import { CommentSystem } from "@/components/comment";

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  return <CommentSystem postId={postId} />;
}
