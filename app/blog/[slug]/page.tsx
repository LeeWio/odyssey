import { ReaderView } from "@/components/blog/reader-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  return <ReaderView slug={slug} />;
}
