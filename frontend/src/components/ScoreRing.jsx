export default function ScoreRing({ score = 0 }) {
  const normalized = Math.max(0, Math.min(100, score));
  const style = {
    background: `conic-gradient(var(--primary) ${normalized * 3.6}deg, var(--border) 0deg)`,
  };

  return (
    <div className="scoreRing" style={style} aria-label={`ATS score ${normalized}`} role="img">
      <div className="scoreRingInner">
        <span>{normalized}</span>
        <small>/100</small>
      </div>
    </div>
  );
}
