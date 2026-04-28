import {
  fmtDate,
  median,
  trimmedMean,
  getShotOutcome,
  getShotSelfRating,
  isShotOffPlay,
  isReplay,
  isMissShot,
  getHoleScore,
  getHolePutts,
} from "./helpers";
import {
  LIE_LABELS,
  SELF_RATING_LABELS,
  OUTCOME_LABELS,
  DIR_LABELS,
  DEPTH_LABELS,
} from "./constants";

export function buildRoundReviewPrompt(round, clubs, unit) {
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
    "| ホール | Par | # | クラブ | 距離 | 打点 | 着地 | 方向 | 距離感 | 自己評価 | 結果 | 打ち直し | メモ |"
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  round.holes.forEach((h) => {
    h.shots.forEach((s, i) => {
      const club = clubMap[s.clubId]?.name || "—";
      const sr = getShotSelfRating(s);
      const oc = getShotOutcome(s);
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
        sr ? SELF_RATING_LABELS[sr] : "—",
        OUTCOME_LABELS[oc] || "—",
        isReplay(s) ? "✓" : "—",
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
      .filter((s) => s.distance != null && !isShotOffPlay(s) && !isReplay(s))
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
  return lines.join("\n");
}

export function buildIssueAnalysisPrompt(state) {
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

export function buildClubDistancePrompt(state) {
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
export function computeClubStats(state) {
  const byClub = {};
  state.clubs.forEach((c) => {
    byClub[c.id] = { club: c, all: [], fw: [], rough: [], shots: [] };
  });
  state.rounds.forEach((r) => {
    r.holes.forEach((h) => {
      h.shots.forEach((s) => {
        if (!byClub[s.clubId]) return;
        byClub[s.clubId].shots.push(s);
        if (s.distance != null && !isShotOffPlay(s) && !isReplay(s)) {
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
      isMissShot(s)
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
export function computeRoundKPI(round, clubs) {
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

export function aggregateKPI(rounds) {
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
