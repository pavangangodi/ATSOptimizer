from __future__ import annotations

import re
from typing import Dict, List

from app.models import ExperienceItem, ParsedResume
from app.services.nlp import clean_text, extract_known_terms, split_lines


HEADING_PATTERN = re.compile(
    r"^(summary|profile|skills|technical skills|experience|work experience|professional experience|education|projects|certifications)\s*$",
    re.IGNORECASE,
)


def parse_resume(text: str) -> ParsedResume:
    cleaned = clean_text(text)
    lines = split_lines(cleaned)
    sections = _sectionize(lines)
    contact = _extract_contact(cleaned)

    skills_text = "\n".join(sections.get("skills", []) + sections.get("technical skills", []))
    skills = extract_known_terms(skills_text or cleaned)

    return ParsedResume(
        raw_text=cleaned,
        name=_extract_name(lines),
        email=contact["email"],
        phone=contact["phone"],
        skills=skills,
        experience=_extract_experience(sections, cleaned),
        education=sections.get("education", []),
        projects=sections.get("projects", []),
        formatting_warnings=_formatting_warnings(cleaned, lines),
    )


def _extract_name(lines: List[str]) -> str:
    for line in lines[:8]:
        if "@" in line or re.search(r"\d{3,}", line):
            continue
        if HEADING_PATTERN.match(line):
            continue
        if 2 <= len(line.split()) <= 5:
            return line
    return ""


def _extract_contact(text: str) -> Dict[str, str]:
    email = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone = re.search(r"(?:\+?\d[\d\s().-]{8,}\d)", text)
    return {
        "email": email.group(0) if email else "",
        "phone": phone.group(0).strip() if phone else "",
    }


def _sectionize(lines: List[str]) -> Dict[str, List[str]]:
    sections: Dict[str, List[str]] = {}
    current = "header"
    sections[current] = []

    for line in lines:
        heading = HEADING_PATTERN.match(line)
        if heading:
            current = heading.group(1).lower()
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)

    return sections


def _extract_experience(sections: Dict[str, List[str]], full_text: str) -> List[ExperienceItem]:
    lines = (
        sections.get("experience")
        or sections.get("work experience")
        or sections.get("professional experience")
        or []
    )
    if not lines:
        lines = _fallback_experience_lines(full_text)

    items: List[ExperienceItem] = []
    current = ExperienceItem()

    for line in lines:
        looks_like_title = bool(
            re.search(r"\b(engineer|developer|tester|analyst|manager|lead|architect|intern|qa|sdet)\b", line, re.I)
            and not line.startswith(("Built ", "Created ", "Managed ", "Worked ", "Tested ", "Developed "))
        )
        has_duration = bool(re.search(r"\b(20\d{2}|19\d{2}|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b", line, re.I))

        if looks_like_title and (has_duration or len(line.split()) <= 12):
            if current.role or current.responsibilities:
                items.append(current)
            role, company, duration = _parse_experience_header(line)
            current = ExperienceItem(role=role, company=company, duration=duration, responsibilities=[])
        elif line:
            current.responsibilities.append(line)

    if current.role or current.responsibilities:
        items.append(current)

    return items[:8]


def _parse_experience_header(line: str) -> tuple[str, str, str]:
    duration_match = re.search(
        r"((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*20\d{2}\s*[-–]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\.?\s*20\d{2})|20\d{2}\s*[-–]\s*(?:present|current|20\d{2}))",
        line,
        re.I,
    )
    duration = duration_match.group(1) if duration_match else ""
    header = line.replace(duration, "").strip(" |-–")
    parts = re.split(r"\s+\bat\b\s+|\s+-\s+|\s+\|\s+", header, maxsplit=1, flags=re.I)
    role = parts[0].strip()
    company = parts[1].strip() if len(parts) > 1 else ""
    return role, company, duration


def _fallback_experience_lines(text: str) -> List[str]:
    lines = split_lines(text)
    return [line for line in lines if re.search(r"\b(engineer|developer|tester|analyst|qa|sdet|automation)\b", line, re.I)]


def _formatting_warnings(text: str, lines: List[str]) -> List[str]:
    warnings: List[str] = []
    if len(text) < 400:
        warnings.append("Resume text is very short; ATS systems may not have enough evidence.")
    if not any(HEADING_PATTERN.match(line) for line in lines):
        warnings.append("Standard section headings were not detected.")
    if any(len(line) > 180 for line in lines):
        warnings.append("Some lines are very long; shorter bullets are easier to scan.")
    if re.search(r"\t{2,}|\|{2,}", text):
        warnings.append("Possible table-like formatting detected; ATS-friendly resumes should avoid tables.")
    return warnings
