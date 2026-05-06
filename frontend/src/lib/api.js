const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
const API_TIMEOUT_MS = 3500;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Backend request timed out');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadSample() {
  const response = await fetchWithTimeout(`${API_BASE}/api/sample`);
  if (!response.ok) throw new Error('Could not load sample data');
  return response.json();
}

export async function analyzeResume({ resumeText, jobDescription, file }) {
  let response;

  if (file) {
    const form = new FormData();
    form.append('resume_file', file);
    form.append('job_description', jobDescription);
    if (resumeText) form.append('resume_text', resumeText);
    response = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
      method: 'POST',
      body: form,
    });
  } else {
    response = await fetchWithTimeout(`${API_BASE}/api/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
    });
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Analysis failed');
  }
  return response.json();
}

export async function downloadDocx(markdown) {
  const response = await fetchWithTimeout(`${API_BASE}/api/export-docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, filename: 'optimized_resume.docx' }),
  });
  if (!response.ok) throw new Error('DOCX export failed');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'optimized_resume.docx';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
