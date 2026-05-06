import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

export async function downloadResumeDocx(markdown, filename = 'optimized_resume.docx') {
  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Aptos',
            size: 22,
            color: '111827',
          },
          paragraph: {
            spacing: { after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: markdownToParagraphs(markdown),
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  downloadBlob(blob, filename);
}

function markdownToParagraphs(markdown) {
  const lines = String(markdown || '').split('\n');
  const paragraphs = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      return;
    }

    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ''),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
      );
      return;
    }

    if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^##\s+/, '').toUpperCase(),
              bold: true,
              color: '3730A3',
              size: 23,
            }),
          ],
          spacing: { before: 180, after: 80 },
        }),
      );
      return;
    }

    if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/^###\s+/, ''), bold: true, size: 22 })],
          spacing: { before: 120, after: 60 },
        }),
      );
      return;
    }

    if (line.startsWith('- ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(line.replace(/^-\s+/, ''))],
          bullet: { level: 0 },
          spacing: { after: 60 },
        }),
      );
      return;
    }

    paragraphs.push(
      new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 90 },
      }),
    );
  });

  return paragraphs;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
