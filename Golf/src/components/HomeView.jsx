import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Cloud,
  Trash2,
  MapPin,
  Calendar,
  Plus,
} from "../icons";
import { uid, fmtDate } from "../data/helpers";
import { DEFAULT_COURSES } from "../data/constants";
import {
  findCourseMaster,
  getTeesForVenue,
  getCoursesForVenueAndTee,
} from "../data/courseHelpers";
import { computeRoundKPI } from "../data/kpi";

// ============================================================
//  HOME
// ============================================================
export default function HomeView({
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
            開始
          </button>
        </div>
      </div>
    </div>
  );
}
