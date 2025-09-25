"use client";

import { useState, type ReactNode } from "react";

interface BuilderColumnsProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export default function BuilderColumns({ left, center, right }: BuilderColumnsProps) {
  const [hover, setHover] = useState<"center" | "right" | null>(null);

  const centerBasis =
    hover === "right"
      ? "xl:basis-[38%]"
      : hover === "center"
      ? "xl:basis-[60%]"
      : "xl:basis-[50%]";
  const rightBasis =
    hover === "right"
      ? "xl:basis-[62%]"
      : hover === "center"
      ? "xl:basis-[40%]"
      : "xl:basis-[50%]";

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="basis-[260px] shrink-0">{left}</div>
      <div className="hidden xl:block w-px bg-neutral-800/80 rounded-full" />
      <div
        className={`min-w-0 transition-all duration-200 flex-auto ${centerBasis}`}
        onMouseEnter={() => setHover("center")}
        onMouseLeave={() => setHover(null)}
      >
        {center}
      </div>
      <div className="hidden xl:block w-px bg-neutral-800/80 rounded-full" />
      <div
        className={`min-w-0 transition-all duration-200 flex-auto ${rightBasis}`}
        onMouseEnter={() => setHover("right")}
        onMouseLeave={() => setHover(null)}
      >
        {right}
      </div>
    </div>
  );
}


