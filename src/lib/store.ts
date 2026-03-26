import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export interface TikTokLink {
  id: string;
  url: string;
  title: string;
  description: string;
  folderId: string | null;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

interface Store {
  links: TikTokLink[];
  folders: Folder[];
}

const DATA_FILE = join(process.cwd(), "data.json");

const DEFAULT_STORE: Store = {
  links: [],
  folders: [
    { id: "1", name: "Favorites", createdAt: new Date().toISOString() },
    { id: "2", name: "Watch Later", createdAt: new Date().toISOString() },
    { id: "3", name: "Tutorials", createdAt: new Date().toISOString() },
  ],
};

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    await writeStore(DEFAULT_STORE);
    return DEFAULT_STORE;
  }
}

async function writeStore(store: Store): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

export async function getFolders(): Promise<Folder[]> {
  const store = await readStore();
  return store.folders;
}

export async function createFolder(name: string): Promise<Folder> {
  const store = await readStore();
  const folder: Folder = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  };
  store.folders.push(folder);
  await writeStore(store);
  return folder;
}

export async function deleteFolder(id: string): Promise<void> {
  const store = await readStore();
  store.folders = store.folders.filter((f) => f.id !== id);
  store.links = store.links.map((l) =>
    l.folderId === id ? { ...l, folderId: null } : l
  );
  await writeStore(store);
}

export async function getLinks(folderId?: string | null): Promise<TikTokLink[]> {
  const store = await readStore();
  if (folderId) {
    return store.links.filter((l) => l.folderId === folderId);
  }
  return store.links;
}

export async function searchLinks(query: string): Promise<TikTokLink[]> {
  const store = await readStore();
  const q = query.toLowerCase();
  return store.links.filter(
    (l) =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q)
  );
}

export async function createLink(data: {
  url: string;
  title: string;
  description?: string;
  folderId?: string | null;
}): Promise<TikTokLink> {
  const store = await readStore();
  const link: TikTokLink = {
    id: crypto.randomUUID(),
    url: data.url,
    title: data.title,
    description: data.description || "",
    folderId: data.folderId || null,
    createdAt: new Date().toISOString(),
  };
  store.links.push(link);
  await writeStore(store);
  return link;
}

export async function updateLink(
  id: string,
  data: Partial<Pick<TikTokLink, "url" | "title" | "description" | "folderId">>
): Promise<TikTokLink | null> {
  const store = await readStore();
  const idx = store.links.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  store.links[idx] = { ...store.links[idx], ...data };
  await writeStore(store);
  return store.links[idx];
}

export async function deleteLink(id: string): Promise<void> {
  const store = await readStore();
  store.links = store.links.filter((l) => l.id !== id);
  await writeStore(store);
}
