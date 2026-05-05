from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.services.nlp import clean_text


async def extract_text_from_upload(file: UploadFile) -> str:
    suffix = Path(file.filename or "").suffix.lower()
    content = await file.read()

    if suffix in {".txt", ".md", ""}:
        return clean_text(content.decode("utf-8", errors="ignore"))

    if suffix == ".pdf":
        try:
            from io import BytesIO

            from pypdf import PdfReader

            reader = PdfReader(BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
            return clean_text(text)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not parse PDF: {exc}") from exc

    if suffix == ".docx":
        try:
            from io import BytesIO

            from docx import Document

            document = Document(BytesIO(content))
            text = "\n".join(paragraph.text for paragraph in document.paragraphs)
            return clean_text(text)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not parse DOCX: {exc}") from exc

    raise HTTPException(
        status_code=400,
        detail="Unsupported resume file type. Upload PDF, DOCX, TXT, or paste resume text.",
    )
