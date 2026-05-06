import { Loader2, UploadCloud } from 'lucide-react';

export default function FileDrop({ file, onChange, loading = false }) {
  return (
    <label className="uploadDrop">
      <input
        type="file"
        accept=".pdf,.docx,.txt,.md"
        disabled={loading}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <span className="uploadIcon" aria-hidden="true">
        {loading ? <Loader2 className="spin" size={21} /> : <UploadCloud size={21} />}
      </span>
      <span>
        <strong>{loading ? 'Extracting resume text...' : file ? file.name : 'Upload resume file'}</strong>
        <small>PDF, DOCX, TXT, or MD</small>
      </span>
    </label>
  );
}
