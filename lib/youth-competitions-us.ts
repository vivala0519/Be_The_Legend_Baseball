import type { AmateurAffiliation } from './amateur';
import type { ScheduledCompetition } from './amateur-competitions';

// Recurring game dates and compressed fields based on the 2026–27 association calendars.
export const US_SCHOOL_COMPETITIONS = {
  // https://www.uiltexas.org/baseball
  텍사스: [
    { id: 'school-tx-uil-district', name: '텍사스 UIL 지구 정규리그', format: 'league', dates: [[2, 22], [5, 4]], opponents: 8, meetings: 3, noDraws: true, field: 'local' },
    { id: 'school-tx-uil-playoffs', name: '텍사스 UIL 주 챔피언십', format: 'knockout', dates: [[5, 8], [6, 12]], rounds: 5, seriesWins: 2, field: 'local', qualification: { from: 'school-tx-uil-district', rank: 4 } },
  ],
  // https://www.ghsa.net/beginning-ending-dates-2026-2027
  조지아: [
    { id: 'school-ga-ghsa-season', name: '조지아 GHSA 정규시즌', format: 'league', dates: [[2, 15], [4, 29]], opponents: 7, meetings: 4, noDraws: true, field: 'local' },
    { id: 'school-ga-ghsa-playoffs', name: '조지아 GHSA 주 챔피언십', format: 'knockout', dates: [[5, 3], [5, 31]], rounds: 3, seriesWins: 2, field: 'local', qualification: { from: 'school-ga-ghsa-season', rank: 6 } },
  ],
  // https://cifss.org/sports/baseball/
  캘리포니아: [
    { id: 'school-ca-cif-season', name: '캘리포니아 CIF 남부 섹션 정규리그', format: 'league', dates: [[2, 8], [4, 29]], opponents: 8, meetings: 3, noDraws: true, field: 'local' },
    { id: 'school-ca-cif-section', name: 'CIF 남부 섹션 챔피언십', format: 'knockout', dates: [[5, 4], [5, 22]], rounds: 3, field: 'local', qualification: { from: 'school-ca-cif-season', rank: 6 } },
    { id: 'school-ca-cif-regional', name: 'CIF 서던 캘리포니아 권역대회', format: 'knockout', dates: [[5, 25], [5, 29]], rounds: 3, field: 'local', qualification: { from: 'school-ca-cif-section', rank: 2 } },
    { id: 'school-ca-cif-state', name: '캘리포니아 CIF 주 챔피언십', format: 'knockout', dates: [[6, 4], [6, 5]], rounds: 1, field: 'california-north', qualification: { from: 'school-ca-cif-regional', rank: 1 } },
  ],
} as const satisfies Record<string, readonly ScheduledCompetition[]>;

function californiaSchool(id: string, name: string, nativeName: string, sourceUrl: string): AmateurAffiliation {
  return { id: `opponent-us-ca-${id}`, country: 'US', kind: 'school', region: '캘리포니아', name, nativeName, sourceUrl };
}

const southernSectionBracket = 'https://cifss.org/wp-content/uploads/2026/05/Baseball-Division-1-Bracket-5.30.26.pdf';
const southernSchools = [
  ['maranatha', '마라나타 고등학교', 'Maranatha High School'],
  ['notre-dame-sherman-oaks', '노터데임 고등학교 (셔먼오크스)', 'Notre Dame High School (Sherman Oaks)'],
  ['ayala', '아얄라 고등학교', 'Ruben S. Ayala High School'],
  ['etiwanda', '에티완다 고등학교', 'Etiwanda High School'],
  ['santiago-corona', '산티아고 고등학교 (코로나)', 'Santiago High School (Corona)'],
  ['sierra-canyon', '시에라캐니언 학교', 'Sierra Canyon School'],
  ['oaks-christian', '오크스크리스천 학교', 'Oaks Christian School'],
  ['st-john-bosco', '세인트존보스코 고등학교', 'St. John Bosco High School'],
  ['cypress', '사이프러스 고등학교', 'Cypress High School'],
  ['temecula-valley', '테메큘라밸리 고등학교', 'Temecula Valley High School'],
  ['huntington-beach', '헌팅턴비치 고등학교', 'Huntington Beach High School'],
  ['la-mirada', '라미라다 고등학교', 'La Mirada High School'],
] as const;

export const CALIFORNIA_SCHOOL_OPPONENTS: readonly AmateurAffiliation[] = southernSchools.map(
  ([id, name, nativeName]) => californiaSchool(id, name, nativeName, southernSectionBracket),
);

const northernRegionalFinal = 'https://www.nfhsnetwork.com/events/cif/gam7395573d9f';
export const CALIFORNIA_STATE_FINAL_OPPONENTS: readonly AmateurAffiliation[] = [
  californiaSchool('valley-christian', '밸리크리스천 고등학교', 'Valley Christian High School (San Jose)', northernRegionalFinal),
  californiaSchool('elk-grove', '엘크그로브 고등학교', 'Elk Grove High School', northernRegionalFinal),
];
