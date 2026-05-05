import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Button from './components/Button.jsx';
import FileDrop from './components/FileDrop.jsx';
import LivePreview from './components/LivePreview.jsx';
import ResumeSectionBuilder from './components/ResumeSectionBuilder.jsx';
import Stepper from './components/Stepper.jsx';
import TextAreaField from './components/TextAreaField.jsx';
import { analyzeResume, downloadDocx, loadSample } from './lib/api.js';

const steps = [
  {
    title: 'Resume',
    description: 'Import or build',
  },
  {
    title: 'Target',
    description: 'Role details',
  },
  {
    title: 'Optimize',
    description: 'Score and export',
  },
];

function createInitialForm() {
  return {
    resumeText: '',
    jobDescription: '',
    file: null,
    sections: [
      { id: 'summary', title: 'Professional Summary', content: '' },
      { id: 'skills', title: 'Core Skills', content: '' },
      { id: 'impact', title: 'Impact Highlights', content: '' },
    ],
  };
}

function buildResumeText(form) {
  const builderText = form.sections
    .map((section) => {
      const title = section.title.trim();
      const content = section.content.trim();
      if (!content) return '';
      return `${title || 'Resume Section'}\n${content}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return [form.resumeText.trim(), builderText].filter(Boolean).join('\n\n');
}

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default function App() {
  const [form, setForm] = useState(() => createInitialForm());
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [error, setError] = useState('');

  const resumePayload = useMemo(() => buildResumeText(form), [form]);
  const resumeWordCount = countWords(resumePayload);
  const jdWordCount = countWords(form.jobDescription);
  const hasResumeInput = Boolean(form.file || resumePayload);
  const hasJobDescription = Boolean(form.jobDescription.trim());
  const canAnalyze = hasResumeInput && hasJobDescription;
  const canGoNext =
    activeStep === 0 ? hasResumeInput : activeStep === 1 ? hasJobDescription : false;

  async function handleSample() {
    setSampleLoading(true);
    setError('');
    try {
      const sample = await loadSample();
      setForm({
        ...createInitialForm(),
        resumeText: sample.resume_text,
        jobDescription: sample.job_description,
      });
      setResult(null);
      setActiveStep(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setSampleLoading(false);
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!canAnalyze) return;

    setActiveStep(2);
    setLoading(true);
    setError('');
    try {
      const data = await analyzeResume({ ...form, resumeText: resumePayload });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result?.optimized_resume?.markdown) return;
    await downloadDocx(result.optimized_resume.markdown);
  }

  function goNext() {
    if (activeStep < steps.length - 1 && canGoNext) {
      setActiveStep((current) => current + 1);
    }
  }

  function goBack() {
    setActiveStep((current) => Math.max(0, current - 1));
  }

  function canVisitStep(index) {
    if (index === 0) return true;
    if (index === 1) return hasResumeInput;
    return canAnalyze || Boolean(result);
  }

  return (
    <main className="appShell">
      <header className="workspaceHeader">
        <div className="brandCluster">
          <div className="brandMark" aria-hidden="true">
            <FileCheck2 size={20} />
          </div>
          <div>
            <p className="eyebrowText">ATS Resume Builder</p>
            <h1>Build a sharper resume for the role.</h1>
          </div>
        </div>
        <div className="headerActions">
          <div className="statusBadge">
            <span>{resumeWordCount}</span>
            resume words
          </div>
          <Button type="button" variant="secondary" onClick={handleSample} disabled={sampleLoading}>
            {sampleLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
            Load sample
          </Button>
        </div>
      </header>

      <section className="workspaceGrid" aria-label="Resume builder workspace">
        <form className="builderPanel" onSubmit={handleAnalyze}>
          <Stepper
            steps={steps}
            activeStep={activeStep}
            onStepChange={setActiveStep}
            canVisitStep={canVisitStep}
          />

          <div className="stepViewport">
            {activeStep === 0 && (
              <section className="stepContent" key="resume-step">
                <div className="panelIntro">
                  <p className="sectionKicker">Step 1</p>
                  <h2>Resume source</h2>
                  <p>Add a file, paste existing resume text, or build sections manually.</p>
                </div>

                <FileDrop
                  file={form.file}
                  onChange={(file) => setForm((current) => ({ ...current, file }))}
                />

                <TextAreaField
                  id="resumeText"
                  label="Resume text"
                  value={form.resumeText}
                  onChange={(resumeText) => setForm((current) => ({ ...current, resumeText }))}
                  placeholder="Paste resume text here when you are not uploading a file."
                  minRows="compact"
                />

                <ResumeSectionBuilder
                  sections={form.sections}
                  onChange={(sections) => setForm((current) => ({ ...current, sections }))}
                />
              </section>
            )}

            {activeStep === 1 && (
              <section className="stepContent" key="target-step">
                <div className="panelIntro">
                  <p className="sectionKicker">Step 2</p>
                  <h2>Target role</h2>
                  <p>Paste the job description so the analyzer can compare keywords, skills, and experience relevance.</p>
                </div>

                <TextAreaField
                  id="jobDescription"
                  label="Job description"
                  value={form.jobDescription}
                  onChange={(jobDescription) => setForm((current) => ({ ...current, jobDescription }))}
                  placeholder="Paste the target JD with required and preferred skills."
                  required
                  minRows="large"
                />

                <div className="insightStrip">
                  <div>
                    <span>{jdWordCount}</span>
                    JD words
                  </div>
                  <div>
                    <span>{hasResumeInput ? 'Ready' : 'Missing'}</span>
                    resume source
                  </div>
                </div>
              </section>
            )}

            {activeStep === 2 && (
              <section className="stepContent" key="optimize-step">
                <div className="panelIntro">
                  <p className="sectionKicker">Step 3</p>
                  <h2>Analyze and optimize</h2>
                  <p>Generate an ATS score, gap report, and truthful optimized resume draft.</p>
                </div>

                <div className="reviewGrid">
                  <ReviewTile
                    label="Resume"
                    value={form.file ? form.file.name : `${resumeWordCount} words`}
                    state={hasResumeInput ? 'Ready' : 'Needed'}
                  />
                  <ReviewTile
                    label="Job description"
                    value={`${jdWordCount} words`}
                    state={hasJobDescription ? 'Ready' : 'Needed'}
                  />
                  <ReviewTile
                    label="Output"
                    value={result ? 'Report generated' : 'Waiting'}
                    state={result ? 'Complete' : 'Pending'}
                  />
                </div>

                {result && (
                  <div className="completionNote">
                    <Sparkles size={18} />
                    <div>
                      <strong>Optimization ready</strong>
                      <span>Review the live report and export the DOCX when it looks right.</span>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {error && (
            <div className="errorBox">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="actionFooter">
            <Button type="button" variant="ghost" onClick={goBack} disabled={activeStep === 0}>
              <ChevronLeft size={16} />
              Back
            </Button>

            {activeStep < steps.length - 1 ? (
              <Button type="button" onClick={goNext} disabled={!canGoNext}>
                Next
                <ChevronRight size={16} />
              </Button>
            ) : (
              <Button type="submit" disabled={loading || !canAnalyze}>
                {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
                Analyze resume
              </Button>
            )}
          </div>
        </form>

        <LivePreview
          form={form}
          activeStep={activeStep}
          resumeText={resumePayload}
          result={result}
          onDownload={handleDownload}
        />
      </section>
    </main>
  );
}

function ReviewTile({ label, value, state }) {
  return (
    <div className="reviewTile">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{state}</small>
    </div>
  );
}
