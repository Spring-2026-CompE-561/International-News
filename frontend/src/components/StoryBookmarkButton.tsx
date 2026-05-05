"use client";
import { useState, useEffect } from "react";
import { isStoryBookmarked, toggleStoryBookmark } from "@/lib/storyBookmarks";

export function StoryBookmarkButton({ storyId }: { storyId: number }) {
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setSaved(isStoryBookmarked(storyId));
    const handler = () => setSaved(isStoryBookmarked(storyId));
    window.addEventListener("story-bookmarks-changed", handler);
    return () => window.removeEventListener("story-bookmarks-changed", handler);
  }, [storyId]);

  const icon = saved || hovered ? "/bookmark-hover.svg" : "/small-bookmark.svg";

  return (
    <button
      onClick={() => setSaved(toggleStoryBookmark(storyId))}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={saved ? "Remove bookmark" : "Bookmark story"}
      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-white/10 transition-colors"
    >
      <img src={icon} alt="" className="w-4 h-4 invert opacity-70 hover:opacity-100" />
    </button>
  );
}
