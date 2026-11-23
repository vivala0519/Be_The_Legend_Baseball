import { getSchoolOpponent, type AmateurCountry } from './amateur';

export type CollegeBaseballTier = 'standard' | 'competitive' | 'leading';

export interface CollegeAffiliation {
  id: string;
  country: AmateurCountry;
  name: string;
  region: string;
  kind: 'college';
  baseballTier: CollegeBaseballTier;
}

export const COLLEGE_SEASONS = 4;

// Season lengths are simulation settings for the selected teams.
export const COLLEGE_COMPETITIONS = {
  KR: { leagueName: '한국 대학야구', games: 36 },
  JP: { leagueName: '일본 대학야구', games: 36 },
  US: { leagueName: '미국 대학야구', games: 48 },
  TW: { leagueName: '대만 대학야구', games: 36 },
  DO: { leagueName: '도미니카공화국 대학야구', games: 36 },
  VE: { leagueName: '베네수엘라 대학야구', games: 36 },
} satisfies Record<AmateurCountry, { leagueName: string; games: number }>;

function colleges(
  country: AmateurCountry,
  rows: readonly [key: string, name: string, region: string, baseballTier: CollegeBaseballTier][],
): CollegeAffiliation[] {
  return rows.map(([key, name, region, baseballTier]) => ({
    id: `college-${country.toLowerCase()}-${key}`, country, name, region, kind: 'college', baseballTier,
  }));
}

const byCountry: Record<AmateurCountry, readonly CollegeAffiliation[]> = {
  // KUBF U-League standings and national tournaments from 2024 to 2026.
  // https://www.kubf-baseball.com/baseball/rank_team.php
  // https://www.kubf-baseball.com/baseball/rank_team.php?season=2026&group_cd=U23&lig_idx=1387&div_cd=DIV01
  KR: colleges('KR', [
    ['yonsei', '연세대학교', '서울', 'leading'],
    ['korea', '고려대학교', '서울', 'leading'],
    ['dankook', '단국대학교', '충남 천안', 'leading'],
    ['dongguk', '동국대학교', '서울', 'competitive'],
    ['hanyang', '한양대학교 ERICA', '경기 안산', 'leading'],
    ['inha', '인하대학교', '인천', 'leading'],
    ['konkuk', '건국대학교', '서울', 'competitive'],
    ['kyungnam', '경남대학교', '경남 창원', 'competitive'],
    ['kyungsung', '경성대학교', '부산', 'standard'],
    ['kiu', '경일대학교', '경북 경산', 'standard'],
    ['kyunghee', '경희대학교', '경기 용인', 'competitive'],
    ['keimyung', '계명대학교', '대구', 'competitive'],
    ['donga', '동아대학교', '부산', 'leading'],
    ['deu', '동의대학교', '부산', 'competitive'],
    ['snu', '서울대학교', '서울', 'standard'],
    ['scau', '디지털서울문화예술대학교', '서울', 'standard'],
    ['skku', '성균관대학교', '경기 수원', 'competitive'],
    ['songwon', '송원대학교', '광주', 'competitive'],
    ['yeungnam', '영남대학교', '경북 경산', 'competitive'],
    ['woosuk', '우석대학교', '전북 완주', 'standard'],
    ['wonkwang', '원광대학교', '전북 익산', 'competitive'],
    ['u1', '유원대학교', '충북 영동', 'competitive'],
    ['chungang', '중앙대학교', '경기 안성', 'leading'],
    ['chungwoon', '청운대학교', '충남 홍성', 'competitive'],
    ['hanil', '한일장신대학교', '전북 완주', 'leading'],
    ['howon', '호원대학교', '전북 군산', 'standard'],
    ['hongik', '홍익대학교 세종캠퍼스', '세종', 'competitive'],
  ]),
  // Tokyo Big6 results, including the 2025 and 2026 league seasons.
  // https://www.big6.gr.jp/system/prog/event_index.php?e=league&m=pc&s=2025a
  // https://big6.gr.jp/game/league/2026a/2026a_schedule.html
  JP: colleges('JP', [
    ['waseda', '와세다대학교', '도쿄', 'leading'],
    ['keio', '게이오기주쿠대학교', '도쿄', 'leading'],
    ['meiji', '메이지대학교', '도쿄', 'leading'],
    ['hosei', '호세이대학교', '도쿄', 'competitive'],
    ['rikkyo', '릿쿄대학교', '도쿄', 'competitive'],
    ['tokyo', '도쿄대학교', '도쿄', 'standard'],
  ]),
  // NCAA Division I championship history.
  // https://www.ncaa.com/history/baseball/d1
  US: colleges('US', [
    ['vanderbilt', '밴더빌트대학교', '테네시', 'competitive'],
    ['lsu', '루이지애나주립대학교', '루이지애나', 'leading'],
    ['florida', '플로리다대학교', '플로리다', 'competitive'],
    ['texas', '텍사스대학교 오스틴', '텍사스', 'leading'],
    ['stanford', '스탠퍼드대학교', '캘리포니아', 'competitive'],
    ['oregon-state', '오리건주립대학교', '오리건', 'leading'],
  ]),
  // Taiwan UBL Division I standings and finals.
  // https://www.ubl.com.tw/web/_pages/standings/index.php?group=1&type=2&year=113
  // https://www.ssu.org.tw/News/Detail/96cea242-17e7-4f69-b0b3-0f53faef1319
  TW: colleges('TW', [
    ['ntus', '국립대만체육운동대학교', '타이중', 'leading'],
    ['ntsu', '국립체육대학교', '타오위안', 'leading'],
    ['pccu', '중국문화대학교', '타이베이', 'competitive'],
    ['fju', '푸런대학교', '신베이', 'leading'],
    ['knu', '카이난대학교', '타오위안', 'competitive'],
    ['meiho', '메이허과기대학교', '핑둥', 'standard'],
  ]),
  // Dominican university league results and championship history.
  // https://dcnb.gob.do/noticias/dcnb-anuncia-la-cuarta-version-de-la-liga-de-beisbol-universitario/
  // https://dcnb.gob.do/noticias/la-uasd-se-corona-campeon-en-el-beisbol-universitario/
  DO: colleges('DO', [
    ['uasd', '산토도밍고자치대학교', '산토도밍고', 'leading'],
    ['unapec', '아펙대학교', '산토도밍고', 'leading'],
    ['pucmm', '마드레 이 마에스트라 가톨릭대학교', '산티아고', 'competitive'],
    ['utesa', '산티아고기술대학교', '산티아고', 'leading'],
    ['isa', 'ISA대학교', '산티아고', 'standard'],
    ['oym', 'O&M대학교', '산토도밍고', 'competitive'],
  ]),
  // Use a common baseline for these programs because their published results are not comparable.
  // https://revistas.upel.edu.ve/index.php/actividadfisicayciencias/article/download/2433/2638
  // https://poz.unexpo.org/web/index.php/es/extension/deporte/disciplinas
  // https://www.ujgh.edu.ve/
  // https://servicio.bc.uc.edu.ve/homotecia/2023/07-2023.pdf
  VE: colleges('VE', [
    ['ucv', '베네수엘라중앙대학교', '카라카스', 'standard'],
    ['unexpo', '안토니오 호세 데 수크레 공과대학교', '푸에르토오르다스', 'standard'],
    ['ujgh', '호세 그레고리오 에르난데스대학교', '마라카이보', 'standard'],
    ['uc', '카라보보대학교', '발렌시아', 'standard'],
  ]),
};

const additionalScheduleOpponents: Partial<Record<AmateurCountry, readonly CollegeAffiliation[]>> = {
  // Japan University Baseball Federation's 2026 national tournament fields.
  // https://www.jubf.net/system/prog/teams.php?k=all&m=pc&s=2026
  // https://www.jubf.net/system/prog/teams.php?e=jingu&k=all&m=pc&s=2026
  JP: colleges('JP', [
    ['tokyo-nodai-okhotsk', '도쿄농업대학교 홋카이도 오호츠크', '홋카이도', 'competitive'],
    ['sendai', '센다이대학교', '미야기', 'competitive'],
    ['tohoku-fukushi', '도호쿠복지대학교', '미야기', 'leading'],
    ['fuji', '후지대학교', '이와테', 'competitive'],
    ['jobu', '조부대학교', '군마', 'competitive'],
    ['tsukuba', '쓰쿠바대학교', '이바라키', 'competitive'],
    ['asia', '아시아대학교', '도쿄', 'competitive'],
    ['nssu', '일본체육대학교', '가나가와', 'leading'],
    ['chukyo', '주쿄대학교', '아이치', 'leading'],
    ['kansai', '간사이대학교', '오사카', 'leading'],
    ['osaka-commerce', '오사카상업대학교', '오사카', 'leading'],
    ['kyushu-kyoritsu', '규슈교리쓰대학교', '후쿠오카', 'competitive'],
  ]),
  // NCAA Division I teams seeded for the 2026 national tournament.
  // https://www.ncaa.com/news/baseball/article/2026-05-25/2026-ncaa-division-i-baseball-championship-bracket-announced
  US: colleges('US', [
    ['ucla', '캘리포니아대학교 로스앤젤레스', '캘리포니아', 'leading'],
    ['georgia-tech', '조지아공과대학교', '조지아', 'leading'],
    ['georgia', '조지아대학교', '조지아', 'leading'],
    ['auburn', '오번대학교', '앨라배마', 'leading'],
    ['north-carolina', '노스캐롤라이나대학교 채플힐', '노스캐롤라이나', 'leading'],
    ['alabama', '앨라배마대학교', '앨라배마', 'competitive'],
    ['southern-miss', '서던미시시피대학교', '미시시피', 'competitive'],
    ['florida-state', '플로리다주립대학교', '플로리다', 'competitive'],
    ['oregon', '오리건대학교', '오리건', 'competitive'],
    ['texas-am', '텍사스 A&M 대학교', '텍사스', 'competitive'],
  ]),
};

const allColleges = [...Object.values(byCountry).flat(), ...Object.values(additionalScheduleOpponents).flat()];
const byId = new Map(allColleges.map(affiliation => [affiliation.id, affiliation]));

export function getCollegeAffiliations(country: AmateurCountry): readonly CollegeAffiliation[] {
  return byCountry[country];
}

export function getCollegeScheduleOpponents(country: AmateurCountry): readonly CollegeAffiliation[] {
  const opponents = additionalScheduleOpponents[country];
  return opponents ? [...byCountry[country], ...opponents] : byCountry[country];
}

export function getCollegeAffiliation(id: string): CollegeAffiliation | undefined {
  return byId.get(id);
}

export function getCareerAffiliation(id: string) {
  return getCollegeAffiliation(id) ?? getSchoolOpponent(id);
}
