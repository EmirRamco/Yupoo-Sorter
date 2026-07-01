export type Category = "clothing" | "jewelry" | "shoes" | "accessories";
export type Status = "saved" | "ordered" | "received";

export interface Item {
  id: string;
  title: string;
  url: string;
  category: Category;
  status: Status;
  image: string | null; // cover: remote URL or embedded base64 thumbnail (data URL)
  images: string[]; // gallery of embedded thumbnails (data URLs), e.g. pulled from Yupoo
  favorite: boolean;
  tags: string[];
  createdAt: string; // ISO date
  deletedAt?: string; // ISO date, set while in the trash
}

export interface AppData {
  version: number;
  items: Item[];
  trash: Item[];
}

export const DATA_VERSION = 1;

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "clothing", label: "Kleidung" },
  { value: "jewelry", label: "Schmuck" },
  { value: "shoes", label: "Schuhe" },
  { value: "accessories", label: "Accessoires" },
];

export const STATUSES: { value: Status; label: string }[] = [
  { value: "saved", label: "Gemerkt" },
  { value: "ordered", label: "Bestellt" },
  { value: "received", label: "Erhalten" },
];

export const CATEGORY_LABEL: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<Category, string>;

export const STATUS_LABEL: Record<Status, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label]),
) as Record<Status, string>;

/** Accent color CSS variable name per category (see index.css @theme). */
export const CATEGORY_COLOR_VAR: Record<Category, string> = {
  clothing: "var(--color-clothing)",
  jewelry: "var(--color-jewelry)",
  shoes: "var(--color-shoes)",
  accessories: "var(--color-accessories)",
};

export const STATUS_COLOR_VAR: Record<Status, string> = {
  saved: "var(--color-saved)",
  ordered: "var(--color-ordered)",
  received: "var(--color-received)",
};

export function emptyData(): AppData {
  return { version: DATA_VERSION, items: [], trash: [] };
}
