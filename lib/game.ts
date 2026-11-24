import { LEAGUES, TEAMS, getLeague, getTeam, teamsForLeague } from './leagues';
import { AMATEUR_COUNTRIES, getAmateurAffiliation, getAmateurAffiliations, getSchoolOpponent, getSchoolScheduleOpponents } from './amateur';
import type { AmateurAffiliation, AmateurCountry } from './amateur';
import { COLLEGE_COMPETITIONS, COLLEGE_SEASONS, getCollegeAffiliation, getCollegeAffiliations, getCollegeScheduleOpponents } from './amateur-college';
import type { CollegeAffiliation, CollegeBaseballTier } from './amateur-college';
import { getAmateurCompetition, getCollegeCompetitions, getSchoolCompetitions } from './amateur-competitions';
import type { AmateurCompetitionId, ScheduledCompetition, ScheduledCompetitionDefinition } from './amateur-competitions';
import { getAcademyCompetitionRegion } from './youth-competitions-academy';
import { getJapanSchoolBlock } from './youth-competitions-asia';
import { CALIFORNIA_STATE_FINAL_OPPONENTS } from './youth-competitions-us';
import { MAX_AVATAR_ID } from './avatars';
import { KOREAN_HIGH_SCHOOL_COMPETITIONS, KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS } from './korean-high-school-competitions';
import type { KoreanHighSchoolCompetition, KoreanHighSchoolCompetitionId } from './korean-high-school-competitions';
import { getPostseasonGroup, playProPostseason, rankPostseasonStandings } from './pro-postseason';
import type { PostseasonBracket, PostseasonStanding } from './pro-postseason';
import { getInitialPostseasonSeriesCount, getPostseasonElimination, getPostseasonSeriesCount } from './postseason-progress';
import type { ActiveAmateurCareer, AmateurCompetitionResult, AmateurSeasonResult, Attributes, Career, CareerEvent, CareerTotals, CollegeAdmission, CreateCareerInput, DraftResult, GameSummary, AmateurCompetitionOutcome, LeagueId, NewsItem, Offer, Player, PostseasonPlayerGame, ProfessionalCareer, ProPostseasonResult, RegularSeasonMatchup, SeasonResult, StatRates, Stats } from './game-types';

export * from './game-types';
export const HALL_THRESHOLD = 350;
export const BATTER_ATTRIBUTES = ['contact', 'power', 'eye', 'speed', 'fielding', 'arm'];
export const PITCHER_ATTRIBUTES = ['velocity', 'stuff', 'control', 'breaking', 'stamina', 'recovery'];
export const ATTRIBUTE_LABELS: Record<string, string> = {
  contact: '컨택', power: '파워', eye: '선구안', speed: '주루', fielding: '수비', arm: '송구',
  velocity: '구속', stuff: '구위', control: '제구', breaking: '변화구', stamina: '스태미나', recovery: '회복',
};

const STAT_KEYS: (keyof Stats)[] = ['g', 'pa', 'ab', 'h', 'doubles', 'triples', 'hr', 'r', 'rbi', 'bb', 'hbp', 'sf', 'sb', 'so', 'outs', 'er', 'ha', 'bba', 'w', 'l', 'sv', 'hld'];
const LEAGUE_IDS: LeagueId[] = ['KBO', 'NPB', 'MLB', 'CPBL'];
const INITIAL_SALARY: Record<LeagueId, number> = { KBO: 3000, NPB: 5000, MLB: 10000, CPBL: 1800 };
const FIRST_YEAR = 2026;
const FINAL_PRO_SEASON_AGE = 40;
const LEGACY_AMATEUR_START_AGE = 16;
const DRAFT_ROUNDS = 8;
const DRAFT_CUTOFF = 58;
const COLLEGE_ADMISSION_CUTOFFS = {
  standard: [42, 47],
  competitive: [49, 56],
  leading: [58, 66],
} as const satisfies Record<CollegeBaseballTier, readonly [min: number, max: number]>;
const POSITION_CODES: Record<string, string> = {
  포수: 'C', '1루수': '1B', '2루수': '2B', '3루수': '3B', 유격수: 'SS', 좌익수: 'LF', 중견수: 'CF', 우익수: 'RF', 지명타자: 'DH',
  '1루': '1B', '2루': '2B', '3루': '3B',
  선발: 'SP', 선발투수: 'SP', 불펜: 'RP', 불펜투수: 'RP', 중간: 'RP', 중간계투: 'RP', 마무리: 'CP', 마무리투수: 'CP',
};
const BATTER_TRAINING_FITS: Partial<Record<string, readonly string[]>> = {
  CF: ['contact', 'speed', 'fielding'],
  LF: ['power', 'eye', 'arm'],
  RF: ['power', 'eye', 'arm'],
  '1B': ['power', 'eye', 'fielding'],
  '3B': ['power', 'eye', 'fielding'],
  SS: ['contact', 'speed', 'fielding'],
  '2B': ['contact', 'speed', 'fielding'],
  C: ['power', 'eye', 'fielding'],
  DH: ['power', 'contact', 'eye'],
};
const PITCHER_TRAINING_FITS: Partial<Record<string, readonly string[]>> = {
  SP: ['control', 'breaking', 'stamina'],
  RP: ['velocity', 'stuff', 'recovery'],
  CP: ['velocity', 'stuff', 'recovery'],
};
const TRAINING_FIT_MULTIPLIER = 1.2;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const rounded = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function getPositionCode(position: string) {
  const name = position.replace(/\s+/g, '').toUpperCase();
  return POSITION_CODES[name] ?? name;
}

export function emptyStats(): Stats {
  return Object.fromEntries(STAT_KEYS.map(key => [key, 0])) as unknown as Stats;
}
function addStats(target: Stats, source: Stats) {
  for (const key of STAT_KEYS) target[key] = (target[key] ?? 0) + (source[key] ?? 0);
}
export function inningsLabel(outs: number): string { return `${Math.floor(outs / 3)}${outs % 3 ? `.${outs % 3}` : '.0'}`; }
export function statsRates(stats: Stats): StatRates {
  const singles = stats.h - stats.doubles - stats.triples - stats.hr;
  const totalBases = singles + stats.doubles * 2 + stats.triples * 3 + stats.hr * 4;
  const avg = stats.ab ? stats.h / stats.ab : 0;
  const denominator = stats.ab + stats.bb + stats.hbp + stats.sf;
  const obp = denominator ? (stats.h + stats.bb + stats.hbp) / denominator : 0;
  const slg = stats.ab ? totalBases / stats.ab : 0;
  const decisions = stats.w + stats.l;
  return { avg: rounded(avg), obp: rounded(obp), slg: rounded(slg), ops: rounded(obp + slg),
    era: rounded(stats.outs ? stats.er * 27 / stats.outs : 0, 2),
    whip: rounded(stats.outs ? (stats.ha + stats.bba) * 3 / stats.outs : 0, 2),
    innings: inningsLabel(stats.outs), totalBases, winPct: rounded(decisions ? stats.w / decisions : 0) };
}
export function getOverall(player: Player): number {
  const keys = player.role === 'batter' ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
  const weights = player.role === 'batter'
    ? [1.25, 1.2, 1.1, .75, .95, .75]
    : /RP|CP|불펜|마무리|중간/i.test(player.position) ? [1.25, 1.3, 1.2, 1.1, .45, .7] : [1.1, 1.15, 1.2, 1.05, 1, .5];
  return clamp(Math.round(keys.reduce((sum, key, index) => sum + (player.attributes[key] || 0) * weights[index], 0) / weights.reduce((sum, value) => sum + value, 0)), 1, 99);
}
function hash(value: string) {
  let n = 2166136261;
  for (let i = 0; i < value.length; i++) { n ^= value.charCodeAt(i); n = Math.imul(n, 16777619); }
  return n >>> 0;
}
function potentialForSeed(seed: number): number {
  // Most rookies can become useful starters; only a small tail has historic upside.
  // These bands are game balance, not an assessment of real athletes or leagues.
  const band = hash(`${seed}:potential:band`) / 4294967296;
  const value = hash(`${seed}:potential:value`);
  if (band < .08) return 65 + value % 10;
  if (band < .48) return 75 + value % 9;
  if (band < .88) return 84 + value % 7;
  if (band < .98) return 91 + value % 4;
  return 95 + value % 5;
}
function randomGenerator(career: Pick<Career, 'seed'>) {
  return () => { career.seed = (Math.imul(career.seed, 1664525) + 1013904223) >>> 0; return career.seed / 4294967296; };
}
type Random = () => number;
function pick<T>(items: readonly T[], random: Random): T { return items[Math.floor(random() * items.length)]; }
function initialAttributes(role: 'batter' | 'pitcher', style: string, position: string): Attributes {
  const profiles = role === 'batter' ? {
    contact: [57, 37, 53, 45, 41, 37], power: [43, 60, 42, 34, 44, 42], speed: [45, 33, 43, 61, 48, 40],
  } : { velocity: [59, 52, 34, 38, 47, 40], control: [39, 43, 61, 46, 44, 37], breaking: [40, 46, 44, 61, 41, 38] };
  const keys = role === 'batter' ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
  const values = profiles[style as keyof typeof profiles] as number[] | undefined;
  const attrs = Object.fromEntries(keys.map((key, i) => [key, values?.[i] ?? 45]));
  const sample = { role, position, attributes: attrs } as Player;
  for (let step = 0; step < 80 && getOverall(sample) !== 45; step++) {
    const delta = getOverall(sample) > 45 ? -1 : 1;
    for (const key of keys) attrs[key] = clamp(attrs[key] + delta, 20, 70);
  }
  return attrs;
}
export function createCareer(input: CreateCareerInput): Career {
  const role = input.role === 'pitcher' ? 'pitcher' : 'batter';
  const position = input.position || (role === 'batter' ? 'CF' : 'SP');
  const style = input.style || (role === 'batter' ? 'contact' : 'velocity');
  const seed = (input.seed ?? Math.floor(Math.random() * 4294967295)) >>> 0;
  const attrs = initialAttributes(role, style, position);
  const name = input.name.trim().slice(0, 16) || '새로운 전설';
  const requestedAvatar = input.avatar ?? 0;
  const avatar = Number.isFinite(requestedAvatar) ? clamp(Math.floor(requestedAvatar), 0, MAX_AVATAR_ID) : 0;
  const state: Omit<Career, 'leagueId' | 'teamId' | 'amateur' | 'phase'> & { phase: 'ready' } = {
    schemaVersion: 1, id: `career-${seed.toString(36)}-${hash(name).toString(36)}`, seed,
    player: { name, number: clamp(Math.floor(input.number ?? 17), 0, 99), avatar,
      role, position, hand: input.hand || '우', nationality: input.nationality || '대한민국', age: 18, attributes: attrs,
      potential: potentialForSeed(seed), style },
    year: FIRST_YEAR, season: 1, phase: 'ready',
    training: (input.training?.filter(key => Object.hasOwn(attrs, key)).slice(0, 2) || [role === 'batter' ? 'contact' : 'control']),
    plan: 'balanced', health: 100, fatigue: 0, morale: 80, salary: 0, contractYears: 0,
    history: [], events: [], awards: [], offers: [], reputation: 0, hallScore: 0,
  };
  if (input.amateurAffiliationId !== undefined) {
    const affiliation = getAmateurAffiliation(input.amateurAffiliationId);
    if (!affiliation) throw new Error('시작 소속을 다시 선택해 주세요.');
    state.player.age = AMATEUR_COUNTRIES[affiliation.country].startAge;
    // Include the affiliation in the identity so the same player seed can start two paths.
    state.id += `-${hash(affiliation.id).toString(36)}`;
    event(state, '아마추어 커리어의 시작', `${affiliation.name}에서 첫 시즌을 준비합니다.`, 'debut');
    return { ...state, leagueId: null, teamId: null, amateur: { affiliationId: affiliation.id, status: 'active', history: [] } };
  }
  const leagueId = LEAGUE_IDS.includes(input.leagueId) ? input.leagueId : 'KBO';
  const team = TEAMS.find(team => team.id === input.teamId && team.leagueId === leagueId) ?? teamsForLeague(leagueId)[0];
  return {
    ...state, leagueId, teamId: team.id, salary: INITIAL_SALARY[leagueId], contractYears: 1,
    events: [{ id: `debut-${seed}`, year: FIRST_YEAR, title: '새로운 야구 인생의 시작',
      text: `${team.name}의 유니폼을 입었습니다. 벤치에서 시작한 이야기가 어디까지 이어질까요?`, kind: 'debut' }],
  };
}

interface Runner { user: boolean; userPitcher: boolean; earned: boolean }
interface HalfContext {
  random: Random; stats: Stats; userBatting: boolean; userPitching: boolean;
  defense?: { fielding: number; arm: number };
  hitter: Attributes; pitcher: Attributes; bases: (Runner | null)[]; outs: number;
  runs: number; inning: number; aggressive: boolean;
}
function scoreRunner(context: HalfContext, runner: Runner, rbi: boolean) {
  context.runs++;
  if (runner.user) context.stats.r++;
  if (runner.userPitcher && runner.earned) context.stats.er++;
  if (context.userBatting && rbi) context.stats.rbi++;
}
function recordOut(context: HalfContext, count = 1) {
  const actual = Math.min(count, 3 - context.outs);
  context.outs += actual;
  if (context.userPitching) context.stats.outs += actual;
}
function plateAppearance(context: HalfContext, forcedHomeRun = false) {
  const { random, stats, hitter, pitcher } = context;
  const batterUser = context.userBatting;
  const pitcherUser = context.userPitching;
  if (batterUser) stats.pa++;
  if (pitcherUser) stats.pa++;
  const contact = hitter.contact ?? 63;
  const power = hitter.power ?? 60;
  const eye = hitter.eye ?? 57;
  const stuff = (pitcher.stuff + pitcher.velocity + pitcher.breaking) / 3;
  const control = pitcher.control;
  const armStrength = (context.defense?.arm ?? 50) - 50;
  const strikeoutChance = clamp(.205 + (stuff - contact) * .0031, .075, .38);
  const walkChance = clamp(.077 + (eye - control) * .0019, .025, .17);
  const draw = random();
  const runner: Runner = { user: batterUser, userPitcher: pitcherUser, earned: true };
  if (!forcedHomeRun && draw < walkChance + .009) {
    if (batterUser) draw < .009 ? stats.hbp++ : stats.bb++;
    if (pitcherUser) draw < .009 ? stats.hbp++ : stats.bba++;
    if (context.bases[0]) {
      if (context.bases[1]) {
        if (context.bases[2]) scoreRunner(context, context.bases[2], true);
        context.bases[2] = context.bases[1];
      }
      context.bases[1] = context.bases[0];
    }
    context.bases[0] = runner;
    return;
  }
  if (!forcedHomeRun && draw < walkChance + .009 + strikeoutChance) {
    if (batterUser) { stats.ab++; stats.so++; }
    if (pitcherUser) { stats.ab++; stats.so++; }
    recordOut(context);
    return;
  }
  const hitChance = clamp(.31 + (contact - (stuff * .55 + control * .45)) * .003 + (power - 55) * .0006, .19, .47);
  if (forcedHomeRun || random() < hitChance) {
    if (batterUser) { stats.ab++; stats.h++; }
    if (pitcherUser) { stats.ab++; stats.ha++; }
    const extra = random();
    const hrShare = clamp(.085 + (power - 50) * .004, .025, .29);
    const steps = forcedHomeRun || extra < hrShare ? 4 : extra < hrShare + .023 ? 3 : extra < hrShare + .23 ? 2 : 1;
    if (batterUser) { if (steps === 4) stats.hr++; else if (steps === 3) stats.triples++; else if (steps === 2) stats.doubles++; }
    const advancePenalty = armStrength * .005;
    const next: (Runner | null)[] = [null, null, null];
    for (let index = 2; index >= 0; index--) {
      const existing = context.bases[index];
      if (!existing) continue;
      let destination = index + steps;
      if (steps === 1 && index === 1 && random() < clamp(.58 - advancePenalty, .20, .80)) destination = 3;
      if (steps === 2 && index === 0 && random() < clamp(.50 - advancePenalty, .20, .80)) destination = 3;
      if (destination >= 3) scoreRunner(context, existing, true);
      else { while (destination > 0 && next[destination]) destination--; next[destination] = existing; }
    }
    if (steps === 4) scoreRunner(context, runner, true); else next[steps - 1] = runner;
    context.bases = next;
    return;
  }
  const sacFly = !!context.bases[2] && context.outs < 2 && random() < .25;
  if (sacFly) {
    if (batterUser) stats.sf++;
    if (pitcherUser) stats.sf++;
    recordOut(context);
    scoreRunner(context, context.bases[2]!, true);
    context.bases[2] = null;
    return;
  }
  if (batterUser) stats.ab++;
  if (pitcherUser) stats.ab++;
  const fielding = context.defense?.fielding ?? 50;
  const errorChance = clamp(.012 - (fielding - 50) * .00022, .003, .024);
  if (random() < errorChance) {
    runner.earned = false;
    if (context.bases[0]) {
      if (context.bases[1]) {
        if (context.bases[2]) scoreRunner(context, context.bases[2], false);
        context.bases[2] = context.bases[1];
      }
      context.bases[1] = context.bases[0];
    }
    context.bases[0] = runner;
    return;
  }
  const doublePlayChance = clamp(.12 + armStrength * .0022, .055, .24);
  if (context.bases[0] && context.outs < 2 && random() < doublePlayChance) {
    context.bases[0] = null;
    recordOut(context, 2);
    return;
  }
  recordOut(context);
}

function genericHitter(value: number, random: Random): Attributes {
  return { contact: value + random() * 10 - 5, power: value - 4 + random() * 12, eye: value - 3,
    speed: value - 8, fielding: value, arm: value };
}
function genericPitcher(value: number): Attributes {
  return { velocity: value, stuff: value, control: value, breaking: value, stamina: value, recovery: value };
}
interface Competition {
  teamId: string;
  opponentIds: string[];
  games: number;
  rosterRating: number;
  playingTimeBonus?: number;
  allowsDraws: boolean;
}

interface GameFixture {
  opponentId: string;
  home: boolean;
  utcDate?: number;
  competitionId?: AmateurCompetitionId;
  trackPlayer?: boolean;
  inningLimit?: number;
}

function gameDateLabel(utcDate: number) {
  const date = new Date(utcDate);
  return `${date.getUTCMonth() + 1}.${String(date.getUTCDate()).padStart(2, '0')}`;
}

function pitcherRecovery(player: Player) {
  return player.role === 'pitcher' ? (clamp(player.attributes.recovery, 18, 99) - 45) / 50 : 0;
}

interface PitchingWorkload { fatigue: number; previousGameDate?: number }

function simulateGame(career: Career, competition: Competition, number: number, random: Random, injuredGames: number,
  fixture?: GameFixture, pitchingWorkload?: PitchingWorkload): GameSummary {
  const opponentId = fixture?.opponentId ?? competition.opponentIds[Math.floor((number - 1) / 3) % competition.opponentIds.length];
  const stats = emptyStats();
  const isBatter = career.player.role === 'batter';
  const isReliever = /RP|CP|불펜|마무리|중간/i.test(career.player.position);
  const isCloser = /CP|마무리/i.test(career.player.position);
  const ovr = getOverall(career.player);
  const home = fixture?.home ?? Math.floor((number - 1) / 3) % 2 === 0;
  const baseRating = competition.rosterRating;
  const teamRating = baseRating + (hash(competition.teamId) % 17 - 8);
  const opponentRating = baseRating + (hash(opponentId) % 17 - 8);
  const opportunity = clamp(.30 + (ovr - 45) * .018 + (career.season > 1 ? .04 : 0) + (competition.playingTimeBonus ?? 0), .24, .97);
  const available = fixture?.trackPlayer !== false && number > injuredGames && career.health > 25;
  const playerBats = isBatter && available && random() < opportunity * (career.plan === 'rest' ? .86 : career.plan === 'aggressive' ? 1.08 : 1);
  const workloadPlan = career.plan === 'rest' ? .86 : career.plan === 'aggressive' ? 1.08 : 1;
  const utcGameDate = fixture?.utcDate ?? Date.UTC(career.year, 2, 22 + Math.floor((number - 1) * 1.28));
  if (pitchingWorkload) {
    if (pitchingWorkload.previousGameDate !== undefined) {
      const days = Math.max(0, (utcGameDate - pitchingWorkload.previousGameDate) / DAY_IN_MS);
      const dailyRecovery = 7 + pitcherRecovery(career.player) * 5;
      pitchingWorkload.fatigue = Math.max(0, pitchingWorkload.fatigue - days * dailyRecovery);
    }
    pitchingWorkload.previousGameDate = utcGameDate;
  }
  const gameFatigue = isBatter ? career.fatigue : Math.min(95, career.fatigue + (pitchingWorkload?.fatigue ?? 0));
  const pitcherReadiness = 1 - Math.min(.45, Math.max(0, gameFatigue - 5) * .01);
  const pitcherScheduled = !isBatter && available && (isReliever
    ? number % 3 !== 0 && random() < .72 * opportunity * workloadPlan * pitcherReadiness
    : number % 5 === 1 && random() < Math.min(1, opportunity * 1.3 * workloadPlan * pitcherReadiness));
  const targetOuts = isReliever ? isCloser ? 3 : 3 + Math.floor(random() * 4) : clamp(Math.floor(12 + career.player.attributes.stamina * .09 + random() * 4), 12, 24);
  const pitchStartInning = isReliever ? isCloser ? 8 : 7 : 0;
  if (playerBats) stats.g = 1;
  let ours = 0, theirs = 0, ownLineup = Math.floor(random() * 9), enemyLineup = 0;
  let pitcherExitLead = 0;
  let relief: { entryLead: number; tyingRunInReach: boolean; keptLead: boolean; handedOff: boolean } | undefined;
  const fatiguePenalty = Math.max(0, gameFatigue - 45) / 12;
  const attributes = Object.fromEntries(Object.entries(career.player.attributes).map(([key, value]) => [key, value - fatiguePenalty]));
  const playerDefense = playerBats && getPositionCode(career.player.position) !== 'DH'
    ? { fielding: attributes.fielding, arm: attributes.arm } : undefined;
  const inningLimit = fixture?.inningLimit ?? (competition.allowsDraws ? 12 : 18);
  for (let inning = 0; inning < inningLimit; inning++) {
    for (const ownHalf of home ? [false, true] : [true, false]) {
      if (inning >= 8 && ownHalf && home && ours > theirs) break;
      if (inning >= 8 && !ownHalf && !home && theirs > ours) break;
      const context: HalfContext = {
        random, stats, userBatting: false, userPitching: false, hitter: genericHitter(ownHalf ? teamRating : opponentRating, random),
        pitcher: genericPitcher(ownHalf ? opponentRating : teamRating), bases: [null, null, null], outs: 0, runs: 0, inning,
        defense: ownHalf ? undefined : playerDefense,
        aggressive: career.plan === 'aggressive',
      };
      let safety = 0;
      while (context.outs < 3 && safety++ < 100) {
        context.userBatting = ownHalf && playerBats && ownLineup % 9 === 3;
        context.userPitching = !ownHalf && pitcherScheduled && inning >= pitchStartInning && stats.outs < targetOuts;
        if (context.userPitching) {
          if (isReliever && !stats.g) {
            const lead = ours - theirs - context.runs;
            relief = { entryLead: lead, tyingRunInReach: lead <= context.bases.filter(Boolean).length + 2, keptLead: lead > 0, handedOff: false };
          }
          stats.g = 1;
        } else if (!ownHalf && relief) {
          relief.handedOff = true;
        }
        context.hitter = context.userBatting ? attributes : genericHitter(ownHalf ? teamRating : opponentRating, random);
        context.pitcher = context.userPitching ? attributes : genericPitcher(ownHalf ? opponentRating : teamRating);
        plateAppearance(context);
        if (context.bases[0]?.user && !context.bases[1] && context.outs < 3 && random() < clamp((attributes.speed - 30) * .004, .01, .26)) {
          context.bases[1] = context.bases[0]; context.bases[0] = null; stats.sb++;
        }
        if (ownHalf) ownLineup++; else enemyLineup++;
        if (context.userPitching) {
          pitcherExitLead = ours - (theirs + context.runs);
          if (relief && pitcherExitLead <= 0) relief.keptLead = false;
        }
        if (inning >= 8 && ownHalf && home && ours + context.runs > theirs) break;
        if (inning >= 8 && !ownHalf && !home && theirs + context.runs > ours) break;
      }
      if (ownHalf) ours += context.runs; else theirs += context.runs;
    }
    if (inning >= 8 && ours !== theirs) break;
    if (inning === inningLimit - 1 && !competition.allowsDraws) {
      // A final sudden-death plate appearance is a real scoring event, keeping every run event-derived.
      const context: HalfContext = { random, stats, userBatting: false, userPitching: false, hitter: genericHitter(teamRating, random),
        pitcher: genericPitcher(opponentRating), bases: [null, null, null], outs: 0, runs: 0, inning, aggressive: false };
      plateAppearance(context, true);
      if (home) ours += context.runs; else theirs += context.runs;
    }
  }
  const result = ours > theirs ? 'W' : ours < theirs ? 'L' : 'D';
  if (!isBatter && stats.g) {
    if (pitchingWorkload) pitchingWorkload.fatigue = Math.min(65, pitchingWorkload.fatigue + 8 + stats.outs * 2);
    if (result === 'W' && !isReliever && stats.outs >= 15 && pitcherExitLead > 0) stats.w = 1;
    if (result === 'L' && stats.er > 0 && pitcherExitLead < 0) stats.l = 1;
    if (relief?.keptLead && stats.outs > 0 && !stats.w && !stats.l) {
      if (relief.handedOff) {
        if (relief.entryLead <= 3 || relief.tyingRunInReach) stats.hld = 1;
      } else if (result === 'W' && (relief.tyingRunInReach || (relief.entryLead <= 3 && stats.outs >= 3) || stats.outs >= 9)) {
        stats.sv = 1;
      }
    }
  }
  const gameDate = gameDateLabel(utcGameDate);
  const headline = isBatter
    ? stats.hr >= 2 ? `멀티 홈런! ${stats.hr}홈런 ${stats.rbi}타점` : stats.hr ? `담장을 넘긴 한 방, ${stats.rbi}타점` : stats.h >= 3 ? `${stats.h}안타 맹타` : stats.h ? `${stats.h}안타 ${stats.rbi}타점` : stats.g ? '다음 타석을 준비합니다' : '벤치에서 경기를 지켜봤어요'
    : stats.so >= 10 ? `${stats.so}탈삼진, 마운드를 지배하다` : stats.sv ? '마지막 아웃, 세이브를 챙겼어요'
      : stats.hld ? '리드를 지켜 홀드를 챙겼어요' : stats.w ? `${inningsLabel(stats.outs)}이닝 ${stats.er}자책, 승리투수`
        : stats.g ? `${inningsLabel(stats.outs)}이닝 ${stats.so}탈삼진` : '다음 등판을 준비합니다';
  return { id: `${career.year}-${number}`, number, date: gameDate,
    opponentId, home, scoreFor: ours, scoreAgainst: theirs, result, stats, headline,
    ...(fixture?.competitionId && { competitionId: fixture.competitionId }) };
}

function seasonAwards(career: ProfessionalCareer, stats: Stats): string[] {
  const rates = statsRates(stats), league = getLeague(career.leagueId), awards: string[] = [];
  // A strong season earns a nomination, not an automatic MVP every year. This
  // seeded benchmark stands in for the strongest opposing candidate that year.
  const competition = hash(`${career.leagueId}:${career.year}:award-field`) / 4294967296;
  if (career.player.role === 'batter') {
    const mvpOps = 1.13 + (1 - league.level) * .45 + competition * .12;
    const qualified = stats.pa >= league.games * 2.3;
    if (stats.pa >= league.games * 2.8 && rates.ops >= mvpOps && (stats.hr >= league.games * .24 || rates.avg >= .365)) awards.push('MVP');
    if (qualified && rates.avg >= .33) awards.push('타격왕');
    if (stats.hr >= league.games * .23) awards.push('홈런왕');
    if (stats.rbi >= league.games * .76) awards.push('타점왕');
    if (stats.r >= league.games * .76) awards.push('득점왕');
    if (stats.h >= league.games * 1.20) awards.push('최다안타왕');
    if (stats.sb >= league.games * .20) awards.push('도루왕');
    if (qualified && rates.obp >= .410) awards.push('출루율왕');
    if (qualified && rates.slg >= .620) awards.push('장타율왕');
    if (career.season === 1 && stats.pa >= 180 && rates.ops >= .72) awards.push('신인왕');
    if (stats.pa >= 300 && getOverall(career.player) >= 82 && career.player.attributes.fielding >= 85) awards.push('골든글러브');
  } else {
    const qualified = stats.outs >= league.games * 2.7;
    if (qualified && rates.era <= 2.65 - (1 - league.level) * .8 && stats.so >= league.games) awards.push(career.leagueId === 'MLB' ? '사이영상' : '최우수 투수');
    if (qualified && rates.era <= 1.7 - (1 - league.level) * .65 + competition * .2 && stats.so >= league.games * 1.3) awards.push('MVP');
    if (stats.w >= league.games * .125) awards.push('다승왕');
    if (qualified && rates.era <= 2.5) awards.push('평균자책점 1위');
    if (stats.so >= league.games * 1.35) awards.push('탈삼진왕');
    if (stats.w >= league.games * 10 / 144 && rates.winPct >= .75) awards.push('승률왕');
    if (stats.sv >= league.games * .145) awards.push('세이브왕');
    if ((stats.hld ?? 0) >= league.games * .11) awards.push('홀드왕');
    if (stats.sv >= league.games * .16 && rates.era <= 3) awards.push('최우수 불펜');
    if (career.season === 1 && stats.outs >= 180 && rates.era <= 4.1) awards.push('신인왕');
  }
  return awards;
}
function growPlayer(career: Career, stats: Stats, gameCount: number, injuredGames: number, random: Random) {
  const before = clone(career.player.attributes), player = career.player, ovr = getOverall(player);
  const batter = player.role === 'batter';
  const reliever = /RP|CP|불펜|마무리|중간/i.test(player.position);
  const closer = /CP|마무리/i.test(player.position);
  const workload = batter ? stats.pa : stats.outs;
  const fullWorkloadPerGame = batter || !reliever ? 3.3 : closer ? 1 : 1.5;
  const participation = clamp(workload / (gameCount * fullWorkloadPerGame), 0, 1.15);
  const playingFactor = clamp((participation - .15) / .18, 0, 1) * (.60 + participation * .45);

  const { ops, era } = statsRates(stats);
  const minimumSample = batter ? Math.max(24, gameCount * .30)
    : reliever ? Math.max(15, gameCount * .13) : Math.max(24, gameCount * .24);
  const sampleConfidence = clamp((workload - minimumSample) / minimumSample, 0, 1);
  const poorForm = clamp(batter ? (.60 - ops) / .25 : (era - 6) / 5.5, 0, 1) * sampleConfidence;

  const missedShare = injuredGames / gameCount;
  // The missed-game count accounts for long pro absences and the share for shorter amateur schedules.
  const longInjury = clamp(Math.max((injuredGames - 16) / 16, (missedShare - .30) / .55), 0, 1);
  const injuryFactor = 1 - Math.max(missedShare * .70, longInjury * .65);
  const age = player.age;
  const ageRate = age < 22 ? .14 : age < 26 ? .11 : age < 29 ? .07 : age < 31 ? .025 : .01;
  const growth = Math.max(0, player.potential - ovr) * ageRate * playingFactor * injuryFactor * (1 - poorForm * .65);
  const keys = batter ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
  const weights = keys.map(key => career.training.includes(key) ? 1.4 : .92);
  const weightMean = weights.reduce((sum, weight) => sum + weight, 0) / keys.length;
  const [first, second] = career.training;
  const trainingFits = batter ? BATTER_TRAINING_FITS : PITCHER_TRAINING_FITS;
  const positionFits = trainingFits[getPositionCode(player.position)];
  const hasTrainingFit = career.training.length === 2 && first !== second && positionFits?.includes(first) && positionFits.includes(second);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const physical = ['speed', 'velocity', 'stamina', 'recovery'].includes(key);
    const agingStarts = physical ? 30 : ['eye', 'control', 'breaking'].includes(key) ? 34 : 32;
    const aging = age >= agingStarts ? (age - agingStarts + 1) * (.35 + random() * .3) : 0;
    const decline = aging + poorForm * 3 + longInjury * (physical ? 3.2 : 2.3);
    const multiplier = hasTrainingFit && career.training.includes(key) ? TRAINING_FIT_MULTIPLIER : 1;
    const delta = Math.min(5, Math.round(growth * weights[i] / weightMean * multiplier + random() * .7 - .35 - decline));
    player.attributes[key] = clamp(Math.round(before[key] + delta), 18, 99);
  }
  return Object.fromEntries(keys.map(key => [key, player.attributes[key] - before[key]]));
}
function event(career: Pick<Career, 'year' | 'events'>, title: string, text: string, kind: CareerEvent['kind']) {
  career.events.unshift({ id: `${career.year}-${career.events.length}-${hash(title)}`, year: career.year, title, text, kind });
  career.events = career.events.slice(0, 250);
}
export function getTransferEligibility(career: ProfessionalCareer) {
  const serviceSeasons = career.history.filter(season => season.leagueId === career.leagueId).length;
  const graduated = career.amateur?.college?.year === COLLEGE_SEASONS;
  const faSeasonsRequired = graduated ? 7 : 8;
  const postingSeasonsRequired = 7;
  const canUseFA = serviceSeasons >= faSeasonsRequired && career.contractYears === 0;
  return {
    serviceSeasons, faSeasonsRequired, postingSeasonsRequired,
    canUseFA,
    canUseDomesticFA: canUseFA || (career.leagueId === 'MLB' && career.contractYears === 0),
    canUsePosting: serviceSeasons >= postingSeasonsRequired,
  };
}

export function getTransferOfferKind(career: ProfessionalCareer, offer: Pick<Offer, 'teamId' | 'leagueId'>) {
  const { canUseFA, canUseDomesticFA, canUsePosting } = getTransferEligibility(career);
  if (offer.leagueId === career.leagueId) {
    if (offer.teamId === career.teamId) return 'stay';
    return canUseDomesticFA ? 'fa' : undefined;
  }
  if (offer.leagueId === 'KBO' && offer.teamId === getKboReturnTeamId(career)) return 'return';
  if (canUseFA) return 'fa';
  if (canUsePosting) return 'posting';
  return undefined;
}

function stayOffer(career: ProfessionalCareer, proposedSalary: number, canUseFA: boolean): Offer {
  const overall = getOverall(career.player);
  const underContract = career.contractYears > 0;
  return {
    id: `stay-${career.year}`, leagueId: career.leagueId, teamId: career.teamId,
    salary: underContract ? career.salary : Math.max(career.salary, proposedSalary),
    years: underContract ? career.contractYears : canUseFA && career.player.age < 35 ? 2 : 1,
    role: overall >= 75 ? '핵심 선수' : overall >= 57 ? '주전 경쟁' : '육성 선수',
    description: underContract ? '현재 계약 조건으로 다음 시즌을 준비합니다.' : '원소속 구단에서 재계약을 제안했어요.',
    isCurrent: true,
  };
}

export function getProfessionalOffseasonOffers(career: ProfessionalCareer): Offer[] {
  if (career.phase !== 'offseason' || hasPendingPostseason(career) || career.player.age >= FINAL_PRO_SEASON_AGE) return [];
  const { canUseFA, canUseDomesticFA } = getTransferEligibility(career);
  // Older saves may already contain offers made before transfer eligibility was checked.
  const current = career.offers.find(offer => offer.teamId === career.teamId && offer.leagueId === career.leagueId);
  const stay = stayOffer(career, current?.salary ?? career.salary, canUseFA);
  const ids = new Set([stay.id]);
  const offers = [stay];
  for (const offer of career.offers) {
    const kind = getTransferOfferKind(career, offer);
    if (!kind || kind === 'stay' || ids.has(offer.id)) continue;
    ids.add(offer.id);
    offers.push(offer.isCurrent ? { ...offer, isCurrent: false } : offer);
  }
  if (career.leagueId === 'MLB' && canUseDomesticFA) addMlbOffers(career, offers, ids);
  addKboReturnOffer(career, offers, getKboReturnTeamId(career));
  return offers;
}

const MLB_OFFER_COUNT = 3;
const MAX_SAVED_OFFERS = 10;
const MAX_OFFER_SALARY: Record<LeagueId, number> = { KBO: 200000, NPB: 350000, MLB: 2200000, CPBL: 80000 };

function offerSalary(leagueId: LeagueId, overall: number, random: Random) {
  const salary = INITIAL_SALARY[leagueId] * Math.pow(Math.max(.9, (overall - 30) / 20), 2.75)
    * (leagueId === 'MLB' ? 2.8 : 1) * (.9 + random() * .25);
  return Math.round(clamp(salary, INITIAL_SALARY[leagueId], MAX_OFFER_SALARY[leagueId]) / 100) * 100;
}

function domesticOffer(career: ProfessionalCareer, teamId: string, overall: number, random: Random, id: string): Offer {
  return { id, leagueId: career.leagueId, teamId, salary: offerSalary(career.leagueId, overall, random), years: career.player.age >= 35 ? 1 : 2,
    role: overall >= 68 ? '주전 보장' : '새로운 도전', description: '같은 리그 구단에서 보내온 FA 제안', isCurrent: false };
}

function addMlbOffers(career: ProfessionalCareer, offers: Offer[], reservedIds: ReadonlySet<string>) {
  const alreadyOffered = new Set(offers.filter(offer => offer.leagueId === 'MLB').map(offer => offer.teamId));
  const needed = Math.min(MLB_OFFER_COUNT + 1 - alreadyOffered.size, MAX_SAVED_OFFERS - offers.length);
  if (needed <= 0) return;
  const offerId = (teamId: string) => `domestic-${career.year}-${teamId}`;
  const candidates = teamsForLeague('MLB').filter(team => !alreadyOffered.has(team.id) && !reservedIds.has(offerId(team.id)));
  // Legacy offseasons and repeated reads get the same offers without advancing the career seed.
  const random = randomGenerator({ seed: hash(`${career.id}:${career.seed}:${career.year}:mlb-offers`) });
  const overall = getOverall(career.player);
  for (let count = 0; count < needed && candidates.length; count++) {
    const target = candidates.splice(Math.floor(random() * candidates.length), 1)[0];
    offers.push(domesticOffer(career, target.id, overall, random, offerId(target.id)));
  }
}

function getKboReturnTeamId(career: ProfessionalCareer) {
  if (career.leagueId !== 'MLB' || career.contractYears > 0 || career.player.age >= FINAL_PRO_SEASON_AGE) return undefined;
  for (let index = career.history.length - 1; index >= 0; index--) {
    const season = career.history[index];
    if (season.leagueId === 'KBO') return season.teamId;
  }
  return undefined;
}

function addKboReturnOffer(career: ProfessionalCareer, offers: Offer[], teamId: string | undefined) {
  if (!teamId || offers.length >= MAX_SAVED_OFFERS) return;
  const id = `kbo-return-${career.year}`;
  if (offers.some(offer => offer.id === id || (offer.leagueId === 'KBO' && offer.teamId === teamId))) return;
  const random = randomGenerator({ seed: hash(`${career.id}:${career.seed}:${career.year}:kbo-return`) });
  const overall = getOverall(career.player);
  offers.push({
    id, leagueId: 'KBO', teamId, salary: offerSalary('KBO', overall, random), years: career.player.age >= 34 ? 1 : 3,
    role: overall >= 68 ? '주전 보장' : '주전 경쟁', description: '예전 소속 구단에서 보내온 복귀 제안', isCurrent: false,
  });
}

const TRADE_APPROVAL_CHANCE = .30;

function isTradeRequestWindow(career: ProfessionalCareer) {
  if (career.phase !== 'offseason' || hasPendingPostseason(career) || career.player.age >= FINAL_PRO_SEASON_AGE) return false;
  const { serviceSeasons, faSeasonsRequired } = getTransferEligibility(career);
  return serviceSeasons < faSeasonsRequired;
}

export function canRequestTrade(career: ProfessionalCareer) {
  if (career.leagueId === 'MLB' && career.contractYears === 0) return false;
  return isTradeRequestWindow(career) && !career.pendingTrade && !career.tradeRequestRejected;
}

export function requestTrade(input: Career): ProfessionalCareer | null {
  if (input.teamId === null || !canRequestTrade(input)) return null;
  const career = clone(input);
  const random = randomGenerator(career);
  if (random() < TRADE_APPROVAL_CHANCE) {
    const clubs = teamsForLeague(career.leagueId).filter(team => team.id !== career.teamId);
    career.pendingTrade = { status: 'approved', teamId: pick(clubs, random).id };
  } else {
    career.pendingTrade = { status: 'rejected' };
  }
  return career;
}

export function confirmTrade(input: Career): ProfessionalCareer | null {
  if (input.teamId === null || !input.pendingTrade || input.tradeRequestRejected
    || !isTradeRequestWindow(input) || !validTradeResult(input.pendingTrade, input)) return null;
  const result = input.pendingTrade;
  const career = clone(input);
  delete career.pendingTrade;
  if (result.status === 'rejected') {
    career.tradeRequestRejected = true;
    return career;
  }

  const target = getTeam(result.teamId);
  const current = getProfessionalOffseasonOffers(career)[0];
  event(career, `트레이드로 ${target.name} 이적`, `${getTeam(career.teamId).name}의 승인을 받아 ${target.name}에서 다음 시즌을 준비합니다.`, 'transfer');
  career.teamId = target.id;
  career.salary = current.salary;
  career.contractYears = current.years;
  prepareNextSeason(career);
  return career;
}

function createOffers(career: ProfessionalCareer, random: Random): Offer[] {
  if (career.player.age >= FINAL_PRO_SEASON_AGE) return [];
  const overall = getOverall(career.player);
  const { canUseFA, canUseDomesticFA, canUsePosting } = getTransferEligibility(career);
  const offers = [stayOffer(career, offerSalary(career.leagueId, overall, random), canUseFA)];
  if (canUseFA && career.leagueId !== 'MLB') {
    const domesticTeam = pick(teamsForLeague(career.leagueId).filter(team => team.id !== career.teamId), random);
    offers.push(domesticOffer(career, domesticTeam.id, overall, random, `domestic-${career.year}`));
  }
  if (career.leagueId === 'MLB' && canUseDomesticFA) addMlbOffers(career, offers, new Set(offers.map(offer => offer.id)));
  const kboReturnTeamId = getKboReturnTeamId(career);
  addKboReturnOffer(career, offers, kboReturnTeamId);
  if (!canUseFA && !canUsePosting) return offers;
  const thresholds: Record<LeagueId, number> = { CPBL: 45, KBO: 55, NPB: 65, MLB: 77 };
  for (const league of LEAGUES) {
    if (league.id === career.leagueId || overall < thresholds[league.id] || career.player.age >= 39) continue;
    if (league.id === 'KBO' && kboReturnTeamId) continue;
    const team = pick(teamsForLeague(league.id), random);
    offers.push({ id: `abroad-${league.id}-${career.year}`, leagueId: league.id, teamId: team.id, salary: offerSalary(league.id, overall, random), years: career.player.age >= 34 ? 1 : 3,
      role: overall >= thresholds[league.id] + 12 ? '핵심 선수' : '새로운 도전', description: `${league.name}에서 보내온 ${canUseFA ? '해외 FA' : '포스팅'} 제안`, isCurrent: false });
  }
  return offers;
}

function amateurCompetition(affiliation: AmateurAffiliation | CollegeAffiliation): Competition {
  const college = affiliation.kind === 'college';
  const field = college ? getCollegeAffiliations(affiliation.country) : getAmateurAffiliations(affiliation.country);
  return {
    teamId: affiliation.id,
    opponentIds: field.filter(team => team.id !== affiliation.id).map(team => team.id),
    games: (college ? COLLEGE_COMPETITIONS : AMATEUR_COUNTRIES)[affiliation.country].games,
    rosterRating: college ? 49 : 41,
    playingTimeBonus: college ? .08 : .12,
    allowsDraws: true,
  };
}

function gamesMissedToInjury(career: Career, gameCount: number, random: Random) {
  const injuryRisk = .075 + career.fatigue / 1100 + (career.plan === 'aggressive' ? .075 : career.plan === 'rest' ? -.04 : 0);
  return random() < injuryRisk * (1 - pitcherRecovery(career.player) * .45)
    ? Math.min(gameCount - 1, 6 + Math.floor(random() * 27)) : 0;
}

export function summarizeGames(games: readonly GameSummary[]) {
  const stats = emptyStats();
  let wins = 0, losses = 0, draws = 0;
  for (const game of games) {
    addStats(stats, game.stats);
    if (game.result === 'W') wins++; else if (game.result === 'L') losses++; else draws++;
  }
  const winRate = wins / Math.max(1, wins + losses);
  return { stats, wins, losses, draws, winRate };
}

const WEEKEND_OPPONENTS = 6;
const WEEKEND_GAMES = WEEKEND_OPPONENTS * 2;
const KNOCKOUT_ROUND_COUNT = KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS.length;
const DAY_IN_MS = 86_400_000;

function koreanCompetitionDates(competition: KoreanHighSchoolCompetition, year: number): number[] {
  const [startMonth, startDay] = competition.start;
  const [endMonth, endDay] = competition.end;
  const start = Date.UTC(year, startMonth - 1, startDay);
  const end = Date.UTC(year, endMonth - 1, endDay);
  if (competition.format === 'knockout') {
    const days = (end - start) / DAY_IN_MS;
    return KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS.map((_, index) => start + Math.floor(days * index / (KNOCKOUT_ROUND_COUNT - 1)) * DAY_IN_MS);
  }

  const weekendDays: number[] = [];
  for (let date = start; date <= end; date += DAY_IN_MS) {
    const day = new Date(date).getUTCDay();
    if (day !== 0 && day !== 6) continue;
    if (competition.id === 'weekend-first' && date >= Date.UTC(year, 2, 25) && date <= Date.UTC(year, 3, 12)) continue;
    weekendDays.push(date);
  }
  return Array.from({ length: WEEKEND_GAMES }, (_, index) => weekendDays[Math.floor(index * (weekendDays.length - 1) / (WEEKEND_GAMES - 1))]);
}

function seededTeamOrder(opponents: readonly string[], seed: string) {
  return opponents.map(id => ({ id, order: hash(`${seed}:${id}`) })).sort((a, b) => a.order - b.order).map(team => team.id);
}

function simulateCpuGame(career: Career, competition: Competition, teamId: string, opponentId: string, home: boolean, random: Random) {
  return simulateGame(career, { ...competition, teamId }, 1, random, 0, { opponentId, home, trackPlayer: false });
}

const POSTSEASON_OPENING_DAY: Readonly<Record<LeagueId, number>> = { KBO: 5, NPB: 10, MLB: 1, CPBL: 9 };

function postseasonDate(year: number, leagueId: LeagueId, dayOffset = 0) {
  return Date.UTC(year, 9, POSTSEASON_OPENING_DAY[leagueId] + dayOffset);
}

type LeagueTeamRecord = { wins: number; losses: number; draws: number; runsFor: number; runsAgainst: number };
type ProLeagueStanding = LeagueTeamRecord & {
  teamId: string;
  firstHalf?: LeagueTeamRecord;
  secondHalf?: LeagueTeamRecord;
  headToHead: Record<string, LeagueTeamRecord>;
};

function emptyTeamRecord(): LeagueTeamRecord {
  return { wins: 0, losses: 0, draws: 0, runsFor: 0, runsAgainst: 0 };
}

function recordTeamResult(record: LeagueTeamRecord, scored: number, allowed: number) {
  if (scored > allowed) record.wins++;
  else if (scored < allowed) record.losses++;
  else record.draws++;
  record.runsFor += scored;
  record.runsAgainst += allowed;
}

function recordRegularGame(team: ProLeagueStanding, opponentId: string, number: number, totalGames: number, scored: number, allowed: number) {
  recordTeamResult(team, scored, allowed);
  recordTeamResult(team.headToHead[opponentId] ??= emptyTeamRecord(), scored, allowed);
  const half = number <= totalGames / 2 ? team.firstHalf : team.secondHalf;
  if (half) recordTeamResult(half, scored, allowed);
}

function matchupRecords(standings: ProLeagueStanding[]): RegularSeasonMatchup[] {
  return standings.flatMap((team, index) => standings.slice(index + 1).map(({ teamId }): RegularSeasonMatchup => {
    const { wins, losses, draws, runsFor, runsAgainst } = team.headToHead[teamId];
    return [wins, losses, draws, runsFor, runsAgainst];
  }));
}

function regularSeasonRank(standings: readonly PostseasonStanding[], leagueId: LeagueId, teamId: string, bracket: PostseasonBracket) {
  if (leagueId === 'KBO') {
    const seeded = bracket.entries.find(entry => entry.teamId === teamId);
    if (seeded) return seeded.seed;
    if (bracket.series.some(series => series.id === 'kbo-seed-5' && (series.teamAId === teamId || series.teamBId === teamId))) return 6;
  }
  const group = getPostseasonGroup(leagueId, teamId);
  const ranked = rankPostseasonStandings(standings.filter(team => getPostseasonGroup(leagueId, team.teamId) === group), leagueId);
  return ranked.findIndex(team => team.teamId === teamId) + 1;
}

function postseasonPlayerStats(games: readonly PostseasonPlayerGame[], bracket: PostseasonBracket) {
  const qualificationSeries = new Set(bracket.series.filter(series => series.qualification).map(series => series.id));
  return summarizeGames(games.filter(game => !qualificationSeries.has(game.seriesId))).stats;
}

function playProfessionalSeason(career: ProfessionalCareer, competition: Competition, random: Random) {
  const { leagueId, teamId, year } = career;
  const standings: ProLeagueStanding[] = teamsForLeague(leagueId).map(team => ({
    teamId: team.id, ...emptyTeamRecord(), headToHead: {},
    ...(leagueId === 'CPBL' ? { firstHalf: emptyTeamRecord(), secondHalf: emptyTeamRecord() } : {}),
  }));
  const records = new Map(standings.map(team => [team.teamId, team]));
  const rotation = seededTeamOrder(standings.map(team => team.teamId), `${year}:${leagueId}:schedule`);
  const roundsPerCycle = rotation.length - 1;
  const start = Date.UTC(year, 2, 22);
  const regularDays = (postseasonDate(year, leagueId, -4) - start) / DAY_IN_MS;
  const injuredGames = gamesMissedToInjury(career, competition.games, random);
  const pitchingWorkload: PitchingWorkload | undefined = career.player.role === 'pitcher' ? { fatigue: 0 } : undefined;
  const cpuRandom = randomGenerator({ seed: hash(`${year}:${leagueId}:regular`) });
  const regularGames: GameSummary[] = [];

  // Rotate all clubs through the same schedule so every win is another club's loss.
  for (let round = 0; round < competition.games; round++) {
    const utcDate = start + Math.floor(round * regularDays / (competition.games - 1)) * DAY_IN_MS;
    const reverseHome = (round % roundsPerCycle + Math.floor(round / roundsPerCycle)) % 2 === 1;
    for (let pair = 0; pair < rotation.length / 2; pair++) {
      const first = rotation[pair], second = rotation[rotation.length - 1 - pair];
      const [homeId, awayId] = reverseHome ? [second, first] : [first, second];
      const isPlayerGame = homeId === teamId || awayId === teamId;
      const home = isPlayerGame ? homeId === teamId : true;
      const game = simulateGame(career, isPlayerGame ? competition : { ...competition, teamId: homeId }, round + 1,
        isPlayerGame ? random : cpuRandom, isPlayerGame ? injuredGames : 0,
        { opponentId: home ? awayId : homeId, home, utcDate, trackPlayer: isPlayerGame }, isPlayerGame ? pitchingWorkload : undefined);
      if (isPlayerGame) regularGames.push(game);
      const homeScore = home ? game.scoreFor : game.scoreAgainst;
      const awayScore = home ? game.scoreAgainst : game.scoreFor;
      recordRegularGame(records.get(homeId)!, awayId, round + 1, competition.games, homeScore, awayScore);
      recordRegularGame(records.get(awayId)!, homeId, round + 1, competition.games, awayScore, homeScore);
    }
    rotation.splice(1, 0, rotation.pop()!);
  }

  const postseasonGames: PostseasonPlayerGame[] = [];
  const postseasonCpuRandom = randomGenerator({ seed: hash(`${year}:${leagueId}:postseason`) });
  const bracket = playProPostseason(leagueId, year, standings, fixture => {
    const { seriesId, gameNumber, dayOffset, homeTeamId, awayTeamId, allowsDraws, inningLimit } = fixture;
    const isPlayerGame = homeTeamId === teamId || awayTeamId === teamId;
    const home = isPlayerGame ? homeTeamId === teamId : true;
    const number = postseasonGames.length + 1;
    const game = simulateGame(career, { ...competition, teamId: isPlayerGame ? teamId : homeTeamId, allowsDraws },
      competition.games + number, isPlayerGame ? random : postseasonCpuRandom, 0,
      { opponentId: home ? awayTeamId : homeTeamId, home, utcDate: postseasonDate(year, leagueId, dayOffset), trackPlayer: isPlayerGame, inningLimit },
      isPlayerGame ? pitchingWorkload : undefined);
    if (isPlayerGame) postseasonGames.push({ ...game, id: `${year}-postseason-${number}`, number, seriesId, gameNumber });
    return { homeScore: home ? game.scoreFor : game.scoreAgainst, awayScore: home ? game.scoreAgainst : game.scoreFor };
  });

  const { stats, wins, losses, draws, winRate } = summarizeGames(regularGames);
  const rank = regularSeasonRank(standings, leagueId, teamId, bracket);
  const savedStandings = standings.map(({ teamId, wins, losses, draws, runsFor, runsAgainst, firstHalf, secondHalf }) => ({
    teamId, wins, losses, draws, runsFor, runsAgainst, firstHalf, secondHalf,
  }));
  const postseason: ProPostseasonResult = {
    ...bracket, standings: savedStandings, matchups: matchupRecords(standings),
    qualified: bracket.entries.some(entry => entry.teamId === teamId), stats: postseasonPlayerStats(postseasonGames, bracket), games: postseasonGames,
  };
  return { stats, games: regularGames, injuredGames, winRate, teamRecord: { wins, losses, draws, rank }, postseason };
}

interface LeagueStanding { id: string; points: number; runDifference: number; runs: number }

function leagueStandings(career: Career, competition: Competition, opponents: string[], games: GameSummary[], random: Random, meetings = 2): LeagueStanding[] {
  const teams = [competition.teamId, ...opponents];
  const table = teams.map(id => ({ id, points: 0, runDifference: 0, runs: 0 }));
  function score(team: LeagueStanding, scoreFor: number, scoreAgainst: number) {
    team.points += scoreFor > scoreAgainst ? 2 : scoreFor === scoreAgainst ? 1 : 0;
    team.runDifference += scoreFor - scoreAgainst;
    team.runs += scoreFor;
  }
  for (const game of games) {
    const opponent = table[teams.indexOf(game.opponentId)];
    score(table[0], game.scoreFor, game.scoreAgainst);
    score(opponent, game.scoreAgainst, game.scoreFor);
  }
  for (let meeting = 0; meeting < meetings; meeting += 2) {
    for (let home = 1; home < table.length; home++) {
      for (let away = 1; away < table.length; away++) {
        if (home === away || (meeting + 1 === meetings && away < home)) continue;
        const { scoreFor, scoreAgainst } = simulateCpuGame(career, competition, teams[home], teams[away], true, random);
        score(table[home], scoreFor, scoreAgainst);
        score(table[away], scoreAgainst, scoreFor);
      }
    }
  }
  return table;
}

function rankedTeams(table: readonly LeagueStanding[]) {
  return [...table].sort((a, b) => b.points - a.points || b.runDifference - a.runDifference || b.runs - a.runs
    || a.id.localeCompare(b.id)).map(team => team.id);
}

function canPlayKoreanCup(id: KoreanHighSchoolCompetitionId, firstRank: number, secondRank: number, emartWins: number) {
  if (id === 'golden-lion') return [1, 2, 4].includes(firstRank);
  if (id === 'blue-dragon') return [1, 3, 5].includes(firstRank);
  if (id === 'president') return (secondRank > 0 && secondRank <= 2) || emartWins >= 2;
  return true;
}

function koreanCompetitionResult(definition: KoreanHighSchoolCompetition, games: GameSummary[], leagueRank: number): AmateurCompetitionResult {
  const { stats, wins, losses, draws } = summarizeGames(games);
  let outcome: AmateurCompetitionOutcome;
  let rank = leagueRank;
  if (definition.format === 'league') outcome = { kind: 'ranked', rank };
  else if (!games.length) outcome = { kind: 'notQualified' };
  else if (wins === KNOCKOUT_ROUND_COUNT) {
    rank = 1;
    outcome = { kind: 'champion' };
  } else {
    rank = 2 ** (KNOCKOUT_ROUND_COUNT - games.length) + 1;
    outcome = { kind: 'eliminated', round: KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS[games.length - 1] };
  }
  return { id: definition.id, stats, teamRecord: { wins, losses, draws, rank }, outcome };
}

function playKoreanHighSchoolSeason(career: ActiveAmateurCareer, affiliation: AmateurAffiliation, random: Random) {
  const league = amateurCompetition(affiliation);
  const cup = { ...league, allowsDraws: false };
  const seed = `${affiliation.id}:${career.year}`;
  const ordered = seededTeamOrder(league.opponentIds, `${seed}:weekend`);
  const local = ordered.filter(id => getAmateurAffiliation(id)?.region === affiliation.region);
  const weekendOpponents = [...local, ...ordered.filter(id => !local.includes(id))].slice(0, WEEKEND_OPPONENTS);
  const minimumGames = WEEKEND_GAMES * 2 + 2; // Both league halves and the two open cups.
  const injuredGames = gamesMissedToInjury(career, minimumGames, random);
  const games: GameSummary[] = [];
  const pitchingWorkload = career.player.role === 'pitcher' ? { fatigue: 0 } : undefined;
  const competitionGames = new Map<KoreanHighSchoolCompetitionId, GameSummary[]>();
  const tables = new Map<KoreanHighSchoolCompetitionId, LeagueStanding[]>();
  const ranks = new Map<KoreanHighSchoolCompetitionId, number>();
  const brackets = new Map<KoreanHighSchoolCompetitionId, string[]>();
  const calendar = KOREAN_HIGH_SCHOOL_COMPETITIONS.flatMap(definition => koreanCompetitionDates(definition, career.year)
    .map((utcDate, index) => ({ definition, utcDate, index }))).sort((a, b) => a.utcDate - b.utcDate);

  for (const { definition, utcDate, index } of calendar) {
    const { id, format } = definition;
    const results = competitionGames.get(id) ?? [];
    const cpuRandom = randomGenerator({ seed: hash(`${seed}:${id}:${index}:cpu`) });
    const play = (competition: Competition, opponentId: string, home: boolean) => {
      const game = simulateGame(career, competition, games.length + 1, random, injuredGames,
        { opponentId, home, utcDate, competitionId: id }, pitchingWorkload);
      games.push(game);
      results.push(game);
      competitionGames.set(id, results);
      return game.result;
    };

    if (format === 'league') {
      play(league, weekendOpponents[index % WEEKEND_OPPONENTS], (index < WEEKEND_OPPONENTS) === (index % 2 === 0));
      if (index === WEEKEND_GAMES - 1) {
        const table = leagueStandings(career, league, weekendOpponents, results, cpuRandom);
        tables.set(id, table);
        ranks.set(id, rankedTeams(table).indexOf(affiliation.id) + 1);
      }
      continue;
    }

    const emartWins = competitionGames.get('emart')?.filter(game => game.result === 'W').length ?? 0;
    if (index === 0 && !canPlayKoreanCup(id, ranks.get('weekend-first') ?? 0, ranks.get('weekend-second') ?? 0, emartWins)) continue;
    const alive = index === 0 ? [affiliation.id, ...seededTeamOrder(cup.opponentIds, `${seed}:${id}`).slice(0, 2 ** KNOCKOUT_ROUND_COUNT - 1)] : brackets.get(id);
    if (!alive) continue;
    if (play(cup, alive[1], cpuRandom() < .5) === 'L' || index === KNOCKOUT_ROUND_COUNT - 1) {
      brackets.delete(id);
      continue;
    }

    const winners = [affiliation.id];
    for (let pair = 2; pair < alive.length; pair += 2) {
      const game = simulateCpuGame(career, cup, alive[pair], alive[pair + 1], cpuRandom() < .5, cpuRandom);
      winners.push(game.result === 'W' ? alive[pair] : alive[pair + 1]);
    }
    brackets.set(id, winners);
  }

  const competitions = KOREAN_HIGH_SCHOOL_COMPETITIONS.map(definition => koreanCompetitionResult(definition,
    competitionGames.get(definition.id) ?? [], ranks.get(definition.id) ?? 0));
  const first = tables.get('weekend-first')!;
  const second = tables.get('weekend-second')!;
  const combined = first.map((team, index) => ({ id: team.id, points: team.points + second[index].points,
    runDifference: team.runDifference + second[index].runDifference, runs: team.runs + second[index].runs }));
  const { stats, wins, losses, draws, winRate } = summarizeGames(games);
  return { stats, games, injuredGames, winRate, competitions, teamRecord: { wins, losses, draws, rank: rankedTeams(combined).indexOf(affiliation.id) + 1 } };
}

type ScheduledKnockout = Extract<ScheduledCompetition, { format: 'knockout' }>;

function knockoutWinsRequired(event: ScheduledKnockout, round: number) {
  return event.seriesWins ?? (round === event.rounds ? event.finalWins : undefined) ?? 1;
}

function scheduledFixtureCount(event: ScheduledCompetition) {
  if (event.format === 'league') return event.opponents * event.meetings;
  return (event.rounds - 1) * (2 * knockoutWinsRequired(event, 1) - 1) + 2 * knockoutWinsRequired(event, event.rounds) - 1;
}

function scheduledFixtureDate(event: ScheduledCompetition, year: number, index: number) {
  const [[startMonth, startDay], [endMonth, endDay]] = event.dates;
  const calendarYear = year + (event.nextCalendarYear ? 1 : 0);
  const start = Date.UTC(calendarYear, startMonth - 1, startDay);
  const days = (Date.UTC(calendarYear, endMonth - 1, endDay) - start) / DAY_IN_MS;
  return start + Math.floor(index * days / Math.max(1, scheduledFixtureCount(event) - 1)) * DAY_IN_MS;
}

function collegeProvince(id: string) {
  return getCollegeAffiliation(id)?.region.split(' ')[0];
}

interface ScheduledStage {
  games: GameSummary[];
  result: AmateurCompetitionResult;
  standings?: string[];
}

function qualifiedForScheduledStage(event: ScheduledCompetition, stages: ReadonlyMap<string, ScheduledStage>, teamId: string, previousSeason?: AmateurSeasonResult) {
  const qualifier = event.qualification;
  if (!qualifier) return true;
  if ('rank' in qualifier && qualifier.previousSeason) {
    const rank = previousSeason?.competitions?.find(result => result.id === qualifier.from)?.teamRecord.rank ?? 0;
    return rank > 0 && rank <= qualifier.rank;
  }
  const previous = stages.get(qualifier.from);
  if (!previous?.games.length) return false;
  const { rank } = previous.result.teamRecord;
  if ('rank' in qualifier) return rank <= qualifier.rank;

  // The game uses U-League results against teams from the same province as trials.
  const localGames = previous.games.filter(game => collegeProvince(game.opponentId) === collegeProvince(teamId));
  return localGames.every(game => game.result === 'W' || (game.result === 'D' && rank <= 5));
}

function opponentsFromOtherGroups(ordered: readonly string[], ownGroup: string | undefined, groupOf: (team: string) => string | undefined) {
  const groups = new Set([ownGroup]);
  return ordered.filter(team => {
    const group = groupOf(team);
    if (groups.has(group)) return false;
    groups.add(group);
    return true;
  });
}

const CALIFORNIA_NORTH_IDS = new Set(CALIFORNIA_STATE_FINAL_OPPONENTS.map(team => team.id));
type ScheduledAffiliation = CollegeAffiliation | AmateurAffiliation;

function youthStageField(field: ScheduledCompetition['field'], affiliation: AmateurAffiliation, ordered: string[]) {
  const region = (id: string) => getSchoolOpponent(id)!.region;
  const japanDistrict = (id: string) => getSchoolOpponent(id)!.sourceUrl;
  const japanBlock = (id: string) => getJapanSchoolBlock(region(id));
  const academyRegion = (id: string) => getAcademyCompetitionRegion(getSchoolOpponent(id)!);
  switch (field) {
    case 'local':
      if (affiliation.country === 'US') return ordered.filter(team => !CALIFORNIA_NORTH_IDS.has(team));
      return ordered.filter(team => region(team) === affiliation.region).concat(ordered.filter(team => region(team) !== affiliation.region));
    case 'california-north':
      return ordered.filter(team => CALIFORNIA_NORTH_IDS.has(team));
    case 'japan-prefecture':
      return ordered.filter(team => region(team) === affiliation.region);
    case 'japan-summer-district':
      return ordered.filter(team => japanDistrict(team) === affiliation.sourceUrl);
    case 'japan-block':
      return ordered.filter(team => japanBlock(team) === japanBlock(affiliation.id));
    case 'japan-representatives':
      return opponentsFromOtherGroups(ordered, affiliation.sourceUrl, japanDistrict);
    case 'japan-block-representatives':
      return opponentsFromOtherGroups(ordered, japanBlock(affiliation.id), japanBlock);
    case 'academy-region':
      return ordered.filter(team => academyRegion(team) === academyRegion(affiliation.id));
    case 'academy-representatives':
      return opponentsFromOtherGroups(ordered, academyRegion(affiliation.id), academyRegion);
    default:
      return ordered;
  }
}

function scheduledStageOpponents(
  event: ScheduledCompetition, affiliation: ScheduledAffiliation, opponentIds: readonly string[],
  calendar: readonly ScheduledCompetitionDefinition[], stages: ReadonlyMap<string, ScheduledStage>, seed: string,
) {
  const { id, country } = affiliation;
  const ordered = seededTeamOrder(opponentIds, seed);
  const field = affiliation.kind === 'college' ? ordered : youthStageField(event.field, affiliation, ordered);
  const qualifier = event.qualification;
  if (qualifier && 'province' in qualifier) {
    return opponentsFromOtherGroups(field, collegeProvince(id), collegeProvince);
  }
  if (event.format === 'league' && event.regional) {
    const province = collegeProvince(id);
    return field.filter(team => collegeProvince(team) === province).concat(field.filter(team => collegeProvince(team) !== province));
  }
  if (event.format === 'knockout' && event.nationalField) {
    const local = new Set(getCollegeAffiliations(country).map(team => team.id));
    return field.filter(team => !local.has(team));
  }
  if (!qualifier || !('rank' in qualifier) || qualifier.previousSeason) return field;
  if (qualifier.sameField) {
    const previous = stages.get(qualifier.from);
    const qualified = previous?.standings?.slice(0, qualifier.rank) ?? previous?.games.map(game => game.opponentId) ?? [];
    return field.filter(team => qualified.includes(team));
  }
  const defeated = new Set<string>();
  let previous = calendar.find(stage => stage.id === qualifier.from);
  while (previous?.format === 'knockout') {
    for (const game of stages.get(previous.id)?.games ?? []) defeated.add(game.opponentId);
    previous = calendar.find(stage => stage.id === previous?.qualification?.from);
  }
  return field.filter(team => !defeated.has(team));
}

function knockoutSeries(games: GameSummary[]) {
  const rounds: GameSummary[][] = [];
  for (const game of games) {
    const previous = rounds.at(-1);
    if (previous?.[0].opponentId === game.opponentId) previous.push(game);
    else rounds.push([game]);
  }
  return rounds;
}

function scheduledStageResult(event: ScheduledCompetitionDefinition, games: GameSummary[], leagueRank: number): AmateurCompetitionResult {
  const { stats, wins, losses, draws } = summarizeGames(games);
  let rank = leagueRank;
  let outcome: AmateurCompetitionOutcome = { kind: 'notQualified' };
  if (games.length && event.format === 'league') {
    outcome = event.title && rank === 1 ? { kind: 'champion' } : { kind: 'ranked', rank };
  } else if (games.length && event.format === 'knockout') {
    const rounds = knockoutSeries(games);
    const roundsLeft = event.rounds - rounds.length;
    const seriesWins = rounds.at(-1)!.filter(game => game.result === 'W').length;
    const champion = roundsLeft === 0 && seriesWins === knockoutWinsRequired(event, event.rounds);
    rank = champion ? 1 : 2 ** roundsLeft + 1;
    if (champion) outcome = { kind: event.advanceOnWin ? 'advanced' : 'champion' };
    else outcome = { kind: 'eliminated', round: KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS[KNOCKOUT_ROUND_COUNT - roundsLeft - 1] };
  }
  return { id: event.id, stats, teamRecord: { wins, losses, draws, rank }, outcome };
}

function playKnockoutSeries(winsRequired: number, play: () => GameSummary) {
  let wins = 0, losses = 0;
  while (wins < winsRequired && losses < winsRequired) {
    if (play().result === 'W') wins++;
    else losses++;
  }
  return wins === winsRequired;
}

function playScheduledKnockout(
  event: ScheduledKnockout,
  field: string[],
  play: (opponent: string, home: boolean) => GameSummary,
  cpuGame: (team: string, opponent: string, home: boolean) => GameSummary,
  random: Random,
) {
  let alive = field;
  for (let round = 1; round <= event.rounds; round++) {
    const target = knockoutWinsRequired(event, round);
    if (!playKnockoutSeries(target, () => play(alive[1], random() < .5)) || round === event.rounds) return;

    const winners = [alive[0]];
    for (let pair = 2; pair < alive.length; pair += 2) {
      const won = playKnockoutSeries(target, () => cpuGame(alive[pair], alive[pair + 1], random() < .5));
      winners.push(won ? alive[pair] : alive[pair + 1]);
    }
    alive = winners;
  }
}

function scheduledSeasonCompetition(affiliation: ScheduledAffiliation): Competition {
  const opponents = affiliation.kind === 'college' ? getCollegeScheduleOpponents(affiliation.country) : getSchoolScheduleOpponents(affiliation);
  return {
    ...amateurCompetition(affiliation),
    opponentIds: opponents.filter(team => team.id !== affiliation.id).map(team => team.id),
  };
}

function scheduledSeasonRank(calendar: readonly ScheduledCompetitionDefinition[], stages: ReadonlyMap<string, ScheduledStage>) {
  const league = calendar.find(event => event.format === 'league' && stages.get(event.id)?.games.length);
  return league ? stages.get(league.id)!.result.teamRecord.rank : 1;
}

function scheduledCalendar(affiliation: ScheduledAffiliation, schoolYear: number, age: number) {
  return affiliation.kind === 'college' ? getCollegeCompetitions(affiliation.country) : getSchoolCompetitions(affiliation, schoolYear, age);
}

function playScheduledSeason(career: ActiveAmateurCareer, affiliation: ScheduledAffiliation, random: Random) {
  const league = scheduledSeasonCompetition(affiliation);
  const calendar = scheduledCalendar(affiliation, career.season, career.player.age);
  const previousSeason = career.amateur.history.at(-1);
  const minimumGames = calendar.filter(event => !event.qualification)
    .reduce((count, event) => count + (event.format === 'league' ? scheduledFixtureCount(event) : 1), 0);
  const injuredGames = gamesMissedToInjury(career, minimumGames, random);
  const stages = new Map<string, ScheduledStage>();
  const games: GameSummary[] = [];
  const pitchingWorkload = career.player.role === 'pitcher' ? { fatigue: 0 } : undefined;

  for (const event of calendar) {
    const pastGames: GameSummary[] = [];
    let standings: string[] | undefined;
    if (qualifiedForScheduledStage(event, stages, affiliation.id, previousSeason)) {
      const seed = `${affiliation.id}:${career.year}:${event.id}`;
      const opponents = scheduledStageOpponents(event, affiliation, league.opponentIds, calendar, stages, seed);
      const cpuRandom = randomGenerator({ seed: hash(`${seed}:cpu`) });
      const competition = { ...league, allowsDraws: event.format === 'league' && !event.noDraws };
      const play = (opponentId: string, home: boolean) => {
        const game = simulateGame(career, competition, games.length + 1, random, injuredGames,
          { opponentId, home, utcDate: scheduledFixtureDate(event, career.year, pastGames.length), competitionId: event.id }, pitchingWorkload);
        pastGames.push(game);
        games.push(game);
        return game;
      };
      if (event.format === 'league') {
        const field = opponents.slice(0, event.opponents);
        field.forEach((opponent, index) => {
          for (let meeting = 0; meeting < event.meetings; meeting++) play(opponent, (index + meeting) % 2 === 0);
        });
        standings = rankedTeams(leagueStandings(career, competition, field, pastGames, cpuRandom, event.meetings));
      } else {
        const field = [affiliation.id, ...opponents.slice(0, 2 ** event.rounds - 1)];
        playScheduledKnockout(event, field, play, (team, opponent, home) => simulateCpuGame(career, competition, team, opponent, home, cpuRandom), cpuRandom);
      }
    }
    const rank = standings ? standings.indexOf(affiliation.id) + 1 : 0;
    stages.set(event.id, { games: pastGames, standings, result: scheduledStageResult(event, pastGames, rank) });
  }
  const competitions = [...stages.values()].map(stage => stage.result);
  const { stats, wins, losses, draws, winRate } = summarizeGames(games);
  return { stats, games, injuredGames, winRate, competitions, teamRecord: { wins, losses, draws, rank: scheduledSeasonRank(calendar, stages) } };
}

function updateCondition(career: Career, stats: Stats, gameCount: number, injuredGames: number, winRate: number, awardCount: number) {
  const workload = career.player.role === 'batter' ? stats.g / gameCount : stats.outs / (gameCount * 3.5);
  const remainingFatigue = workload * 55 * (1 - pitcherRecovery(career.player) * .25);
  career.fatigue = clamp(Math.round(remainingFatigue + (career.plan === 'aggressive' ? 17 : career.plan === 'rest' ? -18 : 0)), 0, 95);
  career.health = clamp(100 - Math.round(career.fatigue * .17) - (injuredGames ? 9 : 0), 45, 100);
  career.morale = clamp(Math.round(75 + (winRate - .5) * 40 + awardCount * 4), 35, 100);
}

function runDraft(career: ActiveAmateurCareer, leagueId: LeagueId, season: AmateurSeasonResult, random: Random): DraftResult {
  const college = !!career.amateur.college;
  const batter = season.role === 'batter';
  const position = getPositionCode(career.player.position);
  const workload = batter ? season.stats.pa : season.stats.outs;
  const minimumWorkload = batter ? 24 : position === 'CP' ? 9 : position === 'RP' ? 12 : 30;
  const fullSample = batter ? 75 : position === 'CP' ? 18 : position === 'RP' ? 30 : 60;
  const scoutVariation = random() * 10 - 5;
  const undrafted: DraftResult = { status: 'undrafted', leagueId };
  if (workload < minimumWorkload) return undrafted;

  const stageStats = emptyStats();
  for (const result of career.amateur.history) {
    if (result.affiliationId === season.affiliationId) addStats(stageStats, result.stats);
  }
  // Scouts emphasize the latest season and use the player's record at the same level for context.
  const recent = statsRates(season.stats);
  const stage = statsRates(stageStats);
  const ops = recent.ops * .65 + stage.ops * .35;
  const era = recent.era * .65 + stage.era * .35;
  const whip = recent.whip * .65 + stage.whip * .35;
  if (batter ? recent.ops < .65 || ops < (college ? .72 : .74) : recent.era > 6.5 || era > 5.5 || whip > 1.75) return undrafted;

  const production = batter ? (ops - (college ? .80 : .82)) * 30
    : ((college ? 3.5 : 2.8) - era) * 2.7 + ((college ? 1.30 : 1.15) - whip) * 5;
  const confidence = clamp(workload / fullSample, .5, 1);
  const cutoff = DRAFT_CUTOFF + (college ? 2 : 0);
  const grade = season.overallAfter + clamp(production, -12, 12) * confidence - (1 - confidence) * 4 + scoutVariation;
  if (grade < cutoff) return undrafted;

  // Use the same game-specific round structure in each league. One team picks per round slot.
  const round = clamp(DRAFT_ROUNDS - Math.floor((grade - cutoff) / 3), 1, DRAFT_ROUNDS);
  const teams = teamsForLeague(leagueId).sort((a, b) => hash(`${season.year}:${a.id}`) - hash(`${season.year}:${b.id}`));
  const pick = Math.floor(random() * teams.length) + 1;
  return { status: 'drafted', leagueId, teamId: teams[pick - 1].id, round, pick, overallPick: (round - 1) * teams.length + pick };
}

function recordDraft(career: ActiveAmateurCareer, season: AmateurSeasonResult, leagueId: LeagueId) {
  const draft = runDraft(career, leagueId, season, randomGenerator(career));
  season.draft = draft;
  const summary = draft.status === 'drafted'
    ? `${getTeam(draft.teamId).name}에 ${draft.round}라운드 전체 ${draft.overallPick}순위로 지명됐어요.`
    : '신인 드래프트에서 지명되지 않았어요.';
  season.highlights.push(summary);
  event(career, draft.status === 'drafted' ? '신인 드래프트 지명' : '신인 드래프트 미지명', summary, 'development');
}

function migrateLegacyEntryOffers(career: ActiveAmateurCareer) {
  if (career.phase !== 'offseason' || !career.offers.length) return;
  const season = career.amateur.history.at(-1);
  if (!season || season.draft) return;

  const leagueId = career.offers[0].leagueId;
  career.offers = [];
  season.highlights = season.highlights.filter(highlight => highlight !== '아마추어 마지막 시즌을 마치고 프로 구단에서 계약을 제안했어요.');
  career.events = career.events.filter(entry => entry.year !== season.year || entry.title !== '프로 구단의 첫 제안');
  recordDraft(career, season, leagueId);
}

function recordCollegeAdmissions(career: ActiveAmateurCareer) {
  if (career.phase !== 'offseason' || career.amateur.college) return;
  const graduation = career.amateur.history.at(-1);
  if (graduation?.draft?.status !== 'undrafted' || graduation.admissions) return;
  const origin = getAmateurAffiliation(career.amateur.affiliationId);
  if (!origin) throw new Error('시작 소속을 확인할 수 없어요.');

  const totals = emptyStats();
  for (const season of career.amateur.history) addStats(totals, season.stats);
  const rates = statsRates(totals);
  const batter = career.player.role === 'batter';
  const position = getPositionCode(career.player.position);
  const reliever = position === 'RP' || position === 'CP';
  const sample = batter ? totals.pa / 250 : totals.outs / (reliever ? 75 : 180);
  const production = batter ? (rates.ops - .73) * 25 : (3.8 - rates.era) * 3;
  const experience = clamp(sample, 0, 1);
  const grade = graduation.overallAfter + clamp(production, -12, 12) * experience + (experience - .5) * 10;

  graduation.admissions = getCollegeAffiliations(origin.country).map<CollegeAdmission>(college => {
    const cohort = `${college.id}:${graduation.year}`;
    const opening = randomGenerator({ seed: hash(`${cohort}:${career.player.role}:${position}:opening`) })() < .75;
    if (!opening) return { affiliationId: college.id, status: 'rejected', reason: 'position' };
    // Vary the yearly cutoff within its tier so adjacent tiers never overlap.
    const [min, max] = COLLEGE_ADMISSION_CUTOFFS[college.baseballTier];
    const variation = randomGenerator({ seed: hash(`${cohort}:standard`) })();
    const cutoff = min + Math.floor(variation * (max - min + 1));
    return grade >= cutoff ? { affiliationId: college.id, status: 'accepted' }
      : { affiliationId: college.id, status: 'rejected', reason: 'performance' };
  });
}

function amateurTitles(competitions: AmateurCompetitionResult[]) {
  return competitions.filter(result => result.outcome.kind === 'champion').map(({ id }) => getAmateurCompetition(id)!.name);
}

function amateurCompetitionNews(affiliation: AmateurAffiliation | CollegeAffiliation, player: Player, season: ReturnType<typeof playScheduledSeason>, titles: string[]): NewsItem[] {
  const { name, kind } = affiliation;
  const league = season.competitions.find(result => getAmateurCompetition(result.id)?.format === 'league')!;
  const secondHalf = season.competitions.find(result => result.id === 'weekend-second');
  const leagueFinish = secondHalf ? `주말리그 전반기 ${league.teamRecord.rank}위·후반기 ${secondHalf.teamRecord.rank}위`
    : `${getAmateurCompetition(league.id)!.name} ${league.teamRecord.rank}위`;
  const { wins, losses, draws } = season.teamRecord;
  const { stats } = season;
  const recentGames = [...season.games].reverse();
  const game = recentGames.find(match => match.scoreFor === match.scoreAgainst + 1)
    ?? recentGames.find(match => match.result === 'W') ?? recentGames[0];
  const opponent = (kind === 'college' ? getCollegeAffiliation(game.opponentId) : getSchoolOpponent(game.opponentId))?.name ?? '상대 팀';
  const competition = getAmateurCompetition(game.competitionId!)!;
  const gameReaction = game.scoreFor === game.scoreAgainst + 1 ? '한 점 차 승리라 손에 땀 났어요.'
    : game.result === 'W' ? '이번 시즌에서 제일 기억에 남아요.'
      : game.result === 'D' ? '끝내 승부가 안 났네요.' : '이 경기 결과가 아쉬웠어요.';
  const { era, innings } = statsRates(stats);
  const playerReaction = !stats.g ? `${player.name} 선수는 다음 시즌에 출전하는 모습을 보고 싶네요.`
    : player.role === 'batter' ? `${player.name} 선수, ${stats.g}경기에서 ${stats.h}안타 ${stats.rbi}타점으로 시즌을 마쳤네요.`
      : `${player.name} 선수, ${innings}이닝 동안 ${stats.so}탈삼진에 평균자책점 ${era.toFixed(2)}으로 마쳤네요.`;
  return [
    { source: kind === 'college' ? '대학야구 뉴스' : kind === 'school' ? '고교야구 뉴스' : '아카데미 야구 뉴스', title: titles.length ? `${name}, ${titles.join('·')} 우승`
      : `${name}, ${leagueFinish}로 시즌 마감`, tone: titles.length ? 'positive' : 'neutral' },
    { source: '@주말야구석', title: `${competition.name} ${opponent}전 ${game.scoreFor}대 ${game.scoreAgainst}. ${gameReaction}`, tone: game.result === 'W' ? 'positive' : 'neutral' },
    { source: '@스코어북', title: playerReaction, tone: 'neutral' },
    { source: '@덕아웃메모', title: `시즌 ${wins}승 ${losses}패${draws ? ` ${draws}무` : ''}. ${wins > losses ? '이긴 경기가 더 많았네요.' : wins < losses ? '다음 시즌에 다시 응원할게요.' : '승패가 같았네요.'}`, tone: wins > losses ? 'positive' : 'neutral' },
  ];
}

function simulateAmateurSeason(career: ActiveAmateurCareer, random: Random): ActiveAmateurCareer {
  const college = career.amateur.college;
  const affiliation = college ? getCollegeAffiliation(college.affiliationId) : getAmateurAffiliation(career.amateur.affiliationId);
  if (!affiliation) throw new Error('현재 아마추어 소속을 확인할 수 없어요.');
  const tournamentSeason = affiliation.country === 'KR' && affiliation.kind === 'school'
    ? playKoreanHighSchoolSeason(career, affiliation, random) : playScheduledSeason(career, affiliation, random);
  const { stats, games, injuredGames, winRate, teamRecord, competitions } = tournamentSeason;
  const overallBefore = getOverall(career.player);
  const attributeGains = growPlayer(career, stats, games.length, injuredGames, random);
  const overallAfter = getOverall(career.player);
  const highlights = [`${affiliation.name} 소속으로 ${stats.g}경기에 출전했어요.`];
  if (overallAfter > overallBefore) highlights.push(`종합 능력치 ${overallBefore} → ${overallAfter}`);
  if (injuredGames) highlights.push(`부상으로 ${injuredGames}경기 동안 재활했어요.`);
  const config = AMATEUR_COUNTRIES[affiliation.country];
  const academicYear = college?.year ?? career.season;
  const titles = amateurTitles(competitions);
  const awards = titles.map(name => `${name} 우승`);
  const result: AmateurSeasonResult = {
    year: career.year, age: career.player.age, affiliationId: affiliation.id, role: career.player.role, stats,
    overallBefore, overallAfter, attributeGains, teamRecord, awards, highlights, games, injuredGames, championship: awards.length > 0,
    news: amateurCompetitionNews(affiliation, career.player, tournamentSeason, titles), competitions,
  };
  career.amateur.history.push(result);
  event(career, '아마추어 시즌 마무리', highlights[0], 'development');
  updateCondition(career, stats, games.length, injuredGames, winRate, awards.length);
  career.phase = 'offseason';
  if (college || academicYear === config.seasons) {
    recordDraft(career, result, config.leagueId);
    recordCollegeAdmissions(career);
  }
  return career;
}

export function simulateSeason(input: Career): Career {
  if (input.phase !== 'ready') return clone(input);
  const career = clone(input), random = randomGenerator(career);
  if (career.teamId === null) return simulateAmateurSeason(career, random);
  const league = getLeague(career.leagueId);
  const competition: Competition = {
    teamId: career.teamId, opponentIds: teamsForLeague(league.id).filter(team => team.id !== career.teamId).map(team => team.id),
    games: league.games, rosterRating: 47 + league.level * 23, allowsDraws: league.id !== 'MLB',
  };
  const before = getOverall(career.player);
  const { stats, games, injuredGames, winRate, teamRecord, postseason } = playProfessionalSeason(career, competition, random);
  if (postseason.qualified) postseason.revealedSeriesCount = getInitialPostseasonSeriesCount(postseason, career.teamId);
  const awards = seasonAwards(career, stats);
  const attributeGains = growPlayer(career, stats, league.games, injuredGames, random);
  const after = getOverall(career.player), rates = statsRates(stats);
  const highlights: string[] = [];
  if (career.season === 1 && stats.g) highlights.push(career.player.role === 'batter'
    ? stats.h ? '꿈에 그리던 프로 첫 타석과 첫 안타' : '꿈에 그리던 프로 첫 타석'
    : '프로 마운드에 오른 첫 시즌');
  if (stats.hr) highlights.push(`시즌 ${stats.hr}홈런, 담장 너머에 남긴 이름`);
  if (stats.so >= 100 && career.player.role === 'pitcher') highlights.push(`${stats.so}개의 삼진으로 증명한 구위`);
  if (after > before) highlights.push(`종합 능력치 ${before} → ${after}, 한 단계 더 성장했어요`);
  if (stats.sb >= 15) highlights.push(`${stats.sb}번의 도루로 그라운드를 흔들었어요`);
  if (injuredGames) highlights.push(`부상 재활 ${injuredGames}경기, 돌아오는 법을 배웠어요`);
  if (highlights.length === 0) highlights.push('기록보다 더 큰 경험을 쌓은 한 시즌');
  const positive = awards.length > 0 || after - before >= 3 || (career.player.role === 'batter' ? rates.ops > .76 : stats.outs > 150 && rates.era < 4);
  const news: SeasonResult['news'] = [
    { source: '베이스볼 데일리', title: awards.includes('MVP') ? `${career.player.name}, 리그의 별이 되다. MVP의 주인공!` : `${career.player.name}의 ${career.year}년: ${after > before ? '숫자로 증명한 성장' : '다음 시즌을 향한 담금질'}`, tone: positive ? 'positive' : 'neutral' },
    { source: '덕아웃 이야기', title: career.player.role === 'batter' ? `${stats.g}경기 ${stats.h}안타 ${stats.hr}홈런. ${career.player.name}의 이야기는 계속된다` : `${stats.g}경기 ${inningsLabel(stats.outs)}이닝 ${stats.so}탈삼진. 마운드 위의 한 페이지`, tone: 'neutral' },
    { source: '우리 팀 팬 게시판', title: positive ? '이 선수가 우리 유니폼을 입고 있다는 게 좋다. 내년에도 기대할게!' : '지금은 경험이 필요할 때. 다음 시즌엔 기회를 잡아주길!', tone: positive ? 'positive' : 'neutral' },
  ];
  const result: SeasonResult = { year: career.year, age: career.player.age, leagueId: career.leagueId, teamId: career.teamId,
    role: career.player.role, stats, overallBefore: before, overallAfter: after, attributeGains,
    teamRecord, awards, highlights, news, games, salary: career.salary, injuredGames, championship: false, postseason };
  const oldTotals = careerTotals(career);
  career.history.push(result);
  career.awards.push(...awards.map(name => ({ year: career.year, leagueId: career.leagueId, name })));
  if (career.season === 1 && stats.g) event(career, '프로 데뷔', `${league.name}에서 ${stats.g}경기를 뛰며 첫 페이지를 썼습니다.`, 'debut');
  if (after - before >= 3) event(career, '노력이 기록이 된 순간', `OVR ${before} → ${after}. ${career.training.map(key => ATTRIBUTE_LABELS[key]).join('·') || '기본기'} 훈련이 성장으로 이어졌습니다.`, 'development');
  for (const name of awards) event(career, name, `${career.year} ${league.name} ${name}의 주인공이 되었습니다.`, 'award');
  if (injuredGames) event(career, '다시, 그라운드로', `${injuredGames}경기 동안 재활에 집중한 뒤 복귀했습니다.`, 'injury');
  const totals = careerTotals(career);
  const milestones = career.player.role === 'batter' ? [[100, 'h', '100안타'], [500, 'h', '500안타'], [1000, 'h', '1,000안타'], [2000, 'h', '2,000안타'], [100, 'hr', '100홈런'], [300, 'hr', '300홈런'], [500, 'hr', '500홈런']] : [[500, 'so', '500탈삼진'], [1000, 'so', '1,000탈삼진'], [2000, 'so', '2,000탈삼진'], [100, 'w', '100승'], [200, 'w', '200승'], [100, 'sv', '100세이브'], [300, 'sv', '300세이브']];
  for (const [amount, field, label] of milestones) {
    if ((oldTotals[field as keyof Stats] as number) < Number(amount) && (totals[field as keyof Stats] as number) >= Number(amount)) event(career, `통산 ${label}`, '반복된 하루들이 잊지 못할 기록이 되었습니다.', 'milestone');
  }
  const points = career.player.role === 'batter'
    ? stats.pa / 145 + Math.max(0, rates.ops - .60) * 7 + stats.hr / 20
    : stats.outs / 150 + Math.max(0, 4.5 - rates.era) * (stats.outs / 700) + stats.sv / 14;
  career.hallScore = rounded(career.hallScore + points * (.7 + league.level * .3) + awards.reduce((sum, name) => sum + (name === 'MVP' ? 12 : name === '사이영상' || name === '최우수 투수' ? 10 : 4), 0), 1);
  career.reputation = clamp(Math.round(career.reputation + points * 1.2 + awards.length * 5), 0, 100);
  updateCondition(career, stats, league.games, injuredGames, winRate, awards.length);
  career.contractYears = Math.max(0, career.contractYears - 1);
  career.phase = 'offseason';
  career.offers = postseason.qualified ? [] : createOffers(career, random);
  return career;
}

export function hasPendingPostseason(career: Career) {
  if (career.phase !== 'offseason' || career.teamId === null) return false;
  const postseason = career.history.at(-1)?.postseason;
  return postseason?.revealedSeriesCount !== undefined && postseason.revealedSeriesCount < getPostseasonSeriesCount(postseason);
}

export function advancePostseason(input: Career): Career {
  if (!hasPendingPostseason(input) || input.teamId === null) return input;
  const career = clone(input);
  const season = career.history.at(-1)!;
  const postseason = season.postseason!;
  postseason.revealedSeriesCount = (postseason.revealedSeriesCount ?? 0) + 1;
  if (postseason.revealedSeriesCount < getPostseasonSeriesCount(postseason)
    && !getPostseasonElimination(postseason, season.teamId, postseason.revealedSeriesCount)) return career;

  finishPostseason(career, season, postseason);
  career.offers = createOffers(career, randomGenerator(career));
  return career;
}

function finishPostseason(career: ProfessionalCareer, season: SeasonResult, postseason: ProPostseasonResult) {
  postseason.revealedSeriesCount = getPostseasonSeriesCount(postseason);
  if (postseason.championId === season.teamId) {
    const award = '리그 우승';
    season.championship = true;
    season.awards.push(award);
    season.highlights.push(`${getTeam(season.teamId).name}와 함께 들어 올린 우승 트로피`);
    career.awards.push({ year: career.year, leagueId: career.leagueId, name: award });
    event(career, award, `${career.year} ${getLeague(career.leagueId).name} ${award}의 주인공이 되었습니다.`, 'award');
    career.hallScore = rounded(career.hallScore + 3, 1);
    career.reputation = Math.min(100, career.reputation + 5);
    career.morale = Math.min(100, career.morale + 4);
  }
}

export function advanceOffseason(input: Career, selectionId?: string): Career {
  if (input.phase !== 'offseason' || hasPendingPostseason(input) || (input.teamId !== null && input.pendingTrade)) return clone(input);
  const career = clone(input);
  if (career.teamId === null) {
    migrateLegacyEntryOffers(career);
    recordCollegeAdmissions(career);
    const result = career.amateur.history.at(-1);
    const draft = result?.draft;
    if (draft?.status === 'drafted') {
      const { teamId, leagueId, round } = draft;
      const overall = getOverall(career.player);
      const salary = Math.round(INITIAL_SALARY[leagueId] * (1 + Math.max(0, overall - 45) * .04 + (DRAFT_ROUNDS - round) * .02) / 100) * 100;
      const professional: ProfessionalCareer = {
        ...career, leagueId, teamId, salary, contractYears: round <= 3 ? 2 : 1,
        amateur: { ...career.amateur, status: 'completed' },
      };
      prepareNextSeason(professional);
      professional.season = 1;
      event(professional, '프로 입단', `${getTeam(teamId).name}에 입단해 ${getLeague(leagueId).name} 데뷔를 준비합니다.`, 'transfer');
      return professional;
    }

    const college = career.amateur.college;
    if (college?.year === COLLEGE_SEASONS) return retireCareer(career);
    if (!college && result?.admissions) {
      const accepted = result.admissions.filter(admission => admission.status === 'accepted');
      if (!accepted.length) return retireCareer(career);
      const admission = accepted.find(item => item.affiliationId === selectionId);
      const destination = admission && getCollegeAffiliation(admission.affiliationId);
      if (!destination) throw new Error('합격한 대학을 선택해 주세요.');

      prepareNextSeason(career);
      career.amateur.college = { affiliationId: destination.id, year: 1 };
      event(career, '대학 진학', `${destination.name}에 진학해 대학 야구 첫 시즌을 준비합니다.`, 'debut');
      return career;
    }
    prepareNextSeason(career);
    if (college) college.year++;
    return career;
  }
  const offers = getProfessionalOffseasonOffers(career);
  const offer = offers.find(offer => offer.id === selectionId) ?? offers[0];
  if (!offer) return career;
  if (offer.teamId !== career.teamId) {
    const kind = getTransferOfferKind(career, offer);
    const route = kind === 'return' ? '복귀 계약으로' : kind === 'posting' ? '포스팅을 거쳐' : 'FA 계약으로';
    const title = kind === 'return' ? `${getTeam(offer.teamId).name} 복귀` : `${getTeam(offer.teamId).name}로 이적`;
    event(career, title, `${route} ${getLeague(offer.leagueId).name}에서 ${offer.role}의 기회를 잡았습니다.`, 'transfer');
  }
  career.leagueId = offer.leagueId; career.teamId = offer.teamId;
  career.salary = offer.salary; career.contractYears = offer.years;
  prepareNextSeason(career);
  return career;
}

function prepareNextSeason(career: Career) {
  career.player.age++; career.year++; career.season++;
  career.phase = 'ready'; career.offers = [];
  if (career.teamId !== null) delete career.tradeRequestRejected;
  const fatigueRecovery = 40 + Math.round(pitcherRecovery(career.player) * 12);
  career.health = Math.min(100, career.health + 18);
  career.fatigue = Math.max(0, career.fatigue - fatigueRecovery);
}

export function retireCareer(input: Career): Career {
  if (input.phase === 'retired' || (input.teamId !== null && input.pendingTrade)) return clone(input);
  if (input.teamId === null) {
    const voluntary = input.phase === 'ready';
    const result = input.amateur.history.at(-1);
    const college = input.amateur.college;
    const noAdmission = !college && result?.admissions?.every(admission => admission.status === 'rejected');
    if (!voluntary && (result?.draft?.status !== 'undrafted' || (!noAdmission && college?.year !== COLLEGE_SEASONS))) return clone(input);

    const career = clone(input);
    const summary = voluntary ? '스스로 아마추어 야구 선수 생활을 마무리했습니다.'
      : noAdmission ? '프로 지명을 받지 못했고 합격한 대학도 없어 아마추어 야구 선수 생활을 마쳤습니다.'
        : '대학 마지막 드래프트에서 지명되지 않아 아마추어 야구 선수 생활을 마쳤습니다.';
    event(career, '아마추어 커리어 종료', summary, 'retirement');
    return {
      ...career, phase: 'retired', amateur: { ...career.amateur, status: 'retired' },
      retirement: {
        hallOfFame: false, title: '아마추어 커리어 종료', summary, score: 0, tier: 'journey',
        ...(voluntary && { reason: 'voluntary' as const }),
      },
    };
  }
  const career = clone(input);
  const season = career.history.at(-1);
  if (hasPendingPostseason(career) && season?.postseason) finishPostseason(career, season, season.postseason);
  const totals = careerTotals(career);
  const hallOfFame = career.hallScore >= HALL_THRESHOLD;
  const tier = hallOfFame ? 'legend' : career.hallScore >= HALL_THRESHOLD * .5 ? 'star' : career.history.length >= 8 ? 'veteran' : 'journey';
  career.phase = 'retired'; career.offers = [];
  delete career.tradeRequestRejected;
  career.retirement = { hallOfFame, title: hallOfFame ? '명예의 전당에 이름을 새기다' : tier === 'star' ? '팬들의 기억 속에 남은 스타' : tier === 'veteran' ? '그라운드를 지킨 베테랑' : '당신만의 야구 인생',
    summary: `${career.history.length}시즌, ${totals.g}경기. ${career.player.role === 'batter' ? `${totals.h.toLocaleString()}안타와 ${totals.hr}홈런` : `${inningsLabel(totals.outs)}이닝과 ${totals.so.toLocaleString()}탈삼진`}으로 당신의 이야기를 완성했습니다.`, score: career.hallScore, tier };
  event(career, hallOfFame ? '명예의 전당 입성' : '마지막 인사', career.retirement.summary, 'retirement');
  return career;
}
export function careerTotals(career: Career): CareerTotals {
  const stats = emptyStats();
  for (const season of career.history) addStats(stats, season.stats);
  return { ...stats, ...statsRates(stats), seasons: career.history.length,
    championships: career.history.filter(season => season.championship).length,
    peakOverall: Math.max(getOverall(career.player), ...career.history.map(season => season.overallAfter), 45) };
}

function isObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
const finite = (value: unknown, min: number, max: number, integer = false) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));
const text = (value: unknown, min = 0, max = 500) => typeof value === 'string' && value.length >= min && value.length <= max;
function validTeam(teamId: unknown, leagueId: unknown) { return TEAMS.some(team => team.id === teamId && team.leagueId === leagueId); }
function validTradeResult(result: unknown, career: ProfessionalCareer) {
  return isObject(result) && (result.status === 'approved'
    ? result.teamId !== career.teamId && validTeam(result.teamId, career.leagueId)
    : result.status === 'rejected' && result.teamId === undefined);
}
function validStats(value: unknown, role: unknown) {
  if (!isObject(value) || !STAT_KEYS.every(key => (key === 'hld' && value.hld === undefined) || finite(value[key], 0, 200000, true))) return false;
  const s = value as unknown as Stats;
  const holds = s.hld ?? 0;
  if (s.h > s.ab || s.ab > s.pa || s.hr + s.doubles + s.triples > s.h || s.w > s.g || s.l > s.g || s.sv > s.g || s.er > 10000) return false;
  if (role === 'batter' && (s.pa !== s.ab + s.bb + s.hbp + s.sf || s.so > s.ab || holds > 0)) return false;
  if (role === 'pitcher' && (s.so > s.outs || s.pa !== s.ab + s.bba + s.hbp + s.sf || holds > s.outs || s.w + s.l + s.sv + holds > s.g)) return false;
  return true;
}

function validSeason(value: Record<string, unknown>, role: unknown, attrs: string[], competition: Pick<Competition, 'opponentIds' | 'games' | 'allowsDraws'>, taggedCompetitions = false) {
  const record = value.teamRecord;
  const gains = value.attributeGains;
  const stats = value.stats;
  if ((!taggedCompetitions && value.competitions !== undefined) || value.role !== role || !validStats(stats, role)
    || !finite(value.overallBefore, 1, 100) || !finite(value.overallAfter, 1, 100)
    || !isObject(gains) || !attrs.every(key => finite(gains[key], -50, 50)) || !isObject(record)
    || !['wins', 'losses', 'draws'].every(key => finite(record[key], 0, 200, true))
    || !finite(record.rank, 1, competition.opponentIds.length + 1, true)
    || !Array.isArray(value.awards) || value.awards.length > 20 || !value.awards.every(item => text(item, 1, 60))
    || !Array.isArray(value.highlights) || value.highlights.length > 20 || !value.highlights.every(item => text(item, 1, 500))
    || !Array.isArray(value.news) || value.news.length > 20 || !value.news.every(item => isObject(item) && text(item.source, 1, 50) && text(item.title, 1, 500) && ['positive', 'neutral', 'negative'].includes(String(item.tone)))
    || !finite(value.injuredGames, 0, 200, true) || typeof value.championship !== 'boolean'
    || !Array.isArray(value.games) || value.games.length !== competition.games) return false;
  const aggregate = emptyStats();
  const results = { W: 0, L: 0, D: 0 };
  for (const game of value.games) {
    if (!isObject(game) || !text(game.id, 1, 100) || !text(game.date, 1, 20) || !text(game.headline, 0, 500)
      || (!taggedCompetitions && game.competitionId !== undefined)
      || !finite(game.number, 1, 200, true) || typeof game.opponentId !== 'string' || !competition.opponentIds.includes(game.opponentId)
      || typeof game.home !== 'boolean' || !finite(game.scoreFor, 0, 150, true) || !finite(game.scoreAgainst, 0, 150, true)
      || !validStats(game.stats, role)) return false;
    const expected = Number(game.scoreFor) > Number(game.scoreAgainst) ? 'W' : Number(game.scoreFor) < Number(game.scoreAgainst) ? 'L' : 'D';
    if (game.result !== expected || (!competition.allowsDraws && expected === 'D')) return false;
    addStats(aggregate, game.stats as Stats);
    results[expected]++;
  }
  return STAT_KEYS.every(key => aggregate[key] === ((stats as Stats)[key] ?? 0))
    && results.W === record.wins && results.L === record.losses && results.D === record.draws;
}

const TEAM_RECORD_KEYS = ['wins', 'losses', 'draws', 'runsFor', 'runsAgainst'] as const;

function sameTeamRecord(expected: LeagueTeamRecord, actual: unknown) {
  return isObject(actual) && TEAM_RECORD_KEYS.every(key => actual[key] === expected[key]);
}

function validHalfRecord(value: unknown, games: number): value is LeagueTeamRecord {
  return isObject(value) && TEAM_RECORD_KEYS.every(key => finite(value[key], 0, games * 150, true))
    && Number(value.wins) + Number(value.losses) + Number(value.draws) === games;
}

function restorePostseasonStandings(value: unknown, matchups: unknown, leagueId: LeagueId, games: number): ProLeagueStanding[] | null {
  const teams = teamsForLeague(leagueId);
  if (!Array.isArray(value) || value.length !== teams.length || !Array.isArray(matchups) || matchups.length !== teams.length * (teams.length - 1) / 2) return null;
  const standings: ProLeagueStanding[] = teams.map(({ id }) => ({ teamId: id, ...emptyTeamRecord(), headToHead: {} }));
  let matchupIndex = 0;
  for (const [index, team] of standings.entries()) {
    for (const opponent of standings.slice(index + 1)) {
      const matchup: unknown = matchups[matchupIndex++];
      if (!Array.isArray(matchup) || matchup.length !== TEAM_RECORD_KEYS.length || !matchup.every((count, i) => finite(count, 0, i < 3 ? games : games * 150, true))) return null;
      const [wins, losses, draws, runsFor, runsAgainst] = matchup as RegularSeasonMatchup;
      if (wins + losses + draws < 1 || wins + losses + draws > games || (leagueId === 'MLB' && draws !== 0)) return null;
      team.headToHead[opponent.teamId] = { wins, losses, draws, runsFor, runsAgainst };
      opponent.headToHead[team.teamId] = { wins: losses, losses: wins, draws, runsFor: runsAgainst, runsAgainst: runsFor };
      for (const key of TEAM_RECORD_KEYS) {
        team[key] += team.headToHead[opponent.teamId][key];
        opponent[key] += opponent.headToHead[team.teamId][key];
      }
    }
  }
  for (const [index, expected] of standings.entries()) {
    const saved: unknown = value[index];
    if (!isObject(saved) || saved.teamId !== expected.teamId || !sameTeamRecord(expected, saved)
      || expected.wins + expected.losses + expected.draws !== games) return null;
    if (leagueId === 'CPBL') {
      const { firstHalf, secondHalf } = saved;
      if (!validHalfRecord(firstHalf, games / 2) || !validHalfRecord(secondHalf, games / 2)
        || !TEAM_RECORD_KEYS.every(key => firstHalf[key] + secondHalf[key] === expected[key])) return null;
      expected.firstHalf = firstHalf;
      expected.secondHalf = secondHalf;
    }
  }
  if (leagueId === 'CPBL') {
    const firstWins = standings.reduce((sum, team) => sum + team.firstHalf!.wins, 0);
    const firstLosses = standings.reduce((sum, team) => sum + team.firstHalf!.losses, 0);
    const firstRuns = standings.reduce((sum, team) => sum + team.firstHalf!.runsFor - team.firstHalf!.runsAgainst, 0);
    if (firstWins !== firstLosses || firstRuns !== 0) return null;
  }
  return standings;
}

function sameBracketValue(expected: unknown, saved: unknown): boolean {
  if (Array.isArray(expected)) return Array.isArray(saved) && saved.length === expected.length && expected.every((value, index) => sameBracketValue(value, saved[index]));
  if (!isObject(expected) || !isObject(saved)) return expected === saved;
  return Object.entries(expected).every(([key, value]) => sameBracketValue(value, saved[key]));
}

function validProPostseason(season: SeasonResult, stored: unknown) {
  if (!isObject(stored) || !Array.isArray(stored.series) || stored.series.length > 32 || !Array.isArray(stored.games)
    || !stored.series.every(series => isObject(series) && Array.isArray(series.games) && series.games.length <= 64)
    || !validStats(stored.stats, season.role)) return false;
  const { leagueId, teamId, year, games } = season;
  const standings = restorePostseasonStandings(stored.standings, stored.matchups, leagueId, games.length);
  const playerTeam = standings?.find(team => team.teamId === teamId);
  if (!standings || !playerTeam) return false;
  const regularRecord: ProLeagueStanding = { teamId, ...emptyTeamRecord(), headToHead: {},
    ...(leagueId === 'CPBL' ? { firstHalf: emptyTeamRecord(), secondHalf: emptyTeamRecord() } : {}),
  };
  for (const [index, game] of games.entries()) recordRegularGame(regularRecord, game.opponentId, index + 1, games.length, game.scoreFor, game.scoreAgainst);
  if (!Object.entries(playerTeam.headToHead).every(([id, record]) => sameTeamRecord(record, regularRecord.headToHead[id]))
    || (leagueId === 'CPBL' && (!sameTeamRecord(playerTeam.firstHalf!, regularRecord.firstHalf) || !sameTeamRecord(playerTeam.secondHalf!, regularRecord.secondHalf)))) return false;

  const savedFixtures = new Map<string, unknown>();
  for (const series of stored.series) {
    if (!text(series.id, 1, 100) || savedFixtures.has(series.id)) return false;
    savedFixtures.set(series.id, series.games);
  }
  const savedGames = stored.games;
  let playedGames = 0;
  const reconstructed: PostseasonBracket = playProPostseason(leagueId, year, standings, fixture => {
    const { seriesId, gameNumber, homeTeamId, awayTeamId, dayOffset, allowsDraws } = fixture;
    const savedSeries = savedFixtures.get(seriesId);
    const match: unknown = Array.isArray(savedSeries) ? savedSeries[gameNumber - 1] : undefined;
    if (!isObject(match) || !sameBracketValue(fixture, match) || !finite(match.homeScore, 0, 150, true)
      || !finite(match.awayScore, 0, 150, true) || (!allowsDraws && match.homeScore === match.awayScore)) throw new Error('Invalid postseason fixture');
    const homeScore = Number(match.homeScore), awayScore = Number(match.awayScore);
    if (homeTeamId === teamId || awayTeamId === teamId) {
      const home = homeTeamId === teamId;
      const game: unknown = savedGames[playedGames++];
      const scoreFor = home ? homeScore : awayScore, scoreAgainst = home ? awayScore : homeScore;
      if (!isObject(game) || game.id !== `${year}-postseason-${playedGames}` || game.number !== playedGames
        || game.seriesId !== seriesId || game.gameNumber !== gameNumber || game.competitionId !== undefined
        || game.date !== gameDateLabel(postseasonDate(year, leagueId, dayOffset)) || game.home !== home
        || game.opponentId !== (home ? awayTeamId : homeTeamId) || game.scoreFor !== scoreFor || game.scoreAgainst !== scoreAgainst
        || game.result !== (scoreFor > scoreAgainst ? 'W' : scoreFor < scoreAgainst ? 'L' : 'D')
        || !text(game.headline, 0, 500) || !validStats(game.stats, season.role)) throw new Error('Invalid postseason player game');
    }
    return { homeScore, awayScore };
  });
  if (playedGames !== savedGames.length) return false;
  const gameTotals = postseasonPlayerStats(savedGames as PostseasonPlayerGame[], reconstructed);
  const stats = stored.stats as Stats;
  const qualified = reconstructed.entries.some(team => team.teamId === teamId);
  const seriesCount = getPostseasonSeriesCount(reconstructed);
  const cursor = stored.revealedSeriesCount;
  if (cursor !== undefined && (!qualified || !finite(cursor, 0, seriesCount, true))) return false;
  const championshipRevealed = cursor === undefined || cursor === seriesCount;
  return STAT_KEYS.every(key => gameTotals[key] === (stats[key] ?? 0))
    && sameBracketValue(reconstructed, stored) && stored.qualified === qualified
    && season.teamRecord.rank === regularSeasonRank(standings, leagueId, teamId, reconstructed)
    && season.championship === (championshipRevealed && reconstructed.championId === teamId)
    && (championshipRevealed || !season.awards.includes('리그 우승'));
}

function validCompetitionResult(result: Record<string, unknown>, expected: AmateurCompetitionResult) {
  const { stats, teamRecord, outcome } = result;
  return isObject(teamRecord) && isObject(outcome) && isObject(stats)
    && STAT_KEYS.every(key => expected.stats[key] === (key === 'hld' && stats.hld === undefined ? 0 : stats[key]))
    && Object.entries(expected.teamRecord).every(([key, count]) => count === teamRecord[key])
    && expected.outcome.kind === outcome.kind
    && (expected.outcome.kind !== 'ranked' || expected.outcome.rank === outcome.rank)
    && (expected.outcome.kind !== 'eliminated' || expected.outcome.round === outcome.round);
}

function validKoreanHighSchoolSeason(value: Record<string, unknown>, role: unknown, attrs: string[], school: Competition) {
  if (!Array.isArray(value.games) || !Array.isArray(value.competitions) || value.competitions.length !== KOREAN_HIGH_SCHOOL_COMPETITIONS.length
    || value.games.length > WEEKEND_GAMES * 2 + KNOCKOUT_ROUND_COUNT * 5
    || !validSeason(value, role, attrs, { ...school, games: value.games.length }, true)
    || !finite(value.injuredGames, 0, value.games.length - 1, true)
    || !finite((value.teamRecord as SeasonResult['teamRecord']).rank, 1, WEEKEND_OPPONENTS + 1, true)) return false;

  const year = Number(value.year);
  const calendar = new Map<AmateurCompetitionId, number[]>(KOREAN_HIGH_SCHOOL_COMPETITIONS.map(definition => [definition.id, koreanCompetitionDates(definition, year)]));
  const games = new Map<AmateurCompetitionId, GameSummary[]>();
  let previousDate = 0;
  for (const [index, game] of (value.games as GameSummary[]).entries()) {
    if (!game.competitionId || !calendar.has(game.competitionId) || game.number !== index + 1 || game.id !== `${year}-${game.number}`) return false;
    const group = games.get(game.competitionId) ?? [];
    const fixtureDate = calendar.get(game.competitionId)![group.length];
    if (fixtureDate === undefined || fixtureDate < previousDate) return false;
    if (game.date !== gameDateLabel(fixtureDate)) return false;
    group.push(game);
    games.set(game.competitionId, group);
    previousDate = fixtureDate;
  }

  let firstRank = 0, secondRank = 0, emartWins = 0;
  let champion = false;
  for (const [index, definition] of KOREAN_HIGH_SCHOOL_COMPETITIONS.entries()) {
    const { id, format } = definition;
    const result = value.competitions[index];
    if (!isObject(result) || result.id !== id || !isObject(result.teamRecord)) return false;
    const played = games.get(id) ?? [];
    const record = result.teamRecord;
    if (format === 'league') {
      if (played.length !== WEEKEND_GAMES || !finite(record.rank, 1, WEEKEND_OPPONENTS + 1, true)) return false;
      if (id === 'weekend-first') firstRank = Number(record.rank);
      if (id === 'weekend-second') secondRank = Number(record.rank);
    } else {
      const eligible = canPlayKoreanCup(id, firstRank, secondRank, emartWins);
      if (eligible !== (played.length > 0) || played.some((game, round) => game.result === 'D' || (round < played.length - 1 && game.result !== 'W'))
        || (played.length > 0 && played.length < KNOCKOUT_ROUND_COUNT && played.at(-1)?.result !== 'L')) return false;
    }

    const expected = koreanCompetitionResult(definition, played, format === 'league' ? Number(record.rank) : 0);
    if (id === 'emart') emartWins = expected.teamRecord.wins;
    if (expected.outcome.kind === 'champion') champion = true;
    if (!validCompetitionResult(result, expected)) return false;
  }
  return value.championship === champion;
}

function validScheduledKnockout(event: ScheduledKnockout, games: GameSummary[]) {
  const rounds = knockoutSeries(games);
  if (rounds.length > event.rounds || new Set(rounds.map(series => series[0].opponentId)).size !== rounds.length) return false;
  return rounds.every((series, index) => {
    if (series.some(game => game.result === 'D')) return false;
    const round = index + 1;
    const target = knockoutWinsRequired(event, round);
    const wins = series.filter(game => game.result === 'W').length;
    const losses = series.length - wins;
    if (series.at(-1)?.result === 'L') return round === rounds.length && losses === target && wins < target;
    return wins === target && losses < target && (round < rounds.length || round === event.rounds);
  });
}

function validScheduledSeason(
  value: Record<string, unknown>, role: unknown, attrs: string[], affiliation: ScheduledAffiliation,
  schoolYear: number, previousSeason?: AmateurSeasonResult,
) {
  const calendar = scheduledCalendar(affiliation, schoolYear, Number(value.age));
  const competition = scheduledSeasonCompetition(affiliation);
  if (!Array.isArray(value.games) || !Array.isArray(value.competitions) || value.competitions.length !== calendar.length
    || value.games.length > calendar.reduce((count, event) => count + scheduledFixtureCount(event), 0)
    || !validSeason(value, role, attrs, { ...competition, games: value.games.length }, true)
    || !finite(value.injuredGames, 0, value.games.length - 1, true)) return false;

  const games = value.games as GameSummary[];
  const year = Number(value.year);
  const stages = new Map<string, ScheduledStage>();
  let cursor = 0;
  for (const [index, event] of calendar.entries()) {
    const saved = value.competitions[index];
    if (!isObject(saved) || saved.id !== event.id || !isObject(saved.teamRecord)) return false;
    const start = cursor;
    while (games[cursor]?.competitionId === event.id) {
      const game = games[cursor];
      if (game.number !== cursor + 1 || game.id !== `${year}-${game.number}`
        || game.date !== gameDateLabel(scheduledFixtureDate(event, year, cursor - start))) return false;
      cursor++;
    }
    const played = games.slice(start, cursor);
    const eligible = qualifiedForScheduledStage(event, stages, affiliation.id, previousSeason);
    if (eligible !== (played.length > 0) || played.length > scheduledFixtureCount(event)) return false;

    let rank = 0;
    if (eligible) {
      const seed = `${affiliation.id}:${year}:${event.id}`;
      const allowed = scheduledStageOpponents(event, affiliation, competition.opponentIds, calendar, stages, seed);
      if (played.some(game => !allowed.includes(game.opponentId))) return false;
      if (event.format === 'league') {
        if (played.length !== scheduledFixtureCount(event) || !finite(saved.teamRecord.rank, 1, event.opponents + 1, true)
          || (event.noDraws && played.some(game => game.result === 'D'))) return false;
        const field = played.filter((_, i) => i % event.meetings === 0).map(game => game.opponentId);
        if (new Set(field).size !== event.opponents
          || played.some((game, i) => game.opponentId !== field[Math.floor(i / event.meetings)])) return false;
        rank = Number(saved.teamRecord.rank);
      } else if (!validScheduledKnockout(event, played)) return false;
    }

    const result = scheduledStageResult(event, played, rank);
    if (!validCompetitionResult(saved, result)) return false;
    stages.set(event.id, { games: played, result });
  }

  const results = [...stages.values()].map(stage => stage.result);
  return cursor === games.length && (value.teamRecord as SeasonResult['teamRecord']).rank === scheduledSeasonRank(calendar, stages)
    && value.championship === results.some(result => result.outcome.kind === 'champion');
}

function validDraft(value: unknown, leagueId: LeagueId): value is DraftResult {
  if (!isObject(value) || value.leagueId !== leagueId) return false;
  if (value.status === 'undrafted') return value.teamId === undefined && value.round === undefined && value.pick === undefined && value.overallPick === undefined;
  const teams = teamsForLeague(leagueId).length;
  return value.status === 'drafted' && validTeam(value.teamId, leagueId)
    && finite(value.round, 1, DRAFT_ROUNDS, true) && finite(value.pick, 1, teams, true)
    && value.overallPick === (Number(value.round) - 1) * teams + Number(value.pick);
}

function validCollegeAdmissions(value: unknown, country: AmateurCountry): value is CollegeAdmission[] {
  const collegeIds = new Set(getCollegeAffiliations(country).map(college => college.id));
  return Array.isArray(value) && value.length > 0 && value.length <= collegeIds.size && value.every(admission => isObject(admission)
    && typeof admission.affiliationId === 'string' && collegeIds.delete(admission.affiliationId)
    && (admission.status === 'accepted' && admission.reason === undefined
      || admission.status === 'rejected' && (admission.reason === 'position' || admission.reason === 'performance')));
}

function validAmateurPath(input: Record<string, unknown>, role: unknown, attrs: string[], age: unknown, offers: Offer[], proHistory: SeasonResult[]) {
  const amateur = input.amateur;
  if (!isObject(amateur) || typeof amateur.affiliationId !== 'string' || !Array.isArray(amateur.history)) return false;
  const affiliation = getAmateurAffiliation(amateur.affiliationId);
  if (!affiliation) return false;

  const college = amateur.college;
  if (college !== undefined && (!isObject(college) || typeof college.affiliationId !== 'string' || !finite(college.year, 1, COLLEGE_SEASONS, true))) return false;
  const collegeAffiliation = college && getCollegeAffiliations(affiliation.country).find(team => team.id === college.affiliationId);
  if (college && collegeAffiliation?.country !== affiliation.country) return false;

  const config = AMATEUR_COUNTRIES[affiliation.country];
  const schoolSeasons = config.seasons;
  const played = amateur.history.length;
  if (played > schoolSeasons + (collegeAffiliation ? COLLEGE_SEASONS : 0)) return false;

  // Keep the age timeline of careers saved before the starting age changed.
  const firstSeason: unknown = amateur.history[0];
  const startAge = isObject(firstSeason) ? firstSeason.age : age;
  if (startAge !== config.startAge && startAge !== LEGACY_AMATEUR_START_AGE) return false;

  const graduation = amateur.history[schoolSeasons - 1];
  const legacyOffers = input.teamId === null && input.phase === 'offseason' && offers.length > 0
    && new Set(offers.map(offer => offer.teamId)).size === offers.length
    && offers.every(offer => offer.leagueId === config.leagueId && !offer.isCurrent);
  const legacy = college === undefined && played === schoolSeasons && isObject(graduation) && graduation.draft === undefined
    && (input.teamId !== null || legacyOffers);

  const schoolCompetition = amateurCompetition(affiliation);
  const collegeCompetition = collegeAffiliation && amateurCompetition(collegeAffiliation);
  let lastDraft: DraftResult | undefined;
  let admissions: CollegeAdmission[] | undefined;
  let previousSeason: AmateurSeasonResult | undefined;
  for (const [index, season] of amateur.history.entries()) {
    const competition = index < schoolSeasons ? schoolCompetition : collegeCompetition;
    if (!competition || !isObject(season) || season.postseason !== undefined || season.affiliationId !== competition.teamId || season.year !== FIRST_YEAR + index
      || season.age !== startAge + index) return false;
    if (season.competitions !== undefined) {
      const seasonAffiliation = index < schoolSeasons ? affiliation : collegeAffiliation;
      if (!seasonAffiliation) return false;
      if (seasonAffiliation.kind === 'school' && seasonAffiliation.country === 'KR') {
        if (!validKoreanHighSchoolSeason(season, role, attrs, competition)) return false;
      } else if (!validScheduledSeason(season, role, attrs, seasonAffiliation, index + 1, previousSeason)) return false;
    } else if (!validSeason(season, role, attrs, competition)) return false;
    if (index < schoolSeasons - 1 || legacy) {
      if (season.draft !== undefined) return false;
    } else {
      if ((index >= schoolSeasons && lastDraft?.status !== 'undrafted') || !validDraft(season.draft, config.leagueId)) return false;
      lastDraft = season.draft;
    }
    if (season.admissions !== undefined) {
      if (index !== schoolSeasons - 1 || lastDraft?.status !== 'undrafted' || !validCollegeAdmissions(season.admissions, affiliation.country)) return false;
      admissions = season.admissions;
    }
    previousSeason = season as unknown as AmateurSeasonResult;
  }
  if (collegeAffiliation && admissions && !admissions.some(admission => admission.status === 'accepted' && admission.affiliationId === collegeAffiliation.id)) return false;

  if (input.teamId !== null) {
    if (amateur.status !== 'completed' || played < schoolSeasons
      || Number(input.year) < FIRST_YEAR + played || Number(age) < startAge + played) return false;
    if (legacy) return true;
    if (college && college.year !== played - schoolSeasons) return false;
    const firstPro = proHistory[0] ?? input;
    return lastDraft?.status === 'drafted' && firstPro.teamId === lastDraft.teamId && firstPro.leagueId === lastDraft.leagueId
      && firstPro.year === FIRST_YEAR + played;
  }

  if (input.leagueId !== null || (!legacy && offers.length)
    || input.salary !== 0 || input.contractYears !== 0 || input.hallScore !== 0
    || proHistory.length || (input.awards as unknown[]).length) return false;
  const retiredBeforeSeason = input.phase === 'retired' && isObject(input.retirement) && input.retirement.reason === 'voluntary';
  const index = played - (input.phase === 'ready' || retiredBeforeSeason ? 0 : 1);
  if (index < 0 || input.season !== index + 1
    || input.year !== FIRST_YEAR + index || age !== startAge + index) return false;
  if (college ? college.year !== index - schoolSeasons + 1 : index >= schoolSeasons) return false;
  if (input.phase === 'retired') {
    if (amateur.status !== 'retired') return false;
    if (retiredBeforeSeason) return lastDraft?.status !== 'drafted';
    const noAdmission = !college && admissions?.every(admission => admission.status === 'rejected');
    return lastDraft?.status === 'undrafted' && (noAdmission || college?.year === COLLEGE_SEASONS);
  }
  return amateur.status === 'active' && input.retirement === undefined
    && (input.phase !== 'ready' || lastDraft?.status !== 'drafted');
}

export function validateCareer(input: unknown): Career | null {
  try {
    if (!isObject(input) || input.schemaVersion !== 1 || !isObject(input.player)) return null;
    const p = input.player;
    if (!['batter', 'pitcher'].includes(String(p.role)) || !text(p.name, 1, 16) || !finite(p.number, 0, 99, true) || !finite(p.avatar, 0, MAX_AVATAR_ID, true)
      || !text(p.position, 1, 16) || !text(p.hand, 1, 20) || !text(p.nationality, 1, 40) || !text(p.style, 1, 40)
      || !finite(p.age, input.teamId === null ? 0 : 18, 50, true) || !finite(p.potential, 45, 100) || !isObject(p.attributes)) return null;
    const attrs = p.role === 'batter' ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
    if (!attrs.every(key => finite((p.attributes as Record<string, unknown>)[key], 1, 100))) return null;
    if (!text(input.id, 1, 100) || !finite(input.seed, 0, 4294967295, true)
      || !finite(input.year, FIRST_YEAR, 2075, true) || !finite(input.season, 1, 40, true)
      || !['ready', 'offseason', 'retired'].includes(String(input.phase)) || !['balanced', 'aggressive', 'rest'].includes(String(input.plan))) return null;
    if (!Array.isArray(input.training) || input.training.length > 2 || !input.training.every(key => attrs.includes(String(key)))) return null;
    for (const key of ['health', 'fatigue', 'morale', 'reputation']) if (!finite(input[key], 0, 100)) return null;
    if (!finite(input.salary, 0, 10000000) || !finite(input.contractYears, 0, 10, true) || !finite(input.hallScore, 0, 10000)) return null;
    if (!Array.isArray(input.history) || input.history.length > 35 || !Array.isArray(input.events) || input.events.length > 500
      || !Array.isArray(input.awards) || input.awards.length > 500 || !Array.isArray(input.offers) || input.offers.length > MAX_SAVED_OFFERS) return null;
    let previousYear = FIRST_YEAR - 1;
    let pendingPostseason = false;
    for (const value of input.history) {
      if (!isObject(value) || !finite(value.year, FIRST_YEAR, 2075, true) || Number(value.year) <= previousYear || !finite(value.age, 18, 50, true)
        || !LEAGUE_IDS.includes(value.leagueId as LeagueId) || !validTeam(value.teamId, value.leagueId) || !finite(value.salary, 0, 10000000)) return null;
      previousYear = Number(value.year);
      const league = getLeague(value.leagueId as LeagueId);
      const opponentIds = teamsForLeague(league.id).filter(team => team.id !== value.teamId).map(team => team.id);
      if (!validSeason(value, p.role, attrs, { opponentIds, games: league.games, allowsDraws: league.id !== 'MLB' })) return null;
      if (value.postseason !== undefined) {
        const season = value as unknown as SeasonResult;
        if (!validProPostseason(season, value.postseason)) return null;
        const postseason = season.postseason!;
        if (postseason.revealedSeriesCount !== undefined && postseason.revealedSeriesCount < getPostseasonSeriesCount(postseason)) {
          if (value !== input.history.at(-1) || input.phase !== 'offseason' || input.year !== season.year
            || input.teamId !== season.teamId || input.leagueId !== season.leagueId || input.offers.length !== 0) return null;
          pendingPostseason = true;
        }
      }
    }
    if (input.events.some(item => !isObject(item) || !text(item.id, 1, 100) || !finite(item.year, 2026, 2075, true) || !text(item.title, 1, 100) || !text(item.text, 1, 1000) || !['debut', 'milestone', 'award', 'transfer', 'injury', 'retirement', 'development'].includes(String(item.kind)))) return null;
    if (input.awards.some(item => !isObject(item) || !finite(item.year, 2026, 2075, true) || !LEAGUE_IDS.includes(item.leagueId as LeagueId) || !text(item.name, 1, 60))) return null;
    if (input.offers.some(item => !isObject(item) || !text(item.id, 1, 100) || !validTeam(item.teamId, item.leagueId) || !finite(item.salary, 0, 10000000) || !finite(item.years, 1, 10, true) || !text(item.role, 1, 60) || !text(item.description, 1, 500) || typeof item.isCurrent !== 'boolean')) return null;
    if (input.phase === 'retired' && (!isObject(input.retirement) || typeof input.retirement.hallOfFame !== 'boolean' || !text(input.retirement.title, 1, 100)
      || !text(input.retirement.summary, 1, 1000) || !finite(input.retirement.score, 0, 10000) || !['legend', 'star', 'veteran', 'journey'].includes(String(input.retirement.tier))
      || (input.retirement.reason !== undefined && input.retirement.reason !== 'voluntary'))) return null;
    if (input.amateur !== undefined && !validAmateurPath(input, p.role, attrs, p.age, input.offers as Offer[], input.history as SeasonResult[])) return null;
    if (input.teamId === null) {
      if (input.amateur === undefined) return null;
    } else if (!validTeam(input.teamId, input.leagueId) || (input.phase === 'offseason' && (!input.history.length
      || (!pendingPostseason && Number(p.age) < FINAL_PRO_SEASON_AGE && !input.offers.length)))) return null;
    const career = clone(input) as unknown as Career;
    if (input.tradeRequestRejected !== undefined
      && (career.teamId === null || career.tradeRequestRejected !== true || !isTradeRequestWindow(career))) return null;
    if (input.pendingTrade !== undefined && (career.teamId === null || career.tradeRequestRejected
      || !isTradeRequestWindow(career) || !validTradeResult(input.pendingTrade, career))) return null;
    if (career.teamId === null && career.phase === 'offseason') {
      migrateLegacyEntryOffers(career);
      recordCollegeAdmissions(career);
    } else if (career.teamId !== null && career.phase === 'offseason') {
      const season = career.history.at(-1);
      const postseason = season?.postseason;
      if (pendingPostseason && season && postseason?.revealedSeriesCount !== undefined) {
        const openingCount = getInitialPostseasonSeriesCount(postseason, career.teamId);
        postseason.revealedSeriesCount = Math.max(postseason.revealedSeriesCount, openingCount);
        if (getPostseasonElimination(postseason, career.teamId, postseason.revealedSeriesCount)) {
          finishPostseason(career, season, postseason);
          career.offers = createOffers(career, randomGenerator(career));
        }
      }
      career.offers = getProfessionalOffseasonOffers(career);
    }
    return career;
  } catch { return null; }
}
