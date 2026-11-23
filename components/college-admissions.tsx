"use client";

import { useId, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { AmateurMark } from "@/components/game-ui";
import { getCollegeAffiliation } from "@/lib/amateur-college";
import type { CollegeAdmission } from "@/lib/game-types";

const REJECTION_REASONS = {
  position: "이 포지션의 모집 자리가 없어요",
  performance: "경기 실적이 선발 기준에 미치지 못했어요",
};

function CollegeName({ id }: { id: string }) {
  const college = getCollegeAffiliation(id);
  return <>
    <AmateurMark id={id} large />
    <span className="college-admission-name">
      <strong>{college?.name ?? id}</strong>
      <small>{college?.region}</small>
    </span>
  </>;
}

export function CollegeAdmissionsView({ results, onContinue }: {
  results: readonly CollegeAdmission[];
  onContinue: (collegeId?: string) => void;
}) {
  const id = useId();
  const [selection, setSelection] = useState("");
  const accepted = results.filter(result => result.status === "accepted");
  const rejected = results.filter(result => result.status === "rejected");
  const canEnroll = accepted.some(result => result.affiliationId === selection);

  return <section className="college-admissions" aria-labelledby={`${id}-heading`}>
    <h3 id={`${id}-heading`}>대학 야구부 합격 결과</h3>
    <p className="college-admission-intro">
      경기 실적과 포지션에 따라 {results.length}개 대학이 심사했어요.
    </p>
    {accepted.length > 0 ? <fieldset className="college-admission-options">
      <legend>합격 {accepted.length}곳 · 진학할 대학 선택</legend>
      {accepted.map(({ affiliationId }) => <label key={affiliationId} className="college-admission-choice">
        <input className="sr-only" type="radio" name={id} value={affiliationId}
          checked={selection === affiliationId} onChange={() => setSelection(affiliationId)} />
        <span className="college-admission-row">
          <CollegeName id={affiliationId} />
          <span className="college-admission-status">합격</span>
          <span className="college-admission-check" aria-hidden="true">
            {selection === affiliationId && <Check size={14} strokeWidth={3} />}
          </span>
        </span>
      </label>)}
    </fieldset> : <p className="college-admission-empty">합격한 대학이 없어요. 지금까지의 기록을 남기고 선수 생활을 마무리해요.</p>}

    {rejected.length > 0 && <details className="college-admission-details" open={accepted.length === 0}>
      <summary>불합격 대학 {rejected.length}곳</summary>
      <ul>
        {rejected.map(({ affiliationId, reason }) => <li className="college-admission-row" key={affiliationId}>
          <CollegeName id={affiliationId} />
          <span className="college-admission-rejection">
            <strong>불합격</strong>
            <span>{REJECTION_REASONS[reason]}</span>
          </span>
        </li>)}
      </ul>
    </details>}
    <div className="offer-actions">
      {accepted.length > 0
        ? <button type="button" className="button primary" disabled={!canEnroll} onClick={() => onContinue(selection)}>
          선택한 대학으로 진학 <ArrowRight size={18} />
        </button>
        : <button type="button" className="button primary" onClick={() => onContinue()}>
          은퇴하고 기록 남기기 <ArrowRight size={18} />
        </button>}
    </div>
  </section>;
}
