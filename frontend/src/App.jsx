import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileCheck2,
  Layers3,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Target,
  Terminal,
  UploadCloud,
} from 'lucide-react';
import AnimatedCounter from './components/AnimatedCounter.jsx';
import Button from './components/Button.jsx';
import FileDrop from './components/FileDrop.jsx';
import FloatingTechStack from './components/FloatingTechStack.jsx';
import LivePreview from './components/LivePreview.jsx';
import ResumeSectionBuilder from './components/ResumeSectionBuilder.jsx';
import Stepper from './components/Stepper.jsx';
import TemplateSelector from './components/TemplateSelector.jsx';
import TextAreaField from './components/TextAreaField.jsx';
import { atsTemplates, defaultTemplateId, formatExampleResume, getTemplateById } from './data/resumeTemplates.js';
import { analyzeResume, loadSample } from './lib/api.js';
import { applyTemplateToAnalysis, generateLocalAnalysis } from './lib/localGenerator.js';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    title: 'Source',
    description: 'Resume and template',
  },
  {
    title: 'Target',
    description: 'Role signals',
  },
  {
    title: 'Generate',
    description: 'Score and export',
  },
];

const timeline = [
  ['01', 'Parse', 'Upload or paste resume evidence into a clean ATS structure.'],
  ['02', 'Match', 'Compare skills, keywords, and experience against the JD.'],
  ['03', 'Generate', 'Create a recruiter-readable resume with the selected template.'],
];

const skillMeters = [
  ['ATS readability', 92],
  ['Keyword alignment', 84],
  ['Template control', 88],
  ['Export readiness', 90],
];

function createInitialForm() {
  return {
    resumeText: '',
    jobDescription: '',
    file: null,
    fileText: '',
    templateId: defaultTemplateId,
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

  return [form.resumeText.trim(), form.fileText.trim(), builderText].filter(Boolean).join('\n\n');
}

function countWords(value) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function makeExampleJobDescription(template) {
  const skills = template.example.skills.join(', ');
  return [
    `${template.example.title} role`,
    '',
    'Responsibilities',
    `Build, validate, and maintain high-quality work using ${skills}.`,
    'Collaborate with product and engineering teams in Agile delivery.',
    'Create clear documentation, reports, and measurable improvements.',
    '',
    'Required skills',
    skills,
    '',
    'Preferred',
    'Strong communication, ownership, and experience with CI/CD workflows.',
  ].join('\n');
}

export default function App() {
  const shellRef = useRef(null);
  const [form, setForm] = useState(() => createInitialForm());
  const [result, setResult] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [fileExtracting, setFileExtracting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generationMode, setGenerationMode] = useState('');

  const template = useMemo(() => getTemplateById(form.templateId), [form.templateId]);
  const resumePayload = useMemo(() => buildResumeText(form), [form]);
  const resumeWordCount = countWords(resumePayload);
  const jdWordCount = countWords(form.jobDescription);
  const hasResumeInput = Boolean(form.file || resumePayload);
  const hasLocalResumeText = Boolean(resumePayload.trim());
  const hasJobDescription = Boolean(form.jobDescription.trim());
  const canAnalyze = hasResumeInput && hasJobDescription && !fileExtracting;
  const canGoNext =
    activeStep === 0 ? hasResumeInput && !fileExtracting : activeStep === 1 ? hasJobDescription : false;

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    let frameId;
    const raf = (time) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.revealItem').forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: 'power3.out',
            immediateRender: false,
            scrollTrigger: {
              trigger: item,
              start: 'top 86%',
            },
          },
        );
      });
    }, shellRef);

    return () => ctx.revert();
  }, []);

  function handlePointerMove(event) {
    const bounds = shellRef.current?.getBoundingClientRect();
    if (!bounds) return;
    shellRef.current.style.setProperty('--mouse-x', `${event.clientX - bounds.left}px`);
    shellRef.current.style.setProperty('--mouse-y', `${event.clientY - bounds.top}px`);
  }

  async function handleSample() {
    setSampleLoading(true);
    setError('');
    setNotice('');
    try {
      const sample = await loadSample();
      setForm({
        ...createInitialForm(),
        templateId: form.templateId,
        resumeText: sample.resume_text,
        jobDescription: sample.job_description,
      });
      setNotice('Loaded backend sample data.');
    } catch {
      applyTemplateExample(form.templateId);
      setNotice('Backend sample was unavailable, so a local template example was loaded.');
    } finally {
      setResult(null);
      setActiveStep(0);
      setSampleLoading(false);
    }
  }

  function applyTemplateExample(templateId = form.templateId) {
    const selected = getTemplateById(templateId);
    setForm({
      ...createInitialForm(),
      templateId,
      resumeText: formatExampleResume(selected),
      jobDescription: makeExampleJobDescription(selected),
    });
    setResult(null);
    setActiveStep(0);
  }

  async function handleFileChange(file) {
    setError('');
    setNotice('');
    setResult(null);
    setForm((current) => ({ ...current, file, fileText: '' }));
    if (!file) return;

    setFileExtracting(true);
    try {
      const { extractResumeFileText } = await import('./lib/fileExtractors.js');
      const fileText = await extractResumeFileText(file);
      setForm((current) => ({ ...current, fileText }));
      if (fileText.trim()) {
        setNotice(`Extracted ${countWords(fileText)} words from ${file.name}.`);
      } else {
        setNotice('File attached. If the backend is unavailable, paste resume text as a fallback.');
      }
    } catch (err) {
      setNotice(`File attached, but browser extraction failed: ${err.message}. Backend parsing may still work.`);
    } finally {
      setFileExtracting(false);
    }
  }

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!canAnalyze) return;

    setActiveStep(2);
    setLoading(true);
    setError('');
    setNotice('');

    try {
      let data;
      try {
        data = await analyzeResume({ ...form, resumeText: resumePayload });
        data = applyTemplateToAnalysis(data, template);
        setGenerationMode('api');
      } catch (apiError) {
        if (!hasLocalResumeText) {
          throw new Error(
            `The backend could not read this upload and no local text was available. Paste resume text or start the backend. Original error: ${apiError.message}`,
          );
        }
        data = generateLocalAnalysis({
          resumeText: resumePayload,
          jobDescription: form.jobDescription,
          template,
        });
        setGenerationMode('browser');
        setNotice(`Generated locally because the backend was unavailable: ${apiError.message}`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!result?.optimized_resume?.markdown) return;
    const safeName = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { downloadResumeDocx } = await import('./lib/docxExporter.js');
    await downloadResumeDocx(result.optimized_resume.markdown, `${safeName || 'optimized'}-resume.docx`);
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
    <main className="appShell" ref={shellRef} onPointerMove={handlePointerMove}>
      <div className="spotlightLayer" aria-hidden="true" />
      <div className="meshBackdrop" aria-hidden="true" />
      <FloatingTechStack />

      <header className="topNav">
        <div className="brandCluster">
          <div className="brandMark" aria-hidden="true">
            <FileCheck2 size={20} />
          </div>
          <span>ATS Optimizer</span>
        </div>
        <nav aria-label="Page sections">
          <a href="#builder">Builder</a>
          <a href="#templates">Templates</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="heroSection revealItem">
        <div className="heroCopy">
          <div className="terminalHero">
            <div className="terminalBar">
              <span />
              <span />
              <span />
            </div>
            <p>
              <Terminal size={16} />
              pavan@ats-builder ~ % generate --template {template.id}
            </p>
            <h1>Generate a premium ATS resume from your real experience.</h1>
            <pre>{`> parsing resume evidence
> matching target role signals
> exporting ${template.name} DOCX`}</pre>
          </div>
          <div className="heroActions">
            <Button type="button" onClick={() => document.getElementById('builder')?.scrollIntoView({ behavior: 'smooth' })}>
              <Sparkles size={18} />
              Start builder
            </Button>
            <Button type="button" variant="secondary" onClick={handleSample} disabled={sampleLoading}>
              {sampleLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              Load sample
            </Button>
          </div>
        </div>

        <div className="heroMetrics">
          <MetricCard label="Templates" value={atsTemplates.length} icon={<Layers3 size={18} />} />
          <MetricCard label="Resume words" value={resumeWordCount} icon={<UploadCloud size={18} />} />
          <MetricCard label="Target words" value={jdWordCount} icon={<Target size={18} />} />
        </div>
      </section>

      <section className="bentoGrid" aria-label="Portfolio resume sections">
        <BentoCard className="aboutCard" title="About" icon={<FileCheck2 size={18} />}>
          <p>Minimal, ATS-readable resume generation with glass panels, live preview, and local fallback generation.</p>
        </BentoCard>

        <BentoCard title="Skills" icon={<Code2 size={18} />}>
          <div className="skillStack">
            {skillMeters.map(([label, value]) => (
              <SkillMeter key={label} label={label} value={value} />
            ))}
          </div>
        </BentoCard>

        <BentoCard className="experienceCard" title="Experience" icon={<BriefcaseBusiness size={18} />}>
          <div className="timeline">
            {timeline.map(([number, title, body]) => (
              <div className="timelineItem" key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        <BentoCard title="Projects" icon={<Sparkles size={18} />}>
          <p>{template.example.projects[0]}</p>
        </BentoCard>

        <BentoCard title="Certifications" icon={<Award size={18} />}>
          <ul className="miniList">
            {template.example.certifications.map((certification) => (
              <li key={certification}>{certification}</li>
            ))}
          </ul>
        </BentoCard>

        <BentoCard id="contact" title="Contact" icon={<Mail size={18} />}>
          <p>Export a DOCX resume and keep edits ATS friendly, readable, and role specific.</p>
        </BentoCard>
      </section>

      <section className="workspaceSection" id="builder">
        <div className="workspaceHeader revealItem">
          <div>
            <p className="sectionKicker">Resume generator</p>
            <h2>Split builder with live preview.</h2>
          </div>
          <div className="headerActions">
            <div className="statusBadge">
              <span>{generationMode || 'ready'}</span>
              generation
            </div>
            <Button type="button" variant="secondary" onClick={handleSample} disabled={sampleLoading}>
              {sampleLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              Load sample
            </Button>
          </div>
        </div>

        <section className="workspaceGrid" aria-label="Resume builder workspace">
          <form className="builderPanel glassPanel revealItem" onSubmit={handleAnalyze}>
            <Stepper
              steps={steps}
              activeStep={activeStep}
              onStepChange={setActiveStep}
              canVisitStep={canVisitStep}
            />

            <div className="stepViewport">
              <AnimatePresence mode="wait">
                {activeStep === 0 && (
                  <motion.section
                    className="stepContent"
                    key="source-step"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="panelIntro">
                      <p className="sectionKicker">Step 1</p>
                      <h2>Source and template</h2>
                      <p>Upload a resume, paste text, or start from a template example.</p>
                    </div>

                    <TemplateSelector
                      templates={atsTemplates}
                      selectedTemplateId={form.templateId}
                      onSelect={(templateId) => {
                        setForm((current) => ({ ...current, templateId }));
                        setResult(null);
                      }}
                      onUseExample={() => applyTemplateExample(form.templateId)}
                    />

                    <FileDrop file={form.file} onChange={handleFileChange} loading={fileExtracting} />

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
                  </motion.section>
                )}

                {activeStep === 1 && (
                  <motion.section
                    className="stepContent"
                    key="target-step"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="panelIntro">
                      <p className="sectionKicker">Step 2</p>
                      <h2>Target role</h2>
                      <p>Paste the job description for keyword, skill, and responsibility matching.</p>
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
                        <span>{template.name}</span>
                        selected template
                      </div>
                    </div>
                  </motion.section>
                )}

                {activeStep === 2 && (
                  <motion.section
                    className="stepContent"
                    key="generate-step"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="panelIntro">
                      <p className="sectionKicker">Step 3</p>
                      <h2>Generate resume</h2>
                      <p>Create an ATS score, gap report, and DOCX-ready resume using the selected template.</p>
                    </div>

                    <div className="reviewGrid">
                      <ReviewTile label="Resume" value={form.file ? form.file.name : `${resumeWordCount} words`} state={hasResumeInput ? 'Ready' : 'Needed'} />
                      <ReviewTile label="Template" value={template.name} state={template.density} />
                      <ReviewTile label="Output" value={result ? 'Generated' : 'Waiting'} state={generationMode || 'Pending'} />
                    </div>

                    {result && (
                      <div className="completionNote">
                        <Sparkles size={18} />
                        <div>
                          <strong>Resume generated</strong>
                          <span>Review the live preview and export the DOCX when it looks right.</span>
                        </div>
                      </div>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>
            </div>

            {notice && (
              <div className="noticeBox">
                <Sparkles size={16} />
                {notice}
              </div>
            )}

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
                  Generate resume
                </Button>
              )}
            </div>
          </form>

          <LivePreview
            form={form}
            activeStep={activeStep}
            resumeText={resumePayload}
            result={result}
            template={template}
            generationMode={generationMode}
            onDownload={handleDownload}
          />
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <motion.div className="metricCard glassPanel" whileHover={{ y: -4, scale: 1.02 }}>
      {icon}
      <strong>
        <AnimatedCounter value={value} />
      </strong>
      <span>{label}</span>
    </motion.div>
  );
}

function BentoCard({ title, icon, children, className = '', id }) {
  return (
    <article className={`bentoCard glassPanel revealItem ${className}`} id={id}>
      <div className="bentoTitle">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </article>
  );
}

function SkillMeter({ label, value }) {
  return (
    <div className="skillMeter">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <i>
        <span style={{ width: `${value}%` }} />
      </i>
    </div>
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
