import React, { useState, useEffect, useMemo, useRef } from "react";
import COURSES_DATA from "./courses.json";

// --- Inline SVG icons ---
const Icon = ({ children, size = 20, strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);
const ChevronLeft = (p) => (
  <Icon {...p}>
    <polyline points="15 18 9 12 15 6" />
  </Icon>
);
const Plus = (p) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);
const Flag = (p) => (
  <Icon {...p}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </Icon>
);
const BarChart3 = (p) => (
  <Icon {...p}>
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </Icon>
);
const Settings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 10v6M4.22 4.22l4.24 4.24m7.07 7.07l4.24 4.24M1 12h6m10 0h6M4.22 19.78l4.24-4.24m7.07-7.07l4.24-4.24" />
  </Icon>
);
const Trash2 = (p) => (
  <Icon {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
);
const X = (p) => (
  <Icon {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Icon>
);
const Check = (p) => (
  <Icon {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);
const MapPin = (p) => (
  <Icon {...p}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
const Cloud = (p) => (
  <Icon {...p}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </Icon>
);
const Calendar = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Icon>
);

// ============================================================
//  CONSTANTS
// ============================================================
const STORAGE_KEY = "golf-shot-tracker:v1";

const DEFAULT_CLUBS = [
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

const LIES = [
  { id: "tee", label: "ティー" },
  { id: "fw", label: "FW" },
  { id: "rough", label: "ラフ" },
  { id: "bunker", label: "バンカー" },
  { id: "green", label: "グリーン" },
];

const RESULTS = [
  { id: "good", label: "◎", tone: "good" },
  { id: "ok", label: "○", tone: "ok" },
  { id: "miss", label: "△", tone: "miss" },
  { id: "bad", label: "×", tone: "bad" },
  { id: "ob", label: "OB", tone: "bad" },
];

// ===== コースマスターデータ =====
// 形式: { venue, course, holes: [{number, par, distance}, ...] }
// データは src/courses.json で管理（このファイルは触らない）
const DEFAULT_COURSES = Array.isArray(COURSES_DATA)
  ? COURSES_DATA
  : COURSES_DATA?.courses || [];

// ============================================================
//  STORAGE
// ============================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const initialState = () => {
  const loaded = loadState();
  if (loaded) {
    if (loaded.clubs) {
      loaded.clubs = loaded.clubs.map((c) => {
        if ("avgDistance" in c) return c;
        const def = DEFAULT_CLUBS.find((d) => d.id === c.id);
        return { ...c, avgDistance: def?.avgDistance ?? null };
      });
    }
    if (!loaded.courseMasters) loaded.courseMasters = [];
    return loaded;
  }
  return {
    clubs: DEFAULT_CLUBS,
    rounds: [],
    courseMasters: [],
    unit: "yd",
  };
};

// ============================================================
//  HELPERS
// ============================================================
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`;
};

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function trimmedMean(arr, trim = 0.1) {
  if (arr.length < 5)
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const s = [...arr].sort((a, b) => a - b);
  const k = Math.floor(s.length * trim);
  const t = s.slice(k, s.length - k);
  return t.reduce((a, b) => a + b, 0) / t.length;
}

// ===== コースマスターヘルパー =====

// venueに紐づくティー一覧（重複排除）
function getTeesForVenue(venue, courseMastersOverride) {
  if (!venue) return [];
  const tees = new Set();
  (courseMastersOverride || []).forEach((c) => {
    if (c.venue === venue && c.tee) tees.add(c.tee);
  });
  DEFAULT_COURSES.forEach((c) => {
    if (c.venue === venue && c.tee) tees.add(c.tee);
  });
  return Array.from(tees);
}

// venue+teeに紐づくコース名一覧
function getCoursesForVenueAndTee(venue, tee, courseMastersOverride) {
  if (!venue) return [];
  const result = [];
  const seen = new Set();
  (courseMastersOverride || []).forEach((c) => {
    if (c.venue === venue && (!tee || c.tee === tee) && !seen.has(c.course)) {
      result.push(c);
      seen.add(c.course);
    }
  });
  DEFAULT_COURSES.forEach((c) => {
    if (c.venue === venue && (!tee || c.tee === tee) && !seen.has(c.course)) {
      result.push(c);
      seen.add(c.course);
    }
  });
  return result;
}

function findCourseMaster(venue, courseName, tee, courseMastersOverride) {
  if (!venue || !courseName) return null;
  // tee指定あり：venue+course+tee完全一致を探す
  if (tee) {
    const override = (courseMastersOverride || []).find(
      (c) => c.venue === venue && c.course === courseName && c.tee === tee
    );
    if (override) return override;
    return (
      DEFAULT_COURSES.find(
        (c) => c.venue === venue && c.course === courseName && c.tee === tee
      ) || null
    );
  }
  // tee指定なし：互換用、最初に見つかったもの
  const override = (courseMastersOverride || []).find(
    (c) => c.venue === venue && c.course === courseName
  );
  if (override) return override;
  return (
    DEFAULT_COURSES.find((c) => c.venue === venue && c.course === courseName) ||
    null
  );
}

function upsertCourseMaster(prevMasters, venue, courseName, tee, holes) {
  if (!venue || !courseName) return prevMasters;
  const idx = prevMasters.findIndex(
    (c) =>
      c.venue === venue &&
      c.course === courseName &&
      (c.tee || null) === (tee || null)
  );
  if (idx >= 0) {
    return prevMasters.map((c, i) =>
      i === idx ? { ...c, holes, updatedAt: Date.now() } : c
    );
  }
  return [
    ...prevMasters,
    {
      venue,
      course: courseName,
      tee: tee || null,
      holes,
      updatedAt: Date.now(),
    },
  ];
}

// ===== クリップボード =====
async function copyToClipboard(text) {
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

// ===== AI連携プロンプト =====
const LIE_LABELS = {
  tee: "ティー",
  fw: "FW",
  rough: "ラフ",
  bunker: "バンカー",
  green: "グリーン",
};
const RES_LABELS = { good: "◎", ok: "○", miss: "△", bad: "×", ob: "OB" };
const DIR_LABELS = { left: "左", straight: "直", right: "右" };
const DEPTH_LABELS = { short: "ショート", pin: "ピン", over: "オーバー" };

function buildRoundReviewPrompt(round, clubs, unit) {
  const clubMap = Object.fromEntries(clubs.map((c) => [c.id, c]));
  const kpi = computeRoundKPI(round, clubs);
  const byClub = {};
  round.holes.forEach((h) =>
    h.shots.forEach((s) => {
      if (!byClub[s.clubId]) byClub[s.clubId] = [];
      byClub[s.clubId].push(s);
    })
  );

  const lines = [];
  lines.push("# ラウンド振り返り依頼");
  lines.push("");
  lines.push(
    "あなたは経験豊富なゴルフコーチです。以下のラウンドデータを分析し、回答してください。"
  );
  lines.push("");
  lines.push("## 回答フォーマット");
  lines.push("1. **今日の良かった点**（具体的な数値・場面で2点以内）");
  lines.push("2. **改善すべき最重要課題**（最も影響が大きい1点）");
  lines.push("3. **次回ラウンドへの具体策**（行動レベルで3点以内、各1〜2文）");
  lines.push("");
  lines.push("装飾を控えめにし、簡潔に箇条書きで答えてください。");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## ラウンド情報");
  lines.push(`- 日付：${fmtDate(round.date)}`);
  lines.push(`- コース：${round.course || "—"}`);
  lines.push(`- ティー：${round.tee || "—"} / 天候：${round.weather || "—"}`);
  lines.push(`- 総ショット数：${kpi.totalShots}`);
  lines.push(`- パット：${kpi.putts}`);
  lines.push(`- パーオン：${kpi.parOn}/${kpi.parOnEligible}`);
  lines.push(`- FWキープ：${kpi.fwKeep}/${kpi.fwEligible}`);
  lines.push(`- OB：${kpi.obs}`);
  lines.push("");
  lines.push("## 全ショット一覧");
  lines.push("");
  lines.push(
    "| ホール | Par | # | クラブ | 距離 | 打点 | 着地 | 方向 | 距離感 | 結果 | メモ |"
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|");
  round.holes.forEach((h) => {
    h.shots.forEach((s, i) => {
      const club = clubMap[s.clubId]?.name || "—";
      const row = [
        h.number,
        h.par,
        i + 1,
        club,
        s.distance != null ? `${s.distance}${unit}` : "—",
        LIE_LABELS[s.lie] || "—",
        LIE_LABELS[s.nextLie] || "—",
        DIR_LABELS[s.direction] || "—",
        DEPTH_LABELS[s.depth] || "—",
        RES_LABELS[s.result] || "—",
        (s.memo || "").replace(/\|/g, "／").replace(/\n/g, " "),
      ]
        .map((v) => ` ${v} `)
        .join("|");
      lines.push("|" + row + "|");
    });
  });
  lines.push("");
  lines.push("## クラブ別傾向（本ラウンドのみ）");
  lines.push("");
  Object.entries(byClub).forEach(([cid, shots]) => {
    const c = clubMap[cid];
    if (!c) return;
    const dists = shots
      .filter((s) => s.distance != null && s.result !== "ob")
      .map((s) => s.distance);
    const dirs = shots.filter((s) => s.direction);
    const depths = shots.filter((s) => s.depth);
    const miss = shots.filter((s) =>
      ["miss", "bad", "ob"].includes(s.result)
    ).length;
    const parts = [`${shots.length}回`];
    if (dists.length)
      parts.push(
        `平均${Math.round(
          dists.reduce((a, b) => a + b, 0) / dists.length
        )}${unit}`
      );
    if (dirs.length) {
      const counts = { left: 0, straight: 0, right: 0 };
      dirs.forEach((s) => counts[s.direction]++);
      parts.push(
        `方向 左${counts.left}/直${counts.straight}/右${counts.right}`
      );
    }
    if (depths.length) {
      const counts = { short: 0, pin: 0, over: 0 };
      depths.forEach((s) => counts[s.depth]++);
      parts.push(`距離感 短${counts.short}/ピン${counts.pin}/長${counts.over}`);
    }
    parts.push(`ミス率${Math.round((miss / shots.length) * 100)}%`);
    lines.push(`- **${c.name}**: ${parts.join(" / ")}`);
  });
  return lines.join("\n");
}

function buildIssueAnalysisPrompt(state) {
  const lines = [];
  lines.push("# 現状の課題分析と練習メニュー提案");
  lines.push("");
  lines.push(
    "あなたは経験豊富なゴルフコーチです。以下の累積データから、私の現状の最重要課題と、それを改善する具体的な練習メニューを提案してください。"
  );
  lines.push("");
  lines.push("## 回答フォーマット");
  lines.push("1. **最重要課題TOP3**（データ根拠を添えて）");
  lines.push(
    "2. **各課題に対する練習ドリル**（自宅/練習場/コースのどこでやるかも明記）"
  );
  lines.push("3. **次の3ラウンドで意識すべき1つのこと**");
  lines.push("");
  lines.push("---");
  lines.push("");

  const rounds = state.rounds
    .map((r) => computeRoundKPI(r, state.clubs))
    .filter((r) => r.totalShots > 0);
  if (rounds.length > 0) {
    const all = aggregateKPI(rounds);
    const recent = aggregateKPI(rounds.slice(0, 5));
    lines.push("## ラウンドKPI推移");
    lines.push("");
    lines.push("| 指標 | 直近5 | 全期間 |");
    lines.push("|---|---|---|");
    lines.push(
      `| 平均スコア | ${recent.avgScore ?? "—"} | ${all.avgScore ?? "—"} |`
    );
    lines.push(
      `| 平均パット | ${recent.avgPutts ?? "—"} | ${all.avgPutts ?? "—"} |`
    );
    lines.push(
      `| パーオン率 | ${recent.parOnRate ?? "—"}% | ${all.parOnRate ?? "—"}% |`
    );
    lines.push(
      `| FWキープ率 | ${recent.fwKeepRate ?? "—"}% | ${
        all.fwKeepRate ?? "—"
      }% |`
    );
    lines.push(`| OB率 | ${recent.obRate ?? "—"}% | ${all.obRate ?? "—"}% |`);
    lines.push(
      `| ラウンド数 | ${Math.min(5, rounds.length)} | ${rounds.length} |`
    );
    lines.push("");
  }

  const stats = computeClubStats(state);
  const used = stats.filter((s) => s.n > 0);
  if (used.length > 0) {
    lines.push("## クラブ別パフォーマンス");
    lines.push("");
    lines.push(
      "| クラブ | 平均距離 | レンジ | ミス率 | 方向(左/直/右) | 距離感(短/ピン/長) | n |"
    );
    lines.push("|---|---|---|---|---|---|---|");
    used.forEach((s) => {
      const dir =
        s.dir.n > 0 ? `${s.dir.left}/${s.dir.straight}/${s.dir.right}` : "—";
      const dep =
        s.depth.n > 0 ? `${s.depth.short}/${s.depth.pin}/${s.depth.over}` : "—";
      lines.push(
        `| ${s.club.name} | ${s.trimmed ?? "—"}${state.unit} | ${
          s.min != null ? `${s.min}-${s.max}` : "—"
        } | ${s.missRate ?? "—"}% | ${dir} | ${dep} | ${s.n} |`
      );
    });
    lines.push("");
  }
  return lines.join("\n");
}

function buildClubDistancePrompt(state) {
  const lines = [];
  lines.push("# 番手選択アドバイス用データ");
  lines.push("");
  lines.push(
    "以下が私の実戦距離データです。ラウンド中に「残り距離XX、ライは○○、状況は△△」と質問するので、最適な番手と狙い方を提案してください。"
  );
  lines.push("");
  lines.push("## 回答フォーマット");
  lines.push("1. 推奨クラブと理由（1〜2文）");
  lines.push("2. 狙うエリア（ピンを直接狙うか、安全策か）");
  lines.push("3. 注意点（このクラブのミス傾向に対する対策）");
  lines.push("");
  lines.push("---");
  lines.push("");

  const stats = computeClubStats(state);
  const used = stats
    .filter((s) => s.trimmed != null)
    .sort((a, b) => (b.trimmed || 0) - (a.trimmed || 0));
  if (used.length === 0) {
    lines.push("（まだデータが蓄積されていません）");
    return lines.join("\n");
  }

  lines.push(`## 実戦クラブ別距離（単位: ${state.unit}、外れ値除外平均）`);
  lines.push("");
  lines.push(
    "| クラブ | 信頼距離 | FW時 | ラフ時 | レンジ | ミス率 | 方向傾向 | 距離感傾向 | n |"
  );
  lines.push("|---|---|---|---|---|---|---|---|---|");
  used.forEach((s) => {
    let dirTrend = "—";
    if (s.dir.n >= 3) {
      const lp = s.dir.left / s.dir.n,
        rp = s.dir.right / s.dir.n,
        sp = s.dir.straight / s.dir.n;
      if (rp >= 0.5) dirTrend = `右${Math.round(rp * 100)}%`;
      else if (lp >= 0.5) dirTrend = `左${Math.round(lp * 100)}%`;
      else if (sp >= 0.6) dirTrend = `直${Math.round(sp * 100)}%`;
      else dirTrend = "混合";
    }
    let depTrend = "—";
    if (s.depth.n >= 3) {
      const shp = s.depth.short / s.depth.n,
        op = s.depth.over / s.depth.n;
      if (shp >= 0.5) depTrend = `短${Math.round(shp * 100)}%`;
      else if (op >= 0.5) depTrend = `長${Math.round(op * 100)}%`;
      else depTrend = "安定";
    }
    lines.push(
      `| ${s.club.name} | ${s.trimmed} | ${s.fwAvg ?? "—"} | ${
        s.roughAvg ?? "—"
      } | ${s.min}-${s.max} | ${s.missRate}% | ${dirTrend} | ${depTrend} | ${
        s.n
      } |`
    );
  });
  return lines.join("\n");
}

// ===== クラブ統計 =====
function computeClubStats(state) {
  const byClub = {};
  state.clubs.forEach((c) => {
    byClub[c.id] = { club: c, all: [], fw: [], rough: [], shots: [] };
  });
  state.rounds.forEach((r) => {
    r.holes.forEach((h) => {
      h.shots.forEach((s) => {
        if (!byClub[s.clubId]) return;
        byClub[s.clubId].shots.push(s);
        if (s.distance != null && s.result !== "ob") {
          byClub[s.clubId].all.push(s.distance);
          if (s.lie === "fw" || s.lie === "tee")
            byClub[s.clubId].fw.push(s.distance);
          if (s.lie === "rough") byClub[s.clubId].rough.push(s.distance);
        }
      });
    });
  });
  return state.clubs.map((c) => {
    const data = byClub[c.id];
    const all = data.all;
    const missCount = data.shots.filter((s) =>
      ["miss", "bad", "ob"].includes(s.result)
    ).length;
    const dirShots = data.shots.filter((s) => s.direction);
    const dir = {
      left: dirShots.filter((s) => s.direction === "left").length,
      straight: dirShots.filter((s) => s.direction === "straight").length,
      right: dirShots.filter((s) => s.direction === "right").length,
      n: dirShots.length,
    };
    const depthShots = data.shots.filter((s) => s.depth);
    const depth = {
      short: depthShots.filter((s) => s.depth === "short").length,
      pin: depthShots.filter((s) => s.depth === "pin").length,
      over: depthShots.filter((s) => s.depth === "over").length,
      n: depthShots.length,
    };
    return {
      club: c,
      n: data.shots.length,
      avg: all.length
        ? Math.round(all.reduce((a, b) => a + b, 0) / all.length)
        : null,
      median: all.length ? Math.round(median(all)) : null,
      trimmed: all.length ? Math.round(trimmedMean(all)) : null,
      max: all.length ? Math.max(...all) : null,
      min: all.length ? Math.min(...all) : null,
      fwAvg: data.fw.length
        ? Math.round(data.fw.reduce((a, b) => a + b, 0) / data.fw.length)
        : null,
      roughAvg: data.rough.length
        ? Math.round(data.rough.reduce((a, b) => a + b, 0) / data.rough.length)
        : null,
      missRate: data.shots.length
        ? Math.round((missCount / data.shots.length) * 100)
        : null,
      dir,
      depth,
    };
  });
}

// ===== ラウンドKPI =====
function computeRoundKPI(round, clubs) {
  const putterIds = new Set(
    clubs.filter((c) => c.category === "putter").map((c) => c.id)
  );
  let putts = 0,
    totalShots = 0,
    obs = 0;
  let parOn = 0,
    parOnEligible = 0;
  let fwKeep = 0,
    fwEligible = 0;
  let recordedHoles = 0;

  round.holes.forEach((h) => {
    if (h.shots.length === 0) return;
    recordedHoles++;
    totalShots += h.shots.length;
    h.shots.forEach((s) => {
      if (putterIds.has(s.clubId)) putts++;
      if (s.result === "ob") obs++;
    });
    const targetIdx = h.par - 2 - 1;
    if (targetIdx >= 0 && h.shots.length > targetIdx) {
      parOnEligible++;
      const shotAt = h.shots[targetIdx];
      if (shotAt && shotAt.nextLie === "green") parOn++;
    }
    if (h.par >= 4 && h.shots.length >= 1) {
      fwEligible++;
      const tee = h.shots[0];
      if (tee && tee.nextLie === "fw") fwKeep++;
    }
  });
  return {
    id: round.id,
    date: round.date,
    course: round.course,
    totalShots,
    putts,
    obs,
    parOn,
    parOnEligible,
    fwKeep,
    fwEligible,
    recordedHoles,
  };
}

function aggregateKPI(rounds) {
  if (rounds.length === 0)
    return {
      avgScore: null,
      avgPutts: null,
      parOnRate: null,
      fwKeepRate: null,
      obRate: null,
    };
  const sumScore = rounds.reduce((a, r) => a + r.totalShots, 0);
  const sumPutts = rounds.reduce((a, r) => a + r.putts, 0);
  const sumParOn = rounds.reduce((a, r) => a + r.parOn, 0);
  const sumParOnEli = rounds.reduce((a, r) => a + r.parOnEligible, 0);
  const sumFwKeep = rounds.reduce((a, r) => a + r.fwKeep, 0);
  const sumFwEli = rounds.reduce((a, r) => a + r.fwEligible, 0);
  const sumObs = rounds.reduce((a, r) => a + r.obs, 0);
  return {
    avgScore: Math.round((sumScore / rounds.length) * 10) / 10,
    avgPutts: Math.round((sumPutts / rounds.length) * 10) / 10,
    parOnRate: sumParOnEli ? Math.round((sumParOn / sumParOnEli) * 100) : null,
    fwKeepRate: sumFwEli ? Math.round((sumFwKeep / sumFwEli) * 100) : null,
    obRate: sumScore ? Math.round((sumObs / sumScore) * 1000) / 10 : null,
  };
}

// ============================================================
//  ROOT APP
// ============================================================
export default function App() {
  const [state, setState] = useState(initialState);
  const [view, setView] = useState({ name: "home" });

  // チュートリアル表示判定（localStorage に完了フラグがなければ表示）
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return !localStorage.getItem("golf-shot-tracker:tutorial-done");
    } catch {
      return true;
    }
  });

  const closeTutorial = () => {
    try {
      localStorage.setItem("golf-shot-tracker:tutorial-done", "1");
    } catch {}
    setShowTutorial(false);
  };

  useEffect(() => saveState(state), [state]);

  // viewport meta tag を動的に設定（iPhone Safariで画面サイズにフィット）
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.content =
      "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover";

    // PWA用 meta も追加（iPhone ホーム画面追加時のステータスバー対応）
    const ensureMeta = (name, content) => {
      let m = document.querySelector(`meta[name="${name}"]`);
      if (!m) {
        m = document.createElement("meta");
        m.name = name;
        document.head.appendChild(m);
      }
      m.content = content;
    };
    ensureMeta("apple-mobile-web-app-capable", "yes");
    ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    ensureMeta("theme-color", "#0a0a0a");

    // body の背景色を黒に
    document.body.style.background = "#000";
    document.documentElement.style.background = "#000";
  }, []);

  // CodeSandbox の iframe 上で動いているかを判定（バナーが表示されるか）
  const isCodeSandbox = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      // iframe内 + CSBドメイン
      const inIframe = window.self !== window.top;
      const csbHost = /(\.csb\.app|codesandbox\.io)/.test(
        window.location.hostname
      );
      return inIframe && csbHost;
    } catch {
      return true; // クロスオリジンエラー時はiframe内とみなす
    }
  }, []);

  const activeRound =
    view.name === "round"
      ? state.rounds.find((r) => r.id === view.roundId)
      : null;

  return (
    <div className={`app ${isCodeSandbox ? "in-csb" : "standalone"}`}>
      <Style />
      <div className="phone-frame">
        {view.name === "home" && (
          <HomeView
            state={state}
            setState={setState}
            onOpenRound={(id) => setView({ name: "round", roundId: id })}
            onOpenAnalytics={() => setView({ name: "analytics" })}
            onOpenCourses={() => setView({ name: "courses" })}
            onOpenClubs={() => setView({ name: "clubs" })}
            onOpenTutorial={() => setShowTutorial(true)}
          />
        )}
        {view.name === "round" && activeRound && (
          <RoundView
            round={activeRound}
            clubs={state.clubs}
            unit={state.unit}
            courseMasters={state.courseMasters || []}
            onBack={() => setView({ name: "home" })}
            onUpdate={(updater) => {
              setState((s) => ({
                ...s,
                rounds: s.rounds.map((r) =>
                  r.id === activeRound.id ? updater(r) : r
                ),
              }));
            }}
            onUpdateCourseMaster={(venue, courseName, tee, holes) => {
              setState((s) => ({
                ...s,
                courseMasters: upsertCourseMaster(
                  s.courseMasters || [],
                  venue,
                  courseName,
                  tee,
                  holes
                ),
              }));
            }}
            onDelete={() => {
              setState((s) => ({
                ...s,
                rounds: s.rounds.filter((r) => r.id !== activeRound.id),
              }));
              setView({ name: "home" });
            }}
          />
        )}
        {view.name === "analytics" && (
          <AnalyticsView
            state={state}
            onBack={() => setView({ name: "home" })}
          />
        )}
        {view.name === "courses" && (
          <CoursesView
            state={state}
            setState={setState}
            onBack={() => setView({ name: "home" })}
          />
        )}
        {view.name === "clubs" && (
          <ClubsView
            state={state}
            setState={setState}
            onBack={() => setView({ name: "home" })}
          />
        )}
      </div>
      {showTutorial && <Tutorial onClose={closeTutorial} />}
    </div>
  );
}

// ============================================================
//  HOME
// ============================================================
function HomeView({
  state,
  setState,
  onOpenRound,
  onOpenAnalytics,
  onOpenCourses,
  onOpenClubs,
  onOpenTutorial,
}) {
  const [showNew, setShowNew] = useState(false);

  const totalShots = useMemo(
    () =>
      state.rounds.reduce(
        (acc, r) => acc + r.holes.reduce((a, h) => a + h.shots.length, 0),
        0
      ),
    [state.rounds]
  );

  const startRound = (data) => {
    const round = {
      id: uid(),
      date: data.date,
      course: data.course,
      venue: data.venue,
      frontCourse: data.frontCourse,
      backCourse: data.backCourse,
      tee: data.tee,
      weather: data.weather,
      holes: Array.from({ length: 18 }, (_, i) => {
        const fromMaster = data.combinedHoles?.[i];
        return {
          id: uid(),
          number: i + 1,
          par: fromMaster?.par ?? 4,
          distance: fromMaster?.distance ?? null,
          shots: [],
        };
      }),
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, rounds: [round, ...s.rounds] }));
    setShowNew(false);
    onOpenRound(round.id);
  };

  // スワイプで開いているカードのID（同時に複数開かない）
  const [swipedId, setSwipedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const deleteRound = (id) => {
    setState((s) => ({
      ...s,
      rounds: s.rounds.filter((r) => r.id !== id),
    }));
    setConfirmDeleteId(null);
    setSwipedId(null);
  };

  const confirmingRound = state.rounds.find((r) => r.id === confirmDeleteId);

  return (
    <div className="screen" onClick={() => swipedId && setSwipedId(null)}>
      <header className="hero">
        <div className="hero-eyebrow">SHOT LOG</div>
        <h1 className="hero-title">
          My Caddie<span className="dot">.</span>
        </h1>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">{state.rounds.length}</div>
            <div className="stat-label">rounds</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-num">{totalShots}</div>
            <div className="stat-label">shots</div>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <div className="stat-num">{state.clubs.length}</div>
            <div className="stat-label">clubs</div>
          </div>
        </div>
      </header>

      <div className="cta-row">
        <button className="cta-primary" onClick={() => setShowNew(true)}>
          <Plus size={18} strokeWidth={2.5} />
          <span>新しいラウンド</span>
        </button>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">ラウンド履歴</div>
          <button
            className="section-help-btn"
            onClick={onOpenTutorial}
            aria-label="使い方"
          >
            <span className="section-help-mark">?</span>
            <span className="section-help-text">使い方</span>
          </button>
        </div>
        {state.rounds.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⛳</div>
            <div className="empty-title">まだラウンドがありません</div>
            <div className="empty-sub">
              「新しいラウンド」から記録を始めましょう
            </div>
          </div>
        ) : (
          <div className="round-list">
            {state.rounds.map((r) => {
              const kpi = computeRoundKPI(r, state.clubs);
              return (
                <SwipeableRoundCard
                  key={r.id}
                  round={r}
                  kpi={kpi}
                  isSwipedOpen={swipedId === r.id}
                  onSwipeOpen={() => setSwipedId(r.id)}
                  onSwipeClose={() => setSwipedId(null)}
                  onTap={() => onOpenRound(r.id)}
                  onDeleteClick={() => setConfirmDeleteId(r.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <button className="nav-btn active">
          <Flag size={20} />
          <span>ラウンド</span>
        </button>
        <button className="nav-btn" onClick={onOpenAnalytics}>
          <BarChart3 size={20} />
          <span>分析</span>
        </button>
        <button className="nav-btn" onClick={onOpenCourses}>
          <MapPin size={20} />
          <span>コース</span>
        </button>
        <button className="nav-btn" onClick={onOpenClubs}>
          <Settings size={20} />
          <span>クラブ</span>
        </button>
      </nav>

      {showNew && (
        <NewRoundSheet
          courseMasters={state.courseMasters || []}
          onCancel={() => setShowNew(false)}
          onStart={startRound}
        />
      )}

      {confirmingRound && (
        <DeleteConfirmModal
          round={confirmingRound}
          totalShots={confirmingRound.holes.reduce(
            (a, h) => a + h.shots.length,
            0
          )}
          recordedHoles={
            confirmingRound.holes.filter((h) => h.shots.length > 0).length
          }
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteRound(confirmDeleteId)}
        />
      )}
    </div>
  );
}

// ============================================================
//  SWIPEABLE ROUND CARD
// ============================================================
function SwipeableRoundCard({
  round,
  kpi,
  isSwipedOpen,
  onSwipeOpen,
  onSwipeClose,
  onTap,
  onDeleteClick,
}) {
  const [drag, setDrag] = useState(0); // 現在のドラッグ量（負の値=左方向）
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lockedRef = useRef(null); // 'h' | 'v' | null（ジェスチャー方向確定）
  const movedRef = useRef(false);

  const REVEAL_WIDTH = 80; // 削除ボタンの幅
  const SWIPE_THRESHOLD = 40; // この量以上スワイプすると開く

  // isSwipedOpen の変化に応じて drag をリセット/復元
  useEffect(() => {
    if (!isDragging) {
      setDrag(isSwipedOpen ? -REVEAL_WIDTH : 0);
    }
  }, [isSwipedOpen, isDragging]);

  const handleStart = (clientX, clientY) => {
    startXRef.current = clientX;
    startYRef.current = clientY;
    lockedRef.current = null;
    movedRef.current = false;
    setIsDragging(true);
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startXRef.current;
    const dy = clientY - startYRef.current;

    // 方向が確定していなければ判定（10px以上動いたら確定）
    if (lockedRef.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        lockedRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
    }

    // 横方向ジェスチャーのみ削除ボタンを動かす
    if (lockedRef.current === "h") {
      movedRef.current = true;
      const base = isSwipedOpen ? -REVEAL_WIDTH : 0;
      let next = base + dx;
      // 左方向（負）にだけ動かす、右側はバウンス
      if (next > 0) next = next * 0.2;
      if (next < -REVEAL_WIDTH * 1.5) next = -REVEAL_WIDTH * 1.5;
      setDrag(next);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (lockedRef.current === "h") {
      // 左に大きくスワイプしたら開く
      if (drag < -SWIPE_THRESHOLD) {
        setDrag(-REVEAL_WIDTH);
        if (!isSwipedOpen) onSwipeOpen();
      } else {
        setDrag(0);
        if (isSwipedOpen) onSwipeClose();
      }
    }
  };

  // タッチイベント
  const onTouchStart = (e) =>
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e) =>
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleEnd();

  // マウスイベント（PC確認用）
  const onMouseDown = (e) => handleStart(e.clientX, e.clientY);
  const onMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => handleEnd();

  // タップ時の挙動：スワイプで開いていれば閉じる、そうでなければラウンド画面へ
  const handleClick = (e) => {
    if (movedRef.current) {
      e.stopPropagation();
      return;
    }
    if (isSwipedOpen) {
      e.stopPropagation();
      onSwipeClose();
      return;
    }
    onTap();
  };

  return (
    <div className="swipe-row">
      <div className="swipe-action">
        <button
          className="swipe-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          aria-label="削除"
        >
          <Trash2 size={20} />
          <span>削除</span>
        </button>
      </div>
      <div
        className={`swipe-foreground ${isDragging ? "dragging" : ""}`}
        style={{ transform: `translateX(${drag}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <button className="round-card" onClick={handleClick}>
          <div className="round-card-main">
            <div className="round-card-date">{fmtDate(round.date)}</div>
            <div className="round-card-course">
              {round.course || "無題のラウンド"}
            </div>
            <div className="round-card-meta">
              {round.tee && <span>{round.tee}</span>}
              {round.weather && <span>{round.weather}</span>}
              <span>{kpi.recordedHoles}/18 holes</span>
            </div>
            {kpi.totalShots > 0 && (
              <div className="round-card-kpis">
                <span className="rkpi-mini">
                  <b>{kpi.putts}</b> パット
                </span>
                {kpi.parOnEligible > 0 && (
                  <span className="rkpi-mini">
                    <b>
                      {kpi.parOn}/{kpi.parOnEligible}
                    </b>{" "}
                    パーオン
                  </span>
                )}
                {kpi.fwEligible > 0 && (
                  <span className="rkpi-mini">
                    <b>
                      {kpi.fwKeep}/{kpi.fwEligible}
                    </b>{" "}
                    FW
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="round-card-score">
            <div className="score-num">{kpi.totalShots}</div>
            <div className="score-label">shots</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function NewRoundSheet({ courseMasters, onCancel, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [venue, setVenue] = useState("");
  const [tee, setTee] = useState("");
  const [frontCourse, setFrontCourse] = useState("");
  const [backCourse, setBackCourse] = useState("");
  const [weather, setWeather] = useState("");
  const [showVenueList, setShowVenueList] = useState(false);
  const [showFrontList, setShowFrontList] = useState(false);
  const [showBackList, setShowBackList] = useState(false);

  // コースマスター登録済みのvenueのみ（重複排除）
  const registeredVenues = useMemo(() => {
    const set = new Set();
    DEFAULT_COURSES.forEach((c) => set.add(c.venue));
    courseMasters.forEach((c) => set.add(c.venue));
    return Array.from(set).sort();
  }, [courseMasters]);

  // 選択中venueに紐づくtee一覧
  const teeOptions = useMemo(() => {
    return getTeesForVenue(venue.trim(), courseMasters);
  }, [venue, courseMasters]);

  // venue+tee に紐づくコース名候補
  const courseOptions = useMemo(() => {
    return getCoursesForVenueAndTee(
      venue.trim(),
      tee || null,
      courseMasters
    ).map((c) => c.course);
  }, [venue, tee, courseMasters]);

  const filteredFront = useMemo(() => {
    const q = frontCourse.trim();
    if (!q) return courseOptions;
    return courseOptions.filter((c) => c.includes(q));
  }, [frontCourse, courseOptions]);

  const filteredBack = useMemo(() => {
    const q = backCourse.trim();
    if (!q) return courseOptions;
    return courseOptions.filter((c) => c.includes(q));
  }, [backCourse, courseOptions]);

  const frontMaster = findCourseMaster(
    venue.trim(),
    frontCourse.trim(),
    tee || null,
    courseMasters
  );
  const backMaster = findCourseMaster(
    venue.trim(),
    backCourse.trim(),
    tee || null,
    courseMasters
  );

  const handleStart = () => {
    if (!venue.trim()) return;

    const frontHoles = frontMaster?.holes || [];
    const backHoles = backMaster?.holes || [];

    const combinedHoles = Array.from({ length: 18 }, (_, i) => {
      if (i < 9) {
        const h = frontHoles[i];
        return h
          ? { par: h.par, distance: h.distance }
          : { par: 4, distance: null };
      } else {
        const h = backHoles[i - 9];
        return h
          ? { par: h.par, distance: h.distance }
          : { par: 4, distance: null };
      }
    });

    const courseLabel =
      frontCourse.trim() && backCourse.trim()
        ? venue + " [" + frontCourse + " → " + backCourse + "]"
        : frontCourse.trim()
        ? venue + " [" + frontCourse + "]"
        : venue;

    onStart({
      date,
      venue: venue.trim(),
      frontCourse: frontCourse.trim(),
      backCourse: backCourse.trim(),
      course: courseLabel,
      tee: tee || null,
      weather,
      combinedHoles,
    });
  };

  const canStart = venue.trim().length > 0;

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">新しいラウンド</div>

        <label className="field">
          <span className="field-label">
            <Calendar size={14} /> 日付
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {/* ゴルフ場（リストから選択のみ） */}
        <div className="field course-field">
          <span className="field-label">
            <MapPin size={14} /> ゴルフ場
          </span>
          <button
            type="button"
            className="venue-selector"
            onClick={() => setShowVenueList(!showVenueList)}
          >
            <span className={venue ? "venue-selected" : "venue-placeholder"}>
              {venue || "タップしてゴルフ場を選択"}
            </span>
            <span className={`venue-caret ${showVenueList ? "open" : ""}`}>
              ▾
            </span>
          </button>
          {showVenueList && registeredVenues.length > 0 && (
            <div className="combo-list venue-list">
              {registeredVenues.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`combo-item ${venue === v ? "on" : ""}`}
                  onClick={() => {
                    setVenue(v);
                    setShowVenueList(false);
                    setTee("");
                    setFrontCourse("");
                    setBackCourse("");
                  }}
                >
                  <span className="combo-master-badge">★</span>
                  {v}
                </button>
              ))}
            </div>
          )}
          {showVenueList && registeredVenues.length === 0 && (
            <div className="venue-empty">
              コースマスター未登録です。コースタブから登録してください
            </div>
          )}
        </div>

        {/* ティー選択（マスターありの場合のみ表示） */}
        {venue.trim() && teeOptions.length > 0 && (
          <div className="field">
            <span className="field-label">ティー</span>
            <div className="chip-row">
              {teeOptions.map((t) => (
                <button
                  key={t}
                  className={`chip tee-chip tee-${t.toLowerCase()} ${
                    tee === t ? "on" : ""
                  }`}
                  onClick={() => {
                    setTee(t === tee ? "" : t);
                    setFrontCourse("");
                    setBackCourse("");
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 前半コース（venue + tee 確定後） */}
        {venue.trim() && (teeOptions.length === 0 || tee) && (
          <div className="field course-field">
            <span className="field-label">前半コース</span>
            <div className="combobox">
              <input
                type="text"
                value={frontCourse}
                placeholder={courseOptions.length ? "例：西OUT" : "手入力でOK"}
                onChange={(e) => {
                  setFrontCourse(e.target.value);
                  setShowFrontList(true);
                }}
                onFocus={() => setShowFrontList(true)}
              />
              {frontCourse && (
                <button
                  type="button"
                  className="combo-clear"
                  onClick={() => {
                    setFrontCourse("");
                    setShowFrontList(true);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            {showFrontList && filteredFront.length > 0 && (
              <div className="combo-list">
                {filteredFront.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`combo-item ${frontCourse === c ? "on" : ""}`}
                    onClick={() => {
                      setFrontCourse(c);
                      setShowFrontList(false);
                    }}
                  >
                    <span className="combo-master-badge">★</span>
                    {c}
                  </button>
                ))}
              </div>
            )}
            {frontMaster && (
              <div className="course-master-hint">
                ★ コースデータあり（{frontMaster.holes.length}H
                のPar・距離を自動入力）
              </div>
            )}
          </div>
        )}

        {/* 後半コース */}
        {venue.trim() &&
          frontCourse.trim() &&
          (teeOptions.length === 0 || tee) && (
            <div className="field course-field">
              <span className="field-label">後半コース</span>
              <div className="combobox">
                <input
                  type="text"
                  value={backCourse}
                  placeholder={courseOptions.length ? "例：西IN" : "手入力でOK"}
                  onChange={(e) => {
                    setBackCourse(e.target.value);
                    setShowBackList(true);
                  }}
                  onFocus={() => setShowBackList(true)}
                />
                {backCourse && (
                  <button
                    type="button"
                    className="combo-clear"
                    onClick={() => {
                      setBackCourse("");
                      setShowBackList(true);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              {showBackList && filteredBack.length > 0 && (
                <div className="combo-list">
                  {filteredBack.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`combo-item ${backCourse === c ? "on" : ""}`}
                      onClick={() => {
                        setBackCourse(c);
                        setShowBackList(false);
                      }}
                    >
                      <span className="combo-master-badge">★</span>
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {backMaster && (
                <div className="course-master-hint">
                  ★ コースデータあり（{backMaster.holes.length}H
                  のPar・距離を自動入力）
                </div>
              )}
            </div>
          )}

        {/* ティー候補がない場合の手入力フォーム */}
        {venue.trim() && teeOptions.length === 0 && (
          <div className="field">
            <span className="field-label">ティー（任意・手入力）</span>
            <div className="chip-row">
              {["White", "Red", "Blue", "Gold", "レギュラー", "バック"].map(
                (t) => (
                  <button
                    key={t}
                    className={`chip tee-chip tee-${t.toLowerCase()} ${
                      tee === t ? "on" : ""
                    }`}
                    onClick={() => setTee(t === tee ? "" : t)}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <div className="field">
          <span className="field-label">
            <Cloud size={14} /> 天候（任意）
          </span>
          <div className="chip-row">
            {["☀️ 晴", "⛅️ 曇", "🌧 雨", "🌬 強風"].map((w) => (
              <button
                key={w}
                className={`chip ${weather === w ? "on" : ""}`}
                onClick={() => setWeather(weather === w ? "" : w)}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-actions">
          <button className="btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button
            className="btn-primary"
            onClick={handleStart}
            disabled={!canStart}
          >
            開始
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  ROUND VIEW
// ============================================================
function RoundView({
  round,
  clubs,
  unit,
  courseMasters,
  onBack,
  onUpdate,
  onUpdateCourseMaster,
  onDelete,
}) {
  const [holeIdx, setHoleIdx] = useState(() => {
    const firstUnrecorded = round.holes.findIndex((h) => h.shots.length === 0);
    return firstUnrecorded === -1 ? 0 : firstUnrecorded;
  });
  const hole = round.holes[holeIdx];
  const [shotEditor, setShotEditor] = useState(null);

  const totalShots = round.holes.reduce((a, h) => a + h.shots.length, 0);
  const isLastHole = holeIdx === 17;
  const [showFinish, setShowFinish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const recordedHoles = round.holes.filter((h) => h.shots.length > 0).length;

  // ホール変更時にコースマスターも上書き保存
  const updateHoleAndMaster = (patch) => {
    onUpdate((r) => ({
      ...r,
      holes: r.holes.map((h, i) => (i === holeIdx ? { ...h, ...patch } : h)),
    }));

    // 該当する前半/後半コースマスターを更新
    if (round.venue && (round.frontCourse || round.backCourse)) {
      const isFront = holeIdx < 9;
      const courseName = isFront ? round.frontCourse : round.backCourse;
      if (!courseName) return;

      // 更新後の9Hデータを作る
      const newRoundHoles = round.holes.map((h, i) =>
        i === holeIdx ? { ...h, ...patch } : h
      );
      const targetHoles = isFront
        ? newRoundHoles.slice(0, 9)
        : newRoundHoles.slice(9, 18);
      const masterHoles = targetHoles.map((h, i) => ({
        number: i + 1,
        par: h.par,
        distance: h.distance,
      }));
      onUpdateCourseMaster(
        round.venue,
        courseName,
        round.tee || null,
        masterHoles
      );
    }
  };

  const updateHole = (patch) => updateHoleAndMaster(patch);

  const addShot = (shot) => {
    onUpdate((r) => ({
      ...r,
      holes: r.holes.map((h, i) =>
        i === holeIdx
          ? { ...h, shots: [...h.shots, { ...shot, id: uid() }] }
          : h
      ),
    }));
  };
  const updateShot = (shotId, shot) => {
    onUpdate((r) => ({
      ...r,
      holes: r.holes.map((h, i) =>
        i === holeIdx
          ? {
              ...h,
              shots: h.shots.map((s) =>
                s.id === shotId ? { ...s, ...shot } : s
              ),
            }
          : h
      ),
    }));
  };
  const deleteShot = (shotId) => {
    onUpdate((r) => ({
      ...r,
      holes: r.holes.map((h, i) =>
        i === holeIdx
          ? { ...h, shots: h.shots.filter((s) => s.id !== shotId) }
          : h
      ),
    }));
  };

  return (
    <div className="screen round-screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="topbar-title">
          <div className="topbar-course">{round.course || "ラウンド"}</div>
          <div className="topbar-meta">
            {fmtDate(round.date)} · {totalShots} shots
          </div>
        </div>
        <button
          className="icon-btn icon-btn-danger"
          onClick={() => setShowDelete(true)}
          aria-label="ラウンド削除"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="hole-strip">
        {round.holes.map((h, i) => (
          <button
            key={h.id}
            className={`hole-pill ${i === holeIdx ? "on" : ""} ${
              h.shots.length > 0 ? "done" : ""
            }`}
            onClick={() => setHoleIdx(i)}
          >
            <span className="hole-pill-num">{h.number}</span>
            {h.shots.length > 0 && (
              <span className="hole-pill-shots">{h.shots.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="hole-header">
        <div className="hole-id">
          <span className="hole-id-label">HOLE</span>
          <span className="hole-id-num">{hole.number}</span>
        </div>
        <div className="hole-controls">
          <ParPicker value={hole.par} onChange={(par) => updateHole({ par })} />
          <DistanceField
            value={hole.distance}
            unit={unit}
            placeholder="距離"
            onChange={(distance) => updateHole({ distance })}
          />
        </div>
      </div>

      <div className="shots-area">
        {hole.shots.length === 0 ? (
          <div className="empty-shots">
            <div className="empty-shots-icon">🏌️</div>
            <div className="empty-shots-text">最初のショットを記録</div>
          </div>
        ) : (
          <div className="shot-list">
            {hole.shots.map((s, i) => (
              <ShotRow
                key={s.id}
                index={i + 1}
                shot={s}
                clubs={clubs}
                unit={unit}
                onClick={() => setShotEditor({ mode: "edit", shotId: s.id })}
              />
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShotEditor({ mode: "new" })}>
        <Plus size={24} strokeWidth={2.6} />
      </button>

      <div className="hole-nav">
        <button
          className="hole-nav-btn"
          onClick={() => setHoleIdx((i) => Math.max(0, i - 1))}
          disabled={holeIdx === 0}
        >
          ← 前のホール
        </button>
        {isLastHole ? (
          <button
            className="hole-nav-btn finish"
            onClick={() => setShowFinish(true)}
          >
            ラウンド終了 ✓
          </button>
        ) : (
          <button
            className="hole-nav-btn"
            onClick={() => setHoleIdx((i) => Math.min(17, i + 1))}
          >
            次のホール →
          </button>
        )}
      </div>

      {shotEditor && (
        <ShotEditor
          mode={shotEditor.mode}
          existing={
            shotEditor.mode === "edit"
              ? hole.shots.find((s) => s.id === shotEditor.shotId)
              : null
          }
          previousLie={
            hole.shots.length > 0
              ? hole.shots[hole.shots.length - 1].nextLie
              : null
          }
          shotNumber={
            shotEditor.mode === "edit"
              ? hole.shots.findIndex((s) => s.id === shotEditor.shotId) + 1
              : hole.shots.length + 1
          }
          clubs={clubs}
          unit={unit}
          onCancel={() => setShotEditor(null)}
          onDelete={() => {
            deleteShot(shotEditor.shotId);
            setShotEditor(null);
          }}
          onSave={(shot) => {
            if (shotEditor.mode === "edit") updateShot(shotEditor.shotId, shot);
            else addShot(shot);
            setShotEditor(null);
          }}
        />
      )}

      {showFinish && (
        <div className="sheet-backdrop" onClick={() => setShowFinish(false)}>
          <div
            className="sheet finish-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="finish-icon">🏁</div>
            <div className="finish-title">ラウンド終了</div>
            <div className="finish-summary">
              <div className="finish-stat">
                <div className="finish-stat-num">{recordedHoles}</div>
                <div className="finish-stat-label">/ 18 ホール記録</div>
              </div>
              <div className="finish-stat">
                <div className="finish-stat-num">{totalShots}</div>
                <div className="finish-stat-label">total shots</div>
              </div>
            </div>
            <div className="finish-note">
              {recordedHoles < 18
                ? `未記録のホールが ${
                    18 - recordedHoles
                  } あります。後で追記できます。`
                : "全ホール記録完了 ✓"}
            </div>

            <AiCopyButton
              label="このラウンドをAIで振り返る"
              sublabel="Geminiに貼り付けて分析・改善点を相談"
              disabled={totalShots === 0}
              onBuild={() => buildRoundReviewPrompt(round, clubs, unit)}
            />

            <div className="sheet-actions">
              <button
                className="btn-ghost"
                onClick={() => setShowFinish(false)}
              >
                続ける
              </button>
              <button className="btn-primary" onClick={onBack}>
                終了してホームへ
              </button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <DeleteConfirmModal
          round={round}
          totalShots={totalShots}
          recordedHoles={recordedHoles}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => {
            setShowDelete(false);
            onDelete();
          }}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({
  round,
  totalShots,
  recordedHoles,
  onCancel,
  onConfirm,
}) {
  // 二段階確認: 最初に警告表示、確認チェックボックスを入れて初めて削除ボタンが有効になる
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet delete-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="delete-icon">⚠️</div>
        <div className="delete-title">ラウンドを削除しますか？</div>

        <div className="delete-info">
          <div className="delete-info-row">
            <span className="delete-info-label">日付</span>
            <span className="delete-info-value">{fmtDate(round.date)}</span>
          </div>
          <div className="delete-info-row">
            <span className="delete-info-label">コース</span>
            <span className="delete-info-value">
              {round.course || "無題のラウンド"}
            </span>
          </div>
          <div className="delete-info-row">
            <span className="delete-info-label">記録</span>
            <span className="delete-info-value">
              {recordedHoles}/18ホール · {totalShots}ショット
            </span>
          </div>
        </div>

        <div className="delete-warning">
          この操作は<b>取り消せません</b>。<br />
          ショット記録・KPIデータがすべて削除されます。
        </div>

        <label className="delete-confirm-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>上記を理解し、削除することに同意します</span>
        </label>

        <div className="sheet-actions">
          <button className="btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button
            className="btn-danger-large"
            onClick={onConfirm}
            disabled={!confirmed}
          >
            <Trash2 size={16} /> 削除する
          </button>
        </div>
      </div>
    </div>
  );
}

function ParPicker({ value, onChange }) {
  return (
    <div className="par-picker">
      <span className="par-label">Par</span>
      <div className="par-buttons">
        {[3, 4, 5].map((p) => (
          <button
            key={p}
            className={`par-btn ${value === p ? "on" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function DistanceField({ value, unit, placeholder, onChange }) {
  return (
    <div className="distance-field">
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      />
      <span className="unit">{unit}</span>
    </div>
  );
}

function ShotRow({ index, shot, clubs, unit, onClick }) {
  const club = clubs.find((c) => c.id === shot.clubId);
  const result = RESULTS.find((r) => r.id === shot.result);
  const lie = LIES.find((l) => l.id === shot.lie);
  const dirLabel =
    shot.direction === "left"
      ? "←"
      : shot.direction === "right"
      ? "→"
      : shot.direction === "straight"
      ? "↑"
      : null;
  const depthLabel =
    shot.depth === "short"
      ? "ショート"
      : shot.depth === "over"
      ? "オーバー"
      : shot.depth === "pin"
      ? "ピン"
      : null;
  return (
    <button className="shot-row" onClick={onClick}>
      <div className="shot-num">{index}</div>
      <div className="shot-club">{club?.name || "—"}</div>
      <div className="shot-distance">
        {shot.distance != null ? (
          <>
            <span className="dist-num">{shot.distance}</span>
            <span className="dist-unit">{unit}</span>
          </>
        ) : (
          <span className="dist-empty">—</span>
        )}
      </div>
      <div className="shot-tendency-tags">
        {dirLabel && <span className="tag tag-dir">{dirLabel}</span>}
        {depthLabel && <span className="tag tag-depth">{depthLabel}</span>}
      </div>
      <div className="shot-lie">{lie?.label}</div>
      <div className={`shot-result tone-${result?.tone}`}>{result?.label}</div>
    </button>
  );
}

// ============================================================
//  SHOT EDITOR
// ============================================================
function ShotEditor({
  mode,
  existing,
  previousLie,
  shotNumber,
  clubs,
  unit,
  onCancel,
  onSave,
  onDelete,
}) {
  const [clubId, setClubId] = useState(existing?.clubId || null);
  const [distance, setDistance] = useState(existing?.distance ?? null);
  const [lie, setLie] = useState(
    existing?.lie || (shotNumber === 1 ? "tee" : previousLie || "fw")
  );
  const [nextLie, setNextLie] = useState(existing?.nextLie || "fw");
  const [direction, setDirection] = useState(existing?.direction || null);
  const [depth, setDepth] = useState(existing?.depth || null);
  const [result, setResult] = useState(existing?.result || null);
  const [memo, setMemo] = useState(existing?.memo || "");

  // クラブ選択時は常に平均飛距離で上書き
  const handleClubSelect = (c) => {
    setClubId(c.id);
    if (c.avgDistance != null) setDistance(c.avgDistance);
  };

  const adjustDistance = (delta) =>
    setDistance((cur) => Math.max(0, (cur ?? 0) + delta));

  const grouped = useMemo(() => {
    const order = ["wood", "utility", "iron", "wedge", "putter"];
    const labels = {
      wood: "W",
      utility: "UT",
      iron: "I",
      wedge: "WG",
      putter: "PT",
    };
    return order
      .map((cat) => ({
        cat,
        label: labels[cat],
        items: clubs
          .filter((c) => c.category === cat)
          .sort((a, b) => {
            const av = a.avgDistance == null ? -Infinity : a.avgDistance;
            const bv = b.avgDistance == null ? -Infinity : b.avgDistance;
            return bv - av;
          }),
      }))
      .filter((g) => g.items.length);
  }, [clubs]);

  const canSave = clubId && result && lie;

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet shot-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="shot-sheet-head">
          <div className="shot-sheet-title">
            <span className="shot-sheet-num">#{shotNumber}</span>
            <span className="shot-sheet-label">ショット</span>
          </div>
          <button className="icon-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="editor-section">
          <div className="editor-label">クラブ</div>
          <div className="club-grid-compact">
            {grouped.map((g) => (
              <div key={g.cat} className="club-group-compact">
                <div className="club-group-label-compact">{g.label}</div>
                <div className="club-group-row-compact">
                  {g.items.map((c) => (
                    <button
                      key={c.id}
                      className={`club-btn-compact ${
                        clubId === c.id ? "on" : ""
                      } cat-${c.category}`}
                      onClick={() => handleClubSelect(c)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-label">飛距離</div>
          <div className="distance-display">
            <input
              type="number"
              inputMode="numeric"
              className="distance-input-large"
              value={distance ?? ""}
              placeholder="0"
              onChange={(e) =>
                setDistance(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />
            <span className="distance-unit-large">{unit}</span>
          </div>
          <div className="adjust-row">
            {[-10, -5, -1, +1, +5, +10].map((d) => (
              <button
                key={d}
                className={`adjust-btn ${d < 0 ? "minus" : "plus"}`}
                onClick={() => adjustDistance(d)}
              >
                {d > 0 ? `+${d}` : d}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-section two-col">
          <div>
            <div className="editor-label">打点（ライ）</div>
            <div className="chip-row tight">
              {LIES.map((l) => (
                <button
                  key={l.id}
                  className={`chip lie-chip ${lie === l.id ? "on" : ""}`}
                  onClick={() => setLie(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="editor-label">着地</div>
            <div className="chip-row tight">
              {LIES.filter((l) => l.id !== "tee").map((l) => (
                <button
                  key={l.id}
                  className={`chip lie-chip ${nextLie === l.id ? "on" : ""}`}
                  onClick={() => setNextLie(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-label">ショット</div>
          <div className="shot-tendency-grid">
            <button
              className={`tendency-btn ${direction === "left" ? "on" : ""}`}
              onClick={() => setDirection(direction === "left" ? null : "left")}
            >
              ← 左
            </button>
            <button
              className={`tendency-btn center ${
                direction === "straight" ? "on" : ""
              }`}
              onClick={() =>
                setDirection(direction === "straight" ? null : "straight")
              }
            >
              ストレート
            </button>
            <button
              className={`tendency-btn ${direction === "right" ? "on" : ""}`}
              onClick={() =>
                setDirection(direction === "right" ? null : "right")
              }
            >
              右 →
            </button>
            <button
              className={`tendency-btn ${depth === "short" ? "on" : ""}`}
              onClick={() => setDepth(depth === "short" ? null : "short")}
            >
              ↓ ショート
            </button>
            <button
              className={`tendency-btn center ${depth === "pin" ? "on" : ""}`}
              onClick={() => setDepth(depth === "pin" ? null : "pin")}
            >
              ピン
            </button>
            <button
              className={`tendency-btn ${depth === "over" ? "on" : ""}`}
              onClick={() => setDepth(depth === "over" ? null : "over")}
            >
              ↑ オーバー
            </button>
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-label">結果</div>
          <div className="result-row">
            {RESULTS.map((r) => (
              <button
                key={r.id}
                className={`result-btn tone-${r.tone} ${
                  result === r.id ? "on" : ""
                }`}
                onClick={() => setResult(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-section">
          <div className="editor-label">メモ</div>
          <textarea
            className="memo-input-large"
            value={memo}
            placeholder="風・ミス理由・ライの状態など、振り返りに役立つメモ"
            rows={5}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="shot-sheet-actions">
          {mode === "edit" && (
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={16} /> 削除
            </button>
          )}
          <div className="actions-right">
            <button className="btn-ghost" onClick={onCancel}>
              キャンセル
            </button>
            <button
              className="btn-primary"
              disabled={!canSave}
              onClick={() =>
                onSave({
                  clubId,
                  distance,
                  lie,
                  nextLie,
                  direction,
                  depth,
                  result,
                  memo,
                })
              }
            >
              <Check size={16} /> 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  AI COPY BUTTON
// ============================================================
function AiCopyButton({ label, sublabel, onBuild, disabled }) {
  const [state, setState] = useState("idle");
  const handleClick = async () => {
    if (disabled) return;
    const text = onBuild();
    const ok = await copyToClipboard(text);
    setState(ok ? "ok" : "err");
    setTimeout(() => setState("idle"), 2200);
  };
  return (
    <button
      className={`ai-copy-btn ${state}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="ai-copy-icon">✨</span>
      <div className="ai-copy-text">
        <div className="ai-copy-label">
          {state === "ok"
            ? "コピー完了！Geminiに貼り付け"
            : state === "err"
            ? "コピー失敗"
            : label}
        </div>
        {sublabel && state === "idle" && (
          <div className="ai-copy-sub">{sublabel}</div>
        )}
      </div>
    </button>
  );
}

function EmptyAnalytics() {
  return (
    <div className="empty">
      <div className="empty-icon">📊</div>
      <div className="empty-title">データがまだありません</div>
      <div className="empty-sub">ラウンドを記録すると、ここに分析が出ます</div>
    </div>
  );
}

// ============================================================
//  ANALYTICS
// ============================================================
function AnalyticsView({ state, onBack }) {
  const [tab, setTab] = useState("distance");
  const stats = useMemo(() => computeClubStats(state), [state]);
  const usedClubs = stats.filter((s) => s.n > 0);

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="topbar-title">
          <div className="topbar-course">分析</div>
          <div className="topbar-meta">
            {state.rounds.length} rounds · {state.unit}
          </div>
        </div>
        <div className="icon-btn placeholder" />
      </header>

      <div className="analytics-tabs">
        <button
          className={`atab ${tab === "distance" ? "on" : ""}`}
          onClick={() => setTab("distance")}
        >
          距離
        </button>
        <button
          className={`atab ${tab === "tendency" ? "on" : ""}`}
          onClick={() => setTab("tendency")}
        >
          ミス傾向
        </button>
        <button
          className={`atab ${tab === "rounds" ? "on" : ""}`}
          onClick={() => setTab("rounds")}
        >
          ラウンド
        </button>
      </div>

      {tab === "distance" && (
        <DistanceTab usedClubs={usedClubs} unit={state.unit} state={state} />
      )}
      {tab === "tendency" && (
        <TendencyTab usedClubs={usedClubs} state={state} />
      )}
      {tab === "rounds" && <RoundsTab state={state} />}
    </div>
  );
}

function DistanceTab({ usedClubs, unit, state }) {
  if (usedClubs.length === 0) return <EmptyAnalytics />;
  const maxDist = Math.max(1, ...usedClubs.map((s) => s.max || 0));
  return (
    <>
      <div className="ai-copy-section">
        <AiCopyButton
          label="番手アドバイス用データをコピー"
          sublabel="ラウンド中、Geminiに距離を相談する用"
          onBuild={() => buildClubDistancePrompt(state)}
        />
      </div>
      <div className="distance-chart">
        {usedClubs
          .filter((s) => s.trimmed != null)
          .sort((a, b) => (b.trimmed || 0) - (a.trimmed || 0))
          .map((s) => {
            const pctTrim = ((s.trimmed || 0) / maxDist) * 100;
            const pctMin = ((s.min || 0) / maxDist) * 100;
            const pctMax = ((s.max || 0) / maxDist) * 100;
            return (
              <div key={s.club.id} className="dchart-row">
                <div className="dchart-club">{s.club.name}</div>
                <div className="dchart-track">
                  <div
                    className="dchart-range"
                    style={{ left: `${pctMin}%`, width: `${pctMax - pctMin}%` }}
                  />
                  <div className="dchart-trim" style={{ left: `${pctTrim}%` }}>
                    <span className="dchart-trim-num">{s.trimmed}</span>
                  </div>
                </div>
                <div className="dchart-n">{s.n}</div>
              </div>
            );
          })}
      </div>
      <div className="section">
        <div className="section-head">
          <div className="section-title">詳細データ</div>
        </div>
        <div className="stat-table">
          <div className="stat-table-head">
            <div>クラブ</div>
            <div>信頼距離</div>
            <div>中央値</div>
            <div>レンジ</div>
            <div>ミス率</div>
            <div>n</div>
          </div>
          {usedClubs.map((s) => (
            <div key={s.club.id} className="stat-table-row">
              <div className="st-club">{s.club.name}</div>
              <div className="st-trim">{s.trimmed ?? "—"}</div>
              <div>{s.median ?? "—"}</div>
              <div className="st-range">
                {s.min != null ? `${s.min}–${s.max}` : "—"}
              </div>
              <div className={`st-miss ${s.missRate > 40 ? "high" : ""}`}>
                {s.missRate != null ? `${s.missRate}%` : "—"}
              </div>
              <div className="st-n">{s.n}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="section-head">
          <div className="section-title">ライ別距離（FW / ラフ）</div>
        </div>
        <div className="lie-grid">
          {usedClubs
            .filter((s) => s.fwAvg != null || s.roughAvg != null)
            .map((s) => (
              <div key={s.club.id} className="lie-card">
                <div className="lie-card-club">{s.club.name}</div>
                <div className="lie-card-row">
                  <div className="lie-card-label">FW</div>
                  <div className="lie-card-num">{s.fwAvg ?? "—"}</div>
                </div>
                <div className="lie-card-row">
                  <div className="lie-card-label">ラフ</div>
                  <div className="lie-card-num rough">{s.roughAvg ?? "—"}</div>
                </div>
                {s.fwAvg != null && s.roughAvg != null && (
                  <div className="lie-card-diff">
                    差 {Math.round(s.fwAvg - s.roughAvg)} {unit}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

function TendencyTab({ usedClubs, state }) {
  const dirClubs = usedClubs.filter((s) => s.dir.n > 0);
  const depthClubs = usedClubs.filter((s) => s.depth.n > 0);

  if (dirClubs.length === 0 && depthClubs.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">🎯</div>
        <div className="empty-title">ミス傾向データがまだありません</div>
        <div className="empty-sub">
          ショット記録時に「ショット」セクションで方向や距離感を選択すると、ここに集計されます
        </div>
      </div>
    );
  }

  const insights = [];
  dirClubs.forEach((s) => {
    const sr = (s.dir.straight / s.dir.n) * 100;
    const lr = (s.dir.left / s.dir.n) * 100;
    const rr = (s.dir.right / s.dir.n) * 100;
    if (s.dir.n >= 3) {
      if (rr >= 50)
        insights.push({
          club: s.club.name,
          msg: `右に外しやすい（${Math.round(rr)}%）`,
          tone: "warn",
        });
      else if (lr >= 50)
        insights.push({
          club: s.club.name,
          msg: `左に外しやすい（${Math.round(lr)}%）`,
          tone: "warn",
        });
      else if (sr >= 60)
        insights.push({
          club: s.club.name,
          msg: `安定 ストレート率${Math.round(sr)}%`,
          tone: "good",
        });
    }
  });
  depthClubs.forEach((s) => {
    const sh = (s.depth.short / s.depth.n) * 100;
    const ov = (s.depth.over / s.depth.n) * 100;
    if (s.depth.n >= 3) {
      if (sh >= 50)
        insights.push({
          club: s.club.name,
          msg: `ショートしがち（${Math.round(sh)}%）`,
          tone: "warn",
        });
      else if (ov >= 50)
        insights.push({
          club: s.club.name,
          msg: `オーバーしがち（${Math.round(ov)}%）`,
          tone: "warn",
        });
    }
  });

  return (
    <>
      <div className="ai-copy-section">
        <AiCopyButton
          label="課題分析と練習メニューをAIに依頼"
          sublabel="累積データから最重要課題＆ドリルを提案"
          onBuild={() => buildIssueAnalysisPrompt(state)}
        />
      </div>
      {insights.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">傾向サマリ</div>
          </div>
          <div className="insight-list">
            {insights.map((it, i) => (
              <div key={i} className={`insight tone-${it.tone}`}>
                <span className="insight-club">{it.club}</span>
                <span className="insight-msg">{it.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {dirClubs.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">方向（左 / ストレート / 右）</div>
          </div>
          <div className="tendency-list">
            {dirClubs.map((s) => {
              const lp = (s.dir.left / s.dir.n) * 100;
              const sp = (s.dir.straight / s.dir.n) * 100;
              const rp = (s.dir.right / s.dir.n) * 100;
              return (
                <div key={s.club.id} className="tendency-row">
                  <div className="tendency-club">{s.club.name}</div>
                  <div className="tendency-bar">
                    <div
                      className="tbar-seg seg-left"
                      style={{ width: `${lp}%` }}
                    >
                      {lp >= 12 && <span>{Math.round(lp)}%</span>}
                    </div>
                    <div
                      className="tbar-seg seg-center"
                      style={{ width: `${sp}%` }}
                    >
                      {sp >= 12 && <span>{Math.round(sp)}%</span>}
                    </div>
                    <div
                      className="tbar-seg seg-right"
                      style={{ width: `${rp}%` }}
                    >
                      {rp >= 12 && <span>{Math.round(rp)}%</span>}
                    </div>
                  </div>
                  <div className="tendency-n">{s.dir.n}</div>
                </div>
              );
            })}
          </div>
          <div className="tendency-legend">
            <span className="lg lg-left">左</span>
            <span className="lg lg-center">ストレート</span>
            <span className="lg lg-right">右</span>
          </div>
        </div>
      )}
      {depthClubs.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">
              距離感（ショート / ピン / オーバー）
            </div>
          </div>
          <div className="tendency-list">
            {depthClubs.map((s) => {
              const sp = (s.depth.short / s.depth.n) * 100;
              const pp = (s.depth.pin / s.depth.n) * 100;
              const op = (s.depth.over / s.depth.n) * 100;
              return (
                <div key={s.club.id} className="tendency-row">
                  <div className="tendency-club">{s.club.name}</div>
                  <div className="tendency-bar">
                    <div
                      className="tbar-seg seg-short"
                      style={{ width: `${sp}%` }}
                    >
                      {sp >= 12 && <span>{Math.round(sp)}%</span>}
                    </div>
                    <div
                      className="tbar-seg seg-pin"
                      style={{ width: `${pp}%` }}
                    >
                      {pp >= 12 && <span>{Math.round(pp)}%</span>}
                    </div>
                    <div
                      className="tbar-seg seg-over"
                      style={{ width: `${op}%` }}
                    >
                      {op >= 12 && <span>{Math.round(op)}%</span>}
                    </div>
                  </div>
                  <div className="tendency-n">{s.depth.n}</div>
                </div>
              );
            })}
          </div>
          <div className="tendency-legend">
            <span className="lg lg-short">ショート</span>
            <span className="lg lg-pin">ピン</span>
            <span className="lg lg-over">オーバー</span>
          </div>
        </div>
      )}
    </>
  );
}

function RoundsTab({ state }) {
  const rounds = useMemo(
    () =>
      state.rounds
        .map((r) => computeRoundKPI(r, state.clubs))
        .filter((r) => r.totalShots > 0),
    [state]
  );
  if (rounds.length === 0) return <EmptyAnalytics />;
  const all = aggregateKPI(rounds);
  const recent5 = aggregateKPI(rounds.slice(0, 5));

  return (
    <>
      <div className="section">
        <div className="section-head">
          <div className="section-title">サマリ</div>
        </div>
        <div className="kpi-compare">
          <div className="kpi-compare-head">
            <div></div>
            <div className="kpi-col-label">直近5</div>
            <div className="kpi-col-label">全期間</div>
          </div>
          <KpiRow
            label="平均スコア"
            recent={recent5.avgScore}
            all={all.avgScore}
            lowerIsBetter
          />
          <KpiRow
            label="平均パット"
            recent={recent5.avgPutts}
            all={all.avgPutts}
            lowerIsBetter
          />
          <KpiRow
            label="パーオン率"
            recent={recent5.parOnRate}
            all={all.parOnRate}
            unit="%"
          />
          <KpiRow
            label="FWキープ率"
            recent={recent5.fwKeepRate}
            all={all.fwKeepRate}
            unit="%"
          />
          <KpiRow
            label="OB率"
            recent={recent5.obRate}
            all={all.obRate}
            unit="%"
            lowerIsBetter
          />
        </div>
      </div>
      <div className="section">
        <div className="section-head">
          <div className="section-title">ラウンド別</div>
        </div>
        <div className="round-kpi-list">
          {rounds.map((r) => (
            <div key={r.id} className="round-kpi-card">
              <div className="round-kpi-head">
                <div className="round-kpi-date">{fmtDate(r.date)}</div>
                <div className="round-kpi-course">{r.course || "—"}</div>
              </div>
              <div className="round-kpi-grid">
                <div className="rkpi">
                  <div className="rkpi-label">スコア</div>
                  <div className="rkpi-num">{r.totalShots}</div>
                </div>
                <div className="rkpi">
                  <div className="rkpi-label">パット</div>
                  <div className="rkpi-num">{r.putts}</div>
                </div>
                <div className="rkpi">
                  <div className="rkpi-label">パーオン</div>
                  <div className="rkpi-num">
                    {r.parOn}
                    <span className="rkpi-suf">/{r.parOnEligible}</span>
                  </div>
                </div>
                <div className="rkpi">
                  <div className="rkpi-label">FW</div>
                  <div className="rkpi-num">
                    {r.fwKeep}
                    <span className="rkpi-suf">/{r.fwEligible}</span>
                  </div>
                </div>
                <div className="rkpi">
                  <div className="rkpi-label">OB</div>
                  <div className="rkpi-num">{r.obs}</div>
                </div>
                <div className="rkpi">
                  <div className="rkpi-label">記録</div>
                  <div className="rkpi-num">
                    {r.recordedHoles}
                    <span className="rkpi-suf">/18</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function KpiRow({ label, recent, all, unit = "", lowerIsBetter = false }) {
  const fmt = (v) =>
    v == null
      ? "—"
      : `${
          typeof v === "number" && !Number.isInteger(v) ? v.toFixed(1) : v
        }${unit}`;
  let trendClass = "";
  if (recent != null && all != null) {
    if (lowerIsBetter)
      trendClass = recent < all ? "trend-up" : recent > all ? "trend-down" : "";
    else
      trendClass = recent > all ? "trend-up" : recent < all ? "trend-down" : "";
  }
  return (
    <div className="kpi-row">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-val ${trendClass}`}>{fmt(recent)}</div>
      <div className="kpi-val dim">{fmt(all)}</div>
    </div>
  );
}

// ============================================================
//  COURSES MASTER
// ============================================================
function CoursesView({ state, setState, onBack }) {
  const [showEditor, setShowEditor] = useState(null); // null | 'new' | { venue, course, tee } (edit)

  // userMastersをメモ化（state.courseMastersが未定義のときに新配列を毎回作らないように）
  const userMasters = useMemo(
    () => state.courseMasters || [],
    [state.courseMasters]
  );

  // 統合一覧：DEFAULT_COURSES + userMasters（venue+course+tee重複時はuserMasters優先）
  const merged = useMemo(() => {
    const map = new Map();
    const keyOf = (c) => `${c.venue}::${c.course}::${c.tee || ""}`;
    DEFAULT_COURSES.forEach((c) => {
      map.set(keyOf(c), { ...c, source: "default" });
    });
    userMasters.forEach((c) => {
      const k = keyOf(c);
      const exists = map.has(k);
      map.set(k, { ...c, source: exists ? "override" : "user" });
    });
    return Array.from(map.values());
  }, [userMasters]);

  // venue別にグループ化
  const groupedByVenue = useMemo(() => {
    const groups = new Map();
    merged.forEach((c) => {
      if (!groups.has(c.venue)) groups.set(c.venue, []);
      groups.get(c.venue).push(c);
    });
    return Array.from(groups.entries()).map(([venue, courses]) => ({
      venue,
      courses,
    }));
  }, [merged]);

  const handleSave = ({ venue, course, tee, holes }) => {
    setState((s) => ({
      ...s,
      courseMasters: upsertCourseMaster(
        s.courseMasters || [],
        venue,
        course,
        tee,
        holes
      ),
    }));
    setShowEditor(null);
  };

  const handleDelete = (venue, course, tee) => {
    const teeLabel = tee ? ` (${tee})` : "";
    if (
      !window.confirm(
        `「${venue} / ${course}${teeLabel}」を削除しますか？\n（コード埋め込みデータがあればそちらに戻ります）`
      )
    )
      return;
    setState((s) => ({
      ...s,
      courseMasters: (s.courseMasters || []).filter(
        (c) =>
          !(
            c.venue === venue &&
            c.course === course &&
            (c.tee || null) === (tee || null)
          )
      ),
    }));
  };

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="topbar-title">
          <div className="topbar-course">コースマスター</div>
          <div className="topbar-meta">
            {merged.length} コース · {groupedByVenue.length} ゴルフ場
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowEditor("new")}>
          <Plus size={20} />
        </button>
      </header>

      <div className="cm-help">
        💡 Geminiにスコアカード画像を投げてJSONをもらい、貼り付けて登録します。
        <br />
        ラウンド中にPar・距離を編集すると、対応するコースマスターも自動で上書きされます。
      </div>

      {merged.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">⛳</div>
          <div className="empty-title">コース未登録</div>
          <div className="empty-sub">右上の＋からコースを追加できます</div>
        </div>
      ) : (
        <div className="cm-list">
          {groupedByVenue.map((g) => (
            <div key={g.venue} className="cm-venue-group">
              <div className="cm-venue-name">{g.venue}</div>
              <div className="cm-courses">
                {g.courses.map((c) => {
                  const totalPar = c.holes.reduce(
                    (a, h) => a + (h.par || 0),
                    0
                  );
                  const totalDist = c.holes.reduce(
                    (a, h) => a + (h.distance || 0),
                    0
                  );
                  const cardKey = `${c.venue}::${c.course}::${c.tee || ""}`;
                  return (
                    <div key={cardKey} className="cm-course-card">
                      <button
                        className="cm-course-main"
                        onClick={() =>
                          setShowEditor({
                            venue: c.venue,
                            course: c.course,
                            tee: c.tee || null,
                          })
                        }
                      >
                        <div className="cm-course-head">
                          <div className="cm-course-name">
                            {c.course}
                            {c.tee && (
                              <span
                                className={`cm-tee-badge tee-${c.tee.toLowerCase()}`}
                              >
                                {c.tee}
                              </span>
                            )}
                          </div>
                          <div className={`cm-source cm-source-${c.source}`}>
                            {c.source === "default"
                              ? "標準"
                              : c.source === "override"
                              ? "上書"
                              : "追加"}
                          </div>
                        </div>
                        <div className="cm-course-meta">
                          <span>{c.holes.length}H</span>
                          <span>Par {totalPar}</span>
                          <span>
                            {totalDist} {state.unit}
                          </span>
                        </div>
                        <div className="cm-course-pars">
                          {c.holes.map((h, i) => (
                            <span key={i} className="cm-par-cell">
                              {h.par}
                            </span>
                          ))}
                        </div>
                      </button>
                      {(c.source === "override" || c.source === "user") && (
                        <button
                          className="cm-delete"
                          onClick={() =>
                            handleDelete(c.venue, c.course, c.tee || null)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <CourseEditor
          existing={
            showEditor === "new"
              ? null
              : merged.find(
                  (c) =>
                    c.venue === showEditor.venue &&
                    c.course === showEditor.course &&
                    (c.tee || null) === (showEditor.tee || null)
                )
          }
          unit={state.unit}
          onCancel={() => setShowEditor(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CourseEditor({ existing, unit, onCancel, onSave }) {
  const [venue, setVenue] = useState(existing?.venue || "");
  const [course, setCourse] = useState(existing?.course || "");
  const [tee, setTee] = useState(existing?.tee || "");
  const [holeCount, setHoleCount] = useState(existing?.holes?.length || 9);
  const [jsonText, setJsonText] = useState(
    existing ? JSON.stringify(existing.holes, null, 2) : ""
  );
  const [error, setError] = useState("");
  const [parsedHoles, setParsedHoles] = useState(existing?.holes || null);

  const sampleJson =
    holeCount === 9
      ? `[
  {"number":1,"par":4,"distance":375},
  {"number":2,"par":4,"distance":303},
  {"number":3,"par":3,"distance":155},
  {"number":4,"par":5,"distance":465},
  {"number":5,"par":4,"distance":350},
  {"number":6,"par":5,"distance":556},
  {"number":7,"par":3,"distance":172},
  {"number":8,"par":4,"distance":380},
  {"number":9,"par":4,"distance":338}
]`
      : `[
  {"number":1,"par":4,"distance":375},
  ... (18ホール分)
]`;

  const parseAndSet = (text) => {
    setJsonText(text);
    setError("");
    if (!text.trim()) {
      setParsedHoles(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.holes;
      if (!Array.isArray(arr)) throw new Error("配列形式が見つかりません");
      if (arr.length !== holeCount) {
        throw new Error(
          `${holeCount}ホール必要です（${arr.length}ホールでした）`
        );
      }
      const cleaned = arr.map((h, i) => ({
        number: h.number ?? i + 1,
        par: Number(h.par) || 4,
        distance: h.distance != null ? Number(h.distance) : null,
      }));
      setParsedHoles(cleaned);
    } catch (e) {
      setError(e.message);
      setParsedHoles(null);
    }
  };

  const handleSave = () => {
    if (!venue.trim()) {
      setError("ゴルフ場名を入力してください");
      return;
    }
    if (!course.trim()) {
      setError("コース名を入力してください");
      return;
    }
    if (!parsedHoles) {
      setError("JSONをペーストしてください");
      return;
    }
    onSave({
      venue: venue.trim(),
      course: course.trim(),
      tee: tee || null,
      holes: parsedHoles,
    });
  };

  const totalPar = parsedHoles
    ? parsedHoles.reduce((a, h) => a + (h.par || 0), 0)
    : 0;
  const totalDist = parsedHoles
    ? parsedHoles.reduce((a, h) => a + (h.distance || 0), 0)
    : 0;

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div
        className="sheet course-editor-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-title">
          {existing ? "コース編集" : "コース追加"}
        </div>

        <label className="field">
          <span className="field-label">ゴルフ場名</span>
          <input
            type="text"
            value={venue}
            placeholder="例：札幌北広島ゴルフ倶楽部【PGM】"
            onChange={(e) => setVenue(e.target.value)}
            disabled={!!existing}
          />
        </label>

        <label className="field">
          <span className="field-label">コース名（9H単位）</span>
          <input
            type="text"
            value={course}
            placeholder="例：西OUT / 東IN など"
            onChange={(e) => setCourse(e.target.value)}
            disabled={!!existing}
          />
        </label>

        <div className="field">
          <span className="field-label">ティー</span>
          <div className="chip-row">
            {["White", "Red", "Blue", "Gold"].map((t) => (
              <button
                key={t}
                className={`chip tee-chip tee-${t.toLowerCase()} ${
                  tee === t ? "on" : ""
                }`}
                onClick={() => setTee(tee === t ? "" : t)}
                disabled={!!existing}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {!existing && (
          <div className="field">
            <span className="field-label">ホール数</span>
            <div className="chip-row">
              <button
                className={`chip ${holeCount === 9 ? "on" : ""}`}
                onClick={() => {
                  setHoleCount(9);
                  parseAndSet(jsonText);
                }}
              >
                9H（推奨）
              </button>
              <button
                className={`chip ${holeCount === 18 ? "on" : ""}`}
                onClick={() => {
                  setHoleCount(18);
                  parseAndSet(jsonText);
                }}
              >
                18H
              </button>
            </div>
          </div>
        )}

        <div className="json-help">
          <div className="json-help-title">📋 Geminiへの依頼文（コピペ用）</div>
          <div className="json-help-quote">
            「このコースの{holeCount}ホール分のPar・距離（{unit}
            ）を、次のJSON形式で出力してください。
            {holeCount === 9 && (
              <>
                <br />※
                1〜9番のみ。後半9Hは別コースとして登録するので含めないでください。
              </>
            )}
            <br />
            <br />
            <code>{sampleJson}</code>」
          </div>
          <div className="json-help-note">
            返ってきたJSON配列をそのまま下に貼り付け
          </div>
        </div>

        <textarea
          className="json-textarea"
          placeholder={`[\n  {"number":1,"par":4,"distance":380},\n  ...\n]`}
          value={jsonText}
          onChange={(e) => parseAndSet(e.target.value)}
          rows={10}
        />

        {error && <div className="json-error">⚠ {error}</div>}

        {parsedHoles && (
          <div className="course-preview">
            <div className="course-preview-totals">
              <span>{parsedHoles.length}H</span>
              <span>Par {totalPar}</span>
              <span>
                {totalDist} {unit}
              </span>
            </div>
            <div className="course-preview-holes">
              {parsedHoles.map((h, i) => (
                <div key={i} className="course-preview-cell">
                  <div className="cp-num">{h.number}</div>
                  <div className="cp-par">P{h.par}</div>
                  <div className="cp-dist">{h.distance ?? "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sheet-actions">
          <button className="btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!parsedHoles || !venue.trim() || !course.trim()}
          >
            <Check size={16} /> 保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  CLUBS MANAGEMENT
// ============================================================
function ClubsView({ state, setState, onBack }) {
  const [editingId, setEditingId] = useState(null); // 距離編集中のクラブID
  const [draftDistance, setDraftDistance] = useState("");
  const [editingNameId, setEditingNameId] = useState(null); // 名前編集中のクラブID
  const [draftName, setDraftName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const updateClub = (id, patch) => {
    setState((s) => ({
      ...s,
      clubs: s.clubs.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const addClub = ({ name, category, avgDistance }) => {
    if (!name.trim()) return;
    setState((s) => ({
      ...s,
      clubs: [
        ...s.clubs,
        {
          id: uid(),
          name: name.trim(),
          category,
          avgDistance: avgDistance != null ? Number(avgDistance) : null,
        },
      ],
    }));
    setShowAdd(false);
  };

  const deleteClub = (id) => {
    const c = state.clubs.find((x) => x.id === id);
    if (!c) return;
    if (
      !window.confirm(
        `クラブ「${c.name}」を削除しますか？\n（過去ラウンドの記録は影響を受けません）`
      )
    )
      return;
    setState((s) => ({
      ...s,
      clubs: s.clubs.filter((x) => x.id !== id),
    }));
  };

  const saveDistance = (id) => {
    const num = draftDistance === "" ? null : Number(draftDistance);
    updateClub(id, { avgDistance: num });
    setEditingId(null);
    setDraftDistance("");
  };

  const saveName = (id) => {
    const trimmed = draftName.trim();
    if (trimmed === "") {
      // 空欄は無効、編集モードを抜けるだけで変更しない
      setEditingNameId(null);
      setDraftName("");
      return;
    }
    updateClub(id, { name: trimmed });
    setEditingNameId(null);
    setDraftName("");
  };

  const startEditName = (club) => {
    setEditingNameId(club.id);
    setDraftName(club.name);
    // 距離側の編集中なら閉じる
    setEditingId(null);
    setDraftDistance("");
  };

  const grouped = useMemo(() => {
    const order = ["wood", "utility", "iron", "wedge", "putter"];
    const labels = {
      wood: "ウッド",
      utility: "ユーティリティ",
      iron: "アイアン",
      wedge: "ウェッジ",
      putter: "パター",
    };
    return order
      .map((cat) => ({
        cat,
        label: labels[cat],
        items: state.clubs
          .filter((c) => c.category === cat)
          .sort((a, b) => {
            const av = a.avgDistance == null ? -Infinity : a.avgDistance;
            const bv = b.avgDistance == null ? -Infinity : b.avgDistance;
            return bv - av;
          }),
      }))
      .filter((g) => g.items.length);
  }, [state.clubs]);

  const setUnit = (unit) => setState((s) => ({ ...s, unit }));

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="topbar-title">
          <div className="topbar-course">クラブ管理</div>
          <div className="topbar-meta">
            {state.clubs.length}本 · 平均飛距離を編集
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowAdd(true)}>
          <Plus size={20} />
        </button>
      </header>

      <div className="unit-toggle">
        <span className="unit-toggle-label">単位</span>
        <div className="unit-buttons">
          <button
            className={`unit-btn ${state.unit === "yd" ? "on" : ""}`}
            onClick={() => setUnit("yd")}
          >
            yd
          </button>
          <button
            className={`unit-btn ${state.unit === "m" ? "on" : ""}`}
            onClick={() => setUnit("m")}
          >
            m
          </button>
        </div>
      </div>

      <div className="club-mgmt-list">
        {grouped.map((g) => (
          <div key={g.cat} className="club-mgmt-group">
            <div className="club-mgmt-group-label">{g.label}</div>
            {g.items.map((c) => (
              <div key={c.id} className="club-mgmt-row">
                {editingNameId === c.id ? (
                  <input
                    type="text"
                    className="club-mgmt-name-input"
                    autoFocus
                    value={draftName}
                    placeholder="クラブ名"
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => saveName(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName(c.id);
                      if (e.key === "Escape") {
                        setEditingNameId(null);
                        setDraftName("");
                      }
                    }}
                  />
                ) : (
                  <button
                    className="club-mgmt-name"
                    onClick={() => startEditName(c)}
                    aria-label="クラブ名を編集"
                  >
                    {c.name}
                  </button>
                )}
                {editingId === c.id ? (
                  <div className="club-mgmt-edit">
                    <input
                      type="number"
                      inputMode="numeric"
                      autoFocus
                      value={draftDistance}
                      placeholder="0"
                      onChange={(e) => setDraftDistance(e.target.value)}
                      onBlur={() => saveDistance(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveDistance(c.id);
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setDraftDistance("");
                        }
                      }}
                    />
                    <span className="unit">{state.unit}</span>
                  </div>
                ) : (
                  <button
                    className="club-mgmt-distance"
                    onClick={() => {
                      setEditingId(c.id);
                      setDraftDistance(
                        c.avgDistance != null ? String(c.avgDistance) : ""
                      );
                    }}
                  >
                    {c.avgDistance != null ? (
                      <>
                        <span className="dist-num">{c.avgDistance}</span>
                        <span className="dist-unit">{state.unit}</span>
                      </>
                    ) : (
                      <span className="dist-empty">未設定</span>
                    )}
                  </button>
                )}
                <button
                  className="club-mgmt-del"
                  onClick={() => deleteClub(c.id)}
                  aria-label="削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="club-mgmt-help">
        💡
        ショット入力時、クラブ選択でこの平均距離が自動入力されます。±ボタンで微調整できます。
      </div>

      {showAdd && (
        <ClubAddSheet
          onCancel={() => setShowAdd(false)}
          onSave={addClub}
          unit={state.unit}
        />
      )}
    </div>
  );
}

function ClubAddSheet({ onCancel, onSave, unit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("iron");
  const [distance, setDistance] = useState("");

  const cats = [
    { id: "wood", label: "ウッド" },
    { id: "utility", label: "ユーティリティ" },
    { id: "iron", label: "アイアン" },
    { id: "wedge", label: "ウェッジ" },
    { id: "putter", label: "パター" },
  ];

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">クラブ追加</div>

        <label className="field">
          <span className="field-label">クラブ名</span>
          <input
            type="text"
            value={name}
            placeholder="例：4U / 50W / 3I など"
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>

        <div className="field">
          <span className="field-label">カテゴリ</span>
          <div className="chip-row">
            {cats.map((c) => (
              <button
                key={c.id}
                className={`chip ${category === c.id ? "on" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {category !== "putter" && (
          <label className="field">
            <span className="field-label">平均飛距離（任意）</span>
            <div className="distance-field" style={{ width: "100%" }}>
              <input
                type="number"
                inputMode="numeric"
                value={distance}
                placeholder="0"
                onChange={(e) => setDistance(e.target.value)}
              />
              <span className="unit">{unit}</span>
            </div>
          </label>
        )}

        <div className="sheet-actions">
          <button className="btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button
            className="btn-primary"
            onClick={() => onSave({ name, category, avgDistance: distance })}
            disabled={!name.trim()}
          >
            <Check size={16} /> 追加
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TUTORIAL (オンボーディング)
// ============================================================
function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "my caddie へようこそ",
      subtitle: "ゴルフのスコアとショットを記録しよう",
      preview: <TutorialPreviewWelcome />,
      desc: (
        <>
          <p>
            このアプリでは、ラウンド中の<b>1ショットごとの記録</b>が取れます。
          </p>
          <p>
            クラブ・距離・ライ・結果を残すことで、自分の本当のクラブ別飛距離やミス傾向が見えてきます。
          </p>
          <p>
            すべて<b>オフラインで動作</b>し、データは端末内にのみ保存されます。
          </p>
        </>
      ),
    },
    {
      title: "まずはクラブを登録",
      subtitle: "自分のセッティングと平均飛距離",
      preview: <TutorialPreviewClubs />,
      desc: (
        <>
          <p>
            下部の<b>「クラブ」タブ</b>から、自分が使う番手と<b>平均飛距離</b>
            を登録できます。
          </p>
          <p>
            右上の<b>＋</b>
            から新しいクラブを追加、各行をタップで距離編集、ゴミ箱マークで削除。
          </p>
          <p>
            ここで設定した距離が、ショット入力時に<b>初期値として自動入力</b>
            されます。±ボタンで当日の感覚に合わせて微調整可能。
          </p>
        </>
      ),
    },
    {
      title: "ラウンドを始める",
      subtitle: "ゴルフ場 → ティー → コースを選択",
      preview: <TutorialPreviewNewRound />,
      desc: (
        <>
          <p>
            ホームの<b>「新しいラウンド」</b>ボタンから開始。
          </p>
          <p>
            登録済みゴルフ場 → 使うティー（White / Red）→ <b>前半9H</b>と
            <b>後半9H</b>を選ぶと、Par・距離が自動入力されます。
          </p>
          <p>
            コースは「コースタブ」で追加・編集できます（JSONペースト対応）。
          </p>
        </>
      ),
    },
    {
      title: "ショット記録",
      subtitle: "1球ずつ詳しく残す",
      preview: <TutorialPreviewShot />,
      desc: (
        <>
          <p>
            ラウンド画面で右下の<b>＋ボタン</b>からショット入力。
          </p>
          <p>クラブを選ぶと平均距離が自動入力、±ボタンで微調整。</p>
          <p>
            方向（左/直/右）と距離感（短/ピン/長）を残すと、後から
            <b>ミス傾向</b>として可視化されます。
          </p>
        </>
      ),
    },
    {
      title: "分析を見る",
      subtitle: "クラブ別距離とミス傾向",
      preview: <TutorialPreviewAnalytics />,
      desc: (
        <>
          <p>分析タブで「距離・ミス傾向・ラウンド」3つの観点でデータを確認。</p>
          <p>
            過去ラウンドはホーム画面で一覧表示。タップで詳細、
            <b>左にスワイプ</b>で削除ボタン。
          </p>
          <p>
            <b>AIで振り返り</b>
            ボタンを押すと、クリップボードに分析用プロンプトがコピーされます。Geminiに貼り付ければアドバイスがもらえます。
          </p>
        </>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  const next = () => {
    if (isLast) onClose();
    else setStep(step + 1);
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="tutorial-backdrop">
      <div className="tutorial-card">
        <div className="tutorial-header">
          <div className="tutorial-step-indicator">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`tutorial-dot ${i === step ? "on" : ""} ${
                  i < step ? "done" : ""
                }`}
              />
            ))}
          </div>
          <button className="tutorial-skip" onClick={onClose}>
            スキップ
          </button>
        </div>

        <div className="tutorial-scroll">
          <div className="tutorial-preview">{current.preview}</div>

          <div className="tutorial-body">
            <div className="tutorial-title">{current.title}</div>
            <div className="tutorial-subtitle">{current.subtitle}</div>
            <div className="tutorial-desc">{current.desc}</div>
          </div>
        </div>

        <div className="tutorial-actions">
          {step > 0 ? (
            <button className="btn-ghost" onClick={prev}>
              ← 戻る
            </button>
          ) : (
            <div style={{ flex: 0 }} />
          )}
          <button className="btn-primary tutorial-next" onClick={next}>
            {isLast ? "使ってみる ⛳" : "次へ →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 各ステップの画面ミニチュア
function TutorialPreviewWelcome() {
  return (
    <div className="tp-stage tp-welcome">
      <div className="tp-welcome-emoji">⛳</div>
      <div className="tp-welcome-title">
        my caddie<span style={{ color: "var(--green)" }}>.</span>
      </div>
      <div className="tp-welcome-sub">SHOT LOG</div>
      <div className="tp-welcome-stats">
        <div>
          <b>0</b>
          <span>rounds</span>
        </div>
        <div>
          <b>0</b>
          <span>shots</span>
        </div>
        <div>
          <b>14</b>
          <span>clubs</span>
        </div>
      </div>
    </div>
  );
}

function TutorialPreviewNewRound() {
  return (
    <div className="tp-stage">
      <div className="tp-modal-title">新しいラウンド</div>
      <div className="tp-field-label">ゴルフ場</div>
      <div className="tp-input">★ 札幌北広島【PGM】 ▾</div>
      <div className="tp-field-label">ティー</div>
      <div className="tp-chip-row">
        <span className="tp-chip on">White</span>
        <span className="tp-chip">Red</span>
      </div>
      <div className="tp-field-label">前半 / 後半コース</div>
      <div className="tp-input small">★ 西OUT</div>
      <div className="tp-input small">★ 西IN</div>
    </div>
  );
}

function TutorialPreviewShot() {
  return (
    <div className="tp-stage">
      <div className="tp-modal-title">#3 ショット</div>
      <div className="tp-field-label">クラブ</div>
      <div className="tp-club-grid">
        <span className="tp-club">DR</span>
        <span className="tp-club">3W</span>
        <span className="tp-club on">7I</span>
        <span className="tp-club">PW</span>
      </div>
      <div className="tp-field-label">飛距離</div>
      <div className="tp-distance">
        145<span>yd</span>
      </div>
      <div className="tp-tendency">
        <span className="tp-tend">←</span>
        <span className="tp-tend on">ストレート</span>
        <span className="tp-tend">→</span>
      </div>
      <div className="tp-result-row">
        <span className="tp-result on good">◎</span>
        <span className="tp-result">○</span>
        <span className="tp-result">△</span>
        <span className="tp-result">×</span>
      </div>
    </div>
  );
}

function TutorialPreviewAnalytics() {
  return (
    <div className="tp-stage">
      <div className="tp-tabs">
        <span className="on">距離</span>
        <span>ミス傾向</span>
        <span>ラウンド</span>
      </div>
      <div className="tp-bar-row">
        <span className="tp-bar-label">7I</span>
        <div className="tp-bar">
          <div className="tp-bar-fill" style={{ width: "70%" }} />
        </div>
        <span className="tp-bar-num">142</span>
      </div>
      <div className="tp-bar-row">
        <span className="tp-bar-label">PW</span>
        <div className="tp-bar">
          <div className="tp-bar-fill" style={{ width: "50%" }} />
        </div>
        <span className="tp-bar-num">108</span>
      </div>
      <div className="tp-bar-row">
        <span className="tp-bar-label">SW</span>
        <div className="tp-bar">
          <div className="tp-bar-fill" style={{ width: "35%" }} />
        </div>
        <span className="tp-bar-num">78</span>
      </div>
      <div className="tp-ai-btn">✨ AIで振り返り</div>
    </div>
  );
}

function TutorialPreviewClubs() {
  return (
    <div className="tp-stage">
      <div className="tp-modal-title-row">
        <span>クラブ管理</span>
        <span className="tp-add-icon">＋</span>
      </div>
      <div className="tp-cat-label">ウッド</div>
      <div className="tp-club-row">
        <span className="tp-club-name">DR</span>
        <span className="tp-club-dist">
          230<small>yd</small>
        </span>
        <span className="tp-club-trash">🗑</span>
      </div>
      <div className="tp-club-row">
        <span className="tp-club-name">3W</span>
        <span className="tp-club-dist">
          210<small>yd</small>
        </span>
        <span className="tp-club-trash">🗑</span>
      </div>
      <div className="tp-cat-label">アイアン</div>
      <div className="tp-club-row">
        <span className="tp-club-name">7I</span>
        <span className="tp-club-dist">
          145<small>yd</small>
        </span>
        <span className="tp-club-trash">🗑</span>
      </div>
      <div className="tp-club-row">
        <span className="tp-club-name">PW</span>
        <span className="tp-club-dist">
          110<small>yd</small>
        </span>
        <span className="tp-club-trash">🗑</span>
      </div>
    </div>
  );
}

// ============================================================
//  STYLE
// ============================================================
function Style() {
  return (
    <style>{`
      :root {
        --bg-0: #0a0a0a;
        --bg-1: #141414;
        --bg-2: #1f1f1f;
        --bg-3: #2a2a2a;
        --border: #2e2e2e;
        --border-soft: rgba(255,255,255,0.06);
        --text: #f5f5f5;
        --text-dim: #a0a0a0;
        --text-faint: #6b6b6b;
        --green: #b6f24a;
        --green-dim: #8bc834;
        --amber: #ffb84d;
        --red: #ff6b6b;
        --blue: #5eb8ff;
        --tone-good: #b6f24a;
        --tone-ok: #5eb8ff;
        --tone-miss: #ffb84d;
        --tone-bad: #ff6b6b;
      }

      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      html {
        zoom: 1.15; /* 全体を15%大きく表示（Safari/Chrome対応） */
        -moz-transform: scale(1.15); /* Firefox用フォールバック */
        -moz-transform-origin: 0 0;
      }
      html, body, #root {
        margin: 0; padding: 0;
        width: 100%;
        min-height: 100vh;
        min-height: 100dvh; /* iOS Safari の動的ビューポート対応 */
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
        background: #000;
        color: var(--text);
        overscroll-behavior: none;
        -webkit-text-size-adjust: 100%; /* iOS横向き時の自動拡大防止 */
        -webkit-font-smoothing: antialiased;
      }
      input, textarea, select {
        font-size: 16px !important; /* iOS Safari がフォーカス時に16未満だと自動ズームする */
      }

      .app {
        min-height: 100vh;
        min-height: 100dvh;
        background: linear-gradient(180deg, #050505 0%, #0a0a0a 100%);
        display: flex;
        justify-content: center;
        padding: 0;
      }
      .phone-frame {
        width: 100%;
        max-width: 480px; /* iPhone 14 Pro Max は 430px、余裕を持たせる */
        min-height: 100vh;
        min-height: 100dvh;
        background: var(--bg-0);
        position: relative;
      }
      /* iPad など大画面では中央寄せでフレーム表示 */
      @media (min-width: 600px) {
        .phone-frame {
          max-width: 430px;
          box-shadow: 0 0 0 1px var(--border-soft);
        }
      }

      .screen {
        min-height: 100vh;
        min-height: 100dvh;
        padding-bottom: calc(110px + env(safe-area-inset-bottom));
      }

      button { cursor: pointer; font-family: inherit; border: none; background: none; color: inherit; padding: 0; }
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none; margin: 0;
      }
      input[type="number"] { -moz-appearance: textfield; }

      /* TOPBAR */
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 8px;
        position: sticky;
        top: 0;
        background: rgba(10,10,10,0.92);
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
        z-index: 5;
        border-bottom: 1px solid var(--border-soft);
      }
      .topbar-title { flex: 1; text-align: center; min-width: 0; padding: 0 8px; }
      .topbar-course { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .topbar-meta { font-size: 11px; color: var(--text-faint); margin-top: 2px; }
      .icon-btn {
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        background: var(--bg-2); border-radius: 50%; color: var(--text);
        flex: 0 0 auto;
      }
      .icon-btn.placeholder { background: transparent; }

      /* HERO */
      .hero {
        padding: 28px 24px 24px;
        background: radial-gradient(ellipse at top right, rgba(182,242,74,0.08) 0%, transparent 50%);
      }
      /* セクションヘッダーのチュートリアルボタン */
      .section-help-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 14px;
        color: var(--text-dim);
        font-size: 11px;
        font-weight: 600;
      }
      .section-help-btn:active {
        background: var(--bg-3);
        color: var(--green);
      }
      .section-help-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--green);
        color: #0a0a0a;
        font-weight: 800;
        font-size: 11px;
        line-height: 1;
      }
      .hero-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px; letter-spacing: 2px;
        color: var(--green-dim); margin-bottom: 6px;
      }
      .hero-title {
        font-size: 38px; font-weight: 800; margin: 0 0 18px;
        letter-spacing: -1px; line-height: 1;
      }
      .dot { color: var(--green); }
      .hero-stats { display: flex; align-items: center; gap: 14px; }
      .stat { flex: 1; }
      .stat-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 22px; font-weight: 700; color: var(--green);
        line-height: 1;
      }
      .stat-label {
        font-size: 10px; color: var(--text-faint);
        text-transform: uppercase; letter-spacing: 1px;
        margin-top: 4px;
      }
      .stat-divider { width: 1px; height: 28px; background: var(--border); }

      /* CTA */
      .cta-row { padding: 0 16px 12px; }
      .cta-primary {
        width: 100%; padding: 16px;
        background: var(--green); color: #0a0a0a;
        border-radius: 14px; font-weight: 700; font-size: 15px;
        display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: transform 0.06s;
      }
      .cta-primary:active { transform: scale(0.98); }

      /* SECTION */
      .section { padding: 12px 16px 0; }
      .section-head {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 10px;
      }
      .section-title { font-size: 13px; font-weight: 600; color: var(--text-dim); }

      /* EMPTY */
      .empty {
        text-align: center; padding: 40px 24px;
        background: var(--bg-1); border-radius: 14px;
        border: 1px dashed var(--border);
        margin: 12px 16px;
      }
      .empty-icon { font-size: 36px; margin-bottom: 10px; }
      .empty-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
      .empty-sub { font-size: 12px; color: var(--text-faint); line-height: 1.5; }

      /* ROUND CARDS */
      .round-list { display: flex; flex-direction: column; gap: 10px; }

      /* SWIPE TO REVEAL DELETE */
      .swipe-row {
        position: relative;
        border-radius: 14px;
        overflow: hidden;
        touch-action: pan-y; /* 縦スクロールを許可、横はJSで処理 */
      }
      .swipe-action {
        position: absolute;
        right: 0; top: 0; bottom: 0;
        width: 80px;
        display: flex;
        align-items: stretch;
        z-index: 0;
      }
      .swipe-delete-btn {
        flex: 1;
        background: var(--red);
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
      }
      .swipe-delete-btn:active {
        background: #ff5757;
      }
      .swipe-foreground {
        position: relative;
        z-index: 1;
        transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
        will-change: transform;
        background: var(--bg-0);
      }
      .swipe-foreground.dragging {
        transition: none; /* ドラッグ中はトランジションを切る */
      }

      .round-card {
        display: flex; align-items: center; padding: 14px 16px;
        width: 100%;
        background: var(--bg-1); border-radius: 14px;
        border: 1px solid var(--border-soft);
        text-align: left;
        -webkit-user-select: none;
        user-select: none;
      }
      .round-card:active { transform: scale(0.99); }
      .round-card-main { flex: 1; min-width: 0; }
      .round-card-date {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: var(--text-faint);
      }
      .round-card-course {
        font-size: 14px; font-weight: 600; margin: 4px 0 6px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .round-card-meta {
        display: flex; gap: 10px; flex-wrap: wrap;
        font-size: 11px; color: var(--text-faint);
      }
      .round-card-kpis {
        display: flex; gap: 10px; flex-wrap: wrap;
        margin-top: 6px;
      }
      .rkpi-mini {
        font-size: 10px; color: var(--text-dim);
      }
      .rkpi-mini b {
        font-family: 'JetBrains Mono', monospace;
        color: var(--green-dim); font-weight: 600;
      }
      .round-card-score {
        text-align: right; flex: 0 0 auto; margin-left: 12px;
      }
      .score-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24px; font-weight: 700; color: var(--text);
      }
      .score-label {
        font-size: 9px; color: var(--text-faint);
        text-transform: uppercase; letter-spacing: 0.5px;
      }

      /* BOTTOM NAV */
      .bottom-nav {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        max-width: 480px; margin: 0 auto;
        background: rgba(10,10,10,0.95);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border-top: 1px solid var(--border-soft);
        display: flex; justify-content: space-around;
        padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
        z-index: 10;
      }
      @media (min-width: 600px) {
        .bottom-nav { max-width: 430px; }
      }
      .nav-btn {
        flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
        padding: 6px 0; color: var(--text-faint);
        font-size: 10px;
      }
      .nav-btn.active { color: var(--green); }

      /* SHEET */
      .sheet-backdrop {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.6);
        -webkit-backdrop-filter: blur(4px);
        backdrop-filter: blur(4px);
        z-index: 20;
        display: flex; align-items: flex-end; justify-content: center;
        animation: fadeIn 0.2s ease-out;
      }
      .sheet {
        width: 100%; max-width: 480px;
        background: var(--bg-1);
        border-radius: 18px 18px 0 0;
        padding: 12px 16px calc(20px + env(safe-area-inset-bottom));
        max-height: 92vh;
        max-height: 92dvh;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        animation: slideUp 0.25s cubic-bezier(0.2,0.9,0.3,1);
      }
      @media (min-width: 600px) {
        .sheet { max-width: 430px; }
      }
      .sheet-handle {
        width: 36px; height: 4px;
        background: var(--bg-3); border-radius: 2px;
        margin: 0 auto 14px;
      }
      .sheet-title { font-size: 16px; font-weight: 700; margin-bottom: 14px; }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

      .field { margin-bottom: 14px; display: block; }
      .field-label {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px; color: var(--text-dim); margin-bottom: 6px;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .field input[type="text"],
      .field input[type="date"],
      .field input[type="number"] {
        width: 100%;
        padding: 12px 14px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text);
        font-size: 14px;
        outline: none;
        min-height: 44px;
        line-height: 1.4;
        -webkit-appearance: none;
        appearance: none;
        font-family: inherit;
      }
      /* iOS Safariのdate入力固有のリセット */
      .field input[type="date"] {
        display: block;
        text-align: left;
      }
      .field input[type="date"]::-webkit-date-and-time-value {
        text-align: left;
      }
      .field input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(0.6);
      }
      .field input:focus { border-color: var(--green-dim); }

      /* COMBOBOX */
      .combobox { position: relative; }

      /* VENUE SELECTOR (タップして選択するUI) */
      .venue-selector {
        width: 100%;
        padding: 12px 14px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text);
        font-size: 14px;
        outline: none;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        text-align: left;
        font-family: inherit;
      }
      .venue-selector:active {
        background: var(--bg-3);
      }
      .venue-placeholder {
        color: var(--text-faint);
      }
      .venue-selected {
        color: var(--text);
        font-weight: 500;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .venue-caret {
        flex: 0 0 auto;
        color: var(--text-dim);
        font-size: 14px;
        transition: transform 0.2s;
      }
      .venue-caret.open {
        transform: rotate(180deg);
      }
      .venue-list {
        margin-top: 6px;
        max-height: 280px;
      }
      .venue-empty {
        margin-top: 6px;
        padding: 12px 14px;
        background: rgba(255,184,77,0.06);
        border: 1px solid rgba(255,184,77,0.2);
        border-radius: 8px;
        color: var(--amber);
        font-size: 12px;
        text-align: center;
        line-height: 1.5;
      }
      .combo-clear {
        position: absolute; right: 10px; top: 50%;
        transform: translateY(-50%);
        width: 24px; height: 24px;
        background: var(--bg-3); border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: var(--text-dim); font-size: 14px; line-height: 1;
      }
      .combo-list {
        margin-top: 6px;
        background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 10px;
        max-height: 220px; overflow-y: auto;
      }
      .combo-item {
        display: flex; align-items: center; gap: 8px;
        width: 100%; padding: 11px 14px;
        text-align: left; font-size: 13px;
        border-bottom: 1px solid var(--border-soft);
      }
      .combo-item:last-child { border-bottom: none; }
      .combo-item.on { background: rgba(182,242,74,0.08); color: var(--green); }
      .combo-master-badge {
        color: var(--green); font-size: 10px;
      }

      .course-master-hint {
        margin-top: 6px;
        padding: 6px 10px;
        background: rgba(182,242,74,0.08);
        border: 1px solid rgba(182,242,74,0.25);
        border-radius: 8px;
        color: var(--green);
        font-size: 11px;
        line-height: 1.4;
      }

      /* CHIPS */
      .chip-row {
        display: flex; flex-wrap: wrap; gap: 6px;
      }
      .chip-row.tight { gap: 4px; }
      .chip {
        padding: 8px 12px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 18px;
        font-size: 12px; color: var(--text-dim);
      }
      .chip.on {
        background: var(--green); color: #0a0a0a;
        border-color: var(--green); font-weight: 600;
      }
      .lie-chip { padding: 10px 12px; font-size: 13px; min-height: 40px; }

      /* SHEET ACTIONS */
      .sheet-actions {
        display: flex; gap: 8px; margin-top: 16px;
      }
      .btn-primary {
        flex: 1; padding: 13px;
        background: var(--green); color: #0a0a0a;
        border-radius: 11px; font-weight: 700; font-size: 14px;
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      }
      .btn-primary:disabled { opacity: 0.4; }
      .btn-ghost {
        flex: 0 0 auto; padding: 13px 18px;
        background: var(--bg-2); border-radius: 11px;
        color: var(--text-dim); font-size: 14px;
      }
      .btn-danger {
        padding: 10px 14px;
        background: rgba(255,107,107,0.12);
        color: var(--red); border-radius: 10px;
        font-size: 13px;
        display: inline-flex; align-items: center; gap: 6px;
      }

      /* ROUND VIEW */
      .round-screen { padding-bottom: 0; }
      .hole-strip {
        display: flex; gap: 6px;
        padding: 12px 16px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        background: var(--bg-1);
        border-bottom: 1px solid var(--border-soft);
        scrollbar-width: none;
      }
      .hole-strip::-webkit-scrollbar { display: none; }
      .hole-pill {
        flex: 0 0 auto;
        min-width: 38px; height: 38px;
        padding: 0 10px;
        background: var(--bg-2);
        border-radius: 10px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-size: 11px; color: var(--text-dim);
        position: relative;
      }
      .hole-pill.done {
        background: rgba(182,242,74,0.1);
        color: var(--green-dim);
      }
      .hole-pill.on {
        background: var(--green);
        color: #0a0a0a;
      }
      .hole-pill-num { font-weight: 700; line-height: 1; }
      .hole-pill-shots {
        font-size: 9px;
        font-family: 'JetBrains Mono', monospace;
        opacity: 0.8; line-height: 1; margin-top: 2px;
      }

      .hole-header {
        padding: 18px 16px 14px;
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--border-soft);
      }
      .hole-id {
        display: flex; flex-direction: column; align-items: flex-start;
      }
      .hole-id-label {
        font-size: 9px; color: var(--text-faint);
        text-transform: uppercase; letter-spacing: 1.5px;
      }
      .hole-id-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 32px; font-weight: 700;
        color: var(--text); line-height: 1;
      }
      .hole-controls {
        display: flex; gap: 8px; align-items: center;
      }
      .par-picker { display: flex; align-items: center; gap: 6px; }
      .par-label { font-size: 10px; color: var(--text-faint); }
      .par-buttons { display: flex; gap: 3px; }
      .par-btn {
        width: 32px; height: 32px;
        background: var(--bg-2);
        border-radius: 8px;
        font-size: 13px; color: var(--text-dim);
        font-weight: 600;
      }
      .par-btn.on {
        background: var(--green); color: #0a0a0a;
      }
      .distance-field {
        display: flex; align-items: center; gap: 4px;
        background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 10px; padding: 4px 8px 4px 10px;
        width: 100px;
      }
      .distance-field input {
        width: 100%;
        background: transparent; border: none; outline: none;
        color: var(--text); font-size: 14px;
        font-family: 'JetBrains Mono', monospace;
        padding: 6px 0;
      }
      .distance-field .unit {
        font-size: 11px; color: var(--text-faint);
      }

      /* SHOTS */
      .shots-area {
        padding: 14px 16px 80px;
        min-height: 200px;
      }
      .empty-shots {
        text-align: center; padding: 28px 16px;
        border: 1px dashed var(--border);
        border-radius: 12px;
      }
      .empty-shots-icon { font-size: 28px; margin-bottom: 6px; }
      .empty-shots-text { font-size: 12px; color: var(--text-faint); }

      .shot-list { display: flex; flex-direction: column; gap: 6px; }
      .shot-row {
        display: grid;
        grid-template-columns: 28px 50px 70px 1fr 56px 36px;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: var(--bg-1);
        border-radius: 10px;
        border: 1px solid var(--border-soft);
        text-align: left;
      }
      .shot-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: var(--text-faint);
      }
      .shot-club {
        font-weight: 700; font-size: 13px;
      }
      .shot-distance .dist-num {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700; font-size: 14px;
      }
      .shot-distance .dist-unit {
        font-size: 10px; color: var(--text-faint); margin-left: 2px;
      }
      .shot-distance .dist-empty { color: var(--text-faint); font-size: 13px; }
      .shot-tendency-tags {
        display: flex; gap: 4px; flex-wrap: wrap;
      }
      .tag {
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--bg-2);
        color: var(--text-dim);
      }
      .tag-dir { background: rgba(94,184,255,0.15); color: var(--blue); }
      .tag-depth { background: rgba(255,184,77,0.15); color: var(--amber); }
      .shot-lie {
        font-size: 10px; color: var(--text-dim);
        text-align: right;
      }
      .shot-result {
        width: 32px; height: 32px;
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 13px;
        font-family: 'JetBrains Mono', monospace;
      }
      .shot-result.tone-good { background: rgba(182,242,74,0.18); color: var(--tone-good); }
      .shot-result.tone-ok { background: rgba(94,184,255,0.18); color: var(--tone-ok); }
      .shot-result.tone-miss { background: rgba(255,184,77,0.2); color: var(--tone-miss); }
      .shot-result.tone-bad { background: rgba(255,107,107,0.2); color: var(--tone-bad); }

      /* FAB & HOLE NAV */
      .fab {
        position: fixed;
        right: 18px;
        bottom: 84px;
        width: 56px; height: 56px;
        background: var(--green); color: #0a0a0a;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(182,242,74,0.35);
        z-index: 9;
      }
      .hole-nav {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom));
        left: 0; right: 0;
        max-width: 480px; margin: 0 auto;
        display: flex; gap: 8px;
        padding: 10px 16px 14px;
        background: rgba(10,10,10,0.95);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border-top: 1px solid var(--border-soft);
        z-index: 8;
      }
      @media (min-width: 600px) {
        .hole-nav { max-width: 430px; }
      }
      .hole-nav-btn {
        flex: 1; padding: 12px;
        background: var(--bg-2); color: var(--text);
        border-radius: 11px; font-size: 13px;
        font-weight: 600;
      }
      .hole-nav-btn:disabled { opacity: 0.4; }
      .hole-nav-btn.finish {
        background: var(--green); color: #0a0a0a;
      }

      /* SHOT EDITOR */
      .shot-sheet { padding-bottom: 30px; }
      .shot-sheet-head {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 14px;
      }
      .shot-sheet-title { display: flex; align-items: baseline; gap: 8px; }
      .shot-sheet-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 22px; font-weight: 700; color: var(--green);
      }
      .shot-sheet-label {
        font-size: 13px; color: var(--text-dim);
      }
      .editor-section { margin-bottom: 14px; }
      .editor-section.two-col {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      }
      .editor-label {
        font-size: 10px; color: var(--text-dim);
        text-transform: uppercase; letter-spacing: 1px;
        margin-bottom: 6px;
      }

      .club-grid-compact {
        display: flex; flex-direction: column; gap: 8px;
        background: var(--bg-2); border-radius: 10px; padding: 10px;
      }
      .club-group-compact { display: flex; align-items: center; gap: 8px; }
      .club-group-label-compact {
        flex: 0 0 36px;
        font-size: 11px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 700;
      }
      .club-group-row-compact {
        display: flex; gap: 6px; flex-wrap: wrap; flex: 1;
      }
      .club-btn-compact {
        min-width: 48px; height: 44px; padding: 0 10px;
        background: var(--bg-3);
        border-radius: 8px;
        font-size: 14px; font-weight: 700;
        color: var(--text);
      }
      .club-btn-compact.on {
        background: var(--green); color: #0a0a0a;
      }
      .club-btn-compact:active {
        transform: scale(0.94);
      }

      .distance-display {
        display: flex; align-items: baseline; gap: 6px;
        background: var(--bg-2); border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 8px;
      }
      .distance-input-large {
        flex: 1;
        background: transparent; border: none; outline: none;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
        font-size: 32px; font-weight: 700;
      }
      .distance-unit-large {
        font-size: 14px; color: var(--text-dim); font-weight: 600;
      }
      .adjust-row {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
      }
      .adjust-btn {
        padding: 12px 0;
        background: var(--bg-2);
        border-radius: 8px;
        font-size: 14px; font-weight: 700;
        color: var(--text-dim);
        font-family: 'JetBrains Mono', monospace;
      }
      .adjust-btn:active { transform: scale(0.94); }
      .adjust-btn.minus { color: var(--red); }
      .adjust-btn.plus { color: var(--green-dim); }

      .shot-tendency-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 4px;
      }
      .tendency-btn {
        padding: 14px 4px;
        background: var(--bg-2);
        border-radius: 8px;
        font-size: 13px; color: var(--text-dim);
        font-weight: 600;
      }
      .tendency-btn:active { transform: scale(0.95); }
      .tendency-btn.on {
        background: var(--green); color: #0a0a0a;
      }

      .result-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
      }
      .result-btn {
        padding: 16px 0;
        background: var(--bg-2); border-radius: 10px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px; font-weight: 700; color: var(--text-dim);
      }
      .result-btn:active { transform: scale(0.95); }
      .result-btn.on.tone-good { background: var(--tone-good); color: #0a0a0a; }
      .result-btn.on.tone-ok { background: var(--tone-ok); color: #0a0a0a; }
      .result-btn.on.tone-miss { background: var(--tone-miss); color: #0a0a0a; }
      .result-btn.on.tone-bad { background: var(--tone-bad); color: #fff; }

      .memo-input-large {
        width: 100%;
        background: var(--bg-2); border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 12px;
        color: var(--text); font-size: 13px;
        outline: none; resize: vertical;
        line-height: 1.5;
      }

      .shot-sheet-actions {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px; margin-top: 14px;
      }
      .actions-right { display: flex; gap: 8px; flex: 1; }

      /* FINISH */
      .finish-sheet { text-align: center; }
      .finish-icon { font-size: 44px; margin-bottom: 6px; }
      .finish-title { font-size: 20px; font-weight: 700; margin-bottom: 14px; }
      .finish-summary {
        display: flex; gap: 14px; justify-content: center;
        margin-bottom: 12px;
      }
      .finish-stat {
        background: var(--bg-2); border-radius: 12px;
        padding: 12px 18px;
      }
      .finish-stat-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 28px; font-weight: 700; color: var(--green);
      }
      .finish-stat-label { font-size: 11px; color: var(--text-faint); }
      .finish-note {
        font-size: 12px; color: var(--text-dim);
        margin-bottom: 14px;
      }

      /* AI COPY */
      .ai-copy-section { padding: 12px 16px 0; }
      .ai-copy-btn {
        width: 100%;
        display: flex; align-items: center; gap: 12px;
        padding: 14px 16px;
        background: linear-gradient(135deg, rgba(182,242,74,0.12), rgba(94,184,255,0.08));
        border: 1px solid rgba(182,242,74,0.25);
        border-radius: 14px;
        text-align: left; color: var(--text);
        margin-bottom: 12px;
        transition: all 0.2s;
      }
      .ai-copy-btn:disabled { opacity: 0.4; }
      .ai-copy-btn:active { transform: scale(0.99); }
      .ai-copy-btn.ok { border-color: var(--green); background: rgba(182,242,74,0.18); }
      .ai-copy-btn.err { border-color: var(--red); background: rgba(255,107,107,0.12); }
      .ai-copy-icon { font-size: 22px; flex: 0 0 auto; }
      .ai-copy-text { flex: 1; min-width: 0; }
      .ai-copy-label { font-size: 13px; font-weight: 600; }
      .ai-copy-sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; }

      /* ANALYTICS TABS */
      .analytics-tabs {
        display: flex; padding: 0;
        border-bottom: 1px solid var(--border-soft);
      }
      .atab {
        flex: 1; /* 画面を3等分 */
        padding: 12px 4px;
        font-size: 13px; color: var(--text-dim);
        border-bottom: 2px solid transparent;
        font-weight: 600;
        text-align: center;
      }
      .atab.on {
        color: var(--green); border-bottom-color: var(--green);
      }

      /* DISTANCE CHART */
      .distance-chart {
        padding: 12px 16px 0;
        display: flex; flex-direction: column; gap: 8px;
      }
      .dchart-row {
        display: grid;
        grid-template-columns: 38px 1fr 28px;
        align-items: center; gap: 8px;
      }
      .dchart-club {
        font-weight: 700; font-size: 12px;
      }
      .dchart-track {
        position: relative; height: 24px;
        background: var(--bg-2); border-radius: 6px;
      }
      .dchart-range {
        position: absolute;
        top: 50%; transform: translateY(-50%);
        height: 6px;
        background: rgba(182,242,74,0.25);
        border-radius: 3px;
      }
      .dchart-trim {
        position: absolute;
        top: 50%; transform: translate(-50%, -50%);
        width: 4px; height: 18px;
        background: var(--green);
        border-radius: 2px;
      }
      .dchart-trim-num {
        position: absolute;
        bottom: 100%; left: 50%; transform: translateX(-50%);
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px; color: var(--green);
        white-space: nowrap;
        margin-bottom: 1px;
      }
      .dchart-n {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px; color: var(--text-faint);
        text-align: right;
      }

      /* STAT TABLE */
      .stat-table {
        background: var(--bg-1); border-radius: 12px;
        overflow: hidden;
      }
      .stat-table-head {
        display: grid;
        grid-template-columns: 40px 1fr 1fr 1fr 1fr 32px;
        padding: 10px 12px;
        background: var(--bg-2);
        font-size: 10px; color: var(--text-faint);
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .stat-table-row {
        display: grid;
        grid-template-columns: 40px 1fr 1fr 1fr 1fr 32px;
        padding: 10px 12px;
        font-size: 12px;
        border-top: 1px solid var(--border-soft);
        font-family: 'JetBrains Mono', monospace;
      }
      .st-club { font-weight: 700; }
      .st-trim { color: var(--green); font-weight: 600; }
      .st-range { color: var(--text-dim); }
      .st-miss.high { color: var(--red); }
      .st-n { color: var(--text-faint); text-align: right; }

      /* LIE GRID */
      .lie-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .lie-card {
        background: var(--bg-1); border-radius: 12px;
        padding: 10px 12px;
      }
      .lie-card-club {
        font-weight: 700; font-size: 13px; margin-bottom: 6px;
      }
      .lie-card-row {
        display: flex; justify-content: space-between; align-items: baseline;
        font-size: 11px;
      }
      .lie-card-label { color: var(--text-faint); }
      .lie-card-num {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600; color: var(--green);
      }
      .lie-card-num.rough { color: var(--amber); }
      .lie-card-diff {
        font-size: 10px; color: var(--text-faint);
        margin-top: 4px; text-align: right;
      }

      /* TENDENCY */
      .insight-list { display: flex; flex-direction: column; gap: 6px; }
      .insight {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 12px;
        border-radius: 10px;
        font-size: 12px;
      }
      .insight.tone-warn {
        background: rgba(255,184,77,0.1);
        border-left: 3px solid var(--amber);
      }
      .insight.tone-good {
        background: rgba(182,242,74,0.08);
        border-left: 3px solid var(--green);
      }
      .insight-club { font-weight: 700; flex: 0 0 auto; }
      .insight-msg { color: var(--text-dim); }

      .tendency-list { display: flex; flex-direction: column; gap: 8px; }
      .tendency-row {
        display: grid;
        grid-template-columns: 40px 1fr 28px;
        align-items: center; gap: 8px;
      }
      .tendency-club { font-weight: 700; font-size: 12px; }
      .tendency-bar {
        display: flex;
        height: 22px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--bg-2);
      }
      .tbar-seg {
        display: flex; align-items: center; justify-content: center;
        font-size: 9px; font-weight: 700;
        color: rgba(0,0,0,0.7);
        font-family: 'JetBrains Mono', monospace;
        min-width: 0;
      }
      .seg-left { background: rgba(94,184,255,0.5); }
      .seg-center { background: rgba(182,242,74,0.7); }
      .seg-right { background: rgba(255,184,77,0.6); }
      .seg-short { background: rgba(94,184,255,0.5); }
      .seg-pin { background: rgba(182,242,74,0.7); }
      .seg-over { background: rgba(255,107,107,0.55); }
      .tendency-n {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px; color: var(--text-faint);
        text-align: right;
      }
      .tendency-legend {
        display: flex; gap: 12px; margin-top: 6px;
        padding-left: 48px;
        font-size: 10px;
      }
      .lg::before {
        content: ''; display: inline-block;
        width: 8px; height: 8px;
        margin-right: 4px;
        border-radius: 2px;
        vertical-align: middle;
      }
      .lg-left::before, .lg-short::before { background: rgba(94,184,255,0.7); }
      .lg-center::before, .lg-pin::before { background: rgba(182,242,74,0.85); }
      .lg-right::before { background: rgba(255,184,77,0.8); }
      .lg-over::before { background: rgba(255,107,107,0.7); }

      /* KPI COMPARE */
      .kpi-compare {
        background: var(--bg-1); border-radius: 12px;
        padding: 4px 0;
      }
      .kpi-compare-head {
        display: grid;
        grid-template-columns: 1fr 80px 80px;
        padding: 8px 14px;
        font-size: 10px; color: var(--text-faint);
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .kpi-col-label { text-align: right; }
      .kpi-row {
        display: grid;
        grid-template-columns: 1fr 80px 80px;
        padding: 10px 14px;
        align-items: baseline;
        border-top: 1px solid var(--border-soft);
      }
      .kpi-label { font-size: 12px; color: var(--text-dim); }
      .kpi-val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px; font-weight: 600;
        text-align: right;
      }
      .kpi-val.dim { color: var(--text-faint); }
      .kpi-val.trend-up { color: var(--green); }
      .kpi-val.trend-down { color: var(--red); }

      /* ROUND KPI */
      .round-kpi-list {
        display: flex; flex-direction: column; gap: 8px;
      }
      .round-kpi-card {
        background: var(--bg-1); border-radius: 12px;
        padding: 12px;
      }
      .round-kpi-head {
        display: flex; justify-content: space-between; align-items: baseline;
        margin-bottom: 10px;
      }
      .round-kpi-date {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: var(--text-faint);
      }
      .round-kpi-course {
        font-size: 12px; font-weight: 600;
        color: var(--text);
        max-width: 60%;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .round-kpi-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
      }
      .rkpi {
        text-align: center;
        background: var(--bg-2);
        border-radius: 6px;
        padding: 6px 2px;
      }
      .rkpi-label {
        font-size: 9px; color: var(--text-faint);
        margin-bottom: 2px;
      }
      .rkpi-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px; font-weight: 700;
      }
      .rkpi-suf {
        font-size: 9px; color: var(--text-faint); font-weight: 400;
      }

      /* CLUB MGMT */
      .unit-toggle {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px 8px;
      }
      .unit-toggle-label {
        font-size: 11px; color: var(--text-dim);
        text-transform: uppercase; letter-spacing: 1px;
      }
      .unit-buttons { display: flex; gap: 4px; }
      .unit-btn {
        padding: 6px 14px;
        background: var(--bg-2);
        border-radius: 8px;
        font-size: 12px; color: var(--text-dim);
        font-weight: 600;
      }
      .unit-btn.on { background: var(--green); color: #0a0a0a; }

      .club-mgmt-list {
        padding: 8px 16px 0;
      }
      .club-mgmt-group { margin-bottom: 18px; }
      .club-mgmt-group-label {
        font-size: 10px; color: var(--text-faint);
        text-transform: uppercase; letter-spacing: 1px;
        margin-bottom: 6px;
      }
      .club-mgmt-row {
        display: flex; align-items: center; gap: 8px;
        padding: 10px 14px;
        background: var(--bg-1);
        border-radius: 10px;
        margin-bottom: 4px;
      }
      .club-mgmt-name {
        font-weight: 700;
        font-size: 14px;
        flex: 1;
        min-width: 0;
        text-align: left;
        padding: 6px 8px 6px 0;
        color: var(--text);
        background: transparent;
        border: none;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .club-mgmt-name:active {
        background: var(--bg-2);
        border-radius: 6px;
      }
      .club-mgmt-name-input {
        flex: 1;
        min-width: 0;
        padding: 6px 10px;
        background: var(--bg-2);
        border: 1px solid var(--green-dim);
        border-radius: 8px;
        color: var(--text);
        font-size: 14px;
        font-weight: 700;
        font-family: inherit;
        outline: none;
      }
      .club-mgmt-name-input:focus {
        border-color: var(--green);
      }
      .club-mgmt-distance {
        background: var(--bg-2); border-radius: 8px;
        padding: 6px 12px;
        display: flex; align-items: baseline; gap: 4px;
        flex: 0 0 auto;
      }
      .club-mgmt-del {
        flex: 0 0 auto;
        width: 32px; height: 32px;
        background: var(--bg-2);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        color: var(--red);
      }
      .club-mgmt-distance .dist-num {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700; font-size: 14px; color: var(--green);
      }
      .club-mgmt-distance .dist-unit {
        font-size: 10px; color: var(--text-faint);
      }
      .club-mgmt-distance .dist-empty {
        font-size: 11px; color: var(--text-faint);
      }
      .club-mgmt-edit {
        display: flex; align-items: center; gap: 4px;
        background: var(--bg-2); border-radius: 8px;
        padding: 0 12px;
      }
      .club-mgmt-edit input {
        width: 60px;
        background: transparent; border: none; outline: none;
        color: var(--green);
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px; font-weight: 700;
        padding: 6px 0;
        text-align: right;
      }
      .club-mgmt-edit .unit { font-size: 10px; color: var(--text-faint); }
      .club-mgmt-help {
        margin: 16px 16px 0;
        padding: 12px 14px;
        background: rgba(94,184,255,0.06);
        border: 1px solid rgba(94,184,255,0.15);
        border-radius: 10px;
        font-size: 11px; color: var(--text-dim);
        line-height: 1.5;
      }

      /* COURSES MASTER */
      .cm-help {
        margin: 14px 16px 8px;
        padding: 10px 12px;
        background: rgba(94,184,255,0.06);
        border: 1px solid rgba(94,184,255,0.15);
        border-radius: 10px;
        font-size: 11px; color: var(--text-dim);
        line-height: 1.6;
      }
      .cm-list {
        padding: 8px 16px 0;
        display: flex; flex-direction: column; gap: 14px;
      }
      .cm-venue-group {}
      .cm-venue-name {
        font-size: 12px; font-weight: 700; color: var(--text);
        margin-bottom: 6px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .cm-courses {
        display: flex; flex-direction: column; gap: 6px;
      }
      .cm-course-card {
        display: flex; align-items: stretch;
        background: var(--bg-1); border-radius: 10px;
        border: 1px solid var(--border-soft);
        overflow: hidden;
      }
      .cm-course-main {
        flex: 1; padding: 10px 12px; text-align: left;
      }
      .cm-course-head {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 4px;
      }
      .cm-course-name { font-size: 13px; font-weight: 700; }
      .cm-source {
        font-size: 9px;
        padding: 1px 6px;
        border-radius: 4px;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
      }
      .cm-source-default {
        background: rgba(160,160,160,0.15); color: var(--text-dim);
      }
      .cm-source-override {
        background: rgba(255,184,77,0.15); color: var(--amber);
      }
      .cm-source-user {
        background: rgba(182,242,74,0.15); color: var(--green);
      }
      .cm-course-meta {
        display: flex; gap: 10px;
        font-size: 11px; color: var(--text-faint);
        margin-bottom: 6px;
      }
      .cm-course-pars {
        display: flex; gap: 2px; flex-wrap: wrap;
      }
      .cm-par-cell {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        background: var(--bg-2);
        color: var(--text-dim);
        padding: 2px 5px;
        border-radius: 3px;
        min-width: 18px;
        text-align: center;
      }
      .cm-delete {
        flex: 0 0 auto;
        width: 38px;
        background: var(--bg-2);
        color: var(--red);
        display: flex; align-items: center; justify-content: center;
        border-left: 1px solid var(--border-soft);
      }

      /* COURSE EDITOR */
      .course-editor-sheet { max-height: 95vh; }
      .json-help {
        margin-bottom: 8px;
        padding: 10px 12px;
        background: var(--bg-2);
        border-radius: 10px;
      }
      .json-help-title {
        font-size: 11px; color: var(--text-dim);
        margin-bottom: 6px;
        font-weight: 600;
      }
      .json-help-quote {
        font-size: 11px; color: var(--text);
        line-height: 1.6;
        background: var(--bg-3);
        padding: 8px 10px;
        border-radius: 8px;
      }
      .json-help-quote code {
        display: block;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        white-space: pre-wrap;
        margin-top: 4px;
        color: var(--green-dim);
      }
      .json-help-note {
        font-size: 10px; color: var(--text-faint);
        margin-top: 6px;
      }
      .json-textarea {
        width: 100%;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 12px;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        outline: none;
        resize: vertical;
        line-height: 1.5;
      }
      .json-error {
        margin-top: 6px;
        padding: 6px 10px;
        background: rgba(255,107,107,0.1);
        border: 1px solid rgba(255,107,107,0.3);
        border-radius: 8px;
        color: var(--red);
        font-size: 11px;
      }
      .course-preview {
        margin-top: 10px;
        padding: 10px 12px;
        background: rgba(182,242,74,0.06);
        border: 1px solid rgba(182,242,74,0.2);
        border-radius: 10px;
      }
      .course-preview-totals {
        display: flex; gap: 12px;
        margin-bottom: 8px;
        font-size: 12px;
        color: var(--green);
        font-weight: 600;
      }
      .course-preview-holes {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        gap: 3px;
      }
      .course-preview-cell {
        background: var(--bg-2);
        border-radius: 4px;
        padding: 4px 2px;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
      }
      .cp-num { font-size: 8px; color: var(--text-faint); }
      .cp-par { font-size: 10px; font-weight: 700; }
      .cp-dist { font-size: 9px; color: var(--text-dim); }

      /* TEE COLORING */
      .tee-chip {
        display: inline-flex;
        align-items: center;
      }
      .chip.tee-chip:not(.on) {
        border-left: 3px solid transparent;
      }
      .chip.tee-chip:not(.on).tee-white {
        border-left-color: rgba(245,245,245,0.7);
      }
      .chip.tee-chip:not(.on).tee-red {
        border-left-color: rgba(255,107,107,0.8);
      }
      .chip.tee-chip:not(.on).tee-blue {
        border-left-color: rgba(94,184,255,0.8);
      }
      .chip.tee-chip:not(.on).tee-gold {
        border-left-color: rgba(255,184,77,0.8);
      }
      .cm-tee-badge {
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
        font-family: 'JetBrains Mono', monospace;
        vertical-align: middle;
      }
      .cm-tee-badge.tee-white {
        background: rgba(245,245,245,0.15); color: #f5f5f5;
      }
      .cm-tee-badge.tee-red {
        background: rgba(255,107,107,0.18); color: var(--red);
      }
      .cm-tee-badge.tee-blue {
        background: rgba(94,184,255,0.18); color: var(--blue);
      }
      .cm-tee-badge.tee-gold {
        background: rgba(255,184,77,0.2); color: var(--amber);
      }

      /* DELETE CONFIRMATION */
      .icon-btn-danger {
        color: var(--red);
        background: rgba(255,107,107,0.08);
      }
      .icon-btn-danger:active {
        background: rgba(255,107,107,0.18);
      }
      .delete-sheet {
        text-align: center;
      }
      .delete-icon {
        font-size: 48px;
        margin: 8px 0 12px;
      }
      .delete-title {
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 14px;
        color: var(--text);
      }
      .delete-info {
        background: var(--bg-2);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 14px;
        text-align: left;
      }
      .delete-info-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        padding: 4px 0;
      }
      .delete-info-label {
        color: var(--text-faint);
        flex: 0 0 auto;
      }
      .delete-info-value {
        color: var(--text);
        text-align: right;
        word-break: break-all;
      }
      .delete-warning {
        background: rgba(255,107,107,0.1);
        border: 1px solid rgba(255,107,107,0.3);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 14px;
        font-size: 12px;
        color: var(--red);
        line-height: 1.6;
      }
      .delete-confirm-check {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: var(--bg-2);
        border-radius: 10px;
        margin-bottom: 14px;
        font-size: 12px;
        color: var(--text);
        cursor: pointer;
        text-align: left;
      }
      .delete-confirm-check input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--red);
        flex: 0 0 auto;
      }
      .btn-danger-large {
        flex: 1;
        padding: 13px;
        background: var(--red);
        color: #fff;
        border-radius: 11px;
        font-weight: 700;
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .btn-danger-large:disabled {
        opacity: 0.3;
        background: var(--bg-3);
        color: var(--text-faint);
      }

      /* TUTORIAL */
      .tutorial-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.85);
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        z-index: 100;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.3s ease-out;
        /* top/bottomで自動高さ決定。height指定はzoomと相性悪いので使わない */
        overflow: hidden;
      }
      .tutorial-card {
        width: calc(100% - 24px);
        max-width: 420px;
        margin: 12px auto;
        flex: 1 1 auto;
        min-height: 0; /* flex子のoverflow有効化 */
        background: var(--bg-1);
        border: 1px solid var(--border);
        border-radius: 18px;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s cubic-bezier(0.2,0.9,0.3,1);
        overflow: hidden;
      }
      .tutorial-header {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px 8px;
      }
      .tutorial-step-indicator {
        display: flex;
        gap: 6px;
      }
      .tutorial-dot {
        width: 22px;
        height: 4px;
        background: var(--bg-3);
        border-radius: 2px;
        transition: all 0.3s;
      }
      .tutorial-dot.done {
        background: var(--green-dim);
      }
      .tutorial-dot.on {
        background: var(--green);
        width: 28px;
      }
      .tutorial-skip {
        font-size: 12px;
        color: var(--text-faint);
        padding: 4px 8px;
      }
      .tutorial-skip:active {
        color: var(--text-dim);
      }

      /* スクロール領域（preview + body をまとめてスクロール） */
      .tutorial-scroll {
        flex: 1 1 auto;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        min-height: 0; /* flex子要素のoverflow有効化 */
      }

      .tutorial-preview {
        margin: 8px 16px;
        padding: 14px;
        background: var(--bg-0);
        border-radius: 14px;
        border: 1px solid var(--border-soft);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .tutorial-body {
        padding: 4px 20px 12px;
        text-align: center;
      }
      .tutorial-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--text);
        margin-bottom: 4px;
      }
      .tutorial-subtitle {
        font-size: 12px;
        color: var(--green);
        font-weight: 600;
        margin-bottom: 12px;
      }
      .tutorial-desc {
        font-size: 13px;
        color: var(--text-dim);
        line-height: 1.7;
        text-align: left;
      }
      .tutorial-desc p {
        margin: 0 0 8px;
      }
      .tutorial-desc p:last-child {
        margin-bottom: 0;
      }
      .tutorial-desc b {
        color: var(--text);
        font-weight: 600;
      }

      .tutorial-actions {
        flex: 0 0 auto;
        display: flex;
        gap: 8px;
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
        align-items: center;
        justify-content: space-between;
        background: var(--bg-1);
        border-top: 1px solid var(--border-soft);
      }
      .tutorial-next {
        flex: 1;
      }

      /* === TUTORIAL PREVIEW MINIATURES === */
      .tp-stage {
        width: 100%;
        font-size: 11px;
        color: var(--text);
      }

      /* Welcome */
      .tp-welcome {
        text-align: center;
        padding: 12px 0;
      }
      .tp-welcome-emoji {
        font-size: 56px;
        margin-bottom: 8px;
      }
      .tp-welcome-title {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin-bottom: 2px;
      }
      .tp-welcome-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        letter-spacing: 2px;
        color: var(--green-dim);
        margin-bottom: 14px;
      }
      .tp-welcome-stats {
        display: flex;
        gap: 16px;
        justify-content: center;
      }
      .tp-welcome-stats > div {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .tp-welcome-stats b {
        font-family: 'JetBrains Mono', monospace;
        color: var(--green);
        font-size: 18px;
      }
      .tp-welcome-stats span {
        font-size: 9px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 2px;
      }

      /* Home */
      .tp-cta {
        background: var(--green);
        color: #0a0a0a;
        padding: 8px;
        border-radius: 8px;
        text-align: center;
        font-weight: 700;
        font-size: 11px;
        margin-bottom: 8px;
      }
      .tp-section-label {
        font-size: 9px;
        color: var(--text-dim);
        margin-bottom: 4px;
      }
      .tp-card {
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .tp-card.faded {
        opacity: 0.55;
      }
      .tp-card-date {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        color: var(--text-faint);
      }
      .tp-card-name {
        font-size: 11px;
        font-weight: 600;
        margin: 1px 0;
      }
      .tp-card-meta {
        font-size: 9px;
        color: var(--text-faint);
      }
      .tp-card-score {
        text-align: right;
      }
      .tp-card-score b {
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px;
        font-weight: 700;
      }
      .tp-card-score span {
        display: block;
        font-size: 8px;
        color: var(--text-faint);
      }
      .tp-tabbar {
        display: flex;
        margin-top: 8px;
        background: var(--bg-2);
        border-radius: 6px;
        padding: 4px;
        font-size: 9px;
      }
      .tp-tabbar > span {
        flex: 1;
        text-align: center;
        padding: 4px;
        color: var(--text-faint);
      }
      .tp-tabbar > span.on {
        color: var(--green);
        font-weight: 700;
      }

      /* New Round */
      .tp-modal-title {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 10px;
        text-align: center;
      }
      .tp-field-label {
        font-size: 9px;
        color: var(--text-dim);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 8px 0 3px;
      }
      .tp-input {
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 11px;
        color: var(--green);
      }
      .tp-input.small {
        margin-top: 3px;
      }
      .tp-chip-row {
        display: flex;
        gap: 4px;
      }
      .tp-chip {
        padding: 4px 12px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 12px;
        font-size: 10px;
        color: var(--text-dim);
      }
      .tp-chip.on {
        background: var(--green);
        color: #0a0a0a;
        border-color: var(--green);
        font-weight: 600;
      }

      /* Shot */
      .tp-club-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }
      .tp-club {
        background: var(--bg-3);
        border-radius: 4px;
        text-align: center;
        padding: 6px 0;
        font-size: 11px;
        font-weight: 700;
      }
      .tp-club.on {
        background: var(--green);
        color: #0a0a0a;
      }
      .tp-distance {
        font-family: 'JetBrains Mono', monospace;
        font-size: 22px;
        font-weight: 700;
        background: var(--bg-2);
        border-radius: 6px;
        padding: 6px 12px;
        text-align: center;
        margin: 4px 0;
      }
      .tp-distance span {
        font-size: 11px;
        color: var(--text-faint);
        margin-left: 4px;
      }
      .tp-tendency {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 3px;
        margin: 6px 0;
      }
      .tp-tend {
        background: var(--bg-2);
        border-radius: 4px;
        padding: 6px 0;
        text-align: center;
        font-size: 10px;
        color: var(--text-dim);
      }
      .tp-tend.on {
        background: var(--green);
        color: #0a0a0a;
        font-weight: 600;
      }
      .tp-result-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 3px;
      }
      .tp-result {
        background: var(--bg-2);
        border-radius: 6px;
        padding: 8px 0;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-dim);
      }
      .tp-result.on.good {
        background: var(--tone-good);
        color: #0a0a0a;
      }

      /* Analytics */
      .tp-tabs {
        display: flex;
        border-bottom: 1px solid var(--border-soft);
        margin-bottom: 10px;
      }
      .tp-tabs > span {
        flex: 1;
        text-align: center;
        padding: 6px;
        font-size: 10px;
        color: var(--text-dim);
        font-weight: 600;
      }
      .tp-tabs > span.on {
        color: var(--green);
        border-bottom: 2px solid var(--green);
      }
      .tp-bar-row {
        display: grid;
        grid-template-columns: 28px 1fr 28px;
        gap: 6px;
        align-items: center;
        margin-bottom: 6px;
      }
      .tp-bar-label {
        font-size: 11px;
        font-weight: 700;
      }
      .tp-bar {
        height: 8px;
        background: var(--bg-2);
        border-radius: 4px;
        overflow: hidden;
      }
      .tp-bar-fill {
        height: 100%;
        background: var(--green);
        border-radius: 4px;
      }
      .tp-bar-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: var(--green);
        text-align: right;
      }
      .tp-ai-btn {
        margin-top: 10px;
        background: linear-gradient(135deg, rgba(182,242,74,0.18), rgba(94,184,255,0.12));
        border: 1px solid rgba(182,242,74,0.3);
        padding: 8px;
        border-radius: 8px;
        text-align: center;
        font-size: 11px;
        font-weight: 600;
      }

      /* Clubs preview */
      .tp-modal-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .tp-add-icon {
        width: 24px; height: 24px;
        background: var(--bg-2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: var(--text);
      }
      .tp-cat-label {
        font-size: 9px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 6px 0 3px;
      }
      .tp-club-row {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-1);
        border-radius: 6px;
        padding: 6px 8px;
        margin-bottom: 3px;
      }
      .tp-club-name {
        font-weight: 700;
        font-size: 11px;
        flex: 1;
      }
      .tp-club-dist {
        background: var(--bg-2);
        border-radius: 4px;
        padding: 3px 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: var(--green);
      }
      .tp-club-dist small {
        font-size: 8px;
        color: var(--text-faint);
        margin-left: 2px;
        font-weight: normal;
      }
      .tp-club-trash {
        font-size: 11px;
        opacity: 0.6;
      }

      /* CodeSandbox banner spacer override - apply only when running inside CSB iframe */
      .app.in-csb .bottom-nav { bottom: 42px; }
      .app.in-csb .hole-nav { bottom: calc(42px + env(safe-area-inset-bottom)); }
      .app.in-csb .fab { bottom: calc(84px + 42px); }

      /* Standalone (本番iPhone Safari、PWA含む) ではバナーオフセット無し */
      .app.standalone .fab { bottom: calc(84px + env(safe-area-inset-bottom)); }
    `}</style>
  );
}
