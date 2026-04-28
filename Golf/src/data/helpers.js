// ============================================================
//  Pure helpers (no React deps)
// ============================================================

export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

export function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function trimmedMean(arr, trim = 0.1) {
  if (arr.length < 5)
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const s = [...arr].sort((a, b) => a - b);
  const k = Math.floor(s.length * trim);
  const t = s.slice(k, s.length - k);
  return t.reduce((a, b) => a + b, 0) / t.length;
}

// ===== ショット v2.0 ヘルパー =====
// 旧 result からも v2.0 形式にアクセスできるように正規化
export function getShotOutcome(shot) {
  if (shot.outcome) return shot.outcome;
  if (shot.result === "ob") return "ob";
  return "in_play";
}
export function getShotSelfRating(shot) {
  if ("selfRating" in shot) return shot.selfRating;
  if (shot.result && shot.result !== "ob") return shot.result;
  return null;
}
// プレー外（OB・ロスト・ペナ）：距離分析から除外すべきショット
export function isShotOffPlay(shot) {
  const o = getShotOutcome(shot);
  return o !== "in_play";
}
// 打ち直しフラグ（v2.0で追加、距離分析から除外）
export function isReplay(shot) {
  return !!shot.isReplay;
}
// 「ミス」とみなすショット（自己評価が miss/bad、または off-play）
export function isMissShot(shot) {
  const r = getShotSelfRating(shot);
  if (r === "miss" || r === "bad") return true;
  if (isShotOffPlay(shot)) return true;
  return false;
}
// ホールのスコア（手入力 manualScore 優先、なければ shots.length）
export function getHoleScore(hole) {
  if (typeof hole.manualScore === "number" && hole.manualScore > 0) {
    return hole.manualScore;
  }
  return hole.shots ? hole.shots.length : 0;
}
// ホールのパット数（手入力 manualPutts 優先、なければクラブIDで判定）
export function getHolePutts(hole, clubs) {
  if (typeof hole.manualPutts === "number") return hole.manualPutts;
  if (!hole.shots || !clubs) return 0;
  const putterIds = new Set(
    clubs.filter((c) => c.category === "putter").map((c) => c.id)
  );
  return hole.shots.filter((s) => putterIds.has(s.clubId)).length;
}

// ===== クリップボード =====
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}
