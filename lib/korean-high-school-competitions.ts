type MonthDay = readonly [month: number, day: number];

// These dates are the game's recurring calendar, with abbreviated fields and schedules.
export const KOREAN_HIGH_SCHOOL_COMPETITIONS = [
  { id: 'weekend-first', name: '고교야구 주말리그 전반기', format: 'league', start: [3, 7], end: [4, 26] },
  { id: 'emart', name: '신세계 이마트배', format: 'knockout', start: [3, 25], end: [4, 12] },
  { id: 'golden-lion', name: '황금사자기', format: 'knockout', start: [5, 2], end: [5, 16] },
  { id: 'weekend-second', name: '고교야구 주말리그 후반기', format: 'league', start: [5, 23], end: [6, 21] },
  { id: 'blue-dragon', name: '청룡기', format: 'knockout', start: [6, 27], end: [7, 12] },
  { id: 'president', name: '대통령배', format: 'knockout', start: [7, 18], end: [7, 30] },
  { id: 'bonghwang', name: '봉황대기', format: 'knockout', start: [8, 7], end: [8, 28] },
] as const satisfies readonly { id: string; name: string; format: 'league' | 'knockout'; start: MonthDay; end: MonthDay }[];

export type KoreanHighSchoolCompetition = (typeof KOREAN_HIGH_SCHOOL_COMPETITIONS)[number];
export type KoreanHighSchoolCompetitionId = KoreanHighSchoolCompetition['id'];

export const KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS = ['roundOf32', 'roundOf16', 'quarterfinal', 'semifinal', 'final'] as const;
export type KoreanHighSchoolKnockoutRound = (typeof KOREAN_HIGH_SCHOOL_KNOCKOUT_ROUNDS)[number];
