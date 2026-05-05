from __future__ import annotations

import re
from difflib import SequenceMatcher
from functools import lru_cache
from typing import Iterable, List, Sequence, Set


CANONICAL_SKILLS = {
    "api testing",
    "aws",
    "azure",
    "c#",
    "ci/cd",
    "cypress",
    "docker",
    "fastapi",
    "git",
    "github actions",
    "java",
    "javascript",
    "jenkins",
    "jira",
    "kubernetes",
    "manual testing",
    "mongodb",
    "node.js",
    "playwright",
    "postgresql",
    "python",
    "qa automation",
    "react",
    "rest api",
    "selenium",
    "sql",
    "testng",
    "typescript",
}

ALIASES = {
    "js": "javascript",
    "node": "node.js",
    "nodejs": "node.js",
    "ts": "typescript",
    "postgres": "postgresql",
    "postgre": "postgresql",
    "rest": "rest api",
    "restful api": "rest api",
    "api": "rest api",
    "gh actions": "github actions",
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    "k8s": "kubernetes",
    "py": "python",
    "selenium webdriver": "selenium",
    "automation testing": "qa automation",
    "test automation": "qa automation",
}

DOMAIN_KEYWORDS = {
    "agile",
    "ats",
    "bdd",
    "cross browser",
    "defect tracking",
    "e2e",
    "etl",
    "functional testing",
    "microservices",
    "performance testing",
    "regression testing",
    "scrum",
    "smoke testing",
    "test plan",
    "test strategy",
    "ui automation",
}

SECTION_HEADERS = {
    "summary",
    "profile",
    "skills",
    "technical skills",
    "experience",
    "work experience",
    "professional experience",
    "education",
    "projects",
    "certifications",
}


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_token(value: str) -> str:
    value = value.lower().strip()
    value = value.replace("–", "-").replace("—", "-")
    value = re.sub(r"[^a-z0-9+#./ -]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return ALIASES.get(value, value)


def normalize_skill(value: str) -> str:
    normalized = normalize_token(value)
    return ALIASES.get(normalized, normalized)


def display_skill(value: str) -> str:
    special = {
        "api testing": "API Testing",
        "aws": "AWS",
        "azure": "Azure",
        "c#": "C#",
        "ci/cd": "CI/CD",
        "e2e": "E2E",
        "fastapi": "FastAPI",
        "github actions": "GitHub Actions",
        "javascript": "JavaScript",
        "jira": "Jira",
        "mongodb": "MongoDB",
        "node.js": "Node.js",
        "playwright": "Playwright",
        "postgresql": "PostgreSQL",
        "qa automation": "QA Automation",
        "react": "React",
        "rest api": "REST API",
        "sql": "SQL",
        "testng": "TestNG",
        "typescript": "TypeScript",
    }
    normalized = normalize_skill(value)
    return special.get(normalized, normalized.title())


def extract_known_terms(text: str, vocabulary: Iterable[str] | None = None) -> List[str]:
    normalized_text = f" {normalize_token(text)} "
    terms = set(vocabulary or (CANONICAL_SKILLS | DOMAIN_KEYWORDS))
    found: Set[str] = set()

    for term in terms:
        normalized = normalize_skill(term)
        aliases = [alias for alias, canonical in ALIASES.items() if canonical == normalized]
        candidates = {normalized, term, *aliases}
        for candidate in candidates:
            candidate_norm = normalize_token(candidate)
            pattern = rf"(?<![a-z0-9+#.]){re.escape(candidate_norm)}(?![a-z0-9+#.])"
            if re.search(pattern, normalized_text):
                found.add(normalized)
                break

    return sorted(display_skill(term) for term in found)


def split_lines(text: str) -> List[str]:
    return [line.strip(" \t\r-*•") for line in text.splitlines() if line.strip()]


def split_sentences(text: str) -> List[str]:
    chunks = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [chunk.strip(" -*•\t") for chunk in chunks if len(chunk.strip()) > 2]


def similarity(left: str, right: str) -> float:
    left_tokens = set(re.findall(r"[a-z0-9+#.]+", normalize_token(left)))
    right_tokens = set(re.findall(r"[a-z0-9+#.]+", normalize_token(right)))
    if not left_tokens or not right_tokens:
        return 0.0
    jaccard = len(left_tokens & right_tokens) / len(left_tokens | right_tokens)
    sequence = SequenceMatcher(None, normalize_token(left), normalize_token(right)).ratio()
    return max(jaccard, sequence * 0.65)


def match_strength(term: str, haystack_terms: Sequence[str], haystack_text: str = "") -> float:
    normalized_term = normalize_skill(term)
    normalized_haystack = {normalize_skill(item) for item in haystack_terms}
    if normalized_term in normalized_haystack:
        return 1.0

    normalized_text = normalize_token(haystack_text)
    if normalized_term and normalized_term in normalized_text:
        return 1.0

    related_terms = {
        "api testing": {"rest api"},
        "defect tracking": {"jira"},
        "ui automation": {"playwright", "selenium", "cypress"},
        "regression testing": {"qa automation", "playwright", "selenium"},
    }
    if related_terms.get(normalized_term, set()) & normalized_haystack:
        return 0.5

    term_tokens = set(re.findall(r"[a-z0-9+#.]+", normalized_term))
    text_tokens = set(re.findall(r"[a-z0-9+#.]+", normalized_text))
    if term_tokens and len(term_tokens & text_tokens) / len(term_tokens) >= 0.5:
        return 0.5

    best = 0.0
    for candidate in normalized_haystack:
        best = max(best, similarity(normalized_term, candidate))
    return 0.5 if best >= 0.72 else 0.0


@lru_cache(maxsize=1)
def load_spacy_model():
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except Exception:
        return None
