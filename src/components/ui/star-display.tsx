import React from "react";

export function StarDisplay({ value = 0, max = 5 }: { value: number; max?: number }) {
  return (
    <span>
      {[...Array(max)].map((_, i) => (
        <span key={i} style={{ color: i < value ? "#facc15" : "#d1d5db", fontSize: "1.2em" }}>
          ★
        </span>
      ))}
    </span>
  );
} 