"use client";
import { useState, useEffect } from "react";
import { isBookmarked, toggleBookmark, type ArticleBookmark } from "@/lib/bookmarks";

export function BookmarkButton({ article }: { article: ArticleBookmark }) {
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
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(toggleBookmark(article));
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      aria-label={saved ? "Remove bookmark" : "Bookmark article"}
    >
      <img src={icon} alt="" className="w-6 h-6" />
    </button>
  );
}
