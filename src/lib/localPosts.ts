const STORAGE_KEY = "shefi-wall::my-post-its";

export function rememberPost(id: string) {
  if (typeof window === "undefined") return;
  const existing = readPosts();
  if (existing.includes(id)) return;
  const next = [...existing, id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function forgetPost(id: string) {
  if (typeof window === "undefined") return;
  const next = readPosts().filter((item) => item !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function readPosts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch (error) {
    console.error("Failed to read stored post-its", error);
    return [];
  }
}
