"use client";

import { useState } from "react";
import { CalendarDays, ChevronRight, Trophy } from "lucide-react";
import { AMATEUR_COUNTRIES } from "@/lib/amateur";
import { COLLEGE_COMPETITIONS, getCareerAffiliation } from "@/lib/amateur-college";
import { getAmateurCompetition } from "@/lib/amateur-competitions";
import { ATTRIBUTE_LABELS, statsRates } from "@/lib/game";
import { getLeague, getTeam } from "@/lib/leagues";
import type { AmateurSeasonResult, GameSummary, SeasonResult } from "@/lib/game-types";
import { AmateurMark, decimal, TeamMark } from "@/components/game-ui";

type PlayedSeason = SeasonResult | AmateurSeasonResult;
type CompetitionResult = NonNullable<AmateurSeasonResult["competitions"]>[number];

const ELIMINATION_LABELS = {
  roundOf64: "64강", roundOf32: "32강", roundOf16: "16강", quarterfinal: "8강", semifinal: "4강", final: "준우승",
};

function competitionFinish({ outcome }: CompetitionResult, competition: ReturnType<typeof getAmateurCompetition>) {
  switch (outcome.kind) {
    case "champion": return "우승";
    case "advanced": return "다음 라운드 진출";
    case "ranked": return `${outcome.rank}위`;
    case "eliminated": return outcome.round === "final" && competition?.advanceOnWin ? "탈락" : ELIMINATION_LABELS[outcome.round];
    case "notQualified": return competition?.notQualifiedLabel ?? "출전권 미획득";
  }
}

function competitionResultsOf(season: PlayedSeason) {
  return "affiliationId" in season ? season.competitions : undefined;
}

function CompetitionResults({ results, batter }: { results: CompetitionResult[]; batter: boolean }) {
  return <ul className="season-competition-results">
    {results.map(result => {
      const competition = getAmateurCompetition(result.id);
      const Icon = competition?.format === "league" ? CalendarDays : Trophy;
      const { stats, teamRecord, outcome } = result;
      const qualified = outcome.kind !== "notQualified";
      const personal = batter ? `${stats.h}안타 · ${stats.hr}홈런`
        : `${statsRates(stats).innings}이닝 · ${stats.so}탈삼진`;
      return <li className="season-competition-result" key={result.id}>
        <span className="season-competition-icon" aria-hidden="true"><Icon size={19} /></span>
        <div className="season-competition-main">
          <strong>{competition?.name}</strong>
          {qualified && <span>{stats.g}경기 출전 · {personal}</span>}
        </div>
        <div className="season-competition-record">
          <b className={outcome.kind === "champion" ? "is-champion" : undefined}>{competitionFinish(result, competition)}</b>
          {qualified && <small>{teamRecord.wins}승 {teamRecord.losses}패{teamRecord.draws ? ` ${teamRecord.draws}무` : ""}</small>}
        </div>
      </li>;
    })}
  </ul>;
}

function SeasonMoments({ season, competitions }: { season: PlayedSeason; competitions: CompetitionResult[] }) {
  const batter = season.role === "batter";
  const gameScore = ({ stats }: GameSummary) => batter ? stats.hr * 5 + stats.h + stats.rbi
    : stats.so + (stats.w + stats.sv) * 3 + stats.outs / 3 - stats.er * 2;
  const standout = season.games.reduce<GameSummary | undefined>((best, game) => (
    game.stats.g > 0 && (!best || gameScore(game) > gameScore(best)) ? game : best
  ), undefined);
  const featured = standout ?? season.games.at(-1);
  const championships = competitions.filter(({ outcome }) => outcome.kind === "champion")
    .map(({ id }) => getAmateurCompetition(id)?.name);
  const featuredCompetition = featured?.competitionId && getAmateurCompetition(featured.competitionId);

  return <section className="t-flow-section" aria-label="시즌의 순간">
    <h3>시즌의 순간</h3>
    <div className="season-moments">
      {championships.length > 0 && <article>
        <strong>팀과 함께한 우승</strong>
        <p>{championships.join(" · ")}에서 팀과 함께 우승했어요.</p>
      </article>}
      {featured && <article>
        <strong>{standout ? featured.headline : "시즌 마지막 경기"}</strong>
        <p>{featuredCompetition && `${featuredCompetition.name} · `}{getCareerAffiliation(featured.opponentId)?.name ?? "상대 팀"}전</p>
        <small>팀 스코어 {featured.scoreFor} : {featured.scoreAgainst}</small>
      </article>}
      {season.injuredGames > 0 && <article>
        <strong>그라운드로 돌아오기까지</strong>
        <p>부상으로 {season.injuredGames}경기를 쉬며 몸을 회복했어요.</p>
      </article>}
    </div>
  </section>;
}

function seasonTeam(season: PlayedSeason) {
  if ("affiliationId" in season) {
    const affiliation = getCareerAffiliation(season.affiliationId);
    return {
      name: affiliation?.name ?? "아마추어 소속",
      competition: affiliation
        ? (affiliation.kind === "college" ? COLLEGE_COMPETITIONS[affiliation.country] : AMATEUR_COUNTRIES[affiliation.country]).leagueName
        : "아마추어",
    };
  }
  return { name: getTeam(season.teamId).name, competition: getLeague(season.leagueId).name };
}

function SeasonTeamMark({ season, large }: { season: PlayedSeason; large?: boolean }) {
  return "affiliationId" in season
    ? <AmateurMark id={season.affiliationId} large={large} />
    : <TeamMark id={season.teamId} large={large} />;
}

export function SeasonResultView({ result: s, onDetail }: { result: PlayedSeason; onDetail: () => void }) {
  const rates = statsRates(s.stats);
  const batter = s.role === "batter";
  const growth = s.overallAfter - s.overallBefore;
  const changes = Object.entries(s.attributeGains)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, batter ? 2 : 1);
  const team = seasonTeam(s);
  const amateur = "affiliationId" in s;
  const competitions = competitionResultsOf(s);
  const firstNews = s.news[0];
  const fanNews = s.news.slice(1);
  const toneLabel = { positive: "기대", neutral: "이야기", negative: "아쉬움" };

  return <section className={`season-result-root t-result${competitions ? " t-amateur-competition-result" : ""}`} aria-live="polite">
    <div className="t-flow-scroll">
      <p className="t-label">{competitions ? `${s.year} · ${team.name} 시즌 결산` : `${s.year} ${amateur ? "아마추어 " : ""}시즌이 끝났어요`}</p>
      <h2>종합 능력치가<br /><span className="t-blue">{s.overallAfter}</span>이 됐어요</h2>

      <div className="t-kv t-kv-flow">
        <div><span>출전</span><b>{s.stats.g}경기 · {batter ? `${s.stats.pa}타석` : `${rates.innings}이닝`}</b></div>
        {batter ? <>
          <div><span>안타 · 홈런</span><b>{s.stats.h}안타 {s.stats.hr}홈런</b></div>
          <div><span>타율 · OPS</span><b>{decimal(rates.avg)} · {decimal(rates.ops)}</b></div>
        </> : <>
          <div><span>승 · 패 · 세이브</span><b>{s.stats.w}승 {s.stats.l}패 {s.stats.sv}세이브</b></div>
          <div><span>평균자책점 · WHIP</span><b>{rates.era.toFixed(2)} · {rates.whip.toFixed(2)}</b></div>
          <div><span>탈삼진</span><b>{s.stats.so}</b></div>
        </>}
        <div><span>종합 능력치</span><b>{s.overallBefore} → {s.overallAfter} <span className={growth >= 0 ? "t-up" : "t-down"}>{growth >= 0 ? "+" : ""}{growth}</span></b></div>
        {changes.map(([attribute, change]) => <div key={attribute}>
          <span>{ATTRIBUTE_LABELS[attribute] || attribute} 변화</span>
          <b><span className={change >= 0 ? "t-up" : "t-down"}>{change >= 0 ? "+" : ""}{change}</span></b>
        </div>)}
      </div>

      <section className="t-flow-section" aria-label="대회 결과">
        <h3>대회 결과</h3>
        {competitions ? <CompetitionResults results={competitions} batter={batter} /> : <div className="t-li t-li-flat">
          <span className="t-av t-av-logo"><SeasonTeamMark season={s} /></span>
          <span className="t-li-main"><b>{team.competition}</b><span>{team.name} · {s.teamRecord.wins}승 {s.teamRecord.losses}패{ s.teamRecord.draws > 0 ? ` ${s.teamRecord.draws}무` : ""}</span></span>
          <span className="t-li-end"><b>{s.championship ? "우승" : `${s.teamRecord.rank}위`}</b></span>
        </div>}
        {s.awards.length > 0 && <div className="t-result-awards" aria-label="시즌 수상">{s.awards.map((award, index) => <span key={`${award}-${index}`}>{award}</span>)}</div>}
      </section>

      {competitions && <SeasonMoments season={s} competitions={competitions} />}

      {s.news.length > 0 && <section className="t-flow-section" aria-label="언론과 팬 반응">
        <h3>언론·팬 반응</h3>
        <div className="rx-flat"><div className="rx-feed">
          {firstNews && <article className={`rx-press rx-${firstNews.tone}`}>
            <div className="rx-press-source"><span className="rx-press-logo" aria-hidden="true"><span>{firstNews.source.slice(0, 1)}</span></span><b>{firstNews.source}</b><span>· 기사</span></div>
            <p className="rx-press-headline">{firstNews.title}</p>
          </article>}
          <div className="rx-fans">{fanNews.map((news, index) => <article className={`rx-fan rx-${news.tone}`} key={index}>
            <span className={`rx-avatar ${news.tone === "positive" ? "is-gold" : news.tone === "negative" ? "is-red" : "is-blue"}`} aria-hidden="true">{news.source.slice(0, 1)}</span>
            <div className="rx-body"><div className="rx-meta"><b>{news.source}</b><em className="rx-tone">{toneLabel[news.tone]}</em></div><p className="rx-text">{news.title}</p><div className="rx-foot"><span className="rx-site">{s.year} 시즌 · 팬 반응</span></div></div>
          </article>)}</div>
          <p className="rx-note">시즌 결과를 바탕으로 만들어진 게임 속 가상 반응이에요</p>
        </div></div>
      </section>}

      <div className="t-flow-details"><button type="button" className="t-result-detail-button" onClick={onDetail}><span>상세 기록</span><ChevronRight size={18} /></button></div>
    </div>
  </section>;
}

export function SeasonDetail({ result: s, showDraft = true }: { result: PlayedSeason; showDraft?: boolean }) {
  const rates = statsRates(s.stats);
  const batter = s.role === "batter";
  const team = seasonTeam(s);
  const amateur = "affiliationId" in s;
  const draft = amateur && showDraft ? s.draft : undefined;
  const competitions = competitionResultsOf(s);
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const competitionGames = selectedCompetition
    ? s.games.filter(game => game.competitionId === selectedCompetition)
    : s.games.filter(game => game.stats.g > 0).slice(-15);
  const recentGames = competitionGames.reverse();
  const cells: [string, string | number][] = batter
    ? [["경기", s.stats.g], ["타석", s.stats.pa], ["타수", s.stats.ab], ["안타", s.stats.h], ["2루타", s.stats.doubles], ["3루타", s.stats.triples], ["홈런", s.stats.hr], ["타점", s.stats.rbi], ["볼넷", s.stats.bb], ["삼진", s.stats.so], ["타율", decimal(rates.avg)], ["OPS", decimal(rates.ops)]]
    : [["경기", s.stats.g], ["이닝", rates.innings], ["승리", s.stats.w], ["패배", s.stats.l], ["세이브", s.stats.sv], ["자책점", s.stats.er], ["피안타", s.stats.ha], ["볼넷", s.stats.bba], ["탈삼진", s.stats.so], ["ERA", rates.era.toFixed(2)], ["WHIP", rates.whip.toFixed(2)], ["부상 결장", s.injuredGames]];

  return <div className="season-detail">
    <div className="detail-player">
      <SeasonTeamMark season={s} large />
      <div>
        <h3>{team.name}</h3>
        <p>{amateur ? team.competition : s.leagueId} · {s.age}세 · OVR {s.overallBefore} → {s.overallAfter}</p>
        {draft && <p>{draft.leagueId} 드래프트 · {draft.status === "drafted"
          ? `${getTeam(draft.teamId).name} ${draft.round}라운드 ${draft.pick}순위 (전체 ${draft.overallPick}순위)`
          : "미지명"}</p>}
      </div>
    </div>
    <div className="detail-stats">{cells.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <h3>경기별 기록 {!selectedCompetition && <small>최근 출전 15경기</small>}</h3>
    {competitions && <label className="season-game-filter">
      대회
      <select value={selectedCompetition} onChange={event => setSelectedCompetition(event.target.value)}>
        <option value="">전체 대회</option>
        {competitions.map(({ id }) => <option key={id} value={id}>{getAmateurCompetition(id)?.name}</option>)}
      </select>
    </label>}
    {recentGames.length > 0 ? <div className="table-scroll"><table>
      <thead><tr><th>경기</th><th>상대</th><th>결과</th><th>스코어</th><th>나의 기록</th></tr></thead>
      <tbody>{recentGames.map(game => <tr key={game.id}>
        <td>#{game.number}{game.competitionId && <small className="season-game-competition">{getAmateurCompetition(game.competitionId)?.name}</small>}</td>
        <td><span className="table-team">{amateur
          ? <><AmateurMark id={game.opponentId} />{getCareerAffiliation(game.opponentId)?.name ?? "상대 팀"}</>
          : <><TeamMark id={game.opponentId} />{getTeam(game.opponentId).shortName}</>}</span></td>
        <td><span className={`game-result ${game.result}`}>{game.result}</span></td>
        <td>{game.scoreFor} : {game.scoreAgainst}</td>
        <td>{!game.stats.g ? "미출전" : batter ? `${game.stats.ab}타수 ${game.stats.h}안타${game.stats.hr ? ` ${game.stats.hr}홈런` : ""}` : `${statsRates(game.stats).innings}이닝 ${game.stats.er}자책 ${game.stats.so}삼진`}</td>
      </tr>)}</tbody>
    </table></div> : <p className="muted">{selectedCompetition ? "이번 시즌에 치른 대회 경기가 없어요." : "이번 시즌에는 출전한 경기 기록이 없어요."}</p>}
    {!batter && <p className="muted small">이닝의 소수점 뒤 숫자는 아웃 수예요. 5.2이닝은 5와 2/3이닝을 뜻합니다.</p>}
  </div>;
}
