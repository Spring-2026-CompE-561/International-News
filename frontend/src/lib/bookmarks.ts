const STORAGE_KEY = "horizon-bookmarks";

export function getBookmarkIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isBookmarked(id: number): boolean {
  return getBookmarkIds().includes(id);
}

export function toggleBookmark(articleId: number): boolean {
  const ids = getBookmarkIds();
  const index = ids.indexOf(articleId);
  if (index >= 0) {
    ids.splice(index, 1);
  } else {
    ids.push(articleId);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("bookmarks-changed"));
  return index < 0;
}
