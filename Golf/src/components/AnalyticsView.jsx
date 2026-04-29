import React, { useState, useMemo } from "react";
import { ChevronLeft } from "../icons";
import { fmtDate, median, copyToClipboard } from "../data/helpers";
import {
  computeClubStats,
  computeRoundKPI,
  aggregateKPI,
  buildIssueAnalysisPrompt,
  buildClubDistancePrompt,
} from "../data/kpi";

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
export default function AnalyticsView({ state, onBack }) {
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
