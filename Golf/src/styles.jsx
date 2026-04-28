import React from "react";

export default function Style() {
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
        padding: 8px 12px;
        z-index: 7;
      }
      @media (min-width: 600px) {
        .score-input-bar { max-width: 430px; }
      }
      .score-input-bar-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: nowrap;
        justify-content: center;
      }
      .score-input-bar-label {
        font-size: 11px;
        color: var(--text-faint);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .score-input-bar-divider {
        width: 1px;
        height: 20px;
        background: var(--border-soft);
        margin: 0 4px;
      }
      .score-diff {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 2px;
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
        border-radius: 8px;
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
        height: 30px;
        font-size: 16px;
      }
      .score-input-num {
        flex: 0 0 auto;
        text-align: center;
        background: var(--bg-2);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        outline: none;
      }
      .score-input-num.small {
        width: 44px;
        height: 30px;
        font-size: 15px;
        padding: 0;
      }
      .score-input-num:focus {
        border-color: var(--green);
      }
      /* FAB の位置をスコアバー分上にずらす */
      .fab {
        position: fixed;
        right: 18px;
        /* hole-nav (64px) + score-input-bar (約50px) + 18px margin */
        bottom: calc(132px + env(safe-area-inset-bottom));
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
        padding-bottom: 130px;
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
      .app.in-csb .score-input-bar { bottom: calc(64px + 42px + env(safe-area-inset-bottom)); }
      .app.in-csb .fab { bottom: calc(132px + 42px + env(safe-area-inset-bottom)); }

      /* Standalone (本番Safari/Chrome、PWA含む) はそのままbottom指定が効く */
    `}</style>
  );
}
