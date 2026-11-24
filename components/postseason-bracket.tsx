"use client";

import { useState } from "react";
import { ChevronRight, Trophy } from "lucide-react";
import { TeamMark } from "@/components/game-ui";
import { getTeam } from "@/lib/leagues";
import { getPostseasonElimination, getPostseasonProgress } from "@/lib/postseason-progress";
import type { PostseasonSeriesPreview } from "@/lib/postseason-progress";
import type { PostseasonBracket, PostseasonSeed, PostseasonSeries } from "@/lib/pro-postseason";

function SeriesTeam({ id, entry, wins, advantage, winner }: {
  id?: string;
  entry?: PostseasonSeed;
  wins?: number;
  advantage?: number;
  winner?: boolean;
}) {
  if (!id) return <span className="postseason-series-team postseason-team-pending">
    <span className="postseason-team-placeholder" aria-hidden="true" />
    <span className="postseason-team-name">미정</span>
  </span>;
  const team = getTeam(id);
  return <span className={`postseason-series-team${winner ? " is-winner" : ""}`}>
    <TeamMark id={id} />
    <span className="postseason-team-name">
      {entry && <small aria-label={`${entry.seed}번 시드`}>{entry.seed}</small>}
      <span title={team.name}>{team.shortName}</span>
    </span>
    {!!advantage && <small className="postseason-advantage">{advantage}승 선반영</small>}
    {wins !== undefined && <b aria-label={`${wins}승${winner ? ", 시리즈 승리" : ""}`}>{wins}</b>}
  </span>;
}

function SeriesMatchup({ matchup, seedByTeam }: { matchup: PostseasonSeriesPreview; seedByTeam: Map<string, PostseasonSeed> }) {
  const { teamAId, teamBId, startWinsA, startWinsB, result } = matchup;
  return <>
    {matchup.group && <span className="postseason-series-group">{matchup.group}</span>}
    <SeriesTeam id={teamAId} wins={result?.winsA} advantage={startWinsA}
      entry={teamAId ? seedByTeam.get(teamAId) : undefined} winner={!!result && result.winnerId === teamAId} />
    <SeriesTeam id={teamBId} wins={result?.winsB} advantage={startWinsB}
      entry={teamBId ? seedByTeam.get(teamBId) : undefined} winner={!!result && result.winnerId === teamBId} />
  </>;
}

function SeriesGames({ series, showWinner = false, elimination = false }: { series: PostseasonSeries; showWinner?: boolean; elimination?: boolean }) {
  const name = [series.group, series.name].filter(Boolean).join(" · ");
  const winner = getTeam(series.winnerId);
  const loser = getTeam(series.winnerId === series.teamAId ? series.teamBId : series.teamAId);
  const [winnerWins, loserWins] = series.winnerId === series.teamAId ? [series.winsA, series.winsB] : [series.winsB, series.winsA];
  return <section className="postseason-section" aria-label={`${name} 경기 결과`}>
    <h3>시리즈 경기 결과 <small>{name}</small></h3>
    {(showWinner || elimination) && <div className="postseason-series-result" aria-live="polite">
      <TeamMark id={elimination ? loser.id : winner.id} />
      {elimination
        ? <span><strong>{loser.name} 탈락</strong><small>{winner.name} 상대 {loserWins}승 {winnerWins}패</small></span>
        : <span><strong>{winner.name} 승리</strong><small>{loser.name} 상대 {winnerWins}승 {loserWins}패</small></span>}
    </div>}
    <div className="table-scroll"><table>
      <thead><tr><th scope="col">경기</th><th scope="col">원정팀</th><th scope="col">스코어</th><th scope="col">홈팀</th></tr></thead>
      <tbody>{series.games.map(game => {
        const away = getTeam(game.awayTeamId);
        const home = getTeam(game.homeTeamId);
        return <tr key={game.gameNumber}>
          <td>{game.gameNumber}차전</td>
          <td><span className="table-team"><TeamMark id={away.id} />{away.shortName}</span></td>
          <td className="postseason-score">
            {game.awayScore > game.homeScore ? <strong>{game.awayScore}</strong> : game.awayScore}{" : "}
            {game.homeScore > game.awayScore ? <strong>{game.homeScore}</strong> : game.homeScore}
            {game.homeScore === game.awayScore && <small>무승부</small>}
          </td>
          <td><span className="table-team"><TeamMark id={home.id} />{home.shortName}</span></td>
        </tr>;
      })}</tbody>
    </table></div>
  </section>;
}

export function PostseasonBracketView({ bracket, playerTeamId, progress }: {
  bracket: PostseasonBracket;
  playerTeamId: string;
  progress?: { revealedSeriesCount: number; onAdvance?: () => void };
}) {
  const { series, entries, championId, latestSeries, nextSeries, revealedSeries, revealedCount, totalSeries } =
    getPostseasonProgress(bracket, progress?.revealedSeriesCount);
  const [selection, setSelection] = useState<{ id: string; revealedCount: number }>();
  const lostSeries = progress && championId ? getPostseasonElimination(bracket, playerTeamId, revealedCount) : undefined;
  const eliminationSeries = lostSeries?.id !== latestSeries?.id ? lostSeries : undefined;
  const defaultSeries = progress ? eliminationSeries ?? latestSeries
    : revealedSeries.find(matchup => matchup.teamAId === playerTeamId || matchup.teamBId === playerTeamId) ?? revealedSeries.at(-1);
  const selectedSeries = (selection?.revealedCount === revealedCount ? revealedSeries.find(matchup => matchup.id === selection.id) : undefined) ?? defaultSeries;
  const selectedResult = selectedSeries && <SeriesGames series={selectedSeries} showWinner={!!progress?.onAdvance}
    elimination={selectedSeries.id === eliminationSeries?.id} />;
  const rounds = new Map<string, PostseasonSeriesPreview[]>();
  const seedByTeam = new Map(entries.map(entry => [entry.teamId, entry]));
  for (const matchup of series) {
    const round = rounds.get(matchup.name);
    if (round) round.push(matchup);
    else rounds.set(matchup.name, [matchup]);
  }

  return <>
    {progress?.onAdvance && eliminationSeries && selectedResult}
    {championId && <div className="postseason-champion">
      <TeamMark id={championId} />
      <span><small>포스트시즌 우승</small><strong>{getTeam(championId).name}</strong></span>
      <Trophy size={20} aria-hidden="true" />
    </div>}
    {nextSeries && progress?.onAdvance && <div className="postseason-reveal-action">
      <div>
        <small>다음 시리즈 · {revealedCount + 1}/{totalSeries}</small>
        <strong>{[nextSeries.group, nextSeries.name].filter(Boolean).join(" · ")}</strong>
        <span className="postseason-next-teams">
          {nextSeries.teamAId ? getTeam(nextSeries.teamAId).name : "미정"} vs {nextSeries.teamBId ? getTeam(nextSeries.teamBId).name : "미정"}
        </span>
      </div>
      <button type="button" className="button primary small-button" onClick={progress.onAdvance}>
        시리즈 진행 <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>}
    {progress?.onAdvance && !eliminationSeries && selectedResult}
    <section className="postseason-section" aria-label="포스트시즌 대진표">
      <h3>포스트시즌 대진표</h3>
      <div className="postseason-bracket">
        {Array.from(rounds, ([name, matchups]) => <div className="postseason-round" key={name}>
          <h4>{name}</h4>
          {matchups.map(matchup => matchup.result ? <button
              key={matchup.id}
              type="button"
              className="postseason-series"
              aria-pressed={matchup.id === selectedSeries?.id}
              onClick={() => setSelection({ id: matchup.id, revealedCount })}
            >
              <SeriesMatchup matchup={matchup} seedByTeam={seedByTeam} />
            </button> : <div key={matchup.id} className="postseason-series" data-next={matchup.id === nextSeries?.id || undefined}>
              <SeriesMatchup matchup={matchup} seedByTeam={seedByTeam} />
            </div>)}
        </div>)}
      </div>
    </section>
    {!progress?.onAdvance && selectedResult}
  </>;
}
