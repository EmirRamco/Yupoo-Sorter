import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

/** Check GitHub Releases for a newer version. Returns the update or null. */
export async function checkForUpdate(): Promise<Update | null> {
  const update = await check();
  return update ?? null;
}

/** Download + install the update, then restart the app. */
export async function installUpdate(update: Update): Promise<void> {
  await update.downloadAndInstall();
  await relaunch();
}
