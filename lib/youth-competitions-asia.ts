import type { ScheduledCompetition } from './amateur-competitions';

const JAPAN_SCHOOL_BLOCKS = [
  ['홋카이도', ['홋카이도']],
  ['도호쿠', ['아오모리', '이와테', '미야기', '아키타', '야마가타', '후쿠시마']],
  ['간토', ['이바라키', '도치기', '군마', '사이타마', '지바', '가나가와', '야마나시']],
  ['도쿄', ['도쿄']],
  ['호쿠신에쓰', ['니가타', '나가노', '도야마', '이시카와', '후쿠이']],
  ['도카이', ['시즈오카', '아이치', '기후', '미에']],
  ['긴키', ['시가', '교토', '오사카', '효고', '나라', '와카야마']],
  ['주고쿠', ['돗토리', '시마네', '오카야마', '히로시마', '야마구치']],
  ['시코쿠', ['가가와', '도쿠시마', '에히메', '고치']],
  ['규슈', ['후쿠오카', '사가', '나가사키', '구마모토', '오이타', '미야자키', '가고시마', '오키나와']],
] as const;

const japanBlockByPrefecture = new Map<string, string>(
  JAPAN_SCHOOL_BLOCKS.flatMap(([block, prefectures]) => prefectures.map(prefecture => [prefecture, block] as const)),
);

export function getJapanSchoolBlock(region: string): string {
  return japanBlockByPrefecture.get(region) ?? region;
}

export const JAPAN_SCHOOL_COMPETITIONS = [
  {
    id: 'school-jp-senbatsu', name: '봄 고시엔 (센바쓰)', format: 'knockout', dates: [[3, 19], [3, 31]],
    rounds: 5, field: 'japan-representatives', schoolYears: [2, 3],
    qualification: { from: 'school-jp-autumn-block', rank: 2, previousSeason: true }, notQualifiedLabel: '전년도 추계 성적 기준 미선발',
  },
  {
    id: 'school-jp-spring-games', name: '춘계 고교 교류전', format: 'league', dates: [[4, 5], [5, 17]],
    opponents: 8, meetings: 2, field: 'japan-prefecture',
  },
  {
    id: 'school-jp-spring-prefecture', name: '춘계 도도부현 대회', format: 'knockout', dates: [[5, 18], [6, 12]],
    rounds: 4, field: 'japan-prefecture',
  },
  {
    id: 'school-jp-summer-district', name: '여름 고시엔 지방대회', format: 'knockout', dates: [[6, 20], [7, 30]],
    rounds: 4, field: 'japan-summer-district', advanceOnWin: true,
  },
  {
    id: 'school-jp-summer-koshien', name: '여름 고시엔 (전국고교야구선수권)', format: 'knockout', dates: [[8, 5], [8, 22]],
    rounds: 5, field: 'japan-representatives',
    qualification: { from: 'school-jp-summer-district', rank: 1 }, notQualifiedLabel: '지방대회에서 본선 진출 실패',
  },
  {
    id: 'school-jp-autumn-prefecture', name: '추계 도도부현 대회', format: 'knockout', dates: [[9, 5], [10, 7]],
    rounds: 4, field: 'japan-prefecture', schoolYears: [1, 2],
  },
  {
    id: 'school-jp-autumn-block', name: '추계 권역대회', format: 'knockout', dates: [[10, 10], [11, 9]],
    rounds: 3, field: 'japan-block', schoolYears: [1, 2],
    qualification: { from: 'school-jp-autumn-prefecture', rank: 2 }, notQualifiedLabel: '도도부현 대회 성적 기준 미진출',
  },
  {
    id: 'school-jp-meiji', name: '메이지진구 야구대회 고교부', format: 'knockout', dates: [[11, 19], [11, 24]],
    rounds: 3, field: 'japan-block-representatives', schoolYears: [1, 2],
    qualification: { from: 'school-jp-autumn-block', rank: 1 }, notQualifiedLabel: '추계 권역대회 성적 기준 미진출',
  },
] as const satisfies readonly ScheduledCompetition[];

export const TAIWAN_SCHOOL_COMPETITIONS = [
  {
    id: 'school-tw-wood-bat-first', name: '전국 고교 목제배트 리그 1차', format: 'league', dates: [[1, 2], [1, 6]],
    opponents: 5, meetings: 1, noDraws: true,
  },
  {
    id: 'school-tw-wood-bat-second', name: '전국 고교 목제배트 리그 2차', format: 'league', dates: [[2, 17], [2, 20]],
    opponents: 3, meetings: 1, noDraws: true, qualification: { from: 'school-tw-wood-bat-first', rank: 5 },
  },
  {
    id: 'school-tw-wood-bat-third', name: '전국 고교 목제배트 리그 3차', format: 'league', dates: [[2, 21], [2, 23]],
    opponents: 2, meetings: 1, noDraws: true, qualification: { from: 'school-tw-wood-bat-second', rank: 3 },
  },
  {
    id: 'school-tw-wood-bat-finals', name: '전국 고교 목제배트 리그 결선', format: 'knockout', dates: [[2, 25], [2, 28]],
    rounds: 4, qualification: { from: 'school-tw-wood-bat-third', rank: 2 },
  },
  {
    id: 'school-tw-inter-school', name: '대만 고교 교류전', format: 'league', dates: [[3, 7], [8, 30]],
    opponents: 6, meetings: 2, field: 'local', noDraws: true,
  },
  {
    id: 'school-tw-taoyuan', name: '타오위안컵 고교부', format: 'knockout', dates: [[9, 19], [9, 24]],
    rounds: 3, qualification: { from: 'school-tw-inter-school', rank: 4 }, notQualifiedLabel: '초청 명단 미포함',
  },
  {
    id: 'school-tw-black-panther', name: '중신배 흑표기 전국고교야구대회', format: 'knockout', dates: [[10, 25], [11, 29]],
    rounds: 5,
  },
] as const satisfies readonly ScheduledCompetition[];
