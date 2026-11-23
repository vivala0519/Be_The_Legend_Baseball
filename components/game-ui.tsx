"use client";
import {useEffect,useRef,useState,type ReactNode,type CSSProperties} from "react";
import Image from "next/image";
import {X,ArrowRight,GraduationCap} from "lucide-react";
import {getSchoolOpponent} from "@/lib/amateur";
import {getCollegeAffiliation} from "@/lib/amateur-college";
import {getAmateurMark} from "@/lib/amateur-marks";
import {AVATAR_OPTIONS,DEFAULT_AVATAR_ID} from "@/lib/avatars";
import {getCollegeMark} from "@/lib/college-marks";
import {getTeam} from "@/lib/leagues";
export function BrandBall({size=27}:{size?:number}){return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2"/><path d="M8 7c15 5 15 21 0 26M32 7c-15 5-15 21 0 26" stroke="currentColor" strokeWidth="1.6"/><path d="m11 10-2 3m5 1-3 3m4 2-3 2m2 3-3 2m18-16 2 3m-5 1 3 3m-4 2 3 2m-2 3 3 2" stroke="currentColor" strokeWidth="1.4"/></svg>}
export function TeamMark({id,large=false}:{id:string;large?:boolean}){const t=getTeam(id);return <span className={`team-mark ${large?"large":""}`} style={{"--team":t.color} as CSSProperties}>{t.shortName.slice(0,2)}</span>}
export function AmateurMark({id,large=false}:{id:string;large?:boolean}) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const affiliation = getSchoolOpponent(id);
  const college = getCollegeAffiliation(id);
  const mark = college ? getCollegeMark(id) : affiliation ? getAmateurMark(affiliation) : undefined;
  const showMark = mark && failedSrc !== mark.src;
  const name = (affiliation?.name ?? college?.name)?.replace(/\s*(고등학교|고교|高等学校|高校|high school|school|대학교|대학)$/iu, "").trim();
  const initials = name && college && /^[A-Z]{2,4}$/.test(name) ? name
    : name ? Array.from(name.replace(/\s/g, "")).slice(0, 2).join("").toUpperCase() : "";
  const school = affiliation?.kind === "school" || !!college;
  return <span className={`team-mark amateur-mark${large ? " large" : ""}${showMark ? " has-image" : ""}`} style={{"--team": school ? "#2867c7" : "#117c65"} as CSSProperties} aria-hidden="true">
    {showMark ? <Image src={mark.src} width={large ? 40 : 26} height={large ? 40 : 26} alt="" unoptimized onError={() => setFailedSrc(mark.src)} />
      : school ? (initials || <GraduationCap size={large ? 25 : 17} />) : <BrandBall size={large ? 28 : 19} />}
  </span>;
}
export function Avatar({avatar=DEFAULT_AVATAR_ID,small=false}:{avatar?:number;small?:boolean}) {
  const avatarId = avatar === 0 ? DEFAULT_AVATAR_ID : avatar;
  const option = AVATAR_OPTIONS.find(({id}) => id === avatarId);
  const sizeClass = small ? " small" : "";
  if (option) {
    const column = option.slot % 4;
    const row = Math.floor(option.slot / 4);
    return <span className={`avatar avatar-atlas${sizeClass}`} role="img" aria-label={option.label}>
      <span className="avatar-sprite" style={{
        backgroundImage: `url("${option.sheet}")`,
        backgroundPosition: `${column / 3 * 100}% ${row / 3 * 100}%`,
      }} />
    </span>;
  }
  return <span className={`avatar${sizeClass}`}>
    <img src="/baseball-avatar.svg" alt="나의 야구 선수" style={{filter:`hue-rotate(${avatar * 22}deg)`}}/>
  </span>;
}
export function Modal({title,children,onClose,wide=false,locked=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean;locked?:boolean}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{const d=ref.current;d?.showModal();document.body.style.overflow="hidden";return()=>{d?.close();document.body.style.overflow=""}},[]);return <dialog ref={ref} className={`dialog ${wide?"wide":""}`} onCancel={e=>{e.preventDefault();if(!locked)onClose()}} onClick={e=>{if(!locked&&e.target===e.currentTarget)onClose()}} aria-label={title}><div className="dialog-head"><div><h2>{title}</h2></div>{!locked&&<button className="icon-btn" onClick={onClose} aria-label="닫기"><X size={21}/></button>}</div>{children}</dialog>}
export function StatTile({label,value,detail}:{label:string;value:ReactNode;detail?:ReactNode}){return <div className="stat-tile"><span>{label}</span><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>}
export function Empty({title,text,onStart}:{title:string;text:string;onStart:()=>void}){return <div className="empty-state"><span className="empty-icon"><BrandBall size={44}/></span><h2>{title}</h2><p>{text}</p><button className="button primary" onClick={onStart}>나의 이야기 시작하기 <ArrowRight size={18}/></button></div>}
export const money=(v:number)=>v>=10000?`${(v/10000).toFixed(v%10000?1:0)}억원`:`${Math.round(v).toLocaleString()}만원`;
export const decimal=(v:number)=>Number.isFinite(v)?v.toFixed(3).replace(/^0/,""):".000";
