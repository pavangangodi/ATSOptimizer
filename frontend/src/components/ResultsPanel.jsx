import { Download } from 'lucide-react';
import BreakdownBar from './BreakdownBar.jsx';
import Button from './Button.jsx';
import ScoreRing from './ScoreRing.jsx';

export default function ResultsPanel({ result, onDownload }) {
  const { breakdown, gap_report: gaps, optimized_resume: optimized } = result;

  return (
    <div className="resultsStack">
      <section className="scoreCard">
        <ScoreRing score={result.score} />
        <div className="scoreDetails">
          <p className="sectionKicker">Match score</p>
          <h3>ATS readiness</h3>
          <p>{gaps.simple_explanation}</p>
          <BreakdownBar label="Keyword Match" value={breakdown.keywords} type="keywords" />
          <BreakdownBar label="Skills Match" value={breakdown.skills} type="skills" />
          <BreakdownBar label="Experience Relevance" value={breakdown.experience} type="experience" />
          <BreakdownBar label="Formatting and Readability" value={breakdown.formatting} type="formatting" />
        </div>
      </section>

      <div className="twoColumn">
        <GapList title="Missing keywords" items={gaps.missing_keywords} />
        <GapList title="Missing tools" items={gaps.missing_tools_technologies} />
      </div>

      <section className="resultBlock">
        <h3>Weak experience areas</h3>
        <List items={gaps.weak_experience_areas} fallback="No major weak experience areas detected." />
      </section>

      <section className="resultBlock">
        <h3>Suggestions</h3>
        <List items={gaps.suggestions} />
      </section>

      <section className="resultBlock optimizedBlock">
        <div className="blockHeader">
          <h3>Optimized resume</h3>
          <Button type="button" variant="secondary" onClick={onDownload}>
            <Download size={16} />
            DOCX
          </Button>
        </div>
        <pre className="optimizedResume">{optimized.markdown}</pre>
      </section>
    </div>
  );
}

function GapList({ title, items }) {
  return (
    <section className="resultBlock compact">
      <h3>{title}</h3>
      <List items={items} fallback="None detected." />
    </section>
  );
}

function List({ items, fallback = 'No items.' }) {
  if (!items?.length) return <p className="muted">{fallback}</p>;
  return (
    <ul className="cleanList">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
