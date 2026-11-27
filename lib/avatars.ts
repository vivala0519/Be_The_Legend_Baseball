// IDs 0–7 are reserved for avatars used by earlier saves.
export const DEFAULT_AVATAR_ID = 8;
export const DEFAULT_PITCHER_AVATAR_ID = 33;

type AvatarOption = {
  id: number;
  label: string;
  sheet: string;
  rows: number;
  slot: number;
  role: "batter" | "pitcher";
  image?: string;
  mirrored?: boolean;
};

const sheets: {
  firstId: number;
  sheet: string;
  rows: number;
  pitcherSlots: number[];
  labels: string[];
  individualImages?: Partial<Record<number, string>>;
}[] = [
  {
    firstId: DEFAULT_AVATAR_ID,
    sheet: "/baseball-players.webp",
    rows: 4,
    pitcherSlots: [2, 9, 14],
    individualImages: { 14: "/baseball-pitcher-follow-through.webp" },
    labels: [
      "남색 모자의 타자", "붉은 보호대의 포수", "청록색 유니폼의 투수", "고글을 쓴 내야수",
      "주황색 헬멧의 타자", "초록 줄무늬 유니폼", "하늘색 유니폼의 야수", "검은 마스크의 포수",
      "파란 모자의 야수", "회색 유니폼의 투수", "분홍색 유니폼의 타자", "자주색 유니폼의 야수",
      "노란 유니폼의 주자", "흰색 바탕의 빨간 줄무늬", "노란 유니폼의 오버핸드 투수", "갈색 모자의 내야수",
    ],
  },
  {
    firstId: 24,
    sheet: "/baseball-players-vol2.webp",
    rows: 4,
    pitcherSlots: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    labels: [
      "보라색 헬멧의 타자", "자주색 헬멧의 번트 자세", "호박색 유니폼의 타자", "남색 유니폼의 투구 자세",
      "주황색 유니폼과 고글을 쓴 투수", "연두색 유니폼의 셋 포지션", "하늘색 유니폼의 공 잡는 자세", "진홍색 유니폼의 와인드업",
      "갈색 모자의 언더핸드 투수", "검은 유니폼의 높은 레그킥", "흰색과 파란색 유니폼의 투수", "초록 모자와 줄무늬 바지의 투수",
      "연보라색 유니폼의 투구 자세", "분홍색 유니폼의 셋 포지션", "빨강과 검정 유니폼의 사이드암 투수", "노란 모자의 투구 준비 자세",
    ],
  },
  {
    firstId: 40,
    sheet: "/baseball-position-avatars-v2.webp",
    rows: 2,
    pitcherSlots: [2, 3, 4, 5, 6],
    labels: [
      "파란 보호구의 포수", "초록 보호구의 포수", "주황색 유니폼의 사이드암 투수", "보라색 유니폼의 사이드암 투수",
      "녹색 유니폼의 언더핸드 투수", "남색 유니폼의 언더핸드 투수", "붉은 모자의 언더핸드 투수", "베이스에서 포구하는 1루수",
    ],
  },
  {
    firstId: 60,
    sheet: "/baseball-pitching-avatars.webp",
    rows: 2,
    pitcherSlots: [0, 1, 2, 3, 4, 5, 6, 7],
    labels: [
      "청록 줄무늬 유니폼의 사이드암 투수", "빨간 모자의 사이드암 투수", "하늘색 유니폼의 사이드암 투수", "검정과 노랑 유니폼의 사이드암 투수",
      "보라색 유니폼의 언더핸드 투수", "주황색 유니폼의 언더핸드 투수", "흰색과 청록 유니폼의 언더핸드 투수", "회색과 파랑 유니폼의 언더핸드 투수",
    ],
  },
];

// Slots run left to right and top to bottom. The IDs are used by saved careers.
const baseAvatars: AvatarOption[] = sheets.flatMap(({ firstId, sheet, rows, pitcherSlots, labels, individualImages }) =>
  labels.map((label, slot) => ({
    id: firstId + slot,
    label,
    sheet,
    rows,
    image: individualImages?.[slot],
    slot,
    role: pitcherSlots.includes(slot) ? "pitcher" : "batter",
  })),
);

type AvatarColumn = readonly [number, number, number, number];
const batterAvatarsByPosition: Readonly<Record<string, { defense: AvatarColumn; batting: AvatarColumn }>> = {
  C: { defense: [9, 15, 40, 41], batting: [8, 25, 26, 12] },
  "1B": { defense: [47, 19, 21, 23], batting: [26, 12, 8, 24] },
  "2B": { defense: [23, 11, 13, 21], batting: [25, 8, 18, 12] },
  "3B": { defense: [11, 19, 23, 14], batting: [12, 26, 8, 24] },
  SS: { defense: [11, 23, 21, 13], batting: [25, 8, 12, 18] },
  LF: { defense: [13, 21, 14, 19], batting: [8, 24, 12, 18] },
  CF: { defense: [14, 13, 21, 19], batting: [8, 25, 18, 26] },
  RF: { defense: [21, 14, 19, 13], batting: [26, 18, 12, 24] },
};

const pitcherGalleries = [
  {
    left: "좌투", right: "우투",
    poses: [
      { id: DEFAULT_PITCHER_AVATAR_ID, mirroredId: 48, arm: "right" },
      { id: 27, mirroredId: 49, arm: "right" },
      { id: 10, mirroredId: 50, arm: "right" },
      { id: 22, mirroredId: 51, arm: "right" },
      { id: 28, mirroredId: 68, arm: "right" },
      { id: 36, mirroredId: 69, arm: "right" },
      { id: 31, mirroredId: 70, arm: "left" },
      { id: 35, mirroredId: 71, arm: "left" },
    ],
  },
  {
    left: "좌사", right: "우사",
    poses: [
      { id: 17, mirroredId: 52, arm: "right" },
      { id: 38, mirroredId: 53, arm: "left" },
      { id: 42, mirroredId: 54, arm: "right" },
      { id: 43, mirroredId: 55, arm: "right" },
      { id: 60, mirroredId: 72, arm: "right" },
      { id: 61, mirroredId: 73, arm: "right" },
      { id: 62, mirroredId: 74, arm: "right" },
      { id: 63, mirroredId: 75, arm: "right" },
    ],
  },
  {
    left: "좌언", right: "우언",
    poses: [
      { id: 32, mirroredId: 56, arm: "left" },
      { id: 44, mirroredId: 57, arm: "right" },
      { id: 45, mirroredId: 58, arm: "right" },
      { id: 46, mirroredId: 59, arm: "right" },
      { id: 64, mirroredId: 76, arm: "right" },
      { id: 65, mirroredId: 77, arm: "right" },
      { id: 66, mirroredId: 78, arm: "right" },
      { id: 67, mirroredId: 79, arm: "right" },
    ],
  },
] as const;

const avatarsById = new Map(baseAvatars.map(option => [option.id, option]));

function avatarById(id: number): AvatarOption {
  const option = avatarsById.get(id);
  if (!option) throw new Error(`Unknown avatar ID ${id}`);
  return option;
}

// Keep saved IDs and labels while using the redrawn poses in their new sheet slots.
const redrawnAtlases: readonly { sheet: string; rows: number; ids: readonly number[]; flippedIds?: readonly number[] }[] = [
  {
    sheet: "/baseball-avatar-fielders-v2.webp",
    rows: 4,
    ids: [8, 9, 11, 12, 13, 14, 15, 18, 19, 21, 23, 24, 25, 26, 16, 20],
  },
  {
    sheet: "/baseball-avatar-pitchers-v2.webp",
    rows: 3,
    ids: [33, 27, 10, 22, 28, 36, 31, 35, 17, 38, 32, 29],
    flippedIds: [31, 35],
  },
];

for (const { sheet, rows, ids, flippedIds } of redrawnAtlases) {
  for (const [slot, id] of ids.entries()) {
    avatarsById.set(id, { ...avatarById(id), sheet, rows, slot, image: undefined, mirrored: flippedIds?.includes(id) });
  }
}

for (const { poses } of pitcherGalleries) {
  for (const { id, mirroredId } of poses) {
    const original = avatarById(id);
    avatarsById.set(mirroredId, { ...original, id: mirroredId, mirrored: !original.mirrored });
  }
}

export const AVATAR_OPTIONS = [...avatarsById.values()];
export const MAX_AVATAR_ID = Math.max(...avatarsById.keys());

export function getBatterAvatarOptions(position: string): AvatarOption[] {
  const { defense, batting } = Object.hasOwn(batterAvatarsByPosition, position)
    ? batterAvatarsByPosition[position] : batterAvatarsByPosition.CF;
  return defense.flatMap((id, index) => [avatarById(id), avatarById(batting[index])]);
}

export function getPitcherAvatarOptions(hand: string): AvatarOption[] {
  const gallery = pitcherGalleries.find(({ left, right }) => left === hand || right === hand) ?? pitcherGalleries[0];
  const throwingArm = gallery.right === hand ? "right" : "left";
  return gallery.poses.map(({ id, mirroredId, arm }) => avatarById(arm === throwingArm ? id : mirroredId));
}
