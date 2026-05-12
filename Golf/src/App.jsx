import React, { useState, useEffect, useMemo, useRef } from "react";
import COURSES_DATA from "./courses.json";

// ============================================================
//  ICONS
// ============================================================
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

// v2.1: クラブを番手順でソートするヘルパー
// カテゴリ順: wood → utility → iron → wedge → putter
// 各カテゴリ内: 番手の数字が小さい順（DR→3W→5W、3I→4I→...→9I、PW→AW→SW、ウェッジ度数は小→大）
const CLUB_CATEGORY_ORDER = {
  wood: 0,
  utility: 1,
  iron: 2,
  wedge: 3,
  putter: 4,
};
function clubSortKey(club) {
  const catOrder = CLUB_CATEGORY_ORDER[club.category] ?? 99;
  // 名前から数字を抽出（DR=0扱い、3W=3、7I=7、56度=56など）
  const name = (club.name || "").toUpperCase();
  let num = 0;
  if (name === "DR") num = 0;
  else if (name === "PT") num = 0;
  else {
    // 数字部分を抽出
    const m = name.match(/(\d+(?:\.\d+)?)/);
    if (m) num = parseFloat(m[1]);
  }
  // ウェッジ: PW→AW→SW を 50/52/56 として並べる（既存番手順と統合）
  // 度数表記がない場合: PW=50, AW=52, SW=56 として補正
  if (club.category === "wedge" && num === 0) {
    if (name === "PW") num = 50;
    else if (name === "AW") num = 52;
    else if (name === "SW") num = 56;
    else num = 99;
  }
  return [catOrder, num];
}
function sortClubs(clubs) {
  return [...clubs].sort((a, b) => {
    const [ca, na] = clubSortKey(a);
    const [cb, nb] = clubSortKey(b);
    if (ca !== cb) return ca - cb;
    return na - nb;
  });
}

const LIES = [
  { id: "tee", label: "ティー" },
  { id: "fw", label: "FW" },
  { id: "rough", label: "ラフ" },
  { id: "bunker", label: "バンカー" },
  { id: "green", label: "グリーン" },
  { id: "pond", label: "池" },
];

// 自己評価（感覚値）
const SELF_RATINGS = [
  { id: "good", label: "◎", tone: "good", desc: "完璧" },
  { id: "ok", label: "○", tone: "ok", desc: "良い" },
  { id: "miss", label: "△", tone: "miss", desc: "まあまあ" },
  { id: "bad", label: "×", tone: "bad", desc: "ミス" },
];

// 結果（事実）
const OUTCOMES = [
  { id: "in_play", label: "セーフ", tone: "ok" },
  { id: "ob", label: "OB", tone: "bad" },
  { id: "lost", label: "ロスト", tone: "bad" },
  { id: "penalty_red", label: "赤杭", tone: "bad" },
  { id: "penalty_yellow", label: "黄杭", tone: "bad" },
];

// v1.0互換用：旧resultをマイグレーションするマップ
const LEGACY_RESULT_MAP = {
  good: { selfRating: "good", outcome: "in_play" },
  ok: { selfRating: "ok", outcome: "in_play" },
  miss: { selfRating: "miss", outcome: "in_play" },
  bad: { selfRating: "bad", outcome: "in_play" },
  ob: { selfRating: null, outcome: "ob" }, // OBは自己評価未指定（事実のみ）
};

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

// v1.0 → v2.0 マイグレーション
// shot.result → shot.selfRating + shot.outcome
// hole に manualScore を補完（未入力なら shots.length）
function migrateState(state) {
  if (!state || !state.rounds) return state;

  let migrated = false;
  const newRounds = state.rounds.map((round) => {
    const newHoles = round.holes.map((hole) => {
      // ショットのマイグレーション
      const newShots = (hole.shots || []).map((shot) => {
        // 既にv2.0形式（selfRating または outcome がある）ならそのまま
        if ("selfRating" in shot || "outcome" in shot) return shot;

        // v1.0形式（result がある）なら変換
        if ("result" in shot && shot.result) {
          migrated = true;
          const map = LEGACY_RESULT_MAP[shot.result] || {
            selfRating: null,
            outcome: "in_play",
          };
          // 旧形式は残しつつ新形式を追加（後方互換）
          return {
            ...shot,
            selfRating: map.selfRating,
            outcome: map.outcome,
          };
        }
        // result すらないなら新形式の空値で補完
        return { ...shot, selfRating: null, outcome: "in_play" };
      });

      // ホールに manualScore がなければ shots.length で補完（旧データ救済）
      let manualScore = hole.manualScore;
      if (manualScore === undefined && newShots.length > 0) {
        manualScore = newShots.length;
        migrated = true;
      }

      return {
        ...hole,
        shots: newShots,
        ...(manualScore !== undefined ? { manualScore } : {}),
      };
    });

    return { ...round, holes: newHoles };
  });

  if (!migrated) return state;
  return { ...state, rounds: newRounds, _v: 2 };
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
      // v2.1: クラブを番手順にソート
      loaded.clubs = sortClubs(loaded.clubs);
    }
    if (!loaded.courseMasters) loaded.courseMasters = [];
    return migrateState(loaded);
  }
  return {
    clubs: sortClubs(DEFAULT_CLUBS),
    rounds: [],
    courseMasters: [],
    unit: "yd",
    _v: 2,
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

// v2.1: ローカルタイムゾーンの「YYYY-MM-DD」を返す
// new Date().toISOString() は UTC 基準なので、日本時間との差で前日になる問題を回避
function getLocalDateString(d) {
  const date = d || new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

// ===== ショット v2.0 ヘルパー =====
// 旧 result からも v2.0 形式にアクセスできるように正規化
function getShotOutcome(shot) {
  if (shot.outcome) return shot.outcome;
  if (shot.result === "ob") return "ob";
  return "in_play";
}
function getShotSelfRating(shot) {
  if ("selfRating" in shot) return shot.selfRating;
  if (shot.result && shot.result !== "ob") return shot.result;
  return null;
}
// プレー外（OB・ロスト・ペナ）：距離分析から除外すべきショット
function isShotOffPlay(shot) {
  const o = getShotOutcome(shot);
  return o !== "in_play";
}
// v2.1: 平均距離から除外（ミス率にはカウント）
// 「フェアウェイには行ったが想定外の方向」「OB等のペナルティ」「打ち直し」「想定外のミス」など
function isExcludedFromAvg(shot) {
  return !!shot.excludeFromAvg;
}
// 「ミス」とみなすショット
// - 自己評価が miss/bad
// - off-play（OB等）
// - excludeFromAvg フラグ（手動でミス指定）
// v2.4/v2.5: ミス重み
// - v2.5: isMiss フラグ true なら 1.0
// - 自己評価ベース: ◎ ○ 未入力 = 0, △ = 0.5, × = 1.0
function getMissWeight(shot) {
  // v2.5: ミスフラグが立っているなら自動的に 1.0
  if (shot.isMiss === true) return 1.0;
  const r = getShotSelfRating(shot);
  if (r === "bad") return 1.0;
  if (r === "miss") return 0.5;
  return 0;
}
// 後方互換: boolean を返す関数（既存コードで使用）
// 0.5 以上をミスとして扱う（△ も × もミスとしてカウント）
function isMissShot(shot) {
  return getMissWeight(shot) > 0;
}
// ホールのスコア（手入力 manualScore 優先、なければ shots.length）
function getHoleScore(hole) {
  if (typeof hole.manualScore === "number" && hole.manualScore > 0) {
    return hole.manualScore;
  }
  return hole.shots ? hole.shots.length : 0;
}
// ホールのパット数（手入力 manualPutts 優先、なければクラブIDで判定）
function getHolePutts(hole, clubs) {
  if (typeof hole.manualPutts === "number") return hole.manualPutts;
  if (!hole.shots || !clubs) return 0;
  const putterIds = new Set(
    clubs.filter((c) => c.category === "putter").map((c) => c.id)
  );
  return hole.shots.filter((s) => putterIds.has(s.clubId)).length;
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
  // Blue → White → Red → Gold → その他（アルファベット順）の順でソート
  const order = { Blue: 0, White: 1, Red: 2, Gold: 3 };
  return Array.from(tees).sort((a, b) => {
    const av = a in order ? order[a] : 99;
    const bv = b in order ? order[b] : 99;
    if (av !== bv) return av - bv;
    return a.localeCompare(b);
  });
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
            setState={setState}
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
      {/* 下部ナビは home / analytics / clubs / courses で表示、round では非表示 */}
      {view.name !== "round" && (
        <BottomNav
          active={view.name}
          onNavigate={(name) => setView({ name })}
        />
      )}
      {showTutorial && <Tutorial onClose={closeTutorial} />}
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
            {["Blue", "White", "Red", "Gold"].map((t) => (
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

const LIE_LABELS = {
  tee: "ティー",
  fw: "FW",
  rough: "ラフ",
  bunker: "バンカー",
  green: "グリーン",
  pond: "池",
};
const SELF_RATING_LABELS = { good: "◎", ok: "○", miss: "△", bad: "×" };
const OUTCOME_LABELS = {
  in_play: "セーフ",
  ob: "OB",
  lost: "ロスト",
  penalty_red: "赤杭",
  penalty_yellow: "黄杭",
};
const DIR_LABELS = { left: "左", straight: "直", right: "右" };
const DEPTH_LABELS = { short: "ショート", pin: "ピン", over: "オーバー" };
// v2.1: 打感（任意）
const CONTACT_LABELS = {
  nice: "ナイス",
  duff: "ダフリ",
  top: "トップ",
  shank: "シャンク",
};

// v2.5: ミスタイプ（ミスショット時に複数選択可）
const MISS_TYPE_LABELS = {
  duff: "ダフリ",
  top: "トップ",
  hook_pull: "引っかけ",
  shank: "シャンク",
  choro: "チョロ",
  tempura: "テンプラ",
  hook: "フック",
  slice: "スライス",
  chii_ping: "チーピン",
};
const MISS_TYPES = [
  { id: "duff", label: "ダフリ" },
  { id: "top", label: "トップ" },
  { id: "hook_pull", label: "引っかけ" },
  { id: "shank", label: "シャンク" },
  { id: "choro", label: "チョロ" },
  { id: "tempura", label: "テンプラ" },
  { id: "hook", label: "フック" },
  { id: "slice", label: "スライス" },
  { id: "chii_ping", label: "チーピン" },
];


// ============================================================
//  KPI / AI PROMPTS
// ============================================================
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
  if (kpi.totalScore > 0) {
    lines.push(
      `- スコア：${kpi.totalScore}（${kpi.scoredHoles}/18ホール記録）`
    );
  }
  lines.push(`- 総ショット数：${kpi.totalShots}`);
  lines.push(`- パット：${kpi.putts}`);
  lines.push(`- パーオン：${kpi.parOn}/${kpi.parOnEligible}`);
  lines.push(`- FWキープ：${kpi.fwKeep}/${kpi.fwEligible}`);
  lines.push(`- OB：${kpi.obs}`);
  lines.push("");
  lines.push("## ホール毎スコア");
  lines.push("");
  lines.push("| ホール | Par | スコア | パット |");
  lines.push("|---|---|---|---|");
  round.holes.forEach((h) => {
    const score = getHoleScore(h);
    const putts = getHolePutts(h, clubs);
    if (score > 0) {
      lines.push(`| ${h.number} | ${h.par} | ${score} | ${putts || "-"} |`);
    }
  });
  lines.push("");
  lines.push("## 全ショット一覧");
  lines.push("");
  lines.push(
    "| ホール | Par | # | クラブ | 距離 | 打点 | 着地 | 方向 | 距離感 | 自己評価 | 打感 | 結果 | 平均除外 | メモ |"
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  round.holes.forEach((h) => {
    h.shots.forEach((s, i) => {
      const club = clubMap[s.clubId]?.name || "—";
      const sr = getShotSelfRating(s);
      const oc = getShotOutcome(s);
      const clubObj = clubMap[s.clubId];
      const isPutterShot = clubObj?.category === "putter";
      const isWedgeShot = clubObj?.category === "wedge";

      // 距離: 通常クラブ→s.distance、パター→puttDistance(m), ウェッジ→「狙いNyd→実Nyd」
      let distCol = "—";
      if (isPutterShot && s.puttDistance != null) {
        distCol = `${s.puttDistance}m`;
      } else if (isWedgeShot) {
        const t = s.wedgeTargetDistance;
        const a = s.wedgeDistance;
        if (t != null && a != null) {
          const diff = a - t;
          const sign = diff > 0 ? "+" : "";
          distCol = `狙${t}→実${a}(${sign}${diff})`;
        } else if (a != null) {
          distCol = `${a}${unit}`;
        } else if (t != null) {
          distCol = `狙${t}${unit}`;
        }
      } else if (s.distance != null) {
        distCol = `${s.distance}${unit}`;
      }

      // 結果: ウェッジ→配列ラベル、パター→puttResult、通常→outcome
      let resultCol = OUTCOME_LABELS[oc] || "—";
      if (isPutterShot && s.puttResult) {
        const PUTT_LBL = {
          in: "🎯IN", ok: "OK", short: "短", over: "長", left: "左", right: "右",
        };
        resultCol = PUTT_LBL[s.puttResult] || "—";
      } else if (isWedgeShot) {
        const arr = Array.isArray(s.wedgeResult)
          ? s.wedgeResult
          : s.wedgeResult ? [s.wedgeResult] : [];
        const W_LBL = {
          pin: "カップイン", green: "乗", short: "短", over: "長", left: "左外し", right: "右外し",
        };
        const labels = arr.map((r) => W_LBL[r]).filter(Boolean);
        resultCol = labels.length > 0 ? labels.join("+") : "—";
      }

      const row = [
        h.number,
        h.par,
        i + 1,
        club,
        distCol,
        LIE_LABELS[s.lie] || "—",
        LIE_LABELS[s.nextLie] || "—",
        DIR_LABELS[s.direction] || "—",
        DEPTH_LABELS[s.depth] || "—",
        sr ? SELF_RATING_LABELS[sr] : "—",
        s.contact ? CONTACT_LABELS[s.contact] : "—",
        resultCol,
        isExcludedFromAvg(s) ? "✓" : "—",
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
    // ウェッジとパターを除外（アプローチ・パットは別性質、距離・ミス率分析の対象外）
    if (c.category === "putter" || c.category === "wedge") return;
    const dists = shots
      .filter(
        (s) =>
          s.distance != null &&
          !isShotOffPlay(s) &&
          !isExcludedFromAvg(s)
      )
      .map((s) => s.distance);
    const dirs = shots.filter((s) => s.direction);
    const depths = shots.filter((s) => s.depth);
    const miss = shots.filter((s) =>
      isMissShot(s)
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

  // v2.1: ウェッジ集計（このラウンド）
  const wedgeShotsByClub = {};
  Object.entries(byClub).forEach(([cid, shots]) => {
    const c = clubMap[cid];
    if (c?.category === "wedge") {
      wedgeShotsByClub[cid] = { club: c, shots };
    }
  });
  const wedgeKeys = Object.keys(wedgeShotsByClub);
  if (wedgeKeys.length > 0) {
    lines.push("");
    lines.push("## ウェッジ（コントロールショット、本ラウンド）");
    lines.push("");
    wedgeKeys.forEach((cid) => {
      const { club, shots } = wedgeShotsByClub[cid];
      // 結果を集計
      const rc = { pin: 0, green: 0, short: 0, over: 0, left: 0, right: 0 };
      shots.forEach((s) => {
        const arr = Array.isArray(s.wedgeResult)
          ? s.wedgeResult
          : s.wedgeResult ? [s.wedgeResult] : [];
        arr.forEach((r) => {
          if (rc.hasOwnProperty(r)) rc[r]++;
        });
      });
      // 距離精度
      const diffs = shots
        .filter(
          (s) =>
            s.wedgeTargetDistance != null &&
            s.wedgeDistance != null &&
            !isExcludedFromAvg(s)
        )
        .map((s) => s.wedgeDistance - s.wedgeTargetDistance);
      const parts = [`${shots.length}回`];
      if (diffs.length > 0) {
        const absMean = Math.round(
          diffs.reduce((sum, d) => sum + Math.abs(d), 0) / diffs.length
        );
        const signedMean = Math.round(
          diffs.reduce((sum, d) => sum + d, 0) / diffs.length
        );
        parts.push(
          `精度±${absMean}${unit} / クセ${
            signedMean > 0 ? "+" : ""
          }${signedMean}${unit}`
        );
      }
      // 結果分布（0回のものはスキップ）
      const resultStrs = [];
      if (rc.pin) resultStrs.push(`カップイン${rc.pin}`);
      if (rc.green) resultStrs.push(`乗${rc.green}`);
      if (rc.short) resultStrs.push(`短${rc.short}`);
      if (rc.over) resultStrs.push(`長${rc.over}`);
      if (rc.left) resultStrs.push(`左${rc.left}`);
      if (rc.right) resultStrs.push(`右${rc.right}`);
      if (resultStrs.length > 0) parts.push(resultStrs.join("/"));
      lines.push(`- **${club.name}**: ${parts.join(" / ")}`);
    });
  }

  // v2.1: 打感集計（このラウンド、全クラブ横断）
  const contactCounts = { nice: 0, duff: 0, top: 0, shank: 0 };
  let contactN = 0;
  Object.values(byClub).forEach((shots) => {
    shots.forEach((s) => {
      if (s.contact && contactCounts.hasOwnProperty(s.contact)) {
        contactCounts[s.contact]++;
        contactN++;
      }
    });
  });
  if (contactN > 0) {
    lines.push("");
    lines.push("## 打感（本ラウンド）");
    lines.push("");
    const cParts = [];
    if (contactCounts.nice)
      cParts.push(`ナイス${contactCounts.nice}`);
    if (contactCounts.duff)
      cParts.push(`ダフリ${contactCounts.duff}`);
    if (contactCounts.top)
      cParts.push(`トップ${contactCounts.top}`);
    if (contactCounts.shank)
      cParts.push(`シャンク${contactCounts.shank}`);
    lines.push(`- 全${contactN}回: ${cParts.join(" / ")}`);
    // ミスショット（duff/top/shank）が出たクラブを列挙
    const missContactByClub = {};
    Object.entries(byClub).forEach(([cid, shots]) => {
      const c = clubMap[cid];
      if (!c) return;
      shots.forEach((s) => {
        if (s.contact && s.contact !== "nice") {
          if (!missContactByClub[c.name]) missContactByClub[c.name] = {};
          const m = missContactByClub[c.name];
          m[s.contact] = (m[s.contact] || 0) + 1;
        }
      });
    });
    if (Object.keys(missContactByClub).length > 0) {
      lines.push("");
      lines.push("ミス系打感のクラブ別内訳:");
      Object.entries(missContactByClub).forEach(([name, counts]) => {
        const ps = [];
        if (counts.duff) ps.push(`ダフリ${counts.duff}`);
        if (counts.top) ps.push(`トップ${counts.top}`);
        if (counts.shank) ps.push(`シャンク${counts.shank}`);
        lines.push(`- ${name}: ${ps.join("/")}`);
      });
    }
  }

  // v2.5: このラウンドのパッティング集計
  const putterShots = [];
  round.holes.forEach((h) => {
    (h.shots || []).forEach((s) => {
      const c = clubs.find((cc) => cc.id === s.clubId);
      if (c?.category === "putter") putterShots.push(s);
    });
  });
  if (putterShots.length > 0) {
    lines.push("");
    lines.push("## このラウンドのパッティング");
    lines.push("");
    const totalPutts = putterShots.length;
    const inCount = putterShots.filter((s) => s.puttResult === "in").length;
    const okCount = putterShots.filter((s) => s.puttResult === "ok").length;
    const shortCount = putterShots.filter(
      (s) => s.puttResult === "short"
    ).length;
    const overCount = putterShots.filter((s) => s.puttResult === "over").length;
    const leftCount = putterShots.filter((s) => s.puttResult === "left").length;
    const rightCount = putterShots.filter(
      (s) => s.puttResult === "right"
    ).length;
    lines.push(`- 総パット数: ${totalPutts}`);
    lines.push(
      `- カップイン: ${inCount} / OK圏内: ${okCount} / ショート: ${shortCount} / オーバー: ${overCount} / 左外し: ${leftCount} / 右外し: ${rightCount}`
    );
    // 距離別のサマリ（v2.5: 0.5m を境界に細分化）
    const distSums = {
      lt05: [],
      "05to1": [],
      "1to2": [],
      "2to3": [],
      "3plus": [],
    };
    putterShots.forEach((s) => {
      if (s.puttDistance == null) return;
      const d = s.puttDistance;
      const result = s.puttResult;
      const ok = result === "in" || result === "ok";
      if (d < 0.5) distSums.lt05.push(ok);
      else if (d < 1) distSums["05to1"].push(ok);
      else if (d < 2) distSums["1to2"].push(ok);
      else if (d < 3) distSums["2to3"].push(ok);
      else distSums["3plus"].push(ok);
    });
    const fmtDist = (arr) =>
      arr.length
        ? `${arr.filter(Boolean).length}/${arr.length}（${Math.round(
            (arr.filter(Boolean).length / arr.length) * 100
          )}%）`
        : "—";
    lines.push("");
    lines.push("### 距離別の成功率（IN+OK圏内）");
    lines.push(`- 〜0.5m: ${fmtDist(distSums.lt05)}`);
    lines.push(`- 0.5-1m: ${fmtDist(distSums["05to1"])}`);
    lines.push(`- 1-2m: ${fmtDist(distSums["1to2"])}`);
    lines.push(`- 2-3m: ${fmtDist(distSums["2to3"])}`);
    lines.push(`- 3m以上: ${fmtDist(distSums["3plus"])}`);
  }

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
  // ウェッジとパターを除外（アプローチ・パターは別性質）
  const used = stats.filter(
    (s) =>
      s.n > 0 &&
      s.club.category !== "putter" &&
      s.club.category !== "wedge"
  );
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

  // v2.1: ウェッジパフォーマンス（コントロールショット、累積）
  const wedgeStats = computeWedgeStats(state).filter((s) => s.n > 0);
  if (wedgeStats.length > 0) {
    lines.push("## ウェッジパフォーマンス（コントロールショット）");
    lines.push("");
    lines.push(
      "| クラブ | 平均距離 | レンジ | カップイン率 | ミス率 | 距離精度(±) | クセ | 結果分布(IN/乗/短/長/左/右) | n |"
    );
    lines.push("|---|---|---|---|---|---|---|---|---|");
    wedgeStats.forEach((s) => {
      const rc = s.resultCounts;
      const distribution = `${rc.pin}/${rc.green}/${rc.short}/${rc.over}/${rc.left}/${rc.right}`;
      const accuracy =
        s.diffN > 0 ? `±${s.absMeanDiff}${state.unit}(n=${s.diffN})` : "—";
      const tendency =
        s.signedMeanDiff != null
          ? s.signedMeanDiff > 0
            ? `+${s.signedMeanDiff}長め`
            : s.signedMeanDiff < 0
            ? `${s.signedMeanDiff}短め`
            : "ぴったり"
          : "—";
      const cupinRate = s.n
        ? Math.round((rc.pin / s.n) * 100) + "%"
        : "—";
      lines.push(
        `| ${s.club.name} | ${s.trimmed ?? "—"}${state.unit} | ${
          s.min != null ? `${s.min}-${s.max}` : "—"
        } | ${cupinRate} | ${s.missRate ?? "—"}% | ${accuracy} | ${tendency} | ${distribution} | ${s.n} |`
      );
    });
    lines.push("");
  }

  // v2.5: パッティングパフォーマンス（累積）
  const putterStats = computePutterStats(state);
  if (putterStats && putterStats.n > 0) {
    lines.push(`## パッティングパフォーマンス（n=${putterStats.n}）`);
    lines.push("");
    lines.push(`- 18H平均パット数: ${putterStats.avgPuttsPer18 ?? "—"}`);
    lines.push(
      `- カップイン率（全体）: ${
        putterStats.n
          ? Math.round((putterStats.resultCounts.in / putterStats.n) * 100)
          : "—"
      }%`
    );
    lines.push(
      `- OK圏内含む成功率: ${
        putterStats.n
          ? Math.round(
              ((putterStats.resultCounts.in + putterStats.resultCounts.ok) /
                putterStats.n) *
                100
            )
          : "—"
      }%`
    );
    lines.push("");
    // 距離別
    const distRows = putterStats.byDistance.filter((b) => b.n > 0);
    if (distRows.length > 0) {
      lines.push("### 距離別の成功率");
      lines.push("| 距離 | n | IN率 | OK率 |");
      lines.push("|---|---|---|---|");
      distRows.forEach((b) => {
        lines.push(
          `| ${b.label} | ${b.n} | ${b.inRate ?? "—"}% | ${b.okRate ?? "—"}% |`
        );
      });
      lines.push("");
    }
    // 傾斜・曲がり別
    const slopeRows = putterStats.bySlope.filter((s) => s.n > 0);
    if (slopeRows.length > 0) {
      lines.push("### 傾斜別の成功率");
      lines.push("| 傾斜 | n | IN率 | OK率 |");
      lines.push("|---|---|---|---|");
      slopeRows.forEach((s) => {
        lines.push(
          `| ${s.label} | ${s.n} | ${s.inRate ?? "—"}% | ${s.okRate ?? "—"}% |`
        );
      });
      lines.push("");
    }
    const curveRows = putterStats.byCurve.filter((s) => s.n > 0);
    if (curveRows.length > 0) {
      lines.push("### 曲がり別の成功率");
      lines.push("| 曲がり | n | IN率 | OK率 |");
      lines.push("|---|---|---|---|");
      curveRows.forEach((s) => {
        lines.push(
          `| ${s.label} | ${s.n} | ${s.inRate ?? "—"}% | ${s.okRate ?? "—"}% |`
        );
      });
      lines.push("");
    }
    // 結果分布
    const RES = {
      in: "🎯 IN",
      ok: "OK圏内",
      short: "ショート",
      over: "オーバー",
      left: "左外し",
      right: "右外し",
    };
    const resEntries = Object.entries(putterStats.resultCounts).filter(
      ([, v]) => v > 0
    );
    if (resEntries.length > 0) {
      lines.push("### 結果の分布");
      resEntries.forEach(([k, v]) => {
        const pct = Math.round((v / putterStats.n) * 100);
        lines.push(`- ${RES[k] || k}: ${v}回 (${pct}%)`);
      });
      lines.push("");
    }
  }

  // v2.1: 打感（ダフリ・トップ・シャンク）の傾向
  const contactByClub = {};
  state.rounds.forEach((r) => {
    r.holes.forEach((h) => {
      h.shots.forEach((s) => {
        if (!s.contact) return;
        if (!contactByClub[s.clubId]) {
          contactByClub[s.clubId] = {
            nice: 0, duff: 0, top: 0, shank: 0, total: 0,
          };
        }
        if (contactByClub[s.clubId].hasOwnProperty(s.contact)) {
          contactByClub[s.clubId][s.contact]++;
          contactByClub[s.clubId].total++;
        }
      });
    });
  });
  const contactClubs = Object.entries(contactByClub)
    .map(([cid, c]) => {
      const club = state.clubs.find((x) => x.id === cid);
      return club ? { club, ...c } : null;
    })
    .filter((x) => x !== null && x.total > 0);
  if (contactClubs.length > 0) {
    lines.push("## 打感の傾向（クラブ別）");
    lines.push("");
    lines.push("| クラブ | ナイス | ダフリ | トップ | シャンク | n |");
    lines.push("|---|---|---|---|---|---|");
    contactClubs.forEach((c) => {
      lines.push(
        `| ${c.club.name} | ${c.nice} | ${c.duff} | ${c.top} | ${c.shank} | ${c.total} |`
      );
    });
    lines.push("");
  }

  // v2.1: メモから定性的な気づき（最新20件）
  const memoEntries = [];
  state.rounds.forEach((r) => {
    r.holes.forEach((h) => {
      h.shots.forEach((s) => {
        if (s.memo && s.memo.trim() !== "") {
          const club = state.clubs.find((c) => c.id === s.clubId);
          memoEntries.push({
            date: r.date,
            club: club?.name || "—",
            memo: s.memo.trim(),
          });
        }
      });
    });
  });
  // 新しい順（簡易）
  memoEntries.reverse();
  const recentMemos = memoEntries.slice(0, 20);
  if (recentMemos.length > 0) {
    lines.push("## 最近のショットメモ（最新20件、定性的気づき）");
    lines.push("");
    recentMemos.forEach((m) => {
      const memoText = m.memo.replace(/\n/g, " ");
      lines.push(`- ${m.date} ${m.club}: 「${memoText}」`);
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
  // ウェッジとパターを除外（アプローチ・パターは別性質）
  const used = stats.filter(
    (s) =>
      s.trimmed != null &&
      s.club.category !== "putter" &&
      s.club.category !== "wedge"
  );
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

  // v2.1: ウェッジ（コントロールショット）の距離感
  const wedgeStats = computeWedgeStats(state).filter((s) => s.n > 0);
  if (wedgeStats.length > 0) {
    lines.push("");
    lines.push(`## ウェッジ実戦距離（コントロールショット、単位: ${state.unit}）`);
    lines.push("");
    lines.push(
      "| クラブ | 平均距離 | レンジ | カップイン率 | 距離精度(±) | クセ | n |"
    );
    lines.push("|---|---|---|---|---|---|---|");
    wedgeStats.forEach((s) => {
      const cupinRate = s.n
        ? Math.round((s.resultCounts.pin / s.n) * 100) + "%"
        : "—";
      const accuracy =
        s.diffN > 0 ? `±${s.absMeanDiff}(n=${s.diffN})` : "—";
      const tendency =
        s.signedMeanDiff != null
          ? s.signedMeanDiff > 0
            ? `+${s.signedMeanDiff}長め`
            : s.signedMeanDiff < 0
            ? `${s.signedMeanDiff}短め`
            : "ぴったり"
          : "—";
      lines.push(
        `| ${s.club.name} | ${s.trimmed ?? "—"} | ${
          s.min != null ? `${s.min}-${s.max}` : "—"
        } | ${cupinRate} | ${accuracy} | ${tendency} | ${s.n} |`
      );
    });
  }

  // v2.5: パター統計（パッティング全体の傾向）
  const putterStats = computePutterStats(state);
  if (putterStats && putterStats.n > 0) {
    lines.push("");
    lines.push(`## パッティング（n=${putterStats.n}、対象 ${putterStats.totalRounds}ラウンド）`);
    lines.push("");
    lines.push(`- 18H平均パット数: ${putterStats.avgPuttsPer18 ?? "—"}`);
    lines.push(
      `- カップイン率（全体）: ${
        putterStats.n
          ? Math.round((putterStats.resultCounts.in / putterStats.n) * 100)
          : "—"
      }%`
    );
    lines.push("");
    lines.push("### 距離別の成功率");
    lines.push("| 距離 | n | IN率 | OK率（IN+OK圏内） |");
    lines.push("|---|---|---|---|");
    putterStats.byDistance.forEach((b) => {
      if (b.n > 0) {
        lines.push(
          `| ${b.label} | ${b.n} | ${b.inRate ?? "—"}% | ${b.okRate ?? "—"}% |`
        );
      }
    });
    // 傾斜・曲がり別はサンプル数がある時のみ
    if (putterStats.bySlope.some((s) => s.n > 0)) {
      lines.push("");
      lines.push("### 傾斜別の成功率");
      lines.push("| 傾斜 | n | IN率 | OK率 |");
      lines.push("|---|---|---|---|");
      putterStats.bySlope.forEach((s) => {
        if (s.n > 0) {
          lines.push(
            `| ${s.label} | ${s.n} | ${s.inRate ?? "—"}% | ${s.okRate ?? "—"}% |`
          );
        }
      });
    }
    if (putterStats.byCurve.some((s) => s.n > 0)) {
      lines.push("");
      lines.push("### 曲がり別の成功率");
      lines.push("| 曲がり | n | IN率 | OK率 |");
      lines.push("|---|---|---|---|");
      putterStats.byCurve.forEach((s) => {
        if (s.n > 0) {
          lines.push(
            `| ${s.label} | ${s.n} | ${s.inRate ?? "—"}% | ${s.okRate ?? "—"}% |`
          );
        }
      });
    }
    // 結果分布
    lines.push("");
    lines.push("### 結果の分布");
    const RES = {
      in: "🎯 IN",
      ok: "OK圏内",
      short: "ショート",
      over: "オーバー",
      left: "左外し",
      right: "右外し",
    };
    Object.entries(putterStats.resultCounts).forEach(([k, v]) => {
      if (v > 0) {
        const pct = Math.round((v / putterStats.n) * 100);
        lines.push(`- ${RES[k] || k}: ${v}回 (${pct}%)`);
      }
    });
  }

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
        // 距離分析対象: distance あり、プレー外でない、平均除外フラグでない
        if (
          s.distance != null &&
          !isShotOffPlay(s) &&
          !isExcludedFromAvg(s)
        ) {
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
    // v2.4: ミス率計算（重み付け：◎○未入力=0、△=0.5、×=1.0）
    const missScore = data.shots.reduce((sum, s) => sum + getMissWeight(s), 0);
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
        ? Math.round((missScore / data.shots.length) * 100)
        : null,
      dir,
      depth,
    };
  });
}

// v2.1: ウェッジ専用統計（コントロールショットの分析）
function computeWedgeStats(state) {
  const wedgeClubs = state.clubs.filter((c) => c.category === "wedge");
  return wedgeClubs.map((c) => {
    const shots = [];
    state.rounds.forEach((r) => {
      r.holes.forEach((h) => {
        h.shots.forEach((s) => {
          if (s.clubId === c.id) shots.push(s);
        });
      });
    });
    // 結果分布（v2.1: 配列または文字列の両方に対応）
    const resultCounts = {
      pin: 0, green: 0, short: 0, over: 0, left: 0, right: 0,
    };
    shots.forEach((s) => {
      const results = Array.isArray(s.wedgeResult)
        ? s.wedgeResult
        : s.wedgeResult
        ? [s.wedgeResult]
        : [];
      results.forEach((r) => {
        if (resultCounts.hasOwnProperty(r)) {
          resultCounts[r]++;
        }
      });
    });
    // 距離（excludeFromAvg なし、wedgeDistance あり）
    const dists = shots
      .filter((s) => s.wedgeDistance != null && !isExcludedFromAvg(s))
      .map((s) => s.wedgeDistance);
    // v2.1: ピンまで vs 実際の差分（精度）
    // - excludeFromAvg は除外
    // - ピンまでと実距離の両方が入っているショットだけ対象
    const diffShots = shots.filter(
      (s) =>
        s.wedgeTargetDistance != null &&
        s.wedgeDistance != null &&
        !isExcludedFromAvg(s)
    );
    const diffs = diffShots.map(
      (s) => s.wedgeDistance - s.wedgeTargetDistance
    );
    const absMean = diffs.length
      ? Math.round(
          diffs.reduce((sum, d) => sum + Math.abs(d), 0) / diffs.length
        )
      : null;
    const signedMean = diffs.length
      ? Math.round(diffs.reduce((sum, d) => sum + d, 0) / diffs.length)
      : null;
    // v2.1: ショット単位でカウント（複数結果が選択されていても1ショット=1回として扱う）
    // v2.4: ミス率は自己評価（◎○=0, △=0.5, ×=1.0）で計算
    //   結果（短/長/左/右）はあくまで参考、自己評価でミスを判定する方針に統一
    let successCount = 0; // ピンorグリーン乗のショット数
    let missScore = 0; // 自己評価ベースの加重ミススコア
    shots.forEach((s) => {
      const results = Array.isArray(s.wedgeResult)
        ? s.wedgeResult
        : s.wedgeResult
        ? [s.wedgeResult]
        : [];
      // 寄せ成功 = pin or green が1つでも含まれる
      if (results.includes("pin") || results.includes("green")) {
        successCount++;
      }
      // ミススコア（自己評価ベース）
      missScore += getMissWeight(s);
    });
    return {
      club: c,
      n: shots.length,
      avg: dists.length
        ? Math.round(dists.reduce((a, b) => a + b, 0) / dists.length)
        : null,
      median: dists.length ? Math.round(median(dists)) : null,
      trimmed: dists.length ? Math.round(trimmedMean(dists)) : null,
      max: dists.length ? Math.max(...dists) : null,
      min: dists.length ? Math.min(...dists) : null,
      resultCounts,
      successRate: shots.length
        ? Math.round((successCount / shots.length) * 100)
        : null,
      missRate: shots.length
        ? Math.round((missScore / shots.length) * 100)
        : null,
      // v2.1: 距離精度
      diffN: diffs.length, // サンプル数
      absMeanDiff: absMean, // 絶対誤差平均（精度の指標）
      signedMeanDiff: signedMean, // 符号付き平均誤差（クセの指標）
    };
  });
}

// v2.1: パター専用統計
function computePutterStats(state) {
  const putterIds = new Set(
    state.clubs.filter((c) => c.category === "putter").map((c) => c.id)
  );
  // 全パターショットを集める
  const shots = [];
  state.rounds.forEach((r) => {
    r.holes.forEach((h) => {
      h.shots.forEach((s) => {
        if (putterIds.has(s.clubId)) shots.push(s);
      });
    });
  });

  if (shots.length === 0) {
    return null;
  }

  // 距離レンジ別の成功率（INまたはOK圏内）
  // 距離レンジ別の成功率（INまたはOK圏内）
  // v2.5: 0.5m を境界に細分化
  const distanceBuckets = [
    { id: "lt05", label: "〜0.5m", min: 0, max: 0.5 },
    { id: "05-1", label: "0.5-1m", min: 0.5, max: 1 },
    { id: "1-2", label: "1-2m", min: 1, max: 2 },
    { id: "2-3", label: "2-3m", min: 2, max: 3 },
    { id: "3-5", label: "3-5m", min: 3, max: 5 },
    { id: "5+", label: "5m以上", min: 5, max: Infinity },
  ];
  const byDistance = distanceBuckets.map((b) => {
    const inBucket = shots.filter(
      (s) =>
        s.puttDistance != null &&
        s.puttDistance >= b.min &&
        s.puttDistance < b.max
    );
    const inCount = inBucket.filter((s) => s.puttResult === "in").length;
    const okOrIn = inBucket.filter(
      (s) => s.puttResult === "in" || s.puttResult === "ok"
    ).length;
    return {
      ...b,
      n: inBucket.length,
      inRate: inBucket.length
        ? Math.round((inCount / inBucket.length) * 100)
        : null,
      okRate: inBucket.length
        ? Math.round((okOrIn / inBucket.length) * 100)
        : null,
    };
  });

  // 傾斜別の成功率
  const slopeOptions = [
    { id: "up", label: "↗ 登り" },
    { id: "flat", label: "→ 平ら" },
    { id: "down", label: "↘ 下り" },
  ];
  const bySlope = slopeOptions.map((o) => {
    const filtered = shots.filter((s) => s.puttLineSlope === o.id);
    const inCount = filtered.filter((s) => s.puttResult === "in").length;
    const okOrIn = filtered.filter(
      (s) => s.puttResult === "in" || s.puttResult === "ok"
    ).length;
    return {
      ...o,
      n: filtered.length,
      inRate: filtered.length
        ? Math.round((inCount / filtered.length) * 100)
        : null,
      okRate: filtered.length
        ? Math.round((okOrIn / filtered.length) * 100)
        : null,
    };
  });

  // 曲がり別の成功率
  const curveOptions = [
    { id: "hook", label: "↙ フック" },
    { id: "straight", label: "↑ 直" },
    { id: "slice", label: "↘ スライス" },
  ];
  const byCurve = curveOptions.map((o) => {
    const filtered = shots.filter((s) => s.puttLineCurve === o.id);
    const inCount = filtered.filter((s) => s.puttResult === "in").length;
    const okOrIn = filtered.filter(
      (s) => s.puttResult === "in" || s.puttResult === "ok"
    ).length;
    return {
      ...o,
      n: filtered.length,
      inRate: filtered.length
        ? Math.round((inCount / filtered.length) * 100)
        : null,
      okRate: filtered.length
        ? Math.round((okOrIn / filtered.length) * 100)
        : null,
    };
  });

  // 結果分布（全体）
  const resultCounts = {
    in: 0, ok: 0, short: 0, over: 0, left: 0, right: 0,
  };
  shots.forEach((s) => {
    if (s.puttResult && resultCounts.hasOwnProperty(s.puttResult)) {
      resultCounts[s.puttResult]++;
    }
  });

  // ラウンド毎のパット平均
  const roundsWithPutts = state.rounds
    .map((r) => {
      const totalPutts = r.holes.reduce((sum, h) => {
        return sum + getHolePutts(h, state.clubs);
      }, 0);
      const recordedHoles = r.holes.filter(
        (h) => (h.shots || []).length > 0 || (h.manualPutts != null)
      ).length;
      return { round: r, totalPutts, recordedHoles };
    })
    .filter((x) => x.recordedHoles > 0);

  const avgPuttsPerRound =
    roundsWithPutts.length > 0
      ? Math.round(
          (roundsWithPutts.reduce((a, b) => a + b.totalPutts, 0) /
            roundsWithPutts.length) *
            10
        ) / 10
      : null;

  // 18ホール換算のパット数平均
  const avgPuttsPer18 =
    roundsWithPutts.length > 0
      ? Math.round(
          (roundsWithPutts.reduce(
            (a, b) =>
              a + (b.recordedHoles > 0 ? (b.totalPutts / b.recordedHoles) * 18 : 0),
            0
          ) /
            roundsWithPutts.length) *
            10
        ) / 10
      : null;

  return {
    n: shots.length,
    byDistance,
    bySlope,
    byCurve,
    resultCounts,
    avgPuttsPerRound,
    avgPuttsPer18,
    totalRounds: roundsWithPutts.length,
  };
}

// ===== ラウンドKPI =====
function computeRoundKPI(round, clubs) {
  const putterIds = new Set(
    clubs.filter((c) => c.category === "putter").map((c) => c.id)
  );
  let putts = 0,
    totalScore = 0, // ← v2.0: スコアは手入力 manualScore ベース
    totalShots = 0, // ショット記録の本数（参考）
    obs = 0;
  let parOn = 0,
    parOnEligible = 0;
  let fwKeep = 0,
    fwEligible = 0;
  let recordedHoles = 0; // ショットを1つ以上記録しているホール
  let scoredHoles = 0; // スコアが入力されているホール

  round.holes.forEach((h) => {
    const hasShots = (h.shots || []).length > 0;
    const score = getHoleScore(h);
    const hasScore = score > 0;

    if (hasShots) recordedHoles++;
    if (hasScore) scoredHoles++;

    if (hasShots) {
      totalShots += h.shots.length;
      h.shots.forEach((s) => {
        if (putterIds.has(s.clubId)) putts += 0; // shotsベースのパットは下で別途
        if (getShotOutcome(s) === "ob") obs++;
      });
    }
    if (hasScore) {
      totalScore += score;
      // パット数は手入力優先。なければクラブIDで判定
      putts += getHolePutts(h, clubs);
    }

    if (hasShots) {
      // v2.1: パーオン判定改善
      // 規定打数（Par-2打）でグリーンに乗っているか判定
      // - 判定方法: 規定打数目のショットの nextLie が "green"
      //   または、規定打数の次のショット（=パットor寄せ）が lie "green"
      // - これによりユーザーが nextLie を省略しても、次のショットの lie で判定可能
      const targetIdx = h.par - 2 - 1; // Par3=0, Par4=1, Par5=2
      if (targetIdx >= 0 && h.shots.length > targetIdx) {
        parOnEligible++;
        const shotAt = h.shots[targetIdx];
        const nextShot = h.shots[targetIdx + 1];
        const isOnGreen =
          (shotAt && shotAt.nextLie === "green") ||
          (nextShot && nextShot.lie === "green") ||
          // パター（PT）が次のショットならグリーン乗り扱い
          (nextShot && clubs.find((c) => c.id === nextShot.clubId)?.category === "putter");
        if (isOnGreen) parOn++;
      }
      if (h.par >= 4 && h.shots.length >= 1) {
        fwEligible++;
        const tee = h.shots[0];
        // ティーショットの nextLie が fw、または次のショットの lie が fw
        const nextAfterTee = h.shots[1];
        const isOnFw =
          (tee && tee.nextLie === "fw") ||
          (nextAfterTee && nextAfterTee.lie === "fw");
        if (isOnFw) fwKeep++;
      }
    }
  });
  return {
    id: round.id,
    date: round.date,
    course: round.course,
    totalScore, // v2.0 でスコアの基準
    totalShots, // ショット記録の本数
    putts,
    obs,
    parOn,
    parOnEligible,
    fwKeep,
    fwEligible,
    recordedHoles,
    scoredHoles,
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
  // v2.0: スコアは totalScore (manualScore合計) を使用
  const sumScore = rounds.reduce((a, r) => a + (r.totalScore || 0), 0);
  const sumPutts = rounds.reduce((a, r) => a + r.putts, 0);
  const sumParOn = rounds.reduce((a, r) => a + r.parOn, 0);
  const sumParOnEli = rounds.reduce((a, r) => a + r.parOnEligible, 0);
  const sumFwKeep = rounds.reduce((a, r) => a + r.fwKeep, 0);
  const sumFwEli = rounds.reduce((a, r) => a + r.fwEligible, 0);
  const sumObs = rounds.reduce((a, r) => a + r.obs, 0);
  // OB率はショット記録ベース（記録があるラウンドのみ）
  const totalShotsForOb = rounds.reduce((a, r) => a + (r.totalShots || 0), 0);
  return {
    avgScore: sumScore
      ? Math.round((sumScore / rounds.length) * 10) / 10
      : null,
    avgPutts: sumPutts
      ? Math.round((sumPutts / rounds.length) * 10) / 10
      : null,
    parOnRate: sumParOnEli ? Math.round((sumParOn / sumParOnEli) * 100) : null,
    fwKeepRate: sumFwEli ? Math.round((sumFwKeep / sumFwEli) * 100) : null,
    obRate: totalShotsForOb
      ? Math.round((sumObs / totalShotsForOb) * 1000) / 10
      : null,
  };
}

// ============================================================
//  COMPONENTS
// ============================================================
function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${active === "home" ? "active" : ""}`}
        onClick={() => onNavigate("home")}
      >
        <Flag size={20} />
        <span>ラウンド</span>
      </button>
      <button
        className={`nav-btn ${active === "analytics" ? "active" : ""}`}
        onClick={() => onNavigate("analytics")}
      >
        <BarChart3 size={20} />
        <span>分析</span>
      </button>
      <button
        className={`nav-btn ${active === "clubs" ? "active" : ""}`}
        onClick={() => onNavigate("clubs")}
      >
        <Settings size={20} />
        <span>クラブ</span>
      </button>
    </nav>
  );
}

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

// ============================================================
//  HOME
// ============================================================
function HomeView({
  state,
  setState,
  onOpenRound,
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
  // v2.2: ラウンドカードをタップ時、編集シートを表示し、閉じる時にラウンド画面へ
  const [editingRound, setEditingRound] = useState(null);

  // 編集シートで保存された時：メタ情報を更新してラウンド画面へ遷移
  const handleEditSave = (updates) => {
    if (!editingRound) return;
    setState((s) => ({
      ...s,
      rounds: s.rounds.map((r) => {
        if (r.id !== editingRound.id) return r;
        // v2.5: コース変更時は holes の par/distance を新しいデータに更新（shots/score は維持）
        let newHoles = r.holes;
        if (updates.combinedHoles && Array.isArray(updates.combinedHoles)) {
          newHoles = r.holes.map((h, i) => {
            const newPar = updates.combinedHoles[i]?.par;
            const newDist = updates.combinedHoles[i]?.distance;
            return {
              ...h,
              ...(newPar != null ? { par: newPar } : {}),
              distance:
                newDist != null ? newDist : h.distance,
              // shots, manualScore, manualPutts などはそのまま
            };
          });
        }
        return {
          ...r,
          date: updates.date,
          venue: updates.venue,
          frontCourse: updates.frontCourse,
          backCourse: updates.backCourse,
          course: updates.course,
          tee: updates.tee,
          weather: updates.weather,
          holes: newHoles,
        };
      }),
    }));
    const targetId = editingRound.id;
    setEditingRound(null);
    onOpenRound(targetId);
  };

  // 編集シートをキャンセル時：編集なしでラウンド画面へ遷移
  const handleEditCancel = () => {
    if (!editingRound) return;
    const targetId = editingRound.id;
    setEditingRound(null);
    onOpenRound(targetId);
  };

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
                  onTap={() => setEditingRound(r)}
                  onDeleteClick={() => setConfirmDeleteId(r.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {showNew && (
        <NewRoundSheet
          courseMasters={state.courseMasters || []}
          onCancel={() => setShowNew(false)}
          onStart={startRound}
        />
      )}

      {editingRound && (
        <NewRoundSheet
          courseMasters={state.courseMasters || []}
          existing={editingRound}
          onCancel={handleEditCancel}
          onStart={handleEditSave}
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
              <span>
                {kpi.scoredHoles > 0
                  ? `${kpi.scoredHoles}/18 holes`
                  : `${kpi.recordedHoles}/18 holes`}
              </span>
            </div>
            {(kpi.totalScore > 0 || kpi.totalShots > 0) && (
              <div className="round-card-kpis">
                {kpi.putts > 0 && (
                  <span className="rkpi-mini">
                    <b>{kpi.putts}</b> パット
                  </span>
                )}
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
            {kpi.totalScore > 0 ? (
              <>
                <div className="score-num">{kpi.totalScore}</div>
                <div className="score-label">score</div>
              </>
            ) : (
              <>
                <div className="score-num">{kpi.totalShots}</div>
                <div className="score-label">shots</div>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

function NewRoundSheet({ courseMasters, onCancel, onStart, existing }) {
  const isEdit = !!existing;
  const today = getLocalDateString();
  const [date, setDate] = useState(existing?.date || today);
  const [venue, setVenue] = useState(existing?.venue || "");
  const [tee, setTee] = useState(existing?.tee || "");
  const [frontCourse, setFrontCourse] = useState(existing?.frontCourse || "");
  const [backCourse, setBackCourse] = useState(existing?.backCourse || "");
  const [weather, setWeather] = useState(existing?.weather || "");
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

    const courseLabel =
      frontCourse.trim() && backCourse.trim()
        ? venue + " [" + frontCourse + " → " + backCourse + "]"
        : frontCourse.trim()
        ? venue + " [" + frontCourse + "]"
        : venue;

    // ホール情報を生成（コース・ティーから）
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

    // 編集モード
    if (isEdit) {
      // v2.5: コース・ティーが変わった時は combinedHoles も送る（ホール情報更新）
      const courseChanged =
        existing.frontCourse !== frontCourse.trim() ||
        existing.backCourse !== backCourse.trim() ||
        existing.venue !== venue.trim() ||
        existing.tee !== (tee || null);
      // マスタが見つかった = 距離・Par データがある場合のみホール更新の意味がある
      const hasMasterData = !!frontMaster || !!backMaster;
      const shouldUpdateHoles = courseChanged && hasMasterData;

      onStart({
        date,
        venue: venue.trim(),
        frontCourse: frontCourse.trim(),
        backCourse: backCourse.trim(),
        course: courseLabel,
        tee: tee || null,
        weather,
        // コース変更時のみ combinedHoles を送る
        ...(shouldUpdateHoles ? { combinedHoles } : {}),
      });
      return;
    }

    // 新規モード: combinedHoles を作って送信
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
        <div className="sheet-title">
          {isEdit ? "ラウンド編集" : "新しいラウンド"}
        </div>

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
              {["Blue", "White", "Red", "Gold", "レギュラー", "バック"].map(
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
            {isEdit ? "保存" : "開始"}
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
                onDelete={() => deleteShot(s.id)}
              />
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShotEditor({ mode: "new" })}>
        <Plus size={24} strokeWidth={2.6} />
      </button>

      {/* v2.0: ホールのスコア手入力（コンパクト・下部固定） */}
      <HoleScoreInput hole={hole} onChange={(patch) => updateHole(patch)} />

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
            if (shotEditor.mode === "edit") {
              // 編集モード: _puttCount は無視、単一更新
              const { _puttCount, ...shotData } = shot;
              updateShot(shotEditor.shotId, shotData);
            } else {
              // 新規追加モード
              const puttCount = shot._puttCount || 1;
              const { _puttCount, ...firstShot } = shot;
              const isPutterShot =
                firstShot.clubId &&
                clubs.find((c) => c.id === firstShot.clubId)?.category ===
                  "putter";

              // ★ アトミックな1回の onUpdate で全部やる（addShot だと非同期で集計が壊れる）
              onUpdate((r) => ({
                ...r,
                holes: r.holes.map((h, i) => {
                  if (i !== holeIdx) return h;
                  // 新規ショットを生成
                  const newShots = [...h.shots, { ...firstShot, id: uid() }];
                  // 複数打の場合は2打目以降を追加
                  if (puttCount > 1) {
                    for (let n = 2; n <= puttCount; n++) {
                      newShots.push({
                        id: uid(),
                        clubId: firstShot.clubId,
                        puttDistance: null,
                        puttLineSlope: null,
                        puttLineCurve: null,
                        puttResult: n === puttCount ? "in" : "ok",
                        memo: "",
                        outcome: "in_play",
                      });
                    }
                  }
                  // ホールデータ更新
                  const next = { ...h, shots: newShots };
                  // パターの場合のみ manualPutts/manualScore を自動加算
                  // - manualPutts: パター数を newShots 内のパター数に合わせる
                  // - manualScore: 全ショット数（newShots.length）以上になるよう調整
                  // ★ 既に手入力で設定済みの場合は、ショット数より少ないなら自動増やす
                  if (isPutterShot) {
                    // newShots 内のパター本数
                    const putterCount = newShots.filter((s) => {
                      const c = clubs.find((cc) => cc.id === s.clubId);
                      return c?.category === "putter";
                    }).length;
                    // manualPutts は putterCount に追従
                    if (
                      next.manualPutts === undefined ||
                      next.manualPutts < putterCount
                    ) {
                      next.manualPutts = putterCount;
                    }
                    // manualScore はショット総数に追従（より大きい値があればそれを優先）
                    if (
                      next.manualScore === undefined ||
                      next.manualScore < newShots.length
                    ) {
                      next.manualScore = newShots.length;
                    }
                  }
                  return next;
                }),
              }));
            }
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

function HoleScoreInput({ hole, onChange }) {
  const score = hole.manualScore;
  const putts = hole.manualPutts;
  const par = hole.par || 4;

  const setScore = (v) => {
    if (v === null || v === undefined || v === "") {
      onChange({ manualScore: undefined });
    } else {
      const num = Math.max(1, Math.min(20, Number(v)));
      onChange({ manualScore: num });
    }
  };
  const setPutts = (v) => {
    if (v === null || v === undefined || v === "") {
      onChange({ manualPutts: undefined });
    } else {
      const num = Math.max(0, Math.min(10, Number(v)));
      onChange({ manualPutts: num });
    }
  };

  // 対パー
  const diff = score ? score - par : null;
  const diffLabel =
    diff === null
      ? null
      : diff === 0
      ? "Par"
      : diff > 0
      ? `+${diff}`
      : `${diff}`;
  const diffTone =
    diff === null
      ? ""
      : diff <= -2
      ? "great"
      : diff === -1
      ? "good"
      : diff === 0
      ? "ok"
      : diff === 1
      ? "bogey"
      : "double";

  return (
    <div className="score-input-bar">
      <div className="score-input-bar-row">
        <span className="score-input-bar-label">S</span>
        <button
          className="score-step-btn small"
          onClick={() => setScore((score || par) - 1)}
          disabled={!score || score <= 1}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          className="score-input-num small"
          value={score ?? ""}
          placeholder={String(par)}
          onChange={(e) => setScore(e.target.value)}
        />
        <button
          className="score-step-btn small"
          onClick={() => setScore((score || par) + 1)}
        >
          +
        </button>
        {diffLabel && (
          <span className={`score-diff tone-${diffTone}`}>{diffLabel}</span>
        )}

        <span className="score-input-bar-divider" />

        <span className="score-input-bar-label">P</span>
        <button
          className="score-step-btn small"
          onClick={() => setPutts(Math.max(0, (putts ?? 0) - 1))}
          disabled={putts == null || putts <= 0}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          className="score-input-num small"
          value={putts ?? ""}
          placeholder="-"
          onChange={(e) => setPutts(e.target.value)}
        />
        <button
          className="score-step-btn small"
          onClick={() => setPutts((putts ?? 0) + 1)}
        >
          +
        </button>
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

function ShotRow({ index, shot, clubs, unit, onClick, onDelete }) {
  // v2.1: 左スワイプで削除ボタン表示
  const [translateX, setTranslateX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);

  const SWIPE_THRESHOLD = 60; // この距離以上スワイプで削除ボタン表示
  const DELETE_BTN_WIDTH = 80;

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    draggingRef.current = true;
    movedRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!draggingRef.current) return;
    const x = e.touches[0].clientX;
    currentXRef.current = x;
    const diff = x - startXRef.current;
    if (Math.abs(diff) > 5) movedRef.current = true;
    // 左方向のみ反応（diff < 0）
    if (diff < 0) {
      setTranslateX(Math.max(diff, -DELETE_BTN_WIDTH));
    } else if (showDelete) {
      // 削除ボタン表示中の右スワイプは閉じる方向
      setTranslateX(Math.min(0, -DELETE_BTN_WIDTH + diff));
    }
  };

  const handleTouchEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const diff = currentXRef.current - startXRef.current;
    if (diff < -SWIPE_THRESHOLD) {
      // 左に十分スワイプ → 削除ボタン表示
      setTranslateX(-DELETE_BTN_WIDTH);
      setShowDelete(true);
    } else {
      // 戻す
      setTranslateX(0);
      setShowDelete(false);
    }
  };

  const handleClick = (e) => {
    // スワイプ中・スワイプ後のクリックは無視
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
      return;
    }
    // 削除ボタンが表示中なら、行クリックは閉じるだけ
    if (showDelete) {
      e.preventDefault();
      e.stopPropagation();
      setTranslateX(0);
      setShowDelete(false);
      return;
    }
    onClick();
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) onDelete();
    setTranslateX(0);
    setShowDelete(false);
  };

  return (
    <div className="shot-row-swipe-wrap">
      <div
        className="shot-row-delete-action"
        onClick={handleDeleteClick}
        style={{ width: `${DELETE_BTN_WIDTH}px` }}
      >
        <Trash2 size={20} />
        <span className="shot-row-delete-label">削除</span>
      </div>
      <div
        className="shot-row-swipe-content"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: draggingRef.current ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ShotRowInner
          index={index}
          shot={shot}
          clubs={clubs}
          unit={unit}
          onClick={handleClick}
        />
      </div>
    </div>
  );
}

function ShotRowInner({ index, shot, clubs, unit, onClick }) {
  const club = clubs.find((c) => c.id === shot.clubId);
  const isPutterShot = club?.category === "putter";

  // パターの場合は専用表示
  if (isPutterShot) {
    const PUTT_RESULT_LABELS = {
      in: { label: "🎯 IN", tone: "good" },
      ok: { label: "OK", tone: "ok" },
      short: { label: "ショート", tone: "miss" },
      over: { label: "オーバー", tone: "miss" },
      left: { label: "← 左外し", tone: "miss" },
      right: { label: "右外し →", tone: "miss" },
    };
    const result = shot.puttResult
      ? PUTT_RESULT_LABELS[shot.puttResult]
      : null;
    const slopeLabel =
      shot.puttLineSlope === "up"
        ? "↗登"
        : shot.puttLineSlope === "down"
        ? "↘下"
        : shot.puttLineSlope === "flat"
        ? "→平"
        : null;
    const curveLabel =
      shot.puttLineCurve === "hook"
        ? "↙フック"
        : shot.puttLineCurve === "slice"
        ? "↘スライス"
        : shot.puttLineCurve === "straight"
        ? "↑直"
        : null;
    return (
      <button className="shot-row" onClick={onClick}>
        <div className="shot-num">{index}</div>
        <div className="shot-club">{club?.name || "PT"}</div>
        <div className="shot-distance">
          {shot.puttDistance != null ? (
            <>
              <span className="dist-num">{shot.puttDistance}</span>
              <span className="dist-unit">m</span>
            </>
          ) : (
            <span className="dist-empty">—</span>
          )}
        </div>
        <div className="shot-tendency-tags">
          {slopeLabel && <span className="tag tag-dir">{slopeLabel}</span>}
          {curveLabel && <span className="tag tag-depth">{curveLabel}</span>}
        </div>
        <div className="shot-lie">—</div>
        <div className="shot-result-cell">
          {result && (
            <span className={`shot-result tone-${result.tone}`}>
              {result.label}
            </span>
          )}
        </div>
      </button>
    );
  }

  // v2.1: ウェッジの場合は専用表示
  const isWedgeShot = club?.category === "wedge";
  if (isWedgeShot) {
    const WEDGE_RESULT_LABELS = {
      pin: { label: "🎯 カップイン", tone: "good" },
      green: { label: "○ 乗", tone: "ok" },
      short: { label: "ショート", tone: "miss" },
      over: { label: "オーバー", tone: "miss" },
      left: { label: "← 左外し", tone: "miss" },
      right: { label: "右外し →", tone: "miss" },
    };
    // v2.1: 配列または文字列（旧データ）の両方に対応
    const wRawResults = Array.isArray(shot.wedgeResult)
      ? shot.wedgeResult
      : shot.wedgeResult
      ? [shot.wedgeResult]
      : [];
    const wResults = wRawResults
      .map((r) => WEDGE_RESULT_LABELS[r])
      .filter(Boolean);
    return (
      <button className="shot-row" onClick={onClick}>
        <div className="shot-num">
          {index}
          {isExcludedFromAvg(shot) && (
            <span className="shot-replay-badge" title="平均距離から除外">⊘</span>
          )}
        </div>
        <div className="shot-club">{club?.name || "—"}</div>
        <div className="shot-distance">
          {shot.wedgeDistance != null ? (
            <>
              <span className="dist-num">{shot.wedgeDistance}</span>
              <span className="dist-unit">{unit}</span>
            </>
          ) : (
            <span className="dist-empty">—</span>
          )}
        </div>
        <div className="shot-tendency-tags">
          {shot.contact && shot.contact !== "nice" && (
            <span className="tag tag-contact">
              {CONTACT_LABELS[shot.contact]}
            </span>
          )}
        </div>
        <div className="shot-lie">—</div>
        <div className="shot-result-cell">
          {wResults.length > 0 && (
            <div className="shot-result-multi">
              {wResults.map((wr, i) => (
                <span
                  key={i}
                  className={`shot-result-mini tone-${wr.tone}`}
                >
                  {wr.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>
    );
  }

  const sr = getShotSelfRating(shot);
  const oc = getShotOutcome(shot);
  const rating = SELF_RATINGS.find((r) => r.id === sr);
  const outcome = OUTCOMES.find((o) => o.id === oc);
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
      <div className="shot-num">
        {index}
        {isExcludedFromAvg(shot) && (
          <span className="shot-replay-badge" title="平均距離から除外">⊘</span>
        )}
      </div>
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
        {shot.isMiss && (
          <span className="tag tag-miss">⚠️ミス</span>
        )}
        {Array.isArray(shot.missTypes) &&
          shot.missTypes.slice(0, 2).map((mt, i) => (
            <span key={i} className="tag tag-miss-type">
              {MISS_TYPE_LABELS[mt] || mt}
            </span>
          ))}
        {dirLabel && <span className="tag tag-dir">{dirLabel}</span>}
        {depthLabel && <span className="tag tag-depth">{depthLabel}</span>}
        {shot.contact && shot.contact !== "nice" && (
          <span className="tag tag-contact">
            {CONTACT_LABELS[shot.contact]}
          </span>
        )}
      </div>
      <div className="shot-lie">{lie?.label}</div>
      <div className="shot-result-cell">
        {rating && (
          <span className={`shot-result tone-${rating.tone}`}>
            {rating.label}
          </span>
        )}
        {outcome && oc !== "in_play" && (
          <span className={`shot-outcome tone-${outcome.tone}`}>
            {outcome.label}
          </span>
        )}
      </div>
    </button>
  );
}

// ============================================================
//  v3.2: チャット式音声入力 - 選択肢ボタン
// ============================================================
function ChatChoiceButtons({
  askingKey,
  clubs,
  unit,
  numericInput,
  setNumericInput,
  multiSelect,
  setMultiSelect,
  onChoose,
  onSkip,
}) {
  // 数値入力（距離系）の確定ハンドラ
  const handleNumericConfirm = () => {
    const n = parseInt(numericInput, 10);
    if (!isNaN(n) && n > 0) {
      onChoose(askingKey, n, `${n}${unit}`);
    }
  };

  // 距離・ピンまで・実距離 共通のクイックボタン
  const renderDistanceChoices = (presets) => (
    <>
      <div className="chat-choices-grid distance">
        {presets.map((p) => (
          <button
            key={p}
            className="chat-choice-btn"
            onClick={() => onChoose(askingKey, p, `${p}${unit}`)}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="chat-choices-numeric">
        <input
          type="number"
          inputMode="numeric"
          className="chat-numeric-input"
          placeholder="数値入力"
          value={numericInput}
          onChange={(e) => setNumericInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNumericConfirm();
          }}
        />
        <button
          className="chat-numeric-confirm"
          onClick={handleNumericConfirm}
          disabled={!numericInput || isNaN(parseInt(numericInput, 10))}
        >
          OK
        </button>
      </div>
      <button className="chat-skip-inline" onClick={onSkip}>
        ⏭ スキップ
      </button>
    </>
  );

  // クラブ選択
  if (askingKey === "clubId") {
    return (
      <div className="chat-choices-grid clubs">
        {clubs.map((c) => (
          <button
            key={c.id}
            className="chat-choice-btn"
            onClick={() => onChoose("clubId", c.id, c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>
    );
  }

  // 距離（通常クラブ）
  if (askingKey === "distance") {
    return renderDistanceChoices([80, 100, 120, 140, 170, 200]);
  }

  // ピンまで距離
  if (askingKey === "wedgeTargetDistance") {
    return renderDistanceChoices([20, 30, 50, 70, 90, 110]);
  }

  // 実距離
  if (askingKey === "wedgeDistance") {
    return renderDistanceChoices([20, 30, 50, 70, 90, 110]);
  }

  // ライ
  if (askingKey === "lie") {
    const opts = [
      { id: "tee", label: "ティー" },
      { id: "fw", label: "FW" },
      { id: "rough", label: "ラフ" },
      { id: "bunker", label: "バンカー" },
      { id: "green", label: "グリーン" },
    ];
    return (
      <>
        <div className="chat-choices-grid">
          {opts.map((o) => (
            <button
              key={o.id}
              className="chat-choice-btn"
              onClick={() => onChoose("lie", o.id, o.label)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button className="chat-skip-inline" onClick={onSkip}>
          ⏭ スキップ
        </button>
      </>
    );
  }

  // 着地（nextLie）
  if (askingKey === "nextLie") {
    const opts = [
      { id: "fw", label: "FW" },
      { id: "rough", label: "ラフ" },
      { id: "bunker", label: "バンカー" },
      { id: "green", label: "グリーン" },
      { id: "pond", label: "池" },
      { id: "ob", label: "OB" },
    ];
    return (
      <>
        <div className="chat-choices-grid">
          {opts.map((o) => (
            <button
              key={o.id}
              className="chat-choice-btn"
              onClick={() => onChoose("nextLie", o.id, o.label)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button className="chat-skip-inline" onClick={onSkip}>
          ⏭ スキップ
        </button>
      </>
    );
  }

  // 方向
  if (askingKey === "direction") {
    const opts = [
      { id: "left", label: "← 左" },
      { id: "straight", label: "↑ 直" },
      { id: "right", label: "→ 右" },
    ];
    return (
      <>
        <div className="chat-choices-grid three-cols">
          {opts.map((o) => (
            <button
              key={o.id}
              className="chat-choice-btn"
              onClick={() => onChoose("direction", o.id, o.label)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button className="chat-skip-inline" onClick={onSkip}>
          ⏭ スキップ
        </button>
      </>
    );
  }

  // 距離感
  if (askingKey === "depth") {
    const opts = [
      { id: "short", label: "ショート" },
      { id: "pin", label: "ピン" },
      { id: "over", label: "オーバー" },
    ];
    return (
      <>
        <div className="chat-choices-grid three-cols">
          {opts.map((o) => (
            <button
              key={o.id}
              className="chat-choice-btn"
              onClick={() => onChoose("depth", o.id, o.label)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button className="chat-skip-inline" onClick={onSkip}>
          ⏭ スキップ
        </button>
      </>
    );
  }

  // 自己評価
  if (askingKey === "selfRating") {
    const opts = [
      { id: "good", label: "◎ ナイス", tone: "good" },
      { id: "ok", label: "○ OK", tone: "ok" },
      { id: "miss", label: "△ ミス", tone: "miss" },
      { id: "bad", label: "× 大ミス", tone: "bad" },
    ];
    return (
      <div className="chat-choices-grid two-cols">
        {opts.map((o) => (
          <button
            key={o.id}
            className={`chat-choice-btn tone-${o.tone}`}
            onClick={() => onChoose("selfRating", o.id, o.label)}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  // 打感
  if (askingKey === "contact") {
    const opts = [
      { id: "nice", label: "ナイス", tone: "good" },
      { id: "duff", label: "ダフリ", tone: "miss" },
      { id: "top", label: "トップ", tone: "miss" },
      { id: "shank", label: "シャンク", tone: "miss" },
    ];
    return (
      <>
        <div className="chat-choices-grid two-cols">
          {opts.map((o) => (
            <button
              key={o.id}
              className={`chat-choice-btn tone-${o.tone}`}
              onClick={() => onChoose("contact", o.id, o.label)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button className="chat-skip-inline" onClick={onSkip}>
          ⏭ スキップ
        </button>
      </>
    );
  }

  // ウェッジ結果（複数選択）
  if (askingKey === "wedgeResults") {
    const opts = [
      { id: "pin", label: "🎯 カップイン" },
      { id: "green", label: "○ 乗" },
      { id: "short", label: "↓ ショート" },
      { id: "over", label: "↑ オーバー" },
      { id: "left", label: "← 左外し" },
      { id: "right", label: "→ 右外し" },
    ];
    const toggleResult = (id) => {
      // グループ排他制御
      const groups = {
        pin: ["pin", "green"],
        green: ["pin", "green"],
        short: ["short", "over"],
        over: ["short", "over"],
        left: ["left", "right"],
        right: ["left", "right"],
      };
      const groupIds = groups[id] || [id];
      const isOn = multiSelect.includes(id);
      const next = multiSelect.filter((x) => !groupIds.includes(x));
      if (!isOn) next.push(id);
      setMultiSelect(next);
    };
    const handleConfirm = () => {
      const labels = multiSelect
        .map((id) => opts.find((o) => o.id === id)?.label)
        .filter(Boolean)
        .join(" + ");
      onChoose("wedgeResults", multiSelect, labels || "なし");
    };
    return (
      <>
        <div className="chat-choices-grid two-cols">
          {opts.map((o) => (
            <button
              key={o.id}
              className={`chat-choice-btn ${
                multiSelect.includes(o.id) ? "selected" : ""
              }`}
              onClick={() => toggleResult(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="chat-multi-actions">
          <button className="chat-skip-inline" onClick={onSkip}>
            ⏭ スキップ
          </button>
          <button
            className="chat-confirm-inline"
            onClick={handleConfirm}
            disabled={multiSelect.length === 0}
          >
            次へ →
          </button>
        </div>
      </>
    );
  }

  return null;
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
  // v2.0: 結果を自己評価と結果に分離
  const [selfRating, setSelfRating] = useState(
    existing ? getShotSelfRating(existing) : null
  );
  const [outcome, setOutcome] = useState(
    existing ? getShotOutcome(existing) : "in_play"
  );
  // v2.1: 打感（任意：nice/duff/top/shank/null）通常クラブ・ウェッジで使用
  const [contact, setContact] = useState(existing?.contact || null);
  // v2.1: 平均距離から除外フラグ（ミス率にはカウント）
  const [excludeFromAvgShot, setExcludeFromAvgShot] = useState(
    !!existing?.excludeFromAvg
  );
  // v2.5: ミスショットフラグ + ミスタイプ（複数選択）
  const [isMiss, setIsMiss] = useState(!!existing?.isMiss);
  const [missTypes, setMissTypes] = useState(
    Array.isArray(existing?.missTypes) ? existing.missTypes : []
  );
  const [memo, setMemo] = useState(existing?.memo || "");

  // v2.1: パター専用 state
  const [puttDistance, setPuttDistance] = useState(
    existing?.puttDistance ?? null
  );
  const [puttLineSlope, setPuttLineSlope] = useState(
    existing?.puttLineSlope || null
  ); // 'up' | 'flat' | 'down'
  const [puttLineCurve, setPuttLineCurve] = useState(
    existing?.puttLineCurve || null
  ); // 'hook' | 'straight' | 'slice'
  const [puttResult, setPuttResult] = useState(
    existing?.puttResult || null
  ); // 'in' | 'ok' | 'short' | 'over' | 'left' | 'right'
  // v2.1: 複数打を一括記録するための打数（編集モードでは1固定、新規追加モードのみ可変）
  const [puttCount, setPuttCount] = useState(1);

  // v2.1: ウェッジ専用 state
  const [wedgeTargetDistance, setWedgeTargetDistance] = useState(
    existing?.wedgeTargetDistance ?? null
  ); // 狙った距離
  const [wedgeDistance, setWedgeDistance] = useState(
    existing?.wedgeDistance ?? null
  ); // 実際に打った距離
  // v2.1: ウェッジ結果は配列（複数選択：状態 + 距離 + 方向）
  // 既存データ（string）との互換のため配列に正規化
  const [wedgeResults, setWedgeResults] = useState(() => {
    const r = existing?.wedgeResult;
    if (Array.isArray(r)) return r;
    if (typeof r === "string" && r) return [r];
    return [];
  }); // (string)[] : ['pin'|'green', 'short'|'over', 'left'|'right'] の最大3要素

  // パター専用UIを表示するかどうか
  const isPutter = useMemo(() => {
    if (!clubId) return false;
    const club = clubs.find((c) => c.id === clubId);
    return club?.category === "putter";
  }, [clubId, clubs]);

  // v2.1: ウェッジ専用UIを表示するかどうか
  const isWedge = useMemo(() => {
    if (!clubId) return false;
    const club = clubs.find((c) => c.id === clubId);
    return club?.category === "wedge";
  }, [clubId, clubs]);

  // 音声入力 state
  const [voiceState, setVoiceState] = useState("idle"); // idle|listening|processing|error
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [highlightFields, setHighlightFields] = useState({}); // {clubId:true, distance:true, ...}
  const [showVoiceHelp, setShowVoiceHelp] = useState(false); // 認識可能ワード一覧の展開
  const recognitionRef = useRef(null);

  // v3: 対話音声入力 state
  const [chatVoiceMode, setChatVoiceMode] = useState(false); // 対話モードのオン/オフ
  const [chatMessages, setChatMessages] = useState([]); // {role: 'ai'|'user', text: string, timestamp: number}[]
  const [chatVoiceState, setChatVoiceState] = useState("idle"); // idle|listening|processing
  // v3.2: 現在AIが聞いている項目キー（ボタン表示用）
  const [currentAskingKey, setCurrentAskingKey] = useState(null);
  // v3.2: 距離・ピンまで距離・実距離 用の手入力モード
  const [chatNumericInput, setChatNumericInput] = useState("");
  // v3.2: 複数選択（ウェッジ結果）用の一時保持
  const [chatMultiSelect, setChatMultiSelect] = useState([]);
  const chatRecognitionRef = useRef(null);
  // v3.1: 重複認識・連投防止用 ref
  const lastTranscriptRef = useRef(""); // 直前に処理した認識結果
  const lastQuestionRef = useRef(""); // 直前のAI質問（連投防止）
  const isProcessingResultRef = useRef(false); // onresult処理中フラグ

  // v3.2: ShotEditor アンマウント時に音声認識を確実に停止（マイクリーク対策）
  useEffect(() => {
    return () => {
      // クイック音声
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      // 対話音声
      if (chatRecognitionRef.current) {
        try {
          chatRecognitionRef.current.onstart = null;
          chatRecognitionRef.current.onerror = null;
          chatRecognitionRef.current.onend = null;
          chatRecognitionRef.current.onresult = null;
          chatRecognitionRef.current.abort();
        } catch {}
        chatRecognitionRef.current = null;
      }
    };
  }, []);

  // 音声認識API対応チェック
  const speechSupported = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  // 認識結果を解析してフィールドにマッピング
  const parseTranscript = (text, currentValues) => {
    const t = text;
    // 半角数字に正規化、句読点除去
    const normalized = t
      .replace(/、/g, " ")
      .replace(/。/g, " ")
      .replace(/[,]/g, " ");
    const updates = {};
    const matched = {};

    // クラブ
    if (!currentValues.clubId) {
      const clubPatterns = [
        { id: "dr", patterns: [/ドライバー/, /\bDR\b/i, /ディーアール/] },
        { id: "3w", patterns: [/3\s*ウッド/, /\b3W\b/i, /スリー\s*ウッド/, /サン\s*ウッド/] },
        { id: "5w", patterns: [/5\s*ウッド/, /\b5W\b/i, /ファイブ\s*ウッド/, /ゴ\s*ウッド/] },
        { id: "u4", patterns: [/4\s*ユーティリ/, /\bU4\b/i, /ユーティリティ.*4/, /4\s*ユーテ/] },
        { id: "u5", patterns: [/5\s*ユーティリ/, /\bU5\b/i, /ユーティリティ.*5/, /5\s*ユーテ/] },
        { id: "5i", patterns: [/5\s*番?\s*アイアン/, /\b5I\b/i, /ファイブ\s*アイアン/, /[ゴご五]\s*ばん/, /[ゴご五]\s*番?\s*[アあ][イい][アあ][ンん]/] },
        { id: "6i", patterns: [/6\s*番?\s*アイアン/, /\b6I\b/i, /シックス\s*アイアン/, /[ロろ六][クく]?\s*ばん/, /[ロろ六][クく]?\s*番?\s*[アあ][イい][アあ][ンん]/] },
        { id: "7i", patterns: [/7\s*番?\s*アイアン/, /\b7I\b/i, /セブン\s*アイアン/, /[ナな][ナな]\s*ばん/, /七\s*番?\s*[アあ][イい][アあ][ンん]/, /[ナな][ナな]\s*番?\s*[アあ][イい][アあ][ンん]/, /[シし][チち]\s*番?\s*[アあ][イい][アあ][ンん]/] },
        { id: "8i", patterns: [/8\s*番?\s*アイアン/, /\b8I\b/i, /エイト\s*アイアン/, /[ハは八][チち]\s*ばん/, /八\s*番?\s*[アあ][イい][アあ][ンん]/, /[ハは八][チち]\s*番?\s*[アあ][イい][アあ][ンん]/] },
        { id: "9i", patterns: [/9\s*番?\s*アイアン/, /\b9I\b/i, /ナイン\s*アイアン/, /[キき九][ュゅ][ウう]?\s*ばん/, /九\s*番?\s*[アあ][イい][アあ][ンん]/, /[キき][ュゅ][ウう]?\s*番?\s*[アあ][イい][アあ][ンん]/, /[クく]\s*番?\s*[アあ][イい][アあ][ンん]/] },
        { id: "pw", patterns: [/ピッチング/, /\bPW\b/i, /ピー\s*ダブリュー/] },
        { id: "aw", patterns: [/アプローチ\s*ウェッジ/, /\bAW\b/i, /エー\s*ダブリュー/, /ギャップ/] },
        { id: "sw", patterns: [/サンド/, /\bSW\b/i, /エス\s*ダブリュー/] },
        { id: "pt", patterns: [/パター/, /\bPT\b/i, /ピーティー/] },
      ];
      for (const cp of clubPatterns) {
        if (cp.patterns.some((p) => p.test(normalized))) {
          // この id のクラブが clubs に存在するか
          const club = clubs.find((c) => c.id === cp.id);
          if (club) {
            updates.clubId = cp.id;
            // 平均距離も自動入力
            if (club.avgDistance != null && !currentValues.distance) {
              updates.distance = club.avgDistance;
            }
            matched.clubId = true;
            break;
          }
        }
      }

      // クラブが特定できなかった場合、度数表記からユーザーのウェッジを動的選択
      // ※ P / PW / ピッチング はこのロジックから除外（固有クラブとして扱う）
      if (!updates.clubId) {
        const degMatch = normalized.match(/(\d{2})\s*[度ど°]/);
        if (degMatch) {
          const targetLoft = parseInt(degMatch[1], 10);
          if (targetLoft >= 40 && targetLoft <= 70) {
            // ユーザーのクラブから度数情報を持つものを抽出
            // 数字クラブ（"48"、"52度" 等）のみ対象、P / PW は除外
            const candidates = clubs
              .map((c) => {
                // P / PW / ピッチング は度数マッピングの対象外
                if (/^(P|PW|ピッチング)$/i.test(c.name)) {
                  return null;
                }
                let loft = null;
                // パターン1: クラブ名が "48" "52" "56" 等の数字のみ
                if (/^\d+$/.test(c.name)) {
                  loft = parseInt(c.name, 10);
                }
                // パターン2: "48度" "52°" "56 度" 等
                if (loft === null) {
                  const m = c.name.match(/(\d{2})\s*[度°]/);
                  if (m) loft = parseInt(m[1], 10);
                }
                return loft !== null && loft >= 40 && loft <= 70
                  ? { club: c, loft }
                  : null;
              })
              .filter((x) => x !== null);

            if (candidates.length > 0) {
              // 一番近いクラブを選択（同距離なら度数が大きい方を優先）
              let best = candidates[0];
              let bestDiff = Math.abs(best.loft - targetLoft);
              for (const cand of candidates) {
                const diff = Math.abs(cand.loft - targetLoft);
                if (
                  diff < bestDiff ||
                  (diff === bestDiff && cand.loft > best.loft)
                ) {
                  best = cand;
                  bestDiff = diff;
                }
              }
              updates.clubId = best.club.id;
              if (
                best.club.avgDistance != null &&
                !currentValues.distance
              ) {
                updates.distance = best.club.avgDistance;
              }
              matched.clubId = true;
            }
          }
        }
      }
    }

    // 距離（数字 + ヤード/メートルなど）
    // v2.1: ウェッジ時は専用フィールド（wedgeTargetDistance/wedgeDistance）を使うので、ここはスキップ
    if (!currentValues.distance && !currentValues.isWedge) {
      // 度数表記（56度、58°など）を距離抽出から除外
      const distSearchText = normalized
        .replace(/\d+\s*度/g, "")
        .replace(/\d+\s*ど(?![くう])/g, "") // 「ど」だが「どく」「どう」の前は除外
        .replace(/\d+\s*°/g, "");
      // 「ドライバーで220ヤード」「100m」などから抽出
      const distMatch = distSearchText.match(
        /(\d{2,3})\s*(?:ヤード|ヤー|ヤ|メートル|メーター|m|y)?/i
      );
      if (distMatch) {
        const num = parseInt(distMatch[1], 10);
        if (num >= 5 && num <= 400) {
          updates.distance = num;
          matched.distance = true;
        }
      }
    }

    // 着地（次のライ）
    if (currentValues.nextLie === "fw") {
      // デフォルト値の場合のみ上書き対象とする
    }
    {
      const lieMap = [
        { id: "fw", patterns: [/フェアウェイ/, /フェアウェー/, /\bFW\b/i] },
        { id: "rough", patterns: [/ラフ/] },
        { id: "bunker", patterns: [/バンカー/, /砂/] },
        { id: "green", patterns: [/グリーン.*オン/, /^オン$/, /グリーン乗/, /(?<![\w])オン(?![\w])/, /乗った/, /グリーン$/, /グリーンに/] },
        { id: "tee", patterns: [/ティー(?!アップ)/] },
        { id: "pond", patterns: [/池/, /ウォーター/, /水/] },
      ];
      // ユーザーが既に nextLie を変更している場合は上書きしない
      // 初期値 "fw" のときだけ上書き対象
      if (currentValues.nextLie === "fw" || !currentValues.nextLieTouched) {
        for (const lm of lieMap) {
          if (lm.patterns.some((p) => p.test(normalized))) {
            updates.nextLie = lm.id;
            matched.nextLie = true;
            break;
          }
        }
      }
    }

    // 方向
    // v2.1: ウェッジ時は wedgeResult で左外し/右外しを管理するのでスキップ
    if (!currentValues.direction && !currentValues.isWedge) {
      if (/フック|左/.test(normalized)) {
        updates.direction = "left";
        matched.direction = true;
      } else if (/スライス|右/.test(normalized)) {
        updates.direction = "right";
        matched.direction = true;
      } else if (/ストレート|真っ?直ぐ|直/.test(normalized)) {
        updates.direction = "straight";
        matched.direction = true;
      }
    }

    // 距離感
    // v2.1: ウェッジ時は wedgeResult で短/長を管理するのでスキップ
    if (!currentValues.depth && !currentValues.isWedge) {
      if (/ショート|手前|短/.test(normalized)) {
        updates.depth = "short";
        matched.depth = true;
      } else if (/ピン(?!.*オン)|ピンそば|ベタピン/.test(normalized)) {
        updates.depth = "pin";
        matched.depth = true;
      } else if (/オーバー|奥|長/.test(normalized)) {
        updates.depth = "over";
        matched.depth = true;
      }
    }

    // 自己評価
    if (!currentValues.selfRating) {
      if (/完璧|ナイス|ベスト|◎/.test(normalized)) {
        updates.selfRating = "good";
        matched.selfRating = true;
      } else if (/まあまあ|普通|そこそこ|△/.test(normalized)) {
        updates.selfRating = "miss";
        matched.selfRating = true;
      } else if (/ミス|ダメ|×|バツ/.test(normalized)) {
        updates.selfRating = "bad";
        matched.selfRating = true;
      } else if (/良い|いい|よかった|○|マル/.test(normalized)) {
        updates.selfRating = "ok";
        matched.selfRating = true;
      }
    }

    // 結果（outcome）
    if (currentValues.outcome === "in_play") {
      if (/オービー|\bOB\b/i.test(normalized)) {
        updates.outcome = "ob";
        matched.outcome = true;
      } else if (/ロスト|紛失/.test(normalized)) {
        updates.outcome = "lost";
        matched.outcome = true;
      } else if (/赤杭|赤/.test(normalized)) {
        updates.outcome = "penalty_red";
        matched.outcome = true;
      } else if (/黄杭|黄/.test(normalized)) {
        updates.outcome = "penalty_yellow";
        matched.outcome = true;
      }
    }

    // v2.1: ウェッジ専用フィールドの音声認識
    if (currentValues.isWedge) {
      // 1. ピンまで距離 + 実距離の抽出
      // 「ピンまで」「ピンまでの距離」キーワードで分岐
      // 度数表記（56度、58°など）を除外
      const wedgeSearchText = normalized
        .replace(/\d+\s*度/g, "")
        .replace(/\d+\s*ど(?![くう])/g, "")
        .replace(/\d+\s*°/g, "");

      // パターン1: 「ピンまで N」を抽出
      const targetMatch = wedgeSearchText.match(
        /ピン\s*まで(?:\s*の?\s*距離)?\s*(\d{2,3})/
      );
      let targetMatchEnd = -1;
      if (targetMatch && !currentValues.wedgeTargetDistance) {
        const n = parseInt(targetMatch[1], 10);
        if (n >= 5 && n <= 200) {
          updates.wedgeTargetDistance = n;
          matched.wedgeTargetDistance = true;
          targetMatchEnd = targetMatch.index + targetMatch[0].length;
        }
      }

      // パターン2: 残りの数字を「実距離」として抽出
      // 「ピンまで N」のマッチ位置以降のテキストから数字を探す
      if (!currentValues.wedgeDistance) {
        const remainingText =
          targetMatchEnd >= 0
            ? wedgeSearchText.substring(targetMatchEnd)
            : wedgeSearchText;
        const allNums = [...remainingText.matchAll(/(\d{2,3})/g)]
          .map((m) => parseInt(m[1], 10))
          .filter((n) => n >= 5 && n <= 200);
        if (allNums.length > 0) {
          // 残りのテキストの最初の数字を実距離として採用
          updates.wedgeDistance = allNums[0];
          matched.wedgeDistance = true;
        }
      }

      // 3. 結果（wedgeResults）の認識
      // 「ピンまで」というキーワードを除去してから判定（pin との誤マッチを防ぐ）
      const resultText = normalized.replace(/ピン\s*まで(?:\s*の?\s*距離)?\s*\d+/g, "");
      const existingResults = Array.isArray(currentValues.wedgeResults)
        ? currentValues.wedgeResults
        : [];
      if (existingResults.length === 0) {
        // グループごとに排他的に判定（同グループは1つだけ選ばれる）
        const newResults = [];

        // 状態グループ: pin / green
        if (/カップイン|カップ\s*イン|ホールイン|入った|沈めた/.test(resultText) ||
            /ピン$|ピンに|ピン寄|ピン側|ピン近|ピンから/.test(resultText) ||
            /\sピン(?:\s|$)/.test(" " + resultText + " ")) {
          newResults.push("pin");
        } else if (/グリーン乗|グリーンに乗|乗った|乗せた|オン$|オンした/.test(resultText)) {
          newResults.push("green");
        }

        // 距離グループ: short / over
        if (/ショート|短かった|届かな/.test(resultText)) {
          newResults.push("short");
        } else if (/オーバー|長かった|大きすぎ/.test(resultText)) {
          newResults.push("over");
        }

        // 方向グループ: left / right
        if (/左外し|左に外|左に逃げ|左にひっか/.test(resultText) ||
            /\s左(?:外し|に|だ|だった)/.test(" " + resultText)) {
          newResults.push("left");
        } else if (/右外し|右に外|右に逃げ|右にすっ/.test(resultText) ||
                   /\s右(?:外し|に|だ|だった)/.test(" " + resultText)) {
          newResults.push("right");
        }

        if (newResults.length > 0) {
          updates.wedgeResults = newResults;
          matched.wedgeResults = true;
        }
      }
    }

    // v2.1: 打感（contact）の認識（通常クラブ・ウェッジ共通）
    if (!currentValues.contact) {
      if (/ナイス\s*ショット|ナイスショ|ナイスon|ナイスです|^ナイス$|ナイスでした|ナイス$/.test(normalized) ||
          /\sナイス(?:\s|$)/.test(" " + normalized + " ")) {
        updates.contact = "nice";
        matched.contact = true;
      } else if (/ダフリ|ダフ|ダフった|ダフって/.test(normalized)) {
        updates.contact = "duff";
        matched.contact = true;
      } else if (/トップ\s*した|トップ$|トップって|^トップ$|トップに/.test(normalized) ||
                 /\sトップ(?:\s|$)/.test(" " + normalized + " ")) {
        updates.contact = "top";
        matched.contact = true;
      } else if (/シャンク/.test(normalized)) {
        updates.contact = "shank";
        matched.contact = true;
      }
    }

    return { updates, matched };
  };

  // v3: 対話音声 - 必要項目の判定
  // v3.1: overrideValues を受け取れるように（state更新直後の値を直接渡せる）
  // 通常クラブ・ウェッジ別に不足項目を返す
  const getMissingFields = (overrides = {}) => {
    const v = {
      clubId: overrides.clubId !== undefined ? overrides.clubId : clubId,
      distance: overrides.distance !== undefined ? overrides.distance : distance,
      lie: overrides.lie !== undefined ? overrides.lie : lie,
      nextLie: overrides.nextLie !== undefined ? overrides.nextLie : nextLie,
      direction: overrides.direction !== undefined ? overrides.direction : direction,
      depth: overrides.depth !== undefined ? overrides.depth : depth,
      selfRating: overrides.selfRating !== undefined ? overrides.selfRating : selfRating,
      contact: overrides.contact !== undefined ? overrides.contact : contact,
      wedgeTargetDistance: overrides.wedgeTargetDistance !== undefined
        ? overrides.wedgeTargetDistance : wedgeTargetDistance,
      wedgeDistance: overrides.wedgeDistance !== undefined
        ? overrides.wedgeDistance : wedgeDistance,
      wedgeResults: overrides.wedgeResults !== undefined
        ? overrides.wedgeResults : wedgeResults,
    };
    const missing = [];
    if (!v.clubId) {
      missing.push({
        key: "clubId",
        question: "🤖 どのクラブで打ちましたか？",
        required: true,
      });
      return missing;
    }

    const club = clubs.find((c) => c.id === v.clubId);
    const isW = club?.category === "wedge";
    const isP = club?.category === "putter";

    if (isP) {
      // パターは対話モードでは扱わない
      return [];
    }

    if (isW) {
      // ウェッジ
      if (v.wedgeTargetDistance == null) {
        missing.push({
          key: "wedgeTargetDistance",
          question: "🤖 ピンまでの距離は？",
          required: false, // v2.5: ウェッジは距離も任意
        });
      }
      if (v.wedgeDistance == null) {
        missing.push({
          key: "wedgeDistance",
          question: "🤖 実際に飛んだ距離は？",
          required: false,
        });
      }
      if (!v.wedgeResults || v.wedgeResults.length === 0) {
        missing.push({
          key: "wedgeResults",
          question:
            "🤖 結果は？（カップイン/グリーン乗/ショート/オーバー/左外し/右外し・スキップ可）",
          required: false,
        });
      }
      if (!v.selfRating) {
        missing.push({
          key: "selfRating",
          question: "🤖 自己評価は？（◎/○/△/×）",
          required: true,
        });
      }
      if (!v.contact) {
        missing.push({
          key: "contact",
          question: "🤖 打感は？（ナイス/ダフリ/トップ/シャンク・スキップ可）",
          required: false,
        });
      }
    } else {
      // 通常クラブ
      if (v.distance == null) {
        missing.push({
          key: "distance",
          question: "🤖 距離は何ヤードでしたか？",
          required: true,
        });
      }
      if (shotNumber !== 1 && !v.lie) {
        missing.push({
          key: "lie",
          question: "🤖 どこから打ちましたか？（フェアウェイ・ラフなど）",
          required: true,
        });
      }
      if (!v.nextLie || v.nextLie === "fw") {
        missing.push({
          key: "nextLie",
          question:
            "🤖 着地はどこ？（フェアウェイ/ラフ/グリーン/バンカー/池）",
          required: true,
        });
      }
      if (!v.selfRating) {
        missing.push({
          key: "selfRating",
          question: "🤖 自己評価は？（◎/○/△/×）",
          required: true,
        });
      }
      if (!v.direction) {
        missing.push({
          key: "direction",
          question: "🤖 方向は？（左/真っ直ぐ/右・スキップ可）",
          required: false,
        });
      }
      if (!v.depth) {
        missing.push({
          key: "depth",
          question: "🤖 距離感は？（ショート/ピン/オーバー・スキップ可）",
          required: false,
        });
      }
      if (!v.contact) {
        missing.push({
          key: "contact",
          question: "🤖 打感は？（ナイス/ダフリ/トップ/シャンク・スキップ可）",
          required: false,
        });
      }
    }
    return missing;
  };

  // v3: チャットメッセージ追加
  const addChatMessage = (role, text) => {
    setChatMessages((prev) => [
      ...prev,
      { role, text, timestamp: Date.now() },
    ]);
  };

  // v3: 対話モード開始
  const startChatVoice = () => {
    if (!speechSupported) {
      setVoiceError("音声入力はこのブラウザで対応していません");
      return;
    }
    // v3.1: refs リセット
    lastTranscriptRef.current = "";
    lastQuestionRef.current = "";
    isProcessingResultRef.current = false;
    setChatVoiceMode(true);
    const initialMsg = "🤖 ショットを教えてください。「7番アイアン150ヤード、フェアウェイから」のように一気に話せます。";
    setChatMessages([
      {
        role: "ai",
        text: initialMsg,
        timestamp: Date.now(),
      },
    ]);
    lastQuestionRef.current = initialMsg;
  };

  // v3: 対話モード終了
  const exitChatVoice = () => {
    // v3.2: 完全クリーンアップ（マイクリーク対策）
    if (chatRecognitionRef.current) {
      try {
        chatRecognitionRef.current.onstart = null;
        chatRecognitionRef.current.onerror = null;
        chatRecognitionRef.current.onend = null;
        chatRecognitionRef.current.onresult = null;
        chatRecognitionRef.current.abort();
      } catch {}
      chatRecognitionRef.current = null;
    }
    // v3.1: refs リセット
    lastTranscriptRef.current = "";
    lastQuestionRef.current = "";
    isProcessingResultRef.current = false;
    setChatVoiceMode(false);
    setChatMessages([]);
    setChatVoiceState("idle");
    setCurrentAskingKey(null);
    setChatNumericInput("");
    setChatMultiSelect([]);
  };

  // v3: 対話モードでの音声録音
  const startChatRecognition = () => {
    if (!speechSupported) return;
    // v3.2: 前回の recognition が残っていたら確実に停止（マイクリーク対策）
    if (chatRecognitionRef.current) {
      try {
        chatRecognitionRef.current.onstart = null;
        chatRecognitionRef.current.onerror = null;
        chatRecognitionRef.current.onend = null;
        chatRecognitionRef.current.onresult = null;
        chatRecognitionRef.current.abort();
      } catch {}
      chatRecognitionRef.current = null;
    }
    // 録音開始時、直前のtranscriptと処理中フラグをリセット
    lastTranscriptRef.current = "";
    isProcessingResultRef.current = false;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setChatVoiceState("listening");
    };
    recognition.onerror = (e) => {
      setChatVoiceState("idle");
      isProcessingResultRef.current = false;
      // no-speech エラー以外は通知
      if (e.error !== "no-speech" && e.error !== "aborted") {
        addChatMessage("ai", "⚠️ 認識できませんでした。もう一度お願いします。");
      }
    };
    recognition.onend = () => {
      setChatVoiceState("idle");
    };
    recognition.onresult = (event) => {
      // v3.1: 同じonresultが複数回発火する問題対策
      // 処理中フラグが立っていたら無視
      if (isProcessingResultRef.current) return;

      // v3.1: 最終結果（isFinal）の最後だけ取得
      let finalTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript = event.results[i][0].transcript;
        }
      }
      // interimResults=false なので通常 isFinal=true だが、念のため最後も取得
      if (!finalTranscript && event.results.length > 0) {
        const last = event.results[event.results.length - 1];
        if (last && last[0]) finalTranscript = last[0].transcript;
      }

      const transcript = (finalTranscript || "").trim();
      if (!transcript) return;

      // v3.1: 同一の transcript は重複として無視
      if (transcript === lastTranscriptRef.current) return;
      lastTranscriptRef.current = transcript;

      // 処理中フラグON
      isProcessingResultRef.current = true;
      setChatVoiceState("processing");
      try {
        recognition.abort();
      } catch {}

      // ユーザーの返答をチャットに追加
      addChatMessage("user", transcript);

      // スキップキーワード検出
      if (/^スキップ$|^とばす$|^飛ばす$|^skip$/i.test(transcript)) {
        addChatMessage("ai", "🤖 スキップしました。次へ進みます。");
        setTimeout(() => {
          askNextOrConfirm();
          isProcessingResultRef.current = false;
        }, 400);
        return;
      }

      // 現在の値を集めて parseTranscript に渡す
      const currentValues = {
        clubId,
        distance,
        nextLie: nextLie === "fw" ? null : nextLie,
        direction,
        depth,
        selfRating,
        outcome,
        isWedge,
        wedgeTargetDistance,
        wedgeDistance,
        wedgeResults,
        contact,
      };
      const { updates } = parseTranscript(transcript, currentValues);

      // フィールドを更新（state setter）
      if ("clubId" in updates) setClubId(updates.clubId);
      if ("distance" in updates) setDistance(updates.distance);
      if ("lie" in updates) setLie(updates.lie);
      if ("nextLie" in updates) setNextLie(updates.nextLie);
      if ("direction" in updates) setDirection(updates.direction);
      if ("depth" in updates) setDepth(updates.depth);
      if ("selfRating" in updates) setSelfRating(updates.selfRating);
      if ("outcome" in updates) setOutcome(updates.outcome);
      if ("wedgeTargetDistance" in updates)
        setWedgeTargetDistance(updates.wedgeTargetDistance);
      if ("wedgeDistance" in updates)
        setWedgeDistance(updates.wedgeDistance);
      if ("wedgeResults" in updates) setWedgeResults(updates.wedgeResults);
      if ("contact" in updates) setContact(updates.contact);

      // v3.1: state更新を待たず、override で直接判定するための値を構築
      const newValues = { ...currentValues, ...updates };

      // 解析結果を表示してから次の質問へ
      const updatedKeys = Object.keys(updates);
      if (updatedKeys.length > 0) {
        const summary = updatedKeys
          .map((k) => {
            const v = updates[k];
            if (k === "clubId") {
              const c = clubs.find((cc) => cc.id === v);
              return `クラブ:${c?.name || v}`;
            }
            if (k === "distance") return `距離:${v}${unit}`;
            if (k === "lie") return `ライ:${LIE_LABELS[v] || v}`;
            if (k === "nextLie") return `着地:${LIE_LABELS[v] || v}`;
            if (k === "direction") return `方向:${DIR_LABELS[v] || v}`;
            if (k === "depth") return `距離感:${DEPTH_LABELS[v] || v}`;
            if (k === "selfRating")
              return `評価:${SELF_RATING_LABELS[v] || v}`;
            if (k === "outcome") return `結果:${OUTCOME_LABELS[v] || v}`;
            if (k === "contact") return `打感:${CONTACT_LABELS[v] || v}`;
            if (k === "wedgeTargetDistance") return `ピンまで:${v}${unit}`;
            if (k === "wedgeDistance") return `実距離:${v}${unit}`;
            if (k === "wedgeResults")
              return `結果:${(Array.isArray(v) ? v : []).join("+")}`;
            return `${k}:${v}`;
          })
          .join(" / ");
        addChatMessage("ai", `🤖 認識: ${summary}`);
      } else {
        addChatMessage("ai", "🤖 認識できませんでした。もう一度お願いします。");
      }

      // v3.1: 次の質問は newValues（更新後）で判定
      setTimeout(() => {
        askNextOrConfirm(newValues);
        isProcessingResultRef.current = false;
      }, 600);
    };

    chatRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setChatVoiceState("idle");
      isProcessingResultRef.current = false;
    }
  };

  // v3: 次の質問または完了確認
  // v3.1: overrideValues 受け取り + 連投防止
  // v3.2: currentAskingKey も更新（ボタン表示用）
  const askNextOrConfirm = (overrides = {}) => {
    const missing = getMissingFields(overrides);
    const requiredMissing = missing.filter((m) => m.required);
    let nextQuestion;
    let nextKey = null;
    if (requiredMissing.length > 0) {
      nextQuestion = requiredMissing[0].question;
      nextKey = requiredMissing[0].key;
    } else if (missing.length > 0) {
      nextQuestion = missing[0].question;
      nextKey = missing[0].key;
    } else {
      nextQuestion = "🤖 全項目の入力が完了しました。下の「保存」ボタンで保存してください。";
      nextKey = null;
    }
    // 同じ質問を直前に出していたら追加しない（連投防止）
    if (lastQuestionRef.current === nextQuestion) {
      // 質問は追加しないが、askingKey は更新（ボタン表示の整合性のため）
      setCurrentAskingKey(nextKey);
      return;
    }
    lastQuestionRef.current = nextQuestion;
    addChatMessage("ai", nextQuestion);
    setCurrentAskingKey(nextKey);
    // 数字入力 / 複数選択の一時状態をクリア
    setChatNumericInput("");
    setChatMultiSelect([]);
  };

  // v3: 対話で次の質問をトリガー（録音停止後）
  const stopChatRecognition = () => {
    if (chatRecognitionRef.current) {
      try {
        chatRecognitionRef.current.stop();
      } catch {}
    }
  };

  // v3.2: ボタンタップで値をセット（チャットに「○○を選択」表示 + 次の質問へ）
  const applyChatChoice = (key, value, displayLabel) => {
    // 現在の値を取得（override 用）
    const currentValues = {
      clubId,
      distance,
      lie,
      nextLie: nextLie === "fw" ? null : nextLie,
      direction,
      depth,
      selfRating,
      contact,
      wedgeTargetDistance,
      wedgeDistance,
      wedgeResults,
    };
    const newValues = { ...currentValues };

    // state を更新
    if (key === "clubId") {
      setClubId(value);
      newValues.clubId = value;
    } else if (key === "distance") {
      setDistance(value);
      newValues.distance = value;
    } else if (key === "lie") {
      setLie(value);
      newValues.lie = value;
    } else if (key === "nextLie") {
      setNextLie(value);
      newValues.nextLie = value;
    } else if (key === "direction") {
      setDirection(value);
      newValues.direction = value;
    } else if (key === "depth") {
      setDepth(value);
      newValues.depth = value;
    } else if (key === "selfRating") {
      setSelfRating(value);
      newValues.selfRating = value;
      // ミスチェックが連動：×なら isMiss を true、それ以外は false
      if (value === "bad") {
        setIsMiss(true);
      } else {
        setIsMiss(false);
      }
    } else if (key === "contact") {
      setContact(value);
      newValues.contact = value;
    } else if (key === "wedgeTargetDistance") {
      setWedgeTargetDistance(value);
      newValues.wedgeTargetDistance = value;
    } else if (key === "wedgeDistance") {
      setWedgeDistance(value);
      newValues.wedgeDistance = value;
    } else if (key === "wedgeResults") {
      setWedgeResults(value);
      newValues.wedgeResults = value;
    }

    // チャットに「○○を選択」と表示
    addChatMessage("user", `${displayLabel}を選択`);

    // 次の質問へ
    setCurrentAskingKey(null);
    setChatNumericInput("");
    setChatMultiSelect([]);
    setTimeout(() => askNextOrConfirm(newValues), 300);
  };

  // v3.2: スキップボタン（チャット内）
  const handleChatSkip = () => {
    addChatMessage("user", "（スキップ）");
    setCurrentAskingKey(null);
    setChatNumericInput("");
    setChatMultiSelect([]);
    setTimeout(() => {
      // 現在の質問項目を「スキップ」扱いにするため、override で空オブジェクトを渡す
      // → 次の missing 項目に進む
      // ただし、required な項目はスキップできない設計なので、required の場合は同じ質問になる
      // 連投防止 ref をクリアして強制的に次へ
      lastQuestionRef.current = "";
      askNextOrConfirm();
    }, 300);
  };

  const startVoiceInput = () => {
    if (!speechSupported) {
      setVoiceError("音声入力はこのブラウザで対応していません");
      setVoiceState("error");
      setTimeout(() => setVoiceState("idle"), 3000);
      return;
    }
    // v3.2: 前回の recognition が残っていたら確実に停止（マイクリーク対策）
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState("listening");
      setVoiceTranscript("");
      setVoiceError("");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      setVoiceState("processing");

      // マイクを即座に解放（onendが発火するが、念のため明示的にabort）
      try {
        recognition.abort();
      } catch {}

      // 現在の値を集めて parse に渡す
      const currentValues = {
        clubId,
        distance,
        nextLie,
        direction,
        depth,
        selfRating,
        outcome,
        // v2.1: ウェッジ専用フィールド
        isWedge,
        wedgeTargetDistance,
        wedgeDistance,
        wedgeResults, // 配列で渡す
        // v2.1: 打感（通常クラブ・ウェッジ共通）
        contact,
      };
      const { updates, matched } = parseTranscript(transcript, currentValues);

      // フィールドを更新
      if ("clubId" in updates) setClubId(updates.clubId);
      if ("distance" in updates) setDistance(updates.distance);
      if ("nextLie" in updates) setNextLie(updates.nextLie);
      if ("direction" in updates) setDirection(updates.direction);
      if ("depth" in updates) setDepth(updates.depth);
      if ("selfRating" in updates) setSelfRating(updates.selfRating);
      if ("outcome" in updates) setOutcome(updates.outcome);
      // v2.1: ウェッジ専用
      if ("wedgeTargetDistance" in updates)
        setWedgeTargetDistance(updates.wedgeTargetDistance);
      if ("wedgeDistance" in updates)
        setWedgeDistance(updates.wedgeDistance);
      if ("wedgeResults" in updates) setWedgeResults(updates.wedgeResults);
      // v2.1: 打感
      if ("contact" in updates) setContact(updates.contact);

      // ハイライト表示（2秒）
      setHighlightFields(matched);
      setTimeout(() => setHighlightFields({}), 2500);

      // マッチした項目数を確認
      const matchedCount = Object.keys(matched).length;
      if (matchedCount === 0) {
        setVoiceError(
          "認識できませんでした。もう一度お試しください"
        );
        setVoiceState("error");
        setTimeout(() => {
          setVoiceState("idle");
          setVoiceError("");
        }, 3000);
      } else {
        setVoiceState("idle");
        // 認識テキストはしばらく表示しておく
        setTimeout(() => setVoiceTranscript(""), 4000);
      }
    };

    recognition.onerror = (event) => {
      let msg = "音声認識エラー";
      if (event.error === "not-allowed") {
        msg = "マイクの使用が許可されていません";
      } else if (event.error === "no-speech") {
        msg = "音声が検出されませんでした";
      } else if (event.error === "network") {
        msg = "ネットワークエラー";
      }
      // マイク解放
      try {
        recognition.abort();
      } catch {}
      setVoiceError(msg);
      setVoiceState("error");
      setTimeout(() => {
        setVoiceState("idle");
        setVoiceError("");
      }, 3000);
    };

    recognition.onend = () => {
      // 確実にrefから外してGC対象にする（マイクリソース解放）
      recognitionRef.current = null;
      // listening状態のままなら（無音停止など）idleに戻す
      setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setVoiceError("音声認識を開始できませんでした");
      setVoiceState("error");
      recognitionRef.current = null;
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      try {
        // abort()はstop()より強制的にマイクを解放する
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setVoiceState("idle");
  };

  // モーダルが閉じられる時 (アンマウント) に音声認識を確実に停止
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

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

  // v2.5: 自己評価必須（パター除く）
  // v2.5: 必須項目
  // - パター: クラブ + パット結果
  // - ウェッジ: クラブ + 自己評価のみ（距離・結果は任意）
  // - 通常: クラブ + 結果(outcome) + ライ + 自己評価
  const canSave = isPutter
    ? clubId && puttResult
    : isWedge
    ? clubId && selfRating
    : clubId && outcome && lie && selfRating;

  // v3: 対話音声モード - チャット式UI
  if (chatVoiceMode) {
    const handleChatSave = () => {
      // 既存の保存ロジックと同じデータを構築して送信
      if (!clubId) return;
      let saveData;
      if (isWedge) {
        saveData = {
          clubId,
          wedgeTargetDistance,
          wedgeDistance,
          wedgeResult: wedgeResults,
          selfRating, // v2.4: ウェッジにも自己評価
          contact,
          memo,
          outcome: "in_play",
          excludeFromAvg: excludeFromAvgShot,
          isMiss, // v2.5
          missTypes, // v2.5
        };
      } else {
        saveData = {
          clubId,
          distance,
          lie,
          nextLie,
          direction,
          depth,
          selfRating,
          outcome,
          contact,
          excludeFromAvg: excludeFromAvgShot,
          isMiss, // v2.5
          missTypes, // v2.5
          memo,
        };
      }
      onSave(saveData);
    };

    const missing = getMissingFields();
    const requiredMissing = missing.filter((m) => m.required);
    const canSaveChat = requiredMissing.length === 0 && clubId;

    return (
      <div className="sheet-backdrop" onClick={exitChatVoice}>
        <div
          className="sheet shot-sheet chat-sheet"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sheet-handle" />
          <div className="shot-sheet-head">
            <div className="shot-sheet-title">
              <span className="shot-sheet-num">#{shotNumber}</span>
              <span className="shot-sheet-label">💬 対話音声入力</span>
            </div>
            <button className="icon-btn" onClick={exitChatVoice}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-stream">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`chat-bubble chat-${m.role}`}
              >
                <div className="chat-bubble-text">{m.text}</div>
              </div>
            ))}
            {chatVoiceState === "listening" && (
              <div className="chat-bubble chat-user listening">
                <div className="chat-bubble-text">🎙 録音中…</div>
              </div>
            )}
            {chatVoiceState === "processing" && (
              <div className="chat-bubble chat-ai">
                <div className="chat-bubble-text">考え中…</div>
              </div>
            )}

            {/* v3.2: 質問項目別の選択肢ボタン（右側、ユーザー側に表示） */}
            {chatVoiceState === "idle" && currentAskingKey && (
              <div className="chat-choices">
                <ChatChoiceButtons
                  askingKey={currentAskingKey}
                  clubs={clubs}
                  unit={unit}
                  numericInput={chatNumericInput}
                  setNumericInput={setChatNumericInput}
                  multiSelect={chatMultiSelect}
                  setMultiSelect={setChatMultiSelect}
                  onChoose={applyChatChoice}
                  onSkip={handleChatSkip}
                />
              </div>
            )}
          </div>

          {/* 解析済みの状態を視覚的にも表示 */}
          <div className="chat-status">
            {clubId && (
              <span className="chat-chip">
                ✅ {clubs.find((c) => c.id === clubId)?.name || "—"}
              </span>
            )}
            {!isWedge && distance != null && (
              <span className="chat-chip">
                ✅ {distance}{unit}
              </span>
            )}
            {!isWedge && lie && (
              <span className="chat-chip">
                ✅ {LIE_LABELS[lie] || lie}
              </span>
            )}
            {!isWedge && nextLie && nextLie !== "fw" && (
              <span className="chat-chip">
                ✅ →{LIE_LABELS[nextLie] || nextLie}
              </span>
            )}
            {!isWedge && direction && (
              <span className="chat-chip">
                ✅ {DIR_LABELS[direction]}
              </span>
            )}
            {!isWedge && depth && (
              <span className="chat-chip">
                ✅ {DEPTH_LABELS[depth]}
              </span>
            )}
            {!isWedge && selfRating && (
              <span className="chat-chip">
                ✅ {SELF_RATING_LABELS[selfRating]}
              </span>
            )}
            {isWedge && wedgeTargetDistance != null && (
              <span className="chat-chip">
                ✅ ピンまで{wedgeTargetDistance}
              </span>
            )}
            {isWedge && wedgeDistance != null && (
              <span className="chat-chip">
                ✅ 実{wedgeDistance}
              </span>
            )}
            {isWedge && wedgeResults.length > 0 && (
              <span className="chat-chip">
                ✅ {wedgeResults.join("+")}
              </span>
            )}
            {contact && (
              <span className="chat-chip">
                ✅ {CONTACT_LABELS[contact]}
              </span>
            )}
          </div>

          <div className="chat-actions">
            <button
              className={`chat-record-btn ${chatVoiceState}`}
              onClick={
                chatVoiceState === "listening"
                  ? stopChatRecognition
                  : startChatRecognition
              }
              disabled={chatVoiceState === "processing"}
            >
              {chatVoiceState === "listening"
                ? "■ 停止"
                : chatVoiceState === "processing"
                ? "認識中…"
                : "🎤 話す"}
            </button>
            <button
              className="chat-skip-btn"
              onClick={() => {
                addChatMessage("user", "（スキップ）");
                setTimeout(() => askNextOrConfirm(), 300);
              }}
              disabled={chatVoiceState !== "idle"}
            >
              ⏭ スキップ
            </button>
            <button
              className="chat-save-btn"
              onClick={handleChatSave}
              disabled={!canSaveChat || chatVoiceState !== "idle"}
            >
              ✓ 保存
            </button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* v2.1/v3: 音声入力 - クイック + 対話 */}
        {speechSupported && (
          <div className="voice-input-section">
            <div className="voice-btn-group">
              <button
                className={`voice-input-btn quick ${voiceState}`}
                onClick={
                  voiceState === "listening" ? stopVoiceInput : startVoiceInput
                }
                disabled={voiceState === "processing"}
              >
                <span className="voice-icon">
                  {voiceState === "listening" ? "■" : "🎤"}
                </span>
                <span className="voice-label">
                  {voiceState === "listening"
                    ? "録音中…"
                    : voiceState === "processing"
                    ? "認識中…"
                    : voiceState === "error"
                    ? voiceError
                    : "クイック音声"}
                </span>
              </button>
              <button
                className="voice-input-btn chat"
                onClick={startChatVoice}
                disabled={voiceState !== "idle"}
              >
                <span className="voice-icon">💬</span>
                <span className="voice-label">対話音声</span>
              </button>
            </div>
            {voiceTranscript && (
              <div className="voice-transcript">「{voiceTranscript}」</div>
            )}
            <div className="voice-hint">
              <b>クイック</b>：一気に話す（例：「ドライバー 220ヤード フェアウェイ」）
              <br />
              <b>対話</b>：足りない項目をAIが順次質問（初心者向け）
            </div>
            <button
              className="voice-help-toggle"
              onClick={() => setShowVoiceHelp(!showVoiceHelp)}
            >
              {showVoiceHelp ? "▲ 認識ワード一覧を閉じる" : "▼ 認識できる言葉を見る"}
            </button>
            {showVoiceHelp && (
              <div className="voice-help-list">
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">🏌 クラブ</div>
                  <div className="voice-help-words">
                    ドライバー / 3ウッド / 5ウッド / 4ユーティリティ / 5ユーティリティ
                    / 5アイアン / 6アイアン / 7アイアン / 8アイアン / 9アイアン
                    / ゴ番アイアン / ロク番アイアン / ナナ番アイアン / ハチ番アイアン / キュウ番アイアン
                    / ピッチング / アプローチウェッジ / サンド / パター
                    <br />
                    <strong>ウェッジは度数でもOK：</strong>
                    <br />
                    「48度」「52度」「54度」「56度」「60度」など
                    <br />
                    →お持ちのクラブから一番近い度数を自動選択
                    <br />
                    （ピッチング/Pは度数判定の対象外、固有のクラブ）
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">📏 距離</div>
                  <div className="voice-help-words">
                    数字（5〜400）・「ヤード」「メートル」付けても可
                    <br />
                    例：「220」「220ヤード」「100m」
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">🌱 ライ（着地）</div>
                  <div className="voice-help-words">
                    フェアウェイ / ラフ / バンカー / グリーン / オン / ティー
                    / 池 / ウォーター
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">↔ 方向</div>
                  <div className="voice-help-words">
                    左 / フック / 右 / スライス / ストレート / 真っ直ぐ
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">📐 距離感</div>
                  <div className="voice-help-words">
                    ショート / 短い / 手前 / ピン / ピンそば / ベタピン /
                    オーバー / 奥 / 長い
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">⭐ 自己評価</div>
                  <div className="voice-help-words">
                    完璧 / ナイス / ベスト → ◎
                    <br />
                    良い / いい / よかった → ○
                    <br />
                    まあまあ / 普通 / そこそこ → △
                    <br />
                    ミス / ダメ / バツ → ×
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">🚩 結果</div>
                  <div className="voice-help-words">
                    OB / オービー / ロスト / 紛失 / 赤杭 / 黄杭
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">💥 打感</div>
                  <div className="voice-help-words">
                    ナイス / ダフリ / ダフった / トップ / シャンク
                  </div>
                </div>
                <div className="voice-help-cat">
                  <div className="voice-help-cat-name">🎯 ウェッジ専用</div>
                  <div className="voice-help-words">
                    距離: 「<b>ピンまで</b> 50ヤード 55ヤード」<br />
                    （「ピンまで」キーワード = ピンまで距離、もう一つの数字 = 実距離）<br />
                    結果: カップイン / 乗った / ショート / オーバー / 左外し / 右外し
                  </div>
                </div>
                <div className="voice-help-note">
                  ⚠️ 既に入力されている項目は音声入力で上書きされません。
                  音声で埋めたい項目はクリアしてからご利用ください。
                </div>
              </div>
            )}
          </div>
        )}

        <div className={`editor-section ${highlightFields.clubId ? "highlight" : ""}`}>
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

        {/* v2.5: ミスショットチェックボックス（パター以外） */}
        {!isPutter && (
          <div className="editor-section miss-section">
            <label className="miss-checkbox">
              <input
                type="checkbox"
                checked={isMiss}
                onChange={(e) => {
                  setIsMiss(e.target.checked);
                  if (e.target.checked) {
                    // v2.5: ミスチェックで自己評価を「×」に自動設定（手動変更可）
                    setSelfRating("bad");
                  } else {
                    // チェック外したらミスタイプ・自己評価もクリア
                    setMissTypes([]);
                    setSelfRating(null);
                  }
                }}
              />
              <span className="miss-checkbox-icon">⚠️</span>
              <span className="miss-checkbox-label">
                ミスショット
                {isMiss && (
                  <span className="miss-checkbox-sub">
                    （飛距離・方向は任意）
                  </span>
                )}
              </span>
            </label>
            {isMiss && (
              <div className="miss-types">
                <div className="miss-types-label">
                  どんなミス？（複数選択可）
                </div>
                <div className="miss-types-grid">
                  {MISS_TYPES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`chip miss-type-chip ${
                        missTypes.includes(m.id) ? "on" : ""
                      }`}
                      onClick={() => {
                        if (missTypes.includes(m.id)) {
                          setMissTypes(missTypes.filter((x) => x !== m.id));
                        } else {
                          setMissTypes([...missTypes, m.id]);
                        }
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* v2.5: 自己評価（必須） - ミスショット直下、パター以外 */}
        {!isPutter && (
          <div className={`editor-section rating-section ${highlightFields.selfRating ? "highlight" : ""}`}>
            <div className="editor-label">
              自己評価 <span className="required-badge">必須</span>
            </div>
            <div className="result-row">
              {SELF_RATINGS.map((r) => (
                <button
                  key={r.id}
                  className={`result-btn tone-${r.tone} ${
                    selfRating === r.id ? "on" : ""
                  }`}
                  onClick={() =>
                    setSelfRating(selfRating === r.id ? null : r.id)
                  }
                  title={r.desc}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isPutter && !isWedge && (
          <div className={isMiss ? "miss-disabled-wrapper" : ""}>
          <>
        <div className={`editor-section ${highlightFields.distance ? "highlight" : ""}`}>
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

        <div className={`editor-section two-col ${highlightFields.nextLie ? "highlight" : ""}`}>
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

        <div className={`editor-section ${(highlightFields.direction || highlightFields.depth) ? "highlight" : ""}`}>
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
          <div className="editor-label">打感（任意）</div>
          <div className="contact-row">
            {[
              { id: "nice", label: "ナイス", tone: "good" },
              { id: "duff", label: "ダフリ", tone: "miss" },
              { id: "top", label: "トップ", tone: "miss" },
              { id: "shank", label: "シャンク", tone: "miss" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip contact-chip tone-${c.tone} ${
                  contact === c.id ? "on" : ""
                }`}
                onClick={() => setContact(contact === c.id ? null : c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`editor-section ${highlightFields.outcome ? "highlight" : ""}`}>
          <div className="editor-label">結果</div>
          <div className="outcome-row">
            {OUTCOMES.map((o) => (
              <button
                key={o.id}
                className={`outcome-btn tone-${o.tone} ${
                  outcome === o.id ? "on" : ""
                }`}
                onClick={() => setOutcome(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="editor-section">
          <label className="replay-toggle">
            <input
              type="checkbox"
              checked={excludeFromAvgShot}
              onChange={(e) => setExcludeFromAvgShot(e.target.checked)}
            />
            <span className="replay-toggle-text">
              <b>平均距離から除外</b>（ミス率にはカウント / 打ち直し・想定外ミスなど）
            </span>
          </label>
        </div>
          </>
          </div>
        )}

        {/* v2.1: パター専用UI */}
        {isPutter && (
          <>
            <div className="editor-section">
              <div className="editor-label">距離（メートル）</div>
              <div className="distance-display">
                <input
                  type="number"
                  inputMode="decimal"
                  className="distance-input-large"
                  value={puttDistance ?? ""}
                  placeholder="3"
                  step="0.5"
                  onChange={(e) => {
                    const v = e.target.value;
                    setPuttDistance(v === "" ? null : Number(v));
                  }}
                />
                <span className="distance-unit-large">m</span>
              </div>
              <div className="putt-distance-shortcuts">
                {[0.5, 1, 2, 3, 5, 7, 10].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`putt-shortcut ${
                      puttDistance === m ? "on" : ""
                    }`}
                    onClick={() => setPuttDistance(m)}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {mode !== "edit" && (
              <div className="editor-section">
                <div className="editor-label">
                  打数{puttCount > 1 && (
                    <span className="putt-count-note">
                      （{puttCount}打分まとめて記録）
                    </span>
                  )}
                </div>
                <div className="putt-count-row">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`putt-count-btn ${
                        puttCount === n ? "on" : ""
                      }`}
                      onClick={() => setPuttCount(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {puttCount > 1 && (
                  <div className="putt-count-hint">
                    入力した距離・ライン読みは1打目として記録、
                    残り{puttCount - 1}打はカップインまでの簡易記録になります
                  </div>
                )}
              </div>
            )}

            <div className="editor-section">
              <div className="editor-label">ライン読み（傾斜）</div>
              <div className="chip-row">
                {[
                  { id: "up", label: "↗ 登り" },
                  { id: "flat", label: "→ 平ら" },
                  { id: "down", label: "↘ 下り" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${puttLineSlope === s.id ? "on" : ""}`}
                    onClick={() =>
                      setPuttLineSlope(
                        puttLineSlope === s.id ? null : s.id
                      )
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-label">ライン読み（曲がり）</div>
              <div className="chip-row">
                {[
                  { id: "hook", label: "↙ フック" },
                  { id: "straight", label: "↑ 直" },
                  { id: "slice", label: "↘ スライス" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip ${puttLineCurve === s.id ? "on" : ""}`}
                    onClick={() =>
                      setPuttLineCurve(
                        puttLineCurve === s.id ? null : s.id
                      )
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-label">結果</div>
              <div className="putt-result-grid">
                {[
                  { id: "in", label: "🎯 IN", tone: "good" },
                  { id: "ok", label: "OK圏内", tone: "ok" },
                  { id: "short", label: "↓ ショート", tone: "miss" },
                  { id: "over", label: "↑ オーバー", tone: "miss" },
                  { id: "left", label: "← 左外し", tone: "miss" },
                  { id: "right", label: "→ 右外し", tone: "miss" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`chip putt-result-chip tone-${r.tone} ${
                      puttResult === r.id ? "on" : ""
                    }`}
                    onClick={() => setPuttResult(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* v2.1: ウェッジ専用UI（コントロールショット扱い、フルとは区別しない） */}
        {isWedge && (
          <>
            <div className="editor-section">
              <div className="editor-label">ピンまで（{unit}）</div>
              <div className="distance-display">
                <input
                  type="number"
                  inputMode="numeric"
                  className="distance-input-large"
                  value={wedgeTargetDistance ?? ""}
                  placeholder="50"
                  onChange={(e) => {
                    const v = e.target.value;
                    setWedgeTargetDistance(v === "" ? null : Number(v));
                  }}
                />
                <span className="distance-unit-large">{unit}</span>
              </div>
              <div className="putt-distance-shortcuts">
                {[20, 30, 50, 70, 90, 110].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`putt-shortcut ${
                      wedgeTargetDistance === d ? "on" : ""
                    }`}
                    onClick={() => setWedgeTargetDistance(d)}
                  >
                    {d}{unit}
                  </button>
                ))}
              </div>
              <div className="wedge-adjust-row">
                {[-5, -1, 1, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    className={`wedge-adjust-btn ${
                      delta < 0 ? "minus" : "plus"
                    }`}
                    onClick={() => {
                      const cur = wedgeTargetDistance ?? 0;
                      const next = Math.max(0, cur + delta);
                      setWedgeTargetDistance(next);
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-label">
                実距離（{unit}）
                {wedgeTargetDistance != null &&
                  wedgeDistance != null && (
                    <span
                      className={`wedge-diff-badge ${
                        wedgeDistance > wedgeTargetDistance
                          ? "long"
                          : wedgeDistance < wedgeTargetDistance
                          ? "short"
                          : "perfect"
                      }`}
                    >
                      {wedgeDistance === wedgeTargetDistance
                        ? "ぴったり"
                        : wedgeDistance > wedgeTargetDistance
                        ? `+${wedgeDistance - wedgeTargetDistance}${unit} 長め`
                        : `${wedgeDistance - wedgeTargetDistance}${unit} 短め`}
                    </span>
                  )}
              </div>
              <div className="distance-display">
                <input
                  type="number"
                  inputMode="numeric"
                  className="distance-input-large"
                  value={wedgeDistance ?? ""}
                  placeholder="50"
                  onChange={(e) => {
                    const v = e.target.value;
                    setWedgeDistance(v === "" ? null : Number(v));
                  }}
                />
                <span className="distance-unit-large">{unit}</span>
              </div>
              <div className="putt-distance-shortcuts">
                {[20, 30, 50, 70, 90, 110].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`putt-shortcut ${
                      wedgeDistance === d ? "on" : ""
                    }`}
                    onClick={() => setWedgeDistance(d)}
                  >
                    {d}{unit}
                  </button>
                ))}
              </div>
              <div className="wedge-adjust-row">
                {[-5, -1, 1, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    className={`wedge-adjust-btn ${
                      delta < 0 ? "minus" : "plus"
                    }`}
                    onClick={() => {
                      const cur = wedgeDistance ?? 0;
                      const next = Math.max(0, cur + delta);
                      setWedgeDistance(next);
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-label">結果（任意・複数選択可）</div>
              <div className="wedge-result-groups">
                {[
                  {
                    label: "状態",
                    options: [
                      { id: "pin", label: "🎯 カップイン", tone: "good" },
                      { id: "green", label: "○ グリーン乗", tone: "ok" },
                    ],
                  },
                  {
                    label: "距離",
                    options: [
                      { id: "short", label: "↓ ショート", tone: "miss" },
                      { id: "over", label: "↑ オーバー", tone: "miss" },
                    ],
                  },
                  {
                    label: "方向",
                    options: [
                      { id: "left", label: "← 左外し", tone: "miss" },
                      { id: "right", label: "→ 右外し", tone: "miss" },
                    ],
                  },
                ].map((group) => (
                  <div key={group.label} className="wedge-result-group">
                    <div className="wedge-result-group-label">
                      {group.label}
                    </div>
                    <div className="wedge-result-group-chips">
                      {group.options.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`chip putt-result-chip tone-${r.tone} ${
                            wedgeResults.includes(r.id) ? "on" : ""
                          }`}
                          onClick={() => {
                            // 同じグループの他の選択肢を排除しつつトグル
                            const groupIds = group.options.map((o) => o.id);
                            const isOn = wedgeResults.includes(r.id);
                            const next = wedgeResults.filter(
                              (id) => !groupIds.includes(id)
                            );
                            if (!isOn) next.push(r.id);
                            setWedgeResults(next);
                          }}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <div className="editor-label">打感（任意）</div>
              <div className="contact-row">
                {[
                  { id: "nice", label: "ナイス", tone: "good" },
                  { id: "duff", label: "ダフリ", tone: "miss" },
                  { id: "top", label: "トップ", tone: "miss" },
                  { id: "shank", label: "シャンク", tone: "miss" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip contact-chip tone-${c.tone} ${
                      contact === c.id ? "on" : ""
                    }`}
                    onClick={() => setContact(contact === c.id ? null : c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <label className="replay-toggle">
                <input
                  type="checkbox"
                  checked={excludeFromAvgShot}
                  onChange={(e) => setExcludeFromAvgShot(e.target.checked)}
                />
                <span className="replay-toggle-text">
                  <b>平均距離から除外</b>（ミス率にはカウント / 想定外ミスなど）
                </span>
              </label>
            </div>
          </>
        )}

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
                onSave(
                  isPutter
                    ? {
                        // パター専用フィールド
                        clubId,
                        puttDistance,
                        puttLineSlope,
                        puttLineCurve,
                        puttResult,
                        memo,
                        // outcome は in_play 固定（パターはin/outをputtResultで管理）
                        outcome: "in_play",
                        // v2.1: 複数打を一括記録するための打数（編集モードでは無視）
                        _puttCount: mode === "edit" ? 1 : puttCount,
                      }
                    : isWedge
                    ? {
                        // ウェッジ専用フィールド（コントロールショット扱い）
                        clubId,
                        wedgeTargetDistance,
                        wedgeDistance,
                        wedgeResult: wedgeResults, // v2.1: 配列として保存
                        selfRating, // v2.4: ウェッジにも自己評価
                        contact,
                        memo,
                        // outcome は in_play 固定（ウェッジは結果をwedgeResultで管理）
                        outcome: "in_play",
                        excludeFromAvg: excludeFromAvgShot,
                        isMiss, // v2.5
                        missTypes, // v2.5
                      }
                    : {
                        clubId,
                        distance,
                        lie,
                        nextLie,
                        direction,
                        depth,
                        selfRating,
                        outcome,
                        contact,
                        excludeFromAvg: excludeFromAvgShot,
                        isMiss, // v2.5
                        missTypes, // v2.5
                        memo,
                      }
                )
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
function AnalyticsView({ state, setState, onBack }) {
  const [tab, setTab] = useState("shot");
  // v2.1: クラブ詳細画面の選択クラブID（null = リスト表示）
  const [selectedClubId, setSelectedClubId] = useState(null);
  // v2.1: ラウンド詳細画面の選択ラウンドID（null = リスト表示）
  const [selectedRoundId, setSelectedRoundId] = useState(null);
  const stats = useMemo(() => computeClubStats(state), [state]);
  // 分析対象はウェッジとパター以外のクラブのみ
  // （アプローチ・パターは性質が異なるため、距離分析・ミス率分析の対象外）
  const usedClubs = stats.filter(
    (s) =>
      s.n > 0 &&
      s.club.category !== "putter" &&
      s.club.category !== "wedge"
  );
  // v2.1: ウェッジ専用統計
  const wedgeStats = useMemo(() => computeWedgeStats(state), [state]);
  const usedWedges = wedgeStats.filter((s) => s.n > 0);

  // v2.1: クラブ詳細画面表示時はそれを返す
  if (selectedClubId) {
    return (
      <ClubDetailView
        clubId={selectedClubId}
        state={state}
        onBack={() => setSelectedClubId(null)}
      />
    );
  }
  // v2.1: ラウンド詳細画面表示時はそれを返す
  if (selectedRoundId) {
    return (
      <RoundDetailView
        roundId={selectedRoundId}
        state={state}
        setState={setState}
        onBack={() => setSelectedRoundId(null)}
      />
    );
  }

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
          className={`atab ${tab === "shot" ? "on" : ""}`}
          onClick={() => setTab("shot")}
        >
          ショット
        </button>
        <button
          className={`atab ${tab === "wedge" ? "on" : ""}`}
          onClick={() => setTab("wedge")}
        >
          ウェッジ
        </button>
        <button
          className={`atab ${tab === "putter" ? "on" : ""}`}
          onClick={() => setTab("putter")}
        >
          パター
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

      {tab === "shot" && (
        <ShotTab
          usedClubs={usedClubs}
          unit={state.unit}
          state={state}
          onClubClick={(clubId) => setSelectedClubId(clubId)}
        />
      )}
      {tab === "wedge" && (
        <WedgeTab usedWedges={usedWedges} unit={state.unit} />
      )}
      {tab === "putter" && <PutterTab state={state} />}
      {tab === "tendency" && (
        <TendencyTab usedClubs={usedClubs} state={state} />
      )}
      {tab === "rounds" && (
        <RoundsTab
          state={state}
          onRoundClick={(roundId) => setSelectedRoundId(roundId)}
        />
      )}
    </div>
  );
}

// v2.1: ウェッジ専用タブ
function WedgeTab({ usedWedges, unit }) {
  if (usedWedges.length === 0) return <EmptyAnalytics />;
  return (
    <>
      <div className="distance-hint">
        💡 <b>ウェッジ分析</b>＝コントロールショット（寄せ）の傾向
        <br />
        <b>カップイン率</b>＝カップインに収まった割合 / <b>ミス率</b>＝ショート・オーバー・左右外し・想定外ミスの割合
        <br />
        <b>距離精度</b>＝ピンまで距離と実距離の差（絶対誤差で精度、符号付き平均で長め/短めのクセ）
        <br />
        <span className="distance-hint-note">
          ※ ウェッジは全てコントロールショット扱い。フルショットも記録するならアイアンとして登録してください
        </span>
      </div>
      <div className="section">
        <div className="section-head">
          <div className="section-title">クラブ別の傾向</div>
        </div>
        <div className="wedge-cards">
          {usedWedges.map((s) => {
            const total = s.n;
            const rc = s.resultCounts;
            const signedSign =
              s.signedMeanDiff > 0
                ? "+"
                : s.signedMeanDiff < 0
                ? ""
                : "±";
            const signedTrend =
              s.signedMeanDiff > 0
                ? "長め"
                : s.signedMeanDiff < 0
                ? "短め"
                : "ぴったり";
            return (
              <div key={s.club.id} className="wedge-card">
                <div className="wedge-card-head">
                  <div className="wedge-card-club">{s.club.name}</div>
                  <div className="wedge-card-n">
                    <span className="club-list-n-num">{s.n}</span>
                    <span className="club-list-n-unit">shots</span>
                  </div>
                </div>
                <div className="wedge-card-stats">
                  <div className="wedge-stat">
                    <div className="wedge-stat-label">平均距離</div>
                    <div className="wedge-stat-value">
                      {s.trimmed != null ? `${s.trimmed} ${unit}` : "—"}
                    </div>
                  </div>
                  <div className="wedge-stat">
                    <div className="wedge-stat-label">レンジ</div>
                    <div className="wedge-stat-value">
                      {s.min != null ? `${s.min}–${s.max}` : "—"}
                    </div>
                  </div>
                  <div className="wedge-stat">
                    <div className="wedge-stat-label">カップイン率</div>
                    <div className="wedge-stat-value good">
                      {total ? `${Math.round((rc.pin / total) * 100)}%` : "—"}
                    </div>
                  </div>
                  <div className="wedge-stat">
                    <div className="wedge-stat-label">ミス率</div>
                    <div
                      className={`wedge-stat-value ${
                        s.missRate > 40 ? "miss" : ""
                      }`}
                    >
                      {s.missRate != null ? `${s.missRate}%` : "—"}
                    </div>
                  </div>
                  {/* v2.1: ピンまで vs 実距離の精度（データがある時のみ表示） */}
                  {s.diffN > 0 && (
                    <>
                      <div className="wedge-stat">
                        <div className="wedge-stat-label">
                          絶対誤差 ({s.diffN}回)
                        </div>
                        <div className="wedge-stat-value">
                          ±{s.absMeanDiff} {unit}
                        </div>
                      </div>
                      <div className="wedge-stat">
                        <div className="wedge-stat-label">クセ</div>
                        <div
                          className={`wedge-stat-value ${
                            s.signedMeanDiff > 0
                              ? "miss"
                              : s.signedMeanDiff < 0
                              ? "miss"
                              : "good"
                          }`}
                        >
                          {signedSign}
                          {s.signedMeanDiff} {unit}
                          <span className="wedge-stat-sub">{signedTrend}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="wedge-result-bar">
                  {[
                    { key: "pin", color: "good", label: "IN" },
                    { key: "green", color: "ok", label: "乗" },
                    { key: "short", color: "miss", label: "短" },
                    { key: "over", color: "miss", label: "長" },
                    { key: "left", color: "miss", label: "左" },
                    { key: "right", color: "miss", label: "右" },
                  ].map((r) => {
                    const count = rc[r.key];
                    if (count === 0) return null;
                    const pct = (count / total) * 100;
                    return (
                      <div
                        key={r.key}
                        className={`wedge-result-segment tone-${r.color}`}
                        style={{ width: `${pct}%` }}
                        title={`${r.label}: ${count}回 (${Math.round(pct)}%)`}
                      >
                        {pct > 12 ? `${r.label}${count}` : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// v2.1: ショットタブ（クラブリスト形式、タップで詳細画面へ）
function ShotTab({ usedClubs, unit, state, onClubClick }) {
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
      <div className="distance-hint">
        💡 <b>クラブをタップ</b>すると、そのクラブの詳細分析画面に移動します
        <br />
        <b>信頼距離</b>＝外れ値を除外した「当たればこの距離」／
        <b>ミス率</b>＝△・✕評価 or ペナ（OB等）の割合
        <br />
        <span className="distance-hint-note">
          ※ ウェッジ・パターは別タブ
        </span>
      </div>
      <div className="club-list">
        {usedClubs.map((s) => {
          const pctTrim = s.trimmed
            ? ((s.trimmed || 0) / maxDist) * 100
            : 0;
          return (
            <button
              key={s.club.id}
              type="button"
              className="club-list-item"
              onClick={() => onClubClick(s.club.id)}
            >
              <div className="club-list-head">
                <div className="club-list-name">{s.club.name}</div>
                <div className="club-list-n">
                  <span className="club-list-n-num">{s.n}</span>
                  <span className="club-list-n-unit">shots</span>
                </div>
              </div>
              <div className="club-list-stats">
                <div className="club-list-stat">
                  <div className="club-list-stat-label">信頼距離</div>
                  <div className="club-list-stat-value">
                    {s.trimmed != null ? (
                      <>
                        <span className="num-large">{s.trimmed}</span>
                        <span className="num-unit">{unit}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="club-list-stat">
                  <div className="club-list-stat-label">レンジ</div>
                  <div className="club-list-stat-value small">
                    {s.min != null ? `${s.min}–${s.max}` : "—"}
                  </div>
                </div>
                <div className="club-list-stat">
                  <div className="club-list-stat-label">ミス率</div>
                  <div
                    className={`club-list-stat-value ${
                      s.missRate > 40 ? "miss" : ""
                    }`}
                  >
                    {s.missRate != null ? `${s.missRate}%` : "—"}
                  </div>
                </div>
              </div>
              {s.trimmed != null && (
                <div className="club-list-bar">
                  <div
                    className="club-list-bar-fill"
                    style={{ width: `${pctTrim}%` }}
                  />
                </div>
              )}
              <div className="club-list-arrow">›</div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// v2.1: パター専用タブ
function PutterTab({ state }) {
  const stats = useMemo(() => computePutterStats(state), [state]);
  if (!stats || stats.n === 0) return <EmptyAnalytics />;

  const PUTT_RESULT_LABELS = {
    in: { label: "🎯 IN", tone: "good" },
    ok: { label: "OK圏内", tone: "ok" },
    short: { label: "ショート", tone: "miss" },
    over: { label: "オーバー", tone: "miss" },
    left: { label: "左外し", tone: "miss" },
    right: { label: "右外し", tone: "miss" },
  };

  return (
    <>
      <div className="distance-hint">
        💡 <b>パター分析</b>＝距離別・傾斜別・曲がり別の成功率
        <br />
        <b>IN率</b>＝カップインした割合 / <b>OK率</b>＝カップインまたはOK圏内の割合
        <br />
        <span className="distance-hint-note">
          ※ 距離・傾斜・曲がりが入力されているパターのみ集計
        </span>
      </div>

      {/* サマリ */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">サマリ</div>
        </div>
        <div className="club-detail-stats">
          <div className="cd-stat">
            <div className="cd-stat-label">総パット数</div>
            <div className="cd-stat-value">
              <span className="num-large">{stats.n}</span>
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">18H平均</div>
            <div className="cd-stat-value">
              {stats.avgPuttsPer18 != null ? (
                <>
                  <span className="num-large">{stats.avgPuttsPer18}</span>
                  <span className="num-unit">パット</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">IN率（全体）</div>
            <div className="cd-stat-value good">
              {stats.n
                ? Math.round((stats.resultCounts.in / stats.n) * 100) + "%"
                : "—"}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">分析対象ラウンド</div>
            <div className="cd-stat-value small">
              {stats.totalRounds}回
            </div>
          </div>
        </div>
      </div>

      {/* 距離別の成功率 */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">距離別の成功率</div>
        </div>
        <div className="putter-bucket-list">
          {stats.byDistance.map((b) => (
            <div key={b.id} className="putter-bucket-row">
              <div className="putter-bucket-label">{b.label}</div>
              <div className="putter-bucket-n">{b.n}回</div>
              <div className="putter-bucket-bars">
                {b.n > 0 && (
                  <>
                    <div className="putter-bucket-bar-track">
                      <div
                        className="putter-bucket-bar-fill in"
                        style={{ width: `${b.inRate}%` }}
                      />
                    </div>
                    <div className="putter-bucket-rate">
                      IN {b.inRate}% / OK {b.okRate}%
                    </div>
                  </>
                )}
                {b.n === 0 && <div className="putter-bucket-empty">—</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 傾斜別 */}
      {stats.bySlope.some((s) => s.n > 0) && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">傾斜別の成功率</div>
          </div>
          <div className="putter-bucket-list">
            {stats.bySlope.map((s) => (
              <div key={s.id} className="putter-bucket-row">
                <div className="putter-bucket-label">{s.label}</div>
                <div className="putter-bucket-n">{s.n}回</div>
                <div className="putter-bucket-bars">
                  {s.n > 0 ? (
                    <>
                      <div className="putter-bucket-bar-track">
                        <div
                          className="putter-bucket-bar-fill in"
                          style={{ width: `${s.inRate}%` }}
                        />
                      </div>
                      <div className="putter-bucket-rate">
                        IN {s.inRate}% / OK {s.okRate}%
                      </div>
                    </>
                  ) : (
                    <div className="putter-bucket-empty">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 曲がり別 */}
      {stats.byCurve.some((s) => s.n > 0) && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">曲がり別の成功率</div>
          </div>
          <div className="putter-bucket-list">
            {stats.byCurve.map((s) => (
              <div key={s.id} className="putter-bucket-row">
                <div className="putter-bucket-label">{s.label}</div>
                <div className="putter-bucket-n">{s.n}回</div>
                <div className="putter-bucket-bars">
                  {s.n > 0 ? (
                    <>
                      <div className="putter-bucket-bar-track">
                        <div
                          className="putter-bucket-bar-fill in"
                          style={{ width: `${s.inRate}%` }}
                        />
                      </div>
                      <div className="putter-bucket-rate">
                        IN {s.inRate}% / OK {s.okRate}%
                      </div>
                    </>
                  ) : (
                    <div className="putter-bucket-empty">—</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 結果分布（全体） */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">結果の分布</div>
        </div>
        <div className="cd-outcome-list">
          {Object.entries(PUTT_RESULT_LABELS).map(([key, info]) => {
            const count = stats.resultCounts[key] || 0;
            if (count === 0) return null;
            const pct = Math.round((count / stats.n) * 100);
            return (
              <div key={key} className="cd-outcome-row">
                <div className={`cd-outcome-label tone-${info.tone}`}>
                  {info.label}
                </div>
                <div className="cd-outcome-bar">
                  <div
                    className={`cd-outcome-fill tone-${info.tone}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="cd-outcome-count">
                  {count}回 ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: "40px" }} />
    </>
  );
}

// v2.1: クラブ詳細画面
function ClubDetailView({ clubId, state, onBack }) {
  const club = state.clubs.find((c) => c.id === clubId);
  const stats = useMemo(() => computeClubStats(state), [state]);
  const clubStats = stats.find((s) => s.club.id === clubId);

  // このクラブのショット集合（ラウンド・ホール情報込み）
  const shotEntries = useMemo(() => {
    const entries = [];
    state.rounds.forEach((r) => {
      r.holes.forEach((h) => {
        h.shots.forEach((s, shotIdx) => {
          if (s.clubId === clubId) {
            entries.push({
              shot: s,
              round: r,
              hole: h,
              shotIdx,
            });
          }
        });
      });
    });
    return entries;
  }, [state, clubId]);

  // メモ付きショットを新しい順に並べる
  const memoEntries = useMemo(() => {
    return shotEntries
      .filter((e) => e.shot.memo && e.shot.memo.trim() !== "")
      .sort((a, b) => {
        const da = new Date(a.round.date).getTime();
        const db = new Date(b.round.date).getTime();
        return db - da;
      });
  }, [shotEntries]);

  // 結果分布
  const outcomeCounts = useMemo(() => {
    const counts = {};
    shotEntries.forEach((e) => {
      const oc = getShotOutcome(e.shot);
      counts[oc] = (counts[oc] || 0) + 1;
    });
    return counts;
  }, [shotEntries]);

  // 自己評価分布
  const ratingCounts = useMemo(() => {
    const counts = {};
    shotEntries.forEach((e) => {
      const r = getShotSelfRating(e.shot);
      if (r) counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [shotEntries]);

  // v2.1: 打感分布
  const contactCounts = useMemo(() => {
    const counts = {};
    shotEntries.forEach((e) => {
      const c = e.shot.contact;
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [shotEntries]);
  const contactN = Object.values(contactCounts).reduce((a, b) => a + b, 0);

  if (!club || !clubStats) {
    return (
      <div className="screen">
        <header className="topbar">
          <button className="icon-btn" onClick={onBack}>
            <ChevronLeft size={22} />
          </button>
          <div className="topbar-title">
            <div className="topbar-course">クラブ詳細</div>
          </div>
          <div className="icon-btn placeholder" />
        </header>
        <EmptyAnalytics />
      </div>
    );
  }

  const unit = state.unit;
  const totalDir = clubStats.dir.n;
  const totalDepth = clubStats.depth.n;

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <div className="topbar-title">
          <div className="topbar-course">{club.name}</div>
          <div className="topbar-meta">{clubStats.n} ショット</div>
        </div>
        <div className="icon-btn placeholder" />
      </header>

      {/* 基本統計 */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">基本統計</div>
        </div>
        <div className="club-detail-stats">
          <div className="cd-stat">
            <div className="cd-stat-label">信頼距離</div>
            <div className="cd-stat-value">
              {clubStats.trimmed != null ? (
                <>
                  <span className="num-large">{clubStats.trimmed}</span>
                  <span className="num-unit">{unit}</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">中央値</div>
            <div className="cd-stat-value">
              {clubStats.median != null
                ? `${clubStats.median} ${unit}`
                : "—"}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">レンジ</div>
            <div className="cd-stat-value small">
              {clubStats.min != null
                ? `${clubStats.min} – ${clubStats.max}`
                : "—"}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">ミス率</div>
            <div
              className={`cd-stat-value ${
                clubStats.missRate > 40 ? "miss" : ""
              }`}
            >
              {clubStats.missRate != null
                ? `${clubStats.missRate}%`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ライ別距離 */}
      {(clubStats.fwAvg != null || clubStats.roughAvg != null) && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">ライ別距離</div>
          </div>
          <div className="cd-lie-row">
            <div className="cd-lie-card">
              <div className="cd-lie-label">フェアウェイ</div>
              <div className="cd-lie-num">
                {clubStats.fwAvg != null
                  ? `${clubStats.fwAvg} ${unit}`
                  : "—"}
              </div>
            </div>
            <div className="cd-lie-card rough">
              <div className="cd-lie-label">ラフ</div>
              <div className="cd-lie-num">
                {clubStats.roughAvg != null
                  ? `${clubStats.roughAvg} ${unit}`
                  : "—"}
              </div>
            </div>
            {clubStats.fwAvg != null && clubStats.roughAvg != null && (
              <div className="cd-lie-diff">
                差 {Math.abs(clubStats.fwAvg - clubStats.roughAvg)} {unit}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 方向の傾向 */}
      {totalDir > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">方向の傾向（{totalDir}回）</div>
          </div>
          <div className="cd-segment-bar">
            {[
              { key: "left", label: "左", color: "miss" },
              { key: "straight", label: "直", color: "good" },
              { key: "right", label: "右", color: "miss" },
            ].map((seg) => {
              const count = clubStats.dir[seg.key] || 0;
              if (count === 0) return null;
              const pct = (count / totalDir) * 100;
              return (
                <div
                  key={seg.key}
                  className={`cd-segment tone-${seg.color}`}
                  style={{ width: `${pct}%` }}
                  title={`${seg.label}: ${count}回 (${Math.round(pct)}%)`}
                >
                  {pct > 12 ? `${seg.label} ${Math.round(pct)}%` : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 距離感の傾向 */}
      {totalDepth > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">
              距離感の傾向（{totalDepth}回）
            </div>
          </div>
          <div className="cd-segment-bar">
            {[
              { key: "short", label: "短", color: "miss" },
              { key: "pin", label: "ピン", color: "good" },
              { key: "long", label: "長", color: "miss" },
            ].map((seg) => {
              const count = clubStats.depth[seg.key] || 0;
              if (count === 0) return null;
              const pct = (count / totalDepth) * 100;
              return (
                <div
                  key={seg.key}
                  className={`cd-segment tone-${seg.color}`}
                  style={{ width: `${pct}%` }}
                  title={`${seg.label}: ${count}回 (${Math.round(pct)}%)`}
                >
                  {pct > 12 ? `${seg.label} ${Math.round(pct)}%` : ""}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 結果分布 */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">結果の分布</div>
        </div>
        <div className="cd-outcome-list">
          {Object.entries(outcomeCounts).map(([oc, count]) => {
            const pct = Math.round((count / clubStats.n) * 100);
            const tone =
              oc === "in_play" ? "good" : oc === "ob" ? "miss" : "miss";
            return (
              <div key={oc} className="cd-outcome-row">
                <div className={`cd-outcome-label tone-${tone}`}>
                  {OUTCOME_LABELS[oc] || oc}
                </div>
                <div className="cd-outcome-bar">
                  <div
                    className={`cd-outcome-fill tone-${tone}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="cd-outcome-count">
                  {count}回 ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 自己評価 */}
      {Object.keys(ratingCounts).length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">自己評価の分布</div>
          </div>
          <div className="cd-outcome-list">
            {["good", "ok", "miss", "bad"].map((r) => {
              const count = ratingCounts[r] || 0;
              if (count === 0) return null;
              const pct = Math.round((count / clubStats.n) * 100);
              const tone =
                r === "good"
                  ? "good"
                  : r === "ok"
                  ? "ok"
                  : "miss";
              return (
                <div key={r} className="cd-outcome-row">
                  <div className={`cd-outcome-label tone-${tone}`}>
                    {SELF_RATING_LABELS[r]}
                  </div>
                  <div className="cd-outcome-bar">
                    <div
                      className={`cd-outcome-fill tone-${tone}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="cd-outcome-count">
                    {count}回 ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* v2.1: 打感の分布 */}
      {contactN > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">打感の分布（{contactN}回）</div>
          </div>
          <div className="cd-outcome-list">
            {["nice", "duff", "top", "shank"].map((c) => {
              const count = contactCounts[c] || 0;
              if (count === 0) return null;
              const pct = Math.round((count / contactN) * 100);
              const tone = c === "nice" ? "good" : "miss";
              return (
                <div key={c} className="cd-outcome-row">
                  <div className={`cd-outcome-label tone-${tone}`}>
                    {CONTACT_LABELS[c]}
                  </div>
                  <div className="cd-outcome-bar">
                    <div
                      className={`cd-outcome-fill tone-${tone}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="cd-outcome-count">
                    {count}回 ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* メモ一覧 */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">
            メモ {memoEntries.length > 0 && `(${memoEntries.length})`}
          </div>
        </div>
        {memoEntries.length === 0 ? (
          <div className="cd-memo-empty">
            このクラブにはメモ付きショットがまだありません
          </div>
        ) : (
          <div className="cd-memo-list">
            {memoEntries.map((e, i) => {
              const dist = e.shot.distance != null
                ? `${e.shot.distance}${unit}`
                : "—";
              const sr = getShotSelfRating(e.shot);
              const oc = getShotOutcome(e.shot);
              return (
                <div key={i} className="cd-memo-item">
                  <div className="cd-memo-meta">
                    <span className="cd-memo-date">
                      {e.round.date}
                    </span>
                    <span className="cd-memo-loc">
                      {e.round.venue} · {e.hole.number}H
                    </span>
                    <span className="cd-memo-dist">{dist}</span>
                    {sr && (
                      <span className={`cd-memo-rating tone-${sr === "good" ? "good" : sr === "ok" ? "ok" : "miss"}`}>
                        {SELF_RATING_LABELS[sr]}
                      </span>
                    )}
                    {e.shot.contact && (
                      <span className={`cd-memo-rating tone-${e.shot.contact === "nice" ? "good" : "miss"}`}>
                        {CONTACT_LABELS[e.shot.contact]}
                      </span>
                    )}
                    {oc && oc !== "in_play" && (
                      <span className="cd-memo-outcome tone-miss">
                        {OUTCOME_LABELS[oc]}
                      </span>
                    )}
                  </div>
                  <div className="cd-memo-text">{e.shot.memo}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: "40px" }} />
    </div>
  );
}

// v2.1: ラウンド詳細画面
function RoundDetailView({ roundId, state, setState, onBack }) {
  const round = state.rounds.find((r) => r.id === roundId);
  const [editingRound, setEditingRound] = useState(false);
  const kpi = useMemo(
    () => (round ? computeRoundKPI(round, state.clubs) : null),
    [round, state.clubs]
  );

  // v2.1: ラウンド編集の保存処理
  const handleUpdateRound = (updates) => {
    if (!round || !setState) return;
    setState((s) => ({
      ...s,
      rounds: s.rounds.map((r) => {
        if (r.id !== round.id) return r;
        // v2.5: コース変更時は holes の par/distance を新しいデータに更新（shots/score は維持）
        let newHoles = r.holes;
        if (updates.combinedHoles && Array.isArray(updates.combinedHoles)) {
          newHoles = r.holes.map((h, i) => {
            const newPar = updates.combinedHoles[i]?.par;
            const newDist = updates.combinedHoles[i]?.distance;
            return {
              ...h,
              ...(newPar != null ? { par: newPar } : {}),
              distance:
                newDist != null ? newDist : h.distance,
            };
          });
        }
        return {
          ...r,
          date: updates.date,
          venue: updates.venue,
          frontCourse: updates.frontCourse,
          backCourse: updates.backCourse,
          course: updates.course,
          tee: updates.tee,
          weather: updates.weather,
          holes: newHoles,
        };
      }),
    }));
    setEditingRound(false);
  };

  // このラウンドで使ったクラブ別の集計
  const clubStatsForRound = useMemo(() => {
    if (!round) return [];
    const byClub = {};
    state.clubs.forEach((c) => {
      byClub[c.id] = { club: c, shots: [], distances: [] };
    });
    round.holes.forEach((h) => {
      h.shots.forEach((s) => {
        if (!byClub[s.clubId]) return;
        byClub[s.clubId].shots.push(s);
        // 通常クラブの距離（パター・ウェッジは別フィールドなので除く）
        if (s.distance != null && !isShotOffPlay(s) && !isExcludedFromAvg(s)) {
          byClub[s.clubId].distances.push(s.distance);
        }
        // ウェッジの実距離
        if (s.wedgeDistance != null && !isExcludedFromAvg(s)) {
          byClub[s.clubId].distances.push(s.wedgeDistance);
        }
      });
    });
    return state.clubs
      .map((c) => {
        const data = byClub[c.id];
        const dists = data.distances;
        // v2.4: ミススコア（自己評価ベース）
        const missScore = data.shots.reduce(
          (sum, s) => sum + getMissWeight(s),
          0
        );
        return {
          club: c,
          n: data.shots.length,
          avg: dists.length
            ? Math.round(dists.reduce((a, b) => a + b, 0) / dists.length)
            : null,
          min: dists.length ? Math.min(...dists) : null,
          max: dists.length ? Math.max(...dists) : null,
          missCount: missScore, // 数値（小数あり）
          missRate: data.shots.length
            ? Math.round((missScore / data.shots.length) * 100)
            : 0,
        };
      })
      .filter((s) => s.n > 0);
  }, [round, state.clubs]);

  if (!round || !kpi) {
    return (
      <div className="screen">
        <header className="topbar">
          <button className="icon-btn" onClick={onBack}>
            <ChevronLeft size={22} />
          </button>
          <div className="topbar-title">
            <div className="topbar-course">ラウンド詳細</div>
          </div>
          <div className="icon-btn placeholder" />
        </header>
        <EmptyAnalytics />
      </div>
    );
  }

  const unit = state.unit;
  const totalPar = round.holes.reduce((sum, h) => sum + (h.par || 0), 0);
  const overUnder =
    kpi.totalScore > 0 && totalPar > 0 ? kpi.totalScore - totalPar : null;

  return (
    <div className="screen">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack}>
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="topbar-title topbar-title-tappable"
          onClick={() => setEditingRound(true)}
          title="タップして編集"
        >
          <div className="topbar-course">
            {round.course || "—"}
            <span className="topbar-edit-icon">✏️</span>
          </div>
          <div className="topbar-meta">
            {fmtDate(round.date)} · {round.venue || ""}
          </div>
        </button>
        <div className="icon-btn placeholder" />
      </header>

      {editingRound && (
        <NewRoundSheet
          courseMasters={state.courseMasters || []}
          existing={round}
          onCancel={() => setEditingRound(false)}
          onStart={handleUpdateRound}
        />
      )}

      {/* スコア概要 */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">スコア</div>
        </div>
        <div className="club-detail-stats">
          <div className="cd-stat">
            <div className="cd-stat-label">合計スコア</div>
            <div className="cd-stat-value">
              <span className="num-large">
                {kpi.totalScore > 0 ? kpi.totalScore : "—"}
              </span>
              {overUnder != null && (
                <span className="num-unit">
                  {overUnder > 0 ? `+${overUnder}` : overUnder === 0 ? "±0" : overUnder}
                </span>
              )}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">パット数</div>
            <div className="cd-stat-value">
              <span className="num-large">{kpi.putts}</span>
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">パーオン</div>
            <div className="cd-stat-value small">
              {kpi.parOn} / {kpi.parOnEligible}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">FWキープ</div>
            <div className="cd-stat-value small">
              {kpi.fwKeep} / {kpi.fwEligible}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">OB</div>
            <div className={`cd-stat-value ${kpi.obs > 0 ? "miss" : ""}`}>
              {kpi.obs}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-label">3パット以上</div>
            <div className={`cd-stat-value ${kpi.threePuttHoles > 0 ? "miss" : ""}`}>
              {kpi.threePuttHoles || 0}
            </div>
          </div>
        </div>
      </div>

      {/* このラウンドで使ったクラブ別集計 */}
      {clubStatsForRound.length > 0 && (
        <div className="section">
          <div className="section-head">
            <div className="section-title">クラブ別（このラウンド）</div>
          </div>
          <div className="round-club-list">
            {clubStatsForRound.map((s) => (
              <div key={s.club.id} className="round-club-row">
                <div className="round-club-name">{s.club.name}</div>
                <div className="round-club-n">{s.n}回</div>
                <div className="round-club-avg">
                  {s.avg != null ? (
                    <>
                      <span className="round-club-avg-num">{s.avg}</span>
                      <span className="round-club-avg-unit">{unit}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="round-club-range">
                  {s.min != null ? `${s.min}–${s.max}` : "—"}
                </div>
                <div className={`round-club-miss ${s.missRate > 40 ? "high" : ""}`}>
                  {s.missCount > 0
                    ? `ミス${s.missCount.toFixed(s.missCount % 1 === 0 ? 0 : 1)}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ホール別 */}
      <div className="section">
        <div className="section-head">
          <div className="section-title">ホール別</div>
        </div>
        <div className="round-hole-list">
          {round.holes.map((h) => {
            const score = getHoleScore(h);
            const putts = getHolePutts(h, state.clubs);
            const par = h.par || 0;
            const diff = score > 0 && par > 0 ? score - par : null;
            const tone =
              diff == null
                ? ""
                : diff <= -1
                ? "good"
                : diff === 0
                ? "ok"
                : diff === 1
                ? "ok"
                : "miss";
            const diffLabel =
              diff == null
                ? "—"
                : diff === -2
                ? "イーグル"
                : diff === -1
                ? "バーディ"
                : diff === 0
                ? "パー"
                : diff === 1
                ? "ボギー"
                : diff === 2
                ? "ダブル"
                : `+${diff}`;
            return (
              <div key={h.number} className="round-hole-row">
                <div className="round-hole-num">H{h.number}</div>
                <div className="round-hole-par">Par{par || "—"}</div>
                <div className={`round-hole-score tone-${tone}`}>
                  {score > 0 ? score : "—"}
                </div>
                <div className={`round-hole-diff tone-${tone}`}>
                  {diffLabel}
                </div>
                <div className="round-hole-putts">
                  {putts > 0 ? `${putts}P` : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: "40px" }} />
    </div>
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

  // クラブごとにメッセージを集約（同じクラブで複数の傾向を1行にまとめる）
  const insightsByClub = new Map(); // key: club.id, value: { club, msgs: [{msg, tone}] }
  const addInsight = (clubObj, msg, tone) => {
    if (!insightsByClub.has(clubObj.id)) {
      insightsByClub.set(clubObj.id, { club: clubObj, msgs: [] });
    }
    insightsByClub.get(clubObj.id).msgs.push({ msg, tone });
  };

  dirClubs.forEach((s) => {
    const sr = (s.dir.straight / s.dir.n) * 100;
    const lr = (s.dir.left / s.dir.n) * 100;
    const rr = (s.dir.right / s.dir.n) * 100;
    if (s.dir.n >= 3) {
      if (rr >= 50)
        addInsight(s.club, `右に外しやすい（${Math.round(rr)}%）`, "warn");
      else if (lr >= 50)
        addInsight(s.club, `左に外しやすい（${Math.round(lr)}%）`, "warn");
      else if (sr >= 60)
        addInsight(s.club, `安定 ストレート率${Math.round(sr)}%`, "good");
    }
  });
  depthClubs.forEach((s) => {
    const sh = (s.depth.short / s.depth.n) * 100;
    const ov = (s.depth.over / s.depth.n) * 100;
    if (s.depth.n >= 3) {
      if (sh >= 50)
        addInsight(s.club, `ショートしがち（${Math.round(sh)}%）`, "warn");
      else if (ov >= 50)
        addInsight(s.club, `オーバーしがち（${Math.round(ov)}%）`, "warn");
    }
  });

  // クラブごとに1エントリにまとめる
  // 全部 good なら good、警告が混ざってたら warn
  const insights = Array.from(insightsByClub.values()).map((entry) => {
    const hasWarn = entry.msgs.some((m) => m.tone === "warn");
    return {
      club: entry.club.name,
      msgs: entry.msgs.map((m) => m.msg),
      tone: hasWarn ? "warn" : "good",
    };
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
                <span className="insight-msg">{it.msgs.join(" / ")}</span>
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

function RoundsTab({ state, onRoundClick }) {
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
            <button
              key={r.id}
              type="button"
              className="round-kpi-card"
              onClick={() => onRoundClick && onRoundClick(r.id)}
            >
              <div className="round-kpi-head">
                <div className="round-kpi-date">{fmtDate(r.date)}</div>
                <div className="round-kpi-course">{r.course || "—"}</div>
                <div className="round-kpi-arrow">›</div>
              </div>
              <div className="round-kpi-grid">
                <div className="rkpi">
                  <div className="rkpi-label">スコア</div>
                  <div className="rkpi-num">
                    {r.totalScore > 0 ? r.totalScore : r.totalShots || "-"}
                  </div>
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
            </button>
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
      clubs: sortClubs([
        ...s.clubs,
        {
          id: uid(),
          name: name.trim(),
          category,
          avgDistance: avgDistance != null ? Number(avgDistance) : null,
        },
      ]),
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
      title: "ショット記録とスコア",
      subtitle: "ショットの記録とホール毎のスコア入力",
      preview: <TutorialPreviewShot />,
      desc: (
        <>
          <p>
            ラウンド画面で右下の<b>＋ボタン</b>からショット入力。
            <b>自己評価（◎○△×）</b>と<b>結果（セーフ/OB/ロスト等）</b>
            を分けて記録できるので、「ナイスショットなのにOB」も残せます。
          </p>
          <p>
            想定外のミスは<b>「平均距離から除外」チェック</b>を入れると、
            平均距離からは外しつつミス率にカウントできます。
          </p>
          <p>
            ホール下部の<b>スコア入力</b>でそのホールの打数を手入力。
            ペナを含めた正確なスコアを残せます。
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
        /* v2.1: 全体的な左右はみ出し防止 */
        overflow-x: hidden;
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
        /* v2.1: iPhone Pro Max のノッチ/ダイナミックアイランド左右安全領域に対応 */
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        box-sizing: border-box;
      }
      .phone-frame {
        width: 100%;
        max-width: 480px; /* iPhone 14 Pro Max は 430px、余裕を持たせる */
        min-height: 100vh;
        min-height: 100dvh;
        background: var(--bg-0);
        position: relative;
        /* v2.1: 内部要素がはみ出さないように */
        overflow-x: hidden;
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

      button {
        cursor: pointer;
        font-family: inherit;
        border: none;
        background: none;
        color: inherit;
        padding: 0;
        /* v2.1: タップ判定の堅牢化 */
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
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
      /* v2.1: タップ可能なヘッダー（ラウンド編集用） */
      button.topbar-title-tappable {
        background: none;
        border: none;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }
      button.topbar-title-tappable:active {
        opacity: 0.6;
      }
      .topbar-edit-icon {
        margin-left: 6px;
        font-size: 11px;
        opacity: 0.5;
      }
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
        padding: 8px env(safe-area-inset-right) calc(8px + env(safe-area-inset-bottom)) env(safe-area-inset-left);
        z-index: 15; /* 通常UI（topbar:5 等）より上、モーダル(20)・チュートリアル(100)より下 */
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
        padding: 12px calc(16px + env(safe-area-inset-right)) calc(20px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left));
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

      /* v2.1: パター専用UI */
      .putt-distance-shortcuts {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      .putt-shortcut {
        flex: 1;
        min-width: 50px;
        padding: 8px 10px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text-dim);
        font-size: 13px;
        font-weight: 600;
      }
      .putt-shortcut.on {
        background: var(--green);
        color: #0a0a0a;
        border-color: var(--green);
      }
      .putt-result-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }
      /* v2.1: ウェッジ結果のグループ表示 */
      .wedge-result-groups {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .wedge-result-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .wedge-result-group-label {
        font-size: 10px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        padding-left: 2px;
      }
      .wedge-result-group-chips {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
      }
      /* v2.1: ショット行の複数結果表示 */
      .shot-result-multi {
        display: flex;
        flex-direction: column;
        gap: 2px;
        align-items: flex-end;
      }
      .shot-result-mini {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 3px;
        white-space: nowrap;
      }
      .shot-result-mini.tone-good {
        background: rgba(182, 242, 74, 0.18);
        color: var(--green);
      }
      .shot-result-mini.tone-ok {
        background: rgba(94, 184, 255, 0.18);
        color: var(--tone-ok, #5eb8ff);
      }
      .shot-result-mini.tone-miss {
        background: rgba(255, 184, 77, 0.18);
        color: var(--amber, #ffb84d);
      }
      .putt-result-chip {
        text-align: center;
        padding: 12px 8px;
        font-size: 13px;
        border-radius: 10px;
      }
      .putt-result-chip.tone-good.on {
        background: var(--green);
        color: #0a0a0a;
        border-color: var(--green);
      }
      .putt-result-chip.tone-ok.on {
        background: var(--tone-ok, #5eb8ff);
        color: #0a0a0a;
        border-color: var(--tone-ok, #5eb8ff);
      }
      .putt-result-chip.tone-miss.on {
        background: var(--amber, #ffb84d);
        color: #0a0a0a;
        border-color: var(--amber, #ffb84d);
      }

      /* v2.1: パター複数打セレクタ */
      .putt-count-row {
        display: flex;
        gap: 8px;
      }
      .putt-count-btn {
        flex: 1;
        padding: 12px 0;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text-dim);
        font-size: 16px;
        font-weight: 700;
      }
      .putt-count-btn.on {
        background: var(--green);
        color: #0a0a0a;
        border-color: var(--green);
      }
      .putt-count-note {
        margin-left: 6px;
        font-size: 11px;
        color: var(--green);
        font-weight: 600;
      }
      .putt-count-hint {
        margin-top: 8px;
        padding: 8px 10px;
        background: rgba(182, 242, 74, 0.08);
        border: 1px solid rgba(182, 242, 74, 0.2);
        border-radius: 6px;
        font-size: 11px;
        color: var(--text-dim);
        line-height: 1.6;
      }

      /* v2.1: ウェッジ分析タブ */
      .wedge-cards {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 16px;
      }
      .wedge-card {
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        padding: 14px;
      }
      .wedge-card-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 12px;
      }
      .wedge-card-club {
        font-size: 18px;
        font-weight: 700;
      }
      .wedge-card-n {
        font-size: 12px;
        color: var(--text-faint);
        display: flex;
        align-items: baseline;
        gap: 4px;
        padding-right: 4px;
      }
      .wedge-card-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 12px;
      }
      .wedge-stat {
        background: var(--bg-2);
        border-radius: 8px;
        padding: 8px 10px;
      }
      .wedge-stat-label {
        font-size: 10px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .wedge-stat-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 700;
        color: var(--text);
      }
      .wedge-stat-value.good {
        color: var(--green);
      }
      .wedge-stat-value.miss {
        color: var(--red);
      }
      .wedge-result-bar {
        display: flex;
        height: 24px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--bg-2);
      }
      .wedge-result-segment {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 700;
        color: #0a0a0a;
        white-space: nowrap;
      }
      .wedge-result-segment.tone-good {
        background: var(--green);
      }
      .wedge-result-segment.tone-ok {
        background: var(--tone-ok, #5eb8ff);
      }
      .wedge-result-segment.tone-miss {
        background: var(--amber, #ffb84d);
      }

      /* v2.1: パター分析タブ */
      .putter-bucket-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 16px;
      }
      .putter-bucket-row {
        display: grid;
        grid-template-columns: 70px 50px 1fr;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
      }
      .putter-bucket-label {
        font-weight: 700;
        font-size: 13px;
      }
      .putter-bucket-n {
        font-size: 11px;
        color: var(--text-faint);
        font-family: 'JetBrains Mono', monospace;
      }
      .putter-bucket-bars {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .putter-bucket-bar-track {
        height: 8px;
        background: var(--bg-2);
        border-radius: 4px;
        overflow: hidden;
      }
      .putter-bucket-bar-fill {
        height: 100%;
        background: var(--green);
        transition: width 0.3s ease;
      }
      .putter-bucket-rate {
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        color: var(--text-dim);
      }
      .putter-bucket-empty {
        font-size: 11px;
        color: var(--text-faint);
      }
      /* v2.1: 距離精度のサブテキスト（クセラベル） */
      .wedge-stat-sub {
        font-size: 9px;
        margin-left: 6px;
        font-weight: 600;
        color: var(--text-faint);
      }
      /* v2.1: ウェッジ実距離横の差分バッジ */
      .wedge-diff-badge {
        margin-left: 10px;
        padding: 3px 7px;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 700;
      }
      .wedge-diff-badge.perfect {
        background: rgba(182, 242, 74, 0.2);
        color: var(--green);
      }
      .wedge-diff-badge.long {
        background: rgba(255, 184, 77, 0.2);
        color: var(--amber, #ffb84d);
      }
      .wedge-diff-badge.short {
        background: rgba(94, 184, 255, 0.2);
        color: var(--tone-ok, #5eb8ff);
      }
      /* v2.1: ウェッジ距離 ±調整ボタン */
      .wedge-adjust-row {
        display: flex;
        gap: 6px;
        margin-top: 8px;
      }
      .wedge-adjust-btn {
        flex: 1;
        padding: 12px 0;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font-size: 16px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
      }
      .wedge-adjust-btn:active {
        transform: scale(0.95);
      }
      .wedge-adjust-btn.minus {
        background: rgba(94, 184, 255, 0.28);
        border-color: rgba(94, 184, 255, 0.75);
        color: #8fc8ff;
      }
      .wedge-adjust-btn.minus:active {
        background: rgba(94, 184, 255, 0.45);
      }
      .wedge-adjust-btn.plus {
        background: rgba(255, 184, 77, 0.28);
        border-color: rgba(255, 184, 77, 0.75);
        color: #ffd182;
      }
      .wedge-adjust-btn.plus:active {
        background: rgba(255, 184, 77, 0.45);
      }

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

      /* v2.1: スワイプ削除 */
      .shot-row-swipe-wrap {
        position: relative;
        overflow: hidden;
        border-radius: 10px;
      }
      .shot-row-delete-action {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background: var(--red, #ff6b6b);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 2px;
        cursor: pointer;
        font-weight: 700;
      }
      .shot-row-delete-label {
        font-size: 11px;
      }
      .shot-row-swipe-content {
        position: relative;
        z-index: 1;
        will-change: transform;
        background: var(--bg-1);
        border-radius: 10px;
      }
      .shot-row {
        display: grid;
        grid-template-columns: 24px 42px 60px 1fr 44px 36px;
        align-items: center;
        gap: 6px;
        padding: 10px 10px;
        background: var(--bg-1);
        border-radius: 10px;
        border: 1px solid var(--border-soft);
        text-align: left;
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }
      .shot-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px; color: var(--text-faint);
      }
      .shot-club {
        font-weight: 700; font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        display: flex;
        gap: 3px;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;
        overflow: hidden;
      }
      .shot-tendency-tags .tag {
        font-size: 10px;
        white-space: nowrap;
        max-width: 100%;
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
      .tag-contact {
        background: rgba(255, 107, 107, 0.18);
        color: var(--red);
        font-weight: 700;
      }
      /* v2.5: ミスタグ */
      .tag-miss {
        background: rgba(255, 107, 107, 0.25);
        color: var(--red);
        font-weight: 700;
      }
      .tag-miss-type {
        background: rgba(255, 184, 77, 0.18);
        color: var(--amber);
        font-weight: 600;
      }

      /* v2.5: 必須バッジ */
      .required-badge {
        display: inline-block;
        margin-left: 6px;
        padding: 1px 6px;
        background: var(--red);
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        border-radius: 3px;
        letter-spacing: 0.5px;
      }
      /* v2.5: 自己評価セクションを目立たせる */
      .rating-section {
        background: rgba(94, 184, 255, 0.05);
        border: 1px solid rgba(94, 184, 255, 0.15);
        border-radius: 12px;
        padding: 12px;
      }
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

      /* v2.0: ShotRow の結果セル（評価＋結果並列表示） */
      .shot-result-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
        align-items: flex-end;
        min-width: 36px;
      }
      .shot-outcome {
        font-size: 9px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 4px;
        white-space: nowrap;
      }
      .shot-outcome.tone-bad {
        background: var(--red);
        color: #fff;
      }
      .shot-outcome.tone-ok {
        background: rgba(94,184,255,0.18);
        color: var(--tone-ok);
      }
      .shot-replay-badge {
        display: inline-block;
        margin-left: 3px;
        font-size: 10px;
        color: var(--amber);
      }

      /* v2.0: ホールスコア手入力バー（hole-navの直上） */
      .score-input-bar {
        position: fixed;
        left: 0;
        right: 0;
        /* hole-nav の高さ分 上にずらす（hole-nav は約64px + safe-area） */
        bottom: calc(64px + env(safe-area-inset-bottom));
        max-width: 480px;
        margin: 0 auto;
        background: rgba(20,20,20,0.96);
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
        border-top: 1px solid var(--border-soft);
        padding: 10px 8px;
        z-index: 7;
      }
      @media (min-width: 600px) {
        .score-input-bar { max-width: 430px; }
      }
      .score-input-bar-row {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: nowrap;
        justify-content: center;
      }
      .score-input-bar-label {
        font-size: 14px;
        color: var(--text-faint);
        font-weight: 700;
        letter-spacing: 0;
        min-width: 12px;
        text-align: center;
      }
      .score-input-bar-divider {
        width: 1px;
        height: 24px;
        background: var(--border-soft);
        margin: 0 2px;
      }
      .score-diff {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 5px;
        border-radius: 4px;
        margin-left: 0;
      }
      .score-diff.tone-great {
        background: var(--green);
        color: #0a0a0a;
      }
      .score-diff.tone-good {
        background: rgba(182,242,74,0.2);
        color: var(--green);
      }
      .score-diff.tone-ok {
        background: var(--bg-2);
        color: var(--text-dim);
      }
      .score-diff.tone-bogey {
        background: rgba(255,184,77,0.2);
        color: var(--amber);
      }
      .score-diff.tone-double {
        background: rgba(255,107,107,0.2);
        color: var(--red);
      }
      .score-step-btn {
        flex: 0 0 auto;
        background: var(--bg-2);
        border-radius: 7px;
        font-weight: 700;
        color: var(--text);
      }
      .score-step-btn:active {
        transform: scale(0.92);
      }
      .score-step-btn:disabled {
        opacity: 0.3;
      }
      .score-step-btn.small {
        width: 30px;
        height: 36px;
        font-size: 17px;
        padding: 0;
      }
      .score-input-num {
        flex: 0 0 auto;
        text-align: center;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 7px;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        outline: none;
      }
      .score-input-num.small {
        width: 42px;
        height: 36px;
        font-size: 17px;
        padding: 0;
      }
      .score-input-num:focus {
        border-color: var(--green);
      }
      /* FAB の位置をスコアバー分上にずらす */
      .fab {
        position: fixed;
        right: 18px;
        /* hole-nav (64px) + score-input-bar (約60px、20%拡大後) + 18px margin */
        bottom: calc(142px + env(safe-area-inset-bottom));
        width: 56px; height: 56px;
        background: var(--green); color: #0a0a0a;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(182,242,74,0.35);
        z-index: 9;
      }
      /* ショット一覧の下部にスコアバー＋hole-nav分の余白 */
      .round-screen .shot-list,
      .round-screen .empty-shots {
        padding-bottom: 140px;
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

      /* v2.5: ミスショット セクション */
      .miss-section {
        background: rgba(255, 107, 107, 0.05);
        border: 1px solid rgba(255, 107, 107, 0.15);
        border-radius: 12px;
        padding: 12px;
      }
      .miss-checkbox {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
      }
      .miss-checkbox input[type="checkbox"] {
        width: 22px;
        height: 22px;
        margin: 0;
        accent-color: var(--red);
        cursor: pointer;
        flex-shrink: 0;
      }
      .miss-checkbox-icon {
        font-size: 18px;
      }
      .miss-checkbox-label {
        font-size: 15px;
        font-weight: 700;
        color: var(--text);
      }
      .miss-checkbox-sub {
        font-size: 11px;
        font-weight: 400;
        color: var(--text-faint);
        margin-left: 6px;
      }
      .miss-types {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px dashed rgba(255, 107, 107, 0.2);
      }
      .miss-types-label {
        font-size: 11px;
        color: var(--text-faint);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .miss-types-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .miss-type-chip {
        text-align: center;
        padding: 10px 6px;
        font-size: 12px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        cursor: pointer;
      }
      .miss-type-chip.on {
        background: rgba(255, 107, 107, 0.2);
        border-color: var(--red);
        color: var(--red);
        font-weight: 700;
      }
      .miss-type-chip:active {
        transform: scale(0.96);
      }

      /* v2.5: ミスモード時の入力フィールド非活性 */
      .miss-disabled-wrapper > * {
        opacity: 0.4;
        transition: opacity 0.2s;
      }
      .miss-disabled-wrapper > *:focus-within,
      .miss-disabled-wrapper > *:hover {
        opacity: 1;
      }

      /* v2.1: 音声入力でハイライト */
      .editor-section.highlight {
        animation: voiceFlash 2.5s ease-out;
      }
      @keyframes voiceFlash {
        0%, 30% {
          background: rgba(182, 242, 74, 0.15);
          box-shadow: 0 0 0 2px var(--green-dim);
          border-radius: 8px;
        }
        100% {
          background: transparent;
          box-shadow: 0 0 0 0 transparent;
        }
      }

      /* 音声入力ボタン */
      .voice-input-section {
        margin-bottom: 16px;
        padding: 12px;
        background: var(--bg-2);
        border-radius: 12px;
        border: 1px solid var(--border-soft);
      }
      /* v3: 2ボタングループ */
      .voice-btn-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .voice-input-btn.chat {
        background: rgba(94, 184, 255, 0.12);
        border-color: rgba(94, 184, 255, 0.3);
      }
      .voice-input-btn.chat:active {
        background: rgba(94, 184, 255, 0.2);
      }
      .voice-input-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 11px 12px;
        background: var(--bg-1);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .voice-input-btn:active {
        transform: scale(0.98);
      }
      .voice-input-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .voice-input-btn.listening {
        background: var(--red);
        color: #fff;
        border-color: var(--red);
        animation: voicePulse 1.5s ease-in-out infinite;
      }
      .voice-input-btn.processing {
        background: rgba(94, 184, 255, 0.18);
        color: var(--tone-ok);
        border-color: var(--tone-ok);
      }
      .voice-input-btn.error {
        background: rgba(255, 107, 107, 0.18);
        color: var(--red);
        border-color: var(--red);
      }
      @keyframes voicePulse {
        0%, 100% {
          box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.6);
        }
        50% {
          box-shadow: 0 0 0 8px rgba(255, 107, 107, 0);
        }
      }
      .voice-icon {
        font-size: 16px;
      }
      .voice-transcript {
        margin-top: 8px;
        padding: 8px 10px;
        background: rgba(182, 242, 74, 0.08);
        border-radius: 8px;
        font-size: 12px;
        color: var(--text-dim);
        text-align: center;
      }
      .voice-hint {
        margin-top: 8px;
        font-size: 11px;
        color: var(--text-faint);
        text-align: center;
        line-height: 1.5;
      }

      /* v2.1: 認識ワード一覧トグル */
      .voice-help-toggle {
        display: block;
        width: 100%;
        margin-top: 8px;
        padding: 6px 8px;
        background: transparent;
        border: 1px dashed var(--border-soft);
        border-radius: 6px;
        color: var(--text-dim);
        font-size: 11px;
        cursor: pointer;
        text-align: center;
      }
      .voice-help-toggle:active {
        background: var(--bg-1);
      }

      /* v3: 対話音声 - チャット式UI */
      .chat-sheet {
        max-height: 88vh;
        display: flex;
        flex-direction: column;
      }
      .chat-stream {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 240px;
        max-height: calc(88vh - 280px);
      }
      .chat-bubble {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 14px;
        word-break: break-word;
      }
      .chat-bubble-text {
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .chat-bubble.chat-ai {
        align-self: flex-start;
        background: var(--bg-2);
        border-bottom-left-radius: 4px;
        color: var(--text);
      }
      .chat-bubble.chat-user {
        align-self: flex-end;
        background: rgba(182, 242, 74, 0.18);
        border-bottom-right-radius: 4px;
        color: var(--text);
      }
      .chat-bubble.listening {
        background: rgba(255, 107, 107, 0.18);
        color: var(--red);
        font-weight: 700;
        animation: pulse-listen 1.2s ease-in-out infinite;
      }
      @keyframes pulse-listen {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .chat-status {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 8px 0;
        border-top: 1px solid var(--border-soft);
        border-bottom: 1px solid var(--border-soft);
        margin: 8px 0;
        min-height: 32px;
      }
      .chat-chip {
        background: var(--bg-2);
        color: var(--green);
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
      }

      /* v3.2: 選択肢ボタン群（チャット内・右寄せ） */
      .chat-choices {
        align-self: stretch;
        width: 100%;
        max-width: 100%;
        background: rgba(94, 184, 255, 0.06);
        border: 1px solid rgba(94, 184, 255, 0.2);
        border-radius: 12px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .chat-choices-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .chat-choices-grid.clubs {
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      .chat-choices-grid.distance {
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .chat-choices-grid.two-cols {
        grid-template-columns: repeat(2, 1fr);
      }
      .chat-choices-grid.three-cols {
        grid-template-columns: repeat(3, 1fr);
      }
      .chat-choice-btn {
        min-height: 52px;
        padding: 14px 8px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      /* クラブのみ字を少し小さく（4列） */
      .chat-choices-grid.clubs .chat-choice-btn {
        font-size: 14px;
        min-height: 48px;
      }
      .chat-choice-btn:active {
        transform: scale(0.95);
      }
      .chat-choice-btn.selected {
        background: rgba(182, 242, 74, 0.2);
        border-color: var(--green);
        color: var(--green);
      }
      .chat-choice-btn.tone-good {
        border-color: rgba(182, 242, 74, 0.4);
        color: var(--green);
      }
      .chat-choice-btn.tone-ok {
        color: var(--text);
      }
      .chat-choice-btn.tone-miss {
        border-color: rgba(255, 184, 77, 0.3);
        color: var(--amber);
      }
      .chat-choice-btn.tone-bad {
        border-color: rgba(255, 107, 107, 0.4);
        color: var(--red);
      }
      .chat-choices-numeric {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .chat-numeric-input {
        flex: 1;
        min-height: 48px;
        padding: 12px 10px;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 700;
        text-align: center;
        outline: none;
      }
      .chat-numeric-input:focus {
        border-color: var(--green);
      }
      .chat-numeric-confirm {
        min-height: 48px;
        padding: 12px 20px;
        background: var(--green);
        color: #0a0a0a;
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
      }
      .chat-numeric-confirm:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .chat-skip-inline {
        align-self: stretch;
        min-height: 44px;
        padding: 12px 14px;
        background: var(--bg-1);
        border: 1px dashed var(--border);
        border-radius: 10px;
        color: var(--text-dim);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .chat-skip-inline:active {
        background: var(--bg-2);
        transform: scale(0.97);
      }
      .chat-multi-actions {
        display: flex;
        gap: 8px;
        align-items: stretch;
      }
      .chat-multi-actions .chat-skip-inline {
        flex: 1;
      }
      .chat-confirm-inline {
        flex: 1;
        min-height: 44px;
        padding: 12px 16px;
        background: var(--green);
        color: #0a0a0a;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .chat-confirm-inline:active {
        transform: scale(0.97);
      }
      .chat-confirm-inline:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .chat-actions {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 8px;
        padding-top: 8px;
      }
      .chat-record-btn {
        padding: 14px;
        background: var(--green);
        color: #0a0a0a;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      .chat-record-btn.listening {
        background: var(--red);
        color: #fff;
        animation: pulse-listen 1.2s ease-in-out infinite;
      }
      .chat-record-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .chat-skip-btn,
      .chat-save-btn {
        padding: 14px 12px;
        background: var(--bg-2);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }
      .chat-save-btn:not(:disabled) {
        background: rgba(182, 242, 74, 0.2);
        border-color: var(--green);
        color: var(--green);
      }
      .chat-save-btn:disabled,
      .chat-skip-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .voice-help-list {
        margin-top: 10px;
        padding: 12px;
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        max-height: 320px;
        overflow-y: auto;
      }
      .voice-help-cat {
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-soft);
      }
      .voice-help-cat:last-of-type {
        border-bottom: none;
        margin-bottom: 4px;
      }
      .voice-help-cat-name {
        font-size: 12px;
        font-weight: 700;
        color: var(--green);
        margin-bottom: 4px;
      }
      .voice-help-words {
        font-size: 11px;
        color: var(--text-dim);
        line-height: 1.7;
        word-break: break-word;
      }
      .voice-help-note {
        margin-top: 4px;
        padding: 8px 10px;
        background: rgba(255, 184, 77, 0.1);
        border: 1px solid rgba(255, 184, 77, 0.25);
        border-radius: 8px;
        font-size: 10px;
        color: var(--amber);
        line-height: 1.5;
      }
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
        grid-template-columns: repeat(4, 1fr);
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

      /* v2.1: 打感（contact）チップ */
      .contact-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }
      .contact-chip {
        padding: 12px 0;
        background: var(--bg-2);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-dim);
        text-align: center;
      }
      .contact-chip:active { transform: scale(0.95); }
      .contact-chip.on.tone-good {
        background: var(--green);
        color: #0a0a0a;
        border-color: var(--green);
      }
      .contact-chip.on.tone-ok {
        background: var(--tone-ok, #5eb8ff);
        color: #0a0a0a;
        border-color: var(--tone-ok, #5eb8ff);
      }
      .contact-chip.on.tone-miss {
        background: var(--amber, #ffb84d);
        color: #0a0a0a;
        border-color: var(--amber, #ffb84d);
      }

      /* v2.0: 結果（事実）ボタン */
      .outcome-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
      }
      .outcome-btn {
        padding: 12px 4px;
        background: var(--bg-2); border-radius: 10px;
        font-size: 12px; font-weight: 700; color: var(--text-dim);
      }
      .outcome-btn:active { transform: scale(0.95); }
      .outcome-btn.on.tone-ok {
        background: var(--green); color: #0a0a0a;
      }
      .outcome-btn.on.tone-bad {
        background: var(--red); color: #fff;
      }

      /* v2.0: 打ち直しトグル */
      .replay-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--bg-2);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        cursor: pointer;
      }
      .replay-toggle input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--green);
        flex: 0 0 auto;
      }
      .replay-toggle-text {
        font-size: 12px;
        color: var(--text-dim);
        line-height: 1.5;
      }
      .replay-toggle-text b {
        color: var(--text);
      }

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
      .distance-hint {
        margin: 4px 16px 12px;
        padding: 10px 12px;
        background: rgba(94, 184, 255, 0.08);
        border: 1px solid rgba(94, 184, 255, 0.2);
        border-radius: 8px;
        font-size: 11px;
        color: var(--text-dim);
        line-height: 1.6;
      }
      .distance-hint b {
        color: var(--text);
      }
      .distance-hint-note {
        color: var(--text-faint);
        font-size: 10px;
      }
      .distance-chart {
        padding: 12px 16px 0;
        display: flex; flex-direction: column; gap: 8px;
      }

      /* v2.1: ShotTab - クラブリスト */
      .club-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px 16px 0;
      }
      .club-list-item {
        position: relative;
        display: block;
        text-align: left;
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        padding: 14px;
        width: 100%;
        cursor: pointer;
      }
      .club-list-item:active {
        background: var(--bg-2);
      }
      .club-list-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 10px;
      }
      .club-list-name {
        font-size: 18px;
        font-weight: 700;
      }
      .club-list-n {
        font-size: 12px;
        color: var(--text-faint);
        display: flex;
        align-items: baseline;
        gap: 4px;
        padding-right: 4px;
      }
      .club-list-n-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        color: var(--text-dim);
      }
      .club-list-n-unit {
        font-size: 10px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .club-list-stats {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
        margin-bottom: 10px;
      }
      .club-list-stat {
        background: var(--bg-2);
        border-radius: 6px;
        padding: 6px 8px;
      }
      .club-list-stat-label {
        font-size: 9px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
      }
      .club-list-stat-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 700;
      }
      .club-list-stat-value.small {
        font-size: 12px;
      }
      .club-list-stat-value .num-large {
        font-size: 16px;
      }
      .club-list-stat-value .num-unit {
        font-size: 10px;
        color: var(--text-faint);
        margin-left: 2px;
      }
      .club-list-stat-value.miss {
        color: var(--red);
      }
      .club-list-bar {
        height: 4px;
        background: var(--bg-2);
        border-radius: 2px;
        overflow: hidden;
      }
      .club-list-bar-fill {
        height: 100%;
        background: var(--green);
      }
      .club-list-arrow {
        position: absolute;
        right: 14px;
        top: 14px;
        font-size: 24px;
        color: var(--text-faint);
        line-height: 1;
      }

      /* v2.1: ClubDetailView */
      .club-detail-stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: 0 16px;
      }
      .cd-stat {
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 12px;
      }
      .cd-stat-label {
        font-size: 10px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .cd-stat-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px;
        font-weight: 700;
      }
      .cd-stat-value.small {
        font-size: 14px;
      }
      .cd-stat-value.miss {
        color: var(--red);
      }
      .cd-stat-value .num-large {
        font-size: 22px;
      }
      .cd-stat-value .num-unit {
        font-size: 11px;
        color: var(--text-faint);
        margin-left: 3px;
      }
      .cd-lie-row {
        display: flex;
        gap: 10px;
        padding: 0 16px;
        align-items: center;
      }
      .cd-lie-card {
        flex: 1;
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 12px;
      }
      .cd-lie-card.rough {
        background: rgba(255, 184, 77, 0.08);
        border-color: rgba(255, 184, 77, 0.25);
      }
      .cd-lie-label {
        font-size: 10px;
        color: var(--text-faint);
        margin-bottom: 4px;
      }
      .cd-lie-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 700;
      }
      .cd-lie-diff {
        font-size: 11px;
        color: var(--text-dim);
        white-space: nowrap;
      }
      .cd-segment-bar {
        display: flex;
        height: 28px;
        margin: 0 16px;
        border-radius: 6px;
        overflow: hidden;
        background: var(--bg-2);
      }
      .cd-segment {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: #0a0a0a;
        white-space: nowrap;
      }
      .cd-segment.tone-good { background: var(--green); }
      .cd-segment.tone-ok { background: var(--tone-ok, #5eb8ff); }
      .cd-segment.tone-miss { background: var(--amber, #ffb84d); }
      .cd-outcome-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 0 16px;
      }
      .cd-outcome-row {
        display: grid;
        grid-template-columns: 70px 1fr 80px;
        align-items: center;
        gap: 8px;
      }
      .cd-outcome-label {
        font-size: 11px;
        font-weight: 600;
      }
      .cd-outcome-label.tone-good { color: var(--green); }
      .cd-outcome-label.tone-ok { color: var(--tone-ok, #5eb8ff); }
      .cd-outcome-label.tone-miss { color: var(--amber, #ffb84d); }
      .cd-outcome-bar {
        height: 12px;
        background: var(--bg-2);
        border-radius: 3px;
        overflow: hidden;
      }
      .cd-outcome-fill {
        height: 100%;
      }
      .cd-outcome-fill.tone-good { background: var(--green); }
      .cd-outcome-fill.tone-ok { background: var(--tone-ok, #5eb8ff); }
      .cd-outcome-fill.tone-miss { background: var(--amber, #ffb84d); }
      .cd-outcome-count {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--text-dim);
        text-align: right;
      }
      .cd-memo-empty {
        text-align: center;
        color: var(--text-faint);
        font-size: 12px;
        padding: 20px 16px;
      }
      .cd-memo-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 16px;
      }
      .cd-memo-item {
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 10px;
        padding: 12px;
      }
      .cd-memo-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 6px;
        align-items: center;
      }
      .cd-memo-date {
        font-size: 11px;
        color: var(--text-dim);
        font-family: 'JetBrains Mono', monospace;
      }
      .cd-memo-loc {
        font-size: 11px;
        color: var(--text-faint);
      }
      .cd-memo-dist {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: var(--text);
        background: var(--bg-2);
        padding: 1px 6px;
        border-radius: 4px;
      }
      .cd-memo-rating, .cd-memo-outcome {
        font-size: 10px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
      }
      .cd-memo-rating.tone-good { background: rgba(182,242,74,0.2); color: var(--green); }
      .cd-memo-rating.tone-ok { background: rgba(94,184,255,0.2); color: var(--tone-ok, #5eb8ff); }
      .cd-memo-rating.tone-miss { background: rgba(255,184,77,0.2); color: var(--amber, #ffb84d); }
      .cd-memo-outcome.tone-miss { background: rgba(255,107,107,0.2); color: var(--red); }
      .cd-memo-text {
        font-size: 14px;
        color: var(--text);
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
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
        width: 100%;
        text-align: left;
        cursor: pointer;
        border: 1px solid var(--border-soft);
      }
      .round-kpi-card:active {
        background: var(--bg-2);
      }
      .round-kpi-arrow {
        font-size: 22px;
        color: var(--text-faint);
        line-height: 1;
        margin-left: auto;
        padding-left: 8px;
      }
      /* v2.1: ラウンド詳細画面 */
      .round-club-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 0 16px;
      }
      .round-club-row {
        display: grid;
        grid-template-columns: 50px 36px 1fr 60px 50px;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 8px;
      }
      .round-club-name {
        font-weight: 700;
        font-size: 14px;
      }
      .round-club-n {
        font-size: 11px;
        color: var(--text-faint);
        text-align: right;
      }
      .round-club-avg {
        font-family: 'JetBrains Mono', monospace;
        text-align: right;
      }
      .round-club-avg-num {
        font-size: 14px;
        font-weight: 700;
      }
      .round-club-avg-unit {
        font-size: 9px;
        color: var(--text-faint);
        margin-left: 2px;
      }
      .round-club-range {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--text-dim);
        text-align: right;
      }
      .round-club-miss {
        font-size: 11px;
        color: var(--text-dim);
        text-align: right;
      }
      .round-club-miss.high {
        color: var(--red);
        font-weight: 700;
      }
      .round-hole-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0 16px;
      }
      .round-hole-row {
        display: grid;
        grid-template-columns: 40px 50px 40px 1fr 40px;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: var(--bg-1);
        border: 1px solid var(--border-soft);
        border-radius: 6px;
      }
      .round-hole-num {
        font-weight: 700;
        font-size: 13px;
      }
      .round-hole-par {
        font-size: 11px;
        color: var(--text-faint);
      }
      .round-hole-score {
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 700;
        text-align: center;
      }
      .round-hole-score.tone-good { color: var(--green); }
      .round-hole-score.tone-ok { color: var(--text); }
      .round-hole-score.tone-miss { color: var(--amber); }
      .round-hole-diff {
        font-size: 11px;
        font-weight: 600;
      }
      .round-hole-diff.tone-good { color: var(--green); }
      .round-hole-diff.tone-ok { color: var(--text-dim); }
      .round-hole-diff.tone-miss { color: var(--amber); }
      .round-hole-putts {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: var(--text-faint);
        text-align: right;
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
      .app.in-csb .score-input-bar { bottom: calc(64px + 42px + env(safe-area-inset-bottom)); }
      .app.in-csb .fab { bottom: calc(142px + 42px + env(safe-area-inset-bottom)); }

      /* Standalone (本番Safari/Chrome、PWA含む) はそのままbottom指定が効く */
    `}</style>
  );
}
