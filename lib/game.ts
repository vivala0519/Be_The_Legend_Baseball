import { LEAGUES, TEAMS, getLeague, getTeam, teamsForLeague } from './leagues';
import type { Attributes, Award, Career, CareerEvent, CareerTotals, CreateCareerInput, GameSummary, LeagueId, Offer, Player, SeasonResult, StatRates, Stats } from './game-types';

export * from './game-types';
export const HALL_THRESHOLD = 350;
export const BATTER_ATTRIBUTES = ['contact', 'power', 'eye', 'speed', 'fielding', 'arm'];
export const PITCHER_ATTRIBUTES = ['velocity', 'stuff', 'control', 'breaking', 'stamina', 'recovery'];
export const ATTRIBUTE_LABELS: Record<string, string> = {
  contact: '컨택', power: '파워', eye: '선구안', speed: '주루', fielding: '수비', arm: '송구',
  velocity: '구속', stuff: '구위', control: '제구', breaking: '변화구', stamina: '스태미나', recovery: '회복',
};

const STAT_KEYS: (keyof Stats)[] = ['g', 'pa', 'ab', 'h', 'doubles', 'triples', 'hr', 'r', 'rbi', 'bb', 'hbp', 'sf', 'sb', 'so', 'outs', 'er', 'ha', 'bba', 'w', 'l', 'sv'];
const LEAGUE_IDS: LeagueId[] = ['KBO', 'NPB', 'MLB', 'CPBL'];
const INITIAL_SALARY: Record<LeagueId, number> = { KBO: 3000, NPB: 5000, MLB: 10000, CPBL: 1800 };
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const rounded = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function emptyStats(): Stats {
  return Object.fromEntries(STAT_KEYS.map(key => [key, 0])) as unknown as Stats;
}
function addStats(target: Stats, source: Stats) {
  for (const key of STAT_KEYS) target[key] += source[key];
}
export function inningsLabel(outs: number): string { return `${Math.floor(outs / 3)}${outs % 3 ? `.${outs % 3}` : '.0'}`; }
export function statsRates(stats: Stats): StatRates {
  const singles = stats.h - stats.doubles - stats.triples - stats.hr;
  const totalBases = singles + stats.doubles * 2 + stats.triples * 3 + stats.hr * 4;
  const avg = stats.ab ? stats.h / stats.ab : 0;
  const denominator = stats.ab + stats.bb + stats.hbp + stats.sf;
  const obp = denominator ? (stats.h + stats.bb + stats.hbp) / denominator : 0;
  const slg = stats.ab ? totalBases / stats.ab : 0;
  return { avg: rounded(avg), obp: rounded(obp), slg: rounded(slg), ops: rounded(obp + slg),
    era: rounded(stats.outs ? stats.er * 27 / stats.outs : 0, 2),
    whip: rounded(stats.outs ? (stats.ha + stats.bba) * 3 / stats.outs : 0, 2), innings: inningsLabel(stats.outs), totalBases };
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
function randomGenerator(career: Career) {
  return () => { career.seed = (Math.imul(career.seed, 1664525) + 1013904223) >>> 0; return career.seed / 4294967296; };
}
type Random = () => number;
function pick<T>(items: T[], random: Random): T { return items[Math.floor(random() * items.length)]; }
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
  const leagueId = LEAGUE_IDS.includes(input.leagueId) ? input.leagueId : 'KBO';
  const team = TEAMS.find(team => team.id === input.teamId && team.leagueId === leagueId) ?? teamsForLeague(leagueId)[0];
  const role = input.role === 'pitcher' ? 'pitcher' : 'batter';
  const position = input.position || (role === 'batter' ? 'CF' : 'SP');
  const style = input.style || (role === 'batter' ? 'contact' : 'velocity');
  const seed = (input.seed ?? Math.floor(Math.random() * 4294967295)) >>> 0;
  const attrs = initialAttributes(role, style, position);
  const name = input.name.trim().slice(0, 16) || '새로운 전설';
  const career: Career = {
    schemaVersion: 1, id: `career-${seed.toString(36)}-${hash(name).toString(36)}`, seed,
    player: { name, number: clamp(Math.floor(input.number ?? 17), 0, 99), avatar: clamp(Math.floor(input.avatar ?? 0), 0, 7),
      role, position, hand: input.hand || '우', nationality: input.nationality || '대한민국', age: 18, attributes: attrs,
      potential: potentialForSeed(seed), style },
    leagueId, teamId: team.id, year: 2026, season: 1, phase: 'ready',
    training: (input.training?.filter(key => Object.hasOwn(attrs, key)).slice(0, 2) || [role === 'batter' ? 'contact' : 'control']),
    plan: 'balanced', health: 100, fatigue: 0, morale: 80, salary: INITIAL_SALARY[leagueId], contractYears: 1,
    history: [], events: [{ id: `debut-${seed}`, year: 2026, title: '새로운 야구 인생의 시작',
      text: `${team.name}의 유니폼을 입었습니다. 벤치에서 시작한 이야기가 어디까지 이어질까요?`, kind: 'debut' }],
    awards: [], offers: [], reputation: 0, hallScore: 0,
  };
  return career;
}

interface Runner { user: boolean; userPitcher: boolean; earned: boolean }
interface HalfContext {
  random: Random; stats: Stats; userBatting: boolean; userPitching: boolean;
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
    const next: (Runner | null)[] = [null, null, null];
    for (let index = 2; index >= 0; index--) {
      const existing = context.bases[index];
      if (!existing) continue;
      let destination = index + steps;
      if (steps === 1 && index === 1 && random() < .58) destination = 3;
      if (steps === 2 && index === 0 && random() < .50) destination = 3;
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
  if (random() < .012) {
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
  if (context.bases[0] && context.outs < 2 && random() < .12) {
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
function simulateGame(career: Career, number: number, random: Random, injuredGames: number): GameSummary {
  const league = getLeague(career.leagueId);
  const opponents = teamsForLeague(career.leagueId).filter(team => team.id !== career.teamId);
  const opponent = opponents[Math.floor((number - 1) / 3) % opponents.length];
  const stats = emptyStats();
  const isBatter = career.player.role === 'batter';
  const isReliever = /RP|CP|불펜|마무리|중간/i.test(career.player.position);
  const isCloser = /CP|마무리/i.test(career.player.position);
  const ovr = getOverall(career.player);
  const home = Math.floor((number - 1) / 3) % 2 === 0;
  const baseRating = 47 + league.level * 23;
  const teamRating = baseRating + (hash(career.teamId) % 17 - 8);
  const opponentRating = baseRating + (hash(opponent.id) % 17 - 8);
  const opportunity = clamp(.30 + (ovr - 45) * .018 + (career.season > 1 ? .04 : 0), .24, .97);
  const available = number > injuredGames && career.health > 25;
  const playerBats = isBatter && available && random() < opportunity * (career.plan === 'rest' ? .86 : career.plan === 'aggressive' ? 1.08 : 1);
  const workloadPlan = career.plan === 'rest' ? .86 : career.plan === 'aggressive' ? 1.08 : 1;
  const pitcherScheduled = !isBatter && available && (isReliever
    ? number % 3 !== 0 && random() < .72 * opportunity * workloadPlan
    : number % 5 === 1 && random() < Math.min(1, opportunity * 1.3 * workloadPlan));
  const targetOuts = isReliever ? isCloser ? 3 : 3 + Math.floor(random() * 4) : clamp(Math.floor(12 + career.player.attributes.stamina * .09 + random() * 4), 12, 24);
  const pitchStartInning = isReliever ? isCloser ? 8 : 7 : 0;
  if (playerBats) stats.g = 1;
  let ours = 0, theirs = 0, ownLineup = Math.floor(random() * 9), enemyLineup = 0;
  let pitcherExitLead = 0, lastUserPitcherInning = -1;
  const fatiguePenalty = Math.max(0, career.fatigue - 45) / 12;
  const attributes = Object.fromEntries(Object.entries(career.player.attributes).map(([key, value]) => [key, value - fatiguePenalty]));
  for (let inning = 0; inning < 18; inning++) {
    for (const ownHalf of home ? [false, true] : [true, false]) {
      if (inning >= 8 && ownHalf && home && ours > theirs) break;
      if (inning >= 8 && !ownHalf && !home && theirs > ours) break;
      const context: HalfContext = {
        random, stats, userBatting: false, userPitching: false, hitter: genericHitter(ownHalf ? teamRating : opponentRating, random),
        pitcher: genericPitcher(ownHalf ? opponentRating : teamRating), bases: [null, null, null], outs: 0, runs: 0, inning,
        aggressive: career.plan === 'aggressive',
      };
      let safety = 0;
      while (context.outs < 3 && safety++ < 100) {
        context.userBatting = ownHalf && playerBats && ownLineup % 9 === 3;
        context.userPitching = !ownHalf && pitcherScheduled && inning >= pitchStartInning && stats.outs < targetOuts;
        if (context.userPitching) { stats.g = 1; lastUserPitcherInning = inning; }
        context.hitter = context.userBatting ? attributes : genericHitter(ownHalf ? teamRating : opponentRating, random);
        context.pitcher = context.userPitching ? attributes : genericPitcher(ownHalf ? opponentRating : teamRating);
        plateAppearance(context);
        if (context.bases[0]?.user && !context.bases[1] && context.outs < 3 && random() < clamp((attributes.speed - 30) * .004, .01, .26)) {
          context.bases[1] = context.bases[0]; context.bases[0] = null; stats.sb++;
        }
        if (ownHalf) ownLineup++; else enemyLineup++;
        if (!ownHalf && context.userPitching) pitcherExitLead = ours - (theirs + context.runs);
        if (inning >= 8 && ownHalf && home && ours + context.runs > theirs) break;
        if (inning >= 8 && !ownHalf && !home && theirs + context.runs > ours) break;
      }
      if (ownHalf) ours += context.runs; else theirs += context.runs;
    }
    if (inning >= 8 && ours !== theirs) break;
    if (inning >= 11 && career.leagueId !== 'MLB') break;
    if (inning === 17 && ours === theirs) {
      // A final sudden-death plate appearance is a real scoring event, keeping every run event-derived.
      const context: HalfContext = { random, stats, userBatting: false, userPitching: false, hitter: genericHitter(teamRating, random),
        pitcher: genericPitcher(opponentRating), bases: [null, null, null], outs: 0, runs: 0, inning, aggressive: false };
      plateAppearance(context, true);
      if (home) ours += context.runs; else theirs += context.runs;
    }
  }
  const result = ours > theirs ? 'W' : ours < theirs ? 'L' : 'D';
  if (!isBatter && stats.g) {
    if (result === 'W' && !isReliever && stats.outs >= 15 && pitcherExitLead > 0) stats.w = 1;
    if (result === 'L' && stats.er > 0 && pitcherExitLead < 0) stats.l = 1;
    if (result === 'W' && isReliever && ours - theirs <= 3 && lastUserPitcherInning >= 8 && stats.outs >= 3) stats.sv = 1;
  }
  const gameDate = new Date(Date.UTC(career.year, 2, 22 + Math.floor((number - 1) * 1.28)));
  const headline = isBatter
    ? stats.hr >= 2 ? `멀티 홈런! ${stats.hr}홈런 ${stats.rbi}타점` : stats.hr ? `담장을 넘긴 한 방, ${stats.rbi}타점` : stats.h >= 3 ? `${stats.h}안타 맹타` : stats.h ? `${stats.h}안타 ${stats.rbi}타점` : stats.g ? '다음 타석을 준비합니다' : '벤치에서 경기를 지켜봤어요'
    : stats.so >= 10 ? `${stats.so}탈삼진, 마운드를 지배하다` : stats.sv ? '마지막 아웃, 세이브를 챙겼어요' : stats.w ? `${inningsLabel(stats.outs)}이닝 ${stats.er}자책, 승리투수` : stats.g ? `${inningsLabel(stats.outs)}이닝 ${stats.so}탈삼진` : '다음 등판을 준비합니다';
  return { id: `${career.year}-${number}`, number, date: `${gameDate.getUTCMonth() + 1}.${String(gameDate.getUTCDate()).padStart(2, '0')}`,
    opponentId: opponent.id, home, scoreFor: ours, scoreAgainst: theirs, result, stats, headline };
}

function seasonAwards(career: Career, stats: Stats): string[] {
  const rates = statsRates(stats), league = getLeague(career.leagueId), awards: string[] = [];
  // A strong season earns a nomination, not an automatic MVP every year. This
  // seeded benchmark stands in for the strongest opposing candidate that year.
  const competition = hash(`${career.leagueId}:${career.year}:award-field`) / 4294967296;
  if (career.player.role === 'batter') {
    const mvpOps = 1.13 + (1 - league.level) * .45 + competition * .12;
    if (stats.pa >= league.games * 2.8 && rates.ops >= mvpOps && (stats.hr >= league.games * .24 || rates.avg >= .365)) awards.push('MVP');
    if (stats.pa >= league.games * 2.3 && rates.avg >= .33) awards.push('타격왕');
    if (stats.hr >= league.games * .23) awards.push('홈런왕');
    if (stats.sb >= league.games * .20) awards.push('도루왕');
    if (career.season === 1 && stats.pa >= 180 && rates.ops >= .72) awards.push('신인왕');
    if (stats.pa >= 300 && getOverall(career.player) >= 82 && career.player.attributes.fielding >= 85) awards.push('골든글러브');
  } else {
    const qualified = stats.outs >= league.games * 2.7;
    if (qualified && rates.era <= 2.65 - (1 - league.level) * .8 && stats.so >= league.games) awards.push(career.leagueId === 'MLB' ? '사이영상' : '최우수 투수');
    if (qualified && rates.era <= 1.7 - (1 - league.level) * .65 + competition * .2 && stats.so >= league.games * 1.3) awards.push('MVP');
    if (qualified && rates.era <= 2.5) awards.push('평균자책점 1위');
    if (stats.so >= league.games * 1.35) awards.push('탈삼진왕');
    if (stats.sv >= league.games * .16 && rates.era <= 3) awards.push('최우수 불펜');
    if (career.season === 1 && stats.outs >= 180 && rates.era <= 4.1) awards.push('신인왕');
  }
  return awards;
}
function growPlayer(career: Career, stats: Stats, injuredGames: number, random: Random) {
  const before = clone(career.player.attributes), player = career.player, ovr = getOverall(player), league = getLeague(career.leagueId);
  const participation = player.role === 'batter' ? clamp(stats.pa / (league.games * 3.3), 0, 1.15) : clamp(stats.outs / (league.games * (/RP|CP|불펜|마무리|중간/i.test(player.position) ? 1.5 : 3.3)), 0, 1.15);
  const age = player.age;
  const ageRate = age < 22 ? .20 : age < 26 ? .17 : age < 29 ? .11 : age < 31 ? .04 : .015;
  const growth = Math.max(0, player.potential - ovr) * ageRate * (.55 + participation * .65) * (1 - injuredGames / (league.games * 1.6));
  const keys = player.role === 'batter' ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
  const weights = keys.map(key => career.training.includes(key) ? 1.8 : .82);
  const weightMean = weights.reduce((sum, weight) => sum + weight, 0) / keys.length;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const agingStarts = ['speed', 'velocity', 'stamina', 'recovery'].includes(key) ? 30 : ['eye', 'control', 'breaking'].includes(key) ? 34 : 32;
    const decline = age >= agingStarts ? (age - agingStarts + 1) * (.35 + random() * .3) : 0;
    const delta = Math.round(growth * weights[i] / weightMean + random() * .9 - .35 - decline);
    player.attributes[key] = clamp(Math.round(before[key] + delta), 18, 99);
  }
  return Object.fromEntries(keys.map(key => [key, player.attributes[key] - before[key]]));
}
function event(career: Career, title: string, text: string, kind: CareerEvent['kind']) {
  career.events.unshift({ id: `${career.year}-${career.events.length}-${hash(title)}`, year: career.year, title, text, kind });
  career.events = career.events.slice(0, 250);
}
function createOffers(career: Career, random: Random): Offer[] {
  const overall = getOverall(career.player);
  const maxSalary: Record<LeagueId, number> = { KBO: 200000, NPB: 350000, MLB: 2200000, CPBL: 80000 };
  const value = (leagueId: LeagueId) => Math.round(clamp(INITIAL_SALARY[leagueId] * Math.pow(Math.max(.9, (overall - 30) / 20), 2.75) * (leagueId === 'MLB' ? 2.8 : 1) * (.9 + random() * .25), INITIAL_SALARY[leagueId], maxSalary[leagueId]) / 100) * 100;
  const offers: Offer[] = [{ id: `stay-${career.year}`, leagueId: career.leagueId, teamId: career.teamId,
    salary: Math.max(career.salary, value(career.leagueId)), years: career.player.age >= 35 ? 1 : 2,
    role: overall >= 75 ? '핵심 선수' : overall >= 57 ? '주전 경쟁' : '육성 선수', description: '익숙한 유니폼, 계속되는 도전', isCurrent: true }];
  const domestic = teamsForLeague(career.leagueId).filter(team => team.id !== career.teamId);
  const domesticTeam = pick(domestic, random);
  offers.push({ id: `domestic-${career.year}`, leagueId: career.leagueId, teamId: domesticTeam.id, salary: value(career.leagueId), years: career.player.age >= 35 ? 1 : 2,
    role: overall >= 68 ? '주전 보장' : '주전 경쟁', description: '새로운 구장에서 더 많은 기회를', isCurrent: false });
  const thresholds: Record<LeagueId, number> = { CPBL: 45, KBO: 55, NPB: 65, MLB: 77 };
  for (const league of LEAGUES) {
    if (league.id === career.leagueId || overall < thresholds[league.id] || career.player.age >= 39) continue;
    const team = pick(teamsForLeague(league.id), random);
    offers.push({ id: `abroad-${league.id}-${career.year}`, leagueId: league.id, teamId: team.id, salary: value(league.id), years: career.player.age >= 34 ? 1 : 3,
      role: overall >= thresholds[league.id] + 12 ? '핵심 선수' : '새로운 도전', description: `${league.name}에서 보내온 영입 제안`, isCurrent: false });
  }
  return offers;
}

export function simulateSeason(input: Career): Career {
  if (input.phase !== 'ready') return clone(input);
  const career = clone(input), random = randomGenerator(career), league = getLeague(career.leagueId);
  const before = getOverall(career.player);
  const injuryRisk = .075 + career.fatigue / 1100 + (career.plan === 'aggressive' ? .075 : career.plan === 'rest' ? -.04 : 0);
  const injuredGames = random() < injuryRisk ? 6 + Math.floor(random() * 27) : 0;
  const stats = emptyStats(), games: GameSummary[] = [];
  let wins = 0, losses = 0, draws = 0;
  for (let number = 1; number <= league.games; number++) {
    const game = simulateGame(career, number, random, injuredGames);
    games.push(game); addStats(stats, game.stats);
    if (game.result === 'W') wins++; else if (game.result === 'L') losses++; else draws++;
  }
  const winRate = wins / Math.max(1, wins + losses);
  const rank = clamp(Math.round((.71 - winRate) / .41 * (teamsForLeague(career.leagueId).length - 1)) + 1, 1, teamsForLeague(career.leagueId).length);
  const championship = rank <= 4 && random() < (rank === 1 ? .45 : .13);
  const awards = seasonAwards(career, stats);
  if (championship) awards.push('리그 우승');
  const attributeGains = growPlayer(career, stats, injuredGames, random);
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
  if (championship) highlights.push(`${getTeam(career.teamId).name}와 함께 들어 올린 우승 트로피`);
  if (highlights.length === 0) highlights.push('기록보다 더 큰 경험을 쌓은 한 시즌');
  const positive = awards.length > 0 || after - before >= 3 || (career.player.role === 'batter' ? rates.ops > .76 : stats.outs > 150 && rates.era < 4);
  const news: SeasonResult['news'] = [
    { source: '베이스볼 데일리', title: awards.includes('MVP') ? `${career.player.name}, 리그의 별이 되다. MVP의 주인공!` : `${career.player.name}의 ${career.year}년: ${after > before ? '숫자로 증명한 성장' : '다음 시즌을 향한 담금질'}`, tone: positive ? 'positive' : 'neutral' },
    { source: '덕아웃 이야기', title: career.player.role === 'batter' ? `${stats.g}경기 ${stats.h}안타 ${stats.hr}홈런. ${career.player.name}의 이야기는 계속된다` : `${stats.g}경기 ${inningsLabel(stats.outs)}이닝 ${stats.so}탈삼진. 마운드 위의 한 페이지`, tone: 'neutral' },
    { source: '우리 팀 팬 게시판', title: positive ? '이 선수가 우리 유니폼을 입고 있다는 게 좋다. 내년에도 기대할게!' : '지금은 경험이 필요할 때. 다음 시즌엔 기회를 잡아주길!', tone: positive ? 'positive' : 'neutral' },
  ];
  const result: SeasonResult = { year: career.year, age: career.player.age, leagueId: career.leagueId, teamId: career.teamId,
    role: career.player.role, stats, overallBefore: before, overallAfter: after, attributeGains,
    teamRecord: { wins, losses, draws, rank }, awards, highlights, news, games, salary: career.salary, injuredGames, championship };
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
  career.hallScore = rounded(career.hallScore + points * (.7 + league.level * .3) + awards.reduce((sum, name) => sum + (name === 'MVP' ? 12 : name === '사이영상' || name === '최우수 투수' ? 10 : name === '리그 우승' ? 3 : 4), 0), 1);
  career.reputation = clamp(Math.round(career.reputation + points * 1.2 + awards.length * 5), 0, 100);
  career.fatigue = clamp(Math.round((career.player.role === 'batter' ? stats.g / league.games : stats.outs / (league.games * 3.5)) * 55 + (career.plan === 'aggressive' ? 17 : career.plan === 'rest' ? -18 : 0)), 0, 95);
  career.health = clamp(100 - Math.round(career.fatigue * .17) - (injuredGames ? 9 : 0), 45, 100);
  career.morale = clamp(Math.round(75 + (winRate - .5) * 40 + awards.length * 4), 35, 100);
  career.contractYears = Math.max(0, career.contractYears - 1);
  career.phase = 'offseason';
  career.offers = createOffers(career, random);
  return career;
}

export function advanceOffseason(input: Career, offerId?: string): Career {
  if (input.phase !== 'offseason') return clone(input);
  const career = clone(input);
  if (career.player.age >= 40) return retireCareer(career);
  const offer = career.offers.find(offer => offer.id === offerId) ?? career.offers[0];
  if (offer) {
    if (offer.teamId !== career.teamId) event(career, `${getTeam(offer.teamId).name}로 이적`, `${getLeague(offer.leagueId).name}에서 ${offer.role}의 기회를 잡았습니다.`, 'transfer');
    career.leagueId = offer.leagueId; career.teamId = offer.teamId;
    career.salary = offer.salary; career.contractYears = offer.years;
  }
  career.player.age++; career.year++; career.season++;
  career.phase = 'ready'; career.offers = [];
  career.health = Math.min(100, career.health + 18); career.fatigue = Math.max(0, career.fatigue - 40);
  return career;
}
export function retireCareer(input: Career): Career {
  if (input.phase === 'retired') return clone(input);
  const career = clone(input), totals = careerTotals(career);
  const hallOfFame = career.hallScore >= HALL_THRESHOLD;
  const tier = hallOfFame ? 'legend' : career.hallScore >= HALL_THRESHOLD * .5 ? 'star' : career.history.length >= 8 ? 'veteran' : 'journey';
  career.phase = 'retired'; career.offers = [];
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
function validStats(value: unknown, role: unknown) {
  if (!isObject(value) || !STAT_KEYS.every(key => finite(value[key], 0, 200000, true))) return false;
  const s = value as unknown as Stats;
  if (s.h > s.ab || s.ab > s.pa || s.hr + s.doubles + s.triples > s.h || s.w > s.g || s.l > s.g || s.sv > s.g || s.er > 10000) return false;
  if (role === 'batter' && (s.pa !== s.ab + s.bb + s.hbp + s.sf || s.so > s.ab)) return false;
  if (role === 'pitcher' && (s.so > s.outs || s.pa !== s.ab + s.bba + s.hbp + s.sf || s.w + s.l + s.sv > s.g)) return false;
  return true;
}
export function validateCareer(input: unknown): Career | null {
  try {
    if (!isObject(input) || input.schemaVersion !== 1 || !isObject(input.player)) return null;
    const p = input.player;
    if (!['batter', 'pitcher'].includes(String(p.role)) || !text(p.name, 1, 16) || !finite(p.number, 0, 99, true) || !finite(p.avatar, 0, 7, true)
      || !text(p.position, 1, 16) || !text(p.hand, 1, 20) || !text(p.nationality, 1, 40) || !text(p.style, 1, 40)
      || !finite(p.age, 18, 50, true) || !finite(p.potential, 45, 100) || !isObject(p.attributes)) return null;
    const attrs = p.role === 'batter' ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
    if (!attrs.every(key => finite((p.attributes as Record<string, unknown>)[key], 1, 100))) return null;
    if (!text(input.id, 1, 100) || !finite(input.seed, 0, 4294967295, true) || !LEAGUE_IDS.includes(input.leagueId as LeagueId)
      || !validTeam(input.teamId, input.leagueId) || !finite(input.year, 2026, 2075, true) || !finite(input.season, 1, 40, true)
      || !['ready', 'offseason', 'retired'].includes(String(input.phase)) || !['balanced', 'aggressive', 'rest'].includes(String(input.plan))) return null;
    if (!Array.isArray(input.training) || input.training.length > 2 || !input.training.every(key => attrs.includes(String(key)))) return null;
    for (const key of ['health', 'fatigue', 'morale', 'reputation']) if (!finite(input[key], 0, 100)) return null;
    if (!finite(input.salary, 0, 10000000) || !finite(input.contractYears, 0, 10, true) || !finite(input.hallScore, 0, 10000)) return null;
    if (!Array.isArray(input.history) || input.history.length > 35 || !Array.isArray(input.events) || input.events.length > 500
      || !Array.isArray(input.awards) || input.awards.length > 500 || !Array.isArray(input.offers) || input.offers.length > 10) return null;
    let previousYear = 2025;
    for (const value of input.history) {
      if (!isObject(value) || !finite(value.year, 2026, 2075, true) || Number(value.year) <= previousYear || !finite(value.age, 18, 50, true)
        || value.role !== p.role || !LEAGUE_IDS.includes(value.leagueId as LeagueId) || !validTeam(value.teamId, value.leagueId) || !validStats(value.stats, p.role)
        || !finite(value.overallBefore, 1, 100) || !finite(value.overallAfter, 1, 100) || !isObject(value.attributeGains)
        || !attrs.every(key => finite((value.attributeGains as Record<string, unknown>)[key], -50, 50)) || !isObject(value.teamRecord)) return null;
      previousYear = Number(value.year);
      if (!['wins', 'losses', 'draws'].every(key => finite((value.teamRecord as Record<string, unknown>)[key], 0, 200, true))
        || !finite(value.teamRecord.rank, 1, teamsForLeague(value.leagueId as LeagueId).length, true)
        || Number(value.teamRecord.wins) + Number(value.teamRecord.losses) + Number(value.teamRecord.draws) !== getLeague(value.leagueId as LeagueId).games
        || !Array.isArray(value.awards) || value.awards.length > 20 || !value.awards.every(item => text(item, 1, 60))
        || !Array.isArray(value.highlights) || value.highlights.length > 20 || !value.highlights.every(item => text(item, 1, 500))
        || !Array.isArray(value.news) || value.news.length > 20 || !value.news.every(item => isObject(item) && text(item.source, 1, 50) && text(item.title, 1, 500) && ['positive', 'neutral', 'negative'].includes(String(item.tone)))
        || !finite(value.salary, 0, 10000000) || !finite(value.injuredGames, 0, 200, true) || typeof value.championship !== 'boolean'
        || !Array.isArray(value.games) || value.games.length !== getLeague(value.leagueId as LeagueId).games) return null;
      const aggregate = emptyStats();
      let wins = 0, losses = 0, draws = 0;
      for (const game of value.games) {
        if (!isObject(game) || !text(game.id, 1, 100) || !text(game.date, 1, 20) || !text(game.headline, 0, 500)
          || !finite(game.number, 1, 200, true) || !validTeam(game.opponentId, value.leagueId) || game.opponentId === value.teamId
          || typeof game.home !== 'boolean' || !finite(game.scoreFor, 0, 150, true) || !finite(game.scoreAgainst, 0, 150, true)
          || !validStats(game.stats, p.role) || !['W', 'L', 'D'].includes(String(game.result))) return null;
        const expected = Number(game.scoreFor) > Number(game.scoreAgainst) ? 'W' : Number(game.scoreFor) < Number(game.scoreAgainst) ? 'L' : 'D';
        if (game.result !== expected || (value.leagueId === 'MLB' && expected === 'D')) return null;
        addStats(aggregate, game.stats as unknown as Stats);
        if (expected === 'W') wins++; else if (expected === 'L') losses++; else draws++;
      }
      if (!STAT_KEYS.every(key => aggregate[key] === (value.stats as unknown as Stats)[key]) || wins !== value.teamRecord.wins || losses !== value.teamRecord.losses || draws !== value.teamRecord.draws) return null;
    }
    if (input.events.some(item => !isObject(item) || !text(item.id, 1, 100) || !finite(item.year, 2026, 2075, true) || !text(item.title, 1, 100) || !text(item.text, 1, 1000) || !['debut', 'milestone', 'award', 'transfer', 'injury', 'retirement', 'development'].includes(String(item.kind)))) return null;
    if (input.awards.some(item => !isObject(item) || !finite(item.year, 2026, 2075, true) || !LEAGUE_IDS.includes(item.leagueId as LeagueId) || !text(item.name, 1, 60))) return null;
    if (input.offers.some(item => !isObject(item) || !text(item.id, 1, 100) || !validTeam(item.teamId, item.leagueId) || !finite(item.salary, 0, 10000000) || !finite(item.years, 1, 10, true) || !text(item.role, 1, 60) || !text(item.description, 1, 500) || typeof item.isCurrent !== 'boolean')) return null;
    if (input.phase === 'offseason' && (!input.history.length || !input.offers.length)) return null;
    if (input.phase === 'retired' && (!isObject(input.retirement) || typeof input.retirement.hallOfFame !== 'boolean' || !text(input.retirement.title, 1, 100)
      || !text(input.retirement.summary, 1, 1000) || !finite(input.retirement.score, 0, 10000) || !['legend', 'star', 'veteran', 'journey'].includes(String(input.retirement.tier)))) return null;
    return clone(input) as unknown as Career;
  } catch { return null; }
}
