import { motion } from "framer-motion";
import {
  ExternalLink,
  Images,
  Loader2,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { CATEGORY_COLOR_VAR, Item, STATUS_COLOR_VAR } from "../lib/types";
import { useI18n } from "../lib/i18n";

interface Props {
  item: Item;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onToggleFavorite: (item: Item) => void;
  onOpen: (item: Item) => void;
  onOpenGallery: (item: Item) => void;
  trashed?: boolean;
  enriching?: boolean;
  onRestore?: (item: Item) => void;
  onDeleteForever?: (item: Item) => void;
}

export default function ItemCard({
  item,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpen,
  onOpenGallery,
  trashed,
  enriching,
  onRestore,
  onDeleteForever,
}: Props) {
  const { t } = useI18n();
  const catColor = CATEGORY_COLOR_VAR[item.category];
  const hasGallery = item.images.length > 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      {/* Image area */}
      <div className="relative">
        <button
          type="button"
          onClick={() => (hasGallery ? onOpenGallery(item) : onOpen(item))}
          title={hasGallery ? t("tooltip.viewGallery") : t("tooltip.openYupoo")}
          className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--color-surface-2)]"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${catColor} 10%, white), white)`,
              }}
            >
              <span
                className="text-xs font-medium uppercase tracking-[0.2em]"
                style={{ color: `color-mix(in srgb, ${catColor} 70%, #999)` }}
              >
                {t("card.noImage")}
              </span>
            </div>
          )}
        </button>

        {/* Background enrichment overlay */}
        {enriching && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[1px]">
            <Loader2
              size={22}
              className="animate-spin text-[var(--color-ink-soft)]"
            />
            <span className="text-[11px] font-medium text-[var(--color-ink-soft)]">
              {t("card.enriching")}
            </span>
          </div>
        )}

        {/* Favorite — hidden in trash */}
        {!trashed && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            title={
              item.favorite
                ? t("tooltip.favoriteRemove")
                : t("tooltip.favoriteAdd")
            }
            className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[var(--color-muted)] shadow-sm backdrop-blur-sm transition hover:scale-105 hover:text-amber-500"
          >
            <Star
              size={16}
              className={item.favorite ? "fill-amber-400 text-amber-400" : ""}
            />
          </button>
        )}

        {/* Action group — revealed on hover */}
        <div className="absolute left-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {trashed ? (
            <>
              <button
                type="button"
                onClick={() => onRestore?.(item)}
                title={t("tooltip.restore")}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[var(--color-ink-soft)] shadow-sm backdrop-blur-sm transition hover:scale-105 hover:text-emerald-600"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDeleteForever?.(item)}
                title={t("tooltip.deleteForever")}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[var(--color-ink-soft)] shadow-sm backdrop-blur-sm transition hover:scale-105 hover:text-rose-500"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit(item)}
                title={t("tooltip.edit")}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[var(--color-ink-soft)] shadow-sm backdrop-blur-sm transition hover:scale-105 hover:text-[var(--color-ink)]"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                title={t("tooltip.delete")}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[var(--color-ink-soft)] shadow-sm backdrop-blur-sm transition hover:scale-105 hover:text-rose-500"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>

        {/* Gallery count badge */}
        {item.images.length > 1 && (
          <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Images size={12} /> {item.images.length}
          </span>
        )}

        {/* Open Yupoo link — revealed on hover */}
        {item.url && (
          <button
            type="button"
            onClick={() => onOpen(item)}
            title={t("tooltip.openYupoo")}
            className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition hover:bg-black/85 group-hover:opacity-100"
          >
            <ExternalLink size={12} /> {t("card.open")}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: catColor }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
            {t(`cat.${item.category}`)}
          </span>
        </div>

        <h3
          data-selectable
          className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--color-ink)]"
        >
          {item.title || t("card.untitled")}
        </h3>

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-soft)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: STATUS_COLOR_VAR[item.status] }}
          />
          <span className="text-xs font-medium text-[var(--color-ink-soft)]">
            {t(`status.${item.status}`)}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
