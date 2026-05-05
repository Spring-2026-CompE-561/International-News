"use client";
import { useEffect } from "react";
import { addToHistory } from "@/lib/readingHistory";

interface Props {
  id: number;
  type: "article" | "story";
  title: string;
  image_url: string | null;
  category: string | null;
}

export function TrackVisit({ id, type, title, image_url, category }: Props) {
  useEffect(() => {
    addToHistory({ id, type, title, image_url, category });
  }, [id, type, title, image_url, category]);
  return null;
}
