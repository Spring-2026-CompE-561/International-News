"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const topics = [
  { label: "All News", slug: null },
  { label: "World & Conflict", slug: "world" },
  { label: "Business & Economy", slug: "business" },
  { label: "Technology", slug: "technology" },
  { label: "Science", slug: "science" },
  { label: "Health", slug: "health" },
  { label: "Sports", slug: "sports" },
  { label: "Entertainment", slug: "entertainment" },
];

export function TopicBar() {
  const pathname = usePathname();

  return (
    <div className="bg-[#0F172A] dark:bg-[#0F172A] border-b border-white/10">
      <div className="container px-8 overflow-x-auto">
        <div className="flex items-end gap-0">
          {topics.map((topic) => {
            const href = topic.slug ? `/topic/${topic.slug}` : "/";
            const isActive = topic.slug
              ? pathname === `/topic/${topic.slug}`
              : pathname === "/";
            return (
              <Link
                key={topic.label}
                href={href}
                className={cn(
                  "px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2",
                  isActive
                    ? "text-white border-[#F59E0B]"
                    : "text-white/60 border-transparent hover:text-white"
                )}
              >
                {topic.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
