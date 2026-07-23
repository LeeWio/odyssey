"use client";

const LIKES_KEY = "odyssey:simulated:likes";
const EDITS_KEY = "odyssey:simulated:edits";
const DELETIONS_KEY = "odyssey:simulated:deletions";
const REPORTS_KEY = "odyssey:simulated:reports";
const LOCAL_COMMENTS_KEY = "odyssey:simulated:local-comments";

// Custom helper type for CommentResponse with extra local states
export interface EnhancedComment {
  id: number;
  parentId: number | null;
  content: string;
  username: string;
  nickname?: string;
  avatar?: string;
  status: string;
  postId: number;
  postTitle?: string;
  createdAt: string;
  children: EnhancedComment[];
  // Enhanced client-side fields
  likesCount: number;
  isLiked: boolean;
  isEdited?: boolean;
  isPending?: boolean;
  isFailed?: boolean;
  isReported?: boolean;
}

// Helper to get safe JSON parse
function getLocalItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

export const simulationStore = {
  // LIKES
  getLikes(): Record<number, { count: number; isLiked: boolean }> {
    return getLocalItem<Record<number, { count: number; isLiked: boolean }>>(LIKES_KEY, {});
  },
  toggleLike(id: number, initialLikes: number = 0): { count: number; isLiked: boolean } {
    const likes = this.getLikes();
    const current = likes[id] || { count: initialLikes, isLiked: false };
    const nextLiked = !current.isLiked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

    likes[id] = { count: nextCount, isLiked: nextLiked };
    setLocalItem(LIKES_KEY, likes);
    return likes[id];
  },

  // EDITS
  getEdits(): Record<number, string> {
    return getLocalItem<Record<number, string>>(EDITS_KEY, {});
  },
  editComment(id: number, newContent: string): void {
    const edits = this.getEdits();
    edits[id] = newContent;
    setLocalItem(EDITS_KEY, edits);
  },

  // DELETIONS
  getDeletions(): number[] {
    return getLocalItem<number[]>(DELETIONS_KEY, []);
  },
  deleteComment(id: number): void {
    const deletions = this.getDeletions();
    if (!deletions.includes(id)) {
      deletions.push(id);
      setLocalItem(DELETIONS_KEY, deletions);
    }
  },

  // REPORTS
  getReports(): number[] {
    return getLocalItem<number[]>(REPORTS_KEY, []);
  },
  reportComment(id: number): void {
    const reports = this.getReports();
    if (!reports.includes(id)) {
      reports.push(id);
      setLocalItem(REPORTS_KEY, reports);
    }
  },

  // LOCAL PENDING COMMENTS
  getLocalComments(postId: number): EnhancedComment[] {
    const all = getLocalItem<Record<number, EnhancedComment[]>>(LOCAL_COMMENTS_KEY, {});
    return all[postId] || [];
  },
  addLocalComment(postId: number, comment: EnhancedComment): void {
    const all = getLocalItem<Record<number, EnhancedComment[]>>(LOCAL_COMMENTS_KEY, {});
    const list = all[postId] || [];
    list.push(comment);
    all[postId] = list;
    setLocalItem(LOCAL_COMMENTS_KEY, all);
  },
  removeLocalComment(postId: number, id: number): void {
    const all = getLocalItem<Record<number, EnhancedComment[]>>(LOCAL_COMMENTS_KEY, {});
    const list = all[postId] || [];
    all[postId] = list.filter((c) => c.id !== id);
    setLocalItem(LOCAL_COMMENTS_KEY, all);
  },
};
