import { UploadCloud } from 'lucide-react';

export default function FileDrop({ file, onChange }) {
  return (
    <label className="uploadDrop">
      <input
        type="file"
        accept=".pdf,.docx,.txt,.md"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <span className="uploadIcon" aria-hidden="true">
        <UploadCloud size={21} />
      </span>
      <span>
        <strong>{file ? file.name : 'Upload resume file'}</strong>
        <small>PDF, DOCX, TXT, or MD</small>
      </span>
    </label>
  );
}
