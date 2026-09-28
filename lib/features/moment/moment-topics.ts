import type { MomentResponse, MomentTopicResponse } from "./moment-contracts";

export function collectMomentTopics(moments: MomentResponse[]) {
  const topics = new Map<string, MomentTopicResponse & { count: number }>();

  for (const moment of moments) {
    for (const topic of moment.topics) {
      const current = topics.get(topic.slug);
      topics.set(topic.slug, { ...topic, count: (current?.count ?? 0) + 1 });
    }
  }

  return [...topics.values()].sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}
