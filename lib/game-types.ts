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
  w: number; l: number; sv: number;
}

export interface GameSummary {
  id: string; number: number; date: string; opponentId: string; home: boolean;
  scoreFor: number; scoreAgainst: number; result: 'W' | 'L' | 'D';
  stats: Stats; headline: string;
}

export interface NewsItem { source: string; title: string; tone: 'positive' | 'neutral' | 'negative' }
export interface SeasonResult {
  year: number; age: number; leagueId: LeagueId; teamId: string; role: PlayerRole;
  stats: Stats; overallBefore: number; overallAfter: number;
  attributeGains: Record<string, number>;
  teamRecord: { wins: number; losses: number; draws: number; rank: number };
  awards: string[]; highlights: string[]; news: NewsItem[]; games: GameSummary[];
  salary: number; injuredGames: number; championship: boolean;
}

export interface CareerEvent {
  id: string; year: number; title: string; text: string;
  kind: 'debut' | 'milestone' | 'award' | 'transfer' | 'injury' | 'retirement' | 'development';
}
export interface Award { year: number; leagueId: LeagueId; name: string }
export interface Offer {
  id: string; leagueId: LeagueId; teamId: string; salary: number; years: number;
  role: string; description: string; isCurrent: boolean;
}

export interface Retirement {
  hallOfFame: boolean; title: string; summary: string; score: number;
  tier: 'legend' | 'star' | 'veteran' | 'journey';
}

export interface Career {
  schemaVersion: 1; id: string; seed: number; player: Player;
  leagueId: LeagueId; teamId: string; year: number; season: number;
  phase: 'ready' | 'offseason' | 'retired'; training: string[]; plan: GamePlan;
  health: number; fatigue: number; morale: number; salary: number;
  contractYears: number; history: SeasonResult[]; events: CareerEvent[];
  awards: Award[]; offers: Offer[]; reputation: number; hallScore: number;
  retirement?: Retirement;
}

export interface CreateCareerInput {
  name: string; number?: number; avatar?: number; role: PlayerRole; position?: string;
  hand?: string; nationality?: string; leagueId: LeagueId; teamId: string;
  style?: string; training?: string[]; seed?: number;
}

export interface StatRates {
  avg: number; obp: number; slg: number; ops: number; era: number; whip: number;
  innings: string; totalBases: number;
}

export type CareerTotals = Stats & StatRates & { seasons: number; championships: number; peakOverall: number };
