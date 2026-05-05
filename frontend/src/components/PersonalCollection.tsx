"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { getBookmarks } from "@/lib/bookmarks";
import { getStoryBookmarks } from "@/lib/storyBookmarks";
import { getReadingHistory } from "@/lib/readingHistory";
import { isLoggedIn } from "@/lib/auth";

interface HubGroup {
  name: string;
  count: number;
}

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
      className="rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#141414] p-4 sm:p-5 flex flex-col hover:border-horizon hover:bg-horizon/10 dark:hover:bg-horizon/25 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-horizon/10 group-hover:bg-horizon/20 flex items-center justify-center text-horizon transition-colors">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/30 group-hover:text-horizon/70 transition-colors">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-[#183153] dark:text-white mb-2 group-hover:text-horizon transition-colors">
        {value}
      </p>
      <p className="text-[12px] text-gray-400 dark:text-white/35 leading-snug mt-auto group-hover:text-horizon/70 transition-colors">
        {description}
      </p>
    </Link>
  );
}

function buildHubGroups(): HubGroup[] {
  const groups: Record<string, number> = {};
  for (const b of getBookmarks()) {
    const name = b.topic || "General";
    groups[name] = (groups[name] || 0) + 1;
  }
  for (const b of getStoryBookmarks()) {
    const name = b.category || "General";
    groups[name] = (groups[name] || 0) + 1;
  }
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}

export function PersonalCollection() {
  const [savedCount, setSavedCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);
  const [hubGroups, setHubGroups] = useState<HubGroup[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handleAuth = () => setLoggedIn(isLoggedIn());
    window.addEventListener("auth-changed", handleAuth);
    return () => window.removeEventListener("auth-changed", handleAuth);
  }, []);

  useEffect(() => {
    function refresh() {
      const articles = getBookmarks();
      const stories = getStoryBookmarks();
      setSavedCount(articles.length + stories.length);
      setHistoryCount(getReadingHistory().length);
      setHubGroups(buildHubGroups());
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

  if (!loggedIn && savedCount === 0 && historyCount === 0) return null;

  return (
    <>
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-horizon mb-1.5">
              Your Space
            </p>
            <h2 className="text-2xl sm:text-[1.7rem] font-semibold tracking-[-0.03em] text-[#183153] dark:text-white leading-none">
              Personal Collection
            </h2>
          </div>
          <p className="text-[13px] text-gray-400 dark:text-white/35 text-right max-w-xs hidden sm:block leading-relaxed">
            A home for saved articles, unfinished reads, and the themes you keep coming back to.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="grid grid-cols-3 gap-3 flex-1">
            <StatCard
              href="/bookmarks?tab=saved"
              icon={<img src="/bookmark-hover.svg" alt="" className="w-4 h-4 dark:invert" />}
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

          {hubGroups.length > 0 && (
            <div className="lg:w-64 xl:w-72 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#141414] p-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/30">
                  In Your Hub
                </span>
                <Link
                  href="/bookmarks?tab=saved"
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] text-horizon hover:text-horizon/80 transition-colors"
                >
                  Open All ↗
                </Link>
              </div>
              <div className="space-y-0">
                {hubGroups.map((group) => (
                  <Link
                    key={group.name}
                    href="/bookmarks?tab=saved"
                    className="group flex items-center justify-between py-3 border-b border-gray-100 dark:border-white/[0.06] last:border-0 hover:bg-horizon/10 dark:hover:bg-horizon/25 -mx-1 px-1 rounded-lg transition-colors"
                  >
                    <span className="text-[14px] font-semibold text-[#183153] dark:text-white group-hover:text-horizon transition-colors">
                      {group.name}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400 dark:text-white/30 group-hover:text-horizon/70 transition-colors">
                      {group.count} saved
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <hr className="border-gray-200 dark:border-white/10" />
    </>
  );
}
