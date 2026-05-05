/**
 * Server-side bookmark persistence.
 *
 * Strategy:
 * - localStorage remains the source of truth for display metadata (title, image, etc.)
 * - When the user is logged in, every toggle is also mirrored to the backend API
 * - A lightweight map (stored in localStorage) tracks backend bookmark IDs so we
 *   can issue the correct DELETE /bookmarks/{id} call later.
 *
 * This is fully non-blocking — API failures are swallowed silently so the UI
 * never stalls waiting for the network.
 */

import { apiFetch } from "./client";
import { isLoggedIn } from "./auth";

interface DbBookmark {
  id: number;
  article_id: number | null;
  topic_event_id: number | null;
}

const MAP_KEY = "horizon-bm-server-ids";

type IdMap = Record<string, number>; // "article:123" | "story:456"  →  bookmark db id

function getMap(): IdMap {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

function mapKey(type: "article" | "story", contentId: number) {
  return `${type}:${contentId}`;
}

function storeId(type: "article" | "story", contentId: number, dbId: number) {
  const map = getMap();
  map[mapKey(type, contentId)] = dbId;
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

function clearId(type: "article" | "story", contentId: number) {
  const map = getMap();
  delete map[mapKey(type, contentId)];
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

/** Pull all bookmarks from the server and rebuild the local ID map. Call on login. */
export async function syncBookmarksFromServer(): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const bookmarks = await apiFetch<DbBookmark[]>("/bookmarks");
    const map: IdMap = {};
    for (const bm of bookmarks) {
      if (bm.article_id)      map[mapKey("article", bm.article_id)]      = bm.id;
      if (bm.topic_event_id)  map[mapKey("story",   bm.topic_event_id)]  = bm.id;
    }
    localStorage.setItem(MAP_KEY, JSON.stringify(map));
  } catch {
    // silently fail — localStorage state is still valid
  }
}

/** Called when the user bookmarks an article. */
export async function apiAddArticleBookmark(articleId: number): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const bm = await apiFetch<DbBookmark>("/bookmarks", {
      method: "POST",
      body: JSON.stringify({ article_id: articleId }),
    });
    storeId("article", articleId, bm.id);
  } catch {
    // ignore
  }
}

/** Called when the user removes an article bookmark. */
export async function apiRemoveArticleBookmark(articleId: number): Promise<void> {
  if (!isLoggedIn()) return;
  const dbId = getMap()[mapKey("article", articleId)];
  if (!dbId) return;
  try {
    await apiFetch(`/bookmarks/${dbId}`, { method: "DELETE" });
    clearId("article", articleId);
  } catch {
    // ignore
  }
}

/** Called when the user bookmarks a story. */
export async function apiAddStoryBookmark(storyId: number): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const bm = await apiFetch<DbBookmark>("/bookmarks", {
      method: "POST",
      body: JSON.stringify({ topic_event_id: storyId }),
    });
    storeId("story", storyId, bm.id);
  } catch {
    // ignore
  }
}

/** Called when the user removes a story bookmark. */
export async function apiRemoveStoryBookmark(storyId: number): Promise<void> {
  if (!isLoggedIn()) return;
  const dbId = getMap()[mapKey("story", storyId)];
  if (!dbId) return;
  try {
    await apiFetch(`/bookmarks/${dbId}`, { method: "DELETE" });
    clearId("story", storyId);
  } catch {
    // ignore
  }
}
