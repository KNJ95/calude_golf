import COURSES_DATA from "../courses.json";

export const STORAGE_KEY = "golf-shot-tracker:v1";

export const DEFAULT_CLUBS = [
  { id: "dr", name: "DR", category: "wood", avgDistance: 230 },
  { id: "3w", name: "3W", category: "wood", avgDistance: 210 },
  { id: "5w", name: "5W", category: "wood", avgDistance: 195 },
  { id: "u4", name: "U4", category: "utility", avgDistance: 185 },
  { id: "u5", name: "U5", category: "utility", avgDistance: 175 },
  { id: "5i", name: "5I", category: "iron", avgDistance: 165 },
  { id: "6i", name: "6I", category: "iron", avgDistance: 155 },
  { id: "7i", name: "7I", category: "iron", avgDistance: 145 },
  { id: "8i", name: "8I", category: "iron", avgDistance: 135 },
  { id: "9i", name: "9I", category: "iron", avgDistance: 125 },
  { id: "pw", name: "PW", category: "wedge", avgDistance: 110 },
  { id: "aw", name: "AW", category: "wedge", avgDistance: 95 },
  { id: "sw", name: "SW", category: "wedge", avgDistance: 80 },
  { id: "pt", name: "PT", category: "putter", avgDistance: null },
];

export const LIES = [
  { id: "tee", label: "ティー" },
  { id: "fw", label: "FW" },
  { id: "rough", label: "ラフ" },
  { id: "bunker", label: "バンカー" },
  { id: "green", label: "グリーン" },
];

// 自己評価（感覚値）
export const SELF_RATINGS = [
  { id: "good", label: "◎", tone: "good", desc: "完璧" },
  { id: "ok", label: "○", tone: "ok", desc: "良い" },
  { id: "miss", label: "△", tone: "miss", desc: "まあまあ" },
  { id: "bad", label: "×", tone: "bad", desc: "ミス" },
];

// 結果（事実）
export const OUTCOMES = [
  { id: "in_play", label: "セーフ", tone: "ok" },
  { id: "ob", label: "OB", tone: "bad" },
  { id: "lost", label: "ロスト", tone: "bad" },
  { id: "penalty_red", label: "赤杭", tone: "bad" },
  { id: "penalty_yellow", label: "黄杭", tone: "bad" },
];

// v1.0互換用：旧resultをマイグレーションするマップ
export const LEGACY_RESULT_MAP = {
  good: { selfRating: "good", outcome: "in_play" },
  ok: { selfRating: "ok", outcome: "in_play" },
  miss: { selfRating: "miss", outcome: "in_play" },
  bad: { selfRating: "bad", outcome: "in_play" },
  ob: { selfRating: null, outcome: "ob" },
};

// ===== コースマスターデータ =====
export const DEFAULT_COURSES = Array.isArray(COURSES_DATA)
  ? COURSES_DATA
  : COURSES_DATA?.courses || [];

// ===== ラベル定義（AIプロンプト・表示用） =====
export const LIE_LABELS = {
  tee: "ティー",
  fw: "FW",
  rough: "ラフ",
  bunker: "バンカー",
  green: "グリーン",
};
export const SELF_RATING_LABELS = { good: "◎", ok: "○", miss: "△", bad: "×" };
export const OUTCOME_LABELS = {
  in_play: "セーフ",
  ob: "OB",
  lost: "ロスト",
  penalty_red: "赤杭",
  penalty_yellow: "黄杭",
};
export const DIR_LABELS = { left: "左", straight: "直", right: "右" };
export const DEPTH_LABELS = { short: "ショート", pin: "ピン", over: "オーバー" };
