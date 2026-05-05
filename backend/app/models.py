from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class KeywordCategory(str, Enum):
    MUST_HAVE = "MUST_HAVE"
    GOOD_TO_HAVE = "GOOD_TO_HAVE"


class ExperienceItem(BaseModel):
    role: str = ""
    company: str = ""
    duration: str = ""
    responsibilities: List[str] = Field(default_factory=list)


class ParsedResume(BaseModel):
    raw_text: str
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: List[str] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    formatting_warnings: List[str] = Field(default_factory=list)


class ParsedJobDescription(BaseModel):
    raw_text: str
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    experience_level: str = ""
    keywords: Dict[KeywordCategory, List[str]] = Field(
        default_factory=lambda: {
            KeywordCategory.MUST_HAVE: [],
            KeywordCategory.GOOD_TO_HAVE: [],
        }
    )


class ScoreBreakdown(BaseModel):
    keywords: float
    skills: float
    experience: float
    formatting: float


class GapReport(BaseModel):
    missing_keywords: List[str] = Field(default_factory=list)
    missing_tools_technologies: List[str] = Field(default_factory=list)
    weak_experience_areas: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    simple_explanation: str = ""


class OptimizedResume(BaseModel):
    markdown: str
    improved_summary: str
    enhanced_bullets: List[str] = Field(default_factory=list)
    truthfulness_notes: List[str] = Field(default_factory=list)


class AnalyzeResponse(BaseModel):
    score: int
    breakdown: ScoreBreakdown
    parsed_resume: ParsedResume
    parsed_job_description: ParsedJobDescription
    gap_report: GapReport
    optimized_resume: OptimizedResume


class AnalyzeTextRequest(BaseModel):
    resume_text: str
    job_description: str


class DocxExportRequest(BaseModel):
    markdown: str
    filename: Optional[str] = "optimized_resume.docx"
