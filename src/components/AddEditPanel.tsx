import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, DownloadCloud, ImagePlus, Loader2, Plus, X } from "lucide-react";
import {
  CATEGORIES,
  Category,
  Item,
  STATUSES,
  Status,
  CATEGORY_COLOR_VAR,
  STATUS_COLOR_VAR,
} from "../lib/types";
import { fileToThumbnail } from "../lib/image";
import { fetchAlbum, isYupooUrl } from "../lib/yupoo";
import { useI18n } from "../lib/i18n";

interface Props {
  /** The item being edited, or null when the panel is closed. */
  editing: Item | null;
  isNew: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
}

export default function AddEditPanel({ editing, isNew, onClose, onSave }: Props) {
  return (
    <AnimatePresence>
      {editing && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[var(--color-ink)]/20 backdrop-blur-[2px]"
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col border-l border-[var(--color-border)] bg-white shadow-[var(--shadow-lift)]"
          >
            <Form
              key={editing.id}
              initial={editing}
              isNew={isNew}
              onClose={onClose}
              onSave={onSave}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Form({
  initial,
  isNew,
  onClose,
  onSave,
}: {
  initial: Item;
  isNew: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState(initial.title);
  const [url, setUrl] = useState(initial.url);
  const [category, setCategory] = useState<Category>(initial.category);
  const [status, setStatus] = useState<Status>(initial.status);
  const [image, setImage] = useState<string | null>(initial.image);
  const [images, setImages] = useState<string[]>(initial.images);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function addTag() {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const thumb = await fileToThumbnail(file);
      setImage(thumb);
      setImages((prev) => (prev.includes(thumb) ? prev : [...prev, thumb]));
    } finally {
      setBusy(false);
    }
  }

  async function loadGallery() {
    if (!isYupooUrl(url)) return;
    setLoadingGallery(true);
    setGalleryError(null);
    try {
      const { title: albumTitle, images: pulled } = await fetchAlbum(url.trim());
      // Merge, keeping any images the user already had.
      setImages((prev) => {
        const merged = [...prev];
        for (const src of pulled) if (!merged.includes(src)) merged.push(src);
        return merged;
      });
      if (!image && pulled.length > 0) setImage(pulled[0]);
      if (!title.trim() && albumTitle) setTitle(albumTitle);
    } catch {
      setGalleryError(t("toast.imagesFailed"));
    } finally {
      setLoadingGallery(false);
    }
  }

  function removeFromGallery(src: string) {
    setImages((prev) => prev.filter((s) => s !== src));
    if (image === src) setImage(null);
  }

  function submit() {
    onSave({
      ...initial,
      title: title.trim(),
      url: url.trim(),
      category,
      status,
      image: image && image.trim() ? image.trim() : null,
      images,
      tags,
    });
  }

  const canSave = title.trim().length > 0 || url.trim().length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {isNew ? t("panel.newEntry") : t("panel.edit")}
          </p>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">
            {isNew ? t("panel.addItem") : title || t("panel.item")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
        >
          <X size={18} />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* Preview */}
        <div>
          <Label>{t("panel.preview")}</Label>
          <div className="flex gap-3">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
              {image ? (
                <>
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    title={t("panel.removeImage")}
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <div className="grid h-full w-full place-items-center text-[var(--color-faint)]">
                  {busy ? (
                    <Loader2 size={22} className="animate-spin" />
                  ) : (
                    <ImagePlus size={22} />
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)]"
              >
                <ImagePlus size={15} /> {t("panel.uploadImage")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                type="url"
                value={image && !image.startsWith("data:") ? image : ""}
                onChange={(e) => setImage(e.target.value || null)}
                placeholder={t("panel.imageUrl")}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <Field label={t("field.title")}>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("field.titlePlaceholder")}
            className={inputClass}
          />
        </Field>

        {/* URL */}
        <Field label={t("field.url")}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("field.urlPlaceholder")}
            className={inputClass}
          />
        </Field>

        {/* Yupoo gallery */}
        <div>
          <Label>{t("panel.albumImages")}</Label>
          <button
            type="button"
            onClick={loadGallery}
            disabled={!isYupooUrl(url) || loadingGallery}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingGallery ? (
              <>
                <Loader2 size={15} className="animate-spin" />{" "}
                {t("panel.loadingImages")}
              </>
            ) : (
              <>
                <DownloadCloud size={15} /> {t("panel.loadImages")}
              </>
            )}
          </button>

          {galleryError && (
            <p className="mt-2 text-xs font-medium text-rose-500">
              {galleryError}
            </p>
          )}

          {images.length > 0 && (
            <>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {images.map((src) => {
                  const isCover = src === image;
                  return (
                    <div
                      key={src}
                      className={`group/tile relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                        isCover
                          ? "border-[var(--color-ink)]"
                          : "border-transparent"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setImage(src)}
                        title={t("panel.pickCover")}
                        className="block h-full w-full"
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                      {isCover && (
                        <span className="pointer-events-none absolute bottom-1 left-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-ink)] text-white">
                          <Check size={12} />
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromGallery(src)}
                        title={t("panel.remove")}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/80 group-hover/tile:opacity-100"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {t("panel.coverHint")}
              </p>
            </>
          )}
        </div>

        {/* Category */}
        <Field label={t("field.category")}>
          <Segmented
            options={CATEGORIES.map((v) => ({ value: v, label: t(`cat.${v}`) }))}
            value={category}
            onChange={setCategory}
            colorOf={(v) => CATEGORY_COLOR_VAR[v]}
          />
        </Field>

        {/* Status */}
        <Field label={t("field.status")}>
          <Segmented
            options={STATUSES.map((v) => ({ value: v, label: t(`status.${v}`) }))}
            value={status}
            onChange={setStatus}
            colorOf={(v) => STATUS_COLOR_VAR[v]}
          />
        </Field>

        {/* Tags */}
        <Field label={t("field.tags")}>
          <div className="flex gap-2">
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder={t("field.tagPlaceholder")}
              className={inputClass}
            />
            <button
              type="button"
              onClick={addTag}
              className="grid shrink-0 place-items-center rounded-lg border border-[var(--color-border-strong)] px-3 text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface)]"
            >
              <Plus size={16} />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-2)] py-1 pl-2.5 pr-1.5 text-[12px] font-medium text-[var(--color-ink-soft)]"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="grid h-4 w-4 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-black/10 hover:text-[var(--color-ink)]"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Field>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-2)]"
        >
          {t("btn.cancel")}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSave}
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isNew ? t("btn.add") : t("btn.save")}
        </button>
      </footer>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-faint)] focus:border-[var(--color-ink)] focus:ring-4 focus:ring-[var(--color-ink)]/5";

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
      {children}
    </p>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  colorOf,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  colorOf: (v: T) => string;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-border-strong)] bg-white text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: active ? "#fff" : colorOf(opt.value),
              }}
            />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
