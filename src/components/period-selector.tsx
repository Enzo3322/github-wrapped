"use client";

import { useState } from "react";

interface PeriodSelectorProps {
  onSelect: (periodStart: string, periodEnd: string) => void;
}

const PERIOD_OPTIONS = [
  { label: "Ultimo mes", days: 30 },
  { label: "Ultimos 3 meses", days: 90 },
  { label: "Ultimos 6 meses", days: 180 },
  { label: "Ultimo ano", days: 365 },
] as const;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function PeriodSelector({ onSelect }: PeriodSelectorProps) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(index: number, days: number) {
    setSelected(index);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onSelect(formatDate(start), formatDate(end));
  }

  return (
    <div className="flex flex-wrap gap-3">
      {PERIOD_OPTIONS.map((option, index) => (
        <button
          key={option.days}
          onClick={() => handleSelect(index, option.days)}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all cursor-pointer ${
            selected === index
              ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
              : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
