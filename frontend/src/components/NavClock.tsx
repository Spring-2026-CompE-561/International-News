"use client";
import { useState, useEffect } from "react";

export function NavClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="hidden lg:flex items-center gap-1.5 text-white/50 text-[11px] font-medium tabular-nums whitespace-nowrap">
      <span>{date}</span>
      <span className="text-white/25">·</span>
      <span className="text-white/70">{time}</span>
    </div>
  );
}
