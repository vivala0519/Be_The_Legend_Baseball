"use client";

import { ChevronRight } from "lucide-react";
import { AMATEUR_COUNTRIES } from "@/lib/amateur";
import { COLLEGE_COMPETITIONS, getCareerAffiliation } from "@/lib/amateur-college";
import { ATTRIBUTE_LABELS, statsRates } from "@/lib/game";
import { getLeague, getTeam } from "@/lib/leagues";
import type { AmateurSeasonResult, SeasonResult } from "@/lib/game-types";
import { AmateurMark, decimal, TeamMark } from "@/components/game-ui";

type PlayedSeason = SeasonResult | AmateurSeasonResult;

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
  const firstNews = s.news[0];
  const fanNews = s.news.slice(1);
  const toneLabel = { positive: "기대", neutral: "이야기", negative: "아쉬움" };

  return <section className="season-result-root t-result" aria-live="polite">
    <div className="t-flow-scroll">
      <p className="t-label">{s.year} {amateur ? "아마추어 " : ""}시즌이 끝났어요</p>
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
        <div className="t-li t-li-flat">
          <span className="t-av t-av-logo"><SeasonTeamMark season={s} /></span>
          <span className="t-li-main"><b>{team.competition}</b><span>{team.name} · {s.teamRecord.wins}승 {s.teamRecord.losses}패{ s.teamRecord.draws > 0 ? ` ${s.teamRecord.draws}무` : ""}</span></span>
          <span className="t-li-end"><b>{s.championship ? "우승" : `${s.teamRecord.rank}위`}</b></span>
        </div>
        {s.awards.length > 0 && <div className="t-result-awards" aria-label="시즌 수상">{s.awards.map((award, index) => <span key={`${award}-${index}`}>{award}</span>)}</div>}
      </section>

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

export function SeasonDetail({ result: s }: { result: PlayedSeason }) {
  const rates = statsRates(s.stats);
  const batter = s.role === "batter";
  const team = seasonTeam(s);
  const amateur = "affiliationId" in s;
  const draft = amateur ? s.draft : undefined;
  const recentGames = s.games.filter(game => game.stats.g > 0).slice(-15).reverse();
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
    <h3>경기별 기록 <small>최근 출전 15경기</small></h3>
    {recentGames.length > 0 ? <div className="table-scroll"><table>
      <thead><tr><th>경기</th><th>상대</th><th>결과</th><th>스코어</th><th>나의 기록</th></tr></thead>
      <tbody>{recentGames.map(game => <tr key={game.id}>
        <td>#{game.number}</td>
        <td><span className="table-team">{amateur
          ? <><AmateurMark id={game.opponentId} />{getCareerAffiliation(game.opponentId)?.name ?? "상대 팀"}</>
          : <><TeamMark id={game.opponentId} />{getTeam(game.opponentId).shortName}</>}</span></td>
        <td><span className={`game-result ${game.result}`}>{game.result}</span></td>
        <td>{game.scoreFor} : {game.scoreAgainst}</td>
        <td>{batter ? `${game.stats.ab}타수 ${game.stats.h}안타${game.stats.hr ? ` ${game.stats.hr}홈런` : ""}` : `${statsRates(game.stats).innings}이닝 ${game.stats.er}자책 ${game.stats.so}삼진`}</td>
      </tr>)}</tbody>
    </table></div> : <p className="muted">이번 시즌에는 출전한 경기 기록이 없어요.</p>}
    {!batter && <p className="muted small">이닝의 소수점 뒤 숫자는 아웃 수예요. 5.2이닝은 5와 2/3이닝을 뜻합니다.</p>}
  </div>;
}
