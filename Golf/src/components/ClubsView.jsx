import React, { useState, useMemo } from "react";
import { Trash2, Check, Plus, ChevronLeft } from "../icons";
import { uid } from "../data/helpers";

export default function ClubsView({ state, setState, onBack }) {
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
