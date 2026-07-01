import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import {
  AppData,
  Category,
  DATA_VERSION,
  Item,
  Status,
  emptyData,
} from "./types";

const VALID_CATEGORIES: Category[] = [
  "clothing",
  "jewelry",
  "shoes",
  "accessories",
];
const VALID_STATUSES: Status[] = ["saved", "ordered", "received"];

/** Defensively coerce one unknown entry into a well-formed Item. */
function cleanItem(it: unknown): Item | null {
  if (!it || typeof it !== "object") return null;
  const o = it as Record<string, unknown>;
  const category = VALID_CATEGORIES.includes(o.category as Category)
    ? (o.category as Category)
    : "clothing";
  const status = VALID_STATUSES.includes(o.status as Status)
    ? (o.status as Status)
    : "saved";
  return {
    id: typeof o.id === "string" ? o.id : crypto.randomUUID(),
    title: typeof o.title === "string" ? o.title : "",
    url: typeof o.url === "string" ? o.url : "",
    category,
    status,
    image: typeof o.image === "string" ? o.image : null,
    images: Array.isArray(o.images)
      ? o.images.filter((s): s is string => typeof s === "string")
      : [],
    favorite: Boolean(o.favorite),
    tags: Array.isArray(o.tags)
      ? o.tags.filter((t): t is string => typeof t === "string")
      : [],
    createdAt:
      typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
    ...(typeof o.deletedAt === "string" ? { deletedAt: o.deletedAt } : {}),
  };
}

function cleanList(raw: unknown): Item[] {
  return (Array.isArray(raw) ? raw : [])
    .map(cleanItem)
    .filter((x): x is Item => x !== null);
}

/** Defensively coerce unknown JSON into a well-formed AppData. */
function normalize(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return emptyData();
  const obj = raw as Record<string, unknown>;
  return {
    version: DATA_VERSION,
    items: cleanList(obj.items),
    trash: cleanList(obj.trash),
  };
}

function parse(text: string): AppData {
  if (!text || !text.trim()) return emptyData();
  try {
    return normalize(JSON.parse(text));
  } catch {
    return emptyData();
  }
}

/** Load the auto-persisted collection from the app data directory. */
export async function loadData(): Promise<AppData> {
  const text = await invoke<string>("load_data");
  return parse(text);
}

/** Auto-save the collection to the app data directory. */
export async function saveData(data: AppData): Promise<void> {
  await invoke("save_data", { contents: JSON.stringify(data, null, 2) });
}

/**
 * Export the collection to a user-chosen file.
 * Returns the chosen path, or null if the user cancelled.
 */
export async function exportData(data: AppData): Promise<string | null> {
  const path = await save({
    title: "Sammlung exportieren",
    defaultPath: "yupoo-sorter.json",
    filters: [{ name: "Yupoo Sorter", extensions: ["json"] }],
  });
  if (!path) return null;
  await invoke("write_file", {
    path,
    contents: JSON.stringify(data, null, 2),
  });
  return path;
}

/**
 * Import a collection from a user-chosen file.
 * Returns the parsed data, or null if the user cancelled.
 */
export async function importData(): Promise<AppData | null> {
  const path = await open({
    title: "Sammlung importieren",
    multiple: false,
    directory: false,
    filters: [{ name: "Yupoo Sorter", extensions: ["json"] }],
  });
  if (!path || typeof path !== "string") return null;
  const text = await invoke<string>("read_file", { path });
  return parse(text);
}
