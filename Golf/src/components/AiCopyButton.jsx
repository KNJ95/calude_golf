import React, { useState } from "react";
import { copyToClipboard } from "../data/helpers";

export default function AiCopyButton({ label, sublabel, onBuild, disabled }) {
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
