import React from "react";
import { Flag, BarChart3, Settings } from "../icons";

export default function BottomNav({ active, onNavigate }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${active === "home" ? "active" : ""}`}
        onClick={() => onNavigate("home")}
      >
        <Flag size={20} />
        <span>ラウンド</span>
      </button>
      <button
        className={`nav-btn ${active === "analytics" ? "active" : ""}`}
        onClick={() => onNavigate("analytics")}
      >
        <BarChart3 size={20} />
        <span>分析</span>
      </button>
      <button
        className={`nav-btn ${active === "clubs" ? "active" : ""}`}
        onClick={() => onNavigate("clubs")}
      >
        <Settings size={20} />
        <span>クラブ</span>
      </button>
    </nav>
  );
}
