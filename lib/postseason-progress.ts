import type { PostseasonBracket, PostseasonSeed, PostseasonSeries } from './pro-postseason';

export type PostseasonSeriesPreview = Pick<PostseasonSeries, 'id' | 'name' | 'group' | 'qualification'>
  & Partial<Pick<PostseasonSeries, 'teamAId' | 'teamBId' | 'startWinsA' | 'startWinsB'>>
  & { result?: PostseasonSeries };

export interface PostseasonProgress {
  complete: boolean;
  revealedCount: number;
  totalSeries: number;
  nextSeries: PostseasonSeriesPreview | undefined;
  latestSeries: PostseasonSeries | undefined;
  revealedSeries: PostseasonSeries[];
  entries: PostseasonSeed[];
  series: PostseasonSeriesPreview[];
  championId: string | undefined;
}

export function getPostseasonSeriesCount(bracket: PostseasonBracket): number {
  return bracket.series.filter(series => !series.qualification).length;
}

export function getInitialPostseasonSeriesCount(bracket: PostseasonBracket, teamId: string): number {
  const mainSeries = bracket.series.filter(series => !series.qualification);
  const firstMatchup = mainSeries.find(series => series.teamAId === teamId || series.teamBId === teamId);
  if (!firstMatchup) return 0;
  return mainSeries.findIndex(series => series.name === firstMatchup.name);
}

export function getPostseasonElimination(bracket: PostseasonBracket, teamId: string, revealedCount: number) {
  return bracket.series.filter(series => !series.qualification).slice(0, revealedCount).find(series =>
    series.winnerId !== teamId && (series.teamAId === teamId || series.teamBId === teamId));
}

export function getPostseasonProgress(bracket: PostseasonBracket, revealedCount?: number): PostseasonProgress {
  const mainSeries = bracket.series.filter(series => !series.qualification);
  const totalSeries = mainSeries.length;
  const count = revealedCount === undefined
    ? totalSeries
    : Math.max(0, Math.min(Math.trunc(revealedCount), totalSeries));
  const revealedIds = new Set(mainSeries.slice(0, count).map(series => series.id));
  const lastSeriesByTeam = new Map<string, string>();

  const series = bracket.series.map((matchup): PostseasonSeriesPreview => {
    const { id, name, group, qualification, teamAId, teamBId, startWinsA, startWinsB } = matchup;
    const revealed = qualification || revealedIds.has(id);
    const canShowTeam = (teamId: string) => {
      const previousSeries = lastSeriesByTeam.get(teamId);
      return previousSeries === undefined || revealedIds.has(previousSeries);
    };
    let showTeamA = revealed || canShowTeam(teamAId);
    let showTeamB = revealed || canShowTeam(teamBId);
    if (!qualification) {
      lastSeriesByTeam.set(teamAId, id);
      lastSeriesByTeam.set(teamBId, id);
    }

    // MLB can reorder these slots by seed or record. Showing only one slot would
    // reveal which opponent earned the remaining slot.
    if (id === 'mlb-world-series' || /^mlb-(al|nl)-championship$/.test(id)) {
      showTeamA = showTeamB = showTeamA && showTeamB;
    }
    const matchupKnown = showTeamA && showTeamB;
    return {
      id, name, group, qualification,
      teamAId: showTeamA ? teamAId : undefined,
      teamBId: showTeamB ? teamBId : undefined,
      startWinsA: matchupKnown ? startWinsA : undefined,
      startWinsB: matchupKnown ? startWinsB : undefined,
      result: revealed ? matchup : undefined,
    };
  });

  const complete = count === totalSeries;
  return {
    complete,
    revealedCount: count,
    totalSeries,
    nextSeries: series.find(matchup => !matchup.result),
    latestSeries: count > 0 ? mainSeries[count - 1] : undefined,
    revealedSeries: bracket.series.filter(matchup => matchup.qualification || revealedIds.has(matchup.id)),
    entries: bracket.entries,
    series,
    championId: complete ? bracket.championId : undefined,
  };
}
