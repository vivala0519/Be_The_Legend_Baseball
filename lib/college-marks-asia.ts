import type { CollegeMark } from './college-marks';

const KOREAN_MARK_IDS = [
  'yonsei', 'korea', 'dankook', 'dongguk', 'hanyang', 'inha', 'konkuk',
  'kyungnam', 'kyungsung', 'kiu', 'kyunghee', 'keimyung', 'donga', 'deu',
  'snu', 'scau', 'skku', 'songwon', 'yeungnam', 'woosuk', 'wonkwang',
  'u1', 'chungang', 'chungwoon', 'hanil', 'howon', 'hongik',
];
const TAIWAN_MARK_IDS = ['ntus', 'ntsu', 'pccu', 'fju', 'knu', 'meiho'];

function publishedMarks(country: 'kr' | 'tw', ids: string[], sourceUrl: string, attribution: string): Record<string, CollegeMark> {
  return Object.fromEntries(ids.map(id => [
    `college-${country}-${id}`,
    { src: `/college-marks/${country}-${id}.webp`, sourceUrl, attribution },
  ]));
}

export const COLLEGE_MARKS_ASIA: Record<string, CollegeMark> = {
  ...publishedMarks('kr', KOREAN_MARK_IDS, 'https://www.kubf-baseball.com/', '한국대학야구연맹'),
  ...publishedMarks('tw', TAIWAN_MARK_IDS, 'https://cmn-hant.overseas.ncnu.edu.tw/about-us/university-introduction/university-introduction-logo/', '대만 해외연합초생위원회'),
  'college-jp-waseda': {
    src: '/college-marks/jp-waseda.webp',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Waseda_university_logo.svg',
    attribution: '와세다대학교',
    license: 'Public domain (Wikimedia Commons)',
    licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
  },
  'college-jp-keio': {
    src: '/college-marks/jp-keio.webp',
    sourceUrl: 'https://www.keio.ac.jp/ja/about/public-relations/logo/symbol/',
    attribution: '게이오기주쿠대학교',
  },
  'college-jp-meiji': {
    src: '/college-marks/jp-meiji.webp',
    sourceUrl: 'https://www.meiji.ac.jp/koho/information/symbol/',
    attribution: '메이지대학교',
  },
  'college-jp-hosei': {
    src: '/college-marks/jp-hosei.webp',
    sourceUrl: 'https://www.hosei.ac.jp/hosei/daigakugaiyo/symbol/mark/',
    attribution: '호세이대학교',
  },
  'college-jp-rikkyo': {
    src: '/college-marks/jp-rikkyo.webp',
    sourceUrl: 'https://www.rikkyo.ac.jp/about/introduction/spirit/',
    attribution: '릿쿄대학교',
  },
  'college-jp-tokyo': {
    src: '/college-marks/jp-tokyo.webp',
    sourceUrl: 'https://www.u-tokyo.ac.jp/ja/about/public-relations/b01_05_01.html',
    attribution: '도쿄대학교',
  },
};
