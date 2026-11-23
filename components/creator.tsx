"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Shuffle } from "lucide-react";
import { BATTER_POSITIONS, BatterPositionPicker } from "@/components/batter-position-picker";
import { AmateurMark, Avatar, Modal } from "@/components/game-ui";
import { AffiliationPicker, CreatorSelect } from "@/components/creator-pickers";
import { AMATEUR_COUNTRIES, AMATEUR_COUNTRY_CODES, getAmateurAffiliations, type AmateurCountry } from "@/lib/amateur";
import { getAmateurMark } from "@/lib/amateur-marks";
import { AVATAR_OPTIONS_BY_ROLE } from "@/lib/avatars";
import { ATTRIBUTE_LABELS, BATTER_ATTRIBUTES, PITCHER_ATTRIBUTES, createCareer, getOverall } from "@/lib/game";
import type { CreateCareerInput, PlayerRole } from "@/lib/game-types";
import { getLeague, teamsForLeague, type LeagueId } from "@/lib/leagues";

interface CreatorProps {
  initialLeague: LeagueId;
  onClose: () => void;
  onCreate: (input: CreateCareerInput) => void;
  hasCareer: boolean;
}

const PITCHER_POSITIONS = [
  { value: "SP", label: "선발 투수" }, { value: "RP", label: "불펜 투수" }, { value: "CP", label: "마무리 투수" },
] as const;
const ROLE_LABELS = { batter: "타자", pitcher: "투수" };
const INITIAL_COUNTRY: Record<LeagueId, AmateurCountry> = { KBO: "KR", NPB: "JP", MLB: "US", CPBL: "TW" };
const COUNTRY_OPTIONS = AMATEUR_COUNTRY_CODES.map(code => ({
  value: code, label: AMATEUR_COUNTRIES[code].label, icon: AMATEUR_COUNTRIES[code].flag,
}));
const NATIONALITY_OPTIONS = COUNTRY_OPTIONS.map(option => ({ ...option, value: option.label }));
const STYLES = {
  batter: [
    { id: "contact", name: "정교한 컨택형", description: "컨택 · 선구안 · 정확한 타격", targets: ["contact", "eye"] },
    { id: "power", name: "파워 히터", description: "파워 · 송구 · 장타", targets: ["power", "arm"] },
    { id: "speed", name: "올라운드 플레이어", description: "주루 · 수비 · 빠른 발", targets: ["speed", "fielding"] },
  ],
  pitcher: [
    { id: "velocity", name: "파이어볼러", description: "구속 · 구위 · 빠른 공", targets: ["velocity", "stuff"] },
    { id: "control", name: "컨트롤 피처", description: "제구 · 변화구 · 정교함", targets: ["control", "breaking"] },
    { id: "breaking", name: "브레이킹볼 마스터", description: "변화구 · 구위 · 타이밍", targets: ["breaking", "stuff"] },
  ],
};
const STEP_NAMES = ["선수 모습", "선수 정보", "플레이 스타일", "집중 육성"];
const CTA = ["이 아바타로 할게요", "다음", "이 스타일로 할게요", "선수 만들기"];

export default function Creator({ initialLeague, onClose, onCreate, hasCareer }: CreatorProps) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("7");
  const [nationality, setNationality] = useState("대한민국");
  const [role, setRole] = useState<PlayerRole>("batter");
  const [position, setPosition] = useState("CF");
  const [hand, setHand] = useState("우투우타");
  const [avatars, setAvatars] = useState<Record<PlayerRole, number>>({
    batter: AVATAR_OPTIONS_BY_ROLE.batter[0].id,
    pitcher: AVATAR_OPTIONS_BY_ROLE.pitcher[0].id,
  });
  const [countryCode, setCountryCode] = useState(INITIAL_COUNTRY[initialLeague]);
  const [affiliationId, setAffiliationId] = useState("");
  const [style, setStyle] = useState("contact");
  const [training, setTraining] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const avatarOptions = AVATAR_OPTIONS_BY_ROLE[role];
  const avatar = avatars[role];
  const attributes = role === "batter" ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
  const positions = role === "batter" ? BATTER_POSITIONS : PITCHER_POSITIONS;
  const positionName = positions.find(option => option.value === position)?.label ?? position;
  const hands = role === "batter" ? ["우투우타", "우투좌타", "좌투우타", "좌투좌타", "우투양타", "좌투양타"] : ["우투", "좌투"];
  const styleName = STYLES[role].find(candidate => candidate.id === style)?.name || style;
  const country = AMATEUR_COUNTRIES[countryCode];
  const affiliations = getAmateurAffiliations(countryCode);
  const affiliation = affiliations.find(entry => entry.id === affiliationId);
  const affiliationMark = affiliation ? getAmateurMark(affiliation) : undefined;
  const affiliationLabel = country.kind === "school" ? "고교 야구부" : "야구 아카데미";
  const proLeague = getLeague(country.leagueId);
  const candidates = useMemo(() => STYLES[role].map(candidate => ({ ...candidate, player: createCareer({
    name: name || "새로운 선수", role, position, hand, nationality,
    leagueId: initialLeague, teamId: teamsForLeague(initialLeague)[0].id,
    number: Number(number) || 0, avatar, style: candidate.id, seed: 0,
  }).player })), [role, position, hand, nationality, initialLeague, number, avatar, name]);
  const selected = candidates.find(candidate => candidate.id === style) || candidates[0];

  function toStep(next: number) {
    setError("");
    setStep(next);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }

  function changeRole(next: PlayerRole) {
    if (next === role) return;
    setRole(next);
    setPosition(next === "batter" ? "CF" : "SP");
    setHand(next === "batter" ? "우투우타" : "우투");
    setStyle(next === "batter" ? "contact" : "velocity");
    setTraining([]);
    setError("");
  }

  function toggleTraining(key: string) {
    if (training.includes(key)) {
      setTraining(training.filter(value => value !== key));
      setError("");
    } else if (training.length < 2) {
      setTraining([...training, key]);
      setError("");
    } else {
      setError("최대 2개까지 고를 수 있어요. 먼저 하나를 해제해 주세요.");
    }
  }

  function nextStep() {
    if (step === 1) {
      if (!name.trim()) {
        setError("선수의 이름을 입력해 주세요.");
        nameRef.current?.focus();
        return;
      }
      if (number === "" || !Number.isInteger(Number(number)) || Number(number) < 0 || Number(number) > 99) {
        setError("등번호는 0부터 99 사이의 정수로 입력해 주세요.");
        return;
      }
      if (!affiliation) {
        setError("시작 소속을 선택해 주세요.");
        return;
      }
    }
    if (step === 3) {
      if (!training.length) { setError("집중해서 키울 능력치를 한 개 이상 골라 주세요."); return; }
      setError("");
      setConfirm(true);
      return;
    }
    toStep(Math.min(3, step + 1));
  }

  function create() {
    if (!affiliation) return;
    onCreate({ name: name.trim().slice(0, 16), number: Number(number), avatar, nationality, role,
      position, hand, amateurAffiliationId: affiliation.id, style, training: [...training] });
  }

  function randomProfile() {
    const names = ["김도윤", "이서준", "박지호", "정시우", "강민준", "최이준", "오현우", "윤도현"];
    setName(names[Math.floor(Math.random() * names.length)]);
    setNumber(String(Math.floor(Math.random() * 99) + 1));
    setError("");
  }

  return <section className={`creator-screen creator-step-${step}`}>
    <header className="creator-header">
      <button type="button" className="icon-btn creator-back" onClick={() => step === 0 ? onClose() : toStep(step - 1)} aria-label={step === 0 ? "처음으로" : "이전 단계"}><ArrowLeft size={23} /></button>
      <ol className="creator-dots" aria-label="선수 생성 단계">
        {STEP_NAMES.map((label, index) => <li key={label} className={index <= step ? "active" : ""} aria-current={step === index ? "step" : undefined}><span className="sr-only">{label}{index === step ? " (현재 단계)" : ""}</span></li>)}
      </ol>
      {step === 1 && <button type="button" className="text-button creator-random" onClick={randomProfile}><Shuffle size={15} />랜덤</button>}
    </header>

    <form onSubmit={event => { event.preventDefault(); nextStep(); }} noValidate>
      <div className="creator-content" ref={contentRef}>
        <div className="creator-heading">
          <p>{step === 0 ? "나의 야구 인생을 시작해요" : step === 1 ? `${country.startAge}세 · 아마추어 ${ROLE_LABELS[role]}` : step === 2 ? `${name} · ${positionName}` : `${styleName} · OVR ${getOverall(selected.player)}`}</p>
          <h1>{step === 0 ? "선수의 모습을 골라 주세요" : step === 1 ? "어떤 선수로 살아볼까요?" : step === 2 ? <>플레이 스타일을<br />골라 주세요</> : <>집중해서 키울 능력치를<br />골라 주세요</>}</h1>
          {step === 2 && <p>세 후보 모두 OVR 45에서 시작하고, 능력치 분포만 달라요.</p>}
          {step === 3 && <p>최대 2개까지 고를 수 있어요. 고른 능력치에 훈련을 집중합니다.</p>}
        </div>

        {step === 0 && <div className="creator-avatar-step">
          <fieldset className="creator-role-field">
            <legend className="sr-only">선수 유형</legend>
            <div className="segmented">
              {(["batter", "pitcher"] as const).map(option => <button type="button" key={option}
                className={role === option ? "selected" : ""} aria-pressed={role === option} onClick={() => changeRole(option)}>
                {ROLE_LABELS[option]}
              </button>)}
            </div>
          </fieldset>
          <div className="creator-avatar-preview">
            <div className="creator-avatar-stage" aria-hidden="true"><Avatar avatar={avatar} /></div>
          </div>
          <fieldset className="creator-avatar-options">
            <legend className="sr-only">선수 아바타</legend>
            {avatarOptions.map(option => <label className="creator-avatar-option" key={option.id}>
              <input className="sr-only" type="radio" name={`${id}-avatar`} value={option.id}
                checked={avatar === option.id} onChange={() => setAvatars(previous => ({ ...previous, [role]: option.id }))} />
              <span className="creator-avatar-tile" aria-hidden="true">
                <Avatar avatar={option.id} small />
                {avatar === option.id && <span className="creator-avatar-check"><Check size={12} strokeWidth={3} /></span>}
              </span>
              <span className="sr-only">{option.label}</span>
            </label>)}
          </fieldset>
        </div>}

        {step === 1 && <div className="creator-profile-form">
          <label className="field-label" htmlFor={`${id}-name`}>이름<input id={`${id}-name`} ref={nameRef} autoFocus maxLength={16} required autoComplete="off" value={name} onChange={event => { setName(event.target.value); setError(""); }} placeholder=" " aria-invalid={!!error && !name.trim()} aria-describedby={error ? `${id}-error` : undefined} /></label>
          <label className="field-label" htmlFor={`${id}-number`}>등번호<input id={`${id}-number`} type="number" inputMode="numeric" min={0} max={99} step={1} value={number} onChange={event => { setNumber(event.target.value); setError(""); }} /></label>
          {role === "batter"
            ? <BatterPositionPicker value={position} onChange={setPosition} />
            : <CreatorSelect label="포지션" value={position} options={PITCHER_POSITIONS} onChange={setPosition} />}
          <CreatorSelect key={role} label="투타" value={hand} options={hands.map(value => ({ value, label: value }))} onChange={setHand} />
          <CreatorSelect label="국적" value={nationality} options={NATIONALITY_OPTIONS} onChange={setNationality} />
          <CreatorSelect label="시작 국가" value={countryCode} options={COUNTRY_OPTIONS} onChange={value => {
            setCountryCode(value as AmateurCountry);
            setAffiliationId("");
            setError("");
          }} />
          <AffiliationPicker key={countryCode} label={affiliationLabel} choices={affiliations} selected={affiliation}
            describedBy={`${id}-amateur-route`} onChange={value => { setAffiliationId(value); setError(""); }} />
          <p className="muted small" id={`${id}-amateur-route`}>{country.startAge + country.seasons - 1}세 시즌을 마치면 {proLeague.name} 신인 드래프트에 참가해요. 미지명되면 대학별 합격 결과를 확인해요.</p>
        </div>}

        {step === 2 && <div className="creator-style-cards" aria-label="플레이 스타일">
          {candidates.map(candidate => <button type="button" key={candidate.id} className={`creator-style-card ${style === candidate.id ? "selected" : ""}`} aria-pressed={style === candidate.id} onClick={() => setStyle(candidate.id)}>
            <span className="creator-style-radio" aria-hidden="true">{style === candidate.id && <Check size={16} />}</span>
            <strong>{candidate.name}</strong><p>{candidate.description}</p>
            <span className="creator-style-badges">{candidate.targets.map(key => <span key={key}>{ATTRIBUTE_LABELS[key]} {Math.round(candidate.player.attributes[key])}</span>)}</span>
            {style === candidate.id && <span className="creator-style-attributes">{attributes.map(key => <span className="creator-attribute-row" key={key}><span>{ATTRIBUTE_LABELS[key]}</span><span className="creator-attribute-track"><i style={{ width: `${candidate.player.attributes[key]}%` }} /></span><b>{Math.round(candidate.player.attributes[key])}</b></span>)}</span>}
          </button>)}
        </div>}

        {step === 3 && <div className="creator-training-step">
          <div className="creator-training-options" aria-label="집중 육성">
            {attributes.map(key => <button type="button" className={`creator-training-card ${training.includes(key) ? "selected" : ""}`} key={key} aria-pressed={training.includes(key)} onClick={() => toggleTraining(key)}><span>{ATTRIBUTE_LABELS[key]}</span><strong>{Math.round(selected.player.attributes[key])}</strong><span className="creator-training-check" aria-hidden="true">{training.includes(key) && <Check size={16} />}</span></button>)}
          </div>
          {hasCareer && <p className="muted small creator-archive-note">현재 커리어는 보관함에 남긴 뒤 새 선수를 만듭니다.</p>}
        </div>}

        {error && <p className="form-error" id={`${id}-error`} role="alert">{error}</p>}
      </div>
      <div className="creator-bottom"><button type="submit" className="button primary creator-submit" disabled={step === 1 ? !name.trim() || number === "" || !affiliation : step === 3 ? training.length === 0 : false}>{CTA[step]}</button></div>
    </form>

    {confirm && affiliation && <Modal title={`${name} ${positionName}`} onClose={() => setConfirm(false)}>
      <div className="creator-confirm-summary">
        <p className="creator-confirm-subtitle">{styleName} · 등번호 {number} · {country.startAge}세</p>
        <dl><div><dt>시작 소속</dt><dd><AmateurMark id={affiliation.id} />{affiliation.name}</dd></div><div><dt>국적 · 투타</dt><dd>{nationality} · {hand}</dd></div><div><dt>능력치 합 · OVR</dt><dd>{Math.round(Object.values(selected.player.attributes).reduce((sum, value) => sum + value, 0))} · {getOverall(selected.player)}</dd></div><div><dt>집중 육성</dt><dd>{training.map(key => ATTRIBUTE_LABELS[key]).join(" · ")}</dd></div></dl>
      </div>
      <div className="creator-confirm-actions"><button type="button" className="button secondary" onClick={() => setConfirm(false)}>다시 보기</button><button type="button" className="button primary" onClick={create}>아마추어 시즌 시작</button></div>
    </Modal>}
  </section>;
}
