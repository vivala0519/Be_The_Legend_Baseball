# 비 더 레전드

고교 야구부나 아카데미에서 출발한 가상 선수 한 명의 야구 인생을 진행하는 한국어 웹 게임입니다. 아마추어 시즌을 마치면 KBO·NPB·MLB·대만 CPBL의 프로 무대에 도전합니다.

## 실행

Node.js 22.13 이상과 npm이 필요합니다.

```text
npm ci
npm run dev
```

개발 서버가 출력한 로컬 URL을 여세요. 기본 포트는 5173입니다. 별도 데이터베이스나 API 키 없이 게임을 플레이할 수 있습니다.

```text
npx tsc --noEmit
npm run build
```

빌드한 Cloudflare Worker를 로컬에서 확인하려면 `npm start`를 사용합니다. `npm run build`는 배포하지 않습니다.

## 플레이 흐름

1. 타자 또는 투수를 고르고 해당 역할의 아바타를 선택한 뒤 이름·등번호·국적을 정합니다.
2. 시작 국가를 정하고 한국·일본·대만·미국의 고교 야구부 또는 도미니카공화국·베네수엘라의 야구 아카데미를 고릅니다.
3. 플레이 스타일과 집중 육성 능력치 최대 두 개를 선택합니다.
4. 시즌 준비 화면에서 훈련과 시즌 운영을 정하고 시즌을 진행합니다.
5. 성적·능력치 변화·주요 사건과 가상 언론·팬 반응을 확인합니다.
6. 고교 또는 아카데미에서 17세부터 세 시즌을 뛰고 19세 시즌을 마치면 신인 드래프트가 열립니다. 지명되면 해당 구단에 입단합니다. 미지명되면 대학들이 경기 실적과 포지션을 심사하며, 합격한 대학 중 하나를 골라 진학합니다. 진학한 뒤에는 1~4학년 시즌마다 드래프트에 참가합니다. 합격한 대학이 없거나 대학 마지막 드래프트에서 미지명되면 은퇴합니다. 프로에서 활약하면 다른 리그의 계약 제안도 받을 수 있습니다.
7. 은퇴 후 커리어 카드와 게임 내 통합 명예의 전당 결과를 확인합니다.

선수는 OVR 45에서 시작합니다. 타자는 컨택·파워·선구안·주루·수비·송구, 투수는 구속·구위·제구·변화구·스태미나·회복을 사용합니다. 선수는 모두 가상이며 실제 선수 명단을 재현하지 않습니다.

## 현재 게임 범위

아마추어 시작 소속은 총 5,048곳입니다. 학교와 아카데미 이름은 한글로 표시하며, 검색창에는 한글 이름·원어 이름·지역을 입력할 수 있습니다. 아마추어 기록과 프로 통산 성적은 따로 집계합니다. 드래프트는 시작 국가에 따라 KBO(한국), NPB(일본), CPBL(대만), MLB(미국·도미니카공화국·베네수엘라)에서 열립니다.

한국 고교 시즌에는 주말리그 전반기·후반기와 신세계 이마트배, 황금사자기, 청룡기, 대통령배, 봉황대기가 열립니다. 전반기 권역 성적은 황금사자기·청룡기 진출에, 후반기 성적과 이마트배 성적은 대통령배 진출에 반영합니다. 전국대회는 게임용 32강 토너먼트로 진행합니다. 시즌 종료 화면에서 대회별 기록과 진출 결과를 확인하고 상세 기록에서 대회를 골라 경기 목록을 볼 수 있습니다. [2026 고교야구 일정](https://school.jbedu.kr/insang/M010414/) · [황금사자기 대회 안내](https://www.donga.com/news/amp/all/20260429/133831552/2) · [대통령배 대회 안내](https://www.joongang.co.kr/article/25440808)

해외 고교·아카데미 시즌도 나라별 일정으로 진행합니다. 실제 대회를 참고해 참가 팀 수, 진출 기준, 대진을 게임 규모에 맞게 조정했으며 교류전은 경기 경험을 쌓을 수 있도록 별도로 편성했습니다.

| 국가 | 게임 내 고교·아카데미 대회 | 참고 자료 |
| --- | --- | --- |
| 일본 | 춘계 고교 교류전과 도도부현 대회, 여름 고시엔 지방대회와 전국 본선. 추계 도도부현·권역대회와 메이지진구 고교부는 1·2학년 일정입니다. 2·3학년 봄 고시엔(센바쓰) 출전에는 전년도 추계 권역 성적을 반영합니다. | [센바쓰 요강](https://www.jhbf.or.jp/senbatsu/2026/guidance/) · [여름 지방대회 일정](https://www.jhbf.or.jp/topics/info/260610_1.html) · [추계 권역 일정](https://jhbf.or.jp/topics/detail/621) · [메이지진구 대진 안내](https://jhbf.or.jp/topics/detail/624) |
| 대만 | 전국 고교 목제배트 리그 1~3차와 결선, 대만 고교 교류전, 타오위안컵 고교부, 중신배 흑표기 전국고교야구대회. | [목제배트 리그 규정](https://www.ctsbf.edu.tw/goods-view.html?id=172) · [타오위안컵](https://taoyuancup.eduweb.tw/ta2026/Module/Home/Index.php) · [흑표기 대회 일정](https://xc.hlc.edu.tw/~xc_bulletin/modules/news/index.php?id=130797&page=department) |
| 미국 | 텍사스 UIL은 주 내 학교로 게임용 지구를 편성하고 정규리그 상위권이 주 챔피언십에 진출합니다. 조지아 GHSA는 정규시즌과 주 챔피언십을 치릅니다. 캘리포니아 CIF는 남부 섹션 정규리그·챔피언십을 거쳐 서던 캘리포니아 권역대회와 주 챔피언십으로 이어집니다. | [텍사스 UIL](https://www.uiltexas.org/baseball) · [조지아 GHSA](https://www.ghsa.net/beginning-ending-dates-2026-2027) · [캘리포니아 CIF 남부 섹션](https://cifss.org/sports/baseball/) |
| 도미니카공화국 | 아카데미 교류리그 전·후반기와 MLB 아마추어 스카우팅 리그 권역전·결선. 스카우팅 리그는 18세까지 참가할 수 있으며, 실제 권역 선발팀 대진을 아카데미 대항전으로 구성했습니다. | [MLB 권역별 운영](https://www.mlb.com/es/amateur-scouting-league) · [MLB 참가 연령](https://www.mlb.com/mets/news/mlb-amateur-scouting-league-faq) |
| 베네수엘라 | 아라과 등 실제 아카데미 대회에서 착안한 베네수엘라 아카데미 권역리그와 플레이오프. 2019년 국제 행사에 참가한 베네수엘라 유망주 사례를 참고해 MLB 트레이너 파트너십 쇼케이스를 아카데미 3경기 일정으로 각색했습니다. | [마라카이 프로스펙트 리그](https://www.maracayprospectleague.com/about) · [MLB 쇼케이스 기록](https://www.mlb.com/news/top-performers-at-trainer-partnership-program) |

대학 선택 목록에는 국가별 실제 대학 야구팀을 수록했습니다. 대학 야구 대회 성적을 참고해 게임 내 모집 단계별 합격선을 기본 48~53점, 경쟁 55~62점, 상위 64~72점으로 설정했습니다. 학교별 모집 포지션과 합격 결과는 게임에서 모의 평가합니다. 교표의 개별 출처는 `lib/college-marks-asia.ts`와 `lib/college-marks-americas.ts`에 있습니다.

대학에 진학하면 소속 국가의 리그와 대회를 치릅니다. 참가 팀 수와 대진은 게임용으로 줄였습니다. 일본 전국대회와 미국 NCAA 일정에는 진학 후보 외의 실제 대학도 상대 팀으로 등장합니다. 대회별 팀 성적과 선수 기록, 경기 목록은 시즌 종료 화면에서 확인할 수 있습니다.

| 국가 | 게임 내 대학 대회 | 참고 자료 |
| --- | --- | --- |
| 한국 | KUSF 대학야구 U-리그와 왕중왕전, 전국대학야구선수권대회 조별리그와 본선, 대통령기 전국대학야구대회, 전국체육대회 대학부 | [U-리그 운영](https://kubf-baseball.com/bbs/board.php?bo_table=MC05&wr_id=97) · [선수권 대진](https://www.kubf-baseball.com/bbs/board.php?bo_table=MC05&wr_id=121) · [대통령기 대진](https://www.kubf-baseball.com/bbs/board.php?bo_table=MC05&wr_id=120) · [전국체전 경기 일정](https://www.kubf-baseball.com/baseball/schedule.php) |
| 일본 | 도쿄 6대학 야구 봄·가을 리그. 각 리그 우승교는 전일본 대학야구 선수권대회와 메이지진구 야구대회 대학부에 각각 진출 | [도쿄 6대학 리그](https://big6.gr.jp/game/league/2026s/2026s_schedule.html) · [전일본선수권](https://www.jubf.net/system/prog/teams.php?k=all&m=pc&s=2026) · [메이지진구대회](https://www.jubf.net/system/prog/teams.php?e=jingu&k=all&m=pc&s=2026) |
| 대만 | UBL 대학야구리그 공개 1부가 12월에 시작하고, 2차 리그와 결선은 이듬해 1월에 진행 | [대만 대학체육총회 대회 규정](https://ctusf.org.tw/upload/news/20261027024849_1.pdf) |
| 미국 | NCAA 디비전 I 정규시즌, 리저널, 슈퍼 리저널, 남자 대학 월드시리즈(MCWS) | [NCAA 챔피언십 대진표](https://www.ncaa.com/_flysystem/public-s3/files/2026%20NCAA%20Division%20I%20Baseball%20Championship%20Bracket.pdf) |
| 도미니카공화국 | 대학야구리그 코파 반레세르바스와 상위 4개 팀 플레이오프 | [국가야구위원회 대회 안내](https://dcnb.gob.do/noticias/dcnb-anuncia-la-cuarta-version-de-la-liga-de-beisbol-universitario/) |
| 베네수엘라 | 게임에서 구성한 대학 교류리그와 2017년 전국 대학체육대회 야구 기록에서 착안한 JUVINEU 토너먼트 | [UNEXPO 2017년 대학체육대회 회보](https://notiunexpo.wordpress.com/wp-content/uploads/2017/08/boletin_23_2017listo.pdf) |

| 국가 | 소속 수 | 명단 범위 |
| --- | ---: | --- |
| 한국 | 78 | [2026 봉황대기 참가 고교 야구부](https://bonghwang.hankookilbo.com/school/) |
| 일본 | 3,608 | [2026 여름 선수권 49개 지역대회](https://smart.asahi.com/v/koshien/stats/summer/y2026.php), 47개 도도부현 |
| 대만 | 41 | [114학년도 경식 목재배트 리그](https://www.ctsbf.edu.tw/goods-team_list.html?id=160) 참가교 |
| 미국 | 1,230 | [텍사스 UIL 2026–27 편성표](https://www.uiltexas.org/baseball/alignments)와 기존 캘리포니아·조지아 고교 |
| 도미니카공화국 | 53 | [MLB 트레이너 파트너십](https://www.mlb.com/trainer-partnership/dominican-republic) 아카데미 |
| 베네수엘라 | 38 | [MLB 트레이너 파트너십](https://www.mlb.com/trainer-partnership/venezuela) 아카데미 |

일본 학교의 한글 표기는 일본어 학교명 읽기 자료를 바탕으로 정리했습니다. 원래의 대회 표기와 검색 별칭도 저장합니다. [주오대학 고교 코드표](https://www.chuo-u.ac.jp/uploads/2026/06/5554_%E9%AB%98%E6%A0%A1%E3%82%B3%E3%83%BC%E3%83%89.pdf)

교표와 아카데미 로고 93개를 로컬 WebP로 제공하며, 선택 후 출처를 열 수 있습니다. 국내 학교 78곳의 교표는 [봉황대기 공식 참가팀 명단](https://bonghwang.hankookilbo.com/school/)을, 해외 항목은 [개별 이미지 출처 기록](lib/amateur-marks.ts)을 참고했습니다. 해당 이미지가 없는 소속에는 기본 표식을 표시합니다.

- [요코하마스이란](https://commons.wikimedia.org/wiki/File:YokohamaSuiran_badge.jpg) · Myopia · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
- [주에쓰](https://commons.wikimedia.org/wiki/File:%E4%B8%AD%E8%B6%8A%E9%AB%98%E7%AD%89%E5%AD%A6%E6%A0%A1%E3%83%BB%E6%A0%A1%E7%AB%A0.jpg) · Rebirth10 · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- [나가오카상업](https://commons.wikimedia.org/wiki/File:Nagaoka_Syougyo_High_School_Kousyo.jpg) · 新潟県立長岡商業高等学校 · [퍼블릭 도메인](https://creativecommons.org/publicdomain/mark/1.0/)

| 리그 | 구단 수 | 게임 내 정규시즌 경기 수 |
| --- | ---: | ---: |
| KBO | 10 | 144 |
| NPB | 12 | 143 |
| MLB | 30 | 162 |
| CPBL | 6 | 120 |

한 리그에서 완성한 커리어도 레거시로 평가합니다. 리그 간 이동 기회는 능력치·나이와 게임 내 계약 제안에 따라 열립니다. MLB MVP·사이영상 등 개인 타이틀과 우승, 통산 기록이 레거시 점수에 반영됩니다. 게임 내 명예의 전당 기준은 350점이며, 실제 쿠퍼스타운이나 각국의 헌액 제도와 별개입니다.

일정·출전·부상·계약·등록·시상과 리그 비교는 게임용으로 간소화했습니다. 구단 순위·우승은 간소화된 시즌 모델이며, 모든 리그의 실재 선수와 전체 경기 일정을 정밀하게 재현하는 게임은 아닙니다. 게임 속 가상 기사와 팬 반응은 실제 보도가 아닙니다. 연봉은 UI에서 원화 만원 단위로 표시하는 게임 수치입니다.

## 엔진과 기록

- 커리어에 저장된 32비트 난수 상태로 시즌을 계산합니다. 같은 커리어 상태와 선택은 같은 결과를 만듭니다.
- 안타·장타·삼진·볼넷·득점 등은 타석과 주자 이동 사건에서 누적합니다.
- 투구 이닝은 소수 대신 아웃 수 정수로 저장합니다. 화면의 `5.2`는 5와 2/3이닝입니다.
- 비율 기록은 누적 기록에서 계산합니다. 타석 수와 안타·홈런, 경기와 시즌 합계의 일관성을 검증합니다.
- 성장에는 나이·남은 잠재력·육성·출전·건강과 시즌 운영을 반영합니다.
- 시즌이 끝난 40세 선수는 다음 단계에서 자동 은퇴하며, 이전에도 플레이어가 은퇴를 선택할 수 있습니다.

## 저장

진행 상황은 플레이 중인 브라우저의 localStorage에 자동 저장합니다. 설정에서 JSON 파일로 저장하거나 파일을 불러와 다른 기기로 옮길 수 있습니다. 브라우저 데이터 삭제와 저장 공간 제한에 대비해 중요한 커리어는 파일로 보관하세요.

현재 버전에는 계정 간 클라우드 동기화나 공개 온라인 랭킹이 없습니다. 저장 파일은 형식·숫자 범위·구단·시즌 합계와 경기별 기록을 확인한 뒤 읽습니다. 직접 수정한 클라이언트 기록을 공인 성적으로 인증하는 시스템은 아닙니다.

## 소스 구조

- `app/page.tsx`: 게임 화면과 커리어 상태 연결
- `app/globals.css`: 반응형 게임 디자인
- `components/`: 선수 생성과 공통 UI
- `lib/game-types.ts`: 선수·기록·시즌·계약 타입
- `lib/game.ts`: 경기·성장·계약·은퇴·저장 검증 엔진
- `lib/amateur.ts`: 시작 국가 규칙과 고교 야구부·아카데미 목록 및 출처
- `lib/amateur-competitions.ts`: 아마추어 대회 일정과 대학 대회 진출 규칙
- `lib/leagues.ts`: 네 리그와 구단 데이터, 공식 데이터 출처
- `public/`: 오리지널 SVG 야구장·선수 일러스트와 아이콘

구단·리그 명칭과 교표·로고의 권리는 각 권리자에게 있습니다. 프로 구단 표식은 자체 텍스트 모노그램으로 표시합니다.
