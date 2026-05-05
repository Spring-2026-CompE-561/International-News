"use client";
import { useState, useEffect } from "react";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

export function BookmarkButton({ articleId }: { articleId: number }) {
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setSaved(isBookmarked(articleId));
    const handler = () => setSaved(isBookmarked(articleId));
    window.addEventListener("bookmarks-changed", handler);
    return () => window.removeEventListener("bookmarks-changed", handler);
  }, [articleId]);

  const icon = saved || hovered ? "/bookmark-hover.svg" : "/small-bookmark.svg";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(toggleBookmark(articleId));
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
