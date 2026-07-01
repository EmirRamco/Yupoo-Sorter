import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Check, Plus, PackageOpen, Search, Trash2 } from "lucide-react";
import Sidebar, { CategoryFilter } from "./components/Sidebar";
import ItemCard from "./components/ItemCard";
import AddEditPanel from "./components/AddEditPanel";
import Lightbox from "./components/Lightbox";
import ConfirmDialog, { ConfirmSpec } from "./components/ConfirmDialog";
import {
  AppData,
  Category,
  CATEGORY_LABEL,
  Item,
  STATUSES,
  Status,
  emptyData,
} from "./lib/types";
import { exportData, importData, loadData, saveData } from "./lib/storage";
import { fetchAlbum, fetchAlbumTitle, isYupooUrl } from "./lib/yupoo";

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

  // Load persisted collection once on startup.
  useEffect(() => {
    loadData()
      .then(setData)
      .finally(() => setLoaded(true));
  }, []);

  // Auto-save (debounced) whenever the collection changes after load.
  const first = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => void saveData(data), 400);
    return () => clearTimeout(t);
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
      if (sort === "title") return a.title.localeCompare(b.title, "de");
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
      title: "In den Papierkorb verschieben?",
      message: `„${item.title || "Ohne Titel"}" wird in den Papierkorb verschoben und kann dort wiederhergestellt werden.`,
      confirmLabel: "In Papierkorb",
      action: () => moveToTrash(item),
    });
  }

  function moveToTrash(item: Item) {
    setData((d) => ({
      ...d,
      items: d.items.filter((i) => i.id !== item.id),
      trash: [{ ...item, deletedAt: new Date().toISOString() }, ...d.trash],
    }));
    flash("In den Papierkorb verschoben");
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
    flash("Wiederhergestellt");
  }

  function askDeleteForever(item: Item) {
    setConfirm({
      title: "Endgültig löschen?",
      message: `„${item.title || "Ohne Titel"}" wird dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.`,
      confirmLabel: "Endgültig löschen",
      danger: true,
      action: () => {
        setData((d) => ({
          ...d,
          trash: d.trash.filter((i) => i.id !== item.id),
        }));
        flash("Endgültig gelöscht");
      },
    });
  }

  function askEmptyTrash() {
    setConfirm({
      title: "Papierkorb leeren?",
      message: `Alle ${data.trash.length} Artikel im Papierkorb werden dauerhaft gelöscht.`,
      confirmLabel: "Papierkorb leeren",
      danger: true,
      action: () => {
        setData((d) => ({ ...d, trash: [] }));
        flash("Papierkorb geleert");
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
        flash("Link konnte nicht geöffnet werden");
      }
    } else {
      flash("Kein Link hinterlegt");
    }
  }

  function openGallery(item: Item) {
    const imgs = item.images.length > 0 ? item.images : item.image ? [item.image] : [];
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
    flash(isNew ? "Artikel hinzugefügt" : "Gespeichert");
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
      flash("Bilder konnten nicht geladen werden");
    } finally {
      setEnrichingIds((ids) => ids.filter((id) => id !== item.id));
    }
  }

  async function handleExport() {
    try {
      const path = await exportData(data);
      if (path) flash("Sammlung exportiert");
    } catch {
      flash("Export fehlgeschlagen");
    }
  }

  async function handleImport() {
    try {
      const imported = await importData();
      if (imported) {
        setData(imported);
        flash(`${imported.items.length} Artikel importiert`);
      }
    } catch {
      flash("Import fehlgeschlagen");
    }
  }

  const viewTitle = showTrash
    ? "Papierkorb"
    : favoritesOnly
      ? "Favoriten"
      : category === "all"
        ? "Alle Artikel"
        : CATEGORY_LABEL[category];

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[var(--color-ink)]">
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
      />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <header className="border-b border-[var(--color-border)] px-8 pb-4 pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-faint)]">
                Übersicht
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
                  placeholder="Suchen…"
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
                    <Trash2 size={16} /> Papierkorb leeren
                  </button>
                )
              ) : (
                <>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="cursor-pointer rounded-lg border border-[var(--color-border-strong)] bg-white py-2 pl-3 pr-8 text-sm font-medium text-[var(--color-ink-soft)] outline-none transition focus:border-[var(--color-ink)]"
                  >
                    <option value="newest">Neueste zuerst</option>
                    <option value="oldest">Älteste zuerst</option>
                    <option value="title">Name (A–Z)</option>
                  </select>

                  <button
                    type="button"
                    onClick={startAdd}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-90"
                  >
                    <Plus size={16} /> Hinzufügen
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status filter */}
          {!showTrash && (
            <div className="mt-4 flex items-center gap-1.5">
              <FilterPill
                label="Alle Status"
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              />
              {STATUSES.map((s) => (
                <FilterPill
                  key={s.value}
                  label={s.label}
                  active={statusFilter === s.value}
                  onClick={() => setStatusFilter(s.value)}
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
        onIndexChange={(i) =>
          setGallery((g) => (g ? { ...g, index: i } : g))
        }
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
            ? "Papierkorb ist leer"
            : hasItems
              ? "Nichts gefunden"
              : "Noch keine Artikel"}
        </h3>
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          {isTrash
            ? "Gelöschte Artikel erscheinen hier und können wiederhergestellt werden."
            : hasItems
              ? "Passe Suche oder Filter an, um Artikel zu sehen."
              : "Füge deinen ersten Yupoo-Link hinzu und behalte den Überblick."}
        </p>
        {!hasItems && !isTrash && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={16} /> Artikel hinzufügen
          </button>
        )}
      </div>
    </motion.div>
  );
}
