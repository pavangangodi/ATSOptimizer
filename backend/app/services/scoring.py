from __future__ import annotations

from statistics import mean
from typing import List

from app.models import GapReport, KeywordCategory, ParsedJobDescription, ParsedResume, ScoreBreakdown
from app.services.nlp import display_skill, extract_known_terms, match_strength, normalize_skill, similarity, split_sentences


KEYWORD_WEIGHT = 40
SKILL_WEIGHT = 30
EXPERIENCE_WEIGHT = 20
FORMATTING_WEIGHT = 10


def calculate_score(resume: ParsedResume, jd: ParsedJobDescription) -> tuple[int, ScoreBreakdown, GapReport]:
    resume_terms = resume.skills + extract_known_terms(resume.raw_text)
    must_keywords = jd.keywords.get(KeywordCategory.MUST_HAVE, [])
    good_keywords = jd.keywords.get(KeywordCategory.GOOD_TO_HAVE, [])
    all_keywords = _dedupe(must_keywords + good_keywords)

    keyword_score = _weighted_term_score(all_keywords, resume_terms, resume.raw_text, KEYWORD_WEIGHT)
    skill_targets = _dedupe(jd.required_skills + jd.preferred_skills)
    skill_score = _weighted_term_score(skill_targets, resume.skills, resume.raw_text, SKILL_WEIGHT)
    experience_score = _experience_score(resume, jd)
    formatting_score = _formatting_score(resume)

    breakdown = ScoreBreakdown(
        keywords=round(keyword_score, 1),
        skills=round(skill_score, 1),
        experience=round(experience_score, 1),
        formatting=round(formatting_score, 1),
    )
    total = int(round(keyword_score + skill_score + experience_score + formatting_score))
    gap_report = _build_gap_report(resume, jd, total)
    return min(total, 100), breakdown, gap_report


def _weighted_term_score(targets: List[str], resume_terms: List[str], resume_text: str, max_score: int) -> float:
    if not targets:
        return max_score
    strengths = [match_strength(target, resume_terms, resume_text) for target in targets]
    return (sum(strengths) / len(targets)) * max_score


def _experience_score(resume: ParsedResume, jd: ParsedJobDescription) -> float:
    jd_sentences = split_sentences(jd.raw_text)
    resume_bullets = [bullet for item in resume.experience for bullet in item.responsibilities]
    if not jd_sentences or not resume_bullets:
        return 0.0

    best_scores = []
    for jd_sentence in jd_sentences[:12]:
        best_scores.append(max(similarity(jd_sentence, bullet) for bullet in resume_bullets))

    semantic_score = mean(best_scores) if best_scores else 0
    return min(EXPERIENCE_WEIGHT, semantic_score * EXPERIENCE_WEIGHT * 1.5)


def _formatting_score(resume: ParsedResume) -> float:
    score = FORMATTING_WEIGHT
    score -= min(len(resume.formatting_warnings) * 2, 6)
    if not resume.email:
        score -= 1
    if not resume.skills:
        score -= 2
    if not resume.experience:
        score -= 2
    return max(0.0, score)


def _build_gap_report(resume: ParsedResume, jd: ParsedJobDescription, score: int) -> GapReport:
    resume_terms = resume.skills + extract_known_terms(resume.raw_text)
    must_keywords = jd.keywords.get(KeywordCategory.MUST_HAVE, [])
    good_keywords = jd.keywords.get(KeywordCategory.GOOD_TO_HAVE, [])
    all_keywords = _dedupe(must_keywords + good_keywords)
    missing_keywords = [
        display_skill(term)
        for term in all_keywords
        if match_strength(term, resume_terms, resume.raw_text) == 0
    ]
    missing_tools = [
        display_skill(skill)
        for skill in jd.required_skills
        if match_strength(skill, resume.skills, resume.raw_text) == 0
    ]
    weak_areas = _weak_experience_areas(resume, jd)
    suggestions = _suggestions(missing_keywords, missing_tools, weak_areas, resume)

    return GapReport(
        missing_keywords=_dedupe(missing_keywords),
        missing_tools_technologies=_dedupe(missing_tools),
        weak_experience_areas=weak_areas,
        suggestions=suggestions,
        simple_explanation=_simple_explanation(score, missing_keywords, weak_areas, resume),
    )


def _weak_experience_areas(resume: ParsedResume, jd: ParsedJobDescription) -> List[str]:
    resume_bullets = [bullet for item in resume.experience for bullet in item.responsibilities]
    weak: List[str] = []
    for sentence in split_sentences(jd.raw_text)[:10]:
        if len(sentence.split()) < 5:
            continue
        best = max((similarity(sentence, bullet) for bullet in resume_bullets), default=0)
        if best < 0.22 and any(word in sentence.lower() for word in ("build", "test", "automate", "develop", "manage", "design", "api", "framework")):
            weak.append(sentence[:160])
    return weak[:5]


def _suggestions(missing_keywords: List[str], missing_tools: List[str], weak_areas: List[str], resume: ParsedResume) -> List[str]:
    suggestions: List[str] = []
    if missing_tools:
        suggestions.append(
            "Add missing tools only where they are truthful. If you have used them, place them in Skills and in a relevant experience bullet."
        )
    if missing_keywords:
        suggestions.append(
            "Mirror important JD language naturally in the summary and bullets, but avoid stuffing a list of unrelated keywords."
        )
    if weak_areas:
        suggestions.append(
            "Strengthen experience bullets by adding action, scope, tool, and measurable result for the closest matching work."
        )
    if resume.formatting_warnings:
        suggestions.append("Use standard headings, short bullets, and avoid table-style layouts for ATS readability.")
    if not suggestions:
        suggestions.append("The resume already covers most JD signals. Tune the summary and top bullets for role-specific wording.")
    return suggestions


def _simple_explanation(score: int, missing_keywords: List[str], weak_areas: List[str], resume: ParsedResume) -> str:
    if score >= 80:
        return "The score is strong because the resume contains most of the JD skills and enough relevant experience evidence."
    reasons = []
    if missing_keywords:
        reasons.append(f"it is missing {len(missing_keywords)} important JD terms")
    if weak_areas:
        reasons.append("some required responsibilities are not clearly proven in the experience section")
    if resume.formatting_warnings:
        reasons.append("formatting may make the resume harder for an ATS to read")
    if not reasons:
        reasons.append("the wording is not close enough to the JD")
    return "The score is low because " + ", and ".join(reasons) + "."


def _dedupe(values: List[str]) -> List[str]:
    seen = set()
    output = []
    for value in values:
        key = normalize_skill(value)
        if key and key not in seen:
            seen.add(key)
            output.append(display_skill(key))
    return output
