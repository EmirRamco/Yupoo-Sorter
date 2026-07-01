import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Update } from "@tauri-apps/plugin-updater";
import { Check, Plus, PackageOpen, Search, Trash2 } from "lucide-react";
import Sidebar, { CategoryFilter } from "./components/Sidebar";
import ItemCard from "./components/ItemCard";
import AddEditPanel from "./components/AddEditPanel";
import Lightbox from "./components/Lightbox";
import ConfirmDialog, { ConfirmSpec } from "./components/ConfirmDialog";
import TitleBar from "./components/TitleBar";
import { AppData, Category, Item, STATUSES, Status, emptyData } from "./lib/types";
import { exportData, importData, loadData, saveData } from "./lib/storage";
import { fetchAlbum, fetchAlbumTitle, isYupooUrl } from "./lib/yupoo";
import { checkForUpdate, installUpdate } from "./lib/updater";
import { useI18n } from "./lib/i18n";

type Sort = "newest" | "oldest" | "title";

function newItem(category: Category): Item {
  return {
    id: crypto.randomUUID(),
    title: "",
    url: "",
    category,
    status: "saved",
    image: null,
    images: [],
    favorite: false,
    tags: [],
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const { t } = useI18n();
  const [data, setData] = useState<AppData>(emptyData());
  const [loaded, setLoaded] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null);

  const [editing, setEditing] = useState<Item | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gallery, setGallery] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [enrichingIds, setEnrichingIds] = useState<string[]>([]);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Load persisted collection once on startup.
  useEffect(() => {
    loadData()
      .then(setData)
      .finally(() => setLoaded(true));
  }, []);

  // Silent update check on startup.
  useEffect(() => {
    void runUpdateCheck(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save (debounced) whenever the collection changes after load.
  const first = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => void saveData(data), 400);
    return () => clearTimeout(timer);
  }, [data, loaded]);

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  const counts = useMemo(() => {
    const c: Record<Category, number> = {
      clothing: 0,
      jewelry: 0,
      shoes: 0,
      accessories: 0,
    };
    for (const it of data.items) c[it.category]++;
    return c;
  }, [data.items]);

  const favoritesCount = useMemo(
    () => data.items.filter((i) => i.favorite).length,
    [data.items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = showTrash ? data.trash : data.items;
    let list = source.filter((it) => {
      if (!showTrash) {
        if (favoritesOnly && !it.favorite) return false;
        if (category !== "all" && it.category !== category) return false;
        if (statusFilter !== "all" && it.status !== statusFilter) return false;
      }
      if (q) {
        const hay = (it.title + " " + it.tags.join(" ")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (showTrash)
        return (b.deletedAt ?? "").localeCompare(a.deletedAt ?? "");
      if (sort === "title") return a.title.localeCompare(b.title);
      const cmp = a.createdAt.localeCompare(b.createdAt);
      return sort === "newest" ? -cmp : cmp;
    });
    return list;
  }, [
    data.items,
    data.trash,
    showTrash,
    query,
    category,
    favoritesOnly,
    statusFilter,
    sort,
  ]);

  // ---- mutations ----
  function upsert(item: Item) {
    setData((d) => {
      const exists = d.items.some((i) => i.id === item.id);
      const items = exists
        ? d.items.map((i) => (i.id === item.id ? item : i))
        : [item, ...d.items];
      return { ...d, items };
    });
  }

  function askDelete(item: Item) {
    setConfirm({
      title: t("confirm.trashTitle"),
      message: t("confirm.trashMsg", { name: item.title || t("card.untitled") }),
      confirmLabel: t("confirm.trashConfirm"),
      action: () => moveToTrash(item),
    });
  }

  function moveToTrash(item: Item) {
    setData((d) => ({
      ...d,
      items: d.items.filter((i) => i.id !== item.id),
      trash: [{ ...item, deletedAt: new Date().toISOString() }, ...d.trash],
    }));
    flash(t("toast.movedToTrash"));
  }

  function restore(item: Item) {
    setData((d) => {
      const { deletedAt: _drop, ...rest } = item;
      void _drop;
      return {
        ...d,
        trash: d.trash.filter((i) => i.id !== item.id),
        items: [rest, ...d.items],
      };
    });
    flash(t("toast.restored"));
  }

  function askDeleteForever(item: Item) {
    setConfirm({
      title: t("confirm.deleteTitle"),
      message: t("confirm.deleteMsg", {
        name: item.title || t("card.untitled"),
      }),
      confirmLabel: t("confirm.deleteConfirm"),
      danger: true,
      action: () => {
        setData((d) => ({
          ...d,
          trash: d.trash.filter((i) => i.id !== item.id),
        }));
        flash(t("toast.deletedForever"));
      },
    });
  }

  function askEmptyTrash() {
    setConfirm({
      title: t("confirm.emptyTitle"),
      message: t("confirm.emptyMsg", { count: data.trash.length }),
      confirmLabel: t("confirm.emptyConfirm"),
      danger: true,
      action: () => {
        setData((d) => ({ ...d, trash: [] }));
        flash(t("toast.trashEmptied"));
      },
    });
  }

  function toggleFavorite(item: Item) {
    setData((d) => ({
      ...d,
      items: d.items.map((i) =>
        i.id === item.id ? { ...i, favorite: !i.favorite } : i,
      ),
    }));
  }

  /** Update one item in place (no-op if it was meanwhile removed/trashed). */
  function updateItem(id: string, updater: (prev: Item) => Item) {
    setData((d) => ({
      ...d,
      items: d.items.map((i) => (i.id === id ? updater(i) : i)),
    }));
  }

  async function openItem(item: Item) {
    if (item.url) {
      try {
        await openUrl(item.url);
      } catch {
        flash(t("toast.linkFailed"));
      }
    } else {
      flash(t("toast.noLink"));
    }
  }

  function openGallery(item: Item) {
    const imgs =
      item.images.length > 0 ? item.images : item.image ? [item.image] : [];
    if (imgs.length > 0) setGallery({ images: imgs, index: 0 });
  }

  function startAdd() {
    setIsNew(true);
    setEditing(newItem(category === "all" ? "clothing" : category));
  }

  function startEdit(item: Item) {
    setIsNew(false);
    setEditing(item);
  }

  function handleSave(item: Item) {
    upsert(item);
    setEditing(null);
    flash(isNew ? t("toast.added") : t("toast.saved"));
    // Pull title/images from Yupoo in the background so adding stays instant.
    void enrich(item);
  }

  /**
   * Background enrichment: if a Yupoo item is missing images and/or a title,
   * fetch them without blocking the UI. Runs detached — multiple can run at once.
   */
  async function enrich(item: Item) {
    if (!isYupooUrl(item.url)) return;
    const needImages = item.images.length === 0;
    const needTitle = !item.title.trim();
    if (!needImages && !needTitle) return;

    setEnrichingIds((ids) => [...ids, item.id]);
    try {
      if (needImages) {
        const { title, images } = await fetchAlbum(item.url);
        updateItem(item.id, (prev) => ({
          ...prev,
          images: images.length ? images : prev.images,
          image: prev.image ?? images[0] ?? null,
          title: prev.title.trim() ? prev.title : title || prev.title,
        }));
      } else if (needTitle) {
        const title = await fetchAlbumTitle(item.url);
        if (title)
          updateItem(item.id, (prev) =>
            prev.title.trim() ? prev : { ...prev, title },
          );
      }
    } catch {
      flash(t("toast.imagesFailed"));
    } finally {
      setEnrichingIds((ids) => ids.filter((id) => id !== item.id));
    }
  }

  async function handleExport() {
    try {
      const path = await exportData(data);
      if (path) flash(t("toast.exported"));
    } catch {
      flash(t("toast.exportFailed"));
    }
  }

  async function handleImport() {
    try {
      const imported = await importData();
      if (imported) {
        setData(imported);
        flash(t("toast.imported", { count: imported.items.length }));
      }
    } catch {
      flash(t("toast.importFailed"));
    }
  }

  // ---- updater ----
  async function runUpdateCheck(manual: boolean) {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      const update = await checkForUpdate();
      if (update) {
        setConfirm({
          title: t("updater.availableTitle"),
          message: t("updater.availableMsg", { version: update.version }),
          confirmLabel: t("updater.install"),
          action: () => void doInstall(update),
        });
      } else if (manual) {
        flash(t("updater.upToDate"));
      }
    } catch {
      if (manual) flash(t("updater.failed"));
    } finally {
      setCheckingUpdate(false);
    }
  }

  async function doInstall(update: Update) {
    flash(t("updater.installing"));
    try {
      await installUpdate(update);
    } catch {
      flash(t("updater.failed"));
    }
  }

  const viewTitle = showTrash
    ? t("view.trash")
    : favoritesOnly
      ? t("view.favorites")
      : category === "all"
        ? t("view.allItems")
        : t(`cat.${category}`);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-[var(--color-ink)]">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={category}
          onSelect={(c) => {
            setCategory(c);
            setFavoritesOnly(false);
            setShowTrash(false);
          }}
          favoritesOnly={favoritesOnly}
          onToggleFavorites={() => {
            setFavoritesOnly((v) => !v);
            setShowTrash(false);
          }}
          trashActive={showTrash}
          onSelectTrash={() => {
            setShowTrash(true);
            setFavoritesOnly(false);
          }}
          trashCount={data.trash.length}
          counts={counts}
          total={data.items.length}
          favoritesCount={favoritesCount}
          onExport={handleExport}
          onImport={handleImport}
          onCheckUpdates={() => void runUpdateCheck(true)}
          checkingUpdate={checkingUpdate}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <header className="border-b border-[var(--color-border)] px-8 pb-4 pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-faint)]">
                  {t("section.overview")}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {viewTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("toolbar.search")}
                    className="w-52 rounded-lg border border-[var(--color-border-strong)] bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-ink)] focus:ring-4 focus:ring-[var(--color-ink)]/5"
                  />
                </div>

                {showTrash ? (
                  data.trash.length > 0 && (
                    <button
                      type="button"
                      onClick={askEmptyTrash}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                    >
                      <Trash2 size={16} /> {t("btn.emptyTrash")}
                    </button>
                  )
                ) : (
                  <>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as Sort)}
                      className="cursor-pointer rounded-lg border border-[var(--color-border-strong)] bg-white py-2 pl-3 pr-8 text-sm font-medium text-[var(--color-ink-soft)] outline-none transition focus:border-[var(--color-ink)]"
                    >
                      <option value="newest">{t("sort.newest")}</option>
                      <option value="oldest">{t("sort.oldest")}</option>
                      <option value="title">{t("sort.title")}</option>
                    </select>

                    <button
                      type="button"
                      onClick={startAdd}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-90"
                    >
                      <Plus size={16} /> {t("btn.add")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Status filter */}
            {!showTrash && (
              <div className="mt-4 flex items-center gap-1.5">
                <FilterPill
                  label={t("status.all")}
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                />
                {STATUSES.map((s) => (
                  <FilterPill
                    key={s}
                    label={t(`status.${s}`)}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                  />
                ))}
              </div>
            )}
          </header>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {visible.length === 0 ? (
              <EmptyState
                isTrash={showTrash}
                hasItems={data.items.length > 0}
                onAdd={startAdd}
              />
            ) : (
              <motion.div
                layout
                className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5"
              >
                <AnimatePresence mode="popLayout">
                  {visible.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      trashed={showTrash}
                      enriching={enrichingIds.includes(item.id)}
                      onEdit={startEdit}
                      onDelete={askDelete}
                      onRestore={restore}
                      onDeleteForever={askDeleteForever}
                      onToggleFavorite={toggleFavorite}
                      onOpen={openItem}
                      onOpenGallery={openGallery}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </main>
      </div>

      <AddEditPanel
        editing={editing}
        isNew={isNew}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <Lightbox
        images={gallery?.images ?? []}
        index={gallery?.index ?? -1}
        onClose={() => setGallery(null)}
        onIndexChange={(i) => setGallery((g) => (g ? { ...g, index: i } : g))}
      />

      <ConfirmDialog spec={confirm} onClose={() => setConfirm(null)} />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-lift)]"
          >
            <Check size={15} className="text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        active
          ? "bg-[var(--color-ink)] text-white"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({
  hasItems,
  onAdd,
  isTrash,
}: {
  hasItems: boolean;
  onAdd: () => void;
  isTrash?: boolean;
}) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid h-full place-items-center py-20"
    >
      <div className="max-w-xs text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-faint)]">
          {isTrash ? <Trash2 size={28} /> : <PackageOpen size={28} />}
        </div>
        <h3 className="text-lg font-semibold">
          {isTrash
            ? t("empty.trashTitle")
            : hasItems
              ? t("empty.nothingTitle")
              : t("empty.noItemsTitle")}
        </h3>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          {isTrash
            ? t("empty.trashDesc")
            : hasItems
              ? t("empty.nothingDesc")
              : t("empty.noItemsDesc")}
        </p>
        {!hasItems && !isTrash && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={16} /> {t("empty.addItem")}
          </button>
        )}
      </div>
    </motion.div>
  );
}
