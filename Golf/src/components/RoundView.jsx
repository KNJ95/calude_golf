import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  Plus,
  Trash2,
  X,
  Check,
} from "../icons";
import {
  uid,
  fmtDate,
  getShotOutcome,
  getShotSelfRating,
  isReplay,
} from "../data/helpers";
import { LIES, SELF_RATINGS, OUTCOMES } from "../data/constants";
import { buildRoundReviewPrompt } from "../data/kpi";
import DeleteConfirmModal from "./DeleteConfirmModal";
import AiCopyButton from "./AiCopyButton";

// ============================================================
//  ROUND VIEW
// ============================================================
export default function RoundView({
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
        <span className="score-input-bar-label">スコア</span>
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

        <span className="score-input-bar-label">パット</span>
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

function ShotRow({ index, shot, clubs, unit, onClick }) {
  const club = clubs.find((c) => c.id === shot.clubId);
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
        {isReplay(shot) && <span className="shot-replay-badge">↻</span>}
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
        {dirLabel && <span className="tag tag-dir">{dirLabel}</span>}
        {depthLabel && <span className="tag tag-depth">{depthLabel}</span>}
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
  const [isReplayShot, setIsReplayShot] = useState(!!existing?.isReplay);
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

  const canSave = clubId && outcome && lie;

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
          <div className="editor-label">自己評価（任意）</div>
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

        <div className="editor-section">
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
              checked={isReplayShot}
              onChange={(e) => setIsReplayShot(e.target.checked)}
            />
            <span className="replay-toggle-text">
              <b>打ち直し</b>（OB等の後の再ショット・距離分析から除外）
            </span>
          </label>
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
                  selfRating,
                  outcome,
                  isReplay: isReplayShot,
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
