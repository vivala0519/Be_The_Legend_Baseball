import { REGULAR_SEASON_CHAMPIONSHIP_AWARD, isPostseasonChampionshipAward, type Award, type Career, type SeasonResult } from './game-types';
import { getPostseasonSeriesCount } from './postseason-progress';

export function wonRegularSeasonTitle(season: SeasonResult): boolean {
  const { postseason, leagueId, teamId, teamRecord } = season;
  if (!postseason?.standings.some(standing => standing.teamId === teamId)) return false;
  if (leagueId === 'MLB') {
    // The first three seeds in each league are its division winners.
    return postseason.entries.some(entry => entry.teamId === teamId && entry.seed >= 1 && entry.seed <= 3);
  }
  return teamRecord.rank === 1;
}

export function getCabinetAwards(career: Pick<Career, 'awards' | 'history'>): Award[] {
  const awards = career.awards.map(award => {
    if (award.teamId !== undefined || !isPostseasonChampionshipAward(award.name)) return award;
    const season = career.history.find(({ year, leagueId }) => year === award.year && leagueId === award.leagueId);
    if (!season || (!season.championship && !season.awards.some(isPostseasonChampionshipAward))) return award;
    const { postseason, teamId } = season;
    if (postseason && (postseason.championId !== teamId || (postseason.revealedSeriesCount !== undefined
      && postseason.revealedSeriesCount < getPostseasonSeriesCount(postseason)))) return award;
    return { ...award, teamId };
  });
  const recordedTitles = new Set(awards.filter(award => award.name === REGULAR_SEASON_CHAMPIONSHIP_AWARD)
    .map(({ leagueId, year }) => `${leagueId}:${year}`));
  for (const season of career.history) {
    const { leagueId, year } = season;
    const key = `${leagueId}:${year}`;
    if (recordedTitles.has(key) || !wonRegularSeasonTitle(season)) continue;
    awards.push({ leagueId, year, name: REGULAR_SEASON_CHAMPIONSHIP_AWARD });
    recordedTitles.add(key);
  }
  return awards;
}
