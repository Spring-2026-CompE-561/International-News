const STORAGE_KEY = "horizon-story-bookmarks";

export interface StoryBookmark {
  id: number;
  title?: string;
  category?: string;
  image_url?: string;
  source_count?: number;
  country_count?: number;
  created_at?: string;
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
