import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  gap?: number;
}

export function RowScroller({ children, gap = 16 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ratio, setRatio] = useState(1); // visible / total
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setRatio(el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1);
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Convert vertical wheel into smooth horizontal scroll
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      e.preventDefault();
      el.scrollLeft = Math.max(0, Math.min(max, el.scrollLeft + e.deltaY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
    };
  }, []);

  const showTrack = ratio < 0.999;

  const onTrackDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = e.currentTarget;
    track.setPointerCapture(e.pointerId);
    setDragging(true);
    const rect = track.getBoundingClientRect();
    const thumbWidth = rect.width * ratio;
    const apply = (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const x = clientX - rect.left - thumbWidth / 2;
      const pct = Math.max(0, Math.min(1, x / (rect.width - thumbWidth)));
      el.scrollLeft = pct * (el.scrollWidth - el.clientWidth);
    };
    apply(e.clientX);
    const onMove = (ev: PointerEvent) => apply(ev.clientX);
    const onUp = () => {
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative group/scroller">
      <div
        ref={ref}
        className="row-scroll flex overflow-x-auto overflow-y-hidden pb-4 -mx-8 px-8 snap-x scroll-smooth"
        style={{ gap, scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>

      {showTrack && (
        <>
          {/* Edge buttons */}
          {progress > 0.01 && (
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="hidden md:grid place-items-center absolute left-2 top-1/2 -translate-y-[60%] size-10 rounded-full bg-black/60 backdrop-blur text-white opacity-0 group-hover/scroller:opacity-100 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {progress < 0.99 && (
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="hidden md:grid place-items-center absolute right-2 top-1/2 -translate-y-[60%] size-10 rounded-full bg-black/60 backdrop-blur text-white opacity-0 group-hover/scroller:opacity-100 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          )}

          {/* Scroll wheel / track */}
          <div
            onPointerDown={onTrackDown}
            className={`relative mt-1 h-1.5 rounded-full bg-white/10 cursor-pointer transition-opacity ${
              dragging ? "opacity-100" : "opacity-60 hover:opacity-100"
            }`}
          >
            <div
              className="absolute top-0 h-full rounded-full bg-white/80"
              style={{
                width: `${ratio * 100}%`,
                left: `${progress * (100 - ratio * 100)}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}