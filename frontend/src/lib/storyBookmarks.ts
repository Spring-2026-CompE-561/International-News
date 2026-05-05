const STORAGE_KEY = "horizon-story-bookmarks";

export interface StoryBookmark {
  id: number;
  title?: string | null;
  category?: string | null;
  image_url?: string | null;
  source_count?: number | null;
  country_count?: number | null;
  created_at?: string | null;
}

export function getStoryBookmarks(): StoryBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getStoryBookmarkIds(): number[] {
  return getStoryBookmarks().map((b) => b.id);
}

export function isStoryBookmarked(storyId: number): boolean {
  return getStoryBookmarks().some((b) => b.id === storyId);
}

export function toggleStoryBookmark(story: StoryBookmark): boolean {
  const bookmarks = getStoryBookmarks();
  const index = bookmarks.findIndex((b) => b.id === story.id);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(story);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new Event("story-bookmarks-changed"));
  return index < 0;
}
