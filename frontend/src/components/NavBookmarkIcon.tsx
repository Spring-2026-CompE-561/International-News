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
      className="group inline-flex items-center h-8 px-2 rounded-lg hover:bg-muted transition-colors overflow-hidden"
    >
      <span className="relative shrink-0">
        <img src="/bookmark-hover.svg" alt="" className="w-4 h-4 dark:invert" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#F59E0B] text-black text-[9px] font-bold leading-none">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap pl-0 opacity-0 text-sm font-medium group-hover:max-w-[80px] group-hover:pl-1.5 group-hover:opacity-100 transition-all duration-200">
        Bookmarks
      </span>
    </Link>
  );
}
