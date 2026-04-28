import React, { useState } from "react";
import { Trash2 } from "../icons";
import { fmtDate } from "../data/helpers";

export default function DeleteConfirmModal({
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
