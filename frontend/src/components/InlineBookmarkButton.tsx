"use client";
import { useState, useEffect } from "react";
import { isBookmarked, toggleBookmark, type ArticleBookmark } from "@/lib/bookmarks";

export function InlineBookmarkButton({ article }: { article: ArticleBookmark }) {
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(article.id));
    const handler = () => setSaved(isBookmarked(article.id));
    window.addEventListener("bookmarks-changed", handler);
    return () => window.removeEventListener("bookmarks-changed", handler);
  }, [article.id]);

  const icon = saved || hovered ? "/bookmark-hover.svg" : "/small-bookmark.svg";

  return (
    <button
      onClick={() => setSaved(toggleBookmark(article))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={saved ? "Remove bookmark" : "Bookmark article"}
      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
    >
      <img src={icon} alt="" className="w-4 h-4" />
    </button>
  );
}
