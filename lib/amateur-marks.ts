import type { AmateurAffiliation } from "./amateur";

interface AmateurMark {
  src: string;
  sourceUrl: string;
  attribution: string;
  originalUrl?: string;
  license?: string;
  licenseUrl?: string;
}

function commonsMark(file: string, source: string, attribution: string, terms: "public-domain" | "3.0" | "4.0"): AmateurMark {
  return {
    src: `/amateur-marks/${file}.webp`,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(source)}`,
    attribution,
    license: terms === "public-domain" ? "Public domain" : `CC BY-SA ${terms}`,
    licenseUrl: terms === "public-domain" ? "https://creativecommons.org/publicdomain/mark/1.0/" : `https://creativecommons.org/licenses/by-sa/${terms}/`,
  };
}

function publishedMark(file: string, sourceUrl: string, attribution: string, originalUrl: string): AmateurMark {
  return { src: `/amateur-marks/${file}.webp`, sourceUrl, attribution, originalUrl };
}

// 2026 Bonghwang tournament organizer image numbers, paired by participant name.
// The tournament numbers are source references, while the catalog IDs stay stable.
const KOREAN_EMBLEMS: [schoolId: string, imageNumber: number][] = [
  ["deoksu", 28],
  ["sunrin", 56],
  ["shinil", 66],
  ["inchon", 82],
  ["jemulpo", 87],
  ["yushin", 76],
  ["gangneung", 2],
  ["daejeon-jeil", 27],
  ["gongju", 14],
  ["segwang", 59],
  ["jeonju", 86],
  ["gwangju-jeil", 17],
  ["daegu-sangwon", 25],
  ["busan", 41],
  ["masan-yongma", 33],
  ["jeju", 88],
  ["gangwon", 3],
  ["gaeseong", 4],
  ["gyeonggi", 6],
  ["gyeonggi-commerce", 7],
  ["gyeonggi-aviation", 8],
  ["gyeongnam", 9],
  ["gyeongdong", 10],
  ["gyeongmin-it", 11],
  ["gyeongbuk", 12],
  ["gyeongju", 13],
  ["gwangju-dongseong", 16],
  ["gwangju-jinheung", 18],
  ["gunsan-sangil", 19],
  ["geumnam", 20],
  ["gimpo-science-technology", 21],
  ["gimhae", 22],
  ["daegu", 23],
  ["daejeon", 26],
  ["dogae", 29],
  ["dongsan", 30],
  ["raon", 31],
  ["masan", 32],
  ["mulgeum", 35],
  ["baemyeong", 37],
  ["baejae", 38],
  ["baeksong", 39],
  ["bugyeong", 40],
  ["busan-technical", 42],
  ["bugil", 44],
  ["bibong", 45],
  ["sangdong", 46],
  ["seoul", 50],
  ["seoul-dongsan", 51],
  ["seoul-design", 52],
  ["seoul-automotive", 54],
  ["seoul-convention", 55],
  ["seorak", 57],
  ["seongnam", 58],
  ["sewon", 61],
  ["sorae", 63],
  ["sinheung", 67],
  ["ansan-technical", 69],
  ["yatap", 71],
  ["yeil-meditech", 72],
  ["usin", 73],
  ["wonju", 75],
  ["uiseong", 78],
  ["insang", 80],
  ["inchang", 81],
  ["jangan", 83],
  ["jangchung", 84],
  ["jeonbuk-ai", 85],
  ["joongang", 89],
  ["jinyeong", 90],
  ["cheongdam", 94],
  ["cheongwon", 95],
  ["cheongju", 96],
  ["choongam", 97],
  ["chunghun", 98],
  ["pohang-jecheol", 99],
  ["hwasun", 103],
  ["whimoon", 104],
];

const marks = new Map<string, AmateurMark>([
  ...KOREAN_EMBLEMS.map(([schoolId, number]): [string, AmateurMark] => {
    const id = `kr-${schoolId}`;
    return [id, publishedMark(
      id, "https://www.hankookilbo.com/bonghwang/school/", "봉황대기 전국고교야구대회 참가팀 자료",
      `https://www.hankookilbo.com/bonghwang/img/emblems/e${number}.jpg`,
    )];
  }),
  ["jp-402-駒大苫小牧", publishedMark("jp-komadai-tomakomai", "https://www.komazawa-uth.ed.jp/outline/mark/", "고마다이토마코마이고등학교", "https://www.komazawa-uth.ed.jp/wp-content/uploads/2023/06/SchoolIcon-510x510.jpg")],
  ["jp-416-横浜翠嵐", commonsMark("jp-yokohama-suiran", "YokohamaSuiran_badge.jpg", "Myopia", "3.0")],
  ["jp-417-中越", commonsMark("jp-chuetsu", "中越高等学校・校章.jpg", "Rebirth10", "4.0")],
  ["jp-417-長岡商", commonsMark("jp-nagaoka-shogyo", "Nagaoka_Syougyo_High_School_Kousyo.jpg", "新潟県立長岡商業高等学校", "public-domain")],
  ["jp-429-大阪桐蔭", publishedMark("jp-osaka-toin", "https://www.osakatoin.ed.jp/archives/15590/img_9714/", "오사카토인고등학교", "https://www.osakatoin.ed.jp/wp-content/themes/toin/img/common/20230321/mark.svg")],
  ["jp-aomori-yamada", publishedMark("jp-aomori-yamada", "https://aomori-yamada.jp/about/%E6%95%99%E8%82%B2%E3%81%AE%E3%83%A2%E3%83%8E%E3%82%B3%E3%83%88/", "아오모리야마다학원", "https://aomori-yamada.jp/hp/wp-content/uploads/2020/06/logomark.png")],
  ["jp-hanamaki-higashi", publishedMark("jp-hanamaki-higashi", "https://www.hanamakihigashi-h.jp/about/symbol.html", "하나마키히가시고등학교", "https://www.hanamakihigashi-h.jp/about/images/symbol_img_02.png")],
  ["jp-sendai-ikuei", publishedMark("jp-sendai-ikuei", "https://www.sendaiikuei.ed.jp/hs/intro/badge.html", "센다이이쿠에이고등학교", "https://www.sendaiikuei.ed.jp/media/images/hs/intro/badge/school_badge.png")],
  ["jp-tenri", publishedMark("jp-tenri", "https://www.tenri-h.ed.jp/1bu/school-guide/school-emblem/", "텐리고등학교", "https://tenri-h.sakura.ne.jp/1bu/wp-content/uploads/kousho-300x300-1.jpg")],
  ["jp-okinawa-shogaku", publishedMark("jp-okinawa-shogaku", "https://www.okisho.ed.jp/about/history/", "오키나와쇼가쿠고등학교", "https://www.okisho.ed.jp/images/about/history_logo_high.png")],
  ["jp-yokohama", publishedMark("jp-yokohama", "https://www.yokohama-jsh.ac.jp/intro/mark/", "요코하마고등학교", "https://www.yokohama-jsh.ac.jp/contents/wp-content/uploads/2018/10/slice_64.png")],
  ["us-harvard-westlake", publishedMark("us-harvard-westlake", "https://www.hw.com/about/Logos", "Harvard-Westlake School", "https://www.hw.com/portals/28/logos/Box-Crest2.png")],
  ["tw-034319", publishedMark("tw-034319", "https://www.pjhs.tyc.edu.tw/MS_msg1?PS=4pHbpMnm2rNRLJbUgzwwNjH6heFpkwM6vNeY1PlO6Wo%3D", "핑전고등학교", "https://www.pjhs.tyc.edu.tw/CK_Files/14_20240509090131_legendlogo.jpg")],
  ["do-la-javilla", publishedMark("do-la-javilla", "https://www.javillaclub.com/", "Javilla Club", "https://www.javillaclub.com/javilla-logo.png")],
  ["ve-carlos-guillen", publishedMark("ve-carlos-guillen", "https://www.academiacag.com/", "Academia de Béisbol Carlos Alfonso Guillén", "https://www.academiacag.com/images/LOGO-ACAG.png")],
]);

export function getAmateurMark(affiliation: Pick<AmateurAffiliation, "id">): AmateurMark | undefined {
  return marks.get(affiliation.id);
}
