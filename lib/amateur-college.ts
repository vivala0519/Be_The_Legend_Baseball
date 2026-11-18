import { getAmateurAffiliation, type AmateurCountry } from './amateur';

export interface CollegeAffiliation {
  id: string;
  country: AmateurCountry;
  name: string;
  region: string;
  kind: 'college';
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

function colleges(country: AmateurCountry, rows: readonly [key: string, name: string, region: string][]): CollegeAffiliation[] {
  return rows.map(([key, name, region]) => ({ id: `college-${country.toLowerCase()}-${key}`, country, name, region, kind: 'college' }));
}

const byCountry: Record<AmateurCountry, readonly CollegeAffiliation[]> = {
  // https://www.kubf-baseball.com/
  KR: colleges('KR', [
    ['yonsei', '연세대학교', '서울'],
    ['korea', '고려대학교', '서울'],
    ['dankook', '단국대학교', '충남 천안'],
    ['dongguk', '동국대학교', '서울'],
    ['hanyang', '한양대학교', '서울'],
    ['inha', '인하대학교', '인천'],
  ]),
  // https://big6.gr.jp/big6/
  JP: colleges('JP', [
    ['waseda', '와세다대학교', '도쿄'],
    ['keio', '게이오기주쿠대학교', '도쿄'],
    ['meiji', '메이지대학교', '도쿄'],
    ['hosei', '호세이대학교', '도쿄'],
    ['rikkyo', '릿쿄대학교', '도쿄'],
    ['tokyo', '도쿄대학교', '도쿄'],
  ]),
  // https://www.ncaa.com/news/baseball/article/2025-06-22/programs-most-mens-college-world-series-titles
  US: colleges('US', [
    ['vanderbilt', '밴더빌트대학교', '테네시'],
    ['lsu', '루이지애나주립대학교', '루이지애나'],
    ['florida', '플로리다대학교', '플로리다'],
    ['texas', '텍사스대학교 오스틴', '텍사스'],
    ['stanford', '스탠퍼드대학교', '캘리포니아'],
    ['oregon-state', '오리건주립대학교', '오리건'],
  ]),
  // https://ubl.com.tw/upload/download/20240524043257_0.pdf
  TW: colleges('TW', [
    ['ntus', '국립대만체육운동대학교', '타이중'],
    ['ntsu', '국립체육대학교', '타오위안'],
    ['pccu', '중국문화대학교', '타이베이'],
    ['fju', '푸런대학교', '신베이'],
    ['knu', '카이난대학교', '타오위안'],
    ['meiho', '메이허과기대학교', '핑둥'],
  ]),
  // https://dcnb.gob.do/noticias/dcnb-anuncia-la-cuarta-version-de-la-liga-de-beisbol-universitario/
  DO: colleges('DO', [
    ['uasd', '산토도밍고자치대학교', '산토도밍고'],
    ['unapec', '아펙대학교', '산토도밍고'],
    ['pucmm', '마드레 이 마에스트라 가톨릭대학교', '산티아고'],
    ['utesa', '산티아고기술대학교', '산티아고'],
    ['isa', 'ISA대학교', '산티아고'],
    ['oym', 'O&M대학교', '산토도밍고'],
  ]),
  // The game groups these universities' baseball programs into one competition.
  // https://revistas.upel.edu.ve/index.php/actividadfisicayciencias/article/download/2433/2638
  // https://poz.unexpo.org/web/index.php/es/extension/deporte/disciplinas
  // https://www.ujgh.edu.ve/
  // https://servicio.bc.uc.edu.ve/homotecia/2023/07-2023.pdf
  VE: colleges('VE', [
    ['ucv', '베네수엘라중앙대학교', '카라카스'],
    ['unexpo', '안토니오 호세 데 수크레 공과대학교', '푸에르토오르다스'],
    ['ujgh', '호세 그레고리오 에르난데스대학교', '마라카이보'],
    ['uc', '카라보보대학교', '발렌시아'],
  ]),
};

const byId = new Map(Object.values(byCountry).flat().map(affiliation => [affiliation.id, affiliation]));

export function getCollegeAffiliations(country: AmateurCountry): readonly CollegeAffiliation[] {
  return byCountry[country];
}

export function getCollegeAffiliation(id: string): CollegeAffiliation | undefined {
  return byId.get(id);
}

export function getCareerAffiliation(id: string) {
  return getCollegeAffiliation(id) ?? getAmateurAffiliation(id);
}
