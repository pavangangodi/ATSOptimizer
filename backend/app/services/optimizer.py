from __future__ import annotations

import re
from typing import List

from app.models import OptimizedResume, ParsedJobDescription, ParsedResume
from app.services.nlp import display_skill, extract_known_terms, match_strength, normalize_skill


ACTION_VERBS = ["Built", "Improved", "Automated", "Delivered", "Reduced", "Designed", "Validated", "Led"]


def optimize_resume(resume: ParsedResume, jd: ParsedJobDescription, missing_keywords: List[str]) -> OptimizedResume:
    matched_skills = _matched_skills(resume, jd)
    summary = _build_summary(resume, jd, matched_skills)
    enhanced_bullets = _enhance_bullets(resume, jd)
    markdown = _render_markdown(resume, jd, summary, enhanced_bullets, missing_keywords)

    notes = [
        "No new employer, role, degree, certification, project, or metric was fabricated.",
        "Missing JD keywords are shown as suggestions unless the resume already contains supporting evidence.",
    ]

    return OptimizedResume(
        markdown=markdown,
        improved_summary=summary,
        enhanced_bullets=enhanced_bullets,
        truthfulness_notes=notes,
    )


def _matched_skills(resume: ParsedResume, jd: ParsedJobDescription) -> List[str]:
    targets = jd.required_skills + jd.preferred_skills
    return [
        display_skill(skill)
        for skill in targets
        if match_strength(skill, resume.skills, resume.raw_text) > 0
    ][:10]


def _build_summary(resume: ParsedResume, jd: ParsedJobDescription, matched_skills: List[str]) -> str:
    role_hint = _role_hint(jd.raw_text)
    skill_phrase = ", ".join(matched_skills[:6]) if matched_skills else "role-relevant delivery"
    experience_level = "" if jd.experience_level == "Not specified" else f" for {jd.experience_level} expectations"
    name_prefix = f"{resume.name} is a " if resume.name else "Resume profile: "
    return (
        f"{name_prefix}{role_hint} candidate with hands-on experience in {skill_phrase}. "
        f"Brings evidence from existing projects and work history aligned to the job description{experience_level}, "
        "with clear focus on measurable, ATS-friendly accomplishments."
    )


def _enhance_bullets(resume: ParsedResume, jd: ParsedJobDescription) -> List[str]:
    jd_terms = extract_known_terms(jd.raw_text)
    enhanced: List[str] = []
    source_bullets = [bullet for item in resume.experience for bullet in item.responsibilities]

    for index, bullet in enumerate(source_bullets[:8]):
        clean = bullet.strip(" -*•.")
        verb = _pick_action_verb(clean, index)
        if not clean.lower().startswith(tuple(v.lower() for v in ACTION_VERBS)):
            clean = f"{verb} {clean[0].lower() + clean[1:] if clean else clean}"

        supported_terms = [
            term for term in jd_terms if normalize_skill(term) in {normalize_skill(t) for t in extract_known_terms(clean)}
        ]
        if supported_terms and not any(term.lower() in clean.lower() for term in supported_terms[:2]):
            clean = f"{clean} using {', '.join(supported_terms[:2])}"

        if not re.search(r"\d|%|x\b|hours|days|defects|coverage|latency|cost", clean, re.I):
            clean = f"{clean}; add a truthful metric such as volume, coverage, time saved, or defect reduction if available"

        enhanced.append(clean.rstrip(".") + ".")

    return enhanced


def _render_markdown(
    resume: ParsedResume,
    jd: ParsedJobDescription,
    summary: str,
    enhanced_bullets: List[str],
    missing_keywords: List[str],
) -> str:
    lines: List[str] = []
    lines.append(f"# {resume.name or 'Candidate Name'}")
    contact = " | ".join(value for value in [resume.email, resume.phone] if value)
    if contact:
        lines.append(contact)
    lines.append("")
    lines.append("## Summary")
    lines.append(summary)
    lines.append("")
    lines.append("## Skills")
    skills = resume.skills or _matched_skills(resume, jd)
    lines.append(", ".join(skills) if skills else "Add truthful role-relevant skills here.")

    if resume.experience or enhanced_bullets:
        lines.append("")
        lines.append("## Experience")
        for item in resume.experience:
            heading = " - ".join(part for part in [item.role, item.company, item.duration] if part)
            if heading:
                lines.append(f"### {heading}")
            bullets = enhanced_bullets[: len(item.responsibilities)] if item.responsibilities else []
            enhanced_bullets = enhanced_bullets[len(item.responsibilities) :]
            for bullet in bullets or item.responsibilities:
                lines.append(f"- {bullet}")

    if resume.projects:
        lines.append("")
        lines.append("## Projects")
        for project in resume.projects:
            lines.append(f"- {project}")

    if resume.education:
        lines.append("")
        lines.append("## Education")
        for education in resume.education:
            lines.append(f"- {education}")

    lines.append("")
    lines.append("## JD Alignment Notes")
    if missing_keywords:
        lines.append(
            "Consider adding these only if truthful and supported by your work: "
            + ", ".join(missing_keywords[:12])
            + "."
        )
    else:
        lines.append("Most important JD keywords are already represented.")
    return "\n".join(lines).strip() + "\n"


def _pick_action_verb(text: str, index: int) -> str:
    lowered = text.lower()
    if "test" in lowered or "qa" in lowered:
        return "Validated"
    if "automat" in lowered:
        return "Automated"
    if "lead" in lowered or "manage" in lowered:
        return "Led"
    return ACTION_VERBS[index % len(ACTION_VERBS)]


def _role_hint(jd_text: str) -> str:
    if re.search(r"\bsdet\b|qa automation|test automation", jd_text, re.I):
        return "QA automation / SDET"
    if re.search(r"\bfrontend|react\b", jd_text, re.I):
        return "frontend engineering"
    if re.search(r"\bbackend|api|fastapi|node\b", jd_text, re.I):
        return "backend engineering"
    return "target-role"
