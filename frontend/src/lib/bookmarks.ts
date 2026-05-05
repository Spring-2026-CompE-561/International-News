const STORAGE_KEY = "horizon-bookmarks";

export interface ArticleBookmark {
  id: number;
  title: string;
  image_url: string | null;
  topic: string | null;
  source: string | null;
  published_at: string | null;
}

export function getBookmarks(): ArticleBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    if (raw.length > 0 && typeof raw[0] === "number") return [];
    return raw as ArticleBookmark[];
  } catch {
    return [];
  }
}

export function getBookmarkIds(): number[] {
  return getBookmarks().map((b) => b.id);
}

export function isBookmarked(id: number): boolean {
  return getBookmarks().some((b) => b.id === id);
}

export function toggleBookmark(article: ArticleBookmark): boolean {
  const current = getBookmarks();
  const exists = current.some((b) => b.id === article.id);
  const next = exists
    ? current.filter((b) => b.id !== article.id)
    : [article, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("bookmarks-changed"));
  return !exists;
}
