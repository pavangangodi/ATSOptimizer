const icons = ['React', 'ATS', 'DOCX', 'API', 'PDF', 'GSAP', 'Motion', 'Lenis'];

export default function FloatingTechStack() {
  return (
    <div className="floatingTech" aria-hidden="true">
      {icons.map((icon, index) => (
        <span key={icon} style={{ '--float-index': index }}>
          {icon}
        </span>
      ))}
    </div>
  );
}
