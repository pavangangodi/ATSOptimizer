# ATS Resume Analyzer and Optimizer

A complete FastAPI + React tool that parses a resume, parses a job description, calculates an ATS match score, explains gaps in simple terms, and generates an ATS-friendly optimized resume in Markdown with DOCX export.

The frontend includes a premium dark SaaS interface with a stepper-based resume builder, split form/live-preview workspace, animated section controls, score dashboard, and DOCX export flow.

## Folder Structure

```text
ATSOptimizer/
  backend/
    app/
      main.py
      models.py
      samples.py
      parsers/
        jd_parser.py
        resume_parser.py
        text_extractor.py
      services/
        docx_exporter.py
        nlp.py
        optimizer.py
        scoring.py
    requirements.txt
  frontend/
    src/
      components/
        BreakdownBar.jsx
        Button.jsx
        FileDrop.jsx
        LivePreview.jsx
        ResultsPanel.jsx
        ResumeSectionBuilder.jsx
        ScoreRing.jsx
        Stepper.jsx
        TextAreaField.jsx
      lib/
        api.js
      App.jsx
      main.jsx
      styles.css
    index.html
    package.json
  samples/
    resume.txt
    job_description.txt
    sample_output.json
```

## Features

- Resume upload: PDF, DOCX, TXT, or pasted text.
- Structured resume parsing: name, contact, skills, experience, education, projects.
- Skill normalization: examples include `JS` to `JavaScript`, `nodejs` to `Node.js`, and `CI CD` to `CI/CD`.
- Deterministic NLP is included. spaCy or transformer embeddings can be added later as optional ranking enhancers without changing the API contract.
- JD parsing: required skills, preferred skills, experience level, and categorized `MUST_HAVE` / `GOOD_TO_HAVE` keywords.
- Weighted ATS score:
  - Keyword Match: 40%
  - Skills Match: 30%
  - Experience Relevance: 20%
  - Formatting and Readability: 10%
- Gap report with missing keywords, missing tools, weak experience areas, and realistic suggestions.
- Resume optimization engine that improves summary and bullets without fabricating employers, roles, tools, projects, certifications, or metrics.
- DOCX export for the optimized resume.
- Bonus: plain-English explanation for why the score is low.

## Setup

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If your Windows Python venv fails during `ensurepip`, you can install into the local venv folder directly:

```powershell
cd backend
python -m pip install --target .venv\Lib\site-packages -r requirements.txt
$env:PYTHONPATH = ".venv\Lib\site-packages;."
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

This repository also includes `backend\run_server.ps1`, which applies that `PYTHONPATH` workaround and starts the API:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\run_server.ps1
```

Backend health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

### 2. Frontend

Open a second PowerShell terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Then open:

```text
http://127.0.0.1:5173
```

## API Examples

Analyze pasted text:

```powershell
$body = @{
  resume_text = [System.IO.File]::ReadAllText((Resolve-Path ..\samples\resume.txt))
  job_description = [System.IO.File]::ReadAllText((Resolve-Path ..\samples\job_description.txt))
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/api/analyze-text `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Analyze file upload:

```powershell
curl.exe -X POST http://127.0.0.1:8000/api/analyze `
  -F "resume_file=@..\samples\resume.txt" `
  -F "job_description=<..\samples\job_description.txt"
```

## Response Shape

```json
{
  "score": 78,
  "breakdown": {
    "keywords": 30,
    "skills": 20,
    "experience": 18,
    "formatting": 10
  },
  "gap_report": {
    "missing_keywords": ["Docker"],
    "missing_tools_technologies": ["GitHub Actions"],
    "weak_experience_areas": ["CI/CD experience using GitHub Actions or Jenkins"],
    "suggestions": ["Add missing tools only where they are truthful."],
    "simple_explanation": "The score is low because it is missing important JD terms."
  },
  "optimized_resume": {
    "markdown": "# Candidate Name\n...",
    "improved_summary": "Resume profile: ...",
    "enhanced_bullets": ["Automated ..."],
    "truthfulness_notes": ["No new employer, role, degree, certification, project, or metric was fabricated."]
  }
}
```

## Truthfulness Rules

The optimizer never creates fake experience. Missing JD terms are added to the optimized resume only as alignment notes unless the original resume already contains supporting evidence. For bullet metrics, it prompts the candidate to add a truthful metric rather than inventing a number.

## Optional AI Extension

The current implementation is deterministic and works without API keys. To add OpenAI generation later, keep it behind a separate service method that receives:

- parsed resume evidence
- parsed JD requirements
- missing keyword list
- truthfulness constraints

The prompt should require the model to cite which original resume line supports each optimized claim.
