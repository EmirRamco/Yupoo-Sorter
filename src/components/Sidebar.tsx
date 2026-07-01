import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Gem,
  Shirt,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Footprints,
  LayoutGrid,
} from "lucide-react";
import { Category, CATEGORIES, CATEGORY_COLOR_VAR } from "../lib/types";

export type CategoryFilter = "all" | Category;

const CATEGORY_ICON: Record<Category, ComponentType<{ size?: number }>> = {
  clothing: Shirt,
  jewelry: Gem,
  shoes: Footprints,
  accessories: Sparkles,
};

interface Props {
  active: CategoryFilter;
  onSelect: (c: CategoryFilter) => void;
  favoritesOnly: boolean;
  onToggleFavorites: () => void;
  trashActive: boolean;
  onSelectTrash: () => void;
  trashCount: number;
  counts: Record<Category, number>;
  total: number;
  favoritesCount: number;
  onExport: () => void;
  onImport: () => void;
}

export default function Sidebar({
  active,
  onSelect,
  favoritesOnly,
  onToggleFavorites,
  trashActive,
  onSelectTrash,
  trashCount,
  counts,
  total,
  favoritesCount,
  onExport,
  onImport,
}: Props) {
  return (
    <aside className="flex h-full w-[236px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-5">
      {/* Wordmark */}
      <div className="mb-7 px-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-faint)]">
          Sammlung
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          Yupoo Sorter
        </h1>
      </div>

      {/* Categories */}
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Kategorien
      </p>
      <nav className="space-y-0.5">
        <Row
          label="Alle"
          count={total}
          active={active === "all" && !favoritesOnly && !trashActive}
          onClick={() => onSelect("all")}
          icon={<LayoutGrid size={16} />}
        />
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c.value];
          return (
            <Row
              key={c.value}
              label={c.label}
              count={counts[c.value]}
              active={active === c.value && !favoritesOnly && !trashActive}
              onClick={() => onSelect(c.value)}
              icon={<Icon size={16} />}
              dot={CATEGORY_COLOR_VAR[c.value]}
            />
          );
        })}
      </nav>

      <p className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        Ansicht
      </p>
      <div className="space-y-0.5">
        <Row
          label="Favoriten"
          count={favoritesCount}
          active={favoritesOnly && !trashActive}
          onClick={onToggleFavorites}
          icon={<Star size={16} />}
        />
        <Row
          label="Papierkorb"
          count={trashCount}
          active={trashActive}
          onClick={onSelectTrash}
          icon={<Trash2 size={16} />}
        />
      </div>

      {/* Library actions */}
      <div className="mt-auto space-y-2 pt-6">
        <button
          type="button"
          onClick={onExport}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:shadow-[var(--shadow-soft)]"
        >
          <Download size={16} /> Exportieren
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-white hover:shadow-[var(--shadow-soft)]"
        >
          <Upload size={16} /> Importieren
        </button>
      </div>
    </aside>
  );
}

function Row({
  label,
  count,
  active,
  onClick,
  icon,
  dot,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? "text-[var(--color-ink)]"
          : "text-[var(--color-ink-soft)] hover:bg-white/70"
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
          className="absolute inset-0 -z-0 rounded-lg bg-white shadow-[var(--shadow-soft)]"
        />
      )}
      <span className="relative z-10 grid h-5 w-5 place-items-center text-[var(--color-muted)]">
        {dot ? (
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: dot }}
          />
        ) : (
          icon
        )}
      </span>
      <span className="relative z-10 flex-1 text-left">{label}</span>
      <span className="relative z-10 text-xs tabular-nums text-[var(--color-faint)]">
        {count}
      </span>
    </button>
  );
}
