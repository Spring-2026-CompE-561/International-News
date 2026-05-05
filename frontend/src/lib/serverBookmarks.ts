import { getAuthHeaders } from "@/lib/auth";

import { API_URL } from "@/lib/api";
const ID_MAP_KEY = "horizon-bm-ids"; // { "a-123": 456, "s-789": 321 }

type BmKey = string;
type IdMap = Record<BmKey, number>;

function getIdMap(): IdMap {
  try {
    return JSON.parse(localStorage.getItem(ID_MAP_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function storeServerId(key: BmKey, serverId: number) {
  const map = getIdMap();
  map[key] = serverId;
  localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
}

function forgetServerId(key: BmKey) {
  const map = getIdMap();
  delete map[key];
  localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
}

// Pull server bookmarks and overwrite localStorage — call on login and bookmarks page load
export async function syncFromServer(): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return;

  try {
    const res = await fetch(`${API_URL}/bookmarks`, { headers });
    if (!res.ok) return;

    const bookmarks: Array<{ id: number; article_id: number | null; topic_event_id: number | null }> =
      await res.json();

    const articleIds: number[] = [];
    const storyIds: number[] = [];
    const map: IdMap = {};

    for (const bm of bookmarks) {
      if (bm.article_id) {
        articleIds.push(bm.article_id);
        map[`a-${bm.article_id}`] = bm.id;
      }
      if (bm.topic_event_id) {
        storyIds.push(bm.topic_event_id);
        map[`s-${bm.topic_event_id}`] = bm.id;
      }
    }

    // Merge with local — never drop bookmarks that exist locally but not on server yet
    const localArticleIds: number[] = JSON.parse(localStorage.getItem("horizon-bookmarks") || "[]");
    const localStoryIds: number[] = JSON.parse(localStorage.getItem("horizon-story-bookmarks") || "[]");
    const mergedArticles = Array.from(new Set([...articleIds, ...localArticleIds]));
    const mergedStories = Array.from(new Set([...storyIds, ...localStoryIds]));

    localStorage.setItem("horizon-bookmarks", JSON.stringify(mergedArticles));
    localStorage.setItem("horizon-story-bookmarks", JSON.stringify(mergedStories));
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));

    window.dispatchEvent(new Event("bookmarks-changed"));
    window.dispatchEvent(new Event("story-bookmarks-changed"));
  } catch {
    // Server unreachable — local bookmarks unchanged
  }
}

export async function addToServer(type: "article" | "story", localId: number): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return;

  const body =
    type === "article"
      ? { article_id: localId, topic_event_id: null }
      : { article_id: null, topic_event_id: localId };

  try {
    const res = await fetch(`${API_URL}/bookmarks`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const bm = await res.json();
      storeServerId(`${type === "article" ? "a" : "s"}-${localId}`, bm.id);
    }
  } catch {
    // Server unreachable — bookmark saved locally, will sync on next visit
  }
}

export async function removeFromServer(type: "article" | "story", localId: number): Promise<void> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return;

  const key = `${type === "article" ? "a" : "s"}-${localId}`;
  const serverId = getIdMap()[key];
  if (!serverId) return;

  try {
    const res = await fetch(`${API_URL}/bookmarks/${serverId}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) forgetServerId(key);
  } catch {
    // Server unreachable — will be out of sync until next login
  }
}
