import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export default function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: Props) {
  const count = images.length;

  function go(delta: number) {
    if (count === 0) return;
    onIndexChange((index + delta + count) % count);
  }

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <AnimatePresence>
      {index >= 0 && count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex flex-col bg-black/80 backdrop-blur-sm"
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 text-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stage */}
          <div
            className="relative flex flex-1 items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {count > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={index}
                src={images[index]}
                alt=""
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="max-h-[72vh] max-w-[86vw] rounded-lg object-contain shadow-2xl"
              />
            </AnimatePresence>

            {count > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {count > 1 && (
            <div
              className="flex justify-center gap-2 overflow-x-auto px-6 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === index
                      ? "border-white"
                      : "border-transparent opacity-50 hover:opacity-90"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
