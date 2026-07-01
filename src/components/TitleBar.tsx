import { useEffect, useState, type ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Box, Copy, Minus, Square, X } from "lucide-react";

const appWindow = getCurrentWindow();

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    appWindow.isMaximized().then(setMaximized).catch(() => {});
    appWindow
      .onResized(() => {
        appWindow.isMaximized().then(setMaximized).catch(() => {});
      })
      .then((u) => {
        unlisten = u;
      })
      .catch(() => {});
    return () => unlisten?.();
  }, []);

  return (
    <div
      data-tauri-drag-region
      onDoubleClick={() => appWindow.toggleMaximize()}
      className="flex h-9 shrink-0 select-none items-center justify-between border-b border-[var(--color-border)] bg-white pl-3"
    >
      <div
        data-tauri-drag-region
        className="pointer-events-none flex items-center gap-2 text-[var(--color-ink-soft)]"
      >
        <Box size={14} />
        <span className="text-xs font-semibold tracking-tight">
          Yupoo Sorter
        </span>
      </div>

      <div className="flex h-full">
        <WinButton onClick={() => appWindow.minimize()} label="Minimize">
          <Minus size={15} />
        </WinButton>
        <WinButton onClick={() => appWindow.toggleMaximize()} label="Maximize">
          {maximized ? <Copy size={13} /> : <Square size={13} />}
        </WinButton>
        <WinButton onClick={() => appWindow.close()} label="Close" danger>
          <X size={16} />
        </WinButton>
      </div>
    </div>
  );
}

function WinButton({
  onClick,
  label,
  danger,
  children,
}: {
  onClick: () => void;
  label: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-9 w-12 place-items-center text-[var(--color-ink-soft)] transition ${
        danger
          ? "hover:bg-rose-500 hover:text-white"
          : "hover:bg-[var(--color-surface-2)]"
      }`}
    >
      {children}
    </button>
  );
}
