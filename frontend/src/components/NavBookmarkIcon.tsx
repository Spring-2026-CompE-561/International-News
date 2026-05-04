"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getBookmarkIds } from "@/lib/bookmarks";
import { getStoryBookmarkIds } from "@/lib/storyBookmarks";

export function NavBookmarkIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const total = () => getBookmarkIds().length + getStoryBookmarkIds().length;
    setCount(total());
    const handler = () => setCount(total());
    window.addEventListener("bookmarks-changed", handler);
    window.addEventListener("story-bookmarks-changed", handler);
    return () => {
      window.removeEventListener("bookmarks-changed", handler);
      window.removeEventListener("story-bookmarks-changed", handler);
    };
  }, []);

  return (
    <Link
      href="/bookmarks"
      aria-label="Bookmarks"
      className="relative inline-flex items-center justify-center rounded-md w-9 h-9 hover:bg-accent transition-colors"
    >
      <img src="/bookmark-hover.svg" alt="" className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#F59E0B] text-black text-[9px] font-bold leading-none">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
