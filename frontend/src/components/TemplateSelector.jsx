import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Sparkles } from 'lucide-react';

export default function TemplateSelector({ templates, selectedTemplateId, onSelect, onUseExample }) {
  return (
    <section className="templateSelector revealItem" aria-label="ATS resume templates">
      <div className="sectionHeaderRow">
        <div>
          <p className="sectionKicker">ATS templates</p>
          <h2>Choose a resume format before generating.</h2>
        </div>
        <span className="softPill">Recruiter readable</span>
      </div>

      <div className="templateGrid">
        {templates.map((template, index) => {
          const selected = template.id === selectedTemplateId;
          return (
            <motion.button
              type="button"
              className={`templateCard ${selected ? 'is-selected' : ''}`}
              key={template.id}
              onClick={() => onSelect(template.id)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.35, delay: index * 0.07 }}
              whileHover={{ y: -5, scale: 1.01 }}
            >
              <span className="templateAccent" style={{ background: template.accent }} />
              <span className="templateTopline">
                <FileText size={16} />
                {template.density}
              </span>
              <strong>{template.name}</strong>
              <small>{template.description}</small>
              <span className="templateSections">{template.sections.slice(0, 4).join(' / ')}</span>
              <span className="templateSelected">{selected ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="templateActions">
        <button type="button" className="linkButton" onClick={onUseExample}>
          Load example resume for selected template
        </button>
      </div>
    </section>
  );
}
