"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, ClipboardList, GraduationCap } from "lucide-react";
import { TeamMark } from "@/components/game-ui";
import type { DraftResult } from "@/lib/game-types";
import { getLeague, getTeam } from "@/lib/leagues";

export function DraftResultView({
  result, stage, college, finalDraft, onContinue,
}: {
  result: DraftResult;
  stage: string;
  college: boolean;
  finalDraft: boolean;
  onContinue: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const league = getLeague(result.leagueId);
  const drafted = result.status === "drafted";
  const nextAction = drafted ? "프로 시즌 준비하기"
    : finalDraft ? "은퇴하고 기록 남기기"
    : college ? "다음 학년으로" : "대학에 진학하기";

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
    </div> : <div className="draft-next">
      {!finalDraft && <GraduationCap size={24} aria-hidden="true" />}
      <p>{finalDraft ? "마지막 드래프트까지 마쳤어요. 지금까지의 기록을 남기고 선수 생활을 마무리해요."
        : college ? "다음 학년에도 대학에서 뛰고 시즌을 마친 뒤 다시 드래프트에 도전해요."
        : "대학 야구부에 진학해요. 대학에서는 매 시즌을 마칠 때마다 드래프트에 도전할 수 있어요."}</p>
    </div>}
    <div className="offer-actions">
      <button type="button" className="button primary" onClick={onContinue}>{nextAction} <ArrowRight size={18} /></button>
    </div>
  </section>;
}
