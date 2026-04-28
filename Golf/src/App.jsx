import React, { useState, useEffect, useMemo, useRef } from "react";
import COURSES_DATA from "./courses.json";
import Style from "./styles";
import {
  ChevronLeft,
  Plus,
  Trash2,
  Check,
} from "./icons";
import BottomNav from "./components/BottomNav";
import Tutorial from "./components/Tutorial";
import ClubsView from "./components/ClubsView";
import AnalyticsView from "./components/AnalyticsView";
import RoundView from "./components/RoundView";
import HomeView from "./components/HomeView";
import {
  buildRoundReviewPrompt,
  buildIssueAnalysisPrompt,
  buildClubDistancePrompt,
  computeClubStats,
  computeRoundKPI,
  aggregateKPI,
} from "./data/kpi";

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
    }
    if (!loaded.courseMasters) loaded.courseMasters = [];
    return migrateState(loaded);
  }
  return {
    clubs: DEFAULT_CLUBS,
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
// 打ち直しフラグ（v2.0で追加、距離分析から除外）
function isReplay(shot) {
  return !!shot.isReplay;
}
// 「ミス」とみなすショット（自己評価が miss/bad、または off-play）
function isMissShot(shot) {
  const r = getShotSelfRating(shot);
  if (r === "miss" || r === "bad") return true;
  if (isShotOffPlay(shot)) return true;
  return false;
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

