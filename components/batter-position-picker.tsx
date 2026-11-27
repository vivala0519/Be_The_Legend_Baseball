"use client";

import Image from "next/image";
import { useId, type CSSProperties } from "react";

export const BATTER_POSITIONS = [
  { value: "CF", label: "중견수", x: 50, y: 13, mobileY: 15 },
  { value: "LF", label: "좌익수", x: 19, y: 31, mobileY: 23 },
  { value: "RF", label: "우익수", x: 81, y: 31, mobileY: 23 },
  { value: "SS", label: "유격수", x: 36, y: 49, mobileY: 50 },
  { value: "2B", label: "2루수", x: 64, y: 49, mobileY: 50 },
  { value: "3B", label: "3루수", x: 24, y: 67, mobileY: 77 },
  { value: "1B", label: "1루수", x: 76, y: 67, mobileY: 77 },
  { value: "C", label: "포수", x: 50, y: 87, mobileY: 85 },
] as const;

export function BatterPositionPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const group = useId();
  const selectedPosition = BATTER_POSITIONS.find(position => position.value === value);

  return <fieldset className="batter-position-picker">
    <legend>포지션</legend>
    <div className="batter-position-card">
      <div className="batter-position-field">
        <Image src="/batter-position-field.webp" alt="" fill sizes="(max-width: 480px) calc(100vw - 70px), 400px" unoptimized />
        {BATTER_POSITIONS.map(position => <label key={position.value} className="batter-position-pin" style={{
          left: `${position.x}%`,
          "--position-y": `${position.y}%`,
          "--mobile-position-y": `${position.mobileY}%`,
        } as CSSProperties}>
          <input type="radio" name={group} value={position.value} aria-label={position.label}
            checked={value === position.value} onChange={() => onChange(position.value)} />
          <span className="batter-position-tile" aria-hidden="true">
            <strong>{position.value}</strong>
            <span>{position.label}</span>
          </span>
        </label>)}
      </div>
      {selectedPosition && <p className="batter-position-selected">{selectedPosition.label}</p>}
    </div>
  </fieldset>;
}
