export default function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  minRows = 'default',
}) {
  return (
    <label className="fieldGroup" htmlFor={id}>
      <span>{label}</span>
      <textarea
        id={id}
        className={`textArea textArea--${minRows}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
