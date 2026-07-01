import { invoke } from "@tauri-apps/api/core";

export interface AlbumResult {
  title: string;
  images: string[];
}

/** True if the URL points at a Yupoo album/store. */
export function isYupooUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().includes("yupoo.com");
  } catch {
    return false;
  }
}

/**
 * Pull the title and product photos from a Yupoo album link. Runs in the Rust
 * backend (bypasses CORS + hotlink protection); images are embedded base64
 * data URLs.
 */
export async function fetchAlbum(url: string, limit = 12): Promise<AlbumResult> {
  return invoke<AlbumResult>("fetch_album", { url, limit });
}

/** Fetch only the album title (lightweight, no images). */
export async function fetchAlbumTitle(url: string): Promise<string> {
  return invoke<string>("fetch_album_title", { url });
}
