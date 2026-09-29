import { ChevronUp, ChevronDown } from "lucide-react";
import type { RefObject } from "react";

export function PanelScrollControls({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const scroll = (direction: -1 | 1) => {
    targetRef.current?.scrollBy({ top: direction * 150, behavior: "smooth" });
  };

  return (
    <div className="panel-scroll-controls" aria-label="Panel scroll controls">
      <button type="button" onClick={() => scroll(-1)} aria-label="Scroll up"><ChevronUp size={14} /></button>
      <button type="button" onClick={() => scroll(1)} aria-label="Scroll down"><ChevronDown size={14} /></button>
    </div>
  );
}
