const KEY = "reading_history";
const MAX = 30;

export interface HistoryItem {
  id: number;
  type: "article" | "story";
  title: string;
  image_url: string | null;
  category: string | null;
  visited_at: string;
}

export function getReadingHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addToHistory(item: Omit<HistoryItem, "visited_at">): void {
  const deduped = getReadingHistory().filter(
    (h) => !(h.id === item.id && h.type === item.type)
  );
  const updated = [
    { ...item, visited_at: new Date().toISOString() },
    ...deduped,
  ].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("history-changed"));
}

export function removeFromHistory(id: number, type: "article" | "story"): void {
  const updated = getReadingHistory().filter(
    (h) => !(h.id === id && h.type === type)
  );
  localStorage.setItem(KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event("history-changed"));
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("history-changed"));
}
