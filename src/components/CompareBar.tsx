export default function CompareBar({ label, home, away, suffix = "" }: { label: string; home: number; away: number; suffix?: string }) {
  const total = Math.max(home + away, 1);
  const hp = Math.round((home / total) * 100);
  const ap = 100 - hp;
  return (
    <div className="compare">
      <div className="compare__row">
        <b className={home > away ? "is-lead" : ""}>{home}{suffix}</b>
        <span>{label}</span>
        <b className={away > home ? "is-lead" : ""}>{away}{suffix}</b>
      </div>
      <div className="compare__bars">
        <div className="compare__home" style={{ width: `${hp}%` }} />
        <div className="compare__away" style={{ width: `${ap}%` }} />
      </div>
    </div>
  );
}
