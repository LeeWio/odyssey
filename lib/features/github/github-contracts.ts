import { z } from "zod";

export const GitHubRepositoryActivitySchema = z.object({
  nameWithOwner: z.string(),
  url: z.string().url(),
  count: z.number().int().nonnegative(),
});

export const GitHubPullRequestActivitySchema = z.object({
  title: z.string(),
  description: z.string(),
  repositoryNameWithOwner: z.string(),
  url: z.string().url(),
  mergedAt: z.string(),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
});

export const GitHubActivityResponseSchema = z.object({
  month: z.string(),
  periodLabel: z.string(),
  actor: z.string(),
  login: z.string(),
  profileUrl: z.string().url(),
  commitRepositories: z.array(GitHubRepositoryActivitySchema),
  latestMergedPullRequest: GitHubPullRequestActivitySchema.nullable(),
  issueRepositories: z.array(GitHubRepositoryActivitySchema),
  reviewRepositories: z.array(GitHubRepositoryActivitySchema),
  totalCommits: z.number().int().nonnegative(),
  totalIssues: z.number().int().nonnegative(),
  openIssues: z.number().int().nonnegative(),
  closedIssues: z.number().int().nonnegative(),
  totalReviews: z.number().int().nonnegative(),
  latestReviewAt: z.string().nullable(),
  fetchedAt: z.string(),
  available: z.boolean(),
});

export type GitHubActivityResponse = z.infer<typeof GitHubActivityResponseSchema>;
export type GitHubRepositoryActivity = z.infer<typeof GitHubRepositoryActivitySchema>;
