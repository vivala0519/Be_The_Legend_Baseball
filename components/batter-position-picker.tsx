"use client";

import Image from "next/image";
import { useId } from "react";

const FIELD_POSITIONS = [
  { value: "CF", label: "중견수", x: 50, y: 13 },
  { value: "LF", label: "좌익수", x: 19, y: 31 },
  { value: "RF", label: "우익수", x: 81, y: 31 },
  { value: "SS", label: "유격수", x: 36, y: 49 },
  { value: "2B", label: "2루수", x: 64, y: 49 },
  { value: "3B", label: "3루수", x: 24, y: 67 },
  { value: "1B", label: "1루수", x: 76, y: 67 },
  { value: "C", label: "포수", x: 50, y: 87 },
] as const;

const DESIGNATED_HITTER = { value: "DH", label: "지명타자" } as const;
export const BATTER_POSITIONS = [...FIELD_POSITIONS, DESIGNATED_HITTER];

export function BatterPositionPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const group = useId();

  return <fieldset className="batter-position-picker">
    <legend>포지션</legend>
    <div className="batter-position-card">
      <div className="batter-position-field">
        <Image src="/batter-position-field.webp" alt="" fill sizes="(max-width: 480px) calc(100vw - 70px), 400px" unoptimized />
        {FIELD_POSITIONS.map(position => <label key={position.value} className="batter-position-pin" style={{ left: `${position.x}%`, top: `${position.y}%` }}>
          <input type="radio" name={group} value={position.value} aria-label={position.label}
            checked={value === position.value} onChange={() => onChange(position.value)} />
          <span className="batter-position-tile" aria-hidden="true">
            <strong>{position.value}</strong>
            <span>{position.label}</span>
          </span>
        </label>)}
      </div>
      <label className="batter-position-dh">
        <input type="radio" name={group} value={DESIGNATED_HITTER.value} aria-label={DESIGNATED_HITTER.label}
          checked={value === DESIGNATED_HITTER.value} onChange={() => onChange(DESIGNATED_HITTER.value)} />
        <span className="batter-position-tile" aria-hidden="true">
          <strong>{DESIGNATED_HITTER.value}</strong>
          <span>{DESIGNATED_HITTER.label}</span>
        </span>
      </label>
    </div>
  </fieldset>;
}
