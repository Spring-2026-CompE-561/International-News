const STORAGE_KEY = "horizon-story-bookmarks";

export interface StoryBookmark {
  id: number;
  title: string;
  image_url: string | null;
  category: string;
  source_count: number;
  country_count: number;
  created_at: string;
}

export function getStoryBookmarks(): StoryBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    if (raw.length > 0 && typeof raw[0] === "number") return [];
    return raw as StoryBookmark[];
  } catch {
    return [];
  }
}

export function getStoryBookmarkIds(): number[] {
  return getStoryBookmarks().map((b) => b.id);
}

export function isStoryBookmarked(id: number): boolean {
  return getStoryBookmarks().some((b) => b.id === id);
}

export function toggleStoryBookmark(story: StoryBookmark): boolean {
  const current = getStoryBookmarks();
  const exists = current.some((b) => b.id === story.id);
  const next = exists
    ? current.filter((b) => b.id !== story.id)
    : [story, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("story-bookmarks-changed"));
  return !exists;
}
