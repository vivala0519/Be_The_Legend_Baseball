"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { Trophy } from "lucide-react";
import { getAwardTrophy } from "@/lib/award-trophies";
import { POSTSEASON_CHAMPIONSHIP_AWARD, isPostseasonChampionshipAward, type Award, type LeagueId } from "@/lib/game-types";
import { LEAGUES } from "@/lib/leagues";

function AwardTrophyIcon({ award }: { award: Award }) {
  return <Image className="award-trophy-icon" src={`/award-trophies-3d/${getAwardTrophy(award)}.webp`}
    width={50} height={60} alt="" unoptimized />;
}

export function TrophyCabinet({ awards }: { awards: readonly Award[] }) {
  const cabinetId = useId();
  const [selected, setSelected] = useState<{ leagueId: LeagueId; name: string } | null>(null);
  const shelves = new Map<LeagueId, Map<string, Award[]>>();
  for (const award of awards) {
    let leagueTitles = shelves.get(award.leagueId);
    if (!leagueTitles) {
      leagueTitles = new Map();
      shelves.set(award.leagueId, leagueTitles);
    }
    const title = isPostseasonChampionshipAward(award.name) ? POSTSEASON_CHAMPIONSHIP_AWARD : award.name;
    const group = leagueTitles.get(title);
    if (group) group.push(award);
    else leagueTitles.set(title, [award]);
  }

  return <section className="panel trophy-cabinet" aria-labelledby={`${cabinetId}-title`}>
    <div className="section-heading">
      <h2 id={`${cabinetId}-title`}>트로피 캐비닛</h2>
      <Trophy size={22} aria-hidden="true" />
    </div>
    {shelves.size === 0 && <p className="muted">아직 수상 기록이 없어요.</p>}
    {LEAGUES.map(({ id }) => {
      const leagueTitles = shelves.get(id);
      if (!leagueTitles) return null;
      const headingId = `${cabinetId}-${id}`;

      return <section key={id} className="award-league" aria-labelledby={headingId}>
        <h3 id={headingId} className="award-league-heading">{id}</h3>
        <div className="awards-grid">
          {Array.from(leagueTitles, ([name, group], index) => {
            const expanded = selected?.leagueId === id && selected.name === name;
            const captionId = `${headingId}-${index}`;

            return <div key={name} className="award-card">
              <button type="button" className="award-stack" aria-expanded={expanded} aria-controls={captionId}
                aria-label={`${id} ${name} ${group.length}회`} onClick={() => setSelected(expanded ? null : { leagueId: id, name })}>
                <span className="award-trophies" aria-hidden="true">
                  {group.map((award, trophyIndex) => <AwardTrophyIcon key={trophyIndex} award={award} />)}
                </span>
                {group.length > 1 && <span className="award-count" aria-hidden="true">{group.length}</span>}
              </button>
              <div id={captionId} className="award-caption" hidden={!expanded}>
                {expanded && <>
                  <strong>{name}</strong>
                  <small>{group.map(award => award.year).sort((a, b) => b - a).map(year => `${year}년`).join(" · ")}</small>
                </>}
              </div>
            </div>;
          })}
        </div>
      </section>;
    })}
  </section>;
}
