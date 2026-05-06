/**
 * Server-side bookmark persistence.
 *
 * Strategy:
 * - On login, bookmarks are loaded from the server and written into localStorage
 *   so the rest of the UI can read them without auth headers on every render.
 * - Every toggle is also mirrored to the backend API.
 * - A lightweight map (stored in localStorage) tracks backend bookmark IDs so we
 *   can issue the correct DELETE /bookmarks/{id} call later.
 *
 * This is fully non-blocking — API failures are swallowed silently so the UI
 * never stalls waiting for the network.
 */

import { apiFetch } from "./client";
import { isLoggedIn } from "./auth";

interface SourceInBookmark { name: string }
interface TopicInBookmark { name: string }
interface ArticleInBookmark {
  id: number;
  title: string | null;
  source: SourceInBookmark | null;
  topic: TopicInBookmark | null;
  image_url: string | null;
  published_at: string | null;
}
interface StoryInBookmark {
  id: number;
  title: string | null;
  category: string | null;
  image_url: string | null;
  source_count: number | null;
  country_count: number | null;
  created_at: string | null;
}
interface DbBookmark {
  id: number;
  article_id: number | null;
  topic_event_id: number | null;
}

interface DbBookmarkRich extends DbBookmark {
  article: ArticleInBookmark | null;
  topic_event: StoryInBookmark | null;
}

const MAP_KEY = "horizon-bm-server-ids";
const ARTICLE_KEY = "horizon-bookmarks";
const STORY_KEY = "horizon-story-bookmarks";

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

/** Wipe all bookmark data from localStorage. Call on logout. */
export function clearLocalBookmarkData(): void {
  localStorage.removeItem(MAP_KEY);
  localStorage.removeItem(ARTICLE_KEY);
  localStorage.removeItem(STORY_KEY);
  window.dispatchEvent(new Event("bookmarks-changed"));
  window.dispatchEvent(new Event("story-bookmarks-changed"));
}

/** Pull all bookmarks from the server, rebuild localStorage and the ID map. Call on login. */
export async function syncBookmarksFromServer(): Promise<void> {
  if (!isLoggedIn()) return;
  try {
    const bookmarks = await apiFetch<DbBookmarkRich[]>("/bookmarks");
    const map: IdMap = {};
    const articles = [];
    const stories = [];

    for (const bm of bookmarks) {
      if (bm.article_id && bm.article) {
        map[mapKey("article", bm.article_id)] = bm.id;
        articles.push({
          id: bm.article.id,
          title: bm.article.title,
          topic: bm.article.topic?.name ?? null,
          source: bm.article.source?.name ?? null,
          image_url: bm.article.image_url,
          published_at: bm.article.published_at,
        });
      } else if (bm.topic_event_id && bm.topic_event) {
        map[mapKey("story", bm.topic_event_id)] = bm.id;
        stories.push({
          id: bm.topic_event.id,
          title: bm.topic_event.title,
          category: bm.topic_event.category,
          image_url: bm.topic_event.image_url,
          source_count: bm.topic_event.source_count,
          country_count: bm.topic_event.country_count,
          created_at: bm.topic_event.created_at,
        });
      }
    }

    localStorage.setItem(MAP_KEY, JSON.stringify(map));
    if (articles.length > 0) {
      localStorage.setItem(ARTICLE_KEY, JSON.stringify(articles));
      window.dispatchEvent(new Event("bookmarks-changed"));
    }
    if (stories.length > 0) {
      localStorage.setItem(STORY_KEY, JSON.stringify(stories));
      window.dispatchEvent(new Event("story-bookmarks-changed"));
    }
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
