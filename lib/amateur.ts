import type { LeagueId } from "./leagues";
import { JAPAN_AFFILIATIONS } from "./amateur-japan";
import { KOREAN_SCHOOL_SOURCE, KOREAN_SCHOOLS } from "./amateur-korea";
import { TAIWAN_SCHOOL_SOURCE, TAIWAN_SCHOOLS } from "./amateur-taiwan";
import { TEXAS_BASEBALL_SOURCE, TEXAS_BASEBALL_SCHOOLS } from "./amateur-us-texas";
import { getWesternKoreanAliases, getWesternKoreanName } from "./amateur-western-names";

export const AMATEUR_COUNTRY_CODES = ["KR", "JP", "US", "TW", "DO", "VE"] as const;
export type AmateurCountry = (typeof AMATEUR_COUNTRY_CODES)[number];

export interface AmateurAffiliation {
  id: string;
  country: AmateurCountry;
  name: string;
  region: string;
  kind: "school" | "academy";
  sourceUrl: string;
  nativeName?: string;
  searchAliases?: readonly string[];
}

interface AmateurCountryConfig {
  label: string;
  flag: string;
  kind: AmateurAffiliation["kind"];
  startAge: number;
  seasons: number;
  games: number;
  leagueName: string;
  leagueId: LeagueId;
}

// Season lengths and professional destinations are rules of this simulation.
export const AMATEUR_COUNTRIES: Record<AmateurCountry, AmateurCountryConfig> = {
  KR: { label: "대한민국", flag: "🇰🇷", kind: "school", startAge: 17, seasons: 3, games: 32, leagueName: "한국 고교야구", leagueId: "KBO" },
  JP: { label: "일본", flag: "🇯🇵", kind: "school", startAge: 17, seasons: 3, games: 34, leagueName: "일본 고교야구", leagueId: "NPB" },
  US: { label: "미국", flag: "🇺🇸", kind: "school", startAge: 17, seasons: 3, games: 36, leagueName: "미국 고교야구", leagueId: "MLB" },
  TW: { label: "대만", flag: "🇹🇼", kind: "school", startAge: 17, seasons: 3, games: 32, leagueName: "대만 고교야구", leagueId: "CPBL" },
  DO: { label: "도미니카공화국", flag: "🇩🇴", kind: "academy", startAge: 17, seasons: 3, games: 34, leagueName: "도미니카공화국 아카데미 야구", leagueId: "MLB" },
  VE: { label: "베네수엘라", flag: "🇻🇪", kind: "academy", startAge: 17, seasons: 3, games: 34, leagueName: "베네수엘라 아카데미 야구", leagueId: "MLB" },
};

type AffiliationRow = [key: string, name: string, region: string, nativeName?: string];

function affiliations(country: AmateurCountry, sourceUrl: string, rows: AffiliationRow[]): AmateurAffiliation[] {
  const westernCountry = country === "US" || country === "DO" || country === "VE" ? country : null;
  return rows.map(([key, name, region, nativeName]) => ({
    id: `${country.toLowerCase()}-${key}`,
    country,
    name: westernCountry ? getWesternKoreanName(westernCountry, name) : name,
    region,
    kind: AMATEUR_COUNTRIES[country].kind,
    sourceUrl,
    nativeName: westernCountry ? name : nativeName,
    searchAliases: westernCountry ? getWesternKoreanAliases(westernCountry, name) : undefined,
  }));
}

// Selected teams with documented baseball participation. Row keys stay stable across seasons.
const KOREA = affiliations("KR", KOREAN_SCHOOL_SOURCE, KOREAN_SCHOOLS);

const UNITED_STATES = [
  ...affiliations("US", "https://cifss.org/wp-content/uploads/2026/05/Baseball-Division-1-Bracket-5.19.26.pdf", [
    ["harvard-westlake", "Harvard-Westlake School", "캘리포니아"],
    ["orange-lutheran", "Orange Lutheran High School", "캘리포니아"],
    ["corona", "Corona High School", "캘리포니아"],
    ["norco", "Norco High School", "캘리포니아"],
  ]),
  ...affiliations("US", "https://www.uiltexas.org/files/alignments/266ABase.pdf", [
    ["lake-travis", "Lake Travis High School", "텍사스"],
    ["westlake", "Westlake High School", "텍사스"],
    ["southlake-carroll", "Southlake Carroll High School", "텍사스"],
    ["prosper", "Prosper High School", "텍사스"],
  ]),
  ...affiliations("US", "https://www.ghsa.net/congratulations-2026-ghsa-baseball-state-champions", [
    ["etowah", "Etowah High School", "조지아"],
    ["loganville", "Loganville High School", "조지아"],
    ["kell", "Kell High School", "조지아"],
    ["pickens", "Pickens High School", "조지아"],
    ["morgan-county", "Morgan County High School", "조지아"],
    ["gordon-lee", "Gordon Lee High School", "조지아"],
    ["lanier-county", "Lanier County High School", "조지아"],
    ["wesleyan", "Wesleyan School", "조지아"],
  ]),
  ...affiliations("US", TEXAS_BASEBALL_SOURCE, TEXAS_BASEBALL_SCHOOLS),
];

const TAIWAN = affiliations("TW", TAIWAN_SCHOOL_SOURCE, TAIWAN_SCHOOLS);

const DOMINICAN_REPUBLIC = affiliations("DO", "https://www.mlb.com/trainer-partnership/dominican-republic", [
  ["arias-goodman", "Arias & Goodman Academy", "산페드로데마코리스"],
  ["pory-elite", "Pory Elite Baseball Academy", "산크리스토발"],
  ["chapita", "Chapita Academy", "산티아고"],
  ["niche", "Niche Baseball Academy", "산토도밍고노르테"],
  ["brito", "Brito Baseball Academy", "바야이베"],
  ["la-javilla", "Academia La Javilla", "산토도밍고에스테"],
  ["fifo", "Fifo Baseball Academy", "하이나"],
  ["melvin-gomez", "Melvin Gomez Baseball Academy", "모카"],
  ["rhinos", "Rhinos Academy", "보카치카"],
  ["dmon", "D'Mon Baseball Academy", "바니"],
  ["mb-baseball-academy", "MB Baseball Academy", "산티아고"],
  ["paulino-baseball-academy", "Paulino Baseball Academy", "산페드로데마코리스"],
  ["academia-internacional-de-baseball", "Academia Internacional de Baseball", "산티아고"],
  ["ray-baseball-academy", "Ray Baseball Academy", "산토도밍고오에스테"],
  ["chal-baseball-academy", "Chal Baseball Academy", "산페드로데마코리스"],
  ["cacha-baseball-academy", "Cacha Baseball Academy", "산토도밍고"],
  ["amc-academy", "AMC Academy", "야과테"],
  ["de-aza-academy", "De Aza Academy", "코투이"],
  ["encarnacion-development-system", "Encarnación Development System", "산토도밍고에스테"],
  ["quality-baseball-academy", "Quality Baseball Academy", "산토도밍고에스테"],
  ["dominican-prospect-talent", "Dominican Prospect Talent", "산토도밍고노르테"],
  ["j-e-academy", "J&E Academy", "산티아고"],
  ["rafael-furcal-baseball-academy", "Rafael Furcal Baseball Academy", "로마데카브레라"],
  ["academia-fausto-garcia", "Academia Fausto García", "산티아고"],
  ["blue-academy", "Blue Academy", "산티아고"],
  ["lg-baseball-academy", "LG Baseball Academy", "산토도밍고노르테"],
  ["papiro-all-star", "Papiro All-Star", "산토도밍고"],
  ["pla-baseball-academy", "Pla Baseball Academy", "바니"],
  ["los-guerrero-academy", "Los Guerrero Academy", "니사오"],
  ["cg-baseball-academy", "CG Baseball Academy", "보카치카"],
  ["los-tiburones-baseball-academy", "Los Tiburones Baseball Academy", "산페드로데마코리스"],
  ["athletes-premier-international-academy", "Athletes Premier International Academy", "게라"],
  ["aldo-marrero-academy", "Aldo Marrero Academy", "산티아고"],
  ["m-m-academy", "M&M Academy", "산페드로데마코리스"],
  ["born-to-play-baseball-academy", "Born to Play Baseball Academy", "하이나"],
  ["n-n-academy", "N&N Academy", "산토도밍고오에스테"],
  ["amaurys-nina-baseball-academy", "Amaurys Nina Baseball Academy", "산토도밍고에스테"],
  ["nova-baseball-academy", "Nova Baseball Academy", "산크리스토발"],
  ["tite-sport", "Tite Sport", "산티아고"],
  ["academia-carlos-paulino", "Academia Carlos Paulino", "니사오"],
  ["nogae-sports-nation", "Nogae Sports Nation", "산페드로데마코리스"],
  ["top-10-baseball-academy-by-mejia", "Top 10 Baseball Academy by Mejia", "보카치카"],
  ["pimentel-baseball-academy", "Pimentel Baseball Academy", "산토도밍고"],
  ["otro-nivel-baseball-academy", "Otro Nivel Baseball Academy", "산토도밍고에스테"],
  ["marmolejos-baseball-academy", "Marmolejos Baseball Academy", "라베가"],
  ["jaime-ramos-academy", "Jaime Ramos Academy", "산크리스토발"],
  ["la-alianza", "La Alianza", "산토도밍고에스테"],
  ["global-baseball-academy", "Global Baseball Academy", "산페드로데마코리스"],
  ["danilo-sport-enterprise", "Danilo Sport Enterprise", "산토도밍고에스테"],
  ["towers-baseball-academy", "Towers Baseball Academy", "라몬산타나"],
  ["william-valdez-academy", "William Valdez Academy", "산티아고"],
  ["vip-baseball-academy", "VIP Baseball Academy", "팔렝케"],
  ["lluviz-baseball-academy", "Lluviz Baseball Academy", "산크리스토발"],
]);

const VENEZUELA = affiliations("VE", "https://www.mlb.com/trainer-partnership/venezuela", [
  ["bob-abreu", "Bob Abreu Baseball Academy 53", "산디에고"],
  ["escobar", "Academia de Baseball Escobar", "라사바나"],
  ["go-pro", "Go Pro Baseball", "마라카이보"],
  ["david-concepcion", "Academia David Concepción", "카과"],
  ["kpl", "KPL Baseball Academy", "발렌시아"],
  ["pdw", "PDW Academy", "라과이라"],
  ["carlos-guillen", "Academia Carlos Alfonso Guillén", "마라카이"],
  ["future-stars", "Future Stars Academy", "바르키시메토"],
  ["caribes-top-players", "Caribes Top Players", "푸에르토라크루스"],
  ["abar", "Academia ABAR", "카라카스"],
  ["vpa", "VPA", "미란다"],
  ["academia-jose-bellorin", "Academia José Bellorín", "발렌시아"],
  ["prospects-cf", "Prospects CF", "발렌시아"],
  ["galvis-13-baseball-academy", "Galvis 13 Baseball Academy", "푼토피호"],
  ["rh-sports", "RH Sports", "마라카이"],
  ["academia-de-beisbol-edgar-herrera", "Academia de Béisbol Edgar Herrera", "아라과"],
  ["academia-de-besbol-izturis", "Academia de Besbol Iztúris", "바르키시메토"],
  ["all-star-baseball-academy", "All Star Baseball Academy", "마라카이보"],
  ["h3k", "H3K", "발렌시아"],
  ["jackson-melian-baseball-academy", "Jackson Melian Baseball Academy", "푸에르토라크루스"],
  ["sluggers-corporation", "Sluggers Corporation", "푸에르토라크루스"],
  ["occidental-deportiva", "Occidental Deportiva", "마라카이보"],
  ["andres-mujica-baseball-academy", "Andrés Mujica Baseball Academy", "로스테케스"],
  ["ol-baseball", "OL Baseball", "발렌시아"],
  ["academia-santana50-baseball-academy", "Academia Santana50 baseball Academy", "카라카스"],
  ["just-prospect", "Just Prospect", "푸에르토라크루스"],
  ["coorporacion-academia-samuray", "Coorporacion Academia Samuray", "마라카이보"],
  ["academia-robert-perez", "Academia Robert Pérez", "바르키시메토"],
  ["dream-team-2", "Dream Team 2", "푸에르토라크루스"],
  ["aq-sport-agency", "AQ Sport Agency", "마라카이"],
  ["bc-all-star-academy", "BC All Star Academy", "바르키시메토"],
  ["masa-baseball-academy", "Masa Baseball Academy", "카라카스"],
  ["cj-baseball-academy", "CJ Baseball Academy", "마라카이보"],
  ["academia-ds", "Academia DS", "푸에르토라크루스"],
  ["academy-gt", "Academy GT", "카라카스"],
  ["academia-roberto-vahlis", "Academia Roberto Vahlis", "마르가리타"],
  ["bucaneros", "Bucaneros", "마라카이"],
  ["academia-yanez-roldan", "Academia Yanez Roldán", "쿠아"],
]);

const catalog: Record<AmateurCountry, readonly AmateurAffiliation[]> = {
  KR: KOREA,
  JP: JAPAN_AFFILIATIONS,
  US: UNITED_STATES,
  TW: TAIWAN,
  DO: DOMINICAN_REPUBLIC,
  VE: VENEZUELA,
};

const byId = new Map(Object.values(catalog).flat().map(affiliation => [affiliation.id, affiliation]));

export function getAmateurAffiliations(country: AmateurCountry): readonly AmateurAffiliation[] {
  return catalog[country];
}

export function getAmateurAffiliation(id: string): AmateurAffiliation | undefined {
  return byId.get(id);
}
