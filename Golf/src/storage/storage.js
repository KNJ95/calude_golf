import { STORAGE_KEY, DEFAULT_CLUBS, LEGACY_RESULT_MAP } from "../data/constants";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// v1.0 → v2.0 マイグレーション
// shot.result → shot.selfRating + shot.outcome
// hole に manualScore を補完（未入力なら shots.length）
export function migrateState(state) {
  if (!state || !state.rounds) return state;

  let migrated = false;
  const newRounds = state.rounds.map((round) => {
    const newHoles = round.holes.map((hole) => {
      // ショットのマイグレーション
      const newShots = (hole.shots || []).map((shot) => {
        // 既にv2.0形式（selfRating または outcome がある）ならそのまま
        if ("selfRating" in shot || "outcome" in shot) return shot;

        // v1.0形式（result がある）なら変換
        if ("result" in shot && shot.result) {
          migrated = true;
          const map = LEGACY_RESULT_MAP[shot.result] || {
            selfRating: null,
            outcome: "in_play",
          };
          return {
            ...shot,
            selfRating: map.selfRating,
            outcome: map.outcome,
          };
        }
        // result すらないなら新形式の空値で補完
        return { ...shot, selfRating: null, outcome: "in_play" };
      });

      // ホールに manualScore がなければ shots.length で補完（旧データ救済）
      let manualScore = hole.manualScore;
      if (manualScore === undefined && newShots.length > 0) {
        manualScore = newShots.length;
        migrated = true;
      }

      return {
        ...hole,
        shots: newShots,
        ...(manualScore !== undefined ? { manualScore } : {}),
      };
    });

    return { ...round, holes: newHoles };
  });

  if (!migrated) return state;
  return { ...state, rounds: newRounds, _v: 2 };
}

export const initialState = () => {
  const loaded = loadState();
  if (loaded) {
    if (loaded.clubs) {
      loaded.clubs = loaded.clubs.map((c) => {
        if ("avgDistance" in c) return c;
        const def = DEFAULT_CLUBS.find((d) => d.id === c.id);
        return { ...c, avgDistance: def?.avgDistance ?? null };
      });
    }
    if (!loaded.courseMasters) loaded.courseMasters = [];
    return migrateState(loaded);
  }
  return {
    clubs: DEFAULT_CLUBS,
    rounds: [],
    courseMasters: [],
    unit: "yd",
    _v: 2,
  };
};
