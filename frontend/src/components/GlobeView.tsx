"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { ArrowRight, Globe2, MapPin, X } from "lucide-react"
import { useTheme } from "next-themes"
import { GlobeInteractive, type GlobeMarker, type GlobeArticle } from "@/components/GlobeInteractive"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function ArticleCard({ article }: { article: GlobeArticle }) {
  return (
    <Link
      href={`/story/${article.storyId}`}
      className="group flex gap-3 p-3 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
    >
      {article.image_url && (
        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden">
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-horizon uppercase tracking-wider mb-1">
          {article.topic ?? "News"}
        </p>
        <h4 className="text-[13px] font-semibold text-[#183153] dark:text-white leading-snug line-clamp-2 group-hover:text-horizon transition-colors">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-white/35">
          {article.source && <span>{article.source}</span>}
          {article.published_at && (
            <>
              <span>·</span>
              <span>{timeAgo(article.published_at)}</span>
            </>
          )}
          {article.source_count > 0 && (
            <>
              <span>·</span>
              <span>{article.source_count} sources</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

function EmptyPanel({ markerCount }: { markerCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mb-4">
        <Globe2 className="w-7 h-7 text-gray-400 dark:text-white/30" />
      </div>
      <p className="text-gray-600 dark:text-white/60 text-sm font-medium mb-2">Explore the globe</p>
      <p className="text-gray-400 dark:text-white/30 text-xs leading-relaxed max-w-[200px]">
        {markerCount} active stories lighting up right now. Click a glowing marker to read what&apos;s happening there.
      </p>
    </div>
  )
}

function PreviewPanel({ marker, onClose }: { marker: GlobeMarker; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-horizon" />
          <span className="font-semibold text-[#183153] dark:text-white text-sm">{marker.country}</span>
          <span className="text-gray-400 dark:text-white/35 text-xs">
            {marker.articles.length} {marker.articles.length === 1 ? "story" : "stories"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {marker.articles.slice(0, 3).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.08]">
        <Link
          href="/global"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-horizon/10 hover:bg-horizon/20 text-horizon text-sm font-semibold transition-colors"
        >
          View all global stories
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

interface Props {
  markers: GlobeMarker[]
}

export function GlobeView({ markers }: Props) {
  const [selected, setSelected] = useState<GlobeMarker | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const handleMarkerClick = useCallback((marker: GlobeMarker) => {
    setSelected(marker)
  }, [])

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Globe — full sphere, centered */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#0d0d0d] p-0 relative max-w-[440px] mx-auto">
        <GlobeInteractive
          markers={markers}
          isDark={isDark}
          onMarkerClick={handleMarkerClick}
        />
        {!selected && (
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-white/25 pointer-events-none whitespace-nowrap">
            Click a glowing marker to explore
          </p>
        )}
      </div>

      {/* Preview panel */}
      <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0d0d0d] min-h-[280px] lg:min-h-0">
        {selected ? (
          <PreviewPanel marker={selected} onClose={() => setSelected(null)} />
        ) : (
          <EmptyPanel markerCount={markers.length} />
        )}
      </div>
    </div>
  )
}
