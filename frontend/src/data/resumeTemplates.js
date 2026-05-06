export const atsTemplates = [
  {
    id: 'linear',
    name: 'Linear ATS',
    tagline: 'Crisp SaaS profile',
    description: 'Best for product, QA, frontend, and automation roles.',
    accent: '#6366f1',
    density: 'Balanced',
    sections: ['Summary', 'Skills', 'Experience', 'Projects', 'Certifications', 'Education'],
    example: {
      name: 'Aarav Mehta',
      title: 'QA Automation Engineer',
      email: 'aarav.mehta@example.com',
      phone: '+91 90000 12000',
      location: 'Bengaluru, India',
      summary:
        'QA Automation Engineer with hands-on experience building Playwright and Selenium test suites for web applications, API validation, CI pipelines, and regression coverage.',
      skills: [
        'Playwright',
        'Selenium',
        'JavaScript',
        'API Testing',
        'CI/CD',
        'Regression Testing',
        'Postman',
        'Agile',
      ],
      experience: [
        {
          role: 'QA Automation Engineer',
          company: 'NovaSoft Labs',
          duration: '2023 - Present',
          bullets: [
            'Built Playwright regression suites for checkout and onboarding workflows, reducing manual test effort by 35%.',
            'Validated REST APIs with Postman and JavaScript assertions across smoke, regression, and release cycles.',
            'Integrated automated tests into CI pipelines and shared defect reports with developers during sprint reviews.',
          ],
        },
        {
          role: 'Software Test Engineer',
          company: 'CloudCart Systems',
          duration: '2021 - 2023',
          bullets: [
            'Designed Selenium test cases for cross-browser UI coverage and maintained reusable page object components.',
            'Improved defect documentation with reproducible steps, logs, screenshots, and environment details.',
          ],
        },
      ],
      projects: [
        'Playwright Framework: Modular JavaScript framework with headed Chrome runs, HTML reports, and screenshots for passed tests.',
        'API Health Monitor: Lightweight Postman collection for validating status, auth, and response schemas.',
      ],
      certifications: ['ISTQB Foundation Level', 'Postman API Fundamentals Student Expert'],
      education: ['B.Tech in Computer Science, VTU'],
    },
  },
  {
    id: 'executive',
    name: 'Executive Impact',
    tagline: 'Leadership first',
    description: 'Best for senior engineers, leads, managers, and consultants.',
    accent: '#22d3ee',
    density: 'Spacious',
    sections: ['Executive Summary', 'Core Strengths', 'Leadership Experience', 'Selected Projects', 'Certifications'],
    example: {
      name: 'Maya Rao',
      title: 'Senior Automation Lead',
      email: 'maya.rao@example.com',
      phone: '+91 90000 34000',
      location: 'Hyderabad, India',
      summary:
        'Senior QA Automation Lead with experience owning release quality, scaling test automation strategy, mentoring engineers, and improving delivery confidence for SaaS platforms.',
      skills: [
        'Test Strategy',
        'Playwright',
        'Selenium',
        'API Testing',
        'Team Leadership',
        'CI/CD',
        'Defect Management',
        'Agile Delivery',
      ],
      experience: [
        {
          role: 'Senior Automation Lead',
          company: 'FinEdge Cloud',
          duration: '2022 - Present',
          bullets: [
            'Led automation planning for payment and reporting modules across web, API, and regression test layers.',
            'Mentored a 5-member QA team on Playwright standards, code reviews, flaky test triage, and release readiness.',
            'Partnered with product and engineering leads to improve defect turnaround and sprint-level quality signals.',
          ],
        },
      ],
      projects: [
        'Quality Dashboard: Built release-level automation coverage view using test results, defect trends, and risk tags.',
      ],
      certifications: ['Certified ScrumMaster', 'ISTQB Advanced Test Analyst'],
      education: ['M.Tech in Software Engineering, JNTU'],
    },
  },
  {
    id: 'compact',
    name: 'Compact ATS',
    tagline: 'One-page scanner',
    description: 'Best for high-volume applications and recruiter skim speed.',
    accent: '#a78bfa',
    density: 'Compact',
    sections: ['Profile', 'Technical Skills', 'Experience', 'Projects', 'Education'],
    example: {
      name: 'Rohan Iyer',
      title: 'Frontend Developer',
      email: 'rohan.iyer@example.com',
      phone: '+91 90000 56000',
      location: 'Pune, India',
      summary:
        'Frontend Developer focused on React, responsive interfaces, reusable components, API integration, accessibility, and performance-minded UI delivery.',
      skills: ['React', 'JavaScript', 'HTML', 'CSS', 'Vite', 'REST API', 'Git', 'Accessibility'],
      experience: [
        {
          role: 'Frontend Developer',
          company: 'BrightPixel Studio',
          duration: '2022 - Present',
          bullets: [
            'Built reusable React components for dashboards, forms, and internal workflow tools.',
            'Improved mobile responsiveness and Lighthouse performance across customer-facing pages.',
          ],
        },
      ],
      projects: [
        'Resume Builder UI: Responsive React builder with live preview, stepper flow, and export-ready resume output.',
      ],
      certifications: ['Meta Front-End Developer Certificate'],
      education: ['B.Sc. Computer Science, Pune University'],
    },
  },
];

export const defaultTemplateId = atsTemplates[0].id;

export function getTemplateById(templateId) {
  return atsTemplates.find((template) => template.id === templateId) || atsTemplates[0];
}

export function formatExampleResume(template) {
  const example = template.example;
  const lines = [
    example.name,
    `${example.title} | ${example.email} | ${example.phone} | ${example.location}`,
    '',
    'Summary',
    example.summary,
    '',
    'Skills',
    example.skills.join(', '),
    '',
    'Experience',
  ];

  example.experience.forEach((item) => {
    lines.push(`${item.role} at ${item.company} | ${item.duration}`);
    item.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
  });

  if (example.projects?.length) {
    lines.push('', 'Projects');
    example.projects.forEach((project) => lines.push(`- ${project}`));
  }

  if (example.certifications?.length) {
    lines.push('', 'Certifications');
    example.certifications.forEach((certification) => lines.push(`- ${certification}`));
  }

  if (example.education?.length) {
    lines.push('', 'Education');
    example.education.forEach((education) => lines.push(`- ${education}`));
  }

  return lines.join('\n');
}
