import { Eye, FileText, Target } from 'lucide-react';
import ResultsPanel from './ResultsPanel.jsx';

function excerpt(value, fallback) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 760 ? `${trimmed.slice(0, 760)}...` : trimmed;
}

export default function LivePreview({ form, activeStep, resumeText, result, template, generationMode, onDownload }) {
  return (
    <aside className="previewPanel glassPanel revealItem" aria-label="Live resume preview">
      <div className="previewHeader">
        <div>
          <p className="sectionKicker">Live preview</p>
          <h2>{result ? 'ATS report' : 'Resume workspace'}</h2>
        </div>
        <div className="previewBadges">
          <span className="previewStep">{template.name}</span>
          <span className="previewStep">Step {activeStep + 1}/3</span>
        </div>
      </div>

      {result ? (
        <ResultsPanel result={result} template={template} generationMode={generationMode} onDownload={onDownload} />
      ) : (
        <div className="previewStack">
          <section className="previewCard">
            <div className="previewCardHeader">
              <FileText size={18} />
              <h3>Resume draft</h3>
            </div>
            {form.file && <p className="fileChip">{form.file.name}</p>}
            <pre className="previewDocument">{excerpt(resumeText, 'Resume content will appear as you paste, upload, or build sections.')}</pre>
          </section>

          <section className="previewCard">
            <div className="previewCardHeader">
              <Target size={18} />
              <h3>Target match source</h3>
            </div>
            <p className="previewText">
              {excerpt(form.jobDescription, 'Paste a job description to prepare the match analysis.')}
            </p>
          </section>

          <section className="emptyReport">
            <Eye size={24} />
            <div>
              <h3>Score report preview</h3>
              <p>After analysis, this panel becomes the scoring dashboard with gaps, suggestions, and DOCX export.</p>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
