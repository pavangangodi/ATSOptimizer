const MAX = {
  keywords: 40,
  skills: 30,
  experience: 20,
  formatting: 10,
};

export default function BreakdownBar({ label, value, type }) {
  const max = MAX[type] || 100;
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="breakdownRow">
      <div className="breakdownTop">
        <span>{label}</span>
        <strong>
          {value}/{max}
        </strong>
      </div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
