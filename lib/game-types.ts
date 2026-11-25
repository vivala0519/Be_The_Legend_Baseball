import type { AmateurCompetitionId } from './amateur-competitions';
import type { KoreanHighSchoolKnockoutRound } from './korean-high-school-competitions';
import type { PostseasonBracket, PostseasonStanding } from './pro-postseason';

export type LeagueId = 'KBO' | 'NPB' | 'MLB' | 'CPBL';
export type PlayerRole = 'batter' | 'pitcher';
export type GamePlan = 'balanced' | 'aggressive' | 'rest';
export type Attributes = Record<string, number>;

export interface Player {
  name: string; number: number; avatar: number; role: PlayerRole; position: string;
  hand: string; nationality: string; age: number; attributes: Attributes;
  potential: number; style: string;
}

export interface Stats {
  g: number; pa: number; ab: number; h: number; doubles: number; triples: number;
  hr: number; r: number; rbi: number; bb: number; hbp: number; sf: number;
  sb: number; so: number; outs: number; er: number; ha: number; bba: number;
  w: number; l: number; sv: number; hld?: number;
}

export interface GameSummary {
  id: string; number: number; date: string; opponentId: string; home: boolean;
  scoreFor: number; scoreAgainst: number; result: 'W' | 'L' | 'D';
  stats: Stats; headline: string;
  competitionId?: AmateurCompetitionId;
}

export interface PostseasonPlayerGame extends GameSummary {
  seriesId: string;
  gameNumber: number;
}

export type RegularSeasonMatchup = [wins: number, losses: number, draws: number, runsFor: number, runsAgainst: number];

export interface ProPostseasonResult extends PostseasonBracket {
  standings: Omit<PostseasonStanding, 'headToHead'>[];
  matchups: RegularSeasonMatchup[];
  qualified: boolean;
  stats: Stats;
  games: PostseasonPlayerGame[];
  revealedSeriesCount?: number;
}

export interface NewsItem { source: string; title: string; tone: 'positive' | 'neutral' | 'negative' }
export interface SeasonResult {
  year: number; age: number; leagueId: LeagueId; teamId: string; role: PlayerRole;
  stats: Stats; overallBefore: number; overallAfter: number;
  attributeGains: Record<string, number>;
  teamRecord: { wins: number; losses: number; draws: number; rank: number };
  awards: string[]; highlights: string[]; news: NewsItem[]; games: GameSummary[];
  salary: number; injuredGames: number; championship: boolean;
  postseason?: ProPostseasonResult;
}

export type DraftResult =
  | { status: 'undrafted'; leagueId: LeagueId }
  | { status: 'drafted'; leagueId: LeagueId; teamId: string; round: number; pick: number; overallPick: number };

export type CollegeAdmission =
  | { affiliationId: string; status: 'accepted' }
  | { affiliationId: string; status: 'rejected'; reason: 'position' | 'performance' };

export type AmateurCompetitionOutcome =
  | { kind: 'ranked'; rank: number }
  | { kind: 'champion' }
  | { kind: 'advanced' }
  | { kind: 'eliminated'; round: KoreanHighSchoolKnockoutRound }
  | { kind: 'notQualified' };

export interface AmateurCompetitionResult {
  id: AmateurCompetitionId;
  stats: Stats;
  teamRecord: SeasonResult['teamRecord'];
  outcome: AmateurCompetitionOutcome;
}

export type AmateurSeasonResult = Omit<SeasonResult, 'leagueId' | 'teamId' | 'salary' | 'postseason'> & {
  affiliationId: string;
  draft?: DraftResult;
  admissions?: CollegeAdmission[];
  competitions?: AmateurCompetitionResult[];
};

export interface AmateurCareer {
  affiliationId: string;
  status: 'active' | 'completed' | 'retired';
  college?: { affiliationId: string; year: number };
  history: AmateurSeasonResult[];
}

export interface CareerEvent {
  id: string; year: number; title: string; text: string;
  kind: 'debut' | 'milestone' | 'award' | 'transfer' | 'injury' | 'retirement' | 'development';
}
export const REGULAR_SEASON_CHAMPIONSHIP_AWARD = '정규시즌 우승';
export const POSTSEASON_CHAMPIONSHIP_AWARD = '포스트시즌 우승';
export function isPostseasonChampionshipAward(name: string): boolean {
  return name === POSTSEASON_CHAMPIONSHIP_AWARD || name === '리그 우승';
}
export interface Award { year: number; leagueId: LeagueId; name: string }
export interface Offer {
  id: string; leagueId: LeagueId; teamId: string; salary: number; years: number;
  role: string; description: string; isCurrent: boolean;
}

export interface Retirement {
  hallOfFame: boolean; title: string; summary: string; score: number;
  tier: 'legend' | 'star' | 'veteran' | 'journey';
  reason?: 'voluntary';
}

interface CareerState {
  schemaVersion: 1; id: string; seed: number; player: Player;
  year: number; season: number;
  phase: 'ready' | 'offseason' | 'retired'; training: string[]; plan: GamePlan;
  health: number; fatigue: number; morale: number; salary: number;
  contractYears: number; history: SeasonResult[]; events: CareerEvent[];
  awards: Award[]; offers: Offer[]; reputation: number; hallScore: number;
  retirement?: Retirement;
}

export type ActiveAmateurCareer = CareerState & {
  phase: 'ready' | 'offseason';
  leagueId: null; teamId: null; amateur: AmateurCareer & { status: 'active' };
};

export type RetiredAmateurCareer = CareerState & {
  phase: 'retired'; retirement: Retirement;
  leagueId: null; teamId: null; amateur: AmateurCareer & { status: 'retired' };
};

export type TradeResult = { status: 'approved'; teamId: string } | { status: 'rejected' };

export type ProfessionalCareer = CareerState & {
  leagueId: LeagueId; teamId: string; amateur?: AmateurCareer & { status: 'completed' };
  pendingTrade?: TradeResult;
  tradeRequestRejected?: true;
};

export type Career = ActiveAmateurCareer | RetiredAmateurCareer | ProfessionalCareer;

interface CreatePlayerInput {
  name: string; number?: number; avatar?: number; role: PlayerRole; position?: string;
  hand?: string; nationality?: string;
  style?: string; training?: string[]; seed?: number;
}

export type CreateCareerInput = CreatePlayerInput & (
  | { amateurAffiliationId: string; leagueId?: never; teamId?: never }
  | { amateurAffiliationId?: never; leagueId: LeagueId; teamId: string }
);

export interface StatRates {
  avg: number; obp: number; slg: number; ops: number; era: number; whip: number;
  innings: string; totalBases: number; winPct: number;
}

export type CareerTotals = Stats & StatRates & { seasons: number; championships: number; peakOverall: number };
