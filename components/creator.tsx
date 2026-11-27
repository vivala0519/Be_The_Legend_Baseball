"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Shuffle } from "lucide-react";
import { BATTER_POSITIONS, BatterPositionPicker } from "@/components/batter-position-picker";
import { AmateurMark, Avatar, Modal, PITCHING_DELIVERY_OPTIONS, getPlayerHandLabel } from "@/components/game-ui";
import { AffiliationPicker, CreatorSelect } from "@/components/creator-pickers";
import { AMATEUR_COUNTRIES, AMATEUR_COUNTRY_CODES, getAmateurAffiliations, type AmateurCountry } from "@/lib/amateur";
import { getAmateurMark } from "@/lib/amateur-marks";
import { getBatterAvatarOptions, getPitcherAvatarOptions } from "@/lib/avatars";
import { ATTRIBUTE_LABELS, BATTER_ATTRIBUTES, PITCHER_ATTRIBUTES, createCareer, getOverall } from "@/lib/game";
import { DEFAULT_HAND_BY_ROLE, MAX_NEW_PLAYER_NAME_LENGTH, type CreateCareerInput, type PlayerRole } from "@/lib/game-types";
import { getLeague, teamsForLeague, type LeagueId } from "@/lib/leagues";

interface CreatorProps {
  initialLeague: LeagueId;
  onClose: () => void;
  onCreate: (input: CreateCareerInput) => void;
  hasCareer: boolean;
}

interface RoleSelections {
  position: string;
  hand: string;
  style: string;
  training: string[];
}

const PITCHER_POSITIONS = [
  { value: "SP", label: "선발" }, { value: "RP", label: "불펜" }, { value: "CP", label: "마무리" },
] as const;
const BATTING_HAND_OPTIONS = ["좌타", "양타", "우타"].map(value => ({ value, label: value }));
const PITCHING_ARM_OPTIONS = ["좌완", "우완"].map(value => ({ value, label: value }));
const PITCHING_SLOT_OPTIONS = ["오버", "사이드암", "언더"].map(value => ({ value, label: value }));
const ROLE_LABELS = { batter: "타자", pitcher: "투수" };
const INITIAL_COUNTRY: Record<LeagueId, AmateurCountry> = { KBO: "KR", NPB: "JP", MLB: "US", CPBL: "TW" };
const NATIONALITY_OPTIONS = AMATEUR_COUNTRY_CODES.map(code => ({
  value: code, label: AMATEUR_COUNTRIES[code].label, icon: AMATEUR_COUNTRIES[code].flag,
}));
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
const STEP_NAMES = ["선수 정보", "플레이 스타일", "집중 육성"];
const CTA = ["다음", "이 스타일로 할게요", "선수 만들기"];

function CreatorChoiceGroup({ label, name, value, options, onChange, columns }: {
  label: string;
  name: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  columns?: 2 | 3;
}) {
  const labelId = `${name}-label`;

  return <div className="creator-choice-group" role="radiogroup" aria-labelledby={labelId}>
    <div className="creator-selection-label" id={labelId}>{label}</div>
    <div className={columns ? "creator-choice-list compact" : "creator-choice-list"}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
      {options.map(option => <label className="creator-choice" key={option.value}>
        <input className="sr-only" type="radio" name={name} value={option.value}
          checked={value === option.value} onChange={() => onChange(option.value)} />
        <span className="creator-choice-tile">
          {option.label}
          {!columns && <span className="creator-choice-check" aria-hidden="true">
            {value === option.value && <Check size={12} strokeWidth={3} />}
          </span>}
        </span>
      </label>)}
    </div>
  </div>;
}

function PitchingDeliveryPicker({ label, name, value, onChange }: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = PITCHING_DELIVERY_OPTIONS.find(option => option.value === value) ?? PITCHING_DELIVERY_OPTIONS[0];

  function changeDelivery(arm: string, slot: string) {
    const delivery = PITCHING_DELIVERY_OPTIONS.find(option => option.arm === arm && option.slot === slot);
    if (delivery) onChange(delivery.value);
  }

  return <>
    <CreatorChoiceGroup label="투구 팔" name={`${name}-arm`} value={selected.arm} options={PITCHING_ARM_OPTIONS}
      onChange={arm => changeDelivery(arm, selected.slot)} columns={2} />
    <CreatorChoiceGroup label={label} name={`${name}-slot`} value={selected.slot} options={PITCHING_SLOT_OPTIONS}
      onChange={slot => changeDelivery(selected.arm, slot)} columns={3} />
  </>;
}

function CreatorAvatarPicker({ options, avatar, role, onChange }: {
  options: readonly { id: number; label: string }[];
  avatar: number;
  role: PlayerRole;
  onChange: (avatar: number) => void;
}) {
  const group = useId();
  const labelId = `${group}-label`;

  return <div className="creator-avatar-picker" role="radiogroup" aria-labelledby={labelId}>
    <div className="creator-selection-label" id={labelId}>선수 아바타</div>
    <div className="creator-avatar-options" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
      {options.map((option, index) => <label className="creator-avatar-option" key={option.id}>
        <input className="sr-only" type="radio" name={group} value={option.id} checked={avatar === option.id}
          onChange={() => onChange(option.id)} />
        <span className="creator-avatar-tile" aria-hidden="true">
          <Avatar avatar={option.id} small />
          {avatar === option.id && <span className="creator-avatar-check"><Check size={12} strokeWidth={3} /></span>}
        </span>
        <span className="sr-only">{role === "batter" ? `${index % 2 === 0 ? "수비" : "타격"} · ` : ""}{option.label}</span>
      </label>)}
    </div>
  </div>;
}

export default function Creator({ initialLeague, onClose, onCreate, hasCareer }: CreatorProps) {
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [role, setRole] = useState<PlayerRole>("batter");
  const [selections, setSelections] = useState<Record<PlayerRole, RoleSelections>>({
    batter: { position: "CF", hand: DEFAULT_HAND_BY_ROLE.batter, style: "contact", training: [] },
    pitcher: { position: "SP", hand: DEFAULT_HAND_BY_ROLE.pitcher, style: "velocity", training: [] },
  });
  const [avatars, setAvatars] = useState<Partial<Record<string, number>>>({});
  const [nationalityCode, setNationalityCode] = useState(INITIAL_COUNTRY[initialLeague]);
  const [affiliationId, setAffiliationId] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const { position, hand, style, training } = selections[role];
  const avatarGroup = role === "batter" ? `batter-${position}` : `pitcher-${hand}`;
  const avatarOptions = role === "batter" ? getBatterAvatarOptions(position) : getPitcherAvatarOptions(hand);
  const avatar = avatarOptions.find(option => option.id === avatars[avatarGroup])?.id ?? avatarOptions[0].id;
  const attributes = role === "batter" ? BATTER_ATTRIBUTES : PITCHER_ATTRIBUTES;
  const positions = role === "batter" ? BATTER_POSITIONS : PITCHER_POSITIONS;
  const positionName = positions.find(option => option.value === position)?.label ?? position;
  const handLabel = role === "batter" ? "타자 유형" : "투구 방식";
  const styleName = STYLES[role].find(candidate => candidate.id === style)?.name || style;
  const country = AMATEUR_COUNTRIES[nationalityCode];
  const nationality = country.label;
  const affiliations = getAmateurAffiliations(nationalityCode);
  const affiliation = affiliations.find(entry => entry.id === affiliationId);
  const showStepAction = step !== 0 || (!!name.trim() && !!affiliation);
  const affiliationMark = affiliation ? getAmateurMark(affiliation) : undefined;
  const affiliationLabel = country.kind === "school" ? "고교 야구부" : "야구 아카데미";
  const proLeague = getLeague(country.leagueId);
  const candidates = useMemo(() => STYLES[role].map(candidate => ({ ...candidate, player: createCareer({
    name: name || "새로운 선수", role, position, hand, nationality,
    leagueId: proLeague.id, teamId: teamsForLeague(proLeague.id)[0].id,
    avatar, style: candidate.id, seed: 0,
  }).player })), [role, position, hand, nationality, proLeague.id, avatar, name]);
  const selected = candidates.find(candidate => candidate.id === style) || candidates[0];

  function toStep(next: number) {
    setError("");
    setStep(next);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }

  function changeRole(next: PlayerRole) {
    if (next === role) return;
    setRole(next);
    setError("");
  }

  function updateSelections(change: Partial<RoleSelections>) {
    setSelections(previous => ({ ...previous, [role]: { ...previous[role], ...change } }));
  }

  function toggleTraining(key: string) {
    if (training.includes(key)) {
      updateSelections({ training: training.filter(value => value !== key) });
      setError("");
    } else if (training.length < 2) {
      updateSelections({ training: [...training, key] });
      setError("");
    } else {
      setError("최대 2개까지 고를 수 있어요. 먼저 하나를 해제해 주세요.");
    }
  }

  function nextStep() {
    if (step === 0) {
      if (!name.trim()) {
        setError("선수의 이름을 입력해 주세요.");
        nameRef.current?.focus();
        return;
      }
      if (!affiliation) {
        setError("시작 소속을 선택해 주세요.");
        return;
      }
    }
    if (step === 2) {
      if (!training.length) { setError("집중해서 키울 능력치를 한 개 이상 골라 주세요."); return; }
      setError("");
      setConfirm(true);
      return;
    }
    toStep(step + 1);
  }

  function create() {
    if (!affiliation) return;
    onCreate({ name: name.trim().slice(0, MAX_NEW_PLAYER_NAME_LENGTH), avatar, nationality, role,
      position, hand, amateurAffiliationId: affiliation.id, style, training: [...training] });
  }

  function randomName() {
    const names = ["김도윤", "이서준", "박지호", "정시우", "강민준", "최이준", "오현우", "윤도현"];
    setName(names[Math.floor(Math.random() * names.length)]);
    setError("");
  }

  return <section className={`creator-screen creator-step-${step}`}>
    <header className="creator-header">
      <button type="button" className="icon-btn creator-back" onClick={() => step === 0 ? onClose() : toStep(step - 1)} aria-label={step === 0 ? "처음으로" : "이전 단계"}><ArrowLeft size={23} /></button>
      <ol className="creator-dots" aria-label="선수 생성 단계">
        {STEP_NAMES.map((label, index) => <li key={label} className={index <= step ? "active" : ""} aria-current={step === index ? "step" : undefined}><span className="sr-only">{label}{index === step ? " (현재 단계)" : ""}</span></li>)}
      </ol>
      {step === 0 && <button type="button" className="text-button creator-random" onClick={randomName}><Shuffle size={15} />랜덤</button>}
    </header>

    <form onSubmit={event => { event.preventDefault(); nextStep(); }} noValidate>
      <div className={showStepAction ? "creator-content" : "creator-content creator-content-without-action"} ref={contentRef}>
        <div className="creator-heading">
          <p>{step === 0 ? `${country.startAge}세 · 아마추어 ${ROLE_LABELS[role]}` : step === 1 ? `${name} · ${positionName}` : `${styleName} · OVR ${getOverall(selected.player)}`}</p>
          <h1 className={step === 0 ? "max-[641px]:sr-only" : undefined}>{step === 0 ? "어떤 선수로 살아볼까요?" : step === 1 ? <>플레이 스타일을<br />골라 주세요</> : <>집중해서 키울 능력치를<br />골라 주세요</>}</h1>
          {step === 1 && <p>세 후보 모두 OVR 45에서 시작하고, 능력치 분포만 달라요.</p>}
          {step === 2 && <p>최대 2개까지 고를 수 있어요. 고른 능력치에 훈련을 집중합니다.</p>}
        </div>

        {step === 0 && <fieldset className="creator-role-field">
          <legend className="sr-only">선수 유형</legend>
          <div className="segmented">
            {(["batter", "pitcher"] as const).map(option => <button type="button" key={option}
              className={role === option ? "selected" : ""} aria-pressed={role === option} onClick={() => changeRole(option)}>
              {ROLE_LABELS[option]}
            </button>)}
          </div>
        </fieldset>}

        {step === 0 && <div className={`creator-player-selection${role === "pitcher" ? " creator-player-selection-pitcher" : ""}`}>
          <div className="creator-position-controls">
            {role === "batter"
              ? <BatterPositionPicker value={position} onChange={position => updateSelections({ position })} />
              : <CreatorChoiceGroup label="보직" name={`${id}-pitcher-position`} value={position}
                options={PITCHER_POSITIONS} onChange={position => updateSelections({ position })} columns={3} />}
            {role === "batter"
              ? <CreatorChoiceGroup label={handLabel} name={`${id}-hand`} value={hand}
                options={BATTING_HAND_OPTIONS} onChange={hand => updateSelections({ hand })} columns={3} />
              : <PitchingDeliveryPicker label={handLabel} name={`${id}-delivery`} value={hand} onChange={hand => updateSelections({ hand })} />}
          </div>
          <CreatorAvatarPicker key={role} options={avatarOptions} avatar={avatar} role={role}
            onChange={selectedAvatar => setAvatars(previous => ({ ...previous, [avatarGroup]: selectedAvatar }))} />
        </div>}

        {step === 0 && <div className="creator-profile-form">
          <div className="creator-profile-identity">
            <label className="field-label" htmlFor={`${id}-name`}>이름<input id={`${id}-name`} ref={nameRef} maxLength={MAX_NEW_PLAYER_NAME_LENGTH} required autoComplete="off" value={name} onChange={event => { setName(event.target.value); setError(""); }} placeholder=" " aria-invalid={!!error && !name.trim()} aria-describedby={error ? `${id}-error` : undefined} /></label>
            <CreatorSelect label="국적" value={nationalityCode} options={NATIONALITY_OPTIONS} onChange={value => {
              if (value === nationalityCode) return;
              setNationalityCode(value as AmateurCountry);
              setAffiliationId("");
              setError("");
            }} />
          </div>
          <AffiliationPicker key={nationalityCode} label={affiliationLabel} choices={affiliations} selected={affiliation}
            describedBy={`${id}-amateur-route`} onChange={value => { setAffiliationId(value); setError(""); }} />
          <p className="muted small" id={`${id}-amateur-route`}>{country.startAge + country.seasons - 1}세 시즌을 마치면 {proLeague.name} 신인 드래프트에 참가해요. 미지명되면 대학별 합격 결과를 확인해요.</p>
        </div>}

        {step === 1 && <div className="creator-style-cards" aria-label="플레이 스타일">
          {candidates.map(candidate => <button type="button" key={candidate.id} className={`creator-style-card ${style === candidate.id ? "selected" : ""}`} aria-pressed={style === candidate.id} onClick={() => updateSelections({ style: candidate.id })}>
            <span className="creator-style-radio" aria-hidden="true">{style === candidate.id && <Check size={16} />}</span>
            <strong>{candidate.name}</strong><p>{candidate.description}</p>
            <span className="creator-style-badges">{candidate.targets.map(key => <span key={key}>{ATTRIBUTE_LABELS[key]} {Math.round(candidate.player.attributes[key])}</span>)}</span>
            {style === candidate.id && <span className="creator-style-attributes">{attributes.map(key => <span className="creator-attribute-row" key={key}><span>{ATTRIBUTE_LABELS[key]}</span><span className="creator-attribute-track"><i style={{ width: `${candidate.player.attributes[key]}%` }} /></span><b>{Math.round(candidate.player.attributes[key])}</b></span>)}</span>}
          </button>)}
        </div>}

        {step === 2 && <div className="creator-training-step">
          <div className="creator-training-options" aria-label="집중 육성">
            {attributes.map(key => <button type="button" className={`creator-training-card ${training.includes(key) ? "selected" : ""}`} key={key} aria-pressed={training.includes(key)} onClick={() => toggleTraining(key)}><span>{ATTRIBUTE_LABELS[key]}</span><strong>{Math.round(selected.player.attributes[key])}</strong><span className="creator-training-check" aria-hidden="true">{training.includes(key) && <Check size={16} />}</span></button>)}
          </div>
          {hasCareer && <p className="muted small creator-archive-note">현재 커리어는 보관함에 남긴 뒤 새 선수를 만듭니다.</p>}
        </div>}

        {error && <p className="form-error" id={`${id}-error`} role="alert">{error}</p>}
      </div>
      {showStepAction && <div className="creator-bottom">
        <button type="submit" className="button primary creator-submit" disabled={step === 2 && training.length === 0}>{CTA[step]}</button>
      </div>}
    </form>

    {confirm && affiliation && <Modal title={`${name} ${positionName}`} onClose={() => setConfirm(false)}>
      <div className="creator-confirm-summary">
        <p className="creator-confirm-subtitle">{styleName} · {country.startAge}세</p>
        <dl><div><dt>시작 소속</dt><dd><AmateurMark id={affiliation.id} />{affiliation.name}</dd></div><div><dt>국적 · {handLabel}</dt><dd>{nationality} · {getPlayerHandLabel(role, hand)}</dd></div><div><dt>능력치 합 · OVR</dt><dd>{Math.round(Object.values(selected.player.attributes).reduce((sum, value) => sum + value, 0))} · {getOverall(selected.player)}</dd></div><div><dt>집중 육성</dt><dd>{training.map(key => ATTRIBUTE_LABELS[key]).join(" · ")}</dd></div></dl>
      </div>
      <div className="creator-confirm-actions"><button type="button" className="button secondary" onClick={() => setConfirm(false)}>다시 보기</button><button type="button" className="button primary" onClick={create}>아마추어 시즌 시작</button></div>
    </Modal>}
  </section>;
}
