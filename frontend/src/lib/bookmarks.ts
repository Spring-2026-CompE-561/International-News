const STORAGE_KEY = "horizon-bookmarks";

export interface ArticleBookmark {
  id: number;
  title?: string | null;
  topic?: string | null;
  source?: string | null;
  image_url?: string | null;
  published_at?: string | null;
}

export function getBookmarks(): ArticleBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getBookmarkIds(): number[] {
  return getBookmarks().map((b) => b.id);
}

export function isBookmarked(articleId: number): boolean {
  return getBookmarks().some((b) => b.id === articleId);
}

export function toggleBookmark(article: ArticleBookmark): boolean {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === article.id);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(article);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new Event("bookmarks-changed"));
  return index < 0;
}
