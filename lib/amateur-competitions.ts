import type { AmateurAffiliation, AmateurCountry } from './amateur';
import { KOREAN_HIGH_SCHOOL_COMPETITIONS } from './korean-high-school-competitions';
import type { KoreanHighSchoolCompetitionId } from './korean-high-school-competitions';
import { JAPAN_SCHOOL_COMPETITIONS, TAIWAN_SCHOOL_COMPETITIONS } from './youth-competitions-asia';
import { DOMINICAN_ACADEMY_COMPETITIONS, VENEZUELAN_ACADEMY_COMPETITIONS } from './youth-competitions-academy';
import { US_SCHOOL_COMPETITIONS } from './youth-competitions-us';

type DateRange = readonly [start: readonly [number, number], end: readonly [number, number]];
type Qualification = { from: string; rank: number; sameField?: true; previousSeason?: true } | { from: string; province: true };

interface ScheduledCompetitionBase {
  id: string;
  name: string;
  dates: DateRange;
  qualification?: Qualification;
  notQualifiedLabel?: string;
  nextCalendarYear?: true;
  schoolYears?: readonly number[];
  maxAge?: number;
  field?: 'local' | 'california-north' | 'japan-prefecture' | 'japan-summer-district' | 'japan-block'
    | 'japan-representatives' | 'japan-block-representatives' | 'academy-region' | 'academy-representatives';
}

export type ScheduledCompetition = ScheduledCompetitionBase & (
  | { format: 'league'; opponents: number; meetings: number; regional?: true; noDraws?: true; title?: true }
  | { format: 'knockout'; rounds: number; finalWins?: 2; seriesWins?: 2; nationalField?: true; advanceOnWin?: true }
);

export const UNIVERSITY_COMPETITIONS = {
  KR: [
    { id: 'college-kusf', name: 'KUSF 대학야구 U-리그', format: 'league', dates: [[3, 25], [6, 4]], opponents: 9, meetings: 1, regional: true },
    { id: 'college-championship-group', name: '전국대학야구선수권대회 조별리그', format: 'league', dates: [[6, 24], [7, 19]], opponents: 4, meetings: 1 },
    { id: 'college-championship', name: '전국대학야구선수권대회', format: 'knockout', dates: [[7, 22], [7, 27]], rounds: 4, qualification: { from: 'college-championship-group', rank: 2 } },
    { id: 'college-presidents', name: '대통령기 전국대학야구대회', format: 'knockout', dates: [[8, 5], [8, 20]], rounds: 4 },
    { id: 'college-kusf-finals', name: 'KUSF 대학야구 U-리그 왕중왕전', format: 'knockout', dates: [[9, 1], [9, 10]], rounds: 4, qualification: { from: 'college-kusf', rank: 5 } },
    { id: 'college-national-sports', name: '전국체육대회 대학부', format: 'knockout', dates: [[10, 16], [10, 22]], rounds: 3, qualification: { from: 'college-kusf', province: true }, notQualifiedLabel: '시·도 대표 선발 탈락' },
  ],
  JP: [
    { id: 'college-big6-spring', name: '도쿄 6대학 야구 봄 리그', format: 'league', dates: [[4, 10], [6, 2]], opponents: 5, meetings: 2, title: true },
    { id: 'college-japan-championship', name: '전일본 대학야구 선수권대회', format: 'knockout', dates: [[6, 8], [6, 14]], rounds: 3, nationalField: true, qualification: { from: 'college-big6-spring', rank: 1 } },
    { id: 'college-big6-fall', name: '도쿄 6대학 야구 가을 리그', format: 'league', dates: [[9, 12], [11, 3]], opponents: 5, meetings: 2, title: true },
    { id: 'college-meiji-jingu', name: '메이지진구 야구대회 대학부', format: 'knockout', dates: [[11, 13], [11, 23]], rounds: 3, nationalField: true, qualification: { from: 'college-big6-fall', rank: 1 } },
  ],
  TW: [
    { id: 'college-ubl', name: 'UBL 대학야구리그 공개 1부', format: 'league', dates: [[12, 1], [12, 24]], opponents: 5, meetings: 3, noDraws: true },
    { id: 'college-ubl-second', name: 'UBL 대학야구리그 2차 리그', format: 'league', dates: [[1, 4], [1, 17]], nextCalendarYear: true, opponents: 3, meetings: 2, noDraws: true, qualification: { from: 'college-ubl', rank: 4, sameField: true } },
    { id: 'college-ubl-finals', name: 'UBL 대학야구리그 결선', format: 'knockout', dates: [[1, 23], [1, 25]], nextCalendarYear: true, rounds: 2, qualification: { from: 'college-ubl-second', rank: 4, sameField: true } },
  ],
  US: [
    { id: 'college-ncaa', name: 'NCAA 디비전 I 정규시즌', format: 'league', dates: [[2, 13], [5, 23]], opponents: 15, meetings: 3, noDraws: true },
    { id: 'college-ncaa-regionals', name: 'NCAA 리저널', format: 'knockout', dates: [[5, 29], [6, 1]], rounds: 2, advanceOnWin: true, qualification: { from: 'college-ncaa', rank: 10, sameField: true } },
    { id: 'college-ncaa-super', name: 'NCAA 슈퍼 리저널', format: 'knockout', dates: [[6, 5], [6, 8]], rounds: 1, finalWins: 2, advanceOnWin: true, qualification: { from: 'college-ncaa-regionals', rank: 1 } },
    { id: 'college-ncaa-cws', name: '남자 대학 월드시리즈 (MCWS)', format: 'knockout', dates: [[6, 12], [6, 25]], rounds: 3, finalWins: 2, qualification: { from: 'college-ncaa-super', rank: 1 } },
  ],
  DO: [
    { id: 'college-lbu', name: '대학야구리그 코파 반레세르바스', format: 'league', dates: [[9, 5], [10, 24]], opponents: 5, meetings: 2 },
    { id: 'college-lbu-playoffs', name: '코파 반레세르바스 플레이오프', format: 'knockout', dates: [[11, 1], [11, 15]], rounds: 2, finalWins: 2, qualification: { from: 'college-lbu', rank: 4, sameField: true } },
  ],
  VE: [
    { id: 'college-ve-league', name: '베네수엘라 대학 교류리그', format: 'league', dates: [[9, 5], [10, 25]], opponents: 3, meetings: 4 },
    { id: 'college-juvineu', name: '전국 대학체육대회 야구 (JUVINEU)', format: 'knockout', dates: [[11, 7], [11, 15]], rounds: 2 },
  ],
} as const satisfies Record<AmateurCountry, readonly ScheduledCompetition[]>;

const SCHOOL_COMPETITIONS = {
  JP: JAPAN_SCHOOL_COMPETITIONS,
  TW: TAIWAN_SCHOOL_COMPETITIONS,
  DO: DOMINICAN_ACADEMY_COMPETITIONS,
  VE: VENEZUELAN_ACADEMY_COMPETITIONS,
} as const;
type InternationalSchoolId = (typeof SCHOOL_COMPETITIONS)[keyof typeof SCHOOL_COMPETITIONS][number]['id'];
type UnitedStatesSchoolId = (typeof US_SCHOOL_COMPETITIONS)[keyof typeof US_SCHOOL_COMPETITIONS][number]['id'];
type CollegeCompetitionId = (typeof UNIVERSITY_COMPETITIONS)[AmateurCountry][number]['id'];
export type AmateurCompetitionId = KoreanHighSchoolCompetitionId | CollegeCompetitionId | InternationalSchoolId | UnitedStatesSchoolId;
export type ScheduledCompetitionDefinition = ScheduledCompetition & { id: AmateurCompetitionId };

export function getCollegeCompetitions(country: AmateurCountry): readonly ScheduledCompetitionDefinition[] {
  return UNIVERSITY_COMPETITIONS[country];
}

export function getSchoolCompetitions(affiliation: AmateurAffiliation, schoolYear: number, age: number): readonly ScheduledCompetitionDefinition[] {
  if (affiliation.country === 'KR') return [];
  const events: readonly ScheduledCompetitionDefinition[] = affiliation.country === 'US'
    ? US_SCHOOL_COMPETITIONS[affiliation.region as keyof typeof US_SCHOOL_COMPETITIONS]
    : SCHOOL_COMPETITIONS[affiliation.country];
  return events.filter(event => (!event.schoolYears || event.schoolYears.includes(schoolYear)) && (!event.maxAge || age <= event.maxAge));
}

const byId = new Map<string, {
  id: string;
  name: string;
  format: ScheduledCompetition['format'];
  notQualifiedLabel?: string;
  advanceOnWin?: true;
}>(
  [
    ...KOREAN_HIGH_SCHOOL_COMPETITIONS,
    ...Object.values(UNIVERSITY_COMPETITIONS).flat(),
    ...Object.values(SCHOOL_COMPETITIONS).flat(),
    ...Object.values(US_SCHOOL_COMPETITIONS).flat(),
  ].map(event => [event.id, event]),
);

export function getAmateurCompetition(id: string) {
  return byId.get(id);
}
