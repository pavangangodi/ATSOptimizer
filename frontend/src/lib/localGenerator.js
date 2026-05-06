const KNOWN_TERMS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Vite',
  'Node.js',
  'Express',
  'Python',
  'FastAPI',
  'Django',
  'Java',
  'Spring',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'AWS',
  'Azure',
  'Docker',
  'Kubernetes',
  'Git',
  'CI/CD',
  'REST API',
  'GraphQL',
  'HTML',
  'CSS',
  'Tailwind CSS',
  'Playwright',
  'Selenium',
  'Cypress',
  'Postman',
  'API Testing',
  'Automation Testing',
  'Regression Testing',
  'Smoke Testing',
  'Agile',
  'Scrum',
  'Jira',
  'Defect Tracking',
  'Test Strategy',
  'Manual Testing',
  'Accessibility',
  'Performance',
];

const SECTION_ALIASES = {
  linear: {
    summary: 'Summary',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    certifications: 'Certifications',
    education: 'Education',
  },
  executive: {
    summary: 'Executive Summary',
    skills: 'Core Strengths',
    experience: 'Leadership Experience',
    projects: 'Selected Projects',
    certifications: 'Certifications',
    education: 'Education',
  },
  compact: {
    summary: 'Profile',
    skills: 'Technical Skills',
    experience: 'Experience',
    projects: 'Projects',
    certifications: 'Certifications',
    education: 'Education',
  },
};

const headingPattern =
  /^(summary|profile|skills|technical skills|core skills|experience|work experience|professional experience|projects|certifications|education|contact)\s*$/i;

export function generateLocalAnalysis({ resumeText, jobDescription, template }) {
  const parsedResume = parseResumeSnapshot(resumeText);
  const parsedJobDescription = parseJobSnapshot(jobDescription);
  const gapReport = buildGapReport(parsedResume, parsedJobDescription);
  const breakdown = buildBreakdown(parsedResume, parsedJobDescription, gapReport);
  const score = Math.min(100, Math.round(breakdown.keywords + breakdown.skills + breakdown.experience + breakdown.formatting));
  const summary = buildSummary(parsedResume, parsedJobDescription);
  const enhancedBullets = enhanceBullets(parsedResume, parsedJobDescription);
  const markdown = renderTemplatedResume({
    parsedResume,
    parsedJobDescription,
    gapReport,
    template,
    summary,
    enhancedBullets,
  });

  return {
    score,
    breakdown,
    parsed_resume: parsedResume,
    parsed_job_description: parsedJobDescription,
    gap_report: {
      ...gapReport,
      simple_explanation: explainScore(score, gapReport),
    },
    optimized_resume: {
      markdown,
      improved_summary: summary,
      enhanced_bullets: enhancedBullets,
      truthfulness_notes: [
        'Generated from the resume evidence currently provided by the user.',
        'Add missing keywords only when they are truthful and supported by real work.',
      ],
    },
    generation_source: 'browser',
  };
}

export function applyTemplateToAnalysis(result, template) {
  const parsedResume = result.parsed_resume;
  const parsedJobDescription = result.parsed_job_description;
  const gapReport = result.gap_report;
  const summary = result.optimized_resume?.improved_summary || buildSummary(parsedResume, parsedJobDescription);
  const enhancedBullets = result.optimized_resume?.enhanced_bullets || enhanceBullets(parsedResume, parsedJobDescription);

  return {
    ...result,
    optimized_resume: {
      ...result.optimized_resume,
      markdown: renderTemplatedResume({
        parsedResume,
        parsedJobDescription,
        gapReport,
        template,
        summary,
        enhancedBullets,
      }),
    },
  };
}

function parseResumeSnapshot(text) {
  const cleaned = cleanText(text);
  const lines = splitLines(cleaned);
  const sections = sectionize(lines);
  const skillsText = [
    ...(sections.skills || []),
    ...(sections['technical skills'] || []),
    ...(sections['core skills'] || []),
  ].join('\n');

  return {
    raw_text: cleaned,
    name: extractName(lines),
    email: cleaned.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || '',
    phone: cleaned.match(/(?:\+?\d[\d\s().-]{8,}\d)/)?.[0]?.trim() || '',
    skills: dedupe(extractTerms(skillsText || cleaned)),
    experience: parseExperience(sections, cleaned),
    education: sections.education || [],
    projects: sections.projects || [],
    certifications: sections.certifications || [],
    formatting_warnings: buildFormattingWarnings(cleaned, lines),
  };
}

function parseJobSnapshot(text) {
  const cleaned = cleanText(text);
  const terms = dedupe(extractTerms(cleaned));
  const required = terms.filter((term) => new RegExp(`required|must|responsibilit|qualification|${escapeRegExp(term)}`, 'i').test(cleaned));

  return {
    raw_text: cleaned,
    required_skills: required.length ? required : terms.slice(0, 10),
    preferred_skills: terms.filter((term) => !required.includes(term)).slice(0, 8),
    experience_level: cleaned.match(/(\d+)\+?\s*(?:years|yrs)/i)?.[0] || 'Not specified',
    keywords: {
      MUST_HAVE: required.length ? required : terms.slice(0, 10),
      GOOD_TO_HAVE: terms.filter((term) => !required.includes(term)).slice(0, 8),
    },
  };
}

function buildGapReport(parsedResume, parsedJobDescription) {
  const resumeTerms = dedupe([...parsedResume.skills, ...extractTerms(parsedResume.raw_text)]);
  const targets = dedupe([...parsedJobDescription.required_skills, ...parsedJobDescription.preferred_skills]);
  const missingKeywords = targets.filter((term) => !containsNormalized(resumeTerms, term));
  const weakExperienceAreas =
    parsedResume.experience.length > 0
      ? []
      : ['Add a standard Experience section with role, company, dates, and measurable bullets.'];

  const suggestions = [];
  if (missingKeywords.length) {
    suggestions.push('Mirror the most important JD language naturally in the summary and strongest bullets.');
  }
  if (weakExperienceAreas.length) {
    suggestions.push('Use action, tool, scope, and result in each experience bullet for stronger ATS evidence.');
  }
  if (parsedResume.formatting_warnings.length) {
    suggestions.push('Keep headings standard and avoid table-style formatting for ATS readability.');
  }
  if (!suggestions.length) {
    suggestions.push('The resume already covers strong role signals. Tune the top summary for this exact job.');
  }

  return {
    missing_keywords: missingKeywords.slice(0, 14),
    missing_tools_technologies: missingKeywords.slice(0, 8),
    weak_experience_areas: weakExperienceAreas,
    suggestions,
    simple_explanation: '',
  };
}

function buildBreakdown(parsedResume, parsedJobDescription, gapReport) {
  const targetCount = Math.max(1, parsedJobDescription.required_skills.length + parsedJobDescription.preferred_skills.length);
  const matchedCount = Math.max(0, targetCount - gapReport.missing_keywords.length);
  const keywordRatio = Math.min(1, matchedCount / targetCount);
  const skillScore = Math.min(30, parsedResume.skills.length * 3.5 + keywordRatio * 12);
  const experienceScore = parsedResume.experience.length ? Math.min(20, 8 + parsedResume.experience.length * 4) : 4;
  const formattingPenalty = Math.min(6, parsedResume.formatting_warnings.length * 2);

  return {
    keywords: round(keywordRatio * 40),
    skills: round(skillScore),
    experience: round(experienceScore),
    formatting: round(10 - formattingPenalty),
  };
}

function buildSummary(parsedResume, parsedJobDescription) {
  const role = inferRole(parsedResume.raw_text, parsedJobDescription.raw_text);
  const skills = dedupe([...parsedResume.skills, ...parsedJobDescription.required_skills]).slice(0, 6);
  const namePrefix = parsedResume.name ? `${parsedResume.name} is a ` : 'Resume profile: ';
  return `${namePrefix}${role} candidate with evidence in ${skills.join(', ') || 'role-relevant delivery'}. Focused on clear, ATS-readable accomplishments aligned to the target job description.`;
}

function enhanceBullets(parsedResume, parsedJobDescription) {
  const jdTerms = parsedJobDescription.required_skills.slice(0, 4);
  const bullets = parsedResume.experience.flatMap((item) => item.responsibilities).slice(0, 8);

  return bullets.map((bullet, index) => {
    const clean = bullet.replace(/^[-*]\s*/, '').replace(/\.$/, '').trim();
    const startsWithVerb = /^(built|improved|automated|delivered|validated|designed|led|created|managed|developed)/i.test(clean);
    const action = startsWithVerb ? clean : `${pickActionVerb(clean, index)} ${lowerFirst(clean)}`;
    const metricHint = /\d|%|hours|days|coverage|defect|cost|reduced|increased/i.test(action)
      ? ''
      : '; add a truthful metric if available';
    const supportedTerms = jdTerms.filter((term) => new RegExp(escapeRegExp(term), 'i').test(clean));
    const termHint = supportedTerms.length ? '' : '';
    return `${action}${termHint}${metricHint}.`;
  });
}

function renderTemplatedResume({ parsedResume, gapReport, template, summary, enhancedBullets }) {
  const labels = SECTION_ALIASES[template.id] || SECTION_ALIASES.linear;
  const contact = [parsedResume.email, parsedResume.phone].filter(Boolean).join(' | ');
  const lines = [`# ${parsedResume.name || 'Candidate Name'}`];

  if (contact) lines.push(contact);
  lines.push('', `## ${labels.summary}`, summary);

  lines.push('', `## ${labels.skills}`);
  lines.push(parsedResume.skills.length ? parsedResume.skills.join(', ') : 'Add truthful role-relevant skills here.');

  lines.push('', `## ${labels.experience}`);
  if (parsedResume.experience.length) {
    let bulletCursor = 0;
    parsedResume.experience.forEach((item) => {
      const heading = [item.role, item.company, item.duration].filter(Boolean).join(' - ');
      if (heading) lines.push(`### ${heading}`);
      const bullets = enhancedBullets.slice(bulletCursor, bulletCursor + Math.max(1, item.responsibilities.length));
      bulletCursor += item.responsibilities.length;
      (bullets.length ? bullets : item.responsibilities).forEach((bullet) => lines.push(`- ${bullet}`));
    });
  } else {
    lines.push('- Add your role, company, dates, and truthful accomplishment bullets here.');
  }

  if (parsedResume.projects?.length) {
    lines.push('', `## ${labels.projects}`);
    parsedResume.projects.forEach((project) => lines.push(`- ${project.replace(/^[-*]\s*/, '')}`));
  }

  if (parsedResume.certifications?.length) {
    lines.push('', `## ${labels.certifications}`);
    parsedResume.certifications.forEach((certification) => lines.push(`- ${certification.replace(/^[-*]\s*/, '')}`));
  }

  if (parsedResume.education?.length) {
    lines.push('', `## ${labels.education}`);
    parsedResume.education.forEach((education) => lines.push(`- ${education.replace(/^[-*]\s*/, '')}`));
  }

  lines.push('', '## JD Alignment Notes');
  if (gapReport.missing_keywords.length) {
    lines.push(`Consider adding these only if truthful and supported: ${gapReport.missing_keywords.slice(0, 10).join(', ')}.`);
  } else {
    lines.push('Most important JD keywords are already represented.');
  }

  return lines.join('\n').trim() + '\n';
}

function parseExperience(sections, fullText) {
  const lines =
    sections.experience ||
    sections['work experience'] ||
    sections['professional experience'] ||
    splitLines(fullText).filter((line) => /(engineer|developer|tester|analyst|manager|lead|architect|intern|qa|sdet)/i.test(line));

  const items = [];
  let current = { role: '', company: '', duration: '', responsibilities: [] };

  lines.forEach((line) => {
    const isHeading =
      /(engineer|developer|tester|analyst|manager|lead|architect|intern|qa|sdet)/i.test(line) &&
      !/^[-*]/.test(line) &&
      line.split(/\s+/).length <= 16;

    if (isHeading) {
      if (current.role || current.responsibilities.length) items.push(current);
      current = parseExperienceHeading(line);
      return;
    }

    if (line) current.responsibilities.push(line.replace(/^[-*]\s*/, ''));
  });

  if (current.role || current.responsibilities.length) items.push(current);
  return items.slice(0, 8);
}

function parseExperienceHeading(line) {
  const duration = line.match(/(?:20\d{2}|19\d{2})\s*[-–]\s*(?:present|current|20\d{2})/i)?.[0] || '';
  const withoutDuration = line.replace(duration, '').replace(/\s+[|–-]\s*$/, '').trim();
  const [role, company = ''] = withoutDuration.split(/\s+at\s+|\s+[|–-]\s+/, 2);
  return { role: role.trim(), company: company.trim(), duration, responsibilities: [] };
}

function sectionize(lines) {
  const sections = {};
  let current = 'header';
  sections[current] = [];

  lines.forEach((line) => {
    if (headingPattern.test(line)) {
      current = line.toLowerCase();
      sections[current] = sections[current] || [];
      return;
    }
    sections[current] = sections[current] || [];
    sections[current].push(line);
  });

  return sections;
}

function extractName(lines) {
  return (
    lines.find((line) => {
      if (headingPattern.test(line) || line.includes('@') || /\d{3,}/.test(line)) return false;
      const words = line.split(/\s+/);
      return words.length >= 2 && words.length <= 5;
    }) || ''
  );
}

function extractTerms(text) {
  const terms = KNOWN_TERMS.filter((term) => new RegExp(`\\b${escapeRegExp(term).replace(/\\ /g, '\\s+')}\\b`, 'i').test(text));
  return dedupe(terms);
}

function buildFormattingWarnings(text, lines) {
  const warnings = [];
  if (text.length < 400) warnings.push('Resume text is very short; ATS systems may not have enough evidence.');
  if (!lines.some((line) => headingPattern.test(line))) warnings.push('Standard section headings were not detected.');
  if (lines.some((line) => line.length > 180)) warnings.push('Some lines are very long; shorter bullets are easier to scan.');
  if (/\t{2,}|\|{2,}/.test(text)) warnings.push('Possible table-like formatting detected; ATS-friendly resumes should avoid tables.');
  return warnings;
}

function inferRole(resumeText, jdText) {
  const joined = `${resumeText}\n${jdText}`;
  if (/sdet|qa automation|test automation|playwright|selenium/i.test(joined)) return 'QA automation / SDET';
  if (/frontend|react|ui developer/i.test(joined)) return 'frontend engineering';
  if (/backend|api|fastapi|node|django/i.test(joined)) return 'backend engineering';
  if (/manager|lead|strategy/i.test(joined)) return 'delivery leadership';
  return 'target-role';
}

function explainScore(score, gapReport) {
  if (score >= 80) return 'The score is strong because the resume covers most target skills and readable experience evidence.';
  if (gapReport.missing_keywords.length) return `The score can improve by adding truthful evidence for ${gapReport.missing_keywords.length} missing JD signals.`;
  return 'The score can improve with stronger role-specific bullets and clearer section structure.';
}

function containsNormalized(values, target) {
  const targetKey = normalize(target);
  return values.some((value) => normalize(value) === targetKey);
}

function dedupe(values) {
  const seen = new Set();
  const output = [];
  values.forEach((value) => {
    const label = String(value).trim();
    const key = normalize(label);
    if (key && !seen.has(key)) {
      seen.add(key);
      output.push(label);
    }
  });
  return output;
}

function cleanText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[•●]/g, '-')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function splitLines(text) {
  return cleanText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, '');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function round(value) {
  return Math.max(0, Math.round(value * 10) / 10);
}

function lowerFirst(value) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

function pickActionVerb(text, index) {
  if (/test|qa|defect|quality/i.test(text)) return 'Validated';
  if (/automat/i.test(text)) return 'Automated';
  if (/lead|manage|mentor/i.test(text)) return 'Led';
  return ['Built', 'Improved', 'Delivered', 'Designed'][index % 4];
}
