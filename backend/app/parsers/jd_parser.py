from __future__ import annotations

import re
from typing import List

from app.models import KeywordCategory, ParsedJobDescription
from app.services.nlp import clean_text, display_skill, extract_known_terms, normalize_skill, split_lines


REQUIRED_HINTS = (
    "required",
    "must have",
    "must-have",
    "requirements",
    "responsibilities",
    "qualifications",
)
PREFERRED_HINTS = ("preferred", "nice to have", "good to have", "bonus", "plus")


def parse_job_description(text: str) -> ParsedJobDescription:
    cleaned = clean_text(text)
    lines = split_lines(cleaned)
    required_chunks = _collect_chunks(lines, REQUIRED_HINTS)
    preferred_chunks = _collect_chunks(lines, PREFERRED_HINTS)

    all_terms = extract_known_terms(cleaned)
    required_skills = _dedupe(
        extract_known_terms("\n".join(required_chunks)) or _terms_near_requirement_words(lines) or all_terms
    )
    preferred_skills = _dedupe(extract_known_terms("\n".join(preferred_chunks)))

    required_norm = {normalize_skill(skill) for skill in required_skills}
    preferred_skills = [skill for skill in preferred_skills if normalize_skill(skill) not in required_norm]

    must_keywords = _dedupe(required_skills + _extract_domain_keywords("\n".join(required_chunks)))
    good_keywords = _dedupe(preferred_skills + _extract_domain_keywords("\n".join(preferred_chunks)))
    if not must_keywords:
        must_keywords = _dedupe(all_terms[:12])

    return ParsedJobDescription(
        raw_text=cleaned,
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        experience_level=_extract_experience_level(cleaned),
        keywords={
            KeywordCategory.MUST_HAVE: must_keywords,
            KeywordCategory.GOOD_TO_HAVE: good_keywords,
        },
    )


def _collect_chunks(lines: List[str], hints: tuple[str, ...]) -> List[str]:
    chunks: List[str] = []
    active = False

    for line in lines:
        normalized = line.lower()
        if active and hints == REQUIRED_HINTS and any(hint in normalized for hint in PREFERRED_HINTS):
            active = False
        if any(hint in normalized for hint in hints):
            active = True
            chunks.append(line)
            continue
        if active and re.search(r"^(about|benefits|salary|location|company|what we offer)\b", normalized):
            active = False
        if active:
            chunks.append(line)

    return chunks


def _terms_near_requirement_words(lines: List[str]) -> List[str]:
    terms: List[str] = []
    for line in lines:
        if any(hint in line.lower() for hint in REQUIRED_HINTS):
            terms.extend(extract_known_terms(line))
    return _dedupe(terms)


def _extract_domain_keywords(text: str) -> List[str]:
    phrases = re.findall(r"\b(?:agile|scrum|microservices|regression testing|smoke testing|e2e|bdd|ci/cd|defect tracking|test strategy|cross browser)\b", text, re.I)
    return _dedupe(display_skill(phrase) for phrase in phrases)


def _extract_experience_level(text: str) -> str:
    years = re.search(r"(\d+)\+?\s*(?:years|yrs)\s+(?:of\s+)?experience", text, re.I)
    if years:
        return f"{years.group(1)}+ years"
    if re.search(r"\b(senior|lead|principal|staff)\b", text, re.I):
        return "Senior"
    if re.search(r"\b(junior|entry level|fresher|graduate)\b", text, re.I):
        return "Entry level"
    if re.search(r"\b(mid-level|mid level)\b", text, re.I):
        return "Mid-level"
    return "Not specified"


def _dedupe(values) -> List[str]:
    seen = set()
    output = []
    for value in values:
        key = normalize_skill(str(value))
        if key and key not in seen:
            seen.add(key)
            output.append(display_skill(key))
    return output
