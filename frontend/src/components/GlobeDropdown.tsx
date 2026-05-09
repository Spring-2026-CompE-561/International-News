"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

export function GlobeDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => {
        const next = !open;
        setOpen(next);
        window.dispatchEvent(new CustomEvent("globe-toggle", { detail: next }));
      }}
      className="flex items-center"
      aria-label="News Globe"
    >
      <Globe className="w-8 h-8 text-horizon hover:text-horizon-dark transition-colors" />
    </button>
  );
}
