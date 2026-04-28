import React, { useState } from "react";

export default function Tutorial({ onClose }) {
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
            OB後の打ち直しは<b>「打ち直し」チェック</b>を入れると、
            距離分析から自動的に除外されます。
          </p>
          <p>
            ホール下部の<b>スコア入力</b>でそのホールの打数を手入力。
            ペナや打ち直しを含めた正確なスコアを残せます。
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
