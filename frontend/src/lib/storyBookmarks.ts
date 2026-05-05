const STORAGE_KEY = "horizon-story-bookmarks";

export function getStoryBookmarkIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isStoryBookmarked(id: number): boolean {
  return getStoryBookmarkIds().includes(id);
}

export function toggleStoryBookmark(storyId: number): boolean {
  const ids = getStoryBookmarkIds();
  const index = ids.indexOf(storyId);
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    ids.push(storyId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("story-bookmarks-changed"));
  return index < 0;
}
