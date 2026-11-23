// IDs 0–7 are reserved for avatars used by earlier saves.
export const DEFAULT_AVATAR_ID = 8;

const AVATARS_PER_SHEET = 16;
const sheets = [
  {
    sheet: "/baseball-players.webp",
    pitcherSlots: [2, 9, 14],
    labels: [
      "남색 모자의 타자", "붉은 보호대의 포수", "청록색 유니폼의 투수", "고글을 쓴 내야수",
      "주황색 헬멧의 타자", "초록 줄무늬 유니폼", "하늘색 유니폼의 야수", "검은 마스크의 포수",
      "파란 모자의 야수", "회색 유니폼의 투수", "분홍색 유니폼의 타자", "자주색 유니폼의 야수",
      "노란 유니폼의 주자", "흰색 바탕의 빨간 줄무늬", "청록색 유니폼의 투구 자세", "갈색 모자의 내야수",
    ],
  },
  {
    sheet: "/baseball-players-vol2.webp",
    pitcherSlots: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    labels: [
      "보라색 헬멧의 타자", "자주색 헬멧의 번트 자세", "호박색 유니폼의 타자", "남색 유니폼의 투구 자세",
      "주황색 유니폼과 고글을 쓴 투수", "연두색 유니폼의 셋 포지션", "하늘색 유니폼의 공 잡는 자세", "진홍색 유니폼의 와인드업",
      "갈색 모자의 언더핸드 투수", "검은 유니폼의 높은 레그킥", "흰색과 파란색 유니폼의 투수", "초록 모자와 줄무늬 바지의 투수",
      "연보라색 유니폼의 투구 자세", "분홍색 유니폼의 셋 포지션", "빨강과 검정 유니폼의 사이드암 투수", "노란 모자의 투구 준비 자세",
    ],
  },
];

// Slots run left to right and top to bottom on each sheet. Keep existing IDs stable.
export const AVATAR_OPTIONS = sheets.flatMap(({ sheet, pitcherSlots, labels }, sheetIndex) =>
  labels.map((label, slot) => ({
    id: DEFAULT_AVATAR_ID + sheetIndex * AVATARS_PER_SHEET + slot,
    label,
    sheet,
    slot,
    role: pitcherSlots.includes(slot) ? "pitcher" as const : "batter" as const,
  })),
);

export const MAX_AVATAR_ID = DEFAULT_AVATAR_ID + AVATAR_OPTIONS.length - 1;

export const AVATAR_OPTIONS_BY_ROLE = {
  batter: AVATAR_OPTIONS.filter(({ role }) => role === "batter"),
  pitcher: AVATAR_OPTIONS.filter(({ role }) => role === "pitcher"),
};
