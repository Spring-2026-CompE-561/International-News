"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { getBookmarkIds } from "@/lib/bookmarks";
import { getStoryBookmarkIds } from "@/lib/storyBookmarks";
import { getReadingHistory } from "@/lib/readingHistory";

function StatCard({
  icon,
  label,
  value,
  description,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 sm:p-5 flex flex-col hover:border-[#F59E0B]/40 hover:bg-[#F59E0B]/[0.02] transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/30">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-[#0F172A] dark:text-white mb-2 group-hover:text-[#F59E0B] transition-colors">
        {value}
      </p>
      <p className="text-[12px] text-gray-400 dark:text-white/35 leading-snug mt-auto">{description}</p>
    </Link>
  );
}

export function PersonalCollection() {
  const [savedCount, setSavedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    function refresh() {
      setSavedCount(getBookmarkIds().length + getStoryBookmarkIds().length);
      setHistoryCount(getReadingHistory().length);
    }
    refresh();
    window.addEventListener("bookmarks-changed", refresh);
    window.addEventListener("story-bookmarks-changed", refresh);
    window.addEventListener("history-changed", refresh);
    return () => {
      window.removeEventListener("bookmarks-changed", refresh);
      window.removeEventListener("story-bookmarks-changed", refresh);
      window.removeEventListener("history-changed", refresh);
    };
  }, []);

  if (savedCount === 0 && historyCount === 0) return null;

  return (
    <>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#F59E0B] mb-1.5">
              Your Space
            </p>
            <h2 className="text-2xl sm:text-[1.7rem] font-semibold tracking-[-0.03em] text-[#0F172A] dark:text-white leading-none">
              Personal Collection
            </h2>
          </div>
          <p className="text-[13px] text-gray-400 dark:text-white/35 text-right max-w-xs hidden sm:block leading-relaxed">
            A home for saved articles, unfinished reads, and the themes you keep coming back to.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            href="/bookmarks?tab=saved"
            icon={<img src="/bookmark-hover.svg" alt="" className="w-4 h-4" />}
            label="Saved"
            value={savedCount}
            description="Bookmarked pieces waiting in your hub."
          />
          <StatCard
            href="/bookmarks?tab=history"
            icon={<Clock className="w-4 h-4" />}
            label="Reading Queue"
            value={historyCount}
            description="Articles and stories you've opened."
          />
          <StatCard
            href="/bookmarks?tab=saved"
            icon={<Sparkles className="w-4 h-4" />}
            label="Following"
            value={0}
            description="Ongoing themes building your personal news graph."
          />
        </div>
      </div>
      <hr className="border-gray-200 dark:border-white/10" />
    </>
  );
}
