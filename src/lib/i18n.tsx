import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "de";

const STORAGE_KEY = "yupoo-sorter-lang";

export const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "de", label: "DE" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // Sidebar / nav
  "nav.brand": "Collection",
  "nav.categories": "Categories",
  "nav.view": "View",
  "cat.all": "All",
  "cat.clothing": "Clothing",
  "cat.jewelry": "Jewelry",
  "cat.shoes": "Shoes",
  "cat.accessories": "Accessories",
  "view.favorites": "Favorites",
  "view.trash": "Trash",
  "settings.language": "Language",
  "btn.export": "Export",
  "btn.import": "Import",
  "updater.check": "Check for updates",

  // Toolbar / views
  "section.overview": "Overview",
  "view.allItems": "All items",
  "toolbar.search": "Search…",
  "sort.newest": "Newest first",
  "sort.oldest": "Oldest first",
  "sort.title": "Name (A–Z)",
  "btn.add": "Add",
  "btn.emptyTrash": "Empty trash",
  "status.all": "All statuses",
  "status.saved": "Saved",
  "status.ordered": "Ordered",
  "status.received": "Received",

  // Empty states
  "empty.trashTitle": "Trash is empty",
  "empty.trashDesc":
    "Deleted items show up here and can be restored.",
  "empty.noItemsTitle": "No items yet",
  "empty.noItemsDesc":
    "Add your first Yupoo link and keep the overview.",
  "empty.nothingTitle": "Nothing found",
  "empty.nothingDesc": "Adjust search or filters to see items.",
  "empty.addItem": "Add item",

  // Card
  "card.noImage": "No image",
  "card.open": "Open",
  "card.enriching": "Loading images…",
  "card.untitled": "Untitled",
  "tooltip.viewGallery": "View gallery",
  "tooltip.openYupoo": "Open on Yupoo",
  "tooltip.favoriteAdd": "Add to favorites",
  "tooltip.favoriteRemove": "Remove favorite",
  "tooltip.edit": "Edit",
  "tooltip.delete": "Delete",
  "tooltip.restore": "Restore",
  "tooltip.deleteForever": "Delete permanently",

  // Add/Edit panel
  "panel.newEntry": "New entry",
  "panel.edit": "Edit",
  "panel.addItem": "Add item",
  "panel.item": "Item",
  "panel.preview": "Preview",
  "panel.removeImage": "Remove image",
  "panel.uploadImage": "Upload image",
  "panel.imageUrl": "…or paste an image URL",
  "panel.albumImages": "Images from the album",
  "panel.loadImages": "Load images from Yupoo",
  "panel.loadingImages": "Loading images…",
  "panel.pickCover": "Set as cover",
  "panel.remove": "Remove",
  "panel.coverHint": "Click an image to set the cover.",
  "field.title": "Title",
  "field.titlePlaceholder": "e.g. Black cargo pants",
  "field.url": "Yupoo link",
  "field.urlPlaceholder": "https://…x.yupoo.com/albums/…",
  "field.category": "Category",
  "field.status": "Status",
  "field.tags": "Tags",
  "field.tagPlaceholder": "Type a tag, press Enter",
  "btn.cancel": "Cancel",
  "btn.save": "Save",

  // Confirm dialogs
  "confirm.trashTitle": "Move to trash?",
  "confirm.trashMsg":
    "“{name}” will be moved to the trash and can be restored there.",
  "confirm.trashConfirm": "Move to trash",
  "confirm.deleteTitle": "Delete permanently?",
  "confirm.deleteMsg":
    "“{name}” will be permanently deleted. This cannot be undone.",
  "confirm.deleteConfirm": "Delete permanently",
  "confirm.emptyTitle": "Empty trash?",
  "confirm.emptyMsg":
    "All {count} items in the trash will be permanently deleted.",
  "confirm.emptyConfirm": "Empty trash",

  // Toasts
  "toast.added": "Item added",
  "toast.saved": "Saved",
  "toast.movedToTrash": "Moved to trash",
  "toast.restored": "Restored",
  "toast.deletedForever": "Permanently deleted",
  "toast.trashEmptied": "Trash emptied",
  "toast.exported": "Collection exported",
  "toast.exportFailed": "Export failed",
  "toast.imported": "{count} items imported",
  "toast.importFailed": "Import failed",
  "toast.linkFailed": "Could not open the link",
  "toast.noLink": "No link set",
  "toast.imagesFailed": "Could not load images",

  // Updater
  "updater.checking": "Checking for updates…",
  "updater.upToDate": "You're on the latest version",
  "updater.availableTitle": "Update available",
  "updater.availableMsg":
    "Version {version} is available. Install it now? The app will restart.",
  "updater.install": "Install now",
  "updater.installing": "Downloading update…",
  "updater.failed": "Update failed",
};

const de: Dict = {
  "nav.brand": "Sammlung",
  "nav.categories": "Kategorien",
  "nav.view": "Ansicht",
  "cat.all": "Alle",
  "cat.clothing": "Kleidung",
  "cat.jewelry": "Schmuck",
  "cat.shoes": "Schuhe",
  "cat.accessories": "Accessoires",
  "view.favorites": "Favoriten",
  "view.trash": "Papierkorb",
  "settings.language": "Sprache",
  "btn.export": "Exportieren",
  "btn.import": "Importieren",
  "updater.check": "Nach Updates suchen",

  "section.overview": "Übersicht",
  "view.allItems": "Alle Artikel",
  "toolbar.search": "Suchen…",
  "sort.newest": "Neueste zuerst",
  "sort.oldest": "Älteste zuerst",
  "sort.title": "Name (A–Z)",
  "btn.add": "Hinzufügen",
  "btn.emptyTrash": "Papierkorb leeren",
  "status.all": "Alle Status",
  "status.saved": "Gemerkt",
  "status.ordered": "Bestellt",
  "status.received": "Erhalten",

  "empty.trashTitle": "Papierkorb ist leer",
  "empty.trashDesc":
    "Gelöschte Artikel erscheinen hier und können wiederhergestellt werden.",
  "empty.noItemsTitle": "Noch keine Artikel",
  "empty.noItemsDesc":
    "Füge deinen ersten Yupoo-Link hinzu und behalte den Überblick.",
  "empty.nothingTitle": "Nichts gefunden",
  "empty.nothingDesc": "Passe Suche oder Filter an, um Artikel zu sehen.",
  "empty.addItem": "Artikel hinzufügen",

  "card.noImage": "Kein Bild",
  "card.open": "Öffnen",
  "card.enriching": "Lädt Bilder…",
  "card.untitled": "Ohne Titel",
  "tooltip.viewGallery": "Galerie ansehen",
  "tooltip.openYupoo": "Auf Yupoo öffnen",
  "tooltip.favoriteAdd": "Als Favorit markieren",
  "tooltip.favoriteRemove": "Favorit entfernen",
  "tooltip.edit": "Bearbeiten",
  "tooltip.delete": "Löschen",
  "tooltip.restore": "Wiederherstellen",
  "tooltip.deleteForever": "Endgültig löschen",

  "panel.newEntry": "Neuer Eintrag",
  "panel.edit": "Bearbeiten",
  "panel.addItem": "Artikel hinzufügen",
  "panel.item": "Artikel",
  "panel.preview": "Vorschau",
  "panel.removeImage": "Bild entfernen",
  "panel.uploadImage": "Bild hochladen",
  "panel.imageUrl": "…oder Bild-URL einfügen",
  "panel.albumImages": "Bilder aus dem Album",
  "panel.loadImages": "Bilder von Yupoo laden",
  "panel.loadingImages": "Lädt Bilder…",
  "panel.pickCover": "Als Titelbild wählen",
  "panel.remove": "Entfernen",
  "panel.coverHint": "Klick auf ein Bild wählt das Titelbild.",
  "field.title": "Titel",
  "field.titlePlaceholder": "z. B. Cargo Hose schwarz",
  "field.url": "Yupoo-Link",
  "field.urlPlaceholder": "https://…x.yupoo.com/albums/…",
  "field.category": "Kategorie",
  "field.status": "Status",
  "field.tags": "Tags",
  "field.tagPlaceholder": "Tag eingeben, Enter drücken",
  "btn.cancel": "Abbrechen",
  "btn.save": "Speichern",

  "confirm.trashTitle": "In den Papierkorb verschieben?",
  "confirm.trashMsg":
    "„{name}“ wird in den Papierkorb verschoben und kann dort wiederhergestellt werden.",
  "confirm.trashConfirm": "In Papierkorb",
  "confirm.deleteTitle": "Endgültig löschen?",
  "confirm.deleteMsg":
    "„{name}“ wird dauerhaft gelöscht. Das kann nicht rückgängig gemacht werden.",
  "confirm.deleteConfirm": "Endgültig löschen",
  "confirm.emptyTitle": "Papierkorb leeren?",
  "confirm.emptyMsg":
    "Alle {count} Artikel im Papierkorb werden dauerhaft gelöscht.",
  "confirm.emptyConfirm": "Papierkorb leeren",

  "toast.added": "Artikel hinzugefügt",
  "toast.saved": "Gespeichert",
  "toast.movedToTrash": "In den Papierkorb verschoben",
  "toast.restored": "Wiederhergestellt",
  "toast.deletedForever": "Endgültig gelöscht",
  "toast.trashEmptied": "Papierkorb geleert",
  "toast.exported": "Sammlung exportiert",
  "toast.exportFailed": "Export fehlgeschlagen",
  "toast.imported": "{count} Artikel importiert",
  "toast.importFailed": "Import fehlgeschlagen",
  "toast.linkFailed": "Link konnte nicht geöffnet werden",
  "toast.noLink": "Kein Link hinterlegt",
  "toast.imagesFailed": "Bilder konnten nicht geladen werden",

  "updater.checking": "Suche nach Updates…",
  "updater.upToDate": "Du hast die neueste Version",
  "updater.availableTitle": "Update verfügbar",
  "updater.availableMsg":
    "Version {version} ist verfügbar. Jetzt installieren? Die App startet neu.",
  "updater.install": "Jetzt installieren",
  "updater.installing": "Update wird geladen…",
  "updater.failed": "Update fehlgeschlagen",
};

const translations: Record<Lang, Dict> = { en, de };

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: TFunc;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "de" || stored === "en" ? stored : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback<TFunc>(
    (key, vars) => {
      let str = translations[lang][key] ?? translations.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
