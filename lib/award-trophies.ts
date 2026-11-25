import { REGULAR_SEASON_CHAMPIONSHIP_AWARD, isPostseasonChampionshipAward, type Award, type LeagueId } from './game-types';

const championshipTrophies = {
  KBO: 'korean-series', NPB: 'japan-series', MLB: 'world-series', CPBL: 'taiwan-series',
} satisfies Record<LeagueId, string>;
const championshipRings = {
  KBO: 'korean-series-ring', NPB: 'japan-series-ring', MLB: 'world-series-ring', CPBL: 'taiwan-series-ring',
} satisfies Record<LeagueId, string>;

const ceremonyTrophies = {
  KBO: { MVP: 'kbo-mvp', 신인왕: 'kbo-rookie', 골든글러브: 'gold-glove' },
  NPB: { MVP: 'npb-mvp', 신인왕: 'npb-rookie', 골든글러브: 'gold-glove' },
  MLB: { MVP: 'mlb-mvp', 신인왕: 'mlb-rookie', 골든글러브: 'rawlings-glove', 사이영상: 'cy-young', 타격왕: 'mlb-batting', '최우수 불펜': 'mlb-reliever' },
  CPBL: { MVP: 'cpbl-record', 신인왕: 'cpbl-record', 골든글러브: 'gold-glove' },
} satisfies Record<LeagueId, Record<string, string>>;

const battingTitles = new Set(['타격왕', '홈런왕', '타점왕', '득점왕', '최다안타왕', '도루왕', '출루율왕', '장타율왕']);
const pitchingTitles = new Set(['다승왕', '평균자책점 1위', '탈삼진왕', '승률왕', '세이브왕', '홀드왕']);
const recordTrophies: Partial<Record<LeagueId, { id: string; gameOnly: readonly string[] }>> = {
  KBO: { id: 'kbo-record', gameOnly: [] },
  NPB: { id: 'npb-record', gameOnly: ['득점왕', '장타율왕'] },
  CPBL: { id: 'cpbl-record', gameOnly: ['득점왕', '장타율왕', '출루율왕', '승률왕'] },
};

export function getAwardTrophy({ name, leagueId }: Award): string {
  if (name === REGULAR_SEASON_CHAMPIONSHIP_AWARD) return championshipTrophies[leagueId];
  if (isPostseasonChampionshipAward(name)) return championshipRings[leagueId];
  const trophies: Readonly<Record<string, string>> = ceremonyTrophies[leagueId];
  if (Object.hasOwn(trophies, name)) return trophies[name];
  const batting = battingTitles.has(name);
  if (batting || pitchingTitles.has(name)) {
    const record = recordTrophies[leagueId];
    if (record && !record.gameOnly.includes(name)) return record.id;
    return batting ? 'game-batting' : 'game-pitching';
  }
  if (name === '최우수 투수' || name === '최우수 불펜') return 'game-pitching';
  return 'game-award';
}
