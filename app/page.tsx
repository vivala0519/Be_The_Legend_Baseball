"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {ArrowRight,ArrowLeftRight,Award,BarChart3,BookOpen,CalendarDays,Check,CheckCircle2,ChevronRight,CircleDot,Download,Heart,House,Play,Plus,Settings2,Shield,Star,Target,TrendingUp,Trophy,Upload,UserRound,MessageCircle} from "lucide-react";
import {LEAGUES,getLeague,getTeam,teamsForLeague,type LeagueId} from "@/lib/leagues";
import {AMATEUR_COUNTRIES,getAmateurAffiliation} from "@/lib/amateur";
import {COLLEGE_SEASONS,getCareerAffiliation} from "@/lib/amateur-college";
import {createCareer,simulateSeason,advanceOffseason,retireCareer,getOverall,careerTotals,validateCareer,statsRates,getTransferEligibility,getTransferOfferKind,getProfessionalOffseasonOffers,ATTRIBUTE_LABELS,BATTER_ATTRIBUTES,PITCHER_ATTRIBUTES,HALL_THRESHOLD} from "@/lib/game";
import type {AmateurSeasonResult,Career,CreateCareerInput,Offer,PlayerRole,ProfessionalCareer,SeasonResult} from "@/lib/game-types";
import {AmateurMark,BrandBall,TeamMark,Avatar,Modal,StatTile,Empty,money,decimal} from "@/components/game-ui";
import Creator from "@/components/creator";
import {DraftResultView} from "@/components/draft-result";
import {SeasonResultView,SeasonDetail} from "@/components/season-results";

const STYLE_LABELS:Record<string,string>={contact:"정교한 컨택형",power:"한 방의 거포형",speed:"주루형 올라운더",velocity:"강속구형",control:"제구형",breaking:"변화구형"};
const SAVE_KEY="bench-to-hall-career-v1",ARCHIVE_KEY="bench-to-hall-archive-v1";
const NAV=[{id:"home",label:"홈",icon:House},{id:"reactions",label:"반응",icon:MessageCircle},{id:"season",label:"시즌",icon:CalendarDays},{id:"player",label:"선수",icon:UserRound},{id:"records",label:"기록",icon:BarChart3}] as const;
const CAREER_JOURNEY_STAGES = [
  { label: "벤치", caption: "벤치 끝자리에서", imageAlt: "남색 모자를 쓴 타자가 더그아웃 벤치에 앉아 있는 모습" },
  { label: "데뷔", caption: "꿈에 그리던 프로 데뷔", imageAlt: "남색 모자를 쓴 타자가 프로 데뷔를 위해 그라운드에 들어서는 모습" },
  { label: "첫 안타", caption: "첫 안타의 순간", imageAlt: "남색 모자를 쓴 타자가 첫 안타를 치는 모습" },
  { label: "우승", caption: "우승의 기쁨을 함께", imageAlt: "남색 모자를 쓴 타자가 우승 트로피를 들어 올리는 모습" },
  { label: "명예의 전당", caption: "명예의 전당에 남을 이름", imageAlt: "남색 모자를 쓴 타자가 명예의 전당에 헌액된 모습" },
] as const;
type Tab=typeof NAV[number]["id"]|"hall";
type Legacy={id:string;name:string;avatar:number;position:string;start:number;end:number;seasons:number;games:number;score:number;hall:boolean};
type PlayedSeason=SeasonResult|AmateurSeasonResult;
const PLANS=[{id:"balanced",name:"균형 잡힌 시즌",text:"출전과 회복의 균형",icon:Shield},{id:"aggressive",name:"한계에 도전",text:"더 많은 기회, 높은 피로",icon:TrendingUp},{id:"rest",name:"몸부터 탄탄하게",text:"회복과 컨디션에 집중",icon:Heart}] as const;

function RecordsTable({title,role,seasons,onDetail,filter}: {title:string;role:PlayerRole;seasons:PlayedSeason[];onDetail:(season:PlayedSeason)=>void;filter?:ReactNode}) {
 const batter=role==="batter";
 return <section className="panel record-panel">
   <div className="section-heading"><h2>{title}</h2>{filter}</div>
   <div className="table-scroll">
     <table>
       <thead><tr>
         <th>시즌</th><th>소속</th><th>리그</th><th>경기</th>
         {batter?<><th>타율</th><th>안타</th><th>홈런</th><th>타점</th><th>OPS</th></>:<><th>이닝</th><th>승</th><th>패</th><th>ERA</th><th>삼진</th></>}
         <th>OVR</th>
       </tr></thead>
       <tbody>{seasons.map(season=>{
         const rates=statsRates(season.stats);
         const amateur="affiliationId" in season;
         const affiliation=amateur?getCareerAffiliation(season.affiliationId):undefined;
         return <tr key={season.year} tabIndex={0} onClick={()=>onDetail(season)} onKeyDown={event=>{
           if(event.key==="Enter"||event.key===" "){event.preventDefault();onDetail(season);}
         }} aria-label={`${season.year} ${amateur?"아마추어 ":""}시즌 상세 기록`}>
           <td><strong>{season.year}</strong><small>{season.age}세</small></td>
           <td><span className="table-team">{amateur
             ? <><AmateurMark id={season.affiliationId}/>{affiliation?.name}</>
             : <><TeamMark id={season.teamId}/>{getTeam(season.teamId).shortName}</>}</span></td>
           <td><span className="table-league">{amateur?(affiliation?.kind==="college"?"대학":"아마추어"):season.leagueId}</span></td>
           <td>{season.stats.g}</td>
           {batter?<><td className="table-highlight">{decimal(rates.avg)}</td><td>{season.stats.h}</td><td>{season.stats.hr}</td><td>{season.stats.rbi}</td><td>{decimal(rates.ops)}</td></>
             : <><td>{rates.innings}</td><td>{season.stats.w}</td><td>{season.stats.l}</td><td className="table-highlight">{rates.era.toFixed(2)}</td><td>{season.stats.so}</td></>}
           <td><strong>{season.overallAfter}</strong></td>
         </tr>;
       })}</tbody>
     </table>
   </div>
   <p className="table-note">시즌을 누르면 경기 기록과 상세 성적을 볼 수 있어요.</p>
 </section>;
}

function ProfessionalOffseason({career,offers,selectedId,onSelect,onContinue}:{
  career:ProfessionalCareer;
  offers:Offer[];
  selectedId?:string;
  onSelect:(id:string)=>void;
  onContinue:()=>void;
}){
 const {serviceSeasons,faSeasonsRequired,postingSeasonsRequired,canUseFA,canUsePosting}=getTransferEligibility(career);
 const faRemaining=Math.max(0,faSeasonsRequired-serviceSeasons);
 const postingRemaining=Math.max(0,postingSeasonsRequired-serviceSeasons);
 const faStatus=canUseFA?"협상 가능":faRemaining>0?`${faRemaining}시즌 남음`:"현재 계약 종료 후 가능";
 const hasPostingOffer=offers.some(offer=>getTransferOfferKind(career,offer)==="posting");
 const postingStatus=hasPostingOffer?"제안 도착":canUseFA?"FA로 해외 협상 가능":
   canUsePosting?"자격 충족 · 이번 시즌 제안 없음":`${postingRemaining}시즌 남음`;
 const hasOtherOffers=offers.length>1;
 const selected=offers.find(offer=>offer.id===selectedId);
 const staying=selected?.teamId===career.teamId;
 const continueLabel=staying
   ? career.contractYears>0?"계약 유지하고 다음 시즌으로":"재계약하고 다음 시즌으로"
   : "계약하고 다음 시즌으로";
 return <section className="panel offer-section">
   <div className="section-heading">
     <div><h2>{hasOtherOffers?"다음 시즌 구단 선택":"다음 시즌 계약"}</h2></div>
     <ArrowLeftRight size={25}/>
   </div>
   <dl className="transfer-eligibility">
     <div><dt>{career.leagueId} 활동 경력</dt><dd>{serviceSeasons}시즌</dd></div>
     <div><dt>FA · {faSeasonsRequired}시즌</dt><dd>{faStatus}</dd></div>
     <div><dt>포스팅 · {postingSeasonsRequired}시즌</dt><dd>{postingStatus}</dd></div>
   </dl>
   <div className="offers-grid">
     {offers.map(offer=>{
       const kind=getTransferOfferKind(career,offer);
       const label=kind==="stay"?(career.contractYears>0?"현재 계약 유지":"현재 구단 재계약"):
         kind==="posting"?"포스팅":offer.leagueId===career.leagueId?"FA":"해외 FA";
       return <button type="button" key={offer.id} className={`offer-card ${selectedId===offer.id?"selected":""}`} aria-pressed={selectedId===offer.id} onClick={()=>onSelect(offer.id)}>
         <div className="offer-card-top"><span className="league-tag">{getLeague(offer.leagueId).flag} {offer.leagueId}</span><span className="radio-circle">{selectedId===offer.id&&<span/>}</span></div>
         <TeamMark id={offer.teamId} large/><h3>{getTeam(offer.teamId).name}</h3><p>{offer.role}</p>
         <strong className="offer-salary">{money(offer.salary)}<small> / {offer.years}년</small></strong>
         <p className="offer-description">{offer.description}</p>
         <span className="current-pill">{label}</span>
       </button>;
     })}
   </div>
   <div className="offer-actions"><button type="button" className="button primary" onClick={onContinue}>{continueLabel} <ArrowRight size={18}/></button></div>
 </section>;
}

export default function GameApp(){
 const [tab,setTab]=useState<Tab>("home"),[career,setCareer]=useState<Career|null>(null),[archives,setArchives]=useState<Legacy[]>([]),[loaded,setLoaded]=useState(false);
 const [creator,setCreator]=useState(false),[initialLeague,setInitialLeague]=useState<LeagueId>("KBO"),[guide,setGuide]=useState(false),[settings,setSettings]=useState(false),[explore,setExplore]=useState<LeagueId|null>(null);
 const [toast,setToast]=useState(""),[saving,setSaving]=useState(true),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[offerId,setOfferId]=useState(""),[detail,setDetail]=useState<PlayedSeason|null>(null),[recordLeague,setRecordLeague]=useState("all"),[retiring,setRetiring]=useState(false);
 const [journey,setJourney]=useState(0);
 const [review,setReview]=useState<"pending"|"drafting"|"revealed">("pending");
 const drafting=review==="drafting";
 const reviewed=review==="revealed";
 const journeyStage=CAREER_JOURNEY_STAGES[journey];
 const importRef=useRef<HTMLInputElement>(null),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 useEffect(()=>{try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const c=validateCareer(JSON.parse(raw));if(c)setCareer(c);else setToast("이전 저장을 읽지 못했어요. 설정에서 저장 파일을 불러와 주세요.")}const a:unknown=JSON.parse(localStorage.getItem(ARCHIVE_KEY)||"[]");if(Array.isArray(a))setArchives(a.filter((x):x is Legacy=>!!x&&typeof x.id==="string"&&typeof x.name==="string"&&Number.isFinite(x.score)).slice(0,20))}catch{setToast("브라우저 저장을 읽지 못했어요. 파일을 불러오거나 새로 시작해 주세요.")}setLoaded(true);return()=>{timers.current.forEach(clearTimeout)}},[]);
 useEffect(()=>{if(!loaded||!career)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(career));setSaving(true)}catch{setSaving(false);setToast("저장 공간이 부족해요. 설정에서 파일로 저장해 주세요.")}},[career,loaded]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),4500);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{document.querySelector(".main-content")?.scrollTo({top:0})},[tab,reviewed]);
 useEffect(() => {
   if (!drafting) return;
   const timer = window.setTimeout(() => {
     setReview(current => current === "drafting" ? "revealed" : current);
   }, 2000);
   return () => window.clearTimeout(timer);
 }, [drafting]);
 useEffect(() => {
   if (!loaded || creator || tab !== "home") return;
   const timer = window.setTimeout(() => {
     setJourney((journey + 1) % CAREER_JOURNEY_STAGES.length);
   }, 1000);
   return () => window.clearTimeout(timer);
 }, [creator, journey, loaded, tab]);
 const amateur=career?.amateur;
 const originalAffiliation=amateur?getAmateurAffiliation(amateur.affiliationId):undefined;
 const amateurCountry=originalAffiliation?AMATEUR_COUNTRIES[originalAffiliation.country]:undefined;
 const amateurOnly=career?.teamId===null;
 const college=amateur?.college;
 const affiliation=college?getCareerAffiliation(college.affiliationId):originalAffiliation;
 const amateurLabel=college?"대학 야구부":originalAffiliation?.kind==="school"?"고교 야구부":"야구 아카데미";
 const amateurGames=amateur?.history.reduce((games,season)=>games+season.stats.g,0)??0;
 const completedStageSeasons=amateur?.history.filter(season=>season.affiliationId===affiliation?.id).length??0;
 const stageSeasons=college?COLLEGE_SEASONS:amateurCountry?.seasons;
 const league=career?.leagueId?getLeague(career.leagueId):null;
 const team=career?.teamId?getTeam(career.teamId):null;
 const teamName=amateurOnly?affiliation?.name:team?.name;
 const latestAmateurSeason=amateur?.history.at(-1);
 const last=career?.history.at(-1)??latestAmateurSeason;
 const totals=career?careerTotals(career):null;
 const attrs=career?.player.role==="pitcher"?PITCHER_ATTRIBUTES:BATTER_ATTRIBUTES;
 const draft=amateurOnly&&career.phase==="offseason"?latestAmateurSeason?.draft:undefined;
 const finalDraft=college?.year===COLLEGE_SEASONS;
 const draftStage=college?(finalDraft?`대학 ${college.year}학년 · 마지막 도전`:`대학 ${college.year}학년`)
   : originalAffiliation?.kind==="academy"?"아카데미 수료":"고교 졸업";
 const draftStatus=reviewed?(draft?.status==="drafted"?"지명":"미지명"):drafting?"진행 중":"결과 발표 대기";
 const amateurProgress=career?.phase==="retired"?(career.retirement?.reason==="voluntary"?"은퇴":"미지명 은퇴"):draft?draftStatus:
   college?"시즌 종료 후 드래프트":"과정 종료 후 드래프트";
 const transferOffers=career?.teamId&&career.phase==="offseason"?getProfessionalOffseasonOffers(career):[];
 const selectedOfferId=transferOffers.find(offer=>offer.id===offerId)?.id??transferOffers[0]?.id;
 function start(id:LeagueId="KBO"){setInitialLeague(id);setCreator(true)}
 function archive(c:Career){
   const entry:Legacy={
     id:c.id,name:c.player.name,avatar:c.player.avatar,position:c.player.position,
     start:c.amateur?.history[0]?.year??c.history[0]?.year??c.year,
     end:c.history.at(-1)?.year??c.amateur?.history.at(-1)?.year??c.year,
     seasons:c.teamId===null?c.amateur.history.length:c.history.length,
     games:c.teamId===null?c.amateur.history.reduce((games,season)=>games+season.stats.g,0):careerTotals(c).g,
     score:c.hallScore,hall:!!c.retirement?.hallOfFame,
   };
   setArchives(previous=>{const next=[entry,...previous.filter(x=>x.id!==c.id)].slice(0,20);try{localStorage.setItem(ARCHIVE_KEY,JSON.stringify(next))}catch{setToast("커리어 요약을 보관하지 못했어요. 파일로 저장해 주세요.")}return next});
 }
 function onCreate(input:CreateCareerInput){
   try {
     const created=createCareer(input);
     if(career)archive(career);
     setCareer(created);
     setCreator(false);
     setTab("season");
     setOfferId("");
     setReview("pending");
   } catch (error) {
     setToast(error instanceof Error?error.message:"커리어를 만들지 못했어요.");
   }
 }
 function runSeason(){if(!career||busy||career.phase!=="ready")return;playSeason(career)}
 function playSeason(current:Career){setBusy(true);setReview("pending");setProgress(0);let result:Career;try{result=simulateSeason(current)}catch{setBusy(false);setToast("시즌을 완료하지 못했어요. 저장 파일을 확인해 주세요.");return}for(let i=1;i<=4;i++)timers.current.push(setTimeout(()=>setProgress(i),i*350));timers.current.push(setTimeout(()=>{setCareer(result);setBusy(false);setTab("season");setOfferId(result.offers[0]?.id||"");if(result.phase==="retired")archive(result)},1650))}
 function nextSeason(collegeId?:string){
   if(!career||career.phase!=="offseason")return;
   try {
     const next=advanceOffseason(career,career.teamId===null?collegeId:selectedOfferId);
     setCareer(next);
     setReview("pending");
     setOfferId("");
     if(next.phase==="retired"){
       archive(next);
       setTab("hall");
     }else if(career.teamId===null){
       setTab("season");
       if(next.teamId!==null){
         setToast(`${getTeam(next.teamId).name}에 입단했어요.`);
       }else if(next.amateur.college&&!career.amateur.college){
         const collegeName=getCareerAffiliation(next.amateur.college.affiliationId)?.name;
         setToast(collegeName?`${collegeName} 야구부에 진학했어요.`:"대학 야구부에 진학했어요.");
       }else{
         setToast(`${next.year} 아마추어 시즌을 준비해요.`);
       }
     }else{
       setTab("home");
       setToast(`${next.year} 시즌을 준비합니다.`);
     }
   }catch(error){setToast(error instanceof Error?error.message:"다음 단계로 진행하지 못했어요.")}
 }
 function retire(){
   if(!career||busy||career.phase==="retired")return;
   const retired=retireCareer(career);
   setRetiring(false);
   if(retired.phase!=="retired")return;
   setCareer(retired);
   archive(retired);
   go("hall");
 }
 function train(key:string){if(!career||career.phase==="retired")return;if(!career.training.includes(key)&&career.training.length>=2){setToast("집중 육성은 최대 두 개까지 선택할 수 있어요.");return}const t=career.training.includes(key)?career.training.filter(x=>x!==key):[...career.training,key];if(!t.length){setToast("집중 육성을 한 개 이상 선택해 주세요.");return}setCareer({...career,training:t})}
 function exportSave(){if(!career)return;const url=URL.createObjectURL(new Blob([JSON.stringify({format:"bench-to-hall",version:1,career},null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=`벤치에서명예의전당까지-${career.player.name}-${career.year}.json`;a.click();URL.revokeObjectURL(url);setToast("커리어를 파일로 저장했어요.")}
 async function importSave(file?:File){if(!file)return;if(file.size>12000000){setToast("12MB 이하의 저장 파일을 선택해 주세요.");return}try{const value=JSON.parse(await file.text());const c=validateCareer(value.career??value);if(!c)throw Error();if(career)archive(career);setCareer(c);setSettings(false);setTab("home");setOfferId("");setReview("pending");setToast("커리어를 불러왔어요.")}catch{setToast("올바른 커리어 저장 파일을 선택해 주세요.")}if(importRef.current)importRef.current.value=""}
 const go=(id:Tab)=>{setTab(id);window.scrollTo({top:0,behavior:"smooth"})};
 if(creator)return <div className="app-shell creator-shell">
   <Creator initialLeague={initialLeague} onClose={()=>setCreator(false)} onCreate={onCreate} hasCareer={!!career}/>
   {toast&&<div className="toast" role="status">{toast}</div>}
 </div>;
 return <div className={`app-shell site reference-shell slb-clone toss-app ${!career?"is-new":""} ${tab==="season"&&career?.phase==="offseason"&&!reviewed?"showing-result":""}`}>
 <div className="workspace"><header className="t-appbar"><div className="t-appbar-title"><h1>{tab==="home"?"비 더 레전드":tab==="hall"?"명예의 전당":NAV.find(n=>n.id===tab)?.label}</h1>{career&&<span className={`saved ${saving?"":"failed"}`}>{saving?"자동 저장됨":"파일 저장 필요"}</span>}</div><div className="t-header-links"><button className="icon-btn" onClick={()=>setGuide(true)} aria-label="게임 가이드"><BookOpen size={19}/></button><button className="icon-btn" onClick={()=>setSettings(true)} aria-label="설정과 저장"><Settings2 size={19}/></button></div></header>
 <main className="main-content">{!loaded?<div className="loading"><BrandBall size={36}/><p>클럽하우스 문을 열고 있어요.</p></div>:<>
 {tab==="home"&&<>
 {!career ? <section className="t-card home-intro">
   <p className="t-label">아마추어 야구에서 시작해요</p>
   <h2>벤치에서<br/>명예의 전당까지</h2>
   <p className="t-sub">한 시즌의 활약과 선택이 쌓여 커리어가 돼요.<br/>데뷔, 리그 MVP, 명예의 전당까지 도전해 보세요.</p>
 </section> : <section className="t-card current-player">
   <div className="current-player-top">
     <Avatar avatar={career.player.avatar}/>
     <div>
        <p className="t-label">{career.year} {amateurOnly?"아마추어 ":""}시즌 · {career.player.age}세</p>
       <h2>{career.player.name} <span>#{career.player.number}</span></h2>
        <p className="current-affiliation">{amateurOnly&&affiliation&&<AmateurMark id={affiliation.id}/>}<span>{teamName} · {career.player.position}</span></p>
       <span className="t-blue">{STYLE_LABELS[career.player.style]||career.player.style}</span>
     </div>
     <strong className="current-overall"><small>OVR</small>{getOverall(career.player)}</strong>
   </div>
   <div className="t-kv">
      {amateurOnly ? <>
        <div><span>현재 과정</span><b>{amateurCountry?.flag} {college?`대학 ${college.year}학년`:amateurLabel}</b></div>
        <div><span>과정 내 시즌 완료</span><b>{completedStageSeasons} / {stageSeasons}</b></div>
        <div><span>드래프트</span><b>{amateurProgress}</b></div>
     </> : <>
       <div><span>소속 리그</span><b>{league?.name}</b></div>
       <div><span>프로 경력</span><b>{career.history.length}시즌</b></div>
       <div><span>{career.player.role==="batter"?"통산 안타 · 홈런":"통산 승리 · 탈삼진"}</span><b>{career.player.role==="batter"?`${totals!.h}안타 ${totals!.hr}홈런`:`${totals!.w}승 ${totals!.so}탈삼진`}</b></div>
     </>}
   </div>
 </section>}
 <section className="t-card cj" aria-label="커리어 여정">
   <div id="career-journey-scene" className="cj-stage" role="img" aria-label={journeyStage.imageAlt}
     style={{ backgroundPosition: `${(journey % 3) * 50}% ${Math.floor(journey / 3) * 100}%` }} />
   <p className="cj-caption">{journeyStage.caption}</p>
   <ol className="cj-steps">
     {CAREER_JOURNEY_STAGES.map((stage, index) => <li key={stage.label}>
       <button type="button" className={journey === index ? "on" : ""} aria-controls="career-journey-scene"
         onClick={() => setJourney(index)} aria-pressed={journey === index}>
         <span aria-hidden="true" />{stage.label}
       </button>
     </li>)}
   </ol>
 </section>
 <section className="t-card rt-card"><div className="t-card-head"><h3>나의 레전드</h3><button type="button" onClick={()=>go("hall")}>전체 보기 <ChevronRight size={15}/></button></div>{archives.length?<div className="rt-list">{archives.slice().sort((a,b)=>b.score-a.score).slice(0,3).map((c,i)=><button key={c.id} className="rt-row" onClick={()=>go("hall")}><span className="rt-rank">{i+1}</span><Avatar avatar={c.avatar} small/><span className="rt-player"><b>{c.name}</b><small>{c.position} · {c.seasons}시즌</small></span><span className="rt-score">{c.hall&&<Trophy size={15}/>} {c.score}<small>레거시</small></span></button>)}</div>:<div className="rt-empty"><Avatar small/><div><b>첫 번째 전설을 기다리고 있어요</b><p>커리어를 완성하고 이곳에 이름을 남겨 보세요.</p></div></div>}</section>
 {/*<section className="t-card league-list-card"><div className="t-card-head"><h3>네 개의 리그, 나만의 야구 인생</h3></div>{LEAGUES.map(l=><button type="button" className="league-list-row" key={l.id} onClick={()=>setExplore(l.id)}><span className="league-flag">{l.flag}</span><span><b>{l.name}</b><small>{teamsForLeague(l.id).length}개 구단 · {l.games}경기</small></span><ChevronRight size={18}/></button>)}</section>*/}
 <div className="home-fixed-action"><button className="button primary" onClick={()=>!career?start():go(career.phase==="retired"?"hall":"season")}>{!career?"새로운 인생 시작하기":career.phase==="ready"?`${career.year} 시즌 준비하기`:career.phase==="retired"?"나의 레거시 보기":"시즌 결과 확인하기"}</button></div>
 </>}
 {tab==="reactions"&&(!last?<Empty title="아직 들려오는 이야기가 없어요" text="시즌을 마치면 언론과 팬의 반응을 볼 수 있어요." onStart={()=>career?go("season"):start()}/>:<section className="t-card reactions-screen"><h2>{last.year} 시즌의 이야기</h2><div className="rx-feed">{last.news.map((n,i)=><article className={i===0?"rx-press":"rx-fan"} key={i}><div className="rx-meta"><b>{n.source}</b><span>{i===0?"· 기사":"· 팬 반응"}</span></div><p className={i===0?"rx-press-headline":"rx-text"}>{n.title}</p></article>)}<p className="rx-note">시즌 결과를 바탕으로 만들어진 게임 속 가상 반응이에요</p></div></section>)}

 {tab==="season"&&(!career
   ? <Empty title="첫 시즌을 시작해 보세요" text="고교 야구부나 아카데미에서 첫 시즌을 뛰어요." onStart={()=>start()}/>
   : <>
     <div className="page-heading">
       <div>
          <span className="eyebrow">{amateurOnly?(college?`대학 ${college.year}학년`:`아마추어 ${career.season}년 차`):`SEASON ${String(career.season).padStart(2,"0")}`}</span>
         <h1>{career.phase==="ready"?`${career.year}, 새로운 시즌의 문 앞에서.`:career.phase==="retired"?"마지막 이닝까지, 수고했어요.":`${last?.year} 시즌, 이렇게 기억될 거예요.`}</h1>
       </div>
        <span className="league-tag">{amateurOnly?`${amateurCountry?.flag??""} ${amateurLabel}`:`${league?.flag} ${career.leagueId}`}</span>
     </div>
     {career.phase==="ready" ? <><div className="season-prep">
       <section className="panel prep-main">
         <div className="prep-team">
            {career.teamId!==null ? <TeamMark id={career.teamId} large/> : <AmateurMark id={affiliation?.id??career.amateur.affiliationId} large/>}
           <div>
              <span className="eyebrow">{amateurOnly?`${affiliation?.region} · ${amateurLabel}`:`${league?.country} · ${league?.name}`}</span>
             <h2>{teamName}</h2>
              <p>{career.player.position} · {career.player.age}세 · {amateurOnly&&college?`${college.year}학년`:`${career.season}년 차`}</p>
           </div>
           <span className="prep-number">{career.year}</span>
         </div>
         <div className="line"/>
         <h3>이번 시즌, 무엇을 키울까요?</h3>
         <p className="muted">집중할 능력치를 최대 두 개 골라 주세요.</p>
         <div className="training-grid">
           {attrs.map(key=><button key={key} className={`training-chip ${career.training.includes(key)?"selected":""}`} aria-pressed={career.training.includes(key)} onClick={()=>train(key)}>
             {ATTRIBUTE_LABELS[key]}<strong>{Math.round(career.player.attributes[key])}</strong>{career.training.includes(key)&&<Check size={15}/>}
           </button>)}
         </div>
         <h3>나의 시즌 운영</h3>
         <div className="plan-options">
           {PLANS.map(p=><button key={p.id} className={`plan-option ${career.plan===p.id?"selected":""}`} onClick={()=>setCareer({...career,plan:p.id})} aria-pressed={career.plan===p.id}>
             <p.icon size={22}/><strong>{p.name}</strong><small>{p.text}</small><span className="radio-circle">{career.plan===p.id&&<span/>}</span>
           </button>)}
         </div>
         <div className="season-launch">
           <div><strong>준비가 됐다면, 플레이볼.</strong><p>한 시즌의 출전, 성장, 이야기까지 한 번에 진행해요.</p></div>
            <button className="button primary" onClick={runSeason} disabled={busy}><Play size={17} fill="currentColor"/>{career.year} {amateurOnly?(college?"대학 ":"아마추어 "):""}시즌 보내기</button>
         </div>
       </section>
       <aside className="prep-aside">
         <section className="panel condition-card">
           <span className="eyebrow">PLAYER CONDITION</span><h3>좋은 시즌은 좋은 몸에서</h3>
           {[{label:"건강",value:career.health,icon:Heart},{label:"피로",value:career.fatigue,icon:CircleDot},{label:"자신감",value:career.morale,icon:Star}].map(c=><div className="condition" key={c.label}>
             <span><c.icon size={15}/>{c.label}</span><strong>{Math.round(c.value)}<small>/100</small></strong>
             <div><i style={{width:`${c.value}%`,background:c.label==="피로"?"var(--orange)":"var(--green)"}}/></div>
           </div>)}
         </section>
          {!amateurOnly&&<section className="contract-note">
           <ArrowLeftRight size={23}/><h3>계약은 또 하나의 선택</h3>
           <p>높은 연봉, 더 많은 출전, 새로운 리그. 다음 무대를 골라보세요.</p>
           <div><span>현재 연봉</span><strong>{money(career.salary)}</strong></div>
           <div><span>계약 잔여</span><strong>{career.contractYears}년</strong></div>
         </section>}
       </aside>
     </div>
       <button type="button" className="button secondary wide-button" onClick={()=>setRetiring(true)} disabled={busy}>지금 은퇴하기</button>
     </> : <>
       {last&&!reviewed&&<SeasonResultView result={last} onDetail={()=>setDetail(last)}/>}
        {career.phase==="offseason"&&reviewed&&(draft
          ? <DraftResultView result={draft} stage={draftStage} college={!!college} finalDraft={finalDraft}
              admissions={latestAmateurSeason?.admissions} onContinue={nextSeason}/>
          : amateurOnly
         ? <section className="panel offer-section">
             <div className="section-heading">
               <div>
                  <span className="eyebrow">{amateurLabel} · {completedStageSeasons}/{stageSeasons}시즌 완료</span>
                 <h2>{affiliation?.name}에서 계속 뛰어요</h2>
               </div>
               <CalendarDays size={25}/>
             </div>
             <div className="offer-actions"><button className="button primary" onClick={()=>nextSeason()}>다음 아마추어 시즌으로 <ArrowRight size={18}/></button></div>
           </section>
         : career.teamId!==null&&<ProfessionalOffseason career={career} offers={transferOffers} selectedId={selectedOfferId}
             onSelect={setOfferId} onContinue={()=>nextSeason()}/>)}
        {career.phase==="offseason"&&!reviewed&&<div className="result-fixed-action"><button type="button" className="button primary"
          disabled={drafting} onClick={()=>setReview(draft?"drafting":"revealed")}>{draft?"드래프트 결과 보기":"확인"}</button></div>}
       {career.phase==="retired"&&<button className="button primary wide-button" onClick={()=>go("hall")}><Trophy size={19}/> 나의 레거시 보기</button>}
     </>}
   </>)}

  {tab==="player"&&(!career
    ? <Empty title="아직 유니폼의 주인이 없어요" text="당신만의 이름과 스타일을 가진 선수를 만들어 보세요." onStart={()=>start()}/>
    : <>
      <div className="page-heading"><div><span className="eyebrow">SCOUTING REPORT</span><h1>숫자에 담긴, 나의 가능성.</h1></div><span className="muted small">선수 리포트</span></div>
      <div className="player-page-grid">
        <section className="player-card">
          <span className="eyebrow">PLAYER CARD</span><span className="card-number">{String(career.player.number).padStart(2,"0")}</span>
          <Avatar avatar={career.player.avatar}/><h2>{career.player.name}</h2>
          <p>{career.player.nationality} · {career.player.age}세 · {career.player.hand}</p>
          <div className="player-card-team">
            {career.teamId!==null?<TeamMark id={career.teamId}/>:<AmateurMark id={affiliation?.id??career.amateur.affiliationId}/>} {teamName}
          </div>
          {originalAffiliation&&(!amateurOnly||college)&&<p className="player-start-affiliation">시작 소속 · {originalAffiliation.name}</p>}
          <div className="card-ovr"><span>OVR</span><strong>{getOverall(career.player)}</strong><div><span>{career.player.position}</span><small>{STYLE_LABELS[career.player.style]||career.player.style}</small></div></div>
        </section>
        <section className="panel attributes-panel">
          <div className="section-heading"><div><span className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</span><h2>{career.player.role==="batter"?"타자 능력치":"투수 능력치"}</h2></div><Target size={23}/></div>
          {attrs.map(key=><div className="attribute-row" key={key}><span>{ATTRIBUTE_LABELS[key]}{career.training.includes(key)&&<Target size={12}/>}</span><div><i style={{width:`${career.player.attributes[key]}%`}}/></div><strong>{Math.round(career.player.attributes[key])}</strong></div>)}
          <div className="attribute-footer"><span><Target size={14}/> 집중 육성 중</span><p>시즌 준비 화면에서 육성 방향을 바꿀 수 있어요.</p></div>
        </section>
      </div>
      <div className="quick-stats">
        {amateurOnly?<StatTile label="과정 내 시즌 완료" value={`${completedStageSeasons} / ${stageSeasons}`} detail={amateurLabel}/>
          :<StatTile label="현재 연봉" value={money(career.salary)} detail={`계약 ${career.contractYears}년 남음`}/>}
        <StatTile label="최고 능력치" value={totals!.peakOverall} detail="커리어 최고 OVR"/>
        {amateurOnly?<StatTile label="아마추어 출전 경기" value={amateurGames} detail="완료 시즌 누적"/>
          :<StatTile label="프로 출전 경기" value={totals!.g} detail={`${career.history.length}시즌 누적`}/>}
        {amateurOnly?<StatTile label="드래프트" value={amateurProgress}/>
          :<StatTile label="레거시 점수" value={career.hallScore} detail={`명예의 전당 기준 ${HALL_THRESHOLD}점`}/>}
      </div>
      {career.phase!=="retired"&&career.history.length>0&&<section className="retire-panel">
        <div><h3>마지막 인사를 준비하고 있나요?</h3><p>커리어를 마무리하고 나만의 레거시를 확인할 수 있어요.</p></div>
        <button className="button secondary" onClick={()=>setRetiring(true)}>은퇴 결정하기 <ArrowRight size={16}/></button>
      </section>}
    </>)}

 {tab==="records"&&(!career||(!career.history.length&&!amateur?.history.length)
   ? <Empty title="아직 시즌 기록이 없어요" text={career?"첫 시즌을 마치면 이곳에서 성적을 볼 수 있어요.":"선수를 만들고 첫 시즌의 기록을 남겨 보세요."} onStart={()=>career?go("season"):start()}/>
   : <>
     <div className="page-heading">
       <div><h1>시즌별 야구 기록</h1></div>
       <button className="button secondary small-button" onClick={exportSave}><Download size={15}/> 기록 저장</button>
     </div>
     {career.history.length>0&&<>
       <div className="quick-stats">
         {career.player.role==="batter"?<>
           <StatTile label="프로 통산 타율" value={decimal(totals!.avg)}/><StatTile label="프로 통산 안타" value={totals!.h}/><StatTile label="프로 통산 홈런" value={totals!.hr}/><StatTile label="프로 통산 OPS" value={decimal(totals!.ops)}/>
         </>:<>
           <StatTile label="프로 통산 평균자책점" value={totals!.era.toFixed(2)}/><StatTile label="프로 통산 승리" value={totals!.w}/><StatTile label="프로 통산 탈삼진" value={totals!.so}/><StatTile label="프로 통산 이닝" value={totals!.innings}/>
         </>}
       </div>
       <RecordsTable title="프로 시즌 성적" role={career.player.role} seasons={career.history.filter(season=>recordLeague==="all"||season.leagueId===recordLeague)} onDetail={setDetail} filter={
         <select aria-label="기록 리그 필터" value={recordLeague} onChange={event=>setRecordLeague(event.target.value)}>
           <option value="all">모든 리그</option>{LEAGUES.map(l=><option key={l.id}>{l.id}</option>)}
         </select>
       }/>
       <section className="panel">
         <div className="section-heading"><h2>트로피 캐비닛</h2><Trophy size={22}/></div>
         {career.awards.length?<div className="awards-grid">{career.awards.map((award,index)=><div className="award-card" key={index}><Award size={28}/><small>{award.year} · {award.leagueId}</small><strong>{award.name}</strong></div>)}</div>:<p className="muted">첫 트로피가 놓일 자리를 비워 두었어요. 다음 시즌을 기대해 볼까요?</p>}
       </section>
     </>}
     {amateur&&amateur.history.length>0&&<RecordsTable title="아마추어 시즌 성적" role={career.player.role} seasons={amateur.history} onDetail={setDetail}/>}
   </>)}

 {tab==="hall"&&<><div className="page-heading"><div><span className="eyebrow">THE GAME ENDS. THE LEGACY DOESN’T.</span><h1>기록을 넘어, 이름을 남기다.</h1></div><Trophy size={28} className="gold-icon"/></div><section className="hall-hero"><span className="hall-laurel">❧</span><span className="eyebrow">HALL OF FAME</span><h2>명예의 전당</h2><p>유니폼은 바뀌어도, 그라운드에 남긴 이야기는 영원합니다.</p><div className="hall-line"><span/><BrandBall size={26}/><span/></div>{career?.phase==="retired"?<div className="retirement-result"><Avatar avatar={career.player.avatar}/><span className="hall-result-badge">{career.retirement?.hallOfFame?"명예의 전당 헌액":"나의 커리어, 그 마지막 장"}</span><h3>{career.player.name}</h3><strong>{career.retirement?.title}</strong><p>{career.retirement?.summary}</p><div className="retirement-numbers"><span><b>{amateurOnly?amateur?.history.length:career.history.length}</b>시즌</span><span><b>{amateurOnly?amateurGames:totals?.g}</b>경기</span><span><b>{career.hallScore}</b>레거시 점수</span></div><button className="button gold-button" onClick={()=>start()}>새로운 전설 시작하기 <ArrowRight size={17}/></button></div>:<div className="hall-invitation"><Trophy size={52}/><h3>언젠가, 이곳에 당신의 이름이.</h3><p>오랜 활약과 특별한 기록, 수상의 순간이 모여 레거시가 됩니다.<br/>은퇴 후 명예의 전당에 도전해 보세요.</p>{career&&<div className="hall-progress"><span style={{width:`${Math.min(100,career.hallScore/HALL_THRESHOLD*100)}%`}}/></div>}{career&&<small>레거시 {career.hallScore} / {HALL_THRESHOLD}</small>}<button className="button gold-button" onClick={()=>career?go("season"):start()}>{career?"나의 커리어 이어가기":"첫 번째 발자국 남기기"}<ArrowRight size={17}/></button></div>}</section><section className="panel hall-archives"><div className="section-heading"><div><span className="eyebrow">MY LEGENDS</span><h2>나의 야구 인생들</h2></div><span className="muted small">보관한 커리어 요약</span></div>{archives.length?<div className="archive-grid">{archives.map(c=><article className="archive-card" key={c.id}><Avatar avatar={c.avatar} small/><div><small>{c.start} — {c.end}</small><h3>{c.name}</h3><p>{c.seasons}시즌 · {c.position} · {c.hall?"명예의 전당":"나만의 레거시"}</p></div><span className="archive-score">{c.score}<small>LEGACY</small></span></article>)}</div>:<div className="archive-empty"><Star size={23}/><p>첫 번째 야구 인생을 완성해 보세요.</p></div>}<p className="hall-footnote">게임 내 통합 명예의 전당으로, 실제 리그의 헌액 제도와 별도로 평가합니다.</p></section></>}
 <footer className="kickru-footer"><p>비 더 레전드</p><nav aria-label="게임 안내"><button onClick={()=>setGuide(true)}>게임 가이드</button><button onClick={()=>go("hall")}>명예의 전당</button><button onClick={()=>setSettings(true)}>저장 설정</button></nav><small>© 2026 · 구단·리그 명칭의 권리는 각 권리자에게 있습니다.</small></footer></>}
 </main></div><nav className="mobile-nav t-tabbar" aria-label="메뉴">{NAV.map(n=><button key={n.id} className={tab===n.id?"active":""} onClick={()=>go(n.id)}><n.icon size={20}/><span>{n.label}</span></button>)}</nav>

 {guide&&<Modal title="한 선수의 인생, 당신의 선택으로" onClose={()=>setGuide(false)}><div className="guide-steps">{[{n:"01",title:"나의 유니폼을 고르세요",text:"시작 국가와 고교 야구부 또는 아카데미를 고르고, 타자·투수와 육성 방향을 정해요."},{n:"02",title:"한 시즌을 살아보세요",text:"훈련과 운영 방식을 선택하고 시즌을 보내면 출전과 경기 기록, 성장과 이야기가 펼쳐집니다."},{n:"03",title:"드래프트에서 프로에 도전하세요",text:"고교·아카데미 과정을 마치고 지명되면 해당 구단에 입단해요. 미지명되면 합격한 대학을 골라 진학하고, 4학년까지 매 시즌 드래프트에 도전해요."},{n:"04",title:"당신만의 전설을 남기세요",text:"기록과 수상이 레거시 점수가 됩니다. 은퇴 후 게임 내 명예의 전당에 도전하세요. 어느 리그에 남아도 전설이 될 수 있어요."}].map(g=><div key={g.n}><span>{g.n}</span><div><h3>{g.title}</h3><p>{g.text}</p></div></div>)}</div><div className="guide-note"><Shield size={19}/><p>실제 학교·아카데미와 구단을 무대로 가상 선수가 활약합니다. 일정·드래프트·계약·등록·시상은 게임용으로 간소화했으며 실제 경기 결과와 무관합니다. 진행은 이 브라우저에 저장되고 설정에서 파일로 옮길 수 있어요.</p></div><button className="button primary wide-button" onClick={()=>setGuide(false)}>알겠어요, 플레이볼 <BrandBall size={19}/></button></Modal>}
 {settings&&<Modal title="나의 클럽하우스 설정" onClose={()=>setSettings(false)}><div className="settings-section"><h3>커리어를 안전하게 보관하세요</h3><p>진행은 이 브라우저에 자동 저장돼요. 다른 기기에서 이어 하려면 저장 파일을 옮겨 주세요.</p><div className="settings-buttons"><button className="button primary" onClick={exportSave} disabled={!career}><Download size={18}/> 파일로 저장</button><button className="button secondary" onClick={()=>importRef.current?.click()}><Upload size={18}/> 파일 불러오기</button></div></div><div className="settings-section"><h3>또 다른 야구 인생</h3><p>새 선수를 만들면 현재 커리어의 요약을 보관합니다. 상세 기록을 남기려면 먼저 파일로 저장하세요.</p><button className="button secondary" onClick={()=>{setSettings(false);start()}}><Plus size={18}/> 새로운 커리어 시작</button></div><div className="guide-note"><BookOpen size={18}/><p>구단·리그 명칭의 권리는 각 권리자에게 있습니다. 비공식 야구 커리어 시뮬레이션 · v1.0</p></div></Modal>}
 {explore&&<Modal title={`${explore}, 당신이 뛸 무대`} onClose={()=>setExplore(null)} wide><div className="league-explore-head"><span>{getLeague(explore).flag}</span><div><h3>{getLeague(explore).name}</h3><p>{getLeague(explore).description}</p></div><strong>{teamsForLeague(explore).length}<small>CLUBS</small></strong></div><div className="team-explore-grid">{teamsForLeague(explore).map(t=><div key={t.id}><TeamMark id={t.id}/><span>{t.name}</span></div>)}</div><div className="explore-footer"><p>{career?"다른 리그 진출은 시즌 종료 후 계약 제안에서 선택할 수 있어요.":"아마추어 시즌을 마치고 첫 프로 계약에 도전해요."}</p><button className="button primary" onClick={()=>{const l=explore;setExplore(null);if(!career)start(l);else go("season")}}>{career?"나의 시즌으로":"아마추어부터 시작하기"}<ArrowRight size={18}/></button></div></Modal>}
 {detail&&<Modal title={`${detail.year} ${"affiliationId" in detail?"아마추어 ":""}시즌 상세 기록`} onClose={()=>setDetail(null)} wide>
   <SeasonDetail result={detail} showDraft={!draft||reviewed||detail.year!==latestAmateurSeason?.year}/>
 </Modal>}
 {retiring&&<Modal title="유니폼을 내려놓을 준비가 됐나요?" onClose={()=>setRetiring(false)}><p className="retire-confirm">지금까지의 기록으로 커리어를 마무리합니다. 은퇴한 커리어는 보관함에 요약이 남고, 이어서 시즌을 진행할 수는 없어요.</p><div className="settings-buttons"><button className="button secondary" onClick={()=>setRetiring(false)}>아직 더 뛸래요</button><button className="button primary" onClick={retire}>은퇴하고 레거시 보기</button></div></Modal>}
 {busy&&<Modal title="당신의 시즌이 펼쳐지고 있어요" onClose={()=>{}} locked><div className="sim-progress"><span className="spinning-ball"><BrandBall size={52}/></span><h3>{["스프링캠프의 문을 열어요","첫 타석, 첫 마운드를 지나","한 경기씩 기록을 쌓고 있어요","땀방울이 성장으로 바뀝니다","시즌의 마지막 페이지를 정리해요"][progress]}</h3><div className="sim-track"><i style={{width:`${Math.min(100,progress*25+8)}%`}}/></div><p>{career?.player.name} 선수의 {career?.year} 시즌</p></div></Modal>}
 {drafting&&draft&&<Modal title="드래프트 진행 중" onClose={()=>{}} locked>
   <div className="sim-progress">
     <span className="spinning-ball" aria-hidden="true"><BrandBall size={52}/></span>
     <p>{draft.leagueId} 신인 드래프트</p>
   </div>
 </Modal>}
 <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={e=>importSave(e.target.files?.[0])}/>{toast&&<div className="toast" role="status"><CheckCircle2 size={18}/>{toast}</div>}
 </div>
}
