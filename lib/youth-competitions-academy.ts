import type { AmateurAffiliation } from './amateur';
import type { ScheduledCompetition } from './amateur-competitions';

// MLB's Amateur Scouting League fields regional select teams. The game uses
// its academy rosters as teams, with separate exchange games for all three years.
export const DOMINICAN_ACADEMY_COMPETITIONS = [
  { id: 'academy-do-spring-exchange', name: '아카데미 교류리그 전반기', format: 'league', dates: [[3, 7], [5, 1]], opponents: 6, meetings: 2, field: 'academy-region' },
  { id: 'academy-do-asl', name: 'MLB 아마추어 스카우팅 리그 권역전', format: 'league', dates: [[5, 7], [6, 30]], opponents: 4, meetings: 3, field: 'academy-region', maxAge: 18 },
  { id: 'academy-do-asl-finals', name: 'MLB 아마추어 스카우팅 리그 결선', format: 'knockout', dates: [[7, 25], [7, 27]], rounds: 2, field: 'academy-representatives', qualification: { from: 'academy-do-asl', rank: 1 }, maxAge: 18 },
  { id: 'academy-do-fall-exchange', name: '아카데미 교류리그 후반기', format: 'league', dates: [[8, 22], [10, 31]], opponents: 6, meetings: 2 },
] as const satisfies readonly ScheduledCompetition[];

// Regional league play is inspired by the academy competitions in Aragua and
// Carabobo. The partnership showcase is based on the documented 2019 games.
export const VENEZUELAN_ACADEMY_COMPETITIONS = [
  { id: 'academy-ve-regional', name: '베네수엘라 아카데미 권역리그', format: 'league', dates: [[2, 19], [6, 28]], opponents: 6, meetings: 4, field: 'academy-region' },
  { id: 'academy-ve-playoffs', name: '베네수엘라 아카데미 권역 플레이오프', format: 'knockout', dates: [[7, 7], [7, 14]], rounds: 2, qualification: { from: 'academy-ve-regional', rank: 4, sameField: true } },
  { id: 'academy-ve-showcase', name: 'MLB 트레이너 파트너십 쇼케이스', format: 'league', dates: [[8, 5], [8, 7]], opponents: 3, meetings: 1 },
] as const satisfies readonly ScheduledCompetition[];

function mapRegions(groups: Record<string, readonly string[]>) {
  return new Map(Object.entries(groups).flatMap(([zone, regions]) => regions.map(region => [region, zone] as const)));
}

const DOMINICAN_REGIONS = mapRegions({
  북부: ['산티아고', '모카', '라베가', '로마데카브레라', '코투이'],
  동부: ['산페드로데마코리스', '라몬산타나', '바야이베', '보카치카', '게라'],
  남부: ['하이나', '산크리스토발', '바니', '니사오', '야과테', '팔렝케'],
  중부: ['산토도밍고', '산토도밍고노르테', '산토도밍고에스테', '산토도밍고오에스테'],
});

const VENEZUELAN_REGIONS = mapRegions({
  수도권: ['카라카스', '미란다', '로스테케스', '쿠아', '라과이라', '라사바나'],
  중부: ['산디에고', '발렌시아', '마라카이', '카과', '아라과'],
  서부: ['마라카이보', '바르키시메토', '푼토피호'],
  동부: ['푸에르토라크루스', '마르가리타'],
});

export function getAcademyCompetitionRegion(affiliation: AmateurAffiliation): string {
  if (affiliation.country === 'DO') return DOMINICAN_REGIONS.get(affiliation.region) ?? affiliation.region;
  if (affiliation.country === 'VE') return VENEZUELAN_REGIONS.get(affiliation.region) ?? affiliation.region;
  return affiliation.region;
}
