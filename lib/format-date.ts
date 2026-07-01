const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// "1:35 PM"
const formatTime = (date: Date) =>
  date.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

// 짧은 상대 라벨:
//   오늘   → 시간만        ("1:35 PM")
//   어제   → "Yesterday"
//   올해   → "Apr 17"
//   다른 해 → "Apr 17, 2025"
export const formatRelativeDate = (date: Date, now: Date = new Date()) => {
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff <= 0) return formatTime(date);
  if (dayDiff === 1) return "Yesterday";
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

// 전체(툴팁용): "Jul 1, 2026, 1:35 PM"
export const formatFullDateTime = (date: Date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
