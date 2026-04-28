import { DEFAULT_COURSES } from "./constants";

// ===== コースマスターヘルパー =====

// venueに紐づくティー一覧（重複排除）
export function getTeesForVenue(venue, courseMastersOverride) {
  if (!venue) return [];
  const tees = new Set();
  (courseMastersOverride || []).forEach((c) => {
    if (c.venue === venue && c.tee) tees.add(c.tee);
  });
  DEFAULT_COURSES.forEach((c) => {
    if (c.venue === venue && c.tee) tees.add(c.tee);
  });
  // Blue → White → Red → Gold → その他（アルファベット順）の順でソート
  const order = { Blue: 0, White: 1, Red: 2, Gold: 3 };
  return Array.from(tees).sort((a, b) => {
    const av = a in order ? order[a] : 99;
    const bv = b in order ? order[b] : 99;
    if (av !== bv) return av - bv;
    return a.localeCompare(b);
  });
}

// venue+teeに紐づくコース名一覧
export function getCoursesForVenueAndTee(venue, tee, courseMastersOverride) {
  if (!venue) return [];
  const result = [];
  const seen = new Set();
  (courseMastersOverride || []).forEach((c) => {
    if (c.venue === venue && (!tee || c.tee === tee) && !seen.has(c.course)) {
      result.push(c);
      seen.add(c.course);
    }
  });
  DEFAULT_COURSES.forEach((c) => {
    if (c.venue === venue && (!tee || c.tee === tee) && !seen.has(c.course)) {
      result.push(c);
      seen.add(c.course);
    }
  });
  return result;
}

export function findCourseMaster(venue, courseName, tee, courseMastersOverride) {
  if (!venue || !courseName) return null;
  // tee指定あり：venue+course+tee完全一致を探す
  if (tee) {
    const override = (courseMastersOverride || []).find(
      (c) => c.venue === venue && c.course === courseName && c.tee === tee
    );
    if (override) return override;
    return (
      DEFAULT_COURSES.find(
        (c) => c.venue === venue && c.course === courseName && c.tee === tee
      ) || null
    );
  }
  // tee指定なし：互換用、最初に見つかったもの
  const override = (courseMastersOverride || []).find(
    (c) => c.venue === venue && c.course === courseName
  );
  if (override) return override;
  return (
    DEFAULT_COURSES.find((c) => c.venue === venue && c.course === courseName) ||
    null
  );
}

export function upsertCourseMaster(prevMasters, venue, courseName, tee, holes) {
  if (!venue || !courseName) return prevMasters;
  const idx = prevMasters.findIndex(
    (c) =>
      c.venue === venue &&
      c.course === courseName &&
      (c.tee || null) === (tee || null)
  );
  if (idx >= 0) {
    return prevMasters.map((c, i) =>
      i === idx ? { ...c, holes, updatedAt: Date.now() } : c
    );
  }
  return [
    ...prevMasters,
    {
      venue,
      course: courseName,
      tee: tee || null,
      holes,
      updatedAt: Date.now(),
    },
  ];
}
