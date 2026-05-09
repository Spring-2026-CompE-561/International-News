import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { API_URL } from "@/lib/api"
import { COUNTRY_COORDS } from "@/lib/countryCoords"
import { GlobeView } from "@/components/GlobeView"
import type { GlobeMarker, GlobeArticle } from "@/components/GlobeInteractive"

interface Article {
  id: number
  title: string
  image_url: string | null
  published_at: string | null
  source: { name: string } | null
  topic: { name: string } | null
  topic_event: {
    id: number
    title: string
    dek: string | null
    source_count: number
    country_count: number
    angles: { label: string; summary: string | null }[] | null
  } | null
}

async function getArticles(): Promise<Article[]> {
  try {
    const res = await fetch(`${API_URL}/articles/top?limit=30`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.articles ?? []
  } catch {
    return []
  }
}

function buildMarkers(articles: Article[]): GlobeMarker[] {
  const byCountry = new Map<string, GlobeArticle[]>()

  for (const article of articles) {
    if (!article.topic_event?.angles?.length) continue

    const entry: GlobeArticle = {
      id: article.id,
      storyId: article.topic_event.id,
      title: article.topic_event.title || article.title,
      dek: article.topic_event.dek,
      image_url: article.image_url,
      topic: article.topic?.name ?? null,
      source: article.source?.name ?? null,
      published_at: article.published_at,
      source_count: article.topic_event.source_count,
      country_count: article.topic_event.country_count,
    }

    for (const angle of article.topic_event.angles) {
      if (!COUNTRY_COORDS[angle.label]) continue
      const list = byCountry.get(angle.label) ?? []
      // Deduplicate by storyId
      if (!list.some((a) => a.storyId === entry.storyId)) {
        list.push(entry)
      }
      byCountry.set(angle.label, list)
    }
  }

  return Array.from(byCountry.entries()).map(([country, arts]) => ({
    location: COUNTRY_COORDS[country],
    size: Math.min(0.03 + arts.length * 0.015, 0.08),
    country,
    articles: arts,
  }))
}

export default async function GlobePage() {
  const articles = await getArticles()
  const markers = buildMarkers(articles)

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <main className="flex-1 bg-[#F0F0EE] dark:bg-[#141414] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-white/50 hover:text-horizon transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-[1.6rem] sm:text-[2rem] font-semibold tracking-[-0.04em] text-[#183153] dark:text-white leading-none">
              News Globe
            </h1>
            <p className="text-gray-400 dark:text-white/40 text-sm mt-1">
              {markers.length} countries in the news today
            </p>
          </div>
          <span className="text-gray-400 dark:text-white/25 text-sm font-medium shrink-0">{today}</span>
        </div>

        <div>
          <GlobeView markers={markers} />
        </div>
      </div>
    </main>
  )
}
