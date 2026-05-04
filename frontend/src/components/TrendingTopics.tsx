"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";

// Map angle labels to ISO 3166-1 alpha-2 country codes for flag emoji
const LABEL_TO_CODE: Record<string, string> = {
  "united states": "US",
  "united kingdom": "GB",
  "france": "FR",
  "germany": "DE",
  "australia": "AU",
  "canada": "CA",
  "india": "IN",
  "japan": "JP",
  "brazil": "BR",
  "south africa": "ZA",
  "uae": "AE",
  "united arab emirates": "AE",
  "china": "CN",
  "russia": "RU",
  "israel": "IL",
  "mexico": "MX",
  "iran": "IR",
  "ukraine": "UA",
  "taiwan": "TW",
  "south korea": "KR",
  "north korea": "KP",
  "italy": "IT",
  "spain": "ES",
  "turkey": "TR",
  "saudi arabia": "SA",
  "egypt": "EG",
  "nigeria": "NG",
  "pakistan": "PK",
  "indonesia": "ID",
  "netherlands": "NL",
  "sweden": "SE",
  "switzerland": "CH",
  "poland": "PL",
  "argentina": "AR",
  "europe": "EU",
  "european union": "EU",
};


interface TrendingTopic {
  topic: string;
  count: string;
  image: string;
  category: string;
  slug?: string;
  angleCountries?: string[];
  isCluster?: boolean;
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
}

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  return (
    <section className="bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-black py-4 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-5 gap-3">
          {topics.map((topic, index) => {
            // Get flags from angle countries
            const flags = (topic.angleCountries || [])
              .filter((label) => label.toLowerCase().trim() in LABEL_TO_CODE)
              .slice(0, 3);

            return (
              <Link
                key={index}
                href={`/topic/${topic.slug || topic.category.toLowerCase()}`}
                className="relative aspect-[5/7] rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl group"
              >
                <img
                  src={topic.image}
                  alt={topic.topic}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

                {/* Cluster label — top right, matching header brand style */}
                {topic.isCluster && (
                  <div className="absolute top-2.5 right-3 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white drop-shadow-lg block">
                      Horizon News
                    </span>
                    <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/60 drop-shadow-lg block mt-0.5">
                      Briefing
                    </span>
                  </div>
                )}

                <div className="absolute top-0.5 left-4 z-10">
                  <div className="relative">
                    <TrendingUp className="absolute top-1 -left-1 w-11 h-11 text-white/40" />

                    <span
                      className="relative font-serif text-[2.7rem] font-black italic text-white drop-shadow-lg"
                      style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)" }}
                    >
                      {index + 1}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                    {topic.category}
                  </span>

                  <h3 className="font-serif text-sm font-semibold leading-tight text-white drop-shadow-md line-clamp-2">
                    {topic.topic}
                  </h3>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-white/85">{topic.count}</span>

                    <div className="flex -space-x-1.5">
                      {[0, 1, 2].map((i) => {
                        const label = flags[i];
                        const zIndex = 3 - i;
                        if (label) {
                          const code = LABEL_TO_CODE[label.toLowerCase().trim()];
                          return (
                            <img
                              key={i}
                              src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                              alt={label}
                              className="w-4 h-4 rounded-full object-cover border border-white/30 shadow-sm"
                              style={{ zIndex }}
                            />
                          );
                        }
                        const opacity = [0.9, 0.7, 0.5][i];
                        return (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                            style={{ backgroundColor: `rgba(255,255,255,${opacity})`, zIndex }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
