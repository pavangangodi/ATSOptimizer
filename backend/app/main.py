from __future__ import annotations

import re

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.models import AnalyzeResponse, AnalyzeTextRequest, DocxExportRequest
from app.parsers.jd_parser import parse_job_description
from app.parsers.resume_parser import parse_resume
from app.parsers.text_extractor import extract_text_from_upload
from app.samples import SAMPLE_JD, SAMPLE_RESUME
from app.services.docx_exporter import markdown_to_docx
from app.services.optimizer import optimize_resume
from app.services.scoring import calculate_score


app = FastAPI(title="ATS Resume Analyzer and Optimizer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/sample")
def sample() -> dict[str, str]:
    return {"resume_text": SAMPLE_RESUME, "job_description": SAMPLE_JD}


@app.post("/api/analyze-text", response_model=AnalyzeResponse)
def analyze_text(payload: AnalyzeTextRequest) -> AnalyzeResponse:
    return _analyze(payload.resume_text, payload.job_description)


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_upload(
    job_description: str = Form(...),
    resume_text: str | None = Form(None),
    resume_file: UploadFile | None = File(None),
) -> AnalyzeResponse:
    text_parts: list[str] = []
    if resume_file:
        extracted_text = await extract_text_from_upload(resume_file)
        if extracted_text.strip():
            text_parts.append(extracted_text)
    if resume_text and resume_text.strip():
        text_parts.append(resume_text)
    if not text_parts:
        raise HTTPException(status_code=400, detail="Upload a resume file or paste resume text.")
    text = "\n\n".join(text_parts)
    return _analyze(text, job_description)


@app.post("/api/export-docx")
def export_docx(payload: DocxExportRequest) -> Response:
    filename = payload.filename or "optimized_resume.docx"
    filename = re.sub(r"[^a-zA-Z0-9_.-]", "_", filename)
    content = markdown_to_docx(payload.markdown)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _analyze(resume_text: str, job_description: str) -> AnalyzeResponse:
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text is empty.")
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is empty.")

    parsed_resume = parse_resume(resume_text)
    parsed_jd = parse_job_description(job_description)
    score, breakdown, gap_report = calculate_score(parsed_resume, parsed_jd)
    optimized = optimize_resume(parsed_resume, parsed_jd, gap_report.missing_keywords)

    return AnalyzeResponse(
        score=score,
        breakdown=breakdown,
        parsed_resume=parsed_resume,
        parsed_job_description=parsed_jd,
        gap_report=gap_report,
        optimized_resume=optimized,
    )
