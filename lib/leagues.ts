export type LeagueId = "KBO" | "NPB" | "MLB" | "CPBL";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  color: string;
  leagueId: LeagueId;
}

export interface League {
  id: LeagueId;
  name: string;
  country: string;
  flag: string;
  games: number;
  level: number;
  color: string;
  description: string;
}

/** level is an original game-balance coefficient, not an official league rating. */
export const LEAGUES: League[] = [
  { id: "KBO", name: "KBO 리그", country: "대한민국", flag: "🇰🇷", games: 144, level: 0.78, color: "#183F70", description: "뜨거운 응원 속에서 시작하는 나의 야구 인생" },
  { id: "NPB", name: "일본 프로야구", country: "일본", flag: "🇯🇵", games: 143, level: 0.88, color: "#B4343D", description: "정교함과 집중력으로 새로운 무대에 도전" },
  { id: "MLB", name: "메이저리그", country: "미국 · 캐나다", flag: "🇺🇸", games: 162, level: 1, color: "#214D78", description: "가장 큰 무대에서 써 내려가는 새로운 역사" },
  { id: "CPBL", name: "대만 프로야구", country: "대만", flag: "🇹🇼", games: 120, level: 0.68, color: "#26836A", description: "새로운 기회와 가능성이 기다리는 다이아몬드" },
];

const team = (leagueId: LeagueId, key: string, name: string, shortName: string, city: string, color: string): Team => ({
  id: `${leagueId.toLowerCase()}-${key}`, leagueId, name, shortName, city, color,
});

/** Team names are factual identifiers; the UI uses original text monograms, not official logos. */
export const TEAMS: Team[] = [
  team("KBO", "lg", "LG 트윈스", "LG", "서울", "#C30452"),
  team("KBO", "doosan", "두산 베어스", "두산", "서울", "#17233E"),
  team("KBO", "kiwoom", "키움 히어로즈", "키움", "서울", "#7D1737"),
  team("KBO", "ssg", "SSG 랜더스", "SSG", "인천", "#CE0E2D"),
  team("KBO", "kt", "KT 위즈", "KT", "수원", "#333333"),
  team("KBO", "hanwha", "한화 이글스", "한화", "대전", "#EF6B25"),
  team("KBO", "samsung", "삼성 라이온즈", "삼성", "대구", "#1266B0"),
  team("KBO", "kia", "KIA 타이거즈", "KIA", "광주", "#EA2436"),
  team("KBO", "lotte", "롯데 자이언츠", "롯데", "부산", "#146C87"),
  team("KBO", "nc", "NC 다이노스", "NC", "창원", "#2A4971"),

  team("NPB", "hanshin", "한신 타이거스", "한신", "니시노미야", "#C99E19"),
  team("NPB", "yomiuri", "요미우리 자이언츠", "요미우리", "도쿄", "#DB7023"),
  team("NPB", "dena", "요코하마 DeNA 베이스타스", "DeNA", "요코하마", "#1683CB"),
  team("NPB", "hiroshima", "히로시마 도요 카프", "히로시마", "히로시마", "#CB2431"),
  team("NPB", "yakult", "도쿄 야쿠르트 스왈로스", "야쿠르트", "도쿄", "#327C64"),
  team("NPB", "chunichi", "주니치 드래건스", "주니치", "나고야", "#1E5B9E"),
  team("NPB", "softbank", "후쿠오카 소프트뱅크 호크스", "소프트뱅크", "후쿠오카", "#C89A15"),
  team("NPB", "nipponham", "홋카이도 닛폰햄 파이터스", "닛폰햄", "기타히로시마", "#137BC2"),
  team("NPB", "orix", "오릭스 버펄로스", "오릭스", "오사카", "#31415C"),
  team("NPB", "rakuten", "도호쿠 라쿠텐 골든이글스", "라쿠텐", "센다이", "#8F283F"),
  team("NPB", "seibu", "사이타마 세이부 라이온스", "세이부", "도코로자와", "#244C70"),
  team("NPB", "lotte", "지바 롯데 마린스", "지바 롯데", "지바", "#454A50"),

  team("MLB", "lad", "로스앤젤레스 다저스", "LAD", "로스앤젤레스", "#1767B2"),
  team("MLB", "nyy", "뉴욕 양키스", "NYY", "뉴욕", "#19324B"),
  team("MLB", "nym", "뉴욕 메츠", "NYM", "뉴욕", "#1C63A2"),
  team("MLB", "bos", "보스턴 레드삭스", "BOS", "보스턴", "#B42B38"),
  team("MLB", "bal", "볼티모어 오리올스", "BAL", "볼티모어", "#D0642C"),
  team("MLB", "tb", "탬파베이 레이스", "TB", "세인트피터즈버그", "#2F5276"),
  team("MLB", "tor", "토론토 블루제이스", "TOR", "토론토", "#2767A0"),
  team("MLB", "cws", "시카고 화이트삭스", "CWS", "시카고", "#3D434C"),
  team("MLB", "cle", "클리블랜드 가디언스", "CLE", "클리블랜드", "#AB263D"),
  team("MLB", "det", "디트로이트 타이거스", "DET", "디트로이트", "#263C55"),
  team("MLB", "kc", "캔자스시티 로열스", "KC", "캔자스시티", "#2479B5"),
  team("MLB", "min", "미네소타 트윈스", "MIN", "미니애폴리스", "#394C75"),
  team("MLB", "ath", "애슬레틱스", "ATH", "웨스트새크라멘토", "#237A55"),
  team("MLB", "hou", "휴스턴 애스트로스", "HOU", "휴스턴", "#DF6D2D"),
  team("MLB", "laa", "로스앤젤레스 에인절스", "LAA", "애너하임", "#B7243D"),
  team("MLB", "sea", "시애틀 매리너스", "SEA", "시애틀", "#227478"),
  team("MLB", "tex", "텍사스 레인저스", "TEX", "알링턴", "#2D5F9E"),
  team("MLB", "atl", "애틀랜타 브레이브스", "ATL", "애틀랜타", "#AD3040"),
  team("MLB", "mia", "마이애미 말린스", "MIA", "마이애미", "#1495B6"),
  team("MLB", "phi", "필라델피아 필리스", "PHI", "필라델피아", "#CE344C"),
  team("MLB", "wsh", "워싱턴 내셔널스", "WSH", "워싱턴 D.C.", "#AD293C"),
  team("MLB", "chc", "시카고 컵스", "CHC", "시카고", "#2669AD"),
  team("MLB", "cin", "신시내티 레즈", "CIN", "신시내티", "#C52F3C"),
  team("MLB", "mil", "밀워키 브루어스", "MIL", "밀워키", "#244666"),
  team("MLB", "pit", "피츠버그 파이리츠", "PIT", "피츠버그", "#B7921D"),
  team("MLB", "stl", "세인트루이스 카디널스", "STL", "세인트루이스", "#BD2E47"),
  team("MLB", "ari", "애리조나 다이아몬드백스", "ARI", "피닉스", "#A74349"),
  team("MLB", "col", "콜로라도 로키스", "COL", "덴버", "#675786"),
  team("MLB", "sd", "샌디에이고 파드리스", "SD", "샌디에이고", "#776039"),
  team("MLB", "sf", "샌프란시스코 자이언츠", "SF", "샌프란시스코", "#D86A38"),

  team("CPBL", "brothers", "중신 브라더스", "중신", "타이중", "#BE951B"),
  team("CPBL", "lions", "퉁이 라이온즈", "퉁이", "타이난", "#D86C27"),
  team("CPBL", "monkeys", "라쿠텐 몽키스", "라쿠텐", "타오위안", "#942B48"),
  team("CPBL", "guardians", "푸방 가디언스", "푸방", "신베이", "#306AA7"),
  team("CPBL", "dragons", "웨이취안 드래곤스", "웨이취안", "타이베이", "#CE3644"),
  team("CPBL", "hawks", "타이강 호크스", "타이강", "가오슝", "#287C64"),
];

export function teamsForLeague(id: LeagueId): Team[] {
  return TEAMS.filter((entry) => entry.leagueId === id);
}

export function getTeam(id: string): Team {
  return TEAMS.find((entry) => entry.id === id) ?? TEAMS[0];
}

export function getLeague(id: LeagueId): League {
  return LEAGUES.find((entry) => entry.id === id) ?? LEAGUES[0];
}

export const DATA_SOURCES: { label: string; url: string }[] = [
  { label: "KBO 구단 및 시즌 경기 수", url: "https://eng.koreabaseball.com/Standings/TeamStandings.aspx" },
  { label: "NPB 구단 안내", url: "https://npb.jp/eng/teams/" },
  { label: "NPB 정규시즌 경기 수", url: "https://npb.jp/bis/eng/2026/stats/" },
  { label: "MLB 구단 안내", url: "https://www.mlb.com/team" },
  { label: "MLB 정규시즌 일정", url: "https://www.mlb.com/schedule/team-by-team" },
  { label: "CPBL 구단 및 반기별 시즌 경기 수", url: "https://www.cpbl.com.tw/" },
];
