import type { LeagueId } from './game-types';

export interface TeamRecord {
  wins: number;
  losses: number;
  draws: number;
  runsFor?: number;
  runsAgainst?: number;
}

export interface PostseasonStanding extends TeamRecord {
  teamId: string;
  firstHalf?: TeamRecord;
  secondHalf?: TeamRecord;
  headToHead?: Readonly<Record<string, TeamRecord>>;
}

export interface PostseasonSeed {
  teamId: string;
  seed: number;
  group?: string;
}

export interface PostseasonFixture {
  seriesId: string;
  gameNumber: number;
  dayOffset: number;
  homeTeamId: string;
  awayTeamId: string;
  allowsDraws: boolean;
  inningLimit?: number;
}

interface GameScore {
  homeScore: number;
  awayScore: number;
}

export type PostseasonGame = PostseasonFixture & GameScore;

export interface PostseasonSeries {
  id: string;
  name: string;
  group?: string;
  qualification?: true;
  teamAId: string;
  teamBId: string;
  startWinsA: number;
  startWinsB: number;
  winsA: number;
  winsB: number;
  winnerId: string;
  games: PostseasonGame[];
}

export interface PostseasonBracket {
  entries: PostseasonSeed[];
  series: PostseasonSeries[];
  championId: string;
}

const CENTRAL = '센트럴 리그';
const PACIFIC = '퍼시픽 리그';
const AMERICAN = '아메리칸 리그';
const NATIONAL = '내셔널 리그';

const NPB_GROUPS = [
  { name: CENTRAL, id: 'cl', teams: ['hanshin', 'yomiuri', 'dena', 'hiroshima', 'yakult', 'chunichi'] },
  { name: PACIFIC, id: 'pl', teams: ['softbank', 'nipponham', 'orix', 'rakuten', 'seibu', 'lotte'] },
];

const MLB_DIVISIONS = [
  { group: AMERICAN, division: '동부 지구', teams: ['nyy', 'bos', 'bal', 'tb', 'tor'] },
  { group: AMERICAN, division: '중부 지구', teams: ['cws', 'cle', 'det', 'kc', 'min'] },
  { group: AMERICAN, division: '서부 지구', teams: ['ath', 'hou', 'laa', 'sea', 'tex'] },
  { group: NATIONAL, division: '동부 지구', teams: ['nym', 'atl', 'mia', 'phi', 'wsh'] },
  { group: NATIONAL, division: '중부 지구', teams: ['chc', 'cin', 'mil', 'pit', 'stl'] },
  { group: NATIONAL, division: '서부 지구', teams: ['lad', 'ari', 'col', 'sd', 'sf'] },
];

function mlbDivision(teamId: string) {
  return MLB_DIVISIONS.find((division) => division.teams.some((team) => teamId === `mlb-${team}`));
}

export function getPostseasonGroup(leagueId: LeagueId, teamId: string): string | undefined {
  if (leagueId === 'NPB') {
    return NPB_GROUPS.find((group) => group.teams.some((team) => teamId === `npb-${team}`))?.name;
  }
  if (leagueId === 'MLB') return mlbDivision(teamId)?.group;
  return undefined;
}

export function getPostseasonDivision(leagueId: LeagueId, teamId: string): string | undefined {
  return leagueId === 'MLB' ? mlbDivision(teamId)?.division : undefined;
}

function winRate(record: TeamRecord): number {
  return record.wins / Math.max(1, record.wins + record.losses);
}

function compareWinRates(first: TeamRecord, second: TeamRecord): number {
  return second.wins * Math.max(1, first.wins + first.losses)
    - first.wins * Math.max(1, second.wins + second.losses);
}

function recordAgainst(standing: PostseasonStanding, opponents: readonly string[]): TeamRecord {
  const combined = { wins: 0, losses: 0, draws: 0, runsFor: 0, runsAgainst: 0 };
  for (const teamId of opponents) {
    const record = standing.headToHead?.[teamId];
    if (!record) continue;
    combined.wins += record.wins;
    combined.losses += record.losses;
    combined.draws += record.draws;
    combined.runsFor += record.runsFor ?? 0;
    combined.runsAgainst += record.runsAgainst ?? 0;
  }
  return combined;
}

function runsAllowedPerGame(record: TeamRecord): number {
  return (record.runsAgainst ?? 0) / Math.max(1, record.wins + record.losses + record.draws);
}

function compareRunAllowance(first: TeamRecord, second: TeamRecord): number {
  return runsAllowedPerGame(first) - runsAllowedPerGame(second);
}

function compareCpblRecords(first: TeamRecord, second: TeamRecord): number {
  return compareRunAllowance(first, second) || (second.runsFor ?? 0) - (first.runsFor ?? 0);
}

function mlbRecord(standing: PostseasonStanding, sameDivision: boolean): TeamRecord {
  const division = mlbDivision(standing.teamId);
  const opponents = MLB_DIVISIONS
    .filter((entry) => (sameDivision ? entry === division : entry.group === division?.group))
    .flatMap((entry) => entry.teams.map((team) => `mlb-${team}`));
  return recordAgainst(standing, opponents);
}

function npbLeagueRecord(standing: PostseasonStanding): TeamRecord {
  const group = NPB_GROUPS.find(({ name }) => name === getPostseasonGroup('NPB', standing.teamId));
  return recordAgainst(standing, group?.teams.map((team) => `npb-${team}`) ?? []);
}

function beatsEachOpponent(standing: PostseasonStanding, opponents: readonly string[]): boolean {
  return opponents.filter((teamId) => teamId !== standing.teamId).every((teamId) => {
    const result = standing.headToHead?.[teamId];
    return result !== undefined && result.wins > result.losses;
  });
}

export function rankPostseasonStandings<T extends PostseasonStanding>(
  standings: readonly T[],
  leagueId?: LeagueId,
): T[] {
  const ranked = [...standings].sort(compareWinRates);
  for (let start = 0; start < ranked.length;) {
    let end = start + 1;
    while (end < ranked.length && compareWinRates(ranked[start], ranked[end]) === 0) end += 1;
    const tied = ranked.slice(start, end);
    if (tied.length > 1) {
      const opponents = tied.map((standing) => standing.teamId);
      tied.sort((first, second) => {
        if (leagueId === 'NPB') {
          const isCentralLeague = getPostseasonGroup('NPB', first.teamId) === CENTRAL
            && getPostseasonGroup('NPB', second.teamId) === CENTRAL;
          const npbOpponents = isCentralLeague ? tied.filter((standing) => standing.wins === first.wins).map(({ teamId }) => teamId) : opponents;
          return (isCentralLeague ? second.wins - first.wins : 0)
            || compareWinRates(recordAgainst(first, npbOpponents), recordAgainst(second, npbOpponents))
            || compareWinRates(npbLeagueRecord(first), npbLeagueRecord(second))
            || first.teamId.localeCompare(second.teamId);
        }
        const matchup = (standing: PostseasonStanding) => recordAgainst(standing, opponents);
        const firstMatchup = matchup(first);
        const secondMatchup = matchup(second);
        const headToHead = compareWinRates(firstMatchup, secondMatchup);
        if (leagueId === 'MLB') {
          return (Number(beatsEachOpponent(second, opponents)) - Number(beatsEachOpponent(first, opponents)))
            || headToHead
            || compareWinRates(mlbRecord(first, true), mlbRecord(second, true))
            || compareWinRates(mlbRecord(first, false), mlbRecord(second, false))
            || first.teamId.localeCompare(second.teamId);
        }
        if (leagueId === 'KBO') {
          return (secondMatchup.wins - firstMatchup.wins)
            || ((secondMatchup.runsFor ?? 0) - (firstMatchup.runsFor ?? 0))
            || first.teamId.localeCompare(second.teamId);
        }
        if (leagueId === 'CPBL') {
          return (secondMatchup.wins - firstMatchup.wins)
            || compareRunAllowance(firstMatchup, secondMatchup)
            || compareCpblRecords(first, second)
            || first.teamId.localeCompare(second.teamId);
        }
        return (second.wins - first.wins) || headToHead || first.teamId.localeCompare(second.teamId);
      });
      ranked.splice(start, tied.length, ...tied);
    }
    start = end;
  }
  return ranked;
}

type PlayGame = (fixture: PostseasonFixture) => GameScore;

interface SeriesRules {
  schedule: string;
  winsNeeded: number;
  dayOffset: number;
  startWinsA?: number;
  advanceHigherOnTie?: boolean;
  inningLimit?: number;
  extraGames?: 'replay-draws' | 'japan-series';
}

interface SeriesSetup extends SeriesRules {
  id: string;
  name: string;
  group?: string;
  qualification?: true;
  teamAId: string;
  teamBId: string;
}

function runSeries(setup: SeriesSetup, play: PlayGame): PostseasonSeries {
  const { id, name, group, qualification, teamAId, teamBId, schedule, winsNeeded, extraGames } = setup;
  const startWinsA = setup.startWinsA ?? 0;
  const games: PostseasonGame[] = [];
  const replays: string[] = [];
  let winsA = startWinsA;
  let winsB = 0;
  let dayOffset = setup.dayOffset;
  let previousHost: string | undefined;

  while (winsA < winsNeeded && winsB < winsNeeded) {
    const remaining = schedule.length - games.length;
    if (setup.advanceHigherOnTie && (winsA >= winsB + remaining || winsB > winsA + remaining)) break;

    const regulationHost = schedule[games.length];
    const isFirstReplay = !regulationHost && games.length === schedule.length;
    const host = regulationHost ?? (
      extraGames === 'replay-draws' ? replays.shift()
        : extraGames === 'japan-series' ? (isFirstReplay ? 'H' : 'A') : undefined
    );
    if (!host || games.length >= 64) throw new Error(`Unresolved postseason series: ${id}`);

    if (games.length > 0) {
      const singleReplay = isFirstReplay && extraGames === 'replay-draws' && replays.length === 0;
      dayOffset += previousHost === host || singleReplay ? 1 : 2;
    }
    const homeIsA = host === 'H';
    const inningLimit = extraGames === 'japan-series' && !regulationHost ? undefined : setup.inningLimit;
    const fixture: PostseasonFixture = {
      seriesId: id,
      gameNumber: games.length + 1,
      dayOffset,
      homeTeamId: homeIsA ? teamAId : teamBId,
      awayTeamId: homeIsA ? teamBId : teamAId,
      allowsDraws: inningLimit !== undefined,
      inningLimit,
    };
    const { homeScore, awayScore } = play(fixture);
    if (!Number.isSafeInteger(homeScore) || homeScore < 0 || !Number.isSafeInteger(awayScore) || awayScore < 0) {
      throw new Error(`Invalid postseason score: ${id}`);
    }
    if (homeScore === awayScore) {
      if (!fixture.allowsDraws) throw new Error(`A winner is required for postseason game: ${id}`);
      if (extraGames === 'replay-draws') replays.push(host);
    } else if ((homeScore > awayScore) === homeIsA) {
      winsA += 1;
    } else {
      winsB += 1;
    }
    games.push({ ...fixture, homeScore, awayScore });
    previousHost = host;
  }

  return {
    id, name, group, qualification, teamAId, teamBId,
    startWinsA, startWinsB: 0, winsA, winsB, winnerId: winsA >= winsB ? teamAId : teamBId, games,
  };
}

function nextRoundDay(series: readonly PostseasonSeries[], earliest: number): number {
  const finalDays = series.map((round) => (round.games.at(-1)?.dayOffset ?? -2) + 2);
  return Math.max(earliest, ...finalDays);
}

function seeds(standings: readonly PostseasonStanding[], group?: string): PostseasonSeed[] {
  return standings.map(({ teamId }, index) => ({ teamId, seed: index + 1, group }));
}

function playKbo(standings: readonly PostseasonStanding[], play: PlayGame): PostseasonBracket {
  const ranked = rankPostseasonStandings(standings, 'KBO');
  const series: PostseasonSeries[] = [];
  for (const rank of [1, 5]) {
    const tied = ranked.filter((standing) => compareWinRates(standing, ranked[rank - 1]) === 0);
    if (tied.length !== 2 || ranked[rank - 1] !== tied[0]) continue;
    const tiebreak = runSeries({
      id: `kbo-seed-${rank}`, name: `정규시즌 ${rank}위 결정전`,
      qualification: true, teamAId: tied[0].teamId, teamBId: tied[1].teamId, schedule: 'H', winsNeeded: 1, dayOffset: 0,
    }, play);
    series.push(tiebreak);
    if (tiebreak.winnerId === tied[1].teamId) ranked.splice(rank - 1, 2, tied[1], tied[0]);
  }
  const wildCard = runSeries({
    id: 'kbo-wild-card', name: '와일드카드 결정전', teamAId: ranked[3].teamId, teamBId: ranked[4].teamId,
    schedule: 'HH', winsNeeded: 2, startWinsA: 1, advanceHigherOnTie: true, inningLimit: 15,
    dayOffset: series.length > 0 ? 1 : 0,
  }, play);
  series.push(wildCard);
  const rounds = [
    { id: 'kbo-semi-playoff', name: '준플레이오프', schedule: 'HHAAH', winsNeeded: 3, teamAId: ranked[2].teamId },
    { id: 'kbo-playoff', name: '플레이오프', schedule: 'HHAAH', winsNeeded: 3, teamAId: ranked[1].teamId },
    { id: 'kbo-korean-series', name: '한국시리즈', schedule: 'HHAAAHH', winsNeeded: 4, teamAId: ranked[0].teamId },
  ];
  for (const round of rounds) {
    const preceding = series.at(-1)!;
    series.push(runSeries({
      ...round, teamBId: preceding.winnerId, inningLimit: 15, extraGames: 'replay-draws',
      dayOffset: nextRoundDay([preceding], 0),
    }, play));
  }
  return { entries: seeds(ranked.slice(0, 5)), series, championId: series.at(-1)!.winnerId };
}

function playNpb(year: number, standings: readonly PostseasonStanding[], play: PlayGame): PostseasonBracket {
  const groups = NPB_GROUPS.map((group) => ({
    ...group,
    standings: rankPostseasonStandings(standings.filter(({ teamId }) => getPostseasonGroup('NPB', teamId) === group.name), 'NPB'),
  }));
  const firstRounds = groups.map(({ id, name, standings: ranked }) => runSeries({
    id: `npb-${id}-first`, name: '클라이맥스 시리즈 퍼스트 스테이지', group: name,
    teamAId: ranked[1].teamId, teamBId: ranked[2].teamId, schedule: 'HHH', winsNeeded: 2,
    dayOffset: 0, advanceHigherOnTie: true, inningLimit: 12,
  }, play));
  const finals = groups.map(({ id, name, standings: ranked }, index) => {
    const leader = ranked[0];
    const challenger = ranked.find(({ teamId }) => teamId === firstRounds[index].winnerId)!;
    const gamesBack = (leader.wins - challenger.wins + challenger.losses - leader.losses) / 2;
    const hasExtraWin = year >= 2026 && (gamesBack >= 10 || winRate(challenger) < 0.5);
    return runSeries({
      id: `npb-${id}-final`, name: '클라이맥스 시리즈 파이널 스테이지', group: name,
      teamAId: leader.teamId, teamBId: challenger.teamId, schedule: hasExtraWin ? 'HHHHHHH' : 'HHHHHH',
      winsNeeded: hasExtraWin ? 5 : 4, startWinsA: hasExtraWin ? 2 : 1,
      dayOffset: nextRoundDay(firstRounds, 4), advanceHigherOnTie: true, inningLimit: 12,
    }, play);
  });
  const [home, away] = year % 2 === 0 ? finals : [...finals].reverse();
  const championship = runSeries({
    id: 'npb-japan-series', name: '일본시리즈', teamAId: home.winnerId, teamBId: away.winnerId,
    schedule: 'HHAAAHH', winsNeeded: 4, dayOffset: nextRoundDay(finals, 14),
    inningLimit: 12, extraGames: 'japan-series',
  }, play);
  return {
    entries: groups.flatMap(({ name, standings: ranked }) => seeds(ranked.slice(0, 3), name)),
    series: [...firstRounds, ...finals, championship], championId: championship.winnerId,
  };
}

function playMlb(standings: readonly PostseasonStanding[], play: PlayGame): PostseasonBracket {
  const groups = [AMERICAN, NATIONAL].map((group, index) => {
    const teams = standings.filter(({ teamId }) => getPostseasonGroup('MLB', teamId) === group);
    const winners = MLB_DIVISIONS.filter((division) => division.group === group).map((division) =>
      rankPostseasonStandings(teams.filter(({ teamId }) => mlbDivision(teamId) === division), 'MLB')[0],
    );
    const wildCards = teams.filter((team) => !winners.includes(team));
    return {
      group, id: index === 0 ? 'al' : 'nl',
      seeded: [...rankPostseasonStandings(winners, 'MLB'), ...rankPostseasonStandings(wildCards, 'MLB').slice(0, 3)],
    };
  });
  const wildCards = groups.map(({ id, group, seeded }) => [[3, 6], [4, 5]].map(([higher, lower]) => runSeries({
    id: `mlb-${id}-wild-card-${higher}`, name: '와일드카드 시리즈', group,
    teamAId: seeded[higher - 1].teamId, teamBId: seeded[lower - 1].teamId,
    schedule: 'HHH', winsNeeded: 2, dayOffset: 0,
  }, play)));
  const divisionSeries = groups.map(({ id, group, seeded }, index) => [1, 2].map((seed) => runSeries({
    id: `mlb-${id}-division-${seed}`, name: '디비전 시리즈', group,
    teamAId: seeded[seed - 1].teamId, teamBId: wildCards[index][2 - seed].winnerId,
    schedule: 'HHAAH', winsNeeded: 3, dayOffset: nextRoundDay(wildCards.flat(), 4),
  }, play)));
  const leagueSeries = groups.map(({ id, group, seeded }, index) => {
    const finalists = divisionSeries[index].map((round) => round.winnerId);
    const [higher, lower] = seeded.filter(({ teamId }) => finalists.includes(teamId));
    return runSeries({
      id: `mlb-${id}-championship`, name: '리그 챔피언십 시리즈', group,
      teamAId: higher.teamId, teamBId: lower.teamId, schedule: 'HHAAAHH', winsNeeded: 4,
      dayOffset: nextRoundDay(divisionSeries.flat(), 14),
    }, play);
  });
  const finalists = standings.filter(({ teamId }) => leagueSeries.some(({ winnerId }) => winnerId === teamId));
  const [higher, lower] = rankPostseasonStandings(finalists, 'MLB');
  const worldSeries = runSeries({
    id: 'mlb-world-series', name: '월드시리즈', teamAId: higher.teamId, teamBId: lower.teamId,
    schedule: 'HHAAAHH', winsNeeded: 4, dayOffset: nextRoundDay(leagueSeries, 24),
  }, play);
  return {
    entries: groups.flatMap(({ group, seeded }) => seeds(seeded, group)),
    series: [...wildCards.flat(), ...divisionSeries.flat(), ...leagueSeries, worldSeries], championId: worldSeries.winnerId,
  };
}

function cpblTiebreak(
  tied: readonly PostseasonStanding[],
  segment: 'firstHalf' | 'secondHalf' | 'full',
  id: string,
  name: string,
  year: number,
  series: PostseasonSeries[],
  play: PlayGame,
): PostseasonStanding {
  const record = (standing: PostseasonStanding) => segment === 'full' ? standing : (standing[segment] ?? standing);
  const drawKey = (teamId: string) => {
    let hash = 2166136261;
    for (const letter of `${teamId}-${id}-${year}`) hash = Math.imul(hash ^ letter.charCodeAt(0), 16777619);
    return hash >>> 0;
  };
  const byDraw = (first: PostseasonStanding, second: PostseasonStanding) => drawKey(first.teamId) - drawKey(second.teamId);
  const decide = (first: PostseasonStanding, second: PostseasonStanding, leg: number, dayOffset: number) => {
    const headToHeadWins = (standing: PostseasonStanding, opponent: PostseasonStanding) =>
      standing.headToHead?.[opponent.teamId]?.wins ?? 0;
    const pair = [first, second].sort((higher, lower) =>
      (headToHeadWins(lower, higher) - headToHeadWins(higher, lower))
      || compareRunAllowance(recordAgainst(higher, [lower.teamId]), recordAgainst(lower, [higher.teamId]))
      || compareCpblRecords(higher, lower)
      || byDraw(higher, lower),
    );
    const tiebreak = runSeries({
      id: `${id}-${leg}`, name, qualification: true,
      teamAId: pair[0].teamId, teamBId: pair[1].teamId, schedule: 'H', winsNeeded: 1, dayOffset,
    }, play);
    series.push(tiebreak);
    return tiebreak.winnerId === first.teamId ? first : second;
  };
  const dayOffset = nextRoundDay(series, 0);
  let remaining = [...tied];
  let round = 0;
  let leg = 1;
  while (remaining.length > 1) {
    const hasBye = remaining.length % 2 === 1;
    remaining.sort(hasBye ? (a, b) => compareCpblRecords(record(a), record(b)) || byDraw(a, b) : byDraw);
    const winners = hasBye ? [remaining[0]] : [];
    for (let index = Number(hasBye); index < remaining.length; index += 2) {
      winners.push(decide(remaining[index], remaining[index + 1], leg, dayOffset + round * 2));
      leg += 1;
    }
    remaining = winners;
    round += 1;
  }
  return remaining[0];
}

function cpblHalfWinner(
  standings: readonly PostseasonStanding[],
  half: 'firstHalf' | 'secondHalf',
  year: number,
  series: PostseasonSeries[],
  play: PlayGame,
): PostseasonStanding {
  const ranked = standings.map((standing) => ({ standing, record: standing[half] ?? standing }));
  ranked.sort((first, second) => compareWinRates(first.record, second.record));
  const tied = ranked.filter(({ record }) => compareWinRates(record, ranked[0].record) === 0).map(({ standing }) => standing);
  if (tied.length === 1) return tied[0];
  const id = half === 'firstHalf' ? 'cpbl-first-tiebreak' : 'cpbl-second-tiebreak';
  const name = half === 'firstHalf' ? '전반기 우승 결정전' : '후반기 우승 결정전';
  return cpblTiebreak(tied, half, id, name, year, series, play);
}

function cpblAnnualQualifiers(
  standings: readonly PostseasonStanding[],
  count: number,
  id: string,
  name: string,
  year: number,
  series: PostseasonSeries[],
  play: PlayGame,
): PostseasonStanding[] {
  const cutoff = standings[count - 1];
  if (compareWinRates(cutoff, standings[count]) !== 0) return standings.slice(0, count);

  const qualified = standings.filter((standing) => compareWinRates(standing, cutoff) < 0);
  let tied = standings.filter((standing) => compareWinRates(standing, cutoff) === 0);
  while (qualified.length < count) {
    const winner = cpblTiebreak(tied, 'full', `${id}-${qualified.length + 1}`, name, year, series, play);
    qualified.push(winner);
    tied = tied.filter((standing) => standing.teamId !== winner.teamId);
  }
  return qualified;
}

function playCpbl(year: number, standings: readonly PostseasonStanding[], play: PlayGame): PostseasonBracket {
  const ranked = rankPostseasonStandings(standings, 'CPBL');
  const series: PostseasonSeries[] = [];
  const firstWinner = cpblHalfWinner(ranked, 'firstHalf', year, series, play);
  const secondWinner = cpblHalfWinner(ranked, 'secondHalf', year, series, play);
  const sameWinner = firstWinner.teamId === secondWinner.teamId;
  let top: PostseasonStanding;
  let second: PostseasonStanding;
  let third: PostseasonStanding;
  if (sameWinner) {
    [top] = cpblAnnualQualifiers(ranked, 1, 'cpbl-finals-tiebreak', '대만시리즈 직행 결정전', year, series, play);
    const otherTeams = ranked.filter(({ teamId }) => teamId !== top.teamId);
    [second, third] = cpblAnnualQualifiers(otherTeams, 2, 'cpbl-wild-card', '플레이오프 진출 결정전', year, series, play);
  } else {
    const [higher, lower] = ranked.filter(({ teamId }) => teamId === firstWinner.teamId || teamId === secondWinner.teamId);
    top = higher;
    second = lower;
    if (compareWinRates(higher, lower) === 0) {
      top = cpblTiebreak([higher, lower], 'full', 'cpbl-finals-seed', '대만시리즈 직행 결정전', year, series, play);
      second = top.teamId === higher.teamId ? lower : higher;
    }
    const otherTeams = ranked.filter(({ teamId }) => teamId !== top.teamId && teamId !== second.teamId);
    [third] = cpblAnnualQualifiers(otherTeams, 1, 'cpbl-wild-card', '플레이오프 진출 결정전', year, series, play);
  }
  const challenge = runSeries({
    id: 'cpbl-challenge', name: '플레이오프 챌린지', teamAId: second.teamId, teamBId: third.teamId,
    schedule: sameWinner ? 'HHAAH' : 'HAHH', winsNeeded: 3, startWinsA: sameWinner ? 0 : 1,
    dayOffset: nextRoundDay(series, 0),
  }, play);
  const championship = runSeries({
    id: 'cpbl-taiwan-series', name: '대만시리즈', teamAId: top.teamId, teamBId: challenge.winnerId,
    schedule: sameWinner ? 'HHAAHH' : 'HHAAHHH', winsNeeded: 4, startWinsA: sameWinner ? 1 : 0,
    dayOffset: nextRoundDay([challenge], 0),
  }, play);
  return { entries: seeds([top, second, third]), series: [...series, challenge, championship], championId: championship.winnerId };
}

export function playProPostseason(
  leagueId: LeagueId,
  year: number,
  standings: readonly PostseasonStanding[],
  play: PlayGame,
): PostseasonBracket {
  switch (leagueId) {
    case 'KBO': return playKbo(standings, play);
    case 'NPB': return playNpb(year, standings, play);
    case 'MLB': return playMlb(standings, play);
    case 'CPBL': return playCpbl(year, standings, play);
  }
}
