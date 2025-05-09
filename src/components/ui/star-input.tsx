import React from "react";

export function StarInput({
  value,
  onChange,
  max = 5,
  ...props
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div {...props}>
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          aria-label={`${i + 1} star`}
          style={{
            color: i < value ? "#facc15" : "#d1d5db",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "1.5rem",
            padding: 0,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}
