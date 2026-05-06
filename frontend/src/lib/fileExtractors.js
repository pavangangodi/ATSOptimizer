const TEXT_TYPES = new Set(['text/plain', 'text/markdown']);

export async function extractResumeFileText(file) {
  if (!file) return '';

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (TEXT_TYPES.has(file.type) || extension === 'txt' || extension === 'md') {
    return file.text();
  }

  if (extension === 'docx') {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule.default || mammothModule;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  if (extension === 'pdf') {
    return extractPdfText(await file.arrayBuffer());
  }

  return '';
}

async function extractPdfText(arrayBuffer) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  const document = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }

  return pages.join('\n\n').trim();
}
