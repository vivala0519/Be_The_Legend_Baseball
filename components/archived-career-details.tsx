"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getCareerAffiliation } from "@/lib/amateur-college";
import { getCareerPeakOverall, statsRates } from "@/lib/game";
import { getTeam } from "@/lib/leagues";
import type { AmateurSeasonResult, Career, SeasonResult } from "@/lib/game-types";
import { getCabinetAwards } from "@/lib/regular-season-title";
import { AmateurMark, Avatar, decimal, Modal, TeamMark } from "@/components/game-ui";
import { SeasonDetail } from "@/components/season-results";
import { TrophyCabinet } from "@/components/trophy-cabinet";

type ArchivedSeason = AmateurSeasonResult | SeasonResult;
type Summary = {
  name: string;
  avatar: number;
  position: string;
  start: number;
  end: number;
  seasons: number;
  games: number;
  peakOverall?: number;
  hall: boolean;
};

function ArchiveSeasons({ title, seasons, onSelect }: {
  title: string;
  seasons: ArchivedSeason[];
  onSelect: (season: ArchivedSeason) => void;
}) {
  if (seasons.length === 0) return null;

  return <section className="archive-detail-seasons">
    <h3>{title}</h3>
    <ul>
      {[...seasons].reverse().map(season => {
        const amateur = "affiliationId" in season;
        const affiliation = amateur ? getCareerAffiliation(season.affiliationId) : undefined;
        const team = amateur ? affiliation?.name ?? "아마추어 소속" : getTeam(season.teamId).name;
        const { avg, ops, innings, era } = statsRates(season.stats);
        const stats = season.role === "batter"
          ? `타율 ${decimal(avg)} · OPS ${decimal(ops)}`
          : `${innings}이닝 · ERA ${era.toFixed(2)}`;

        return <li key={season.year}>
          <button type="button" onClick={() => onSelect(season)}>
            {amateur ? <AmateurMark id={season.affiliationId} /> : <TeamMark id={season.teamId} />}
            <span className="archive-detail-season-info">
              <strong>{season.year}년 · {team}</strong>
              <small>{season.stats.g}경기 · {stats}</small>
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </li>;
      })}
    </ul>
  </section>;
}

export function ArchivedCareerDetails({ summary, career, loading, error, onClose }: {
  summary: Summary;
  career?: Career;
  loading: boolean;
  error?: string;
  onClose: () => void;
}) {
  const [season, setSeason] = useState<ArchivedSeason>();
  const contentRef = useRef<HTMLDivElement>(null);
  const professional = career?.history ?? [];
  const amateur = career?.amateur?.history ?? [];
  const peakOverall = career ? Math.max(summary.peakOverall ?? 0, getCareerPeakOverall(career)) : summary.peakOverall;

  function selectSeason(nextSeason?: ArchivedSeason) {
    setSeason(nextSeason);
    const content = contentRef.current;
    content?.focus({ preventScroll: true });
    content?.closest("dialog")?.scrollTo({ top: 0 });
  }

  return <Modal title={`${summary.name} 기록`} onClose={onClose} wide>
    <div ref={contentRef} className="archive-detail" tabIndex={-1}>
      {season ? <>
        <button type="button" className="button secondary archive-detail-back" onClick={() => selectSeason()}>
          <ArrowLeft size={17} aria-hidden="true" /> 시즌 목록
        </button>
        <h3 className="archive-detail-season-title">{season.year}년 시즌</h3>
        <SeasonDetail key={season.year} result={season} showAllGames />
      </> : <>
        <div className="archive-detail-summary">
          <Avatar avatar={summary.avatar} small />
          <div>
            <strong>{summary.position} · {summary.start}–{summary.end}년</strong>
            <p>{summary.seasons}시즌{Number.isFinite(summary.games) && ` · ${summary.games.toLocaleString()}경기`}{peakOverall !== undefined && ` · 최고 OVR ${peakOverall}`}</p>
            {summary.hall && <p>명예의 전당 헌액</p>}
          </div>
        </div>
        {loading ? <p className="muted" role="status">상세 기록을 불러오고 있어요.</p> : !career ? (
          <p className="muted" role={error ? "alert" : undefined}>{error ?? "이 커리어에는 요약만 남아 있어요."}</p>
        ) : <>
          <TrophyCabinet awards={getCabinetAwards(career)} />
          {professional.length + amateur.length === 0 && <p className="muted">기록된 시즌이 없어요.</p>}
          <ArchiveSeasons title="프로 시즌" seasons={professional} onSelect={selectSeason} />
          <ArchiveSeasons title="아마추어 시즌" seasons={amateur} onSelect={selectSeason} />
        </>}
      </>}
    </div>
  </Modal>;
}
