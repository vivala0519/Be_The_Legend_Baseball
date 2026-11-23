"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, ClipboardList, GraduationCap } from "lucide-react";
import { CollegeAdmissionsView } from "@/components/college-admissions";
import { TeamMark } from "@/components/game-ui";
import type { CollegeAdmission, DraftResult } from "@/lib/game-types";
import { getLeague, getTeam } from "@/lib/leagues";

export function DraftResultView({
  result, stage, college, finalDraft, admissions, onContinue,
}: {
  result: DraftResult;
  stage: string;
  college: boolean;
  finalDraft: boolean;
  admissions?: readonly CollegeAdmission[];
  onContinue: (collegeId?: string) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const league = getLeague(result.leagueId);
  const drafted = result.status === "drafted";
  const showAdmissions = !drafted && !college;
  const nextAction = drafted ? "프로 시즌 준비하기"
    : finalDraft ? "은퇴하고 기록 남기기"
    : "다음 학년으로";

  return <section className="panel draft-result" aria-labelledby="draft-result-title">
    <div className="section-heading">
      <div>
        <span className="eyebrow">{stage} · {league.id} 드래프트</span>
        <h2 ref={heading} id="draft-result-title" tabIndex={-1}>{drafted ? "프로 구단의 지명을 받았어요" : "이번 드래프트에서 미지명됐어요"}</h2>
      </div>
      <ClipboardList size={25} aria-hidden="true" />
    </div>
    {drafted ? <div className="draft-pick">
      <TeamMark id={result.teamId} large />
      <div>
        <h3>{getTeam(result.teamId).name}</h3>
        <p>{result.round}라운드 {result.pick}순위 <span>· 전체 {result.overallPick}순위</span></p>
      </div>
    </div> : showAdmissions
      ? admissions && <CollegeAdmissionsView results={admissions} onContinue={onContinue} />
      : <div className="draft-next">
      {!finalDraft && <GraduationCap size={24} aria-hidden="true" />}
      <p>{finalDraft ? "마지막 드래프트까지 마쳤어요. 지금까지의 기록을 남기고 선수 생활을 마무리해요."
        : "다음 학년에도 대학에서 뛰고 시즌을 마친 뒤 다시 드래프트에 도전해요."}</p>
    </div>}
    {!showAdmissions && <div className="offer-actions">
      <button type="button" className="button primary" onClick={() => onContinue()}>{nextAction} <ArrowRight size={18} /></button>
    </div>}
  </section>;
}
